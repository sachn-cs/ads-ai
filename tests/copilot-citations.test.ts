import { describe, it, expect } from 'vitest';

describe('Copilot citations', () => {
  it('citation shape contains entityType, entityId, label', () => {
    const c = {
      entityType: 'character' as const,
      entityId: 'c1',
      label: 'Mira',
    };
    expect(c.entityType).toBe('character');
    expect(c.entityId).toBe('c1');
    expect(c.label).toBe('Mira');
  });

  it('citation href is optional', () => {
    const c: { entityType: 'shot'; entityId: string; label: string; href?: string } = {
      entityType: 'shot',
      entityId: 's1',
      label: 'Shot 1',
    };
    expect(c.href).toBeUndefined();
  });
});
