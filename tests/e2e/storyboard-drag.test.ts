import { describe, it, expect } from 'vitest';

describe('e2e: storyboard drag', () => {
  it('round-trips a reorder through the CRUD', async () => {
    const { createProduction } = await import('@/src/db/productions');
    const { createScene, reorderScenes } = await import('@/src/db/scenes');
    const p = createProduction({ title: 'Reorder Test' });
    const s1 = createScene({ productionId: p.id, number: 1, title: 'A' });
    const s2 = createScene({ productionId: p.id, number: 2, title: 'B' });
    const s3 = createScene({ productionId: p.id, number: 3, title: 'C' });
    reorderScenes(p.id, [s3.id, s1.id, s2.id]);
    const { listScenes } = await import('@/src/db/scenes');
    const list = listScenes(p.id);
    expect(list[0]!.id).toBe(s3.id);
    expect(list[1]!.id).toBe(s1.id);
    expect(list[2]!.id).toBe(s2.id);
  });
});
