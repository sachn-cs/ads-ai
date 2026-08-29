import { ShieldAlert } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function ContinuityMarker({ message }: { message: string }) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <ShieldAlert className="h-3.5 w-3.5 text-amber-warm" />
      </TooltipTrigger>
      <TooltipContent>{message}</TooltipContent>
    </Tooltip>
  );
}
