/**
 * Custom error classes for GreatWall Agent
 */

export class AgentError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AgentError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ConfigurationError extends AgentError {
  constructor(message: string) {
    super(message, 'CONFIG_ERROR');
    this.name = 'ConfigurationError';
  }
}

export class ToolExecutionError extends AgentError {
  constructor(
    message: string,
    public toolName: string,
    public toolInput?: Record<string, any>
  ) {
    super(message, 'TOOL_ERROR');
    this.name = 'ToolExecutionError';
  }
}

export class APIError extends AgentError {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message, 'API_ERROR');
    this.name = 'APIError';
  }
}

export class SessionError extends AgentError {
  constructor(message: string, public sessionId?: string) {
    super(message, 'SESSION_ERROR');
    this.name = 'SessionError';
  }
}

export class ValidationError extends AgentError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}
