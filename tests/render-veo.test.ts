import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mkdtempSync, writeFileSync, statSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

vi.setConfig({ testTimeout: 30_000 });

const TEMP = mkdtempSync(path.join(tmpdir(), 'cinestudio-veo-'));

const mockState = vi.hoisted(() => ({
  generateVideos: vi.fn(),
  getVideosOperation: vi.fn(),
  download: vi.fn(),
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: { generateVideos: mockState.generateVideos },
    operations: { getVideosOperation: mockState.getVideosOperation },
    files: { download: mockState.download },
  })),
}));

describe('renderWithVeo', () => {
  beforeEach(() => {
    rmSync(TEMP, {recursive: true, force: true});
    mockState.generateVideos.mockReset();
    mockState.getVideosOperation.mockReset();
    mockState.download.mockReset();
  });

  it('fails fast when no apiKey', async () => {
    const { renderWithVeo } = await import('@/src/providers/render/veo');
    const result = await renderWithVeo(
      { apiKey: '', model: 'veo-3.1', artifactDir: TEMP },
      {
        shotId: 's1', provider: 'veo', model: 'veo-3.1', prompt: 'test', negativePrompt: '', contextAttachments: [],
        aspectRatio: '16:9', cameraSpec: { move: 'static', lensMm: 35 },
        lightingSpec: { palette: [], keyDirection: 'top', atmosphere: 'clean', exposureMood: 'mid_key' },
        durationSeconds: 8,
      },
    );
    expect(result.status).toBe('failed');
    expect(result.errorMessage).toContain('not set');
  });

  it('reports failure when SDK throws', async () => {
    mockState.generateVideos.mockRejectedValue(new Error('upstream boom'));
    const { renderWithVeo } = await import('@/src/providers/render/veo');
    const result = await renderWithVeo(
      { apiKey: 'k', model: 'veo-3.1', artifactDir: TEMP },
      {
        shotId: 's1', provider: 'veo', model: 'veo-3.1', prompt: 'p', negativePrompt: '', contextAttachments: [],
        aspectRatio: '16:9', cameraSpec: { move: 'static', lensMm: 35 },
        lightingSpec: { palette: [], keyDirection: 'top', atmosphere: 'clean', exposureMood: 'mid_key' },
        durationSeconds: 8,
      },
    );
    expect(result.status).toBe('failed');
    expect(result.errorMessage).toContain('upstream boom');
  });

  it('writes the downloaded bytes to disk on success', async () => {
    const videoFile = { name: 'videos/s1' };
    const fakeBuffer = Buffer.from('FAKE_MP4_BYTES');
    mockState.generateVideos.mockResolvedValue({ name: 'op-1', done: false });
    mockState.getVideosOperation
      .mockResolvedValueOnce({ name: 'op-1', done: false })
      .mockResolvedValueOnce({
        name: 'op-1',
        done: true,
        response: { generatedVideos: [{ video: videoFile }] },
      });
    mockState.download.mockImplementation(async ({ downloadPath }: { downloadPath: string }) => {
      writeFileSync(downloadPath, fakeBuffer);
    });

    const { renderWithVeo } = await import('@/src/providers/render/veo');
    const result = await renderWithVeo(
      { apiKey: 'k', model: 'veo-3.1', artifactDir: TEMP },
      {
        shotId: 's1', provider: 'veo', model: 'veo-3.1', prompt: 'p', negativePrompt: '', contextAttachments: [],
        aspectRatio: '16:9', cameraSpec: { move: 'static', lensMm: 35 },
        lightingSpec: { palette: [], keyDirection: 'top', atmosphere: 'clean', exposureMood: 'mid_key' },
        durationSeconds: 8,
      },
    );
    expect(result.status).toBe('completed');
    expect(result.videoPath).toBeTruthy();
    expect(existsSync(result.videoPath!)).toBe(true);
    expect(statSync(result.videoPath!).size).toBe(fakeBuffer.length);
  });
});
