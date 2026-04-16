import axios from 'axios';
import type { Tool } from '../types/index.js';

export const webSearchTool: Tool = {
  name: 'web_search',
  description: 'Search the web for information. Returns a summary of search results.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query',
      },
    },
    required: ['query'],
  },
  handler: async (args: Record<string, any>): Promise<string> => {
    // This is a placeholder implementation
    // In production, you would integrate with a real search API like Google, Bing, or DuckDuckGo
    return JSON.stringify({
      success: true,
      message: 'Web search functionality requires API integration',
      query: args.query,
      note: 'This is a placeholder. Integrate with a search API for real results.',
    });
  },
};

export const fetchUrlTool: Tool = {
  name: 'fetch_url',
  description: 'Fetch the content of a URL',
  parameters: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The URL to fetch',
      },
    },
    required: ['url'],
  },
  handler: async (args: Record<string, any>): Promise<string> => {
    try {
      const response = await axios.get(args.url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'GreatWall-Agent/1.0',
        },
      });

      return JSON.stringify({
        success: true,
        status: response.status,
        contentType: response.headers['content-type'],
        content: typeof response.data === 'string'
          ? response.data.slice(0, 5000) // Limit content size
          : JSON.stringify(response.data).slice(0, 5000),
      });
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
        status: error.response?.status,
      });
    }
  },
};
