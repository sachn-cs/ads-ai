import { describe, it, expect } from 'vitest';

describe('e2e: copilot thread', () => {
  it('creates a thread and appends a message', async () => {
    const { createProduction } = await import('@/src/db/productions');
    const { createThread, appendMessage, listMessages } = await import('@/src/db/copilot');
    const p = createProduction({ title: 'Copilot Test' });
    const t = createThread(p.id, 'Hello');
    const m = appendMessage({
      threadId: t.id,
      role: 'user',
      content: 'What should I improve first?',
    });
    expect(m.content).toBe('What should I improve first?');
    const list = listMessages(t.id);
    expect(list.find((x) => x.id === m.id)).toBeDefined();
  });
});
