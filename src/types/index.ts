
export interface Game {
  id: string;
  name: string;
  thumbnail: string;
  slug: string;
  description: string;
  bannerImage?: string; // Optional: For featured game banner
  dataAiHint?: string; // For placeholder image search keywords
}

// Types for Pixel Jumper Game
export interface PixelJumperEntity {
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
}

export interface Player extends PixelJumperEntity {
  vx: number; // velocity x
  vy: number; // velocity y
  isJumping: boolean;
}

export interface Platform extends PixelJumperEntity {}

export interface FoodItem extends PixelJumperEntity {
  collected: boolean;
}

export interface Goal extends PixelJumperEntity {}

export interface Enemy extends PixelJumperEntity {
  vx: number; // Horizontal velocity for patrolling
  originalX: number; // To determine patrol range
  patrolRange: number;
}

export interface Trap extends PixelJumperEntity {}

export interface PixelJumperLevel {
  id: number;
  name: string;
  // These will be generated dynamically now
  playerStart: { x: number; y: number };
  platforms: Platform[];
  foodItems: FoodItem[];
  enemies: Enemy[];
  traps: Trap[];
  goal: Goal;
}
