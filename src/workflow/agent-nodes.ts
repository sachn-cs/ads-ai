import type {
  CinestudioBrief,
  ScorePlan,
  ScriptBreakdown,
  SoundDesignPlan,
  AssemblyPlan,
  RightsReport,
  CharacterCast,
  VoiceCast,
  DistributionPackage,
  CompositeQualityReport,
  ColorGradeDirection,
  WorldDesign,
  Storyboard,
  ShotRenderResult,
  RenderBatchPlan,
  CritiqueReport,
} from '@/src/models';
import type { CinestudioConfig } from '@/src/types';
import type { StateStore } from '@strands-agents/sdk';
import { AgentNode } from './agent-node';
import {
  invokeShowrunner,
} from '@/src/agents/showrunner';
import {
  invokeScriptWriter,
} from '@/src/agents/script-writer';
import {
  invokeCharacterDesigner,
} from '@/src/agents/character-designer';
import {
  invokeWorldBuilder,
} from '@/src/agents/world-builder';
import {
  invokeStoryboard,
} from '@/src/agents/storyboard';
import {
  invokeShotPlanner,
} from '@/src/agents/shot-planner';
import {
  invokeContinuityChecker,
  type ContinuityIssue,
} from '@/src/agents/continuity-checker';
import {
  invokeCritique,
} from '@/src/agents/critique';
import {
  invokeIterationController,
} from '@/src/agents/iteration-controller';
import {
  invokeScoring,
} from '@/src/agents/scoring';
import {
  invokeEditor,
} from '@/src/agents/editor';
import {
  invokeColorist,
} from '@/src/agents/colorist';
import {
  invokeComposer,
} from '@/src/agents/composer';
import {
  invokeSoundDesigner,
} from '@/src/agents/sound-designer';
import {
  invokeVoiceCasting,
} from '@/src/agents/voice-casting';
import {
  invokeDistribution,
} from '@/src/agents/distribution';
import {
  invokeRightsClearance,
} from '@/src/agents/rights-clearance';
import { IterationControlReportSchema } from '@/src/models';

function read<T>(app: StateStore, key: string): T {
  const v = app.get(key);
  if (v === undefined || v === null) {
    throw new Error(`Missing app state key "${key}" required for downstream agent.`);
  }
  return v as T;
}

function readOptional<T>(app: StateStore, key: string): T | undefined {
  return app.get(key) as T | undefined;
}

export function buildAgentNodes(cfg: CinestudioConfig) {
  const t = cfg.textProvider;

  const showrunner = new AgentNode<CinestudioBrief>({
    id: 'showrunner',
    description: 'Senior creative producer. Synthesizes the CinestudioBrief.',
    runId: '',
    invoke: async (_state, app) => invokeShowrunner(t, read<string>(app, 'originalInput')),
    persistKey: 'brief',
  });

  const scriptWriter = new AgentNode<ScriptBreakdown>({
    id: 'script_writer',
    description: 'Screenwriter.',
    runId: '',
    invoke: async (_state, app) =>
      invokeScriptWriter(t, {
        brief: read<CinestudioBrief>(app, 'brief'),
        previous: readOptional<ScriptBreakdown>(app, 'script'),
        iterationDirective: readOptional<string>(app, 'iterationDirective'),
      }),
    persistKey: 'script',
  });

  const characterDesigner = new AgentNode<CharacterCast>({
    id: 'character_designer',
    description: 'Character designer.',
    runId: '',
    invoke: async (_state, app) =>
      invokeCharacterDesigner(t, {
        brief: read<CinestudioBrief>(app, 'brief'),
        script: read<ScriptBreakdown>(app, 'script'),
      }),
    persistKey: 'cast',
  });

  const worldBuilder = new AgentNode<WorldDesign>({
    id: 'world_builder',
    description: 'World builder.',
    runId: '',
    invoke: async (_state, app) =>
      invokeWorldBuilder(t, {
        brief: read<CinestudioBrief>(app, 'brief'),
        script: read<ScriptBreakdown>(app, 'script'),
        cast: read<CharacterCast>(app, 'cast'),
      }),
    persistKey: 'world',
  });

  const storyboardArtist = new AgentNode<Storyboard>({
    id: 'storyboard',
    description: 'Storyboard.',
    runId: '',
    invoke: async (_state, app) =>
      invokeStoryboard(t, {
        brief: read<CinestudioBrief>(app, 'brief'),
        script: read<ScriptBreakdown>(app, 'script'),
        cast: read<CharacterCast>(app, 'cast'),
        world: read<WorldDesign>(app, 'world'),
        iterationDirective: readOptional<string>(app, 'iterationDirective'),
      }),
    persistKey: 'storyboard',
  });

  const shotPlanner = new AgentNode<RenderBatchPlan[]>({
    id: 'shot_planner',
    description: 'Shot planner.',
    runId: '',
    invoke: async (_state, app) =>
      invokeShotPlanner(t, {
        brief: read<CinestudioBrief>(app, 'brief'),
        script: read<ScriptBreakdown>(app, 'script'),
        cast: read<CharacterCast>(app, 'cast'),
        world: read<WorldDesign>(app, 'world'),
        storyboard: read<Storyboard>(app, 'storyboard'),
        providers: cfg.renderProviders,
      }),
    persistKey: 'shotBatches',
  });

  const continuityChecker = new AgentNode<ContinuityIssue[]>({
    id: 'continuity_checker',
    description: 'Continuity checker.',
    runId: '',
    invoke: async (_state, app) => {
      const renderResults = read<ShotRenderResult[]>(app, 'renderResults');
      return invokeContinuityChecker(t, {
        shots: renderResults,
        cast: read<CharacterCast>(app, 'cast'),
        world: read<WorldDesign>(app, 'world'),
        script: read<ScriptBreakdown>(app, 'script'),
      });
    },
    persistKey: 'continuityIssues',
  });

  const critiqueNode = new AgentNode<CritiqueReport>({
    id: 'critique',
    description: 'Critique.',
    runId: '',
    invoke: async (_state, app) =>
      invokeCritique(t, {
        brief: read<CinestudioBrief>(app, 'brief'),
        script: read<ScriptBreakdown>(app, 'script'),
        cast: read<CharacterCast>(app, 'cast'),
        world: read<WorldDesign>(app, 'world'),
        shots: read<ShotRenderResult[]>(app, 'renderResults'),
        continuityIssues: read<ContinuityIssue[]>(app, 'continuityIssues'),
      }),
    persistKey: 'critique',
  });

  const scoringNode = new AgentNode<CompositeQualityReport>({
    id: 'scoring',
    description: 'Composite scorer.',
    runId: '',
    invoke: async (_state, app) => {
      const prev = readOptional<CompositeQualityReport>(app, 'composite');
      const cycleNumber = (prev?.cycleNumber ?? 0) + 1;
      const result = await invokeScoring(t, {
        critique: read<CritiqueReport>(app, 'critique'),
        cycleNumber,
        passingThreshold: cfg.defaults.qualityThreshold,
      });
      app.set('cycleNumber', cycleNumber as unknown as Record<string, unknown>);
      return result;
    },
    persistKey: 'composite',
  });

  const iterationController = new AgentNode<unknown>({
    id: 'iteration_controller',
    description: 'Iteration controller.',
    runId: '',
    invoke: async (_state, app) => {
      const critique = read<CritiqueReport>(app, 'critique');
      const composite = read<CompositeQualityReport>(app, 'composite');
      const result = await invokeIterationController(t, {
        critique,
        composite,
        cycleNumber: composite.cycleNumber ?? 1,
        maxCycles: cfg.defaults.maxIterations,
      });
      const parsed = IterationControlReportSchema.safeParse(result);
      app.set('iterationReport', (parsed.success ? parsed.data : result) as unknown as Record<string, unknown>);
      return result;
    },
    persistKey: 'iterationReport',
  });

  const editorNode = new AgentNode<AssemblyPlan>({
    id: 'editor',
    description: 'Editor.',
    runId: '',
    invoke: async (_state, app) =>
      invokeEditor(t, {
        script: read<ScriptBreakdown>(app, 'script'),
        shots: read<ShotRenderResult[]>(app, 'renderResults'),
        storyboard: read<Storyboard>(app, 'storyboard'),
        scorePlan: readOptional<ScorePlan>(app, 'scorePlan'),
      }),
    persistKey: 'assembly',
  });

  const coloristNode = new AgentNode<ColorGradeDirection>({
    id: 'colorist',
    description: 'Colorist.',
    runId: '',
    invoke: async (_state, app) =>
      invokeColorist(t, {
        brief: read<CinestudioBrief>(app, 'brief'),
        storyboard: read<Storyboard>(app, 'storyboard'),
        script: read<ScriptBreakdown>(app, 'script'),
      }),
    persistKey: 'color',
  });

  const composerNode = new AgentNode<ScorePlan>({
    id: 'composer',
    description: 'Composer.',
    runId: '',
    invoke: async (_state, app) =>
      invokeComposer(t, {
        brief: read<CinestudioBrief>(app, 'brief'),
        script: read<ScriptBreakdown>(app, 'script'),
        storyboard: read<Storyboard>(app, 'storyboard'),
      }),
    persistKey: 'scorePlan',
  });

  const soundNode = new AgentNode<SoundDesignPlan>({
    id: 'sound_designer',
    description: 'Sound designer.',
    runId: '',
    invoke: async (_state, app) =>
      invokeSoundDesigner(t, {
        script: read<ScriptBreakdown>(app, 'script'),
        world: read<WorldDesign>(app, 'world'),
        scorePlan: read<ScorePlan>(app, 'scorePlan'),
        storyboard: read<Storyboard>(app, 'storyboard'),
      }),
    persistKey: 'soundPlan',
  });

  const voiceNode = new AgentNode<VoiceCast>({
    id: 'voice_casting',
    description: 'Voice casting.',
    runId: '',
    invoke: async (_state, app) =>
      invokeVoiceCasting(t, {
        cast: read<CharacterCast>(app, 'cast'),
        script: read<ScriptBreakdown>(app, 'script'),
        scorePlan: read<ScorePlan>(app, 'scorePlan'),
        soundPlan: read<SoundDesignPlan>(app, 'soundPlan'),
      }),
    persistKey: 'voiceCast',
  });

  const distributionNode = new AgentNode<DistributionPackage>({
    id: 'distribution',
    description: 'Distribution planner.',
    runId: '',
    invoke: async (_state, app) =>
      invokeDistribution(t, {
        brief: read<CinestudioBrief>(app, 'brief'),
        cast: read<CharacterCast>(app, 'cast'),
        assembly: read<AssemblyPlan>(app, 'assembly'),
        voiceCast: read<VoiceCast>(app, 'voiceCast'),
        soundPlan: read<SoundDesignPlan>(app, 'soundPlan'),
        scorePlan: read<ScorePlan>(app, 'scorePlan'),
        rights: readOptional<RightsReport>(app, 'rightsReport'),
        composite: read<CompositeQualityReport>(app, 'composite'),
      }),
    persistKey: 'distribution',
  });

  const rightsNode = new AgentNode<RightsReport>({
    id: 'rights_clearance',
    description: 'Rights clearance.',
    runId: '',
    invoke: async (_state, app) => {
      const distribution = readOptional<DistributionPackage>(app, 'distribution');
      const placeholder: DistributionPackage = distribution ?? {
        id: 'placeholder',
        exports: [],
        metadata: {
          title: read<CinestudioBrief>(app, 'brief').logline.slice(0, 80),
          synopsis: read<CinestudioBrief>(app, 'brief').synopsis,
          tags: [],
          contentWarnings: read<CinestudioBrief>(app, 'brief').avoidances,
          credits: [],
        },
        festivalApplications: [],
      };
      return invokeRightsClearance(t, {
        brief: read<CinestudioBrief>(app, 'brief'),
        script: read<ScriptBreakdown>(app, 'script'),
        cast: read<CharacterCast>(app, 'cast'),
        world: read<WorldDesign>(app, 'world'),
        distribution: placeholder,
        continuityIssues: read<ContinuityIssue[]>(app, 'continuityIssues'),
      });
    },
    persistKey: 'rightsReport',
  });

  return {
    showrunner,
    scriptWriter,
    characterDesigner,
    worldBuilder,
    storyboardArtist,
    shotPlanner,
    continuityChecker,
    critiqueNode,
    scoringNode,
    iterationController,
    editorNode,
    coloristNode,
    composerNode,
    soundNode,
    voiceNode,
    distributionNode,
    rightsNode,
  };
}
