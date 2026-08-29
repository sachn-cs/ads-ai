import { describe, it, expect, vi } from 'vitest';

const fetchMock = vi.fn();
globalThis.fetch = fetchMock as unknown as typeof fetch;

const { uploadMiniMaxFile } = await import('@/src/providers/minimax/files');

describe('uploadMiniMaxFile', () => {
  it('returns fileId on success', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ file: { file_id: 'abc123' } }),
    });
    const r = await uploadMiniMaxFile(
      { apiKey: 'k' },
      { filename: 'a.png', bytes: new Uint8Array([1, 2, 3]) },
    );
    expect(r.fileId).toBe('abc123');
    expect(r.bytes).toBe(3);
  });

  it('falls back to top-level file_id', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ file_id: 'top1' }),
    });
    const r = await uploadMiniMaxFile(
      { apiKey: 'k' },
      { filename: 'b.png', bytes: new Uint8Array([4]) },
    );
    expect(r.fileId).toBe('top1');
  });

  it('throws on non-2xx', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401, text: async () => 'nope' });
    await expect(
      uploadMiniMaxFile({ apiKey: 'k' }, { filename: 'c.png', bytes: new Uint8Array([1]) }),
    ).rejects.toThrow();
  });

  it('throws when no file_id returned', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) });
    await expect(
      uploadMiniMaxFile({ apiKey: 'k' }, { filename: 'd.png', bytes: new Uint8Array([1]) }),
    ).rejects.toThrow(/no file_id/);
  });
});
