import type { KnowledgeEntry } from '@/src/db/knowledge';
import { searchKnowledge } from '@/src/db/knowledge';

export interface SearchKnowledgeInput {
  productionId: string;
  query: string;
  limit?: number;
}

export async function toolSearchKnowledge(input: SearchKnowledgeInput): Promise<KnowledgeEntry[]> {
  return searchKnowledge(input.productionId, input.query, input.limit ?? 10);
}
