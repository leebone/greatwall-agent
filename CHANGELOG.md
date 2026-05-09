# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0-beta.2] - 2026-05-09

### Added
- Custom error classes for better error handling (AgentError, APIError, ToolExecutionError, SessionError, ValidationError, ConfigurationError)
- LRU cache implementation for improved session storage performance
- Comprehensive JSDoc comments to Agent and SessionStore classes
- Input validation for user messages
- 20 new unit tests (total: 22 tests)
  - 9 tests for LRU cache
  - 11 tests for custom error classes

### Changed
- Updated @typescript-eslint/eslint-plugin from v6 to v8
- Updated @typescript-eslint/parser from v6 to v8
- Improved type safety by replacing 'any' types with proper interfaces (ContentBlock, APIResponse)
- SessionStore now uses LRU caching to reduce disk I/O operations
- Extracted text content extraction into reusable method

### Fixed
- Removed unused imports from agent, config, and tools modules
- Fixed ESLint configuration to properly exclude test files

### Performance
- Session reads now check cache first before hitting storage
- Early exit optimization in session search (already existed, verified)
- Reduced redundant disk I/O with intelligent caching

## [0.1.0-beta.1] - 2026-05-07

### Added
- Comprehensive logging system with configurable levels
- Parallel tool execution for better performance
- API call retry mechanism with exponential backoff
- Enhanced error handling throughout the agent
- Complete sessions command implementation (list/search/delete/stats)
- ESLint and Prettier configuration
- GitHub Actions CI/CD workflow
- Session management features (listSessions, deleteSession, getStats)

### Changed
- Better logging integration across all components
- Handle max_tokens stop reason gracefully
- Improved error messages with context

### Performance
- Tools now execute in parallel when possible
- Retry logic prevents temporary API failures
- Better session storage with optimized queries
