
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

export interface Enemy extends PixelJumperEntity {
  vx: number; // Horizontal velocity for patrolling
  originalX: number; // To determine patrol range
  patrolRange: number;
}

export interface Trap extends PixelJumperEntity {}

// Types for Star Shooter Game
export interface StarShooterEntity {
  id?: string; // Optional unique ID for entities
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
}

export interface StarShooterPlayer extends StarShooterEntity {
  speed: number;
}

export interface Bullet extends StarShooterEntity {
  speed: number;
}

export interface EnemyShip extends StarShooterEntity {
  speed: number;
  health?: number; // Optional: for more complex enemies
  variant: 'A' | 'B'; // To determine which SVG path to use
}

export interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  color?: string;
}

