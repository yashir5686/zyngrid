import Link from 'next/link';
import Image from 'next/image';
import type { Game } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

interface GameCardProps {
  game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  return (
    <Card className="bg-card/80 hover:bg-card/100 shadow-lg transition-all duration-300 transform hover:scale-105 hover:-rotate-1 hover:shadow-[0_0_12px_2px_hsl(var(--primary)),_0_0_20px_5px_hsla(var(--primary)/0.5)] rounded-lg overflow-hidden flex flex-col h-full">
      <CardHeader className="p-0">
        <div className="aspect-video relative w-full">
          <Image
            src={game.thumbnail}
            alt={game.name}
            layout="fill"
            objectFit="cover"
            data-ai-hint={game.dataAiHint || 'game thumbnail'}
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle
          className="text-xl font-headline text-primary mb-2"
          style={{ textShadow: '0 0 4px hsl(var(--primary)), 0 0 8px hsl(var(--primary))' }}
        >
          {game.name}
        </CardTitle>
        <p className="text-sm text-muted-foreground line-clamp-3">{game.description}</p>
      </CardContent>
      <CardFooter className="p-4 border-t border-border">
        <Button asChild className="w-full bg-accent hover:bg-accent/80 text-accent-foreground hover:shadow-[0_0_8px_1px_hsl(var(--accent)),_0_0_15px_3px_hsla(var(--accent)/0.4)]">
          <Link href={`/games/${game.slug}`}>
            <Play className="mr-2 h-5 w-5" /> Play Now
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
