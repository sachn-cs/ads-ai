# Production model

The **production** is the central object. Every other entity references it.

## Entities

| Entity | Table | Notes |
|--------|-------|-------|
| Production | `productions` | id, title, logline, status (draft / active / archived), current_version, current_run_id, owner_member_id |
| Character | `characters` | per-production cast member with appearance, age_cues, posture, emotional_baseline, visual_markers[] |
| CharacterVersion | `character_versions` | snapshot per revision |
| Location | `locations` | per-production location with weather, time_of_day, texture, architecture, props[], depth_cues |
| Scene | `scenes` | per-production ordered scene with location_id, beat_summary, character_ids[], emotional_intent, pacing |
| Shot | `shots` | per-scene shot with framing, angle, lens, shot_size (W/MS/MCU/CU/ECU/OTS/Insert/Establishing/Tracking), movement, intent, transition_in, transition_out, duration_seconds, prompt |
| Transition | `transitions` | from_shot_id → to_shot_id with type (cut/dissolve/fade/wipe/match/jump/L-cut/J-cut) and continuity_notes |
| ContinuityLog | `continuity_log` | gap entries with kind (wardrobe/object/spatial/emotional/temporal), severity (info/warn/error), resolved flag |
| Knowledge | `knowledge` (+ `knowledge_fts`) | story_bible, character_bible, wardrobe_bible, world_bible, reference, note, rule — FTS5 search |
| Asset | `assets` (+ `asset_tags`, `asset_collections`, `asset_collection_items`) | character_ref, wardrobe_ref, location_ref, prop, moodboard, visual_test, image, video_ref |
| Comment | `comments` | per-entity discussion |
| Version | `versions` | generic snapshots (entity_type, entity_id, version_number, snapshot_json) |
| CopilotThread | `copilot_threads` + `copilot_messages` | production-scoped chat with citations JSON |
| TeamMember | `team_members` | single operator (single-user mode) |
| Invite | `invites` + `acl` | invite tokens + per-production role |
| Run | `runs` (nullable production_id FK) | execution trace; the run is no longer the central object |

## Foreign keys

```
productions  1───*  characters  1───*  character_versions
productions  1───*  locations   1───*  location_versions
productions  1───*  scenes      1───*  scene_versions
productions  1───*  shots (via scene_id)
productions  1───*  transitions
productions  1───*  continuity_log
productions  1───*  knowledge   (FTS-indexed)
productions  1───*  assets      *───*  asset_collections (via asset_collection_items)
productions  1───*  comments
productions  1───*  versions (generic)
productions  1───*  copilot_threads  1───*  copilot_messages
productions  1───*  runs (nullable FK)
```

## Versioning

Every mutation goes through `takeSnapshot(entityType, entityId, snapshot)` in `src/db/versions.ts`. This creates a row in `versions` with `version_number = MAX + 1`. Use `listVersions(productionId, { entityType, entityId })` to read the history.

The same hook is wired into characters, locations, scenes, and shots.

## FTS5

Knowledge search uses SQLite FTS5 (`knowledge_fts` virtual table). `searchKnowledge(productionId, query)` returns ranked matches.
