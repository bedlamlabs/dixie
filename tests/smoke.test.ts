import { describe, it, expect } from 'vitest';
import { VERSION } from '../src/index';

describe('Dixie smoke test', () => {
  it('exports a version string', () => {
    expect(VERSION).toBe('4.0.0');
  });

  it('confirms test infrastructure works', () => {
    expect(1 + 1).toBe(2);
  });
});
