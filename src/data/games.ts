
import type { Game } from '@/types';

export const games: Game[] = [
  {
    id: 'snake',
    name: 'Classic Snake',
    thumbnail: 'https://i.imgur.com/dX6Zfku.png',
    slug: 'snake',
    description: 'The timeless classic, eat and grow to achieve the highest score!',
    bannerImage: 'https://i.imgur.com/dX6Zfku.png',
    dataAiHint: 'snake game',
  },
  {
    id: 'pixel-jumper',
    name: 'Pixel Jumper',
    thumbnail: 'https://i.imgur.com/hGuv3Gd.png',
    slug: 'pixel-jumper',
    description: 'Jump across platforms, collect items, and reach the goal in this pixelated adventure.',
    bannerImage: 'https://i.imgur.com/hGuv3Gd.png',
    dataAiHint: 'pixel platformer',
  },
  {
    id: 'star-shooter',
    name: 'Star Shooter',
    thumbnail: 'https://i.imgur.com/XCHt2BH.png',
    slug: 'star-shooter',
    description: 'Blast your way through waves of alien ships in this retro space shooter.',
    bannerImage: 'https://i.imgur.com/XCHt2BH.png',
    dataAiHint: 'space shooter',
  },
];

// Ensure featuredGame correctly finds 'snake' or falls back.
export const featuredGame: Game = games.find(game => game.id === 'snake') || games[0];

