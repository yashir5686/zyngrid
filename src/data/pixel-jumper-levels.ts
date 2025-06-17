
// This file now primarily defines the metadata for levels (ID, name)
// The actual level content (platforms, items, enemies, traps) is procedurally generated
// in pixel-jumper-game.tsx

// We only need to export the configuration that the level selection UI and progression system use.
// The actual 'platforms', 'foodItems', 'goal' etc., will be generated.
// For the type `PixelJumperLevel` in `types/index.ts`, those fields can be made optional
// or the game component will just use the `id` and `name` from here and generate the rest.

// For simplicity, we'll keep the structure for id and name,
// which are used by the level selection dropdown.
// The game component will use the levelIndex to seed its generation.

type PixelJumperLevelConfig = {
  id: number;
  name: string;
};

export const pixelJumperLevels: PixelJumperLevelConfig[] = [
  {
    id: 1,
    name: 'Grassy Plains', // Name changed to reflect generated nature
  },
  {
    id: 2,
    name: 'Rocky Ascent',
  },
  {
    id: 3,
    name: 'Perilous Peaks',
  },
  {
    id: 4,
    name: 'The Gauntlet',
  },
  {
    id: 5,
    name: 'Final Frontier',
  }
];
