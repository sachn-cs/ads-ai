import { describe, it, expect } from 'vitest';
import { createProduction, getProduction, listProductions } from '@/src/db/productions';
import { createCharacter } from '@/src/db/characters';

describe('e2e: production creation', () => {
  it('creates and reads back a production', () => {
    const p = createProduction({ title: 'Test Film', logline: 'A quiet morning.' });
    expect(p.title).toBe('Test Film');
    const read = getProduction(p.id);
    expect(read?.id).toBe(p.id);
    const list = listProductions(100, 0);
    expect(list.find((x) => x.id === p.id)).toBeDefined();
  });

  it('attaches characters to a production', () => {
    const p = createProduction({ title: 'Cast Test' });
    const c = createCharacter({ productionId: p.id, name: 'Mira' });
    expect(c.productionId).toBe(p.id);
    expect(c.name).toBe('Mira');
  });
});
