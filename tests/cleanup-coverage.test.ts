import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const DELETED_MODULES = [
  'src/providers/minimax/upload.ts',
  'src/providers/factory.ts',
  'src/agents/factory.ts',
  'src/agents/iteration-controller.ts',
];

const FORBIDDEN_REFS = [
  'setAgentFactoryContext',
  'MINIMAX_TEXT_BASE_URL',
  'renderDispatcherSpec',
  'makeRenderTool',
  'void ({} as NodeDefinition)',
  'void _invocationState',
  'api.minimax.chat',
];

function walk(dir: string, exclude: string[] = ['node_modules', '.next', 'tests']): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (exclude.includes(entry.name) || entry.name.startsWith('.')) continue;
      out.push(...walk(full, exclude));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

describe('Cleanup coverage', () => {
  it('deleted modules are not reintroduced', () => {
    const root = path.resolve(process.cwd());
    const all = walk(root);
    for (const m of DELETED_MODULES) {
      const abs = path.join(root, m);
      expect(all).not.toContain(abs);
    }
  });

  it('forbidden identifiers are gone', () => {
    const root = path.resolve(process.cwd());
    const files = walk(root);
    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      for (const forbidden of FORBIDDEN_REFS) {
        expect(src, f).not.toMatch(new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      }
    }
  });
});
