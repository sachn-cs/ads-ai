import { getShot } from '@/src/db/shots';
import type { Shot } from '@/src/db/shots';

export async function toolGetShot(id: string): Promise<Shot | null> {
  return getShot(id);
}
