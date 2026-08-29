import { getScene } from '@/src/db/scenes';
import type { Scene } from '@/src/db/scenes';

export async function toolGetScene(id: string): Promise<Scene | null> {
  return getScene(id);
}
