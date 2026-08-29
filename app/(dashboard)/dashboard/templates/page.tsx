import { GenreTemplateGrid } from '@/components/templates/genre-template-grid';

export const dynamic = 'force-dynamic';

export default function TemplatesPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Templates</p>
        <h1 className="font-display text-3xl">Genre templates</h1>
        <p className="text-sm text-muted-foreground">
          Seed a production with characters, scenes, wardrobe, and style guide.
        </p>
      </header>

      <GenreTemplateGrid />
    </div>
  );
}
