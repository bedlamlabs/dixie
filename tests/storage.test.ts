import { describe, it, expect } from 'vitest';
import { createStorage } from '../src/browser/Storage';

// ═══════════════════════════════════════════════════════════════════════
// Storage — Web Storage API implementation
// ═══════════════════════════════════════════════════════════════════════

describe('Storage', () => {
  // ═══════════════════════════════════════════════════════════════════
  // getItem / setItem basics
  // ═══════════════════════════════════════════════════════════════════

  describe('getItem / setItem', () => {
    it('stores and retrieves a string value', () => {
      const storage = createStorage();
      storage.setItem('name', 'Dixie');
      expect(storage.getItem('name')).toBe('Dixie');
    });

    it('returns null for a non-existent key', () => {
      const storage = createStorage();
      expect(storage.getItem('missing')).toBeNull();
    });

    it('overwrites an existing key', () => {
      const storage = createStorage();
      storage.setItem('color', 'red');
      storage.setItem('color', 'blue');
      expect(storage.getItem('color')).toBe('blue');
    });

    it('stores empty string as a valid value', () => {
      const storage = createStorage();
      storage.setItem('empty', '');
      expect(storage.getItem('empty')).toBe('');
    });

    it('treats keys as case-sensitive', () => {
      const storage = createStorage();
      storage.setItem('Key', 'upper');
      storage.setItem('key', 'lower');
      expect(storage.getItem('Key')).toBe('upper');
      expect(storage.getItem('key')).toBe('lower');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Value coercion
  // ═══════════════════════════════════════════════════════════════════

  describe('value coercion', () => {
    it('coerces number to string', () => {
      const storage = createStorage();
      storage.setItem('num', 42 as any);
      expect(storage.getItem('num')).toBe('42');
    });

    it('coerces boolean to string', () => {
      const storage = createStorage();
      storage.setItem('bool', true as any);
      expect(storage.getItem('bool')).toBe('true');
    });

    it('coerces null to string "null"', () => {
      const storage = createStorage();
      storage.setItem('n', null as any);
      expect(storage.getItem('n')).toBe('null');
    });

    it('coerces undefined to string "undefined"', () => {
      const storage = createStorage();
      storage.setItem('u', undefined as any);
      expect(storage.getItem('u')).toBe('undefined');
    });

    it('coerces object to string via toString', () => {
      const storage = createStorage();
      storage.setItem('obj', { a: 1 } as any);
      expect(storage.getItem('obj')).toBe('[object Object]');
    });

    it('coerces array to string', () => {
      const storage = createStorage();
      storage.setItem('arr', [1, 2, 3] as any);
      expect(storage.getItem('arr')).toBe('1,2,3');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // removeItem
  // ═══════════════════════════════════════════════════════════════════

  describe('removeItem', () => {
    it('removes an existing key', () => {
      const storage = createStorage();
      storage.setItem('x', '1');
      storage.removeItem('x');
      expect(storage.getItem('x')).toBeNull();
    });

    it('is a no-op for a non-existent key (no error)', () => {
      const storage = createStorage();
      expect(() => storage.removeItem('ghost')).not.toThrow();
    });

    it('does not affect other keys', () => {
      const storage = createStorage();
      storage.setItem('a', '1');
      storage.setItem('b', '2');
      storage.removeItem('a');
      expect(storage.getItem('b')).toBe('2');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // clear
  // ═══════════════════════════════════════════════════════════════════

  describe('clear', () => {
    it('removes all keys', () => {
      const storage = createStorage();
      storage.setItem('a', '1');
      storage.setItem('b', '2');
      storage.setItem('c', '3');
      storage.clear();
      expect(storage.getItem('a')).toBeNull();
      expect(storage.getItem('b')).toBeNull();
      expect(storage.getItem('c')).toBeNull();
    });

    it('resets length to 0', () => {
      const storage = createStorage();
      storage.setItem('a', '1');
      storage.setItem('b', '2');
      storage.clear();
      expect(storage.length).toBe(0);
    });

    it('is a no-op on an already empty storage', () => {
      const storage = createStorage();
      expect(() => storage.clear()).not.toThrow();
      expect(storage.length).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // length
  // ═══════════════════════════════════════════════════════════════════

  describe('length', () => {
    it('is 0 for a new storage', () => {
      const storage = createStorage();
      expect(storage.length).toBe(0);
    });

    it('increases when items are added', () => {
      const storage = createStorage();
      storage.setItem('a', '1');
      expect(storage.length).toBe(1);
      storage.setItem('b', '2');
      expect(storage.length).toBe(2);
    });

    it('does not increase when overwriting a key', () => {
      const storage = createStorage();
      storage.setItem('a', '1');
      storage.setItem('a', '2');
      expect(storage.length).toBe(1);
    });

    it('decreases when items are removed', () => {
      const storage = createStorage();
      storage.setItem('a', '1');
      storage.setItem('b', '2');
      storage.removeItem('a');
      expect(storage.length).toBe(1);
    });

    it('does not decrease when removing non-existent key', () => {
      const storage = createStorage();
      storage.setItem('a', '1');
      storage.removeItem('z');
      expect(storage.length).toBe(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // key(index)
  // ═══════════════════════════════════════════════════════════════════

  describe('key(index)', () => {
    it('returns the key at the given index in insertion order', () => {
      const storage = createStorage();
      storage.setItem('alpha', '1');
      storage.setItem('beta', '2');
      storage.setItem('gamma', '3');
      expect(storage.key(0)).toBe('alpha');
      expect(storage.key(1)).toBe('beta');
      expect(storage.key(2)).toBe('gamma');
    });

    it('returns null for an out-of-range positive index', () => {
      const storage = createStorage();
      storage.setItem('only', 'one');
      expect(storage.key(1)).toBeNull();
      expect(storage.key(99)).toBeNull();
    });

    it('returns null for a negative index', () => {
      const storage = createStorage();
      storage.setItem('a', '1');
      expect(storage.key(-1)).toBeNull();
    });

    it('returns null when storage is empty', () => {
      const storage = createStorage();
      expect(storage.key(0)).toBeNull();
    });

    it('reflects removal — keys re-index', () => {
      const storage = createStorage();
      storage.setItem('a', '1');
      storage.setItem('b', '2');
      storage.setItem('c', '3');
      storage.removeItem('b');
      // After removing 'b', index 1 should now be 'c'
      expect(storage.key(0)).toBe('a');
      expect(storage.key(1)).toBe('c');
      expect(storage.key(2)).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Proxy — bracket notation reads
  // ═══════════════════════════════════════════════════════════════════

  describe('bracket notation reads', () => {
    it('reads a stored value via bracket notation', () => {
      const storage = createStorage();
      storage.setItem('foo', 'bar');
      expect((storage as any)['foo']).toBe('bar');
    });

    it('returns undefined for a missing key via bracket notation', () => {
      const storage = createStorage();
      expect((storage as any)['nope']).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Proxy — bracket notation writes
  // ═══════════════════════════════════════════════════════════════════

  describe('bracket notation writes', () => {
    it('writes a value via bracket notation', () => {
      const storage = createStorage();
      (storage as any)['myKey'] = 'myVal';
      expect(storage.getItem('myKey')).toBe('myVal');
    });

    it('overwrites via bracket notation', () => {
      const storage = createStorage();
      (storage as any)['k'] = 'old';
      (storage as any)['k'] = 'new';
      expect(storage.getItem('k')).toBe('new');
    });

    it('coerces values written via bracket notation', () => {
      const storage = createStorage();
      (storage as any)['num'] = 123;
      expect(storage.getItem('num')).toBe('123');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Proxy — bracket notation delete
  // ═══════════════════════════════════════════════════════════════════

  describe('bracket notation delete', () => {
    it('deletes a key via delete operator', () => {
      const storage = createStorage();
      storage.setItem('bye', 'gone');
      delete (storage as any)['bye'];
      expect(storage.getItem('bye')).toBeNull();
    });

    it('delete on non-existent key does not throw', () => {
      const storage = createStorage();
      expect(() => delete (storage as any)['ghost']).not.toThrow();
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Proxy — enumeration
  // ═══════════════════════════════════════════════════════════════════

  describe('enumeration', () => {
    it('Object.keys returns all storage keys', () => {
      const storage = createStorage();
      storage.setItem('x', '1');
      storage.setItem('y', '2');
      storage.setItem('z', '3');
      expect(Object.keys(storage)).toEqual(['x', 'y', 'z']);
    });

    it('for...in iterates over storage keys', () => {
      const storage = createStorage();
      storage.setItem('a', '1');
      storage.setItem('b', '2');
      const keys: string[] = [];
      for (const key in storage) {
        keys.push(key);
      }
      expect(keys).toContain('a');
      expect(keys).toContain('b');
    });

    it('Object.keys returns empty array for empty storage', () => {
      const storage = createStorage();
      expect(Object.keys(storage)).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // toString
  // ═══════════════════════════════════════════════════════════════════

  describe('toString', () => {
    it('returns "[object Storage]"', () => {
      const storage = createStorage();
      expect(storage.toString()).toBe('[object Storage]');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Method name collisions
  // ═══════════════════════════════════════════════════════════════════

  describe('method name collisions', () => {
    it('method property "getItem" still works as a function', () => {
      const storage = createStorage();
      // Even if someone tries bracket notation with a method name,
      // the method should take priority on read
      expect(typeof storage.getItem).toBe('function');
    });

    it('method property "setItem" still works as a function', () => {
      const storage = createStorage();
      expect(typeof storage.setItem).toBe('function');
    });

    it('method property "removeItem" still works as a function', () => {
      const storage = createStorage();
      expect(typeof storage.removeItem).toBe('function');
    });

    it('method property "clear" still works as a function', () => {
      const storage = createStorage();
      expect(typeof storage.clear).toBe('function');
    });

    it('method property "key" still works as a function', () => {
      const storage = createStorage();
      expect(typeof storage.key).toBe('function');
    });

    it('"length" property returns number, not stored value', () => {
      const storage = createStorage();
      // Even if someone tries to set "length" via bracket notation,
      // the real length property should still report the count
      (storage as any)['length'] = '999';
      expect(typeof storage.length).toBe('number');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Instance independence
  // ═══════════════════════════════════════════════════════════════════

  describe('instance independence', () => {
    it('two storages do not share data', () => {
      const s1 = createStorage();
      const s2 = createStorage();
      s1.setItem('shared', 'nope');
      expect(s2.getItem('shared')).toBeNull();
    });

    it('clearing one does not affect the other', () => {
      const s1 = createStorage();
      const s2 = createStorage();
      s1.setItem('a', '1');
      s2.setItem('b', '2');
      s1.clear();
      expect(s2.getItem('b')).toBe('2');
      expect(s2.length).toBe(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Edge cases
  // ═══════════════════════════════════════════════════════════════════

  describe('edge cases', () => {
    it('key with special characters', () => {
      const storage = createStorage();
      storage.setItem('key with spaces', 'yes');
      storage.setItem('key.with.dots', 'yes');
      storage.setItem('key/with/slashes', 'yes');
      expect(storage.getItem('key with spaces')).toBe('yes');
      expect(storage.getItem('key.with.dots')).toBe('yes');
      expect(storage.getItem('key/with/slashes')).toBe('yes');
    });

    it('value with newlines and special chars', () => {
      const storage = createStorage();
      storage.setItem('multiline', 'line1\nline2\ttab');
      expect(storage.getItem('multiline')).toBe('line1\nline2\ttab');
    });

    it('very long key and value', () => {
      const storage = createStorage();
      const longKey = 'k'.repeat(10000);
      const longVal = 'v'.repeat(10000);
      storage.setItem(longKey, longVal);
      expect(storage.getItem(longKey)).toBe(longVal);
    });

    it('setItem then removeItem then setItem with same key', () => {
      const storage = createStorage();
      storage.setItem('bounce', 'first');
      storage.removeItem('bounce');
      storage.setItem('bounce', 'second');
      expect(storage.getItem('bounce')).toBe('second');
      expect(storage.length).toBe(1);
    });

    it('bracket read of getItem after setItem via bracket returns the value', () => {
      const storage = createStorage();
      (storage as any)['test'] = 'via-bracket';
      // Should be readable via both APIs
      expect(storage.getItem('test')).toBe('via-bracket');
      expect((storage as any)['test']).toBe('via-bracket');
    });
  });
});
