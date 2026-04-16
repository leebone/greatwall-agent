// Core types for the agent system

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
  toolName?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface ToolResult {
  toolCallId: string;
  content: string;
  isError?: boolean;
}

export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (args: Record<string, any>) => Promise<string>;
}

export interface AgentConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  maxIterations: number;
  systemPrompt?: string;
}

export interface Session {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
  metadata?: Record<string, any>;
}

export interface Memory {
  id: string;
  content: string;
  type: 'skill' | 'fact' | 'conversation';
  createdAt: Date;
  metadata?: Record<string, any>;
}
