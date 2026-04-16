import { z } from 'zod';
import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

dotenv.config();

const ConfigSchema = z.object({
  anthropicApiKey: z.string().optional(),
  openaiApiKey: z.string().optional(),
  defaultModel: z.string().default('claude-sonnet-4-20250514'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().positive().default(4096),
  maxIterations: z.number().positive().default(50),
  agentName: z.string().default('GreatWall'),
  dbPath: z.string().default('./.greatwall/sessions.db'),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(): Config {
  const config = ConfigSchema.parse({
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
    defaultModel: process.env.DEFAULT_MODEL,
    temperature: process.env.DEFAULT_TEMPERATURE ? parseFloat(process.env.DEFAULT_TEMPERATURE) : undefined,
    maxTokens: process.env.MAX_TOKENS ? parseInt(process.env.MAX_TOKENS) : undefined,
    maxIterations: process.env.MAX_ITERATIONS ? parseInt(process.env.MAX_ITERATIONS) : undefined,
    agentName: process.env.AGENT_NAME,
    dbPath: process.env.DB_PATH,
    logLevel: process.env.LOG_LEVEL as any,
  });

  // Expand home directory in paths
  if (config.dbPath.startsWith('~/')) {
    config.dbPath = join(homedir(), config.dbPath.slice(2));
  }

  return config;
}

export function validateConfig(config: Config): void {
  if (!config.anthropicApiKey && !config.openaiApiKey) {
    throw new Error('At least one API key (Anthropic or OpenAI) must be configured');
  }
}
