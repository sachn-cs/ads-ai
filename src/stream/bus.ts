import { EventEmitter } from 'node:events';
import type { RunEvent } from '@/src/models';

class RunBus extends EventEmitter {
  override on(eventName: 'event', listener: (e: RunEvent) => void): this {
    return super.on(eventName, listener);
  }
  override emit(eventName: 'event', e: RunEvent): boolean {
    return super.emit(eventName, e);
  }
  publish(e: RunEvent): void {
    this.emit('event', e);
  }
  subscribe(runId: string, onEvent: (e: RunEvent) => void): () => void {
    const listener = (e: RunEvent) => {
      if (e.runId === runId) onEvent(e);
    };
    this.on('event', listener);
    return () => this.off('event', listener);
  }
}

declare global {
  var __cinestudioBus: RunBus | undefined;
}

export function runBus(): RunBus {
  if (!globalThis.__cinestudioBus) {
    const bus = new RunBus();
    bus.setMaxListeners(1000);
    globalThis.__cinestudioBus = bus;
  }
  return globalThis.__cinestudioBus;
}
