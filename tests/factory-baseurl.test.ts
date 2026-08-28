import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('factory default baseUrl', () => {
  it('does not reference the typo api.minimax.chat', () => {
    const src = readFileSync(
      path.resolve(process.cwd(), 'src/providers/factory.ts'),
      'utf8',
    );
    expect(src).not.toMatch(/api\.minimax\.chat/);
  });

  it('falls back to api.minimax.io for OpenAI-compatible text path', () => {
    const src = readFileSync(
      path.resolve(process.cwd(), 'src/providers/factory.ts'),
      'utf8',
    );
    expect(src).toMatch(/api\.minimax\.io\/v1/);
  });

  it('every minimax provider uses api.minimax.io (or its anthropic subpath)', () => {
    const providers = [
      'src/providers/minimax/shared.ts',
      'src/providers/minimax/text.ts',
      'src/providers/minimax/image.ts',
      'src/providers/minimax/speech.ts',
      'src/providers/minimax/music.ts',
      'src/providers/minimax/video.ts',
      'src/providers/minimax/upload.ts',
    ];
    for (const p of providers) {
      const src = readFileSync(path.resolve(process.cwd(), p), 'utf8');
      expect(src).not.toMatch(/api\.minimax\.chat/);
      expect(src, p).toMatch(/api\.minimax\.io/);
    }
  });
});