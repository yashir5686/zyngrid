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
    thumbnail: 'https://placehold.co/300x200.png',
    slug: 'pixel-jumper',
    description: 'Jump across platforms and avoid obstacles in this pixelated adventure.',
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

export const featuredGame: Game = games.find(game => game.id === 'snake') || games[0];
