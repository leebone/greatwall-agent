import { describe, it, expect } from 'vitest';
import { loadConfig } from './index.js';

describe('Configuration', () => {
  it('should load default configuration', () => {
    const config = loadConfig();

    expect(config).toBeDefined();
    expect(config.defaultModel).toBe('claude-sonnet-4-20250514');
    expect(config.temperature).toBe(0.7);
    expect(config.maxTokens).toBe(4096);
    expect(config.maxIterations).toBe(50);
    expect(config.agentName).toBe('GreatWall');
  });

  it('should have required structure', () => {
    const config = loadConfig();

    expect(config).toHaveProperty('defaultModel');
    expect(config).toHaveProperty('temperature');
    expect(config).toHaveProperty('maxTokens');
    expect(config).toHaveProperty('maxIterations');
    expect(config).toHaveProperty('dbPath');
  });
});
