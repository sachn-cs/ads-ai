import { describe, it, expect } from 'vitest';
import { _internal } from '@/src/providers/minimax/video';

describe('MiniMax video V2 contract', () => {
  it('rejects t2va without explicit ratio', () => {
    expect(_internal.clampRatio(undefined, 't2va')).toBe('16:9');
  });
  it('accepts adaptive ratio for i2va', () => {
    expect(_internal.clampRatio('21:9', 'i2va')).toBe('adaptive');
  });
  it('accepts adaptive ratio for r2va', () => {
    expect(_internal.clampRatio('adaptive', 'r2va')).toBe('adaptive');
  });
  it('rejects invalid t2va ratio', () => {
    expect(_internal.clampRatio('99:1' as unknown as '16:9', 't2va')).toBe('16:9');
  });
  it('clamps duration into 4..15', () => {
    expect(_internal.clampDuration(2)).toBe(4);
    expect(_internal.clampDuration(20)).toBe(15);
    expect(_internal.clampDuration(7)).toBe(7);
  });
  it('clamps resolution to valid set', () => {
    expect(_internal.clampResolution('2K')).toBe('2K');
    expect(_internal.clampResolution('768P')).toBe('768P');
    expect(_internal.clampResolution(undefined)).toBe('768P');
    expect(_internal.clampResolution('4K' as unknown as '2K')).toBe('768P');
  });
  it('detects i2va when first_frame is set', () => {
    expect(_internal.detectMode({ shotId: 's1', prompt: 'p', firstFrame: { url: 'x' } })).toBe('i2va');
  });
  it('detects r2va when reference_image is set', () => {
    expect(
      _internal.detectMode({
        shotId: 's1',
        prompt: 'p',
        referenceImages: [{ url: 'x' }],
      }),
    ).toBe('r2va');
  });
  it('detects t2va when no attachments', () => {
    expect(_internal.detectMode({ shotId: 's1', prompt: 'p' })).toBe('t2va');
  });
});
