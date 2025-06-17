
import type { Game, PixelJumperLevel } from '@/types';

const HIGH_SCORES_KEY_PREFIX = 'zyngrid_high_score_'; // Generic prefix for game high scores
const RECENTLY_PLAYED_KEY = 'zyngrid_recently_played';
const MAX_RECENTLY_PLAYED = 5;

// --- Generic High Score Functions ---
export const getHighScores = (): Record<string, number> => {
  if (typeof window === 'undefined') return {};
  // This function is less useful now with prefixed keys, but kept for potential broader use
  // For specific games, use their dedicated functions.
  const allKeys = Object.keys(localStorage);
  const scoreKeys = allKeys.filter(key => key.startsWith(HIGH_SCORES_KEY_PREFIX));
  const scores: Record<string, number> = {};
  scoreKeys.forEach(key => {
    const gameId = key.substring(HIGH_SCORES_KEY_PREFIX.length);
    const score = localStorage.getItem(key);
    if (score) {
      scores[gameId] = JSON.parse(score);
    }
  });
  return scores;
};

export const getHighScore = (gameIdWithSuffix: string): number => {
  if (typeof window === 'undefined') return 0;
  const score = localStorage.getItem(`${HIGH_SCORES_KEY_PREFIX}${gameIdWithSuffix}`);
  return score ? JSON.parse(score) : 0;
};

export const saveHighScore = (gameIdWithSuffix: string, score: number): void => {
  if (typeof window === 'undefined') return;
  const currentHighScore = getHighScore(gameIdWithSuffix);
  if (score > currentHighScore) {
    localStorage.setItem(`${HIGH_SCORES_KEY_PREFIX}${gameIdWithSuffix}`, JSON.stringify(score));
  }
};


// --- Recently Played ---
export const getRecentlyPlayed = (): Game[] => {
  if (typeof window === 'undefined') return [];
  const games = localStorage.getItem(RECENTLY_PLAYED_KEY);
  return games ? JSON.parse(games) : [];
};

export const addRecentlyPlayed = (game: Game): void => {
  if (typeof window === 'undefined') return;
  let recentGames = getRecentlyPlayed();
  recentGames = recentGames.filter(rg => rg.id !== game.id);
  recentGames.unshift(game);
  recentGames = recentGames.slice(0, MAX_RECENTLY_PLAYED);
  localStorage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(recentGames));
};

// --- Pixel Jumper Specific ---
const PIXEL_JUMPER_MAX_UNLOCKED_LEVEL_KEY = 'zyngrid_pixel_jumper_max_unlocked_level';
const PIXEL_JUMPER_LEVEL_HIGH_SCORE_KEY_PREFIX = `${HIGH_SCORES_KEY_PREFIX}pixeljumper_level_`;

export const getPixelJumperMaxUnlockedLevel = (): number => {
  if (typeof window === 'undefined') return 1;
  const level = localStorage.getItem(PIXEL_JUMPER_MAX_UNLOCKED_LEVEL_KEY);
  return level ? parseInt(level, 10) : 1;
};

export const savePixelJumperMaxUnlockedLevel = (level: number): void => {
  if (typeof window === 'undefined') return;
  const currentMax = getPixelJumperMaxUnlockedLevel();
  if (level > currentMax) {
    localStorage.setItem(PIXEL_JUMPER_MAX_UNLOCKED_LEVEL_KEY, level.toString());
  }
};

export const getPixelJumperLevelHighScore = (levelId: number): number => {
  if (typeof window === 'undefined') return 0;
  const score = localStorage.getItem(`${PIXEL_JUMPER_LEVEL_HIGH_SCORE_KEY_PREFIX}${levelId}`);
  return score ? parseInt(score, 10) : 0;
};

export const savePixelJumperLevelHighScore = (levelId: number, score: number): void => {
  if (typeof window === 'undefined') return;
  const currentHighScore = getPixelJumperLevelHighScore(levelId);
  if (score > currentHighScore) {
    localStorage.setItem(`${PIXEL_JUMPER_LEVEL_HIGH_SCORE_KEY_PREFIX}${levelId}`, score.toString());
  }
};


// Top Games (Simplified - could be based on play counts in a real app)
// For now, it could return a subset of all games or be based on some fixed logic
export const getTopGames = (): Game[] => {
  if (typeof window === 'undefined') return [];
  // For now, let's keep it simple and the `GameListClient` will handle this.
  return [];
};
