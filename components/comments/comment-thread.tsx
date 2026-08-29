'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Plus } from 'lucide-react';
import type { Comment } from '@/src/db/comments';

export function CommentThread({
  comments: initial,
  productionId,
  entityType,
  entityId,
}: {
  comments: Comment[];
  productionId: string;
  entityType: string;
  entityId: string;
}) {
  const [comments, setComments] = useState(initial);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!draft.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/productions/${productionId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType,
          entityId,
          author: 'operator',
          body: draft,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { comment: Comment };
        setComments((c) => [...c, data.comment]);
        setDraft('');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="warm-shadow">
      <CardHeader className="flex flex-row items-center gap-2 space-y-0">
        <MessageSquare className="h-4 w-4 text-gold" />
        <CardTitle className="text-base">Discussion</CardTitle>
        <Badge variant="outline" className="ml-auto">
          {comments.length}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        ) : (
          <ul className="space-y-2">
            {comments.map((c) => (
              <li
                key={c.id}
                className="flex items-start gap-3 rounded-md border border-border p-3"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback>{c.author.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">
                    {c.author} · {new Date(c.createdAt).toLocaleString()}
                  </p>
                  <p className="mt-1 text-sm text-bone">{c.body}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a comment…"
            className="min-h-20"
          />
          <Button onClick={submit} disabled={busy}>
            <Plus className="h-4 w-4" /> Post
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
