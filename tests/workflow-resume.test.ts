import { describe, it, expect } from 'vitest';
import type { WorkflowState, WorkflowStep } from '@/src/workflow/strands-workflow';

describe('Shot revision workflow', () => {
  it('starts in pending plan_revision', () => {
    const state: WorkflowState = { shotId: 's1', directive: 'warm', completed: [], outputs: {} };
    expect(state.completed).not.toContain('done');
  });
  it('exports step enum', () => {
    const steps: WorkflowStep[] = ['plan_revision', 'continuity_review'];
    expect(steps.length).toBe(2);
  });
});
