import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const MOCK_BRIEF = {
  id: 'brief-1',
  logline: 'A teacher receives a letter.',
  synopsis: 'A teacher in a small coastal town receives a letter from a student she thought she lost. The letter arrives in the final moment of a routine morning.',
  genre: 'narrative_short',
  tone: ['intimate'],
  targetRuntimeSeconds: 60,
  audience: { who: 'indie film fans', where: ['festival'], expectations: ['earned emotion'] },
  creativeNorthStars: ['Earned emotion', 'Cinematographic composition'],
  visualApproach: { primaryHues: ['#3b6e8f'], contrastLevel: 'medium' as const, aspectRatio: '16:9' as const },
  referenceFilms: [],
  avoidances: [],
  mustHaves: [],
  distributionTargets: ['youtube'],
  producedAt: new Date().toISOString(),
};

const MOCK_SCRIPT = {
  id: 'script-1',
  title: 'The Letter',
  logline: MOCK_BRIEF.logline,
  structure: [{ name: 'Setup', sceneRange: [1, 2], tensionDelta: 0.5 }],
  totalEstimatedRuntimeSeconds: 60,
  scenes: [
    { sceneNumber: 1, slugline: 'EXT. DOCK - DAWN', locationId: 'loc-1', beatPurpose: 'arrival', durationSeconds: 30, beats: ['teacher walks to dock'], dialogue: [], voiceover: [], action: 'teacher walks', imagePremise: 'a teacher at a dock', exitState: 'she is at the dock', continuityNotes: [] },
    { sceneNumber: 2, slugline: 'INT. CLASSROOM - DAY', locationId: 'loc-2', beatPurpose: 'letter reveal', durationSeconds: 30, beats: ['letter opened'], dialogue: [], voiceover: [], action: 'opens letter', imagePremise: 'letter on desk', exitState: 'letter opened', continuityNotes: [] },
  ],
  dialogueRatioTarget: 0.3,
  continuityNotes: [],
};

const MOCK_CAST = {
  characters: [{ id: 'c-1', name: 'Teacher', role: 'protagonist', archetype: 'weary mentor', age: '40s', appearance: { wardrobe: ['denim jacket'], visualHook: 'ink-stained cuffs' }, voice: { pace: 'measured', register: 'formal' }, internalWound: 'lost a student', externalWant: 'finds closure', arc: 'opens letter', referenceSeed: 'forty-something woman, bobbed dark hair, denim jacket' }],
  ensembleTension: '',
  visualConsistencyNotes: [],
};

const MOCK_WORLD = {
  id: 'world-1',
  name: 'Coast',
  premise: 'small coastal town',
  rules: ['realistic'],
  locations: [
    { id: 'loc-1', name: 'dock', type: 'exterior', geography: 'coastal', era: 'now', mood: 'quiet', palette: { dominantHues: ['#3b6e8f'], lightDirection: 'low', timeOfDay: 'dawn' }, texture: ['wet wood'], keyProps: ['mailbox'], soundBed: ['gulls'], referenceSeed: 'salt-worn wooden dock at dawn' },
    { id: 'loc-2', name: 'classroom', type: 'interior', geography: 'town', era: 'now', mood: 'quiet', palette: { dominantHues: ['#a37c5b'], lightDirection: 'overhead', timeOfDay: 'morning' }, texture: ['wood'], keyProps: ['desk'], soundBed: ['quiet'], referenceSeed: 'small classroom with wooden desks' },
  ],
  colorWorld: { palette: ['#3b6e8f', '#a37c5b'], paletteShift: 'cool -> warm' },
  recurringVisualMotifs: ['letters', 'windows'],
  soundWorld: { palette: ['quiet'], musicStylistics: ['piano'] },
};

const MOCK_STORYBOARD = {
  id: 'sb-1',
  totalShots: 2,
  totalSeconds: 60,
  pacing: { avgShotSeconds: 30, longestShotSeconds: 30, shortestShotSeconds: 30, cutsPerMinute: 2 },
  shots: [
    { shotId: 'S01-001', sceneNumber: 1, shotNumberInScene: 1, shotType: 'wide', cameraMove: 'static', lensMm: 35, aperture: 'T2.8', durationSeconds: 30, description: 'teacher at dock', action: 'walks', subjectCharacterIds: ['c-1'], propsInFrame: [], soundIntent: 'gulls', storyboardPanelPrompt: 'a teacher at a dock' },
    { shotId: 'S02-002', sceneNumber: 2, shotNumberInScene: 1, shotType: 'close_up', cameraMove: 'push_in', lensMm: 50, aperture: 'T1.8', durationSeconds: 30, description: 'letter opening', action: 'opens', subjectCharacterIds: [], propsInFrame: ['letter'], soundIntent: 'paper crinkle', storyboardPanelPrompt: 'a hand opening a letter' },
  ],
  parallelismNotes: [],
  renderBatches: [
    { batchId: 'b-1', provider: 'veo', styleTag: 'noir-dawn', shotIds: ['S01-001', 'S02-002'], rationale: 'shared dawn palette' },
  ],
};

const MOCK_SHOT_BATCHES = [
  {
    batchId: 'b-1',
    provider: 'veo',
    sharedPromptPrefix: 'Cinematic 35mm shallow DOF, dawn light',
    sharedNegativePrompt: '',
    styleTag: 'noir-dawn',
    shots: [
      { shotId: 'S01-001', provider: 'veo', model: 'veo-3.1', prompt: 'teacher at dock dawn 35mm shallow DOF', negativePrompt: 'no text', aspectRatio: '16:9', cameraSpec: { move: 'static', lensMm: 35, aperture: 'T2.8' }, lightingSpec: { palette: ['#3b6e8f'], keyDirection: 'east', atmosphere: 'sea mist', exposureMood: 'low_key' }, durationSeconds: 30 },
      { shotId: 'S02-002', provider: 'veo', model: 'veo-3.1', prompt: 'letter on desk push-in 50mm', negativePrompt: '', aspectRatio: '16:9', cameraSpec: { move: 'push_in', lensMm: 50 }, lightingSpec: { palette: ['#a37c5b'], keyDirection: 'overhead', atmosphere: 'indoor', exposureMood: 'mid_key' }, durationSeconds: 30 },
    ],
    estimatedCostUnits: 2,
    estimatedDurationSeconds: 60,
  },
];

const MOCK_CONTINUITY: { shotId: string; dimension: string; severity: string; description: string; suggestedFix: string }[] = [];

const MOCK_CRITIQUE = {
  id: 'crit-1',
  totalShotsReviewed: 2,
  goCount: 2,
  conditionalGoCount: 0,
  noGoCount: 0,
  perShot: [
    { shotId: 'S01-001', overallScore: 85, dimensions: [], strengths: ['composition'], weaknesses: [], recommendedFixes: [], decision: 'GO' as const },
    { shotId: 'S02-002', overallScore: 82, dimensions: [], strengths: ['composition'], weaknesses: [], recommendedFixes: [], decision: 'GO' as const },
  ],
  globalObservations: [],
  generatedAt: new Date().toISOString(),
};

const MOCK_COMPOSITE = {
  id: 'comp-1',
  overallScore: 84,
  overallDecision: 'GO' as const,
  passingThreshold: 70,
  shotDecisions: [
    { shotId: 'S01-001', decision: 'GO' as const, score: 85, blockingReasons: [] },
    { shotId: 'S02-002', decision: 'GO' as const, score: 82, blockingReasons: [] },
  ],
  compositeByDimension: {},
  cycleNumber: 1,
  recommendation: 'proceed' as const,
  generatedAt: new Date().toISOString(),
};

const MOCK_ITERATION = {
  id: 'iter-1',
  cycleNumber: 1,
  shotDirectives: [],
  globalStrategy: 'all pass',
  maxCycles: 3,
  shouldContinue: false,
  generatedAt: new Date().toISOString(),
  sourceCritiqueId: 'crit-1',
};

const MOCK_ASSEMBLY = {
  id: 'asm-1',
  editDecisions: [],
  pacing: { totalRuntimeSeconds: 60, beatsPerMinute: 2, emotionalCurve: [], actDistribution: { setupSeconds: 30, confrontationSeconds: 0, resolutionSeconds: 30 } },
  audioBedPlan: { ambience: [], foleyCues: [], musicCues: [], dialogueCues: [] },
  recommendedTools: ['ffmpeg_concat'],
  exportInstructions: 'ffmpeg concat',
};

const MOCK_COLOR = { id: 'color-1', title: 'Mono -> Warm', openingGrade: { name: 'cool', liftRGB: [0, 0, 0.1] as [number, number, number], gammaRGB: [1, 1, 1] as [number, number, number], gainRGB: [1, 1, 1] as [number, number, number], saturation: 0.8, contrast: 1 }, climaxGrade: { name: 'warm', liftRGB: [0.1, 0, 0] as [number, number, number], gammaRGB: [1, 1, 1] as [number, number, number], gainRGB: [1, 1, 1] as [number, number, number], saturation: 1.1, contrast: 1.1 }, resolutionGrade: { name: 'warm', liftRGB: [0.1, 0, 0] as [number, number, number], gammaRGB: [1, 1, 1] as [number, number, number], gainRGB: [1, 1, 1] as [number, number, number], saturation: 1, contrast: 1 }, perSceneOverrides: [], stylisticNotes: [], referenceFilms: [] };

const MOCK_SCORE_PLAN = { id: 'sp-1', overarchingTheme: 'quiet', motif: { name: 'm', instrumentation: ['piano'], intervals: ['p4'] }, cues: [], sonicPalette: ['felt piano'], licensingStrategy: 'original_score' as const };

const MOCK_SOUND = { id: 'sd-1', ambientBeds: [], foleyCues: [], hardEffects: [], silenceMap: [], technicalNotes: ['-23 LUFS broadcast'] };

const MOCK_VOICE = { id: 'vc-1', castingNotes: {}, dialogueCoverage: [] };

const MOCK_DIST = { id: 'dist-1', exports: [], metadata: { title: 'The Letter', synopsis: MOCK_BRIEF.synopsis, tags: [], contentWarnings: [], credits: [{ role: 'Director', name: 'cinestudio (showrunner)' }, { role: 'Screenwriter', name: 'cinestudio (script_writer)' }] }, festivalApplications: [] };

const MOCK_RIGHTS = { id: 'rights-1', overallStatus: 'cleared' as const, issues: [], platformPolicies: [], generatedAt: new Date().toISOString() };

vi.mock('@/src/agents/showrunner', () => ({ invokeShowrunner: vi.fn(async () => MOCK_BRIEF) }));
vi.mock('@/src/agents/script-writer', () => ({ invokeScriptWriter: vi.fn(async () => MOCK_SCRIPT) }));
vi.mock('@/src/agents/character-designer', () => ({ invokeCharacterDesigner: vi.fn(async () => MOCK_CAST) }));
vi.mock('@/src/agents/world-builder', () => ({ invokeWorldBuilder: vi.fn(async () => MOCK_WORLD) }));
vi.mock('@/src/agents/storyboard', () => ({ invokeStoryboard: vi.fn(async () => MOCK_STORYBOARD) }));
vi.mock('@/src/agents/shot-planner', () => ({ invokeShotPlanner: vi.fn(async () => MOCK_SHOT_BATCHES) }));
vi.mock('@/src/agents/render-dispatcher', () => ({
  invokeRenderDispatcher: vi.fn(async (_cfg: unknown, _providers: unknown, instruction: { shotId: string; provider: 'veo' | 'sora' | 'runway'; durationSeconds: number }) => ({
    shotId: instruction.shotId,
    provider: instruction.provider,
    status: 'completed' as const,
    videoPath: `/tmp/${instruction.shotId}.mp4`,
    durationSeconds: instruction.durationSeconds,
    modelUsed: 'stub',
    costUnits: 1,
    attempts: 1,
    completedAt: new Date().toISOString(),
    metadata: { stub: true },
  })),
}));
vi.mock('@/src/agents/continuity-checker', () => ({ invokeContinuityChecker: vi.fn(async () => MOCK_CONTINUITY) }));
vi.mock('@/src/agents/style-guide', () => ({
  invokeStyleGuide: vi.fn(async () => ({
    id: 'sg-1',
    title: 'Noir-Dawn',
    cinematicReferences: ['Aftersun'],
    palette: { primaryHues: ['#3b6e8f', '#a37c5b', '#0a0e12'], accentHues: [], mood: 'cold dawn resolving to warmth' },
    lighting: { keyDirection: 'east', colorTemperature: 'cool', contrastMood: 'medium', shadows: 'soft blue' },
    lensing: { preferredFocalLengthMm: [24, 35, 50, 85], apertureBias: 'medium', movementStyle: 'locked tripod with slow push-ins' },
    grainAndTexture: { grainLevel: 'subtle', stockReference: 'Kodak Vision3 500T', lensCharacter: 'Panavision halation on highlights' },
    referenceImageHints: ['cool dawn palette over weathered wood'],
    globalConstraints: ['no daylight in act 1'],
  })),
}));
vi.mock('@/src/agents/critique', () => ({ invokeCritique: vi.fn(async () => MOCK_CRITIQUE) }));
vi.mock('@/src/agents/iteration-controller', () => ({ invokeIterationController: vi.fn(async () => MOCK_ITERATION) }));
vi.mock('@/src/agents/story-analyst', () => ({ invokeStoryAnalyst: vi.fn(async () => ({ themes: [], beats: [], references: [], structuralNotes: 'mock' })) }));
vi.mock('@/src/agents/costume-designer', () => ({ invokeCostumeDesigner: vi.fn(async () => ({ characters: [] })) }));
vi.mock('@/src/agents/environment-designer', () => ({ invokeEnvironmentDesigner: vi.fn(async () => ({ locations: [] })) }));
vi.mock('@/src/agents/scene-composer', () => ({ invokeSceneComposer: vi.fn(async () => ({ scenes: [] })) }));
vi.mock('@/src/agents/continuity-supervisor', () => ({ invokeContinuitySupervisor: vi.fn(async () => ({ entries: [] })) }));
vi.mock('@/src/agents/transition-designer', () => ({ invokeTransitionDesigner: vi.fn(async () => ({ transitions: [] })) }));
vi.mock('@/src/agents/pacing-analyst', () => ({ invokePacingAnalyst: vi.fn(async () => ({ scenes: [], warnings: [] })) }));
vi.mock('@/src/agents/visual-quality-reviewer', () => ({ invokeVisualQualityReviewer: vi.fn(async () => ({ shots: [], issues: [] })) }));
vi.mock('@/src/agents/production-coordinator', () => ({ invokeProductionCoordinator: vi.fn(async () => ({ blockingIssues: [], unresolvedDependencies: [], nextBestAction: 'continue' })) }));
vi.mock('@/src/agents/scoring', () => ({ invokeScoring: vi.fn(async () => MOCK_COMPOSITE) }));
vi.mock('@/src/agents/editor', () => ({ invokeEditor: vi.fn(async () => MOCK_ASSEMBLY) }));
vi.mock('@/src/agents/colorist', () => ({ invokeColorist: vi.fn(async () => MOCK_COLOR) }));
vi.mock('@/src/agents/composer', () => ({ invokeComposer: vi.fn(async () => MOCK_SCORE_PLAN) }));
vi.mock('@/src/agents/sound-designer', () => ({ invokeSoundDesigner: vi.fn(async () => MOCK_SOUND) }));
vi.mock('@/src/agents/voice-casting', () => ({ invokeVoiceCasting: vi.fn(async () => MOCK_VOICE) }));
vi.mock('@/src/agents/distribution', () => ({ invokeDistribution: vi.fn(async () => MOCK_DIST) }));
vi.mock('@/src/agents/rights-clearance', () => ({ invokeRightsClearance: vi.fn(async () => MOCK_RIGHTS) }));

vi.mock('@/src/providers/factory', () => ({
  buildModel: vi.fn(() => ({
    config: { modelId: 'mock-model' },
    stream: vi.fn(async function* () {
      // dummy stream that yields nothing — invoke() is short-circuited
    }),
  })),
}));

const { emitMock, emitAgentOutputMock } = vi.hoisted(() => ({
  emitMock: vi.fn(),
  emitAgentOutputMock: vi.fn(),
}));
vi.mock('@/src/stream/sinks', () => ({
  emit: emitMock,
  emitAgentOutput: emitAgentOutputMock,
}));

import { buildCinestudioGraph } from '@/src/graph/cinestudio';
import { DEFAULT_CONFIG } from '@/src/types';
import { resetDbForTesting } from '@/src/db/client';

const FAKE_CONFIG = {
  ...DEFAULT_CONFIG,
  textProvider: { ...DEFAULT_CONFIG.textProvider, enabled: true, provider: 'bedrock' as const },
  renderProviders: {
    veo: { ...DEFAULT_CONFIG.renderProviders.veo, enabled: true, model: 'veo-3.1' },
    sora: { ...DEFAULT_CONFIG.renderProviders.sora, enabled: false },
    runway: { ...DEFAULT_CONFIG.renderProviders.runway, enabled: false },
    minimax: { ...DEFAULT_CONFIG.renderProviders.minimax, enabled: false },
  },
};

describe('buildCinestudioGraph - end-to-end pipeline', () => {
  beforeEach(() => {
    resetDbForTesting();
    emitMock.mockClear();
    emitAgentOutputMock.mockClear();
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('invokes the graph and reaches a terminal status', async () => {
    const graph = buildCinestudioGraph(FAKE_CONFIG, 'A teacher receives a letter.', 'test-run-id');
    const result = await graph.invoke('A teacher receives a letter.', {
      invocationState: {
        runId: 'test-run-id',
        config: FAKE_CONFIG,
        userPrompt: 'A teacher receives a letter.',
      },
    });

    expect(result.status).toMatch(/COMPLETED|FAILED/);
    const summary = result.results.map((r) => {
      const nr = r as { nodeId?: string; status?: string };
      return `${nr.nodeId}:${nr.status}`;
    }).join(', ');
    expect(result.results.length, `status=${result.status}, executed: ${summary}`).toBeGreaterThanOrEqual(15);

    // Every executed node should be COMPLETED (the mocks always succeed).
    for (const r of result.results) {
      const nr = r as { nodeId?: string; status?: string };
      expect(nr.status, `${nr.nodeId} should be COMPLETED`).toBe('COMPLETED');
    }
  });

  it('all 17 expected agents appear in results', async () => {
    const graph = buildCinestudioGraph(FAKE_CONFIG, 'logline', 'test-run-2');
    const result = await graph.invoke('logline', {
      invocationState: { runId: 'test-run-2', config: FAKE_CONFIG, userPrompt: 'logline' },
    });
    const seen = new Set<string>();
    for (const r of result.results) {
      const id = (r as { nodeId?: string }).nodeId;
      if (id) seen.add(id);
    }
    const expected = [
      'showrunner', 'script_writer', 'character_designer', 'world_builder',
      'storyboard', 'shot_planner', 'render_dispatch', 'continuity_checker',
      'critique', 'scoring', 'editor', 'colorist', 'composer',
      'sound_designer', 'voice_casting', 'distribution', 'rights_clearance',
    ];
    for (const id of expected) expect(seen, `expected ${id} in results`).toContain(id);
  });
});
