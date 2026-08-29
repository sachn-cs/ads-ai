import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="warm-shadow cinema-grain border-dashed">
      <CardHeader className="items-center text-center">
        {icon && <div className="text-gold">{icon}</div>}
        <CardTitle className="font-display text-2xl">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      {action && (
        <CardContent className="flex justify-center pb-6">{action}</CardContent>
      )}
    </Card>
  );
}
