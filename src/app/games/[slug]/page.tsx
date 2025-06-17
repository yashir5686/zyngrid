
import { games } from '@/data/games';
import type { Game } from '@/types';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Construction } from 'lucide-react';
import Image from 'next/image';
import DynamicSnakeLoader from '@/components/dynamic-snake-loader';
import DynamicPixelJumperLoader from '@/components/dynamic-pixel-jumper-loader';
import DynamicStarShooterLoader from '@/components/dynamic-star-shooter-loader';

export async function generateStaticParams() {
  return games.map((game) => ({
    slug: game.slug,
  }));
}

interface GamePageProps {
  params: { slug: string };
}

export default function GamePage({ params }: GamePageProps) {
  const { slug } = params;
  const game = games.find((g) => g.slug === slug);

  if (!game) {
    notFound();
  }

  if (game.id === 'snake') {
    return <DynamicSnakeLoader />;
  }

  if (game.id === 'pixel-jumper') {
    return <DynamicPixelJumperLoader />;
  }

  if (game.id === 'star-shooter') {
    return <DynamicStarShooterLoader />;
  }

  // Placeholder for other games
  return (
    <div className="container mx-auto px-4 py-8 text-center">
       <div className="mb-6 text-left">
        <Button variant="outline" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Games
          </Link>
        </Button>
      </div>
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-card p-8 rounded-lg shadow-xl">
        <Construction className="w-24 h-24 text-primary mb-6" />
        <h1 className="text-4xl font-headline text-primary mb-4">{game.name}</h1>
        <p className="text-xl text-muted-foreground mb-2">{game.description}</p>
        <p className="text-lg text-accent mb-8">This game is currently under construction. Check back soon!</p>
        {game.thumbnail && (
            <div className="relative w-full max-w-md h-64 rounded-md overflow-hidden mb-4">
                 <Image
                    src={game.thumbnail}
                    alt={game.name}
                    fill
                    style={{ objectFit: 'contain' }}
                    data-ai-hint={game.dataAiHint || 'game concept'}
                  />
            </div>
        )}
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: GamePageProps) {
  const game = games.find((g) => g.slug === params.slug);
  if (!game) {
    return {
      title: 'Game Not Found',
    };
  }
  return {
    title: `${game.name} - Zyngrid`,
    description: `Play ${game.name} on Zyngrid. ${game.description}`,
  };
}
