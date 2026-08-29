'use client';

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { Location } from '@/src/db/locations';

export function LocationDrawer({
  location,
  open,
  onOpenChange,
}: {
  location: Location | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-xl">
        <SheetHeader>
          <SheetTitle>{location?.name ?? 'Location'}</SheetTitle>
          <SheetDescription>Atmosphere, texture, props, depth cues.</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 p-6">
          <Input defaultValue={location?.name ?? ''} placeholder="Name" />
          <Input defaultValue={location?.weather ?? ''} placeholder="Weather" />
          <Input defaultValue={location?.timeOfDay ?? ''} placeholder="Time of day" />
          <Input defaultValue={location?.atmosphere ?? ''} placeholder="Atmosphere" />
          <Textarea defaultValue={location?.texture ?? ''} placeholder="Texture" className="min-h-24" />
          <Button>Save location</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
