'use client';

import { useState } from 'react';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';

const COMMANDS = [
  { cmd: '/improve-scene', label: 'Improve a scene' },
  { cmd: '/strengthen-character', label: 'Strengthen a character' },
  { cmd: '/refine-wardrobe', label: 'Refine wardrobe' },
  { cmd: '/fix-continuity', label: 'Fix continuity' },
  { cmd: '/add-shot', label: 'Add a shot' },
  { cmd: '/compare', label: 'Compare alternatives' },
  { cmd: '/revise', label: 'Revise' },
];

export function SlashPalette({ onSelect }: { onSelect: (cmd: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        className="text-xs text-gold underline"
        onClick={() => setOpen((o) => !o)}
        type="button"
      >
        Slash commands
      </button>
      {open && (
        <div className="absolute z-50 mt-2 w-64 rounded-md border border-border bg-popover p-1 shadow-warm">
          <Command>
            <CommandList>
              <CommandGroup heading="Slash commands">
                {COMMANDS.map((c) => (
                  <CommandItem
                    key={c.cmd}
                    onSelect={() => {
                      onSelect(c.cmd);
                      setOpen(false);
                    }}
                  >
                    <span className="font-mono">{c.cmd}</span>
                    <span className="ml-2 text-muted-foreground">{c.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}
