import { exec } from 'child_process';
import { promisify } from 'util';
import type { Tool } from '../types/index.js';

const execAsync = promisify(exec);

export const bashTool: Tool = {
  name: 'bash',
  description:
    'Execute bash commands. Use this to run shell commands, navigate the filesystem, install packages, etc.',
  parameters: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'The bash command to execute',
      },
    },
    required: ['command'],
  },
  handler: async (args: Record<string, any>): Promise<string> => {
    try {
      const { stdout, stderr } = await execAsync(args.command, {
        timeout: 30000, // 30 second timeout
        maxBuffer: 1024 * 1024, // 1MB buffer
      });

      return JSON.stringify({
        success: true,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
      });
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
        stdout: error.stdout?.trim() || '',
        stderr: error.stderr?.trim() || '',
      });
    }
  },
};
