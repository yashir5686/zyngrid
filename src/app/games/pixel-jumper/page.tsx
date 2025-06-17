
'use client';

import PixelJumperGame from '@/components/pixel-jumper-game';
import { games } from '@/data/games';
import { addRecentlyPlayed } from '@/lib/local-storage';
import type { Game } from '@/types';
import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PixelJumperGamePage() {
  const gameInfo : Game | undefined = games.find(g => g.id === 'pixel-jumper');

  useEffect(() => {
    if (gameInfo) {
      addRecentlyPlayed(gameInfo);
    }
  }, [gameInfo]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Games
          </Link>
        </Button>
      </div>
      <PixelJumperGame />
    </div>
  );
}
