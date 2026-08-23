import { Graph, type EdgeHandler } from '@strands-agents/sdk/multiagent';
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

  const graph = new Graph({
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
      { source: n.showrunner.id, target: n.scriptWriter.id },
      { source: n.scriptWriter.id, target: n.characterDesigner.id },
      { source: n.characterDesigner.id, target: n.worldBuilder.id },
      { source: n.worldBuilder.id, target: n.storyboardArtist.id },
      { source: n.storyboardArtist.id, target: n.shotPlanner.id },
      { source: n.shotPlanner.id, target: RENDER_DISPATCH_ID },
      { source: RENDER_DISPATCH_ID, target: n.continuityChecker.id },
      { source: n.continuityChecker.id, target: n.critiqueNode.id },
      { source: n.critiqueNode.id, target: n.scoringNode.id },
      { source: n.scoringNode.id, target: n.iterationController.id },
      { source: n.iterationController.id, target: RENDER_DISPATCH_ID, handler: shouldIterate },
      { source: n.iterationController.id, target: n.editorNode.id, handler: proceedToEditor },
      { source: n.editorNode.id, target: n.coloristNode.id },
      { source: n.coloristNode.id, target: n.composerNode.id },
      { source: n.composerNode.id, target: n.soundNode.id },
      { source: n.soundNode.id, target: n.voiceNode.id },
      { source: n.voiceNode.id, target: n.distributionNode.id },
      { source: n.distributionNode.id, target: n.rightsNode.id },
    ],
    sources: [n.showrunner.id],
    maxSteps: 100,
    timeout: 60 * 60 * 1000,
    nodeTimeout: 10 * 60 * 1000,
    maxConcurrency: 4,
    plugins: [new CinestudioSeedPlugin()],
  });

  void invocationState;
  return graph;
}
