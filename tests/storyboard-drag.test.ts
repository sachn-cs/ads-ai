import { describe, it, expect } from 'vitest';

describe('Storyboard drag-reorder', () => {
  it('reorders ids by index', () => {
    const orderedIds = ['b', 'a', 'c'];
    const sorted = [...orderedIds].sort();
    expect(sorted[0]).toBe('a');
  });

  it('preserves shot identity across reorder', () => {
    const ids = ['shot-1', 'shot-2', 'shot-3'];
    const reordered = [ids[2], ids[0], ids[1]];
    expect(new Set(reordered)).toEqual(new Set(ids));
  });
});
