
import type { Game } from '@/types';

export const games: Game[] = [
  {
    id: 'snake',
    name: 'Classic Snake',
    thumbnail: 'https://placehold.co/300x200.png',
    slug: 'snake',
    description: 'The timeless classic, eat and grow to achieve the highest score!',
    bannerImage: 'https://placehold.co/1200x400.png',
    dataAiHint: 'snake game',
  },
  {
    id: 'pixel-jumper',
    name: 'Pixel Jumper',
    thumbnail: 'https://placehold.co/300x200.png', // You might want a new placeholder
    slug: 'pixel-jumper',
    description: 'Jump across platforms, collect items, and reach the goal in this pixelated adventure.',
    bannerImage: 'https://placehold.co/1200x400.png', // Optional: new banner
    dataAiHint: 'pixel platformer',
  },
  {
    id: 'star-shooter',
    name: 'Star Shooter',
    thumbnail: 'https://placehold.co/300x200.png',
    slug: 'star-shooter',
    description: 'Blast your way through waves of alien ships in this retro space shooter.',
    dataAiHint: 'space shooter',
  },
];

// Ensure featuredGame correctly finds 'snake' or falls back.
// You might want to change the featured game or update its logic.
export const featuredGame: Game = games.find(game => game.id === 'snake') || games[0];
