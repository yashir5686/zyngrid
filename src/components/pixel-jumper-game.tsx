
'use client';

import type { Player, Platform, FoodItem, Goal, PixelJumperLevel, Enemy, Trap } from '@/types';
import { pixelJumperLevels as staticPixelJumperLevelsConfig } from '@/data/pixel-jumper-levels';
import {
  getPixelJumperLevelHighScore,
  savePixelJumperLevelHighScore,
  getPixelJumperMaxUnlockedLevel,
  savePixelJumperMaxUnlockedLevel,
} from '@/lib/local-storage';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Home, Play, RotateCcw, Gamepad2, AlertTriangle, Skull } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


const VIEWPORT_WIDTH = 800; // The visible width of the game area on screen
const VIEWPORT_HEIGHT = 450; // The visible height of the game area on screen
const PLAYER_WIDTH = 20;
const PLAYER_HEIGHT = 30;
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const PLAYER_SPEED = 5;
const ENEMY_SPEED = 1;
const ENEMY_PATROL_RANGE = 50;
const ENEMY_WIDTH = 25;
const ENEMY_HEIGHT = 25;
const TRAP_SIZE = 20;


type GameState = 'menu' | 'level_select' | 'playing' | 'level_complete' | 'game_over_fall' | 'game_over_enemy' | 'game_over_trap' | 'all_levels_complete';

// Helper function for random numbers
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export default function PixelJumperGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>('menu');
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [player, setPlayer] = useState<Player | null>(null);
  const [currentPlatforms, setCurrentPlatforms] = useState<Platform[]>([]);
  const [currentFoodItems, setCurrentFoodItems] = useState<FoodItem[]>([]);
  const [currentEnemies, setCurrentEnemies] = useState<Enemy[]>([]);
  const [currentTraps, setCurrentTraps] = useState<Trap[]>([]);
  const [currentGoal, setCurrentGoal] = useState<Goal | null>(null);
  const [score, setScore] = useState(0);
  const [levelHighScore, setLevelHighScore] = useState(0);
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState(1);
  const [cameraOffsetX, setCameraOffsetX] = useState(0);
  const [levelContentWidth, setLevelContentWidth] = useState(VIEWPORT_WIDTH);

  const [colorValues, setColorValues] = useState({
    background: '220 11% 15%',
    foreground: '0 0% 98%',
    primary: '286 82% 54%',
    accent: '197 84% 54%',
    destructive: '0 72% 51%',
    card: '220 11% 20%',
    muted: '220 11% 22%',
    enemyColor: '30 100% 50%',
    trapColor: '0 100% 50%',
  });

  const keysPressed = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (typeof window !== 'undefined' && document.documentElement) {
      const computedStyle = getComputedStyle(document.documentElement);
      setColorValues(prev => ({
        ...prev,
        background: computedStyle.getPropertyValue('--background').trim(),
        foreground: computedStyle.getPropertyValue('--foreground').trim(),
        primary: computedStyle.getPropertyValue('--primary').trim(),
        accent: computedStyle.getPropertyValue('--accent').trim(),
        destructive: computedStyle.getPropertyValue('--destructive').trim(),
        card: computedStyle.getPropertyValue('--card').trim(),
        muted: computedStyle.getPropertyValue('--muted').trim(),
      }));
    }
    setMaxUnlockedLevel(getPixelJumperMaxUnlockedLevel());
  }, []);

  const generateProceduralLevelContent = useCallback((levelIdx: number): Omit<PixelJumperLevel, 'id' | 'name'> & { calculatedLevelWidth: number } => {
    const platforms: Platform[] = [];
    const foodItems: FoodItem[] = [];
    const enemies: Enemy[] = [];
    const traps: Trap[] = [];

    let currentX = 50;
    const startPlatformY = VIEWPORT_HEIGHT - 50 - getRandomInt(0, 50);
    const playerStart = { x: currentX + 20, y: startPlatformY - PLAYER_HEIGHT - 10 };

    // Start platform
    const startPlatform: Platform = { x: currentX, y: startPlatformY, width: getRandomInt(100, 150), height: 20, color: `hsl(${colorValues.muted})` };
    platforms.push(startPlatform);
    currentX += startPlatform.width;

    const numPlatforms = 10 + levelIdx * 2 + getRandomInt(2,5);
    let lastPlatform = startPlatform;
    const minLevelWidth = VIEWPORT_WIDTH * (1.5 + levelIdx * 0.2);

    for (let i = 0; i < numPlatforms || currentX < minLevelWidth; i++) {
      const gapX = getRandomInt(60, 130);
      currentX += gapX;

      let newY = lastPlatform.y + getRandomInt(-90, 90);
      newY = Math.max(150, Math.min(VIEWPORT_HEIGHT - 80, newY));

      const newWidth = getRandomInt(100, 250);
      const platform: Platform = { x: currentX, y: newY, width: newWidth, height: 20, color: `hsl(${colorValues.muted})` };
      platforms.push(platform);

      if (Math.random() < 0.65) {
        foodItems.push({
            x: platform.x + platform.width / 2 - 7.5,
            y: platform.y - 25,
            width: 15, height: 15,
            collected: false,
            color: `hsl(${colorValues.accent})`
        });
      }

      if (i > 0 && Math.random() < (0.25 + levelIdx * 0.06) && platform.width > ENEMY_WIDTH + 30) {
         enemies.push({
            x: platform.x + 15,
            y: platform.y - ENEMY_HEIGHT,
            width: ENEMY_WIDTH,
            height: ENEMY_HEIGHT,
            vx: ENEMY_SPEED * (Math.random() > 0.5 ? 1 : -1),
            originalX: platform.x + 15,
            patrolRange: Math.min(ENEMY_PATROL_RANGE + levelIdx * 5, platform.width - ENEMY_WIDTH - 30),
            color: `hsl(${colorValues.enemyColor})`,
         });
      }

      if (i > 1 && Math.random() < (0.20 + levelIdx * 0.05)) {
        if (gapX > TRAP_SIZE + 30 && lastPlatform.y > VIEWPORT_HEIGHT - 100) {
            traps.push({
                x: lastPlatform.x + lastPlatform.width + (gapX / 2) - (TRAP_SIZE / 2),
                y: VIEWPORT_HEIGHT - TRAP_SIZE - 10,
                width: TRAP_SIZE,
                height: TRAP_SIZE,
                color: `hsl(${colorValues.trapColor})`,
            });
        } else if (platform.width > TRAP_SIZE + 40 && platform.y > VIEWPORT_HEIGHT - 100 && Math.random() < 0.5) {
             traps.push({
                x: platform.x + getRandomInt(15, platform.width - TRAP_SIZE - 15),
                y: platform.y - TRAP_SIZE,
                width: TRAP_SIZE,
                height: TRAP_SIZE,
                color: `hsl(${colorValues.trapColor})`,
            });
        }
      }
      lastPlatform = platform;
      currentX += platform.width;
    }

    const calculatedLevelWidth = Math.max(currentX + 100, minLevelWidth + 200);
    const goalPlatform = platforms[platforms.length -1];
    const goalX = Math.max(goalPlatform.x + goalPlatform.width + 50, calculatedLevelWidth - 150);
    const goal: Goal = {
        x: goalX,
        y: goalPlatform.y - 40,
        width: 30, height: 30, color: `hsl(${colorValues.primary})`
    };
    if (goal.y < 0) goal.y = 20;


    return { playerStart, platforms, foodItems, enemies, traps, goal, calculatedLevelWidth };
  }, [colorValues]);


  const loadLevel = useCallback((levelIndex: number) => {
    if (levelIndex < 0 || levelIndex >= staticPixelJumperLevelsConfig.length) {
        setGameState('all_levels_complete');
        return;
    }
    const { playerStart, platforms, foodItems, enemies, traps, goal, calculatedLevelWidth } = generateProceduralLevelContent(levelIndex);

    setPlayer({
      x: playerStart.x,
      y: playerStart.y,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      vx: 0,
      vy: 0,
      isJumping: false,
      color: `hsl(${colorValues.primary})`,
    });
    setCurrentPlatforms(platforms);
    setCurrentFoodItems(foodItems);
    setCurrentEnemies(enemies);
    setCurrentTraps(traps);
    setCurrentGoal(goal);
    setCurrentLevelIndex(levelIndex);
    setScore(0);
    setLevelHighScore(getPixelJumperLevelHighScore(staticPixelJumperLevelsConfig[levelIndex].id));
    setLevelContentWidth(calculatedLevelWidth);
    setCameraOffsetX(0);
    setGameState('playing');
    keysPressed.current = {};
  }, [colorValues, generateProceduralLevelContent]);

  const resetCurrentLevel = useCallback(() => {
    loadLevel(currentLevelIndex);
  }, [currentLevelIndex, loadLevel]);

  useEffect(() => {
    const gameActiveStates: GameState[] = ['playing', 'level_complete', 'game_over_fall', 'game_over_enemy', 'game_over_trap', 'all_levels_complete'];
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'playing') {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'a', 'd', 'w', 's'].includes(e.key)) {
          e.preventDefault();
        }
        keysPressed.current[e.key] = true;
        if ((e.key === ' ' || e.key.toLowerCase() === 'w' || e.key === 'ArrowUp') && player && !player.isJumping) {
          setPlayer(p => p ? { ...p, vy: JUMP_FORCE, isJumping: true } : null);
        }
      }
      if (e.key === 'Escape' && gameActiveStates.includes(gameState)) {
        e.preventDefault();
        setGameState('menu');
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (gameState === 'playing') {
         if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'a', 'd', 'w', 's'].includes(e.key)) {
          e.preventDefault();
        }
      }
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
      // Update Player
      setPlayer(prevPlayer => {
        if (!prevPlayer) return null;
        let { x, y, vx, vy, isJumping, width, height } = prevPlayer;

        vx = 0;
        if (keysPressed.current['ArrowLeft'] || keysPressed.current['a']) {
          vx = -PLAYER_SPEED;
        }
        if (keysPressed.current['ArrowRight'] || keysPressed.current['d']) {
          vx = PLAYER_SPEED;
        }
        x += vx;

        vy += GRAVITY;
        y += vy;

        if (x < 0) x = 0;
        if (x + width > levelContentWidth) x = levelContentWidth - width;

        if (y < 0) {
            y = 0;
            vy = 0;
        }
        if (y + height > VIEWPORT_HEIGHT) {
            setGameState('game_over_fall');
            return prevPlayer;
        }

        let onPlatform = false;
        currentPlatforms.forEach(platform => {
          if (
            x < platform.x + platform.width &&
            x + width > platform.x &&
            y < platform.y + platform.height &&
            y + height > platform.y
          ) {
            if (vy > 0 && prevPlayer.y + prevPlayer.height <= platform.y) {
              y = platform.y - height;
              vy = 0;
              isJumping = false;
              onPlatform = true;
            } else if (vy < 0 && prevPlayer.y >= platform.y + platform.height) {
                y = platform.y + platform.height;
                vy = 0;
            } else if (vx > 0 && prevPlayer.x + prevPlayer.width <= platform.x && y + height > platform.y && y < platform.y + platform.height) {
                x = platform.x - width;
                vx = 0;
            } else if (vx < 0 && prevPlayer.x >= platform.x + platform.width && y + height > platform.y && y < platform.y + platform.height) {
                x = platform.x + platform.width;
                vx = 0;
            }
          }
        });

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

        for (const enemy of currentEnemies) {
            if (
                x < enemy.x + enemy.width &&
                x + width > enemy.x &&
                y < enemy.y + enemy.height &&
                y + height > enemy.y
            ) {
                setGameState('game_over_enemy');
                return prevPlayer;
            }
        }

        for (const trap of currentTraps) {
            if (
                x < trap.x + trap.width &&
                x + width > trap.x &&
                y < trap.y + trap.height &&
                y + height > trap.y
            ) {
                setGameState('game_over_trap');
                return prevPlayer;
            }
        }

        if (currentGoal &&
            x < currentGoal.x + currentGoal.width &&
            x + width > currentGoal.x &&
            y < currentGoal.y + currentGoal.height &&
            y + height > currentGoal.y
        ) {
            const levelData = staticPixelJumperLevelsConfig[currentLevelIndex];
            savePixelJumperLevelHighScore(levelData.id, score);
            if (score > levelHighScore) setLevelHighScore(score);

            const nextLevel = currentLevelIndex + 1;
            savePixelJumperMaxUnlockedLevel(nextLevel +1);
            setMaxUnlockedLevel(getPixelJumperMaxUnlockedLevel());

            setGameState('level_complete');
            return prevPlayer;
        }

        return { ...prevPlayer, x, y, vx, vy, isJumping };
      });

      // Update Enemies
      setCurrentEnemies(prevEnemies =>
        prevEnemies.map(enemy => {
            let newX = enemy.x + enemy.vx;
            let newVx = enemy.vx;

            let enemyOnValidPlatform = false;
            let currentPlatformWidth = 0;
            let currentPlatformX = 0;

            for (const p of currentPlatforms) {
                if (enemy.y + enemy.height === p.y && enemy.x + enemy.width > p.x && enemy.x < p.x + p.width) {
                    enemyOnValidPlatform = true;
                    currentPlatformX = p.x;
                    currentPlatformWidth = p.width;
                    break;
                }
            }

            const minPatrolX = enemyOnValidPlatform ? currentPlatformX : enemy.originalX - enemy.patrolRange;
            const maxPatrolX = enemyOnValidPlatform ? currentPlatformX + currentPlatformWidth - enemy.width : enemy.originalX + enemy.patrolRange;

            if (newX <= minPatrolX || newX >= maxPatrolX) {
                newVx = -enemy.vx;
                newX = enemy.x + newVx;
            }

            return {...enemy, x: newX, vx: newVx};
        })
      );

      // Update Camera
      if (player) {
        const targetCameraX = player.x - VIEWPORT_WIDTH / 2.8;
        const clampedCameraX = Math.max(0, Math.min(targetCameraX, levelContentWidth - VIEWPORT_WIDTH));
        setCameraOffsetX(clampedCameraX);
      }

    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [gameState, player, currentPlatforms, currentGoal, score, levelHighScore, currentLevelIndex, loadLevel, currentEnemies, currentTraps, levelContentWidth]);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = `hsl(${colorValues.background})`;
    ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

    const activeGameRenderStates: GameState[] = ['playing', 'level_complete', 'game_over_fall', 'game_over_enemy', 'game_over_trap', 'all_levels_complete'];

    if (activeGameRenderStates.includes(gameState)) {
        ctx.save();
        ctx.translate(-cameraOffsetX, 0);

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

        currentEnemies.forEach(enemy => {
            ctx.fillStyle = enemy.color || `hsl(${colorValues.enemyColor})`;
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        });

        currentTraps.forEach(trap => {
            ctx.fillStyle = trap.color || `hsl(${colorValues.trapColor})`;
            ctx.beginPath();
            ctx.moveTo(trap.x, trap.y + trap.height);
            ctx.lineTo(trap.x + trap.width / 2, trap.y);
            ctx.lineTo(trap.x + trap.width, trap.y + trap.height);
            ctx.closePath();
            ctx.fill();
        });

        if (currentGoal) {
            ctx.fillStyle = currentGoal.color || `hsl(${colorValues.primary})`;
            ctx.fillRect(currentGoal.x, currentGoal.y, currentGoal.width, currentGoal.height);
        }

        if (player) {
            ctx.fillStyle = player.color || `hsl(${colorValues.primary})`;
            ctx.fillRect(player.x, player.y, player.width, player.height);
        }

        ctx.restore();

        ctx.fillStyle = `hsl(${colorValues.foreground})`;
        ctx.font = '18px "Space Grotesk", sans-serif';
        ctx.textAlign = 'left';
        const currentLevelConfigData = staticPixelJumperLevelsConfig[currentLevelIndex];
        ctx.fillText(`Level: ${currentLevelConfigData?.name || `Generated ${currentLevelIndex + 1}`}`, 10, 25);
        ctx.fillText(`Score: ${score}`, 10, 50);
        ctx.textAlign = 'right';
        ctx.fillText(`High Score: ${levelHighScore}`, VIEWPORT_WIDTH - 10, 25);
    }

    if (gameState === 'level_complete') {
        ctx.fillStyle = `hsla(${colorValues.primary}, 0.8)`;
        ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
        ctx.fillStyle = `hsl(${colorValues.foreground})`;
        ctx.textAlign = 'center';
        ctx.font = 'bold 36px "Space Grotesk", sans-serif';
        ctx.fillText('Level Complete!', VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 2 - 20);
        ctx.font = '20px "Space Grotesk", sans-serif';
        ctx.fillText(`Your Score: ${score}`, VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 2 + 20);
    }

    if (gameState === 'game_over_fall' || gameState === 'game_over_enemy' || gameState === 'game_over_trap') {
        ctx.fillStyle = `hsla(${colorValues.destructive}, 0.8)`;
        ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
        ctx.fillStyle = `hsl(${colorValues.foreground})`;
        ctx.textAlign = 'center';
        ctx.font = 'bold 36px "Space Grotesk", sans-serif';
        ctx.fillText('Game Over!', VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 2 - 40);
        ctx.font = '20px "Space Grotesk", sans-serif';
        if (gameState === 'game_over_fall') {
            ctx.fillText('You fell off the screen.', VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 2);
        } else if (gameState === 'game_over_enemy') {
            ctx.fillText('Hit by an enemy!', VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 2);
        } else if (gameState === 'game_over_trap') {
            ctx.fillText('Stepped on a trap!', VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 2);
        }
         ctx.fillText(`Final Score: ${score}`, VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 2 + 30);
    }
     if (gameState === 'all_levels_complete') {
        ctx.fillStyle = `hsla(${colorValues.primary}, 0.8)`;
        ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
        ctx.fillStyle = `hsl(${colorValues.foreground})`;
        ctx.textAlign = 'center';
        ctx.font = 'bold 36px "Space Grotesk", sans-serif';
        ctx.fillText('Congratulations!', VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 2 - 20);
        ctx.font = '20px "Space Grotesk", sans-serif';
        ctx.fillText('You have completed all available levels!', VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 2 + 20);
    }

  }, [gameState, player, currentPlatforms, currentFoodItems, currentEnemies, currentTraps, currentGoal, score, levelHighScore, currentLevelIndex, colorValues, cameraOffsetX, levelContentWidth]);

  const handleStartGame = () => {
    loadLevel(0);
  };

  const handleLevelSelect = (levelIdStr: string) => {
    const levelId = parseInt(levelIdStr, 10);
    const levelIndex = staticPixelJumperLevelsConfig.findIndex(l => l.id === levelId);
    if (levelIndex !== -1 && levelId <= maxUnlockedLevel) {
      loadLevel(levelIndex);
    }
  };

  const handleNextLevel = () => {
    const nextLevelIdx = currentLevelIndex + 1;
    if (nextLevelIdx < staticPixelJumperLevelsConfig.length) {
      loadLevel(nextLevelIdx);
    } else {
      setGameState('all_levels_complete');
    }
  };

  const currentLevelConfigData = staticPixelJumperLevelsConfig[currentLevelIndex];

  if (gameState === 'menu') {
    return (
      <div className="flex flex-col items-center justify-center p-4 min-h-[70vh] gap-6">
        <Card className="w-full max-w-md bg-card/90 shadow-xl text-center">
          <CardHeader>
            <CardTitle className="text-4xl font-headline text-primary flex items-center justify-center gap-2">
                <Gamepad2 size={36} /> Pixel Jumper
            </CardTitle>
            <CardDescription className="text-muted-foreground">Jump, collect, and survive the generated levels!</CardDescription>
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
                {staticPixelJumperLevelsConfig.map(level => (
                  <SelectItem
                    key={level.id}
                    value={level.id.toString()}
                    disabled={level.id > maxUnlockedLevel}
                  >
                    {level.name} {level.id > maxUnlockedLevel ? "(Locked)" : `(High Score: ${getPixelJumperLevelHighScore(level.id)})`}
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
      <Card className="w-full max-w-[800px] bg-card/90 shadow-xl overflow-hidden">
        <CardHeader className="text-center pb-2">
            <CardTitle className="text-3xl font-headline text-primary">
              Pixel Jumper - {currentLevelConfigData?.name || `Generated ${currentLevelIndex + 1}`}
            </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
            <div className="border-4 border-primary rounded-md overflow-hidden shadow-inner bg-background">
                <canvas
                ref={canvasRef}
                width={VIEWPORT_WIDTH}
                height={VIEWPORT_HEIGHT}
                aria-label="Pixel Jumper game board"
                role="img"
                tabIndex={0}
                />
            </div>
          {(gameState === 'level_complete' || gameState === 'game_over_fall' || gameState === 'game_over_enemy' || gameState === 'game_over_trap' || gameState === 'all_levels_complete') && (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {gameState === 'level_complete' && currentLevelIndex < staticPixelJumperLevelsConfig.length - 1 && (
                <Button onClick={handleNextLevel} size="lg" className="bg-accent hover:bg-accent/80 text-accent-foreground">
                  <ChevronRight className="mr-2"/> Next Level
                </Button>
              )}
               {gameState === 'level_complete' && currentLevelIndex >= staticPixelJumperLevelsConfig.length - 1 && (
                 <Button onClick={() => setGameState('all_levels_complete')} size="lg" className="bg-green-500 hover:bg-green-600 text-white">
                    <Gamepad2 className="mr-2"/> Finish Game
                </Button>
              )}
              {(gameState === 'game_over_fall' || gameState === 'game_over_enemy' || gameState === 'game_over_trap') && (
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
             <p className="text-muted-foreground text-sm">Use <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Arrow Keys</kbd> or <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">A</kbd>/<kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">D</kbd> to move, <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Space</kbd>/<kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">W</kbd>/<kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Up Arrow</kbd> to jump. Press <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Esc</kbd> for menu.</p>
           )}
        </CardContent>
      </Card>
       <div className="text-center text-muted-foreground p-4 bg-card/50 rounded-lg max-w-md">
        <h3 className="text-xl font-headline text-foreground mb-2">How to Play</h3>
        <ul className="list-disc list-inside text-left space-y-1">
          <li>Use <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Arrow Keys</kbd> or <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">A</kbd>/<kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">D</kbd> for left/right movement.</li>
          <li>Press <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Spacebar</kbd>, <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">W</kbd>, or <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Up Arrow</kbd> to jump.</li>
          <li>Collect all <span className="text-accent font-semibold">blue items</span> for points.</li>
          <li>Reach the <span className="text-primary font-semibold">purple goal</span> to complete the level.</li>
          <li>Avoid <span style={{color: `hsl(${colorValues.enemyColor})`}} className="font-semibold">orange enemies</span> and <span style={{color: `hsl(${colorValues.trapColor})`}} className="font-semibold">red traps</span>!</li>
          <li>Avoid falling off the screen!</li>
          <li>Press <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Esc</kbd> to return to the main menu.</li>
        </ul>
      </div>
    </div>
  );
}
