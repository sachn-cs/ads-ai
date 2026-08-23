import {
  type MultiAgent,
  BeforeMultiAgentInvocationEvent,
  type MultiAgentPlugin,
} from '@strands-agents/sdk';
import type { CinestudioConfig } from '@/src/types';
import { logger } from '@/src/lib/logger';

const log = logger('graph/plugin');

export interface CinestudioInvocationState {
  runId: string;
  config: CinestudioConfig;
  userPrompt: string;
}

export class CinestudioSeedPlugin implements MultiAgentPlugin {
  readonly name = 'cinestudio-seed';
  initMultiAgent(orchestrator: MultiAgent): void {
    orchestrator.addHook(BeforeMultiAgentInvocationEvent, (event) => {
      const inv = event.invocationState as unknown as CinestudioInvocationState | undefined;
      if (!inv) {
        log.warn('seed_plugin_no_invocation_state');
        return;
      }
      event.state.app.set('runId', inv.runId);
      event.state.app.set('textProvider', inv.config.textProvider);
      event.state.app.set('renderProviders', inv.config.renderProviders);
      event.state.app.set('originalInput', inv.userPrompt);
      event.state.app.set('cycleNumber', 0);
      log.info('seeded_app_state', { runId: inv.runId });
    });
  }
}
