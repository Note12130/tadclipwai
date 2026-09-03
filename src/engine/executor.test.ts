import { describe, it, expect } from 'vitest';
import { EngineExecutor } from './executor';

describe('EngineExecutor Interface', () => {
  it('exposes execute method', () => {
    expect(typeof EngineExecutor.execute).toBe('function');
  });
});
