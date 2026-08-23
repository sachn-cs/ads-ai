import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { mkdtempSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const TEMP = mkdtempSync(path.join(tmpdir(), 'cinestudio-sora-'));

vi.mock('openai', () => ({
  default: vi.fn(),
}));

vi.setConfig({ testTimeout: 30_000 });

afterEach(() => {
  vi.restoreAllMocks();
});

describe('renderWithSora', () => {
  beforeEach(() => {
    rmSync(TEMP, { recursive: true, force: true});
  });

  it('fails fast when no apiKey', async () => {
    const { renderWithSora } = await import('@/src/providers/render/sora');
    const result = await renderWithSora(
      { apiKey: '', model: 'sora-2', artifactDir: TEMP },
      {
        shotId: 's1', provider: 'sora', model: 'sora-2', prompt: 'p', negativePrompt: '', contextAttachments: [],
        aspectRatio: '16:9', cameraSpec: { move: 'static', lensMm: 35 },
        lightingSpec: { palette: [], keyDirection: 'top', atmosphere: 'clean', exposureMood: 'mid_key' },
        durationSeconds: 8,
      },
    );
    expect(result.status).toBe('failed');
    expect(result.errorMessage).toContain('not set');
  });

  it('returns completed result with downloaded bytes', async () => {
    const OpenAI = (await import('openai')).default as unknown as { mockReturnValue: (v: unknown) => void; mockImplementation: (fn: (v: unknown) => void) => void };
    const fakeBuffer = Buffer.from('FAKE_SORA_MP4');
    const webStream = new ReadableStream({
      start(controller) {
        controller.enqueue(fakeBuffer);
        controller.close();
      },
    });

    const fakeOpenAI = vi.fn().mockImplementation(() => ({
      videos: {
        create: vi.fn().mockResolvedValue({ id: 'vid-1', status: 'in_progress' }),
        retrieve: vi
          .fn()
          .mockResolvedValueOnce({ id: 'vid-1', status: 'in_progress' })
          .mockResolvedValueOnce({ id: 'vid-1', status: 'completed', model: 'sora-2' }),
        downloadContent: vi.fn().mockResolvedValue({ body: webStream }),
      },
    }));
    OpenAI.mockImplementation?.(fakeOpenAI as never);

    const { renderWithSora } = await import('@/src/providers/render/sora');
    const result = await renderWithSora(
      { apiKey: 'sk-test', model: 'sora-2', artifactDir: TEMP },
      {
        shotId: 's1', provider: 'sora', model: 'sora-2', prompt: 'p', negativePrompt: '', contextAttachments: [],
        aspectRatio: '16:9', cameraSpec: { move: 'static', lensMm: 35 },
        lightingSpec: { palette: [], keyDirection: 'top', atmosphere: 'clean', exposureMood: 'mid_key' },
        durationSeconds: 8,
      },
    );
    expect(result.status).toBe('completed');
    expect(result.videoPath).toBeTruthy();
    expect(existsSync(result.videoPath!)).toBe(true);
  });

  it('reports failure when Sora returns status=failed', async () => {
    const OpenAI = (await import('openai')).default as unknown as { mockImplementation: (fn: (v: unknown) => void) => void };
    const fakeOpenAI = vi.fn().mockImplementation(() => ({
      videos: {
        create: vi.fn().mockResolvedValue({ id: 'vid-2', status: 'in_progress' }),
        retrieve: vi.fn().mockResolvedValue({ id: 'vid-2', status: 'failed', error: { message: 'safety' } }),
        downloadContent: vi.fn(),
      },
    }));
    OpenAI.mockImplementation(fakeOpenAI as never);
    const { renderWithSora } = await import('@/src/providers/render/sora');
    const result = await renderWithSora(
      { apiKey: 'sk-test', model: 'sora-2', artifactDir: TEMP },
      {
        shotId: 's2', provider: 'sora', model: 'sora-2', prompt: 'p', negativePrompt: '', contextAttachments: [],
        aspectRatio: '9:16', cameraSpec: { move: 'static', lensMm: 35 },
        lightingSpec: { palette: [], keyDirection: 'top', atmosphere: 'clean', exposureMood: 'mid_key' },
        durationSeconds: 4,
      },
    );
    expect(result.status).toBe('failed');
    expect(result.errorMessage).toContain('safety');
  });
});
