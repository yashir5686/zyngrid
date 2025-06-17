import type { Game } from '@/types';

const HIGH_SCORES_KEY = 'zyngrid_high_scores';
const RECENTLY_PLAYED_KEY = 'zyngrid_recently_played';
const MAX_RECENTLY_PLAYED = 5;

// High Scores
export const getHighScores = (): Record<string, number> => {
  if (typeof window === 'undefined') return {};
  const scores = localStorage.getItem(HIGH_SCORES_KEY);
  return scores ? JSON.parse(scores) : {};
};

export const getHighScore = (gameId: string): number => {
  if (typeof window === 'undefined') return 0;
  const scores = getHighScores();
  return scores[gameId] || 0;
};

export const saveHighScore = (gameId: string, score: number): void => {
  if (typeof window === 'undefined') return;
  const scores = getHighScores();
  if (score > (scores[gameId] || 0)) {
    scores[gameId] = score;
    localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(scores));
  }
};

// Recently Played
export const getRecentlyPlayed = (): Game[] => {
  if (typeof window === 'undefined') return [];
  const games = localStorage.getItem(RECENTLY_PLAYED_KEY);
  return games ? JSON.parse(games) : [];
};

export const addRecentlyPlayed = (game: Game): void => {
  if (typeof window === 'undefined') return;
  let recentGames = getRecentlyPlayed();
  // Remove if already exists to add it to the top
  recentGames = recentGames.filter(rg => rg.id !== game.id);
  recentGames.unshift(game);
  // Limit the number of recently played games
  recentGames = recentGames.slice(0, MAX_RECENTLY_PLAYED);
  localStorage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(recentGames));
};

// Top Games (Simplified - could be based on play counts in a real app)
// For now, it could return a subset of all games or be based on some fixed logic
export const getTopGames = (): Game[] => {
  // This is a placeholder. In a real app, this might be fetched or calculated.
  // For now, let's just return the first few games as "top".
  if (typeof window === 'undefined') return [];
  // Example: assume games with higher (mock) scores are "top"
  const highScores = getHighScores();
  const allGames = // This would need access to the main games list.
                   // For simplicity here, we'll return an empty array or a hardcoded list.
                   // A better approach would be to pass the `games` array from `src/data/games.ts`
                   // to a client component that then sorts them.
                   // For now, let's keep it simple and the `GameListClient` will handle this.
                   []; 
  return allGames;
};
