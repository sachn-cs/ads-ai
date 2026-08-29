'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Send } from 'lucide-react';
import type { CopilotThread as CopilotThreadType, CopilotCitation } from '@/src/db/copilot';
import { CitationLink } from './citation-link';

export function CopilotThread({
  productionId,
  initialThreads,
}: {
  productionId: string;
  initialThreads: CopilotThreadType[];
}) {
  const [threads, setThreads] = useState(initialThreads);
  const [activeId, setActiveId] = useState<string | null>(threads[0]?.id ?? null);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; citations?: CopilotCitation[] }[]>([
    {
      role: 'assistant',
      content:
        "Hi — I'm the Cinestudio copilot. Ask me to improve a scene, strengthen a character, refine wardrobe, or fix continuity.",
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSend() {
    if (!input.trim()) return;
    const userMsg = { role: 'user' as const, content: input };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setBusy(true);
    try {
      const res = await fetch(`/api/productions/${productionId}/copilot/threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content }),
      });
      const data = (await res.json()) as { reply?: string; citations?: CopilotCitation[] };
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: data.reply ?? '…', citations: data.citations },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: 'Sorry, something went wrong.' },
      ]);
    } finally {
      setBusy(false);
    }
    void setThreads;
    void activeId;
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Copilot</p>
        <h1 className="font-display text-3xl">Production copilot</h1>
        <p className="text-sm text-muted-foreground">
          Threaded, production-scoped. Citations link to characters, scenes, shots, continuity.
        </p>
      </header>

      <Card className="warm-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold" /> Conversation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-h-96 space-y-3 overflow-y-auto rounded-md border border-border bg-ink-900/40 p-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[80%] rounded-md p-3 text-sm ${
                  m.role === 'user'
                    ? 'ml-auto bg-secondary text-bone'
                    : 'bg-card text-bone warm-shadow'
                }`}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
                {m.citations && m.citations.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-1">
                    {m.citations.map((c, j) => (
                      <li key={j}>
                        <CitationLink citation={c} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the copilot…"
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSend();
              }}
            />
            <Button onClick={onSend} disabled={busy}>
              <Send className="h-4 w-4" /> Send
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
