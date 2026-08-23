import { Agent } from '@strands-agents/sdk';
import { IterationControlReportSchema, type IterationControlReport } from '@/src/models';
import { ITERATION_SYSTEM_PROMPT } from '@/src/prompts';
import { buildModel } from '@/src/providers/factory';
import type { TextProviderConfig } from '@/src/types';
import type { CritiqueReport, CompositeQualityReport } from '@/src/models';

export const iterationSpec = {
  id: 'iteration_controller',
  description:
    'Iteration controller. Converts a critique into surgical per-shot directives preserving passing shots.',
  systemPrompt: ITERATION_SYSTEM_PROMPT,
};

export interface IterationInput {
  critique: CritiqueReport;
  composite: CompositeQualityReport;
  cycleNumber: number;
  maxCycles: number;
}

export async function invokeIterationController(
  cfg: TextProviderConfig,
  input: IterationInput,
): Promise<IterationControlReport> {
  const agent = new Agent({
    id: iterationSpec.id,
    description: iterationSpec.description,
    systemPrompt: iterationSpec.systemPrompt,
    model: buildModel({ ...cfg, temperature: 0.55 }),
    printer: false,
  });
  const prompt = [
    `Cycle ${input.cycleNumber} of max ${input.maxCycles}.`,
    '\nCRITIQUE REPORT:',
    JSON.stringify(input.critique, null, 2),
    '\nCOMPOSITE QUALITY REPORT:',
    JSON.stringify(input.composite, null, 2),
    '\nProduce an IterationControlReport. shouldContinue=false iff all shots are GO or max cycles hit.',
  ].join('\n');
  const result = await agent.invoke(prompt, {
    structuredOutputSchema: IterationControlReportSchema,
  });
  return IterationControlReportSchema.parse(result.structuredOutput);
}
