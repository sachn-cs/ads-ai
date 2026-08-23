# Quality Standards

This document captures the quality bar cinestudio's agents are expected to hit. The
Critic agent measures every shot across these ten dimensions.

## Per-Shot Dimensions (0-100)

| Dimension | Definition | Critical if... |
|-----------|------------|-----------------|
| `visual_clarity` | Image legibility, color readability, motion clarity | Score < 50 |
| `narrative_coherence` | Does the shot land its promised beat? | Score < 50 |
| `pacing` | Is the duration right for the beat? | Duration off by > 50% |
| `cinematography` | Composition, lens, lighting, camera work | Visible AI giveaway |
| `audio_quality` | Sync, mix, VO quality | Audible artifacts |
| `continuity` | Cross-shot consistency | Character/location mismatch |
| `performance` | Character expression, blocking, intent | Unreadable emotion |
| `tone_alignment` | Matches the brief's tone | Tone break |
| `platform_fit` | Fits distribution targets | Violates platform policy |
| `shot_realism` | Physical plausibility | Visible AI giveaway |

A score < 50 in any dimension OR any "criticalIssue" boolean set forces the shot's
decision to NO_GO regardless of the weighted overall score.

## Decision Rules

| Decision | Trigger |
|----------|---------|
| `GO` | overallScore ≥ 80 AND no criticalIssue |
| `CONDITIONAL_GO` | overallScore ≥ 70 AND critical-lift ≤ 5 pts |
| `NO_GO` | overallScore < 70 OR any criticalIssue |

## Composite Rules

- Trimmed mean across shot scores (drop best + worst if ≥ 6 shots)
- `recommendation = 'proceed'` if overallScore ≥ 0.95 × qualityThreshold
- `recommendation = 'halt'` if any blocker
- `recommendation = 'iterate'` otherwise

## Iteration Discipline

The IterationController must:

- Issue **zero** edits to GO shots (preserve verbatim)
- Issue **1-3** specific surgical edits per failing shot (not sweeping rewrites)
- Specify what to **preserve** (palette, character ref, audio cues)
- Set `shouldContinue = false` when all shots are GO OR `cycleNumber == maxCycles`

Vague directives like "make it look better" are rejected. Specific directives like
"increase key-light intensity 30%, switch lens 35mm → 50mm" are accepted.

## Brand Safety

Cinestudio never produces content with:

- Real-person likeness (characters always use non-real `referenceSeed`)
- Trademarked logos without rights clearance (rights_clearance agent gates this)
- Deadline-fabricated festival entries (distribution_agent leaves fields empty
  when uncertain)
- Platform-policy violations for the configured distribution targets
