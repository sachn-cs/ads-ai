import { randomBytes } from 'node:crypto';

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function ulid(): string {
  const time = Date.now();
  let timePart = '';
  let t = time;
  for (let i = 9; i >= 0; i--) {
    timePart += ALPHABET[t % 32];
    t = Math.floor(t / 32);
  }
  timePart = timePart.split('').reverse().join('');
  let randPart = '';
  const bytes = randomBytes(16);
  for (let i = 0; i < 16; i++) {
    const b = bytes[i];
    if (b !== undefined) randPart += ALPHABET[b % 32];
  }
  return timePart + randPart;
}

export function shortId(): string {
  return ulid().slice(-8).toLowerCase();
}
