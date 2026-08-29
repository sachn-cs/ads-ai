# Continuity

Cinestudio's continuity system is a first-class feature, not a JSON blob.

## Kinds

| Kind | Examples |
|------|----------|
| `wardrobe` | outfit mismatch between scenes, color drift, missing layer |
| `object` | prop disappears, appears without setup, breaks screen direction |
| `spatial` | screen-left / screen-right orientation, eyeline mismatch |
| `emotional` | tone shift without cause, payoff missing |
| `temporal` | time-of-day jump, weather jump, age inconsistency |

## Severity

`info` — note for writer's awareness
`warn` — likely to register with careful viewer
`error` — likely to register with any viewer; should be fixed before render

## How the supervisor detects gaps

The Continuity Supervisor (`src/agents/continuity-supervisor.ts`) reads the Storyboard and emits structured entries:

```ts
{
  kind: 'wardrobe' | 'object' | 'spatial' | 'emotional' | 'temporal',
  severity: 'info' | 'warn' | 'error',
  sceneId?: string,
  shotId?: string,
  characterId?: string,
  message: string,
}
```

These are written to the `continuity_log` table via `createContinuityEntry()` (`src/db/continuity-log.ts`).

The Continuity fan-out (Transition + Pacing + Visual Quality) reads the same log.

## Resolution

`resolveContinuityEntry(id)` flips `resolved = 1`. The Continuity page filters by resolved/unresolved, severity, kind, scene, shot, character.

## Page

`/dashboard/productions/[id]/continuity` — kanban-style list with filters. Each entry links to the offending shot.
