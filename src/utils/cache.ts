/**
 * Simple Least Recently Used (LRU) cache implementation
 */
export class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  /**
   * Creates a new LRU cache
   * @param maxSize - Maximum number of items to store in the cache
   */
  constructor(maxSize: number = 50) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  /**
   * Gets a value from the cache
   * @param key - The key to look up
   * @returns The value if found, undefined otherwise
   */
  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  /**
   * Sets a value in the cache
   * @param key - The key to store
   * @param value - The value to store
   */
  set(key: K, value: V): void {
    // Delete existing key to move it to the end
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    // If at max size, remove oldest (first) entry
    else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value as K;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  /**
   * Checks if a key exists in the cache
   * @param key - The key to check
   * @returns True if the key exists
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * Removes a key from the cache
   * @param key - The key to remove
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clears all entries from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Gets the current size of the cache
   */
  get size(): number {
    return this.cache.size;
  }
}
