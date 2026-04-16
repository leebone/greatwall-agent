import Anthropic from '@anthropic-ai/sdk';
import type { Config } from '../config/index.js';
import type { Message, ToolCall, ToolResult, AgentConfig } from '../types/index.js';
import { formatToolsForAnthropic, getToolByName } from '../tools/index.js';
import { SessionStore } from '../memory/session-store.js';

export class Agent {
  private client: Anthropic;
  private config: AgentConfig;
  private sessionStore: SessionStore;

  constructor(apiKey: string, config: AgentConfig, sessionStore: SessionStore) {
    this.client = new Anthropic({ apiKey });
    this.config = config;
    this.sessionStore = sessionStore;
  }

  async chat(userMessage: string, sessionId?: string): Promise<string> {
    const sid = sessionId || `session_${Date.now()}`;
    let session = await this.sessionStore.getSession(sid);

    if (!session) {
      session = await this.sessionStore.createSession(sid);
    }

    // Add user message to session
    const userMsg: Message = { role: 'user', content: userMessage };
    await this.sessionStore.addMessage(sid, userMsg);

    const messages = [...session.messages, userMsg];
    let iterations = 0;

    while (iterations < this.config.maxIterations) {
      iterations++;

      try {
        const response = await this.client.messages.create({
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
          const textContent = response.content
            .filter((c: any) => c.type === 'text')
            .map((c: any) => c.text)
            .join('\n');

          const assistantMsg: Message = {
            role: 'assistant',
            content: textContent,
          };
          await this.sessionStore.addMessage(sid, assistantMsg);

          return textContent;
        }

        if (response.stop_reason === 'tool_use') {
          // Add assistant message with tool calls
          const assistantMsg: Message = {
            role: 'assistant',
            content: JSON.stringify(response.content),
          };
          messages.push(assistantMsg);

          // Execute tools
          const toolResults: ToolResult[] = [];

          for (const content of response.content) {
            if (content.type === 'tool_use') {
              const tool = getToolByName(content.name);
              if (tool) {
                console.log(`Executing tool: ${content.name}`);
                const result = await tool.handler(content.input as Record<string, any>);

                toolResults.push({
                  toolCallId: content.id,
                  content: result,
                });

                // Store tool usage in session
                await this.sessionStore.addMessage(sid, {
                  role: 'tool',
                  content: result,
                  toolCallId: content.id,
                  toolName: content.name,
                });
              }
            }
          }

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

        // If we reach here with an unexpected stop reason
        const fallbackText = response.content
          .filter((c: any) => c.type === 'text')
          .map((c: any) => c.text)
          .join('\n') || 'No response generated.';

        const assistantMsg: Message = {
          role: 'assistant',
          content: fallbackText,
        };
        await this.sessionStore.addMessage(sid, assistantMsg);

        return fallbackText;
      } catch (error: any) {
        console.error('Error in agent loop:', error);
        throw new Error(`Agent error: ${error.message}`);
      }
    }

    return 'Maximum iterations reached. Please try a simpler query.';
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

Always be helpful, accurate, and concise in your responses.`;
  }
}
