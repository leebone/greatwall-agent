import type { Tool } from '../types/index.js';
import { bashTool } from './bash.js';
import { readFileTool, writeFileTool, listDirectoryTool } from './file.js';
import { webSearchTool, fetchUrlTool } from './web.js';

export const allTools: Tool[] = [
  bashTool,
  readFileTool,
  writeFileTool,
  listDirectoryTool,
  webSearchTool,
  fetchUrlTool,
];

export function getToolByName(name: string): Tool | undefined {
  return allTools.find(tool => tool.name === name);
}

export function formatToolsForAnthropic() {
  return allTools.map(tool => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.parameters,
  }));
}
