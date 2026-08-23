import type Database from 'better-sqlite3';

export interface IdeaVariantRow {
  id: number;
  run_id: string;
  variant_index: number;
  variant_json: string;
  user_selected: number;
  created_at: string;
}

export function insertIdeaVariant(
  db: Database.Database,
  runId: string,
  variantIndex: number,
  variantJson: string,
): number {
  const r = db.prepare(
    `INSERT INTO idea_variants (run_id, variant_index, variant_json, user_selected, created_at)
     VALUES (?, ?, ?, 0, ?)`,
  ).run(runId, variantIndex, variantJson, new Date().toISOString());
  return Number(r.lastInsertRowid);
}

export function listIdeaVariants(db: Database.Database, runId: string): IdeaVariantRow[] {
  return db
    .prepare('SELECT * FROM idea_variants WHERE run_id = ? ORDER BY variant_index')
    .all(runId) as IdeaVariantRow[];
}

export function markIdeaVariantSelected(
  db: Database.Database,
  runId: string,
  variantIndex: number,
): void {
  const tx = db.transaction(() => {
    db.prepare('UPDATE idea_variants SET user_selected = 0 WHERE run_id = ?').run(runId);
    db.prepare(
      'UPDATE idea_variants SET user_selected = 1 WHERE run_id = ? AND variant_index = ?',
    ).run(runId, variantIndex);
    db.prepare('UPDATE runs SET selected_variant_id = ?, updated_at = ? WHERE id = ?').run(
      variantIndex,
      new Date().toISOString(),
      runId,
    );
  });
  tx();
}

export function getSelectedIdeaVariant(
  db: Database.Database,
  runId: string,
): IdeaVariantRow | undefined {
  return db
    .prepare('SELECT * FROM idea_variants WHERE run_id = ? AND user_selected = 1')
    .get(runId) as IdeaVariantRow | undefined;
}
