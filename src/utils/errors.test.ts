import { describe, it, expect } from 'vitest';
import {
  AgentError,
  APIError,
  ToolExecutionError,
  SessionError,
  ValidationError,
  ConfigurationError,
} from './errors.js';

describe('Custom Error Classes', () => {
  describe('AgentError', () => {
    it('should create error with message and code', () => {
      const error = new AgentError('Test error', 'TEST_CODE');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('AgentError');
      expect(error).toBeInstanceOf(Error);
    });

    it('should create error without code', () => {
      const error = new AgentError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.code).toBeUndefined();
    });
  });

  describe('ConfigurationError', () => {
    it('should create configuration error', () => {
      const error = new ConfigurationError('Invalid config');
      expect(error.message).toBe('Invalid config');
      expect(error.code).toBe('CONFIG_ERROR');
      expect(error.name).toBe('ConfigurationError');
      expect(error).toBeInstanceOf(AgentError);
    });
  });

  describe('ToolExecutionError', () => {
    it('should create tool execution error with details', () => {
      const error = new ToolExecutionError('Tool failed', 'bash', { command: 'ls' });
      expect(error.message).toBe('Tool failed');
      expect(error.toolName).toBe('bash');
      expect(error.toolInput).toEqual({ command: 'ls' });
      expect(error.code).toBe('TOOL_ERROR');
      expect(error.name).toBe('ToolExecutionError');
    });

    it('should create tool execution error without input', () => {
      const error = new ToolExecutionError('Tool failed', 'bash');
      expect(error.toolName).toBe('bash');
      expect(error.toolInput).toBeUndefined();
    });
  });

  describe('APIError', () => {
    it('should create API error with status and response', () => {
      const response = { error: 'Not found' };
      const error = new APIError('API request failed', 404, response);
      expect(error.message).toBe('API request failed');
      expect(error.status).toBe(404);
      expect(error.response).toEqual(response);
      expect(error.code).toBe('API_ERROR');
      expect(error.name).toBe('APIError');
    });

    it('should create API error without status', () => {
      const error = new APIError('Network error');
      expect(error.status).toBeUndefined();
      expect(error.response).toBeUndefined();
    });
  });

  describe('SessionError', () => {
    it('should create session error with session ID', () => {
      const error = new SessionError('Session not found', 'session123');
      expect(error.message).toBe('Session not found');
      expect(error.sessionId).toBe('session123');
      expect(error.code).toBe('SESSION_ERROR');
      expect(error.name).toBe('SessionError');
    });

    it('should create session error without session ID', () => {
      const error = new SessionError('Session error');
      expect(error.sessionId).toBeUndefined();
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with field', () => {
      const error = new ValidationError('Invalid input', 'email');
      expect(error.message).toBe('Invalid input');
      expect(error.field).toBe('email');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.name).toBe('ValidationError');
    });

    it('should create validation error without field', () => {
      const error = new ValidationError('Invalid input');
      expect(error.field).toBeUndefined();
    });
  });
});
