
'use client';

import type { Player, Platform, FoodItem, Goal, PixelJumperLevel } from '@/types';
import { pixelJumperLevels } from '@/data/pixel-jumper-levels';
import {
  getPixelJumperLevelHighScore,
  savePixelJumperLevelHighScore,
  getPixelJumperMaxUnlockedLevel,
  savePixelJumperMaxUnlockedLevel,
} from '@/lib/local-storage';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Home, Play, RotateCcw, Trophy, CheckCircle, XCircle, Gamepad2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 450;
const PLAYER_WIDTH = 20;
const PLAYER_HEIGHT = 30;
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const PLAYER_SPEED = 5;

type GameState = 'menu' | 'level_select' | 'playing' | 'level_complete' | 'game_over_fall' | 'all_levels_complete';

export default function PixelJumperGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>('menu');
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [player, setPlayer] = useState<Player | null>(null);
  const [currentPlatforms, setCurrentPlatforms] = useState<Platform[]>([]);
  const [currentFoodItems, setCurrentFoodItems] = useState<FoodItem[]>([]);
  const [currentGoal, setCurrentGoal] = useState<Goal | null>(null);
  const [score, setScore] = useState(0);
  const [levelHighScore, setLevelHighScore] = useState(0);
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState(1);
  const [colorValues, setColorValues] = useState({
    background: '220 11% 15%', // Default HSL components
    foreground: '0 0% 98%',
    primary: '286 82% 54%',
    accent: '197 84% 54%',
    destructive: '0 72% 51%',
    card: '220 11% 20%',
    muted: '220 11% 22%',
  });

  const keysPressed = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (typeof window !== 'undefined' && document.documentElement) {
      const computedStyle = getComputedStyle(document.documentElement);
      setColorValues({
        background: computedStyle.getPropertyValue('--background').trim(),
        foreground: computedStyle.getPropertyValue('--foreground').trim(),
        primary: computedStyle.getPropertyValue('--primary').trim(),
        accent: computedStyle.getPropertyValue('--accent').trim(),
        destructive: computedStyle.getPropertyValue('--destructive').trim(),
        card: computedStyle.getPropertyValue('--card').trim(),
        muted: computedStyle.getPropertyValue('--muted').trim(),
      });
    }
    setMaxUnlockedLevel(getPixelJumperMaxUnlockedLevel());
  }, []);

  const loadLevel = useCallback((levelIndex: number) => {
    if (levelIndex < 0 || levelIndex >= pixelJumperLevels.length) {
        setGameState('all_levels_complete');
        return;
    }
    const levelData = pixelJumperLevels[levelIndex];
    setPlayer({
      x: levelData.playerStart.x,
      y: levelData.playerStart.y,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      vx: 0,
      vy: 0,
      isJumping: false,
      color: `hsl(${colorValues.primary})`,
    });
    setCurrentPlatforms(levelData.platforms.map(p => ({...p, color: p.color || `hsl(${colorValues.muted})`})));
    setCurrentFoodItems(levelData.foodItems.map(f => ({ ...f, collected: false, color: f.color || `hsl(${colorValues.accent})` })));
    setCurrentGoal({...levelData.goal, color: levelData.goal.color || `hsl(${colorValues.primary})`});
    setCurrentLevelIndex(levelIndex);
    setScore(0);
    setLevelHighScore(getPixelJumperLevelHighScore(levelData.id));
    setGameState('playing');
    keysPressed.current = {};
  }, [colorValues]);

  const resetCurrentLevel = useCallback(() => {
    loadLevel(currentLevelIndex);
  }, [currentLevelIndex, loadLevel]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = true;
      if (e.key === ' ' && player && !player.isJumping && gameState === 'playing') {
        setPlayer(p => p ? { ...p, vy: JUMP_FORCE, isJumping: true } : null);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [player, gameState]);

  useEffect(() => {
    if (gameState !== 'playing' || !player) return;

    const gameLoop = setInterval(() => {
      setPlayer(prevPlayer => {
        if (!prevPlayer) return null;
        let { x, y, vx, vy, isJumping, width, height } = prevPlayer;

        // Horizontal movement
        vx = 0;
        if (keysPressed.current['ArrowLeft'] || keysPressed.current['a']) {
          vx = -PLAYER_SPEED;
        }
        if (keysPressed.current['ArrowRight'] || keysPressed.current['d']) {
          vx = PLAYER_SPEED;
        }
        x += vx;

        // Apply gravity
        vy += GRAVITY;
        y += vy;

        // Boundary checks (simple for now)
        if (x < 0) x = 0;
        if (x + width > CANVAS_WIDTH) x = CANVAS_WIDTH - width;
        if (y + height > CANVAS_HEIGHT) { // Fell off bottom
            setGameState('game_over_fall');
            return prevPlayer; // Stop further updates for this frame
        }


        // Platform collision
        let onPlatform = false;
        currentPlatforms.forEach(platform => {
          if (
            x < platform.x + platform.width &&
            x + width > platform.x &&
            y < platform.y + platform.height &&
            y + height > platform.y
          ) {
            // Collision detected
            if (vy > 0 && prevPlayer.y + prevPlayer.height <= platform.y) { // Landing on top
              y = platform.y - height;
              vy = 0;
              isJumping = false;
              onPlatform = true;
            } else if (vy < 0 && prevPlayer.y >= platform.y + platform.height) { // Hitting bottom of platform
                y = platform.y + platform.height;
                vy = 0;
            } else if (vx > 0 && prevPlayer.x + prevPlayer.width <= platform.x) { // Hitting left side of platform
                x = platform.x - width;
                vx = 0;
            } else if (vx < 0 && prevPlayer.x >= platform.x + platform.width) { // Hitting right side of platform
                x = platform.x + platform.width;
                vx = 0;
            }
          }
        });
        if (!onPlatform && y + height < CANVAS_HEIGHT) { // Check if not on a platform and not on ground (if ground existed)
            // isJumping = true; // No, this makes continuous jumping
        }


        // Food collection
        setCurrentFoodItems(prevFoodItems =>
          prevFoodItems.map(food => {
            if (
              !food.collected &&
              x < food.x + food.width &&
              x + width > food.x &&
              y < food.y + food.height &&
              y + height > food.y
            ) {
              setScore(s => s + 10);
              return { ...food, collected: true };
            }
            return food;
          })
        );
        
        // Goal collision
        if (currentGoal &&
            x < currentGoal.x + currentGoal.width &&
            x + width > currentGoal.x &&
            y < currentGoal.y + currentGoal.height &&
            y + height > currentGoal.y
        ) {
            const levelData = pixelJumperLevels[currentLevelIndex];
            savePixelJumperLevelHighScore(levelData.id, score);
            if (score > levelHighScore) setLevelHighScore(score);
            
            const nextLevel = currentLevelIndex + 1;
            savePixelJumperMaxUnlockedLevel(nextLevel +1); // +1 because levels are 0-indexed, display is 1-indexed
            setMaxUnlockedLevel(getPixelJumperMaxUnlockedLevel());

            setGameState('level_complete');
            return prevPlayer; // Stop player updates
        }


        return { ...prevPlayer, x, y, vx, vy, isJumping };
      });
    }, 1000 / 60); // Approx 60 FPS

    return () => clearInterval(gameLoop);
  }, [gameState, player, currentPlatforms, currentGoal, score, levelHighScore, currentLevelIndex]);


  useEffect(() => { // Drawing effect
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = `hsl(${colorValues.background})`;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (gameState === 'playing' || gameState === 'level_complete' || gameState === 'game_over_fall') {
        currentPlatforms.forEach(platform => {
            ctx.fillStyle = platform.color || `hsl(${colorValues.muted})`;
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        });

        currentFoodItems.forEach(food => {
            if (!food.collected) {
            ctx.fillStyle = food.color || `hsl(${colorValues.accent})`;
            ctx.fillRect(food.x, food.y, food.width, food.height);
            }
        });

        if (currentGoal) {
            ctx.fillStyle = currentGoal.color || `hsl(${colorValues.primary})`;
            ctx.fillRect(currentGoal.x, currentGoal.y, currentGoal.width, currentGoal.height);
        }

        if (player) {
            ctx.fillStyle = player.color || `hsl(${colorValues.primary})`;
            ctx.fillRect(player.x, player.y, player.width, player.height);
        }
        
        // Draw score and level info
        ctx.fillStyle = `hsl(${colorValues.foreground})`;
        ctx.font = '18px "Space Grotesk", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Level: ${pixelJumperLevels[currentLevelIndex].name}`, 10, 25);
        ctx.fillText(`Score: ${score}`, 10, 50);
        ctx.textAlign = 'right';
        ctx.fillText(`High Score: ${levelHighScore}`, CANVAS_WIDTH - 10, 25);
    }
    
    if (gameState === 'level_complete') {
        ctx.fillStyle = `hsla(${colorValues.foreground}, 0.8)`;
        ctx.textAlign = 'center';
        ctx.font = 'bold 36px "Space Grotesk", sans-serif';
        ctx.fillText('Level Complete!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
        ctx.font = '20px "Space Grotesk", sans-serif';
        ctx.fillText(`Your Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    }

    if (gameState === 'game_over_fall') {
        ctx.fillStyle = `hsla(${colorValues.destructive}, 0.8)`;
        ctx.textAlign = 'center';
        ctx.font = 'bold 36px "Space Grotesk", sans-serif';
        ctx.fillText('Game Over!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
        ctx.font = '20px "Space Grotesk", sans-serif';
        ctx.fillText('You fell off the screen.', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    }
     if (gameState === 'all_levels_complete') {
        ctx.fillStyle = `hsla(${colorValues.primary}, 0.8)`;
        ctx.textAlign = 'center';
        ctx.font = 'bold 36px "Space Grotesk", sans-serif';
        ctx.fillText('Congratulations!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
        ctx.font = '20px "Space Grotesk", sans-serif';
        ctx.fillText('You have completed all levels!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    }


  }, [gameState, player, currentPlatforms, currentFoodItems, currentGoal, score, levelHighScore, currentLevelIndex, colorValues]);

  const handleStartGame = () => {
    loadLevel(0);
  };

  const handleLevelSelect = (levelIdStr: string) => {
    const levelId = parseInt(levelIdStr, 10);
    const levelIndex = pixelJumperLevels.findIndex(l => l.id === levelId);
    if (levelIndex !== -1 && levelId <= maxUnlockedLevel) {
      loadLevel(levelIndex);
    }
  };
  
  const handleNextLevel = () => {
    const nextLevelIdx = currentLevelIndex + 1;
    if (nextLevelIdx < pixelJumperLevels.length) {
      loadLevel(nextLevelIdx);
    } else {
      setGameState('all_levels_complete');
    }
  };

  if (gameState === 'menu') {
    return (
      <div className="flex flex-col items-center justify-center p-4 min-h-[70vh] gap-6">
        <Card className="w-full max-w-md bg-card/90 shadow-xl text-center">
          <CardHeader>
            <CardTitle className="text-4xl font-headline text-primary flex items-center justify-center gap-2">
                <Gamepad2 size={36} /> Pixel Jumper
            </CardTitle>
            <CardDescription className="text-muted-foreground">Jump and collect to reach the goal!</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button onClick={handleStartGame} size="lg" className="bg-primary hover:bg-primary/80 text-primary-foreground font-headline">
              <Play className="mr-2" /> Start Game (Level 1)
            </Button>
            <Button onClick={() => setGameState('level_select')} size="lg" variant="secondary" className="font-headline">
              Select Level
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (gameState === 'level_select') {
    return (
      <div className="flex flex-col items-center justify-center p-4 min-h-[70vh] gap-6">
        <Card className="w-full max-w-md bg-card/90 shadow-xl text-center">
          <CardHeader>
            <CardTitle className="text-3xl font-headline text-primary">Select Level</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Select onValueChange={handleLevelSelect}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a level" />
              </SelectTrigger>
              <SelectContent>
                {pixelJumperLevels.map(level => (
                  <SelectItem 
                    key={level.id} 
                    value={level.id.toString()} 
                    disabled={level.id > maxUnlockedLevel}
                  >
                    Level {level.id}: {level.name} {level.id > maxUnlockedLevel ? "(Locked)" : `(High Score: ${getPixelJumperLevelHighScore(level.id)})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setGameState('menu')} variant="outline" className="mt-4">
              <ChevronLeft className="mr-2" /> Back to Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 p-4 md:p-8">
      <Card className="w-full max-w-[700px] bg-card/90 shadow-xl">
        <CardHeader className="text-center pb-2">
            <CardTitle className="text-3xl font-headline text-primary">Pixel Jumper</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
            <div className="border-4 border-primary rounded-md overflow-hidden shadow-inner bg-background">
                <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                aria-label="Pixel Jumper game board"
                role="img"
                />
            </div>
          {(gameState === 'level_complete' || gameState === 'game_over_fall' || gameState === 'all_levels_complete') && (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {gameState === 'level_complete' && currentLevelIndex < pixelJumperLevels.length - 1 && (
                <Button onClick={handleNextLevel} size="lg" className="bg-accent hover:bg-accent/80 text-accent-foreground">
                  <ChevronRight className="mr-2"/> Next Level
                </Button>
              )}
               {gameState === 'level_complete' && currentLevelIndex >= pixelJumperLevels.length - 1 && (
                 <Button onClick={() => setGameState('all_levels_complete')} size="lg" className="bg-green-500 hover:bg-green-600 text-white">
                    <CheckCircle className="mr-2"/> Finish Game
                </Button>
              )}
              {(gameState === 'game_over_fall') && (
                 <Button onClick={resetCurrentLevel} size="lg" className="bg-primary hover:bg-primary/80 text-primary-foreground">
                    <RotateCcw className="mr-2" /> Try Again
                </Button>
              )}
              <Button onClick={() => setGameState('menu')} size="lg" variant="outline">
                <Home className="mr-2" /> Main Menu
              </Button>
            </div>
          )}
           {gameState === 'playing' && (
             <p className="text-muted-foreground text-sm">Use <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Arrow Keys</kbd> or <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">A</kbd>/<kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">D</kbd> to move, <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Space</kbd> to jump.</p>
           )}
        </CardContent>
      </Card>
       <div className="text-center text-muted-foreground p-4 bg-card/50 rounded-lg max-w-md">
        <h3 className="text-xl font-headline text-foreground mb-2">How to Play</h3>
        <ul className="list-disc list-inside text-left space-y-1">
          <li>Use <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Arrow Keys</kbd> or <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">A</kbd>/<kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">D</kbd> for left/right movement.</li>
          <li>Press <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Spacebar</kbd> to jump.</li>
          <li>Collect all <span className="text-accent font-semibold">blue items</span>.</li>
          <li>Reach the <span className="text-primary font-semibold">purple goal</span> to complete the level.</li>
          <li>Avoid falling off the screen!</li>
        </ul>
      </div>
    </div>
  );
}

