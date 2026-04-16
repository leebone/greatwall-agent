# GreatWall Agent

[![Version](https://img.shields.io/badge/version-0.1.0--beta.1-blue.svg)](https://github.com/yourusername/greatwall-agent)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**GreatWall Agent** is an advanced AI agent framework powered by Anthropic Claude. It provides a flexible, tool-enabled agent system that can execute bash commands, manipulate files, search the web, and maintain conversation context through persistent session storage.

Made by Love 💙

## Features

- 🤖 **Claude-Powered Intelligence**: Uses Anthropic's latest Claude models for advanced reasoning
- 🔧 **Tool System**: Extensible tool architecture with built-in bash, file operations, and web search
- 💾 **Persistent Sessions**: File-based session storage with full conversation history
- 🧠 **Memory System**: Store and search facts, skills, and conversation memories
- 🔄 **Iterative Agent Loop**: Automatic tool execution with configurable iteration limits
- ⚙️ **Flexible Configuration**: Environment-based config with Zod validation
- 🎨 **CLI Interface**: Interactive chat, query mode, and session management

## Installation

```bash
npm install -g greatwall-agent
```

Or use from source:

```bash
git clone https://github.com/yourusername/greatwall-agent.git
cd greatwall-agent
npm install
npm run build
npm link
```

## Quick Start

### 1. Set up your API key

Create a `.env` file:

```bash
ANTHROPIC_API_KEY=your_api_key_here
```

Or set it as an environment variable:

```bash
export ANTHROPIC_API_KEY=your_api_key_here
```

### 2. Initialize configuration

```bash
greatwall init
```

### 3. Start chatting

```bash
greatwall chat
```

## Usage

### Interactive Chat Mode

Start an interactive chat session with memory:

```bash
greatwall chat
```

The agent will maintain context across messages and can use tools when needed.

### One-Shot Query Mode

Ask a single question:

```bash
greatwall query "What files are in my current directory?"
```

### Session Management

List all sessions:

```bash
greatwall sessions
```

Continue a previous session:

```bash
greatwall chat --session <session-id>
```

Search sessions:

```bash
greatwall sessions --search "keyword"
```

## Built-in Tools

### Bash Tool
Execute shell commands:
```
Execute: npm install express
Run: git status
```

### File Operations
- **read**: Read file contents
- **write**: Create or update files
- **list**: List directory contents

### Web Tools
- **search**: Search the web using Brave Search API
- **fetch**: Fetch content from URLs

## Configuration

Configuration is managed through environment variables and can be validated with Zod schemas:

```bash
# Core Settings
ANTHROPIC_API_KEY=sk-...
DEFAULT_MODEL=claude-sonnet-4-20250514
TEMPERATURE=0.7
MAX_TOKENS=4096
MAX_ITERATIONS=50

# Storage
DB_PATH=./data/sessions

# Optional: Web Search
BRAVE_API_KEY=your_brave_api_key
```

## Architecture

```
src/
├── agent/          # Core agent loop and inference
├── cli.ts          # Command-line interface
├── config/         # Configuration management
├── memory/         # Session and memory storage
├── tools/          # Tool implementations
└── types/          # TypeScript type definitions
```

### Key Components

- **Agent**: Orchestrates the conversation loop, tool execution, and model inference
- **SessionStore**: Manages persistent conversation history and memories
- **Tool System**: Extensible architecture for adding new capabilities
- **CLI**: User-friendly command-line interface built with Commander

## Development

### Build from source

```bash
npm install
npm run build
```

### Run tests

```bash
npm test
```

### Run in development mode

```bash
npm run dev
```

## Adding Custom Tools

Create a new tool by implementing the `Tool` interface:

```typescript
import type { Tool } from './types/index.js';

export const myTool: Tool = {
  name: 'my_tool',
  description: 'Description of what my tool does',
  parameters: {
    type: 'object',
    properties: {
      param1: {
        type: 'string',
        description: 'Description of param1',
      },
    },
    required: ['param1'],
  },
  handler: async (args: Record<string, any>): Promise<string> => {
    // Your tool logic here
    return JSON.stringify({ result: 'success' });
  },
};
```

Then register it in `src/tools/index.ts`:

```typescript
import { myTool } from './my-tool.js';

const tools: Tool[] = [
  bashTool,
  fileReadTool,
  fileWriteTool,
  fileListTool,
  webSearchTool,
  webFetchTool,
  myTool, // Add your tool here
];
```

## Roadmap

- [ ] Multi-agent collaboration
- [ ] Plugin system for external tools
- [ ] Web UI interface
- [ ] Advanced memory retrieval with embeddings
- [ ] Streaming responses
- [ ] Docker support
- [ ] OpenAI model support

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Credits

Built with inspiration from:
- [Hermes Agent](https://github.com/NousResearch/hermes-agent) - Multi-agent collaboration patterns
- [OpenClaw](https://github.com/openclaw/openclaw) - Tool execution architecture

---

**Version**: 0.1.0-beta.1
**Status**: Beta - Ready for testing and feedback
