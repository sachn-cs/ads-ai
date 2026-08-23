import { Graph, type EdgeHandler } from '@strands-agents/sdk';
import { CinestudioSeedPlugin, type CinestudioInvocationState } from './plugin';
import { buildAgentNodes } from '@/src/workflow/agent-nodes';
import { RenderDispatchNode, RENDER_DISPATCH_ID } from '@/src/workflow/render-dispatch-node';
import type { CinestudioConfig } from '@/src/types';
import type { AppState } from '@/src/workflow/app-state';
import { logger } from '@/src/lib/logger';

const log = logger('graph/cinestudio');

export function buildCinestudioGraph(config: CinestudioConfig, userPrompt: string, runId: string) {
  const n = buildAgentNodes(config);
  const render = new RenderDispatchNode();

  const shouldIterate: EdgeHandler = (state) => {
    const app = state.app as unknown as AppState;
    const composite = app.composite as { recommendation?: string; cycleNumber?: number } | undefined;
    const iterationReport = app.iterationReport as { shouldContinue?: boolean } | undefined;
    const cycle = composite?.cycleNumber ?? 0;
    const iter = iterationReport?.shouldContinue ?? false;
    const recom = composite?.recommendation ?? 'iterate';
    const keepGoing = recom !== 'proceed' && recom !== 'halt' && iter && cycle < config.defaults.maxIterations;
    log.info('edge_should_iterate', { cycle, iter, recom, keepGoing });
    return keepGoing;
  };

  const proceedToEditor: EdgeHandler = (state) => {
    const app = state.app as unknown as AppState;
    const iterationReport = app.iterationReport as { shouldContinue?: boolean } | undefined;
    const composite = app.composite as { recommendation?: string } | undefined;
    const recom = composite?.recommendation ?? 'iterate';
    return recom === 'proceed' || iterationReport?.shouldContinue === false;
  };

  const invocationState: CinestudioInvocationState = { runId, config, userPrompt };

  const _graph = new Graph({
    nodes: [
      render,
      n.showrunner,
      n.scriptWriter,
      n.characterDesigner,
      n.worldBuilder,
      n.storyboardArtist,
      n.shotPlanner,
      n.continuityChecker,
      n.critiqueNode,
      n.scoringNode,
      n.iterationController,
      n.editorNode,
      n.coloristNode,
      n.composerNode,
      n.soundNode,
      n.voiceNode,
      n.distributionNode,
      n.rightsNode,
    ],
    edges: [
      [n.showrunner.id, n.scriptWriter.id],
      [n.scriptWriter.id, n.characterDesigner.id],
      [n.characterDesigner.id, n.worldBuilder.id],
      [n.worldBuilder.id, n.storyboardArtist.id],
      [n.storyboardArtist.id, n.shotPlanner.id],
      [n.shotPlanner.id, RENDER_DISPATCH_ID],
      [RENDER_DISPATCH_ID, n.continuityChecker.id],
      [n.continuityChecker.id, n.critiqueNode.id],
      [n.critiqueNode.id, n.scoringNode.id],
      [n.scoringNode.id, n.iterationController.id],
      [n.iterationController.id, RENDER_DISPATCH_ID, shouldIterate],
      [n.iterationController.id, n.editorNode.id, proceedToEditor],
      [n.editorNode.id, n.coloristNode.id],
      [n.coloristNode.id, n.composerNode.id],
      [n.composerNode.id, n.soundNode.id],
      [n.soundNode.id, n.voiceNode.id],
      [n.voiceNode.id, n.distributionNode.id],
      [n.distributionNode.id, n.rightsNode.id],
    ],
    sources: [n.showrunner.id],
    maxSteps: 100,
    timeout: 60 * 60 * 1000,
    nodeTimeout: 10 * 60 * 1000,
    maxConcurrency: 4,
    plugins: [new CinestudioSeedPlugin()],
  });

  void invocationState;
  return _graph;
}
