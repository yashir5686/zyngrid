
import type { PixelJumperLevel } from '@/types';

export const pixelJumperLevels: PixelJumperLevel[] = [
  {
    id: 1,
    name: 'Tutorial Valley',
    playerStart: { x: 50, y: 300 },
    platforms: [
      { x: 0, y: 350, width: 200, height: 20 },
      { x: 250, y: 300, width: 150, height: 20 },
      { x: 50, y: 200, width: 100, height: 20 },
      { x: 450, y: 250, width: 200, height: 20 },
    ],
    foodItems: [
      { x: 100, y: 320, width: 15, height: 15, collected: false },
      { x: 300, y: 270, width: 15, height: 15, collected: false },
      { x: 80, y: 170, width: 15, height: 15, collected: false },
    ],
    goal: { x: 550, y: 200, width: 30, height: 30 },
  },
  {
    id: 2,
    name: 'The Ascent',
    playerStart: { x: 30, y: 350 },
    platforms: [
      { x: 0, y: 400, width: 150, height: 20 },
      { x: 200, y: 350, width: 100, height: 20 },
      { x: 350, y: 300, width: 100, height: 20 },
      { x: 250, y: 200, width: 80, height: 20 },
      { x: 450, y: 150, width: 150, height: 20 },
    ],
    foodItems: [
      { x: 230, y: 320, width: 15, height: 15, collected: false },
      { x: 380, y: 270, width: 15, height: 15, collected: false },
      { x: 270, y: 170, width: 15, height: 15, collected: false },
    ],
    goal: { x: 550, y: 100, width: 30, height: 30 },
  },
  {
    id: 3,
    name: 'Final Leap',
    playerStart: { x: 20, y: 100 },
    platforms: [
      { x: 0, y: 150, width: 100, height: 20 },
      { x: 150, y: 250, width: 100, height: 20 }, // Requires a good jump
      { x: 300, y: 350, width: 100, height: 20 },
      { x: 500, y: 300, width: 150, height: 20 }, // Goal platform
    ],
    foodItems: [
      { x: 180, y: 220, width: 15, height: 15, collected: false },
      { x: 330, y: 320, width: 15, height: 15, collected: false },
    ],
    goal: { x: 580, y: 250, width: 30, height: 30 },
  },
];
