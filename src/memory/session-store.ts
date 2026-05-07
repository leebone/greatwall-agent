import storage from 'node-persist';
import { mkdirSync, existsSync } from 'fs';
import type { Session, Message, Memory } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class SessionStore {
  private initialized: boolean = false;
  private dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
    // Ensure directory exists
    if (!existsSync(dbPath)) {
      mkdirSync(dbPath, { recursive: true });
      logger.debug('Created session storage directory', { path: dbPath });
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await storage.init({
        dir: this.dbPath,
        stringify: JSON.stringify,
        parse: JSON.parse,
        encoding: 'utf8',
        logging: false,
        ttl: false,
        expiredInterval: 2 * 60 * 1000,
        forgiveParseErrors: false
      });
      this.initialized = true;
      logger.debug('Session storage initialized');
    }
  }

  async createSession(id: string, metadata?: Record<string, any>): Promise<Session> {
    await this.ensureInitialized();
    const now = new Date();
    const session: Session = {
      id,
      createdAt: now,
      updatedAt: now,
      messages: [],
      metadata,
    };

    await storage.setItem(`session:${id}`, session);
    logger.info('Session created', { sessionId: id });
    return session;
  }

  async getSession(id: string): Promise<Session | null> {
    await this.ensureInitialized();
    const session = await storage.getItem(`session:${id}`);
    return session || null;
  }

  async addMessage(sessionId: string, message: Message): Promise<void> {
    await this.ensureInitialized();
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.messages.push(message);
    session.updatedAt = new Date();
    await storage.setItem(`session:${sessionId}`, session);
  }

  async listSessions(limit?: number): Promise<Session[]> {
    await this.ensureInitialized();
    const keys = await storage.keys();
    const sessionKeys = keys.filter((k: string) => k.startsWith('session:'));
    const sessions: Session[] = [];

    for (const key of sessionKeys) {
      const session = await storage.getItem(key) as Session;
      if (session) {
        // Don't include full message history in list view
        sessions.push({
          ...session,
          messages: session.messages.slice(0, 1), // Only keep first message for preview
        });
      }
    }

    // Sort by update time, most recent first
    const sorted = sessions.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return limit ? sorted.slice(0, limit) : sorted;
  }

  async deleteSession(id: string): Promise<boolean> {
    await this.ensureInitialized();
    const session = await this.getSession(id);
    if (!session) {
      return false;
    }

    await storage.removeItem(`session:${id}`);
    logger.info('Session deleted', { sessionId: id });
    return true;
  }

  async searchSessions(query: string, limit: number = 10): Promise<Session[]> {
    await this.ensureInitialized();
    const keys = await storage.keys();
    const sessionKeys = keys.filter((k: string) => k.startsWith('session:'));
    const sessions: Session[] = [];

    for (const key of sessionKeys) {
      const session = await storage.getItem(key) as Session;
      if (session) {
        const hasMatch = session.messages.some(m =>
          m.content.toLowerCase().includes(query.toLowerCase())
        );
        if (hasMatch) {
          sessions.push(session);
        }
      }
      if (sessions.length >= limit) break;
    }

    return sessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async addMemory(memory: Memory): Promise<void> {
    await this.ensureInitialized();
    await storage.setItem(`memory:${memory.id}`, memory);
    logger.debug('Memory added', { memoryId: memory.id, type: memory.type });
  }

  async searchMemories(query: string, type?: string, limit: number = 10): Promise<Memory[]> {
    await this.ensureInitialized();
    const keys = await storage.keys();
    const memoryKeys = keys.filter((k: string) => k.startsWith('memory:'));
    const memories: Memory[] = [];

    for (const key of memoryKeys) {
      const memory = await storage.getItem(key) as Memory;
      if (memory) {
        const matchesQuery = memory.content.toLowerCase().includes(query.toLowerCase());
        const matchesType = !type || memory.type === type;

        if (matchesQuery && matchesType) {
          memories.push(memory);
        }
      }
      if (memories.length >= limit) break;
    }

    return memories.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getStats(): Promise<{
    sessionCount: number;
    memoryCount: number;
    totalMessages: number;
  }> {
    await this.ensureInitialized();
    const keys = await storage.keys();
    const sessionKeys = keys.filter((k: string) => k.startsWith('session:'));
    const memoryKeys = keys.filter((k: string) => k.startsWith('memory:'));

    let totalMessages = 0;
    for (const key of sessionKeys) {
      const session = await storage.getItem(key) as Session;
      if (session) {
        totalMessages += session.messages.length;
      }
    }

    return {
      sessionCount: sessionKeys.length,
      memoryCount: memoryKeys.length,
      totalMessages,
    };
  }

  async close(): Promise<void> {
    // node-persist doesn't need explicit closing
    this.initialized = false;
    logger.debug('Session storage closed');
  }
}
