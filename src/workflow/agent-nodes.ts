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
  StyleGuide,
} from '@/src/models';
import type { CinestudioConfig } from '@/src/types';
import type { StateStore } from '@strands-agents/sdk';
import { AgentNode } from './agent-node';
import { logger } from '@/src/lib/logger';

const log = logger('workflow/agent-nodes');
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
import {
  invokeStyleGuide,
} from '@/src/agents/style-guide';
import { invokeStoryAnalyst, type StoryAnalysis } from '@/src/agents/story-analyst';
import { invokeCostumeDesigner, type CostumeRevision } from '@/src/agents/costume-designer';
import { invokeEnvironmentDesigner, type EnvironmentRevision } from '@/src/agents/environment-designer';
import { invokeSceneComposer, type SceneList } from '@/src/agents/scene-composer';
import {
  invokeContinuitySupervisor,
  type SupervisorReport,
} from '@/src/agents/continuity-supervisor';
import { invokeTransitionDesigner, type TransitionPlan } from '@/src/agents/transition-designer';
import { invokePacingAnalyst, type PacingReport } from '@/src/agents/pacing-analyst';
import {
  invokeVisualQualityReviewer,
  type VisualQualityReport,
} from '@/src/agents/visual-quality-reviewer';
import {
  invokeProductionCoordinator,
  type CoordinatorReport,
} from '@/src/agents/production-coordinator';

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

  const styleGuideNode = new AgentNode<StyleGuide>({
    id: 'style_guide',
    description: 'Style Guide.',
    runId: '',
    invoke: async (_state, app) =>
      invokeStyleGuide(t, read<CinestudioBrief>(app, 'brief')),
    persistKey: 'styleGuide',
  });

  const storyAnalyst = new AgentNode<StoryAnalysis>({
    id: 'story_analyst',
    description: 'Story Analyst.',
    runId: '',
    invoke: async (_state, app) =>
      invokeStoryAnalyst(t, read<CinestudioBrief>(app, 'brief')),
    persistKey: 'storyAnalysis',
  });

  const costumeDesigner = new AgentNode<CostumeRevision>({
    id: 'costume_designer',
    description: 'Costume Designer.',
    runId: '',
    invoke: async (_state, app) =>
      invokeCostumeDesigner(t, read<CharacterCast>(app, 'cast')),
    persistKey: 'costumeRevision',
  });

  const environmentDesigner = new AgentNode<EnvironmentRevision>({
    id: 'environment_designer',
    description: 'Environment Designer.',
    runId: '',
    invoke: async (_state, app) =>
      invokeEnvironmentDesigner(t, read<WorldDesign>(app, 'world')),
    persistKey: 'environmentRevision',
  });

  const sceneComposer = new AgentNode<SceneList>({
    id: 'scene_composer',
    description: 'Scene Composer.',
    runId: '',
    invoke: async (_state, app) =>
      invokeSceneComposer(t, read<ScriptBreakdown>(app, 'script')),
    persistKey: 'sceneList',
  });

  const continuitySupervisor = new AgentNode<SupervisorReport>({
    id: 'continuity_supervisor',
    description: 'Continuity Supervisor (fan-out to Continuity, Transition, Pacing, VisualQuality).',
    runId: '',
    invoke: async (_state, app) =>
      invokeContinuitySupervisor(t, read<Storyboard>(app, 'storyboard')),
    persistKey: 'supervisorReport',
  });

  const transitionDesigner = new AgentNode<TransitionPlan>({
    id: 'transition_designer',
    description: 'Transition Designer.',
    runId: '',
    invoke: async (_state, app) =>
      invokeTransitionDesigner(t, read<Storyboard>(app, 'storyboard')),
    persistKey: 'transitionPlan',
  });

  const pacingAnalyst = new AgentNode<PacingReport>({
    id: 'pacing_analyst',
    description: 'Pacing Analyst.',
    runId: '',
    invoke: async (_state, app) =>
      invokePacingAnalyst(t, read<ScriptBreakdown>(app, 'script')),
    persistKey: 'pacingReport',
  });

  const visualQualityReviewer = new AgentNode<VisualQualityReport>({
    id: 'visual_quality_reviewer',
    description: 'Visual Quality Reviewer.',
    runId: '',
    invoke: async (_state, app) =>
      invokeVisualQualityReviewer(t, read<Storyboard>(app, 'storyboard'), read<StyleGuide>(app, 'styleGuide')),
    persistKey: 'visualQualityReport',
  });

  const productionCoordinator = new AgentNode<CoordinatorReport>({
    id: 'production_coordinator',
    description: 'Production Coordinator.',
    runId: '',
    invoke: async (_state, app) =>
      invokeProductionCoordinator(t, {
        agentStatuses: [
          { agentId: 'showrunner', status: 'done' },
          { agentId: 'style_guide', status: 'done' },
          { agentId: 'character_designer', status: 'done' },
          { agentId: 'world_builder', status: 'done' },
          { agentId: 'script_writer', status: 'done' },
          { agentId: 'shot_planner', status: 'done' },
          { agentId: 'continuity_supervisor', status: 'done' },
          { agentId: 'scoring', status: 'done' },
        ],
        unresolved: read<ContinuityIssue[]>(app, 'continuityIssues').map((c) => ({
          kind: c.kind,
          message: c.message,
        })),
      }),
    persistKey: 'coordinatorReport',
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
      invokeCharacterDesigner(
        cfg,
        {
          brief: read<CinestudioBrief>(app, 'brief'),
          script: read<ScriptBreakdown>(app, 'script'),
        },
        app.get('runId') as string | undefined,
      ),
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
      invokeStoryboard(
        cfg,
        {
          brief: read<CinestudioBrief>(app, 'brief'),
          script: read<ScriptBreakdown>(app, 'script'),
          cast: read<CharacterCast>(app, 'cast'),
          world: read<WorldDesign>(app, 'world'),
          iterationDirective: readOptional<string>(app, 'iterationDirective'),
        },
        app.get('runId') as string | undefined,
      ),
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
      const productionId = (app.get('productionId') as string | undefined) ?? '';
      const issues = await invokeContinuityChecker(t, {
        shots: renderResults,
        cast: read<CharacterCast>(app, 'cast'),
        world: read<WorldDesign>(app, 'world'),
        script: read<ScriptBreakdown>(app, 'script'),
      });
      if (productionId) {
        const { createContinuityEntry } = await import('@/src/db/continuity-log');
        for (const issue of issues) {
          try {
            createContinuityEntry({
              productionId,
              kind: issue.kind,
              severity: issue.severity === 'warn' ? 'warn' : issue.severity === 'error' ? 'error' : 'info',
              message: issue.message,
              shotId: issue.shotId,
            });
          } catch (err) {
            log.warn('continuity_persist_failed', { err: String(err) });
          }
        }
      }
      return issues;
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
      invokeComposer(
        cfg,
        {
          brief: read<CinestudioBrief>(app, 'brief'),
          script: read<ScriptBreakdown>(app, 'script'),
          storyboard: read<Storyboard>(app, 'storyboard'),
        },
        app.get('runId') as string | undefined,
      ),
    persistKey: 'scorePlan',
  });

  const soundNode = new AgentNode<SoundDesignPlan>({
    id: 'sound_designer',
    description: 'Sound designer.',
    runId: '',
    invoke: async (_state, app) =>
      invokeSoundDesigner(
        cfg,
        {
          brief: read<CinestudioBrief>(app, 'brief'),
          script: read<ScriptBreakdown>(app, 'script'),
          world: read<WorldDesign>(app, 'world'),
          scorePlan: read<ScorePlan>(app, 'scorePlan'),
          storyboard: read<Storyboard>(app, 'storyboard'),
        },
        app.get('runId') as string | undefined,
      ),
    persistKey: 'soundPlan',
  });

  const voiceNode = new AgentNode<VoiceCast>({
    id: 'voice_casting',
    description: 'Voice casting.',
    runId: '',
    invoke: async (_state, app) =>
      invokeVoiceCasting(
        cfg,
        {
          cast: read<CharacterCast>(app, 'cast'),
          script: read<ScriptBreakdown>(app, 'script'),
          scorePlan: read<ScorePlan>(app, 'scorePlan'),
          soundPlan: read<SoundDesignPlan>(app, 'soundPlan'),
        },
        app.get('runId') as string | undefined,
      ),
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
    styleGuideNode,
    storyAnalyst,
    characterDesigner,
    costumeDesigner,
    environmentDesigner,
    scriptWriter,
    sceneComposer,
    worldBuilder,
    storyboardArtist,
    shotPlanner,
    continuitySupervisor,
    transitionDesigner,
    pacingAnalyst,
    visualQualityReviewer,
    continuityChecker,
    critiqueNode,
    scoringNode,
    productionCoordinator,
    editorNode,
    coloristNode,
    composerNode,
    soundNode,
    voiceNode,
    distributionNode,
    rightsNode,
  };
}
