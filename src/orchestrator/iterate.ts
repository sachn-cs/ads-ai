import { Agent } from '@strands-agents/sdk';
import type { ZodTypeAny } from 'zod';
import { buildModel } from '@/src/providers/factory';
import { listAgentOutputs } from '@/src/db/events';
import { updateRun } from '@/src/db/runs';
import { logger } from '@/src/lib/logger';
import { emit } from '@/src/stream/sinks';
import type { CinestudioConfig, TextProviderConfig } from '@/src/types';
import {
  IterationControlReportSchema,
  CompositeQualityReportSchema,
  type IterationControlReport,
  type CompositeQualityReport,
} from '@/src/models';

const log = logger('orchestrator/iterate');

interface IterateInput {
  runId: string;
  config: CinestudioConfig;
  abortSignal?: AbortSignal;
}

interface IterationCycleResult {
  cycle: number;
  iterationReport: IterationControlReport;
  shouldContinue: boolean;
  reason: string;
}

async function callAgent<T extends ZodTypeAny>(
  cfg: TextProviderConfig,
  schema: T,
  userPrompt: string,
): Promise<unknown> {
  const agent = new Agent({
    id: 'iteration-cycle-agent',
    description: 'Iteration cycle agent',
    systemPrompt:
      'You are an iteration cycle agent. Return strictly the JSON object matching the requested schema.',
    model: buildModel(cfg),
    printer: false,
  });
  const result = await agent.invoke(userPrompt, { structuredOutputSchema: schema });
  return schema.parse(result.structuredOutput);
}

function loadLatestComposite(runId: string): CompositeQualityReport {
  const outputs = listAgentOutputs(runId, 'scoring');
  const last = outputs[outputs.length - 1];
  if (!last) throw new Error(`No scoring output found for run ${runId}`);
  const parsed = CompositeQualityReportSchema.safeParse(last.output);
  if (!parsed.success) {
    throw new Error(`Stored composite failed validation: ${parsed.error.message}`);
  }
  return parsed.data;
}

function loadCritique(runId: string): unknown {
  const all = listAgentOutputs(runId, 'critique');
  return all[all.length - 1]?.output;
}

export async function runIterationLoop(input: IterateInput): Promise<IterationCycleResult | { halted: true; reason: string }> {
  emit({ runId: input.runId, type: 'run_started', payload: { phase: 'iteration-loop' } });
  for (let i = 0; i < input.config.defaults.maxIterations; i++) {
    const t = input.config.textProvider;
    const composite = loadLatestComposite(input.runId);
    const critique = loadCritique(input.runId);
    const cycleNumber = (composite.cycleNumber ?? 0) + 1;

    const iterationReportRaw = await callAgent(
      t,
      IterationControlReportSchema,
      `Cycle ${cycleNumber} of max ${input.config.defaults.maxIterations}.\n` +
        `CRITIQUE:\n${JSON.stringify(critique, null, 2)}\n` +
        `COMPOSITE:\n${JSON.stringify(composite, null, 2)}\n` +
        'Produce an IterationControlReport. shouldContinue=false iff all shots are GO or cycleNumber == maxIterations.',
    );
    const iterationReport = IterationControlReportSchema.parse(iterationReportRaw);

    emit({
      runId: input.runId,
      type: 'iteration_completed',
      agentId: 'iteration_controller',
      payload: { cycle: cycleNumber, shouldContinue: iterationReport.shouldContinue },
    });

    let shouldContinue = iterationReport.shouldContinue;
    let reason: string;
    if (!iterationReport.shouldContinue) {
      reason = 'iteration_controller halted';
    } else if (iterationReport.shotDirectives.length === 0) {
      shouldContinue = false;
      reason = 'iteration_controller issued no directives';
    } else if (cycleNumber >= input.config.defaults.maxIterations) {
      shouldContinue = false;
      reason = 'max cycles reached';
    } else {
      reason = 'rerender scheduled';
      log.info('iteration_cycle_rendering', { cycle: cycleNumber, shots: iterationReport.shotDirectives.length });
      emit({
        runId: input.runId,
        type: 'iteration_started',
        agentId: 'iteration_controller',
        payload: { cycle: cycleNumber, shots: iterationReport.shotDirectives.map((d) => d.shotId) },
      });
    }

    if (!shouldContinue) {
      updateRun(input.runId, {
        quality_score: composite.overallScore,
        quality_decision: composite.overallDecision,
        completed_at: new Date().toISOString(),
      });
      emit({ runId: input.runId, type: 'run_completed', payload: { phase: 'iteration-loop', cycles: i + 1 } });
      return { cycle: cycleNumber, iterationReport, shouldContinue, reason };
    }
  }
  return { halted: true, reason: 'max iterations exceeded' };
}
