import { Graph } from '@strands-agents/sdk/multiagent';
import { CinestudioSeedPlugin } from './plugin';
import { buildAgentNodes } from '@/src/workflow/agent-nodes';
import { RenderDispatchNode, RENDER_DISPATCH_ID } from '@/src/workflow/render-dispatch-node';
import type { CinestudioConfig } from '@/src/types';

export function buildCinestudioGraph(config: CinestudioConfig, userPrompt: string, runId: string) {
  const n = buildAgentNodes(config);
  const render = new RenderDispatchNode();
  void n;
  void userPrompt;
  void runId;

  return new Graph({
    nodes: [
      render,
      n.showrunner,
      n.styleGuideNode,
      n.storyAnalyst,
      n.characterDesigner,
      n.costumeDesigner,
      n.environmentDesigner,
      n.scriptWriter,
      n.sceneEditor,
      n.sceneComposer,
      n.worldBuilder,
      n.storyboardArtist,
      n.shotPlanner,
      n.cinematographer,
      n.continuitySupervisor,
      n.transitionDesigner,
      n.pacingAnalyst,
      n.visualQualityReviewer,
      n.continuityChecker,
      n.critiqueNode,
      n.scoringNode,
      n.productionCoordinator,
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
      [n.styleGuideNode.id, n.storyAnalyst.id],
      [n.storyAnalyst.id, n.scriptWriter.id],
      [n.scriptWriter.id, n.sceneEditor.id],
      [n.sceneEditor.id, n.sceneComposer.id],
      [n.sceneComposer.id, n.characterDesigner.id],
      [n.sceneComposer.id, n.worldBuilder.id],
      [n.characterDesigner.id, n.costumeDesigner.id],
      [n.worldBuilder.id, n.environmentDesigner.id],
      [n.costumeDesigner.id, n.storyboardArtist.id],
      [n.environmentDesigner.id, n.storyboardArtist.id],
      [n.storyboardArtist.id, n.shotPlanner.id],
      [n.shotPlanner.id, RENDER_DISPATCH_ID],
      [n.shotPlanner.id, n.cinematographer.id],
      [RENDER_DISPATCH_ID, n.continuitySupervisor.id],
      [n.cinematographer.id, n.continuitySupervisor.id],
      [n.continuitySupervisor.id, n.transitionDesigner.id],
      [n.continuitySupervisor.id, n.pacingAnalyst.id],
      [n.continuitySupervisor.id, n.visualQualityReviewer.id],
      [RENDER_DISPATCH_ID, n.continuityChecker.id],
      [RENDER_DISPATCH_ID, n.critiqueNode.id],
      [n.continuityChecker.id, n.scoringNode.id],
      [n.critiqueNode.id, n.scoringNode.id],
      [n.transitionDesigner.id, n.editorNode.id],
      [n.pacingAnalyst.id, n.editorNode.id],
      [n.visualQualityReviewer.id, n.editorNode.id],
      [n.scoringNode.id, n.productionCoordinator.id],
      [n.productionCoordinator.id, n.editorNode.id],
      [n.editorNode.id, n.coloristNode.id],
      [n.coloristNode.id, n.composerNode.id],
      [n.composerNode.id, n.soundNode.id],
      [n.soundNode.id, n.voiceNode.id],
      [n.voiceNode.id, n.distributionNode.id],
      [n.distributionNode.id, n.rightsNode.id],
    ],
    sources: [n.showrunner.id],
    maxSteps: 200,
    timeout: 60 * 60 * 1000,
    nodeTimeout: 10 * 60 * 1000,
    maxConcurrency: 4,
    plugins: [new CinestudioSeedPlugin()],
  });
}
