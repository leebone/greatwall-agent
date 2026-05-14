import { describe, it, expect } from 'vitest';
import { LRUCache } from './cache.js';

describe('LRUCache', () => {
  it('should store and retrieve values', () => {
    const cache = new LRUCache<string, number>(3);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);

    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBe(2);
    expect(cache.get('c')).toBe(3);
  });

  it('should return undefined for non-existent keys', () => {
    const cache = new LRUCache<string, number>(3);
    expect(cache.get('nonexistent')).toBeUndefined();
  });

  it('should evict least recently used item when max size is reached', () => {
    const cache = new LRUCache<string, number>(3);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    cache.set('d', 4); // This should evict 'a'

    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe(2);
    expect(cache.get('c')).toBe(3);
    expect(cache.get('d')).toBe(4);
  });

  it('should update recency on get', () => {
    const cache = new LRUCache<string, number>(3);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    cache.get('a'); // Move 'a' to the end (most recent)
    cache.set('d', 4); // This should evict 'b', not 'a'

    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('c')).toBe(3);
    expect(cache.get('d')).toBe(4);
  });

  it('should update existing keys without increasing size', () => {
    const cache = new LRUCache<string, number>(3);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('a', 10); // Update 'a'

    expect(cache.size).toBe(2);
    expect(cache.get('a')).toBe(10);
  });

  it('should handle has() correctly', () => {
    const cache = new LRUCache<string, number>(3);
    cache.set('a', 1);

    expect(cache.has('a')).toBe(true);
    expect(cache.has('b')).toBe(false);
  });

  it('should handle delete() correctly', () => {
    const cache = new LRUCache<string, number>(3);
    cache.set('a', 1);
    cache.set('b', 2);

    expect(cache.delete('a')).toBe(true);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.has('a')).toBe(false);
    expect(cache.size).toBe(1);
  });

  it('should handle clear() correctly', () => {
    const cache = new LRUCache<string, number>(3);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);

    cache.clear();

    expect(cache.size).toBe(0);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('c')).toBeUndefined();
  });

  it('should work with complex value types', () => {
    interface TestData {
      id: number;
      name: string;
    }

    const cache = new LRUCache<string, TestData>(2);
    cache.set('user1', { id: 1, name: 'Alice' });
    cache.set('user2', { id: 2, name: 'Bob' });

    expect(cache.get('user1')).toEqual({ id: 1, name: 'Alice' });
    expect(cache.get('user2')).toEqual({ id: 2, name: 'Bob' });
  });
});
