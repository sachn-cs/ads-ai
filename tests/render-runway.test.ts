import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { mkdtempSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const TEMP = mkdtempSync(path.join(tmpdir(), 'cinestudio-runway-'));

vi.setConfig({ testTimeout: 30_000 });

afterEach(() => {
  vi.restoreAllMocks();
});

describe('renderWithRunway', () => {
  beforeEach(() => {
    rmSync(TEMP, { recursive: true, force: true });
    vi.unstubAllGlobals();
  });

  it('fails fast when no apiKey', async () => {
    const { renderWithRunway } = await import('@/src/providers/render/runway');
    const result = await renderWithRunway(
      { apiKey: '', model: 'gen3a_turbo', artifactDir: TEMP },
      {
        shotId: 's1', provider: 'runway', model: 'gen3a_turbo', prompt: 'p', negativePrompt: '', contextAttachments: [],
        aspectRatio: '16:9', cameraSpec: { move: 'static', lensMm: 35 },
        lightingSpec: { palette: [], keyDirection: 'top', atmosphere: 'clean', exposureMood: 'mid_key' },
        durationSeconds: 8,
      },
    );
    expect(result.status).toBe('failed');
    expect(result.errorMessage).toContain('not set');
  });

  it('returns completed result with downloaded bytes', async () => {
    const fakeBytes = Buffer.from('FAKE_RUNWAY_MP4');
    const calls: { url: string; init?: RequestInit }[] = [];
    const fakeFetch = vi.fn(async (url: string, _init?: RequestInit) => {
      calls.push({ url, init: _init });
      if (url.endsWith('/text_to_video')) {
        return new Response(JSON.stringify({ id: 'task-xyz' }), {
          status: 200, headers: { 'content-type': 'application/json' },
        });
      }
      if (url.endsWith('/tasks/task-xyz')) {
        return new Response(
          JSON.stringify({
            id: 'task-xyz',
            status: 'SUCCEEDED',
            progress: 100,
            output: ['https://cdn.example/runway/result.mp4'],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }
      if (url === 'https://cdn.example/runway/result.mp4') {
        return new Response(fakeBytes, { status: 200 });
      }
      throw new Error(`Unexpected fetch URL in test: ${url}`);
    });
    vi.stubGlobal('fetch', fakeFetch);

    const { renderWithRunway } = await import('@/src/providers/render/runway');
    const result = await renderWithRunway(
      { apiKey: 'rk-test', model: 'gen3a_turbo', artifactDir: TEMP },
      {
        shotId: 's1', provider: 'runway', model: 'gen3a_turbo', prompt: 'p', negativePrompt: '', contextAttachments: [],
        aspectRatio: '16:9', cameraSpec: { move: 'static', lensMm: 35 },
        lightingSpec: { palette: [], keyDirection: 'top', atmosphere: 'clean', exposureMood: 'mid_key' },
        durationSeconds: 5,
      },
    );
    expect(result.status).toBe('completed');
    expect(result.videoPath).toBeTruthy();
    expect(existsSync(result.videoPath!)).toBe(true);
    expect(calls.length).toBe(3); // create, poll, download
    expect(calls[0]?.url).toContain('/text_to_video');
    expect(calls[0]?.init?.method).toBe('POST');
  });

  it('reports failure when Runway returns FAILED', async () => {
    const fakeFetch = vi.fn(async (url: string, _init?: RequestInit) => {
      if (url.endsWith('/text_to_video')) {
        return new Response(JSON.stringify({ id: 'task-bad' }), { status: 200 });
      }
      if (url.endsWith('/tasks/task-bad')) {
        return new Response(
          JSON.stringify({ id: 'task-bad', status: 'FAILED', failure: 'content moderation' }),
          { status: 200 },
        );
      }
      throw new Error(`Unexpected fetch in test: ${url}`);
    });
    vi.stubGlobal('fetch', fakeFetch);
    const { renderWithRunway } = await import('@/src/providers/render/runway');
    const result = await renderWithRunway(
      { apiKey: 'rk-test', model: 'gen3a_turbo', artifactDir: TEMP },
      {
        shotId: 's2', provider: 'runway', model: 'gen3a_turbo', prompt: 'p', negativePrompt: '', contextAttachments: [],
        aspectRatio: '16:9', cameraSpec: { move: 'static', lensMm: 35 },
        lightingSpec: { palette: [], keyDirection: 'top', atmosphere: 'clean', exposureMood: 'mid_key' },
        durationSeconds: 5,
      },
    );
    expect(result.status).toBe('failed');
    expect(result.errorMessage).toContain('content moderation');
  });
});
