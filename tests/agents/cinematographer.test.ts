import { describe, it, expect, beforeEach } from 'vitest';
import {
  upsertAgentState,
  listAgentStatesForRun,
  appendAgentHistory,
  appendAgentWarning,
  setAgentConfidence,
  getAgentStateByRunAndAgent,
} from '@/src/db/agent-state';
import { resetDbForTesting, getDb } from '@/src/db/client';

function ensureRun(runId: string) {
  getDb()
    .prepare(`INSERT OR IGNORE INTO runs (id, status, prompt, created_at, updated_at) VALUES (?, 'running', 'test', ?, ?)`)
    .run(runId, new Date().toISOString(), new Date().toISOString());
}

describe('Cinematographer agent state', () => {
  beforeEach(() => {
    resetDbForTesting();
    ensureRun('run-1');
    ensureRun('run-2');
  });

  it('upserts and reads agent_state', () => {
    const s = upsertAgentState({
      runId: 'run-1',
      agentId: 'cinematographer',
      role: 'Cinematographer',
      currentTask: 'Plan camera language for scene 1',
      state: 'running',
      confidence: 0.8,
    });
    expect(s.agentId).toBe('cinematographer');
    expect(s.confidence).toBe(0.8);

    const fetched = getAgentStateByRunAndAgent('run-1', 'cinematographer');
    expect(fetched?.id).toBe(s.id);
  });

  it('appends history and warnings', () => {
    upsertAgentState({
      runId: 'run-1',
      agentId: 'cinematographer',
      state: 'running',
    });
    appendAgentHistory('run-1', 'cinematographer', 'started', { foo: 1 });
    appendAgentWarning('run-1', 'cinematographer', 'lens conflict in scene 2');
    setAgentConfidence('run-1', 'cinematographer', 0.42);
    const s = getAgentStateByRunAndAgent('run-1', 'cinematographer')!;
    expect(s.history.length).toBe(1);
    expect(s.warnings).toContain('lens conflict in scene 2');
    expect(s.confidence).toBe(0.42);
  });

  it('lists agent_states for a run', () => {
    upsertAgentState({ runId: 'run-1', agentId: 'cinematographer', state: 'done' });
    upsertAgentState({ runId: 'run-1', agentId: 'scene_editor', state: 'done' });
    const list = listAgentStatesForRun('run-1');
    expect(list.length).toBe(2);
  });
});
