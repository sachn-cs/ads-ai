import { Graph } from '@strands-agents/sdk/multiagent';
import { CinestudioSeedPlugin, type CinestudioInvocationState } from './plugin';
import { buildAgentNodes } from '@/src/workflow/agent-nodes';
import { RenderDispatchNode, RENDER_DISPATCH_ID } from '@/src/workflow/render-dispatch-node';
import type { CinestudioConfig } from '@/src/types';

export function buildCinestudioGraph(config: CinestudioConfig, userPrompt: string, runId: string) {
  const n = buildAgentNodes(config);
  const render = new RenderDispatchNode();

  const _invocationState: CinestudioInvocationState = { runId, config, userPrompt };
  void _invocationState;

  return new Graph({
    nodes: [
      render,
      n.showrunner,
      n.styleGuideNode,
      n.scriptWriter,
      n.characterDesigner,
      n.worldBuilder,
      n.storyboardArtist,
      n.shotPlanner,
      n.continuityChecker,
      n.critiqueNode,
      n.scoringNode,
      n.editorNode,
      n.coloristNode,
      n.composerNode,
      n.soundNode,
      n.voiceNode,
      n.distributionNode,
      n.rightsNode,
    ],
    edges: [
      [n.showrunner.id, n.styleGuideNode.id],
      [n.styleGuideNode.id, n.scriptWriter.id],
      [n.scriptWriter.id, n.characterDesigner.id],
      [n.characterDesigner.id, n.worldBuilder.id],
      [n.worldBuilder.id, n.storyboardArtist.id],
      [n.storyboardArtist.id, n.shotPlanner.id],
      [n.shotPlanner.id, RENDER_DISPATCH_ID],
      [RENDER_DISPATCH_ID, n.continuityChecker.id],
      [RENDER_DISPATCH_ID, n.critiqueNode.id],
      [n.continuityChecker.id, n.scoringNode.id],
      [n.critiqueNode.id, n.scoringNode.id],
      [n.scoringNode.id, n.editorNode.id],
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
}
