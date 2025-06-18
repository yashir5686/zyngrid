'use client';

import { useState, useEffect } from 'react';
import type { Game } from '@/types';
import { getRecentlyPlayed, getHighScores } from '@/lib/local-storage';
import GameCard from './game-card';
import { History, Star } from 'lucide-react';
import { games as allGamesData } from '@/data/games'; // Import all games data

export default function GameListClient() {
  const [recentlyPlayedGames, setRecentlyPlayedGames] = useState<Game[]>([]);
  const [topGames, setTopGames] = useState<Game[]>([]);

  useEffect(() => {
    setRecentlyPlayedGames(getRecentlyPlayed());

    // Basic "Top Games" logic: sort by high score (desc), then by name.
    // This is a simplified example.
    const highScores = getHighScores();
    const sortedGames = [...allGamesData].sort((a, b) => {
      const scoreA = highScores[a.id] || 0;
      const scoreB = highScores[b.id] || 0;
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      return a.name.localeCompare(b.name);
    });
    setTopGames(sortedGames.slice(0, 3)); // Show top 3

  }, []);

  if (recentlyPlayedGames.length === 0 && topGames.length === 0) {
    return null; // Don't render sections if no data
  }

  return (
    <>
      {topGames.length > 0 && (
        <section className="my-12">
          <h2 
            className="text-3xl font-headline mb-6 text-foreground flex items-center"
          >
            <Star className="mr-3 h-8 w-8 text-accent" /> Top Games {/* Icon is accent (light gray) */}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topGames.map(game => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      )}

      {recentlyPlayedGames.length > 0 && (
        <section className="my-12">
          <h2 
            className="text-3xl font-headline mb-6 text-foreground flex items-center"
          >
            <History className="mr-3 h-8 w-8 text-accent" /> Recently Played {/* Icon is accent (light gray) */}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentlyPlayedGames.map(game => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
