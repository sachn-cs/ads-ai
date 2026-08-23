import { listEvents } from '@/src/db/events';
import { getRun } from '@/src/db/runs';
import { runBus } from '@/src/stream/bus';
import type { RunEvent } from '@/src/models';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const segments = url.pathname.split('/').filter(Boolean);
  const id = segments[segments.indexOf('runs') + 1];
  if (!id) {
    return new Response('run id required', { status: 400 });
  }
  const run = getRun(id);
  if (!run) return new Response('run not found', { status: 404 });

  const since = Number(url.searchParams.get('since') ?? 0);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (e: RunEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(e)}\n\n`));
        } catch {
          /* controller closed */
        }
      };

      controller.enqueue(encoder.encode(`retry: 10000\n\n`));

      const historical = listEvents(id, since);
      for (const ev of historical) {
        send({
          id: String(ev.id),
          runId: id,
          ts: ev.ts,
          type: ev.type as RunEvent['type'],
          agentId: ev.agentId ?? undefined,
          payload: ev.payload,
        });
      }
      controller.enqueue(encoder.encode(`event: heartbeat\ndata: {"since": ${historical.at(-1)?.id ?? since}}\n\n`));

      const unsubscribe = runBus().subscribe(id, send);
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keepalive\n\n`));
        } catch {
          clearInterval(keepalive);
        }
      }, 15000);

      const terminalStatuses = new Set(['completed', 'failed', 'cancelled']);
      const finishIfDone = () => {
        const current = getRun(id);
        if (current && terminalStatuses.has(current.status)) {
          clearInterval(keepalive);
          unsubscribe();
          try {
            controller.close();
          } catch {
            /* already closed */
          }
        }
      };
      const terminalPoll = setInterval(finishIfDone, 1000);

      request.signal.addEventListener('abort', () => {
        clearInterval(keepalive);
        clearInterval(terminalPoll);
        unsubscribe();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
