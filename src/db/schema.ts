export const SCHEMA_DDL: string[] = [
  `CREATE TABLE IF NOT EXISTS configs (
    id TEXT PRIMARY KEY,
    config_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS migrations (
    name TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL
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
    artifacts_json TEXT NOT NULL DEFAULT '[]',
    production_id TEXT
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
  `CREATE INDEX IF NOT EXISTS ix_runs_production_id ON runs(production_id)`,
  `CREATE INDEX IF NOT EXISTS ix_run_events_run_id ON run_events(run_id, id)`,
  `CREATE INDEX IF NOT EXISTS ix_agent_outputs_run_id ON agent_outputs(run_id, agent_id)`,
  `CREATE INDEX IF NOT EXISTS ix_run_artifacts_run_id ON run_artifacts(run_id)`,

  /* ===== productions ===== */
  `CREATE TABLE IF NOT EXISTS productions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    logline TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'draft',
    current_version INTEGER NOT NULL DEFAULT 1,
    current_run_id TEXT,
    owner_member_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS ix_productions_status ON productions(status)`,
  `CREATE INDEX IF NOT EXISTS ix_productions_updated_at ON productions(updated_at DESC)`,

  /* ===== characters ===== */
  `CREATE TABLE IF NOT EXISTS characters (
    id TEXT PRIMARY KEY,
    production_id TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'supporting',
    appearance TEXT NOT NULL DEFAULT '',
    age_cues TEXT,
    posture TEXT,
    emotional_baseline TEXT,
    relationship_state TEXT,
    screen_time_notes TEXT,
    visual_markers_json TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (production_id) REFERENCES productions(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS character_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    snapshot_json TEXT NOT NULL,
    created_by TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS ix_characters_production ON characters(production_id)`,
  `CREATE INDEX IF NOT EXISTS ix_character_versions_char ON character_versions(character_id, version_number)`,

  /* ===== locations ===== */
  `CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY,
    production_id TEXT NOT NULL,
    name TEXT NOT NULL,
    weather TEXT,
    time_of_day TEXT,
    texture TEXT,
    architecture TEXT,
    props_json TEXT NOT NULL DEFAULT '[]',
    spatial_density TEXT,
    background_activity TEXT,
    atmosphere TEXT,
    color_behavior TEXT,
    depth_cues TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (production_id) REFERENCES productions(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS location_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    snapshot_json TEXT NOT NULL,
    created_by TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS ix_locations_production ON locations(production_id)`,

  /* ===== scenes ===== */
  `CREATE TABLE IF NOT EXISTS scenes (
    id TEXT PRIMARY KEY,
    production_id TEXT NOT NULL,
    number INTEGER NOT NULL,
    title TEXT NOT NULL,
    location_id TEXT,
    beat_summary TEXT NOT NULL DEFAULT '',
    character_ids_json TEXT NOT NULL DEFAULT '[]',
    emotional_intent TEXT,
    pacing TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (production_id) REFERENCES productions(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS scene_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scene_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    snapshot_json TEXT NOT NULL,
    created_by TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS ix_scenes_production ON scenes(production_id, order_index)`,

  /* ===== shots ===== */
  `CREATE TABLE IF NOT EXISTS shots (
    id TEXT PRIMARY KEY,
    scene_id TEXT NOT NULL,
    production_id TEXT NOT NULL,
    number INTEGER NOT NULL,
    framing TEXT NOT NULL DEFAULT '',
    angle TEXT NOT NULL DEFAULT '',
    lens TEXT NOT NULL DEFAULT '',
    shot_size TEXT NOT NULL DEFAULT 'MS',
    movement TEXT NOT NULL DEFAULT '',
    intent TEXT NOT NULL DEFAULT '',
    visual_emphasis TEXT,
    subject_placement TEXT,
    background_depth TEXT,
    environment_notes TEXT,
    continuity_notes TEXT,
    emotional_intent TEXT,
    transition_in TEXT,
    transition_out TEXT,
    duration_seconds REAL NOT NULL DEFAULT 5,
    prompt TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE,
    FOREIGN KEY (production_id) REFERENCES productions(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS shot_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shot_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    snapshot_json TEXT NOT NULL,
    created_by TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (shot_id) REFERENCES shots(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS ix_shots_scene ON shots(scene_id, order_index)`,
  `CREATE INDEX IF NOT EXISTS ix_shots_production ON shots(production_id)`,

  /* ===== transitions ===== */
  `CREATE TABLE IF NOT EXISTS transitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    production_id TEXT NOT NULL,
    from_shot_id TEXT,
    to_shot_id TEXT,
    type TEXT NOT NULL,
    intent TEXT NOT NULL DEFAULT '',
    continuity_notes TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (production_id) REFERENCES productions(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS ix_transitions_production ON transitions(production_id)`,

  /* ===== continuity_log ===== */
  `CREATE TABLE IF NOT EXISTS continuity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    production_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'info',
    scene_id TEXT,
    shot_id TEXT,
    character_id TEXT,
    message TEXT NOT NULL,
    resolved INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (production_id) REFERENCES productions(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS ix_continuity_log_production ON continuity_log(production_id, severity)`,
  `CREATE INDEX IF NOT EXISTS ix_continuity_log_unresolved ON continuity_log(production_id, resolved)`,

  /* ===== knowledge (with FTS5) ===== */
  `CREATE TABLE IF NOT EXISTS knowledge (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    production_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    tags_json TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (production_id) REFERENCES productions(id) ON DELETE CASCADE
  )`,
  `CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_fts USING fts5(
    title, body, content='knowledge', content_rowid='id', tokenize='porter unicode61'
  )`,
  `CREATE INDEX IF NOT EXISTS ix_knowledge_production ON knowledge(production_id, kind)`,

  /* ===== assets ===== */
  `CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    production_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    title TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    content_type TEXT,
    duration_seconds REAL,
    width INTEGER,
    height INTEGER,
    size_bytes INTEGER,
    metadata_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL,
    FOREIGN KEY (production_id) REFERENCES productions(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS asset_tags (
    asset_id TEXT NOT NULL,
    tag TEXT NOT NULL,
    PRIMARY KEY (asset_id, tag),
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS asset_collections (
    id TEXT PRIMARY KEY,
    production_id TEXT NOT NULL,
    name TEXT NOT NULL,
    kind TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (production_id) REFERENCES productions(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS asset_collection_items (
    collection_id TEXT NOT NULL,
    asset_id TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (collection_id, asset_id),
    FOREIGN KEY (collection_id) REFERENCES asset_collections(id) ON DELETE CASCADE,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS ix_assets_production ON assets(production_id, kind)`,
  `CREATE INDEX IF NOT EXISTS ix_asset_tags_tag ON asset_tags(tag)`,

  /* ===== comments ===== */
  `CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    production_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    author TEXT NOT NULL,
    body TEXT NOT NULL,
    resolved INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (production_id) REFERENCES productions(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS ix_comments_production ON comments(production_id, entity_type, entity_id)`,

  /* ===== agent_state ===== */
  `CREATE TABLE IF NOT EXISTS agent_state (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL,
    production_id TEXT,
    agent_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT '',
    current_task TEXT NOT NULL DEFAULT '',
    state TEXT NOT NULL DEFAULT 'pending',
    inputs_json TEXT NOT NULL DEFAULT '{}',
    outputs_json TEXT NOT NULL DEFAULT '{}',
    dependencies_json TEXT NOT NULL DEFAULT '[]',
    confidence REAL NOT NULL DEFAULT 0,
    warnings_json TEXT NOT NULL DEFAULT '[]',
    history_json TEXT NOT NULL DEFAULT '[]',
    started_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS ix_agent_state_run ON agent_state(run_id, agent_id)`,
  `CREATE INDEX IF NOT EXISTS ix_agent_state_production ON agent_state(production_id, updated_at DESC)`,

  /* ===== versions ===== */
  `CREATE TABLE IF NOT EXISTS versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    production_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    snapshot_json TEXT NOT NULL,
    note TEXT,
    created_by TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (production_id) REFERENCES productions(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS ix_versions_entity ON versions(entity_type, entity_id, version_number)`,

  /* ===== copilot ===== */
  `CREATE TABLE IF NOT EXISTS copilot_threads (
    id TEXT PRIMARY KEY,
    production_id TEXT NOT NULL,
    title TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (production_id) REFERENCES productions(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS copilot_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    citations_json TEXT NOT NULL DEFAULT '[]',
    agent_id TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (thread_id) REFERENCES copilot_threads(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS ix_copilot_threads_production ON copilot_threads(production_id, updated_at DESC)`,
  `CREATE INDEX IF NOT EXISTS ix_copilot_messages_thread ON copilot_messages(thread_id, created_at)`,

  /* ===== team ===== */
  `CREATE TABLE IF NOT EXISTS team_members (
    id TEXT PRIMARY KEY,
    role TEXT NOT NULL DEFAULT 'owner',
    name TEXT NOT NULL,
    email TEXT,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS invites (
    id TEXT PRIMARY KEY,
    production_id TEXT,
    token TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'editor',
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT,
    accepted_at TEXT,
    FOREIGN KEY (production_id) REFERENCES productions(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS acl (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    production_id TEXT NOT NULL,
    member_id TEXT NOT NULL,
    role TEXT NOT NULL,
    FOREIGN KEY (production_id) REFERENCES productions(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES team_members(id) ON DELETE CASCADE
  )`,
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
  {
    name: '005_create_productions',
    sql: {
      checkApplied: () => false,
      apply: () => `SELECT 1`,
    },
  },
];
