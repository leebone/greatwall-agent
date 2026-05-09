import Anthropic from '@anthropic-ai/sdk';
import type { Message, ToolResult, AgentConfig } from '../types/index.js';
import { formatToolsForAnthropic, getToolByName } from '../tools/index.js';
import { SessionStore } from '../memory/session-store.js';
import { logger } from '../utils/logger.js';
import { APIError, ToolExecutionError, SessionError, ValidationError } from '../utils/errors.js';

interface ContentBlock {
  type: string;
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, any>;
}

interface APIResponse {
  content: ContentBlock[];
  stop_reason: string;
  [key: string]: any;
}

export class Agent {
  private client: Anthropic;
  private config: AgentConfig;
  private sessionStore: SessionStore;
  private retryAttempts: number = 3;
  private retryDelay: number = 1000;

  constructor(apiKey: string, config: AgentConfig, sessionStore: SessionStore) {
    this.client = new Anthropic({ apiKey });
    this.config = config;
    this.sessionStore = sessionStore;
    logger.debug('Agent initialized', { model: config.model, maxIterations: config.maxIterations });
  }

  async chat(userMessage: string, sessionId?: string): Promise<string> {
    // Validate input
    if (!userMessage || !userMessage.trim()) {
      throw new ValidationError('User message cannot be empty');
    }

    const sid = sessionId || `session_${Date.now()}`;
    let session = await this.sessionStore.getSession(sid);

    if (!session) {
      session = await this.sessionStore.createSession(sid);
      logger.info('Created new session', { sessionId: sid });
    } else {
      logger.info('Resuming session', { sessionId: sid, messageCount: session.messages.length });
    }

    // Add user message to session
    const userMsg: Message = { role: 'user', content: userMessage };
    await this.sessionStore.addMessage(sid, userMsg);

    const messages = [...session.messages, userMsg];
    let iterations = 0;

    while (iterations < this.config.maxIterations) {
      iterations++;
      logger.debug(`Agent iteration ${iterations}/${this.config.maxIterations}`);

      try {
        const response = await this.makeApiCallWithRetry({
          model: this.config.model,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          system: this.config.systemPrompt || this.getDefaultSystemPrompt(),
          messages: messages.map(m => ({
            role: m.role === 'user' || m.role === 'assistant' ? m.role : 'user',
            content: m.content,
          })),
          tools: formatToolsForAnthropic(),
        });

        // Handle the response
        if (response.stop_reason === 'end_turn') {
          const textContent = this.extractTextContent(response.content);

          const assistantMsg: Message = {
            role: 'assistant',
            content: textContent,
          };
          await this.sessionStore.addMessage(sid, assistantMsg);

          logger.info('Chat completed', { iterations, sessionId: sid });
          return textContent;
        }

        if (response.stop_reason === 'tool_use') {
          // Add assistant message with tool calls
          const assistantMsg: Message = {
            role: 'assistant',
            content: JSON.stringify(response.content),
          };
          messages.push(assistantMsg);

          // Execute tools in parallel
          const toolCalls = response.content.filter((c: ContentBlock) => c.type === 'tool_use');
          logger.info(`Executing ${toolCalls.length} tool(s)`);

          const toolResults = await this.executeToolsInParallel(toolCalls, sid);

          // Add tool results to messages
          for (const result of toolResults) {
            messages.push({
              role: 'tool',
              content: result.content,
              toolCallId: result.toolCallId,
            });
          }

          // Continue the loop to get the next response
          continue;
        }

        if (response.stop_reason === 'max_tokens') {
          logger.warn('Response truncated due to max tokens limit');
          const textContent = this.extractTextContent(response.content);

          if (textContent) {
            const assistantMsg: Message = {
              role: 'assistant',
              content: textContent + '\n\n[Response truncated - max tokens reached]',
            };
            await this.sessionStore.addMessage(sid, assistantMsg);
            return assistantMsg.content;
          }
        }

        // If we reach here with an unexpected stop reason
        logger.warn('Unexpected stop reason', { stopReason: response.stop_reason });
        const fallbackText = this.extractTextContent(response.content) || 'No response generated.';

        const assistantMsg: Message = {
          role: 'assistant',
          content: fallbackText,
        };
        await this.sessionStore.addMessage(sid, assistantMsg);

        return fallbackText;
      } catch (error: any) {
        logger.error('Error in agent loop', {
          error: error.message,
          iteration: iterations,
          sessionId: sid,
        });

        // If it's already a custom error, rethrow it
        if (error instanceof APIError || error instanceof ToolExecutionError || error instanceof SessionError) {
          throw error;
        }

        // If it's an API error, wrap it
        if (error.status) {
          throw new APIError(`API Error (${error.status}): ${error.message}`, error.status, error);
        }

        throw new SessionError(`Agent error: ${error.message}`, sid);
      }
    }

    logger.warn('Maximum iterations reached', { sessionId: sid });
    return 'Maximum iterations reached. The task may be too complex. Please try breaking it into smaller steps.';
  }

  /**
   * Extract text content from response content blocks
   */
  private extractTextContent(content: ContentBlock[]): string {
    return content
      .filter((c: ContentBlock) => c.type === 'text')
      .map((c: ContentBlock) => c.text || '')
      .join('\n');
  }

  private async executeToolsInParallel(
    toolCalls: ContentBlock[],
    sessionId: string
  ): Promise<ToolResult[]> {
    const results = await Promise.allSettled(
      toolCalls.map(async (content) => {
        const tool = getToolByName(content.name || '');
        if (!tool) {
          logger.error(`Tool not found: ${content.name}`);
          throw new ToolExecutionError(
            `Tool ${content.name} not found`,
            content.name || 'unknown'
          );
        }

        try {
          logger.debug(`Executing tool: ${content.name}`, { input: content.input });
          const startTime = Date.now();
          const result = await tool.handler(content.input as Record<string, any>);
          const duration = Date.now() - startTime;
          logger.debug(`Tool completed: ${content.name}`, { duration: `${duration}ms` });

          // Store tool usage in session
          await this.sessionStore.addMessage(sessionId, {
            role: 'tool',
            content: result,
            toolCallId: content.id || '',
            toolName: content.name,
          });

          return {
            toolCallId: content.id || '',
            content: result,
          };
        } catch (error: any) {
          logger.error(`Tool execution failed: ${content.name}`, { error: error.message });
          throw new ToolExecutionError(
            error.message,
            content.name || 'unknown',
            content.input
          );
        }
      })
    );

    // Convert Promise.allSettled results to ToolResult[]
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        logger.error(`Tool promise rejected`, { error: result.reason });
        return {
          toolCallId: toolCalls[index].id || '',
          content: JSON.stringify({ error: 'Tool execution failed' }),
        };
      }
    });
  }

  private async makeApiCallWithRetry(params: Anthropic.MessageCreateParams): Promise<APIResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await this.client.messages.create(params);
        return response as APIResponse;
      } catch (error: any) {
        lastError = error;
        logger.warn(`API call failed (attempt ${attempt}/${this.retryAttempts})`, {
          error: error.message,
          status: error.status,
        });

        // Don't retry on client errors (4xx), only on server errors (5xx) and network issues
        if (error.status && error.status >= 400 && error.status < 500) {
          throw new APIError(error.message, error.status, error);
        }

        if (attempt < this.retryAttempts) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          logger.debug(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new APIError(
      lastError?.message || 'API call failed after retries',
      undefined,
      lastError
    );
  }

  private getDefaultSystemPrompt(): string {
    return `You are ${this.config.systemPrompt || 'GreatWall'}, an advanced AI assistant that can help with a wide variety of tasks.

You have access to tools that allow you to:
- Execute bash commands
- Read and write files
- Search the web
- Fetch URLs

When using tools:
1. Think carefully about which tool to use
2. Provide clear and precise parameters
3. Interpret tool results and provide helpful responses to the user
4. If a tool fails, try an alternative approach

Always be helpful, accurate, and concise in your responses.`;
  }
}
