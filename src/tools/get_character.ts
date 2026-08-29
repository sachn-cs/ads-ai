import { getCharacter } from '@/src/db/characters';
import type { Character } from '@/src/db/characters';

export async function toolGetCharacter(id: string): Promise<Character | null> {
  return getCharacter(id);
}
