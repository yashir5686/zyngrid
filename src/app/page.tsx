import { games as allGamesData, featuredGame } from '@/data/games';
import GameCard from '@/components/game-card';
import FeaturedGameBanner from '@/components/featured-game-banner';
import GameListClient from '@/components/game-list-client';
import { Gamepad2 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {featuredGame && <FeaturedGameBanner game={featuredGame} />}

      <section className="my-12">
        <h2 className="text-3xl font-headline mb-6 text-primary flex items-center">
          <Gamepad2 className="mr-3 h-8 w-8 text-accent" /> All Games
        </h2>
        {allGamesData.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {allGamesData.map(game => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No games available at the moment. Check back soon!</p>
        )}
      </section>

      <GameListClient />
    </div>
  );
}
