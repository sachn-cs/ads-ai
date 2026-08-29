import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('MiniMax providers reference api.minimax.io', () => {
  const providers = [
    'src/providers/minimax/text.ts',
    'src/providers/minimax/image.ts',
    'src/providers/minimax/speech.ts',
    'src/providers/minimax/music.ts',
    'src/providers/minimax/video.ts',
    'src/providers/minimax/files.ts',
  ];

  for (const p of providers) {
    const src = readFileSync(path.resolve(process.cwd(), p), 'utf8');
    it(`${p} does not reference api.minimax.chat`, () => {
      expect(src).not.toMatch(/api\.minimax\.chat/);
    });
    it(`${p} references api.minimax.io`, () => {
      expect(src).toMatch(/api\.minimax\.io/);
    });
  }

  it('no V1 path remains in MiniMax video provider', () => {
    const src = readFileSync(
      path.resolve(process.cwd(), 'src/providers/minimax/video.ts'),
      'utf8',
    );
    expect(src).not.toMatch(/\/v1\/video/);
    expect(src).toMatch(/\/v2\/video_generation/);
  });
});
