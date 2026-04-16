import { readFile, writeFile, readdir, stat } from 'fs/promises';
import { existsSync } from 'fs';
import type { Tool } from '../types/index.js';

export const readFileTool: Tool = {
  name: 'read_file',
  description: 'Read the contents of a file',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The path to the file to read',
      },
    },
    required: ['path'],
  },
  handler: async (args: Record<string, any>): Promise<string> => {
    try {
      const content = await readFile(args.path, 'utf-8');
      return JSON.stringify({
        success: true,
        content,
      });
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
      });
    }
  },
};

export const writeFileTool: Tool = {
  name: 'write_file',
  description: 'Write content to a file',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The path to the file to write',
      },
      content: {
        type: 'string',
        description: 'The content to write to the file',
      },
    },
    required: ['path', 'content'],
  },
  handler: async (args: Record<string, any>): Promise<string> => {
    try {
      await writeFile(args.path, args.content, 'utf-8');
      return JSON.stringify({
        success: true,
        message: `File written successfully to ${args.path}`,
      });
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
      });
    }
  },
};

export const listDirectoryTool: Tool = {
  name: 'list_directory',
  description: 'List the contents of a directory',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The path to the directory to list',
      },
    },
    required: ['path'],
  },
  handler: async (args: Record<string, any>): Promise<string> => {
    try {
      const entries = await readdir(args.path);
      const details = await Promise.all(
        entries.map(async (entry) => {
          const fullPath = `${args.path}/${entry}`;
          const stats = await stat(fullPath);
          return {
            name: entry,
            isDirectory: stats.isDirectory(),
            isFile: stats.isFile(),
            size: stats.size,
          };
        })
      );

      return JSON.stringify({
        success: true,
        entries: details,
      });
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
      });
    }
  },
};
