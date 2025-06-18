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
    <Card className="bg-card/80 hover:bg-card/100 shadow-lg transition-all duration-300 rounded-lg overflow-hidden flex flex-col h-full">
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
          className="text-xl font-headline text-foreground mb-2"
        >
          {game.name}
        </CardTitle>
        <p className="text-sm text-muted-foreground line-clamp-3">{game.description}</p>
      </CardContent>
      <CardFooter className="p-4 border-t border-border">
        <Button asChild className="w-full bg-primary hover:bg-primary/80 text-primary-foreground">
          <Link href={`/games/${game.slug}`}>
            <Play className="mr-2 h-5 w-5" /> Play Now
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
