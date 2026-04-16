#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { Agent } from './agent/index.js';
import { loadConfig, validateConfig } from './config/index.js';
import { SessionStore } from './memory/session-store.js';
import { existsSync } from 'fs';
import { readFileSync } from 'fs';

const program = new Command();

// Load package.json for version
let version = '0.1.0-beta.1';
try {
  const packagePath = new URL('../package.json', import.meta.url);
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
  version = packageJson.version;
} catch {
  // Use default version
}

program
  .name('greatwall')
  .description('GreatWall AI Agent - Combining the best of Hermes and OpenClaw')
  .version(version);

program
  .command('chat')
  .description('Start an interactive chat session')
  .option('-s, --session <id>', 'Resume a specific session')
  .action(async (options) => {
    try {
      console.log(chalk.cyan.bold('\n🏯 GreatWall Agent\n'));

      const config = loadConfig();
      validateConfig(config);

      if (!config.anthropicApiKey) {
        console.error(chalk.red('Error: ANTHROPIC_API_KEY is required'));
        console.log(chalk.yellow('Please set it in your .env file'));
        process.exit(1);
      }

      const sessionStore = new SessionStore(config.dbPath);
      const agent = new Agent(config.anthropicApiKey, {
        model: config.defaultModel,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        maxIterations: config.maxIterations,
      }, sessionStore);

      console.log(chalk.gray('Type your message and press Enter. Type "exit" to quit.\n'));

      let sessionId = options.session;

      while (true) {
        const { message } = await inquirer.prompt([
          {
            type: 'input',
            name: 'message',
            message: chalk.green('You:'),
          },
        ]);

        if (message.toLowerCase() === 'exit') {
          console.log(chalk.yellow('\nGoodbye! 👋\n'));
          sessionStore.close();
          break;
        }

        if (!message.trim()) {
          continue;
        }

        const spinner = ora('Thinking...').start();

        try {
          const response = await agent.chat(message, sessionId);
          spinner.stop();

          console.log(chalk.blue('\nAssistant:'), response, '\n');
        } catch (error: any) {
          spinner.stop();
          console.error(chalk.red('\nError:'), error.message, '\n');
        }
      }
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('query <message>')
  .description('Send a single query to the agent')
  .option('-s, --session <id>', 'Use a specific session')
  .action(async (message, options) => {
    try {
      const config = loadConfig();
      validateConfig(config);

      if (!config.anthropicApiKey) {
        console.error(chalk.red('Error: ANTHROPIC_API_KEY is required'));
        process.exit(1);
      }

      const sessionStore = new SessionStore(config.dbPath);
      const agent = new Agent(config.anthropicApiKey, {
        model: config.defaultModel,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        maxIterations: config.maxIterations,
      }, sessionStore);

      const spinner = ora('Processing...').start();

      const response = await agent.chat(message, options.session);
      spinner.stop();

      console.log(chalk.blue('\nResponse:\n'), response, '\n');

      sessionStore.close();
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('sessions')
  .description('List all chat sessions')
  .action(async () => {
    try {
      const config = loadConfig();
      const sessionStore = new SessionStore(config.dbPath);

      // This would need implementation in SessionStore
      console.log(chalk.yellow('Session listing feature coming soon!'));

      sessionStore.close();
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize configuration')
  .action(async () => {
    console.log(chalk.cyan.bold('\n🏯 GreatWall Agent Setup\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'anthropicKey',
        message: 'Anthropic API Key:',
        validate: (input) => input.length > 0 || 'API key is required',
      },
      {
        type: 'input',
        name: 'model',
        message: 'Default model:',
        default: 'claude-sonnet-4-20250514',
      },
    ]);

    const envContent = `# GreatWall Agent Configuration
ANTHROPIC_API_KEY=${answers.anthropicKey}
DEFAULT_MODEL=${answers.model}
DEFAULT_TEMPERATURE=0.7
MAX_TOKENS=4096
AGENT_NAME=GreatWall
MAX_ITERATIONS=50
DB_PATH=./.greatwall/sessions.db
LOG_LEVEL=info
`;

    const { writeFileSync } = await import('fs');
    writeFileSync('.env', envContent);

    console.log(chalk.green('\n✓ Configuration saved to .env\n'));
    console.log(chalk.gray('You can now use: greatwall chat\n'));
  });

program.parse();
