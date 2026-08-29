'use client';

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { Character } from '@/src/db/characters';

export function CharacterDrawer({
  character,
  open,
  onOpenChange,
}: {
  character: Character | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-xl">
        <SheetHeader>
          <SheetTitle>{character?.name ?? 'Character'}</SheetTitle>
          <SheetDescription>Edit appearance, wardrobe, personality.</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 p-6">
          <Input defaultValue={character?.name ?? ''} placeholder="Name" />
          <Textarea defaultValue={character?.appearance ?? ''} placeholder="Appearance" className="min-h-32" />
          <Input defaultValue={character?.ageCues ?? ''} placeholder="Age cues" />
          <Input defaultValue={character?.posture ?? ''} placeholder="Posture" />
          <Input defaultValue={character?.emotionalBaseline ?? ''} placeholder="Emotional baseline" />
          <Button>Save character</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
