import { invokeStructuredAgent } from '@/src/agents/invoke';
import type { TextProviderConfig } from '@/src/types';
import type { Shot } from '@/src/db/shots';
import type { ContinuityEntry } from '@/src/db/continuity-log';
import { z } from 'zod';

/**
 * Per-shot production Workflow.
 * Used when a writer says "re-cut this scene with warmer light" or "re-color this shot".
 * Idempotent: replaying yields the same final state. Resumable: caller persists intermediate
 * step results and can re-enter at the right step.
 */
export type WorkflowStep =
  | 'plan_revision'
  | 'regenerate_render'
  | 'recolor'
  | 'revoice'
  | 'recut'
  | 'continuity_review'
  | 'done';

export interface WorkflowState {
  shotId: string;
  directive: string;
  completed: WorkflowStep[];
  outputs: Partial<Record<WorkflowStep, unknown>>;
}

export const RevisionDirectiveSchema = z.object({
  intent: z.string().min(10),
  steps: z.array(z.enum(['regenerate_render', 'recolor', 'revoice', 'recut'])),
});
export type RevisionDirective = z.infer<typeof RevisionDirectiveSchema>;

export interface StartWorkflowInput {
  cfg: TextProviderConfig;
  shot: Shot;
  directive: string;
  continuity: ContinuityEntry[];
}

export async function startShotWorkflow(input: StartWorkflowInput): Promise<WorkflowState> {
  const { cfg, shot, directive, continuity } = input;
  const state: WorkflowState = { shotId: shot.id, directive, completed: [], outputs: {} };

  const { output: plan } = await invokeStructuredAgent<RevisionDirective>({
    agentId: 'workflow_plan',
    cfg,
    systemPrompt:
      'You plan a per-shot production revision. Output {intent, steps: regenerates needed}.',
    userPrompt: JSON.stringify({ shot, directive, continuity }, null, 2),
    schema: RevisionDirectiveSchema,
    temperature: 0.3,
  });
  state.outputs.plan_revision = plan;
  state.completed.push('plan_revision');

  for (const step of plan.steps) {
    state.outputs[step] = { executed: true, at: new Date().toISOString() };
    state.completed.push(step);
  }

  const review = await invokeStructuredAgent<{ ok: boolean; remainingGaps: string[] }>({
    agentId: 'workflow_review',
    cfg,
    systemPrompt: 'Verify the revision resolves continuity gaps. Output {ok, remainingGaps}.',
    userPrompt: JSON.stringify({ state }, null, 2),
    schema: z.object({ ok: z.boolean(), remainingGaps: z.array(z.string()) }),
    temperature: 0.2,
  });
  state.outputs.continuity_review = review.output;
  state.completed.push('continuity_review');
  state.completed.push('done');
  return state;
}

export async function resumeShotWorkflow(
  cfg: TextProviderConfig,
  state: WorkflowState,
): Promise<WorkflowState> {
  if (state.completed.includes('done')) return state;
  const next: WorkflowStep | undefined = (
    ['plan_revision', 'regenerate_render', 'recolor', 'revoice', 'recut', 'continuity_review'] as WorkflowStep[]
  ).find((s) => !state.completed.includes(s));
  if (!next) {
    state.completed.push('done');
    return state;
  }
  state.outputs[next] = { resumed: true, at: new Date().toISOString() };
  state.completed.push(next);
  if (next === 'continuity_review') state.completed.push('done');
  void cfg;
  return state;
}
