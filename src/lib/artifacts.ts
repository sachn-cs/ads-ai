import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export interface ArtifactRoots {
  dataDir: string;
  artifactDir: string;
  cacheDir: string;
}

export function resolveRoots(cwd: string = process.cwd()): ArtifactRoots {
  const dataDir = path.resolve(
    cwd,
    process.env.CINESTUDIO_DATA_DIR ?? './data',
  );
  const artifactDir = path.resolve(
    cwd,
    process.env.CINESTUDIO_ARTIFACT_DIR ?? './artifacts',
  );
  const cacheDir = path.join(dataDir, 'cache');
  for (const dir of [dataDir, artifactDir, cacheDir]) {
    mkdirSync(dir, { recursive: true });
  }
  return { dataDir, artifactDir, cacheDir };
}

export function ensureDir(dir: string): string {
  /* turbopackIgnore */
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

export function runDir(artifactDir: string, runId: string): string {
  return ensureDir(path.join(artifactDir, 'runs', runId));
}

export function writeJson(filepath: string, value: unknown): void {
  ensureDir(path.dirname(filepath));
  writeFileSync(filepath, JSON.stringify(value, null, 2));
}

export function fileUrl(p: string): string {
  return `file://${path.resolve(p)}`;
}
