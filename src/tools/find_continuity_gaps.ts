import { listContinuity, type ContinuityEntry } from '@/src/db/continuity-log';

export interface FindContinuityGapsInput {
  productionId: string;
  severity?: 'info' | 'warn' | 'error';
  resolved?: boolean;
}

export async function toolFindContinuityGaps(
  input: FindContinuityGapsInput,
): Promise<ContinuityEntry[]> {
  return listContinuity(input.productionId, {
    severity: input.severity,
    resolved: input.resolved,
  });
}
