'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function BibleTabs() {
  return (
    <Tabs defaultValue="story">
      <TabsList>
        <TabsTrigger value="story">Story</TabsTrigger>
        <TabsTrigger value="character">Character</TabsTrigger>
        <TabsTrigger value="wardrobe">Wardrobe</TabsTrigger>
        <TabsTrigger value="world">World</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
