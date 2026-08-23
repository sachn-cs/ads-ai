export const SCHEMA_DDL: string[] = [
  `CREATE TABLE IF NOT EXISTS configs (
    id TEXT PRIMARY KEY,
    config_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS runs (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    prompt TEXT NOT NULL,
    title TEXT,
    brief_json TEXT,
    cycle_count INTEGER NOT NULL DEFAULT 0,
    total_shots INTEGER NOT NULL DEFAULT 0,
    total_runtime_seconds REAL NOT NULL DEFAULT 0,
    quality_score REAL,
    quality_decision TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    completed_at TEXT,
    artifacts_json TEXT NOT NULL DEFAULT '[]'
  )`,
  `CREATE TABLE IF NOT EXISTS run_artifacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    path TEXT NOT NULL,
    payload_json TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS run_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL,
    ts TEXT NOT NULL,
    type TEXT NOT NULL,
    agent_id TEXT,
    payload_json TEXT NOT NULL,
    FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS agent_outputs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    cycle INTEGER NOT NULL DEFAULT 0,
    output_json TEXT NOT NULL,
    duration_ms INTEGER,
    created_at TEXT NOT NULL,
    FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS ix_runs_status ON runs(status)`,
  `CREATE INDEX IF NOT EXISTS ix_runs_created_at ON runs(created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS ix_run_events_run_id ON run_events(run_id, id)`,
  `CREATE INDEX IF NOT EXISTS ix_agent_outputs_run_id ON agent_outputs(run_id, agent_id)`,
  `CREATE INDEX IF NOT EXISTS ix_run_artifacts_run_id ON run_artifacts(run_id)`,
];

export interface ColumnInfo {
  name: string;
}

export type MigrationSQL = {
  checkApplied: () => boolean;
  apply: () => string;
};

export const MIGRATIONS: Array<{ name: string; sql: MigrationSQL }> = [
  {
    name: '001_add_selected_variant_id',
    sql: {
      checkApplied: () => false,
      apply: () => `ALTER TABLE runs ADD COLUMN selected_variant_id INTEGER`,
    },
  },
  {
    name: '002_create_idea_variants',
    sql: {
      checkApplied: () => false,
      apply: () => `
        CREATE TABLE IF NOT EXISTS idea_variants (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          run_id TEXT NOT NULL,
          variant_index INTEGER NOT NULL,
          variant_json TEXT NOT NULL,
          user_selected INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS ix_idea_variants_run ON idea_variants(run_id);
      `,
    },
  },
  {
    name: '003_create_multimodal_assets',
    sql: {
      checkApplied: () => false,
      apply: () => `
        CREATE TABLE IF NOT EXISTS multimodal_assets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          run_id TEXT NOT NULL,
          agent_id TEXT NOT NULL,
          kind TEXT NOT NULL,
          artifact_id TEXT NOT NULL,
          storage_path TEXT NOT NULL,
          content_type TEXT,
          duration_seconds REAL,
          width INTEGER,
          height INTEGER,
          size_bytes INTEGER,
          provider TEXT,
          model TEXT,
          metadata_json TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS ix_mm_assets_run ON multimodal_assets(run_id);
        CREATE INDEX IF NOT EXISTS ix_mm_assets_kind ON multimodal_assets(kind);
      `,
    },
  },
  {
    name: '004_create_render_jobs',
    sql: {
      checkApplied: () => false,
      apply: () => `
        CREATE TABLE IF NOT EXISTS render_jobs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          run_id TEXT NOT NULL,
          shot_id TEXT NOT NULL,
          provider TEXT NOT NULL,
          model TEXT NOT NULL,
          provider_job_id TEXT,
          status TEXT NOT NULL,
          poll_count INTEGER NOT NULL DEFAULT 0,
          last_polled_at TEXT,
          started_at TEXT NOT NULL,
          completed_at TEXT,
          error TEXT,
          FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS ix_render_jobs_run ON render_jobs(run_id);
        CREATE INDEX IF NOT EXISTS ix_render_jobs_status ON render_jobs(status);
      `,
    },
  },
];
