import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const TEMPLATES = [
  { id: 'noir', title: 'Noir', tone: 'High contrast, single-source warmth' },
  { id: 'romance', title: 'Romance', tone: 'Soft golden hour, intimate framings' },
  { id: 'coming-of-age', title: 'Coming-of-age', tone: 'Pastel, handheld, observational' },
  { id: 'sci-fi', title: 'Sci-fi', tone: 'Cool, anamorphic, neon accents' },
  { id: 'horror', title: 'Horror', tone: 'Wide lenses, deep shadow, low key' },
];

export function GenreTemplateGrid() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {TEMPLATES.map((t) => (
        <Link key={t.id} href={`/dashboard/productions/new?template=${t.id}`}>
          <Card className="warm-shadow transition-colors hover:border-gold/40">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                {t.title}
                <Badge variant="outline" className="font-mono text-xs">{t.id}</Badge>
              </CardTitle>
              <CardDescription>{t.tone}</CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        </Link>
      ))}
    </div>
  );
}
