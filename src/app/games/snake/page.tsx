'use client'; // This page hosts a client-side interactive game

import SnakeGame from '@/components/snake-game';
import { games, featuredGame } from '@/data/games';
import { addRecentlyPlayed } from '@/lib/local-storage';
import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function SnakeGamePage() {
  const snakeGameInfo = games.find(g => g.id === 'snake') || featuredGame;

  useEffect(() => {
    if (snakeGameInfo) {
      addRecentlyPlayed(snakeGameInfo);
    }
  }, [snakeGameInfo]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Games
          </Link>
        </Button>
      </div>
      <SnakeGame />
    </div>
  );
}
