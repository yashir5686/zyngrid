import Link from 'next/link';
import Image from 'next/image';
import type { Game } from '@/types';
import { Button } from '@/components/ui/button';
import { PlayCircle } from 'lucide-react';

interface FeaturedGameBannerProps {
  game: Game;
}

export default function FeaturedGameBanner({ game }: FeaturedGameBannerProps) {
  return (
    <div className="relative rounded-lg overflow-hidden shadow-2xl my-8">
      <div className="aspect-[16/6] w-full">
        {game.bannerImage && (
          <Image
            src={game.bannerImage}
            alt={`${game.name} banner`}
            layout="fill"
            objectFit="cover"
            priority
            data-ai-hint={game.dataAiHint || 'game banner'}
          />
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent flex flex-col justify-end p-8 md:p-12">
        <h2 
          className="text-4xl md:text-5xl font-headline text-foreground mb-3 drop-shadow-lg"
        >
          {game.name}
        </h2>
        <p className="text-lg text-foreground/90 mb-6 max-w-2xl drop-shadow-sm">{game.description}</p>
        <Button 
          asChild 
          size="lg" 
          className="bg-primary hover:bg-primary/80 text-primary-foreground w-fit"
        >
          <Link href={`/games/${game.slug}`}>
            <PlayCircle className="mr-2 h-6 w-6" /> Launch Game
          </Link>
        </Button>
      </div>
    </div>
  );
}
