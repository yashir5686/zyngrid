
'use client';

import type { Player, Platform, FoodItem, Enemy, Trap } from '@/types';
import { getHighScore, saveHighScore } from '@/lib/local-storage';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Play, RotateCcw, Gamepad2 } from 'lucide-react';

const VIEWPORT_WIDTH = 800;
const VIEWPORT_HEIGHT = 450;
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

const INITIAL_PLAYER_X = 50;
const INITIAL_PLAYER_Y = VIEWPORT_HEIGHT - 100;

const WORLD_CHUNK_WIDTH = VIEWPORT_WIDTH * 2; // How much to generate at a time
const WORLD_GENERATION_THRESHOLD_FACTOR = 1.5; // When player is 1.5 viewport widths from end, generate more

type GameState = 'menu' | 'playing' | 'game_over_fall' | 'game_over_enemy' | 'game_over_trap';

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export default function PixelJumperGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>('menu');
  const [player, setPlayer] = useState<Player | null>(null);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [traps, setTraps] = useState<Trap[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScoreState] = useState(0);
  const [cameraOffsetX, setCameraOffsetX] = useState(0);
  const [lastGeneratedX, setLastGeneratedX] = useState(0);

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
    setHighScoreState(getHighScore('pixeljumper_endless'));
  }, []);

  const extendWorld = useCallback((currentLastX: number, lastSafePlatformY: number) => {
    const newPlatforms: Platform[] = [];
    const newFoodItems: FoodItem[] = [];
    const newEnemies: Enemy[] = [];
    const newTraps: Trap[] = [];

    let currentX = currentLastX;
    const generationEndX = currentLastX + WORLD_CHUNK_WIDTH;
    let lastPlatformY = lastSafePlatformY;

    // Ensure there's a starting platform if it's the very beginning
    if (currentLastX === 0) {
        const startPlatform: Platform = { 
            x: 20, y: INITIAL_PLAYER_Y + PLAYER_HEIGHT + 10, 
            width: 200, height: 20, color: `hsl(${colorValues.muted})` 
        };
        newPlatforms.push(startPlatform);
        currentX = startPlatform.x + startPlatform.width;
        lastPlatformY = startPlatform.y;
    }


    while (currentX < generationEndX) {
      const gapX = getRandomInt(60, 130);
      currentX += gapX;

      let newY = lastPlatformY + getRandomInt(-90, 90);
      newY = Math.max(150, Math.min(VIEWPORT_HEIGHT - 80, newY)); // Keep platforms within reasonable Y range

      const newWidth = getRandomInt(100, 250);
      const platform: Platform = { x: currentX, y: newY, width: newWidth, height: 20, color: `hsl(${colorValues.muted})` };
      newPlatforms.push(platform);

      // Add food items
      if (Math.random() < 0.65) {
        newFoodItems.push({
            x: platform.x + platform.width / 2 - 7.5,
            y: platform.y - 25,
            width: 15, height: 15,
            collected: false,
            color: `hsl(${colorValues.accent})`
        });
      }

      // Add enemies (difficulty can increase based on score or distance)
      const enemySpawnChance = 0.20 + Math.min(0.3, score / 2000); // Max 50% chance
      if (Math.random() < enemySpawnChance && platform.width > ENEMY_WIDTH + 30) {
         newEnemies.push({
            x: platform.x + 15,
            y: platform.y - ENEMY_HEIGHT,
            width: ENEMY_WIDTH,
            height: ENEMY_HEIGHT,
            vx: ENEMY_SPEED * (Math.random() > 0.5 ? 1 : -1) * (1 + Math.min(1, score/1000)), // Speed increases slightly
            originalX: platform.x + 15,
            patrolRange: Math.min(ENEMY_PATROL_RANGE + (score / 200), platform.width - ENEMY_WIDTH - 30),
            color: `hsl(${colorValues.enemyColor})`,
         });
      }
      
      // Add traps
      const trapSpawnChance = 0.15 + Math.min(0.25, score / 3000); // Max 40% chance
      if (Math.random() < trapSpawnChance) {
        if (gapX > TRAP_SIZE + 30 && lastPlatformY > VIEWPORT_HEIGHT - 100 && platform.y > VIEWPORT_HEIGHT - 100) { // Trap in a pit
            newTraps.push({
                x: currentX - gapX + (gapX / 2) - (TRAP_SIZE / 2),
                y: VIEWPORT_HEIGHT - TRAP_SIZE - 10, // Place on the "floor" of the gap
                width: TRAP_SIZE,
                height: TRAP_SIZE,
                color: `hsl(${colorValues.trapColor})`,
            });
        } else if (platform.width > TRAP_SIZE + 40 && Math.random() < 0.5) { // Trap on a platform
             newTraps.push({
                x: platform.x + getRandomInt(15, platform.width - TRAP_SIZE - 15),
                y: platform.y - TRAP_SIZE, // Place on top of the platform
                width: TRAP_SIZE,
                height: TRAP_SIZE,
                color: `hsl(${colorValues.trapColor})`,
            });
        }
      }
      lastPlatformY = newY;
      currentX += platform.width;
    }
    
    setPlatforms(prev => [...prev, ...newPlatforms]);
    setFoodItems(prev => [...prev, ...newFoodItems]);
    setEnemies(prev => [...prev, ...newEnemies]);
    setTraps(prev => [...prev, ...newTraps]);
    setLastGeneratedX(generationEndX);

  }, [colorValues, score]);


  const startGame = useCallback(() => {
    setPlayer({
      x: INITIAL_PLAYER_X,
      y: INITIAL_PLAYER_Y,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      vx: 0,
      vy: 0,
      isJumping: false,
      color: `hsl(${colorValues.primary})`,
    });
    setPlatforms([]);
    setFoodItems([]);
    setEnemies([]);
    setTraps([]);
    setScore(0);
    setHighScoreState(getHighScore('pixeljumper_endless'));
    setCameraOffsetX(0);
    setLastGeneratedX(0);
    
    // Generate initial world segment
    extendWorld(0, INITIAL_PLAYER_Y + PLAYER_HEIGHT + 10);

    setGameState('playing');
    keysPressed.current = {};
  }, [colorValues, extendWorld]);


  useEffect(() => {
    const gameActiveStates: GameState[] = ['playing', 'game_over_fall', 'game_over_enemy', 'game_over_trap'];
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
        
        // Prevent player from going too far left (off-screen from start)
        if (x < cameraOffsetX) x = cameraOffsetX; 
        // Player cannot go beyond the right edge of viewport for now, camera handles world scroll
        if (x + width > cameraOffsetX + VIEWPORT_WIDTH) x = cameraOffsetX + VIEWPORT_WIDTH - width;


        if (y < 0) { // Hit ceiling
            y = 0;
            vy = 0;
        }
        if (y + height > VIEWPORT_HEIGHT) { // Fell off bottom
            if (score > highScore) {
                saveHighScore('pixeljumper_endless', score);
                setHighScoreState(score);
            }
            setGameState('game_over_fall');
            return prevPlayer;
        }

        let onPlatform = false;
        platforms.forEach(platform => {
          if (
            x < platform.x + platform.width &&
            x + width > platform.x &&
            y < platform.y + platform.height &&
            y + height > platform.y
          ) { // Collision detected
            if (vy > 0 && prevPlayer.y + prevPlayer.height <= platform.y) { // Landing on top
              y = platform.y - height;
              vy = 0;
              isJumping = false;
              onPlatform = true;
            } else if (vy < 0 && prevPlayer.y >= platform.y + platform.height) { // Hit bottom of platform
                y = platform.y + platform.height;
                vy = 0;
            } else if (vx > 0 && prevPlayer.x + prevPlayer.width <= platform.x && y + height > platform.y +5 && y < platform.y + platform.height -5) { // Hit left side of platform
                x = platform.x - width;
                vx = 0;
            } else if (vx < 0 && prevPlayer.x >= platform.x + platform.width && y + height > platform.y +5 && y < platform.y + platform.height -5) { // Hit right side of platform
                x = platform.x + platform.width;
                vx = 0;
            }
          }
        });

        setFoodItems(prevFoodItems =>
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

        for (const enemy of enemies) {
            if (
                x < enemy.x + enemy.width &&
                x + width > enemy.x &&
                y < enemy.y + enemy.height &&
                y + height > enemy.y
            ) {
                if (score > highScore) {
                    saveHighScore('pixeljumper_endless', score);
                    setHighScoreState(score);
                }
                setGameState('game_over_enemy');
                return prevPlayer;
            }
        }

        for (const trap of traps) {
            if (
                x < trap.x + trap.width &&
                x + width > trap.x &&
                y < trap.y + trap.height &&
                y + height > trap.y
            ) {
                if (score > highScore) {
                    saveHighScore('pixeljumper_endless', score);
                    setHighScoreState(score);
                }
                setGameState('game_over_trap');
                return prevPlayer;
            }
        }
        return { ...prevPlayer, x, y, vx, vy, isJumping };
      });

      // Update Enemies
      setEnemies(prevEnemies =>
        prevEnemies.map(enemy => {
            let newX = enemy.x + enemy.vx;
            let newVx = enemy.vx;

            let enemyOnValidPlatform = false;
            let currentPlatformX = 0; // The x of the platform the enemy is on
            let currentPlatformWidth = 0; // The width of that platform

            // Check if enemy is on a platform to constrain patrol
            for (const p of platforms) {
                // Enemy must be aligned with top of platform and within its x bounds
                if (Math.abs(enemy.y + enemy.height - p.y) < 1 && // on top of platform p
                    enemy.x + enemy.width > p.x && enemy.x < p.x + p.width) {
                    enemyOnValidPlatform = true;
                    currentPlatformX = p.x;
                    currentPlatformWidth = p.width;
                    break;
                }
            }
            
            // Define patrol boundaries based on platform or original patrol range
            const minPatrolX = enemyOnValidPlatform ? currentPlatformX : enemy.originalX - enemy.patrolRange;
            const maxPatrolX = enemyOnValidPlatform ? currentPlatformX + currentPlatformWidth - enemy.width : enemy.originalX + enemy.patrolRange;


            if (newX <= minPatrolX || newX >= maxPatrolX) {
                newVx = -enemy.vx; // Reverse direction
                newX = enemy.x + newVx; // Apply new velocity for one step to avoid getting stuck
            }
            // Clamp position just in case
            newX = Math.max(minPatrolX, Math.min(newX, maxPatrolX));

            return {...enemy, x: newX, vx: newVx};
        })
      );

      // World Extension Logic
      if (player && player.x + (VIEWPORT_WIDTH * WORLD_GENERATION_THRESHOLD_FACTOR) > lastGeneratedX) {
        const lastPlatform = platforms[platforms.length -1] || {y: INITIAL_PLAYER_Y + PLAYER_HEIGHT + 10};
        extendWorld(lastGeneratedX, lastPlatform.y);
      }
      
      // Update Camera
      if (player) {
        // Camera follows player, keeping them roughly in the first third of the screen
        const targetCameraX = player.x - VIEWPORT_WIDTH / 3; 
        // Clamp camera: cannot go before 0, cannot go so far that viewport shows empty space if world ends
        // For endless, right clamp is mostly about keeping player from outrunning generation instantly
        const clampedCameraX = Math.max(0, targetCameraX); 
        setCameraOffsetX(clampedCameraX);
      }

    }, 1000 / 60); // 60 FPS

    return () => clearInterval(gameLoop);
  }, [gameState, player, platforms, enemies, traps, score, highScore, lastGeneratedX, extendWorld, cameraOffsetX]);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with background color
    ctx.fillStyle = `hsl(${colorValues.background})`;
    ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

    // Only render game elements if not in menu
    if (gameState !== 'menu') {
        ctx.save();
        ctx.translate(-cameraOffsetX, 0); // Apply camera offset

        // Draw platforms
        platforms.forEach(platform => {
            ctx.fillStyle = platform.color || `hsl(${colorValues.muted})`;
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        });

        // Draw food items
        foodItems.forEach(food => {
            if (!food.collected) {
            ctx.fillStyle = food.color || `hsl(${colorValues.accent})`;
            ctx.fillRect(food.x, food.y, food.width, food.height);
            }
        });

        // Draw enemies
        enemies.forEach(enemy => {
            ctx.fillStyle = enemy.color || `hsl(${colorValues.enemyColor})`;
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        });
        
        // Draw traps
        traps.forEach(trap => {
            ctx.fillStyle = trap.color || `hsl(${colorValues.trapColor})`;
            // Simple triangle for trap
            ctx.beginPath();
            ctx.moveTo(trap.x, trap.y + trap.height);
            ctx.lineTo(trap.x + trap.width / 2, trap.y);
            ctx.lineTo(trap.x + trap.width, trap.y + trap.height);
            ctx.closePath();
            ctx.fill();
        });

        // Draw player
        if (player) {
            ctx.fillStyle = player.color || `hsl(${colorValues.primary})`;
            ctx.fillRect(player.x, player.y, player.width, player.height);
        }
        ctx.restore(); // Restore context after camera offset

        // HUD - Drawn on top, not affected by camera
        ctx.fillStyle = `hsl(${colorValues.foreground})`;
        ctx.font = '18px "Space Grotesk", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${score}`, 10, 25);
        ctx.textAlign = 'right';
        ctx.fillText(`High Score: ${highScore}`, VIEWPORT_WIDTH - 10, 25);
    }


    // Game Over messages
    if (gameState === 'game_over_fall' || gameState === 'game_over_enemy' || gameState === 'game_over_trap') {
        ctx.fillStyle = `hsla(${colorValues.destructive}, 0.8)`;
        ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT); // Overlay
        
        ctx.fillStyle = `hsl(${colorValues.foreground})`;
        ctx.textAlign = 'center';
        
        ctx.font = 'bold 36px "Space Grotesk", sans-serif';
        ctx.fillText('Game Over!', VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 2 - 60);
        
        ctx.font = '20px "Space Grotesk", sans-serif';
        let causeMessage = 'An unknown error occurred.';
        if (gameState === 'game_over_fall') {
            causeMessage = 'You fell!';
        } else if (gameState === 'game_over_enemy') {
            causeMessage = 'Hit by an enemy!';
        } else if (gameState === 'game_over_trap') {
            causeMessage = 'Stepped on a trap!';
        }
        ctx.fillText(causeMessage, VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 2 - 20);
        ctx.fillText(`Final Score: ${score}`, VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 2 + 20);
        ctx.fillText(`High Score: ${highScore}`, VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 2 + 50);
    }

  }, [gameState, player, platforms, foodItems, enemies, traps, score, highScore, colorValues, cameraOffsetX, lastGeneratedX]);


  if (gameState === 'menu') {
    return (
      <div className="flex flex-col items-center justify-center p-4 min-h-[70vh] gap-6">
        <Card className="w-full max-w-md bg-card/90 shadow-xl text-center">
          <CardHeader>
            <CardTitle className="text-4xl font-headline text-primary flex items-center justify-center gap-2">
                <Gamepad2 size={36} /> Pixel Jumper Endless
            </CardTitle>
            <CardContent className="text-muted-foreground">Jump, collect, and survive as long as you can!</CardContent>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button onClick={startGame} size="lg" className="bg-primary hover:bg-primary/80 text-primary-foreground font-headline">
              <Play className="mr-2" /> Start Game
            </Button>
             <p className="text-sm text-muted-foreground pt-2">Current High Score: {highScore}</p>
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
              Pixel Jumper Endless
            </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
            <div className="border-4 border-primary rounded-md overflow-hidden shadow-inner bg-background">
                <canvas
                ref={canvasRef}
                width={VIEWPORT_WIDTH}
                height={VIEWPORT_HEIGHT}
                aria-label="Pixel Jumper endless game board"
                role="img"
                tabIndex={0} // Make canvas focusable
                />
            </div>
          {(gameState === 'game_over_fall' || gameState === 'game_over_enemy' || gameState === 'game_over_trap') && (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              <Button onClick={startGame} size="lg" className="bg-primary hover:bg-primary/80 text-primary-foreground">
                <RotateCcw className="mr-2" /> Try Again
              </Button>
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
          <li>Collect <span className="text-accent font-semibold">blue items</span> for points.</li>
          <li>Avoid <span style={{color: `hsl(${colorValues.enemyColor})`}} className="font-semibold">orange enemies</span> and <span style={{color: `hsl(${colorValues.trapColor})`}} className="font-semibold">red traps</span>!</li>
          <li>Don't fall off the screen! Survive as long as you can.</li>
          <li>Press <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Esc</kbd> to return to the main menu.</li>
        </ul>
      </div>
    </div>
  );
}
