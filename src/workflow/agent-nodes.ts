import type {
  CinestudioBrief,
  CharacterCast,
  CompositeQualityReport,
  CritiqueReport,
  ScorePlan,
  ScriptBreakdown,
  Storyboard,
  ColorGradeDirection,
  WorldDesign,
  AssemblyPlan,
  VoiceCast,
  SoundDesignPlan,
  DistributionPackage,
  RenderBatchPlan,
  RightsReport,
  ShotRenderResult,
} from '@/src/models';
import type { CinestudioConfig } from '@/src/types';
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
import { invokeRightsClearance,
} from '@/src/agents/rights-clearance';
import { IterationControlReportSchema } from '@/src/models';
import { readApp } from './app-state';

export function buildAgentNodes(cfg: CinestudioConfig) {
  const t = cfg.textProvider;


  const showrunner = new AgentNode<CinestudioBrief>({
    id: 'showrunner',
    description: 'Senior creative producer. Synthesizes the CinestudioBrief.',
    runId: '',
    invoke: async (_state, app) => invokeShowrunner(t, readApp<string>(app, 'originalInput')),
    persistKey: 'brief',
  });

  const scriptWriter = new AgentNode<ScriptBreakdown>({
    id: 'script_writer',
    description: 'Screenwriter.',
    runId: '',
    invoke: async (_state, app) =>
      invokeScriptWriter(t, {
        brief: readApp<CinestudioBrief>(app, 'brief'),
        previous: app.script,
        iterationDirective: app.iterationDirective,
      }),
    persistKey: 'script',
  });

  const characterDesigner = new AgentNode<CharacterCast>({
    id: 'character_designer',
    description: 'Character designer.',
    runId: '',
    invoke: async (_state, app) =>
      invokeCharacterDesigner(t, {
        brief: readApp<CinestudioBrief>(app, 'brief'),
        script: readApp<ScriptBreakdown>(app, 'script'),
      }),
    persistKey: 'cast',
  });

  const worldBuilder = new AgentNode<WorldDesign>({
    id: 'world_builder',
    description: 'World builder.',
    runId: '',
    invoke: async (_state, app) =>
      invokeWorldBuilder(t, {
        brief: readApp<CinestudioBrief>(app, 'brief'),
        script: readApp<ScriptBreakdown>(app, 'script'),
        cast: readApp<CharacterCast>(app, 'cast'),
      }),
    persistKey: 'world',
  });

  const storyboardArtist = new AgentNode<Storyboard>({
    id: 'storyboard',
    description: 'Storyboard.',
    runId: '',
    invoke: async (_state, app) =>
      invokeStoryboard(t, {
        brief: readApp<CinestudioBrief>(app, 'brief'),
        script: readApp<ScriptBreakdown>(app, 'script'),
        cast: readApp<CharacterCast>(app, 'cast'),
        world: readApp<WorldDesign>(app, 'world'),
        iterationDirective: app.iterationDirective,
      }),
    persistKey: 'storyboard',
  });

  const shotPlanner = new AgentNode<RenderBatchPlan[]>({
    id: 'shot_planner',
    description: 'Shot planner.',
    runId: '',
    invoke: async (_state, app) =>
      invokeShotPlanner(t, {
        brief: readApp<CinestudioBrief>(app, 'brief'),
        script: readApp<ScriptBreakdown>(app, 'script'),
        cast: readApp<CharacterCast>(app, 'cast'),
        world: readApp<WorldDesign>(app, 'world'),
        storyboard: readApp<Storyboard>(app, 'storyboard'),
        providers: cfg.renderProviders,
      }),
    persistKey: 'shotBatches',
  });

  const continuityChecker = new AgentNode<ContinuityIssue[]>({
    id: 'continuity_checker',
    description: 'Continuity checker.',
    runId: '',
    invoke: async (_state, app) =>
      invokeContinuityChecker(t, {
        shots: readApp<ShotRenderResult[]>(app, 'renderResults'),
        cast: readApp<CharacterCast>(app, 'cast'),
        world: readApp<WorldDesign>(app, 'world'),
        script: readApp<ScriptBreakdown>(app, 'script'),
      }),
    persistKey: 'continuityIssues',
  });

  const critiqueNode = new AgentNode<CritiqueReport>({
    id: 'critique',
    description: 'Critique.',
    runId: '',
    invoke: async (_state, app) =>
      invokeCritique(t, {
        brief: readApp<CinestudioBrief>(app, 'brief'),
        script: readApp<ScriptBreakdown>(app, 'script'),
        cast: readApp<CharacterCast>(app, 'cast'),
        world: readApp<WorldDesign>(app, 'world'),
        shots: readApp<ShotRenderResult[]>(app, 'renderResults'),
        continuityIssues: readApp<ContinuityIssue[]>(app, 'continuityIssues'),
      }),
    persistKey: 'critique',
  });

  const scoringNode = new AgentNode<CompositeQualityReport>({
    id: 'scoring',
    description: 'Composite scorer.',
    runId: '',
    invoke: async (_state, app) => {
      const prev = app.composite as CompositeQualityReport | undefined;
      const cycleNumber = (prev?.cycleNumber ?? 0) + 1;
      const result = await invokeScoring(t, {
        critique: readApp<CritiqueReport>(app, 'critique'),
        cycleNumber,
        passingThreshold: cfg.defaults.qualityThreshold,
      });
      app.cycleNumber = cycleNumber;
      return result;
    },
    persistKey: 'composite',
  });

  const iterationController = new AgentNode<unknown>({
    id: 'iteration_controller',
    description: 'Iteration controller.',
    runId: '',
    invoke: async (_state, app) => {
      const critique = readApp<CritiqueReport>(app, 'critique');
      const composite = readApp<CompositeQualityReport>(app, 'composite');
      const result = await invokeIterationController(t, {
        critique,
        composite,
        cycleNumber: composite.cycleNumber ?? 1,
        maxCycles: cfg.defaults.maxIterations,
      });
      const parsed = IterationControlReportSchema.safeParse(result);
      app.iterationReport = parsed.success ? parsed.data : result;
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
        script: readApp<ScriptBreakdown>(app, 'script'),
        shots: readApp<ShotRenderResult[]>(app, 'renderResults'),
        storyboard: readApp<Storyboard>(app, 'storyboard'),
        scorePlan: readApp<ScorePlan>(app, 'scorePlan'),
      }),
    persistKey: 'assembly',
  });

  const coloristNode = new AgentNode<ColorGradeDirection>({
    id: 'colorist',
    description: 'Colorist.',
    runId: '',
    invoke: async (_state, app) =>
      invokeColorist(t, {
        brief: readApp<CinestudioBrief>(app, 'brief'),
        storyboard: readApp<Storyboard>(app, 'storyboard'),
        script: readApp<ScriptBreakdown>(app, 'script'),
      }),
    persistKey: 'color',
  });

  const composerNode = new AgentNode<ScorePlan>({
    id: 'composer',
    description: 'Composer.',
    runId: '',
    invoke: async (_state, app) =>
      invokeComposer(t, {
        brief: readApp<CinestudioBrief>(app, 'brief'),
        script: readApp<ScriptBreakdown>(app, 'script'),
        storyboard: readApp<Storyboard>(app, 'storyboard'),
      }),
    persistKey: 'scorePlan',
  });

  const soundNode = new AgentNode<SoundDesignPlan>({
    id: 'sound_designer',
    description: 'Sound designer.',
    runId: '',
    invoke: async (_state, app) =>
      invokeSoundDesigner(t, {
        script: readApp<ScriptBreakdown>(app, 'script'),
        world: readApp<WorldDesign>(app, 'world'),
        scorePlan: readApp<ScorePlan>(app, 'scorePlan'),
        storyboard: readApp<Storyboard>(app, 'storyboard'),
      }),
    persistKey: 'soundPlan',
  });

  const voiceNode = new AgentNode<VoiceCast>({
    id: 'voice_casting',
    description: 'Voice casting.',
    runId: '',
    invoke: async (_state, app) =>
      invokeVoiceCasting(t, {
        cast: readApp<CharacterCast>(app, 'cast'),
        script: readApp<ScriptBreakdown>(app, 'script'),
        scorePlan: readApp<ScorePlan>(app, 'scorePlan'),
        soundPlan: readApp<SoundDesignPlan>(app, 'soundPlan'),
      }),
    persistKey: 'voiceCast',
  });

  const distributionNode = new AgentNode<DistributionPackage>({
    id: 'distribution',
    description: 'Distribution planner.',
    runId: '',
    invoke: async (_state, app) =>
      invokeDistribution(t, {
        brief: readApp<CinestudioBrief>(app, 'brief'),
        cast: readApp<CharacterCast>(app, 'cast'),
        assembly: readApp<AssemblyPlan>(app, 'assembly'),
        voiceCast: readApp<VoiceCast>(app, 'voiceCast'),
        soundPlan: readApp<SoundDesignPlan>(app, 'soundPlan'),
        scorePlan: readApp<ScorePlan>(app, 'scorePlan'),
        rights: readApp<RightsReport>(app, 'rightsReport'),
        composite: readApp<CompositeQualityReport>(app, 'composite'),
      }),
    persistKey: 'distribution',
  });

  const rightsNode = new AgentNode<RightsReport>({
    id: 'rights_clearance',
    description: 'Rights clearance.',
    runId: '',
    invoke: async (_state, app) => {
      const distribution = app.distribution as DistributionPackage | undefined;
      const placeholder: DistributionPackage = distribution ?? {
        id: 'placeholder',
        exports: [],
        metadata: {
          title: readApp<CinestudioBrief>(app, 'brief').logline.slice(0, 80),
          synopsis: readApp<CinestudioBrief>(app, 'brief').synopsis,
          tags: [],
          contentWarnings: readApp<CinestudioBrief>(app, 'brief').avoidances,
          credits: [],
        },
        festivalApplications: [],
      };
      return invokeRightsClearance(t, {
        brief: readApp<CinestudioBrief>(app, 'brief'),
        script: readApp<ScriptBreakdown>(app, 'script'),
        cast: readApp<CharacterCast>(app, 'cast'),
        world: readApp<WorldDesign>(app, 'world'),
        distribution: placeholder,
        continuityIssues: readApp<ContinuityIssue[]>(app, 'continuityIssues'),
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
