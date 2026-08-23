import { describe, it, expect } from 'vitest';
import {
  QualityDecisionEnum,
  ToneEnum,
  GenreEnum,
  AspectRatioEnum,
  EvaluationDimensionEnum,
} from '@/src/models';

describe('quality decision enum parity', () => {
  it('uses NO_GO not NO-GO', () => {
    expect(QualityDecisionEnum.options).toContain('NO_GO');
    expect(QualityDecisionEnum.options).not.toContain('NO-GO');
    expect(QualityDecisionEnum.options).toContain('GO');
    expect(QualityDecisionEnum.options).toContain('CONDITIONAL_GO');
  });

  it('all tone values are lowercase', () => {
    for (const t of ToneEnum.options) expect(t).toBe(t.toLowerCase());
  });

  it('all genres are snake_case', () => {
    for (const g of GenreEnum.options) {
      expect(g).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });

  it('all evaluation dimensions are snake_case', () => {
    for (const d of EvaluationDimensionEnum.options) {
      expect(d).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });

  it('aspect ratios are valid "N:M" strings', () => {
    for (const a of AspectRatioEnum.options) expect(a).toMatch(/^\d+:\d+$/);
  });
});
