import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('gold-shimmer rounded-md bg-muted/40', className)} />;
}
