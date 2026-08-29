import { notFound } from 'next/navigation';
import { getProduction } from '@/src/db/productions';
import { listComments } from '@/src/db/comments';
import { EmptyState } from '@/components/production/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function CommentsTab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const production = getProduction(id);
  if (!production) notFound();
  const comments = listComments(id);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Comments</p>
        <h1 className="font-display text-3xl">Discussion</h1>
        <p className="text-sm text-muted-foreground">{comments.length} comment{comments.length === 1 ? '' : 's'}.</p>
      </header>

      {comments.length === 0 ? (
        <EmptyState title="No comments yet" description="Comments attach to any entity." />
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <Card key={c.id} className="warm-shadow">
              <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                <Avatar>
                  <AvatarFallback>{c.author.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-sm">
                    {c.author}{' '}
                    <Badge variant="outline" className="ml-2 text-xs">
                      {c.entityType}
                    </Badge>
                  </CardTitle>
                  <p className="mt-1 text-sm text-bone">{c.body}</p>
                </div>
              </CardHeader>
              <CardContent>
                <span className="text-xs text-muted-foreground">
                  {new Date(c.createdAt).toLocaleString()}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
