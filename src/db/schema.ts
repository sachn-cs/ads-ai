export const SCHEMA_DDL = [
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
