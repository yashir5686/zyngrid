
'use client';

import type { Player, Platform, FoodItem, Enemy, Trap } from '@/types';
import { getHighScore, saveHighScore } from '@/lib/local-storage';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Play, RotateCcw, Gamepad2, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

// Logical game dimensions - game logic operates in this coordinate space
const GAME_LOGIC_WIDTH = 800;
const GAME_LOGIC_HEIGHT = 450;

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
const INITIAL_PLAYER_Y = GAME_LOGIC_HEIGHT - 100 - PLAYER_HEIGHT; 

const WORLD_CHUNK_WIDTH = GAME_LOGIC_WIDTH * 1.5; 
const WORLD_GENERATION_THRESHOLD_FACTOR = 1.2; 

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
  const isMobile = useIsMobile();

  const [actualCanvasSize, setActualCanvasSize] = useState({ width: GAME_LOGIC_WIDTH, height: GAME_LOGIC_HEIGHT });
  
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  const getThemeColor = useCallback((cssVariable: string) => {
    if (typeof window !== 'undefined') {
      return `hsl(${getComputedStyle(document.documentElement).getPropertyValue(cssVariable).trim()})`;
    }
    switch (cssVariable) {
      case '--background': return 'hsl(0 0% 4%)';
      case '--foreground': return 'hsl(0 0% 98%)';
      case '--primary': return 'hsl(260 48% 65%)'; 
      case '--accent': return 'hsl(0 0% 80%)'; 
      case '--destructive': return 'hsl(0 84% 60%)';
      case '--card': return 'hsl(0 0% 8%)';
      case '--muted': return 'hsl(0 0% 15%)';
      case '--muted-foreground': return 'hsl(0 0% 65%)';
      default: return 'hsl(0 0% 98%)';
    }
  }, []);


  useEffect(() => {
    setHighScoreState(getHighScore('pixeljumper_endless'));
  }, []);

  const updateActualCanvasDimensions = useCallback(() => {
    if (typeof window !== 'undefined') {
      const screenWidth = window.innerWidth;
      const availableWidth = screenWidth - (isMobile ? 32 : Math.max(32, (screenWidth - GAME_LOGIC_WIDTH)/2) );
      const newCanvasWidth = Math.min(GAME_LOGIC_WIDTH, availableWidth);
      const newCanvasHeight = newCanvasWidth * (GAME_LOGIC_HEIGHT / GAME_LOGIC_WIDTH);
      setActualCanvasSize({ width: newCanvasWidth, height: newCanvasHeight });
    }
  }, [isMobile]);

  useEffect(() => {
    updateActualCanvasDimensions();
    window.addEventListener('resize', updateActualCanvasDimensions);
    return () => window.removeEventListener('resize', updateActualCanvasDimensions);
  }, [updateActualCanvasDimensions]);


  const extendWorld = useCallback((currentLastX: number, lastSafePlatformY: number) => {
    const newPlatforms: Platform[] = [];
    const newFoodItems: FoodItem[] = [];
    const newEnemies: Enemy[] = [];
    const newTraps: Trap[] = [];

    let currentX = currentLastX;
    const generationEndX = currentLastX + WORLD_CHUNK_WIDTH;
    let lastPlatformY = lastSafePlatformY;

    const platformColor = getThemeColor('--muted'); 
    const foodColor = getThemeColor('--accent');
    const enemyColor = getThemeColor('--destructive'); 
    const trapColor = getThemeColor('--destructive'); 

    if (currentLastX === 0) {
        const startPlatform: Platform = {
            x: 20, y: INITIAL_PLAYER_Y + PLAYER_HEIGHT + 10,
            width: 200, height: 20, color: platformColor
        };
        newPlatforms.push(startPlatform);
        currentX = startPlatform.x + startPlatform.width;
        lastPlatformY = startPlatform.y;
    }

    while (currentX < generationEndX) {
      const gapX = getRandomInt(60, 130);
      currentX += gapX;

      let newY = lastPlatformY + getRandomInt(-90, 90);
      newY = Math.max(150, Math.min(GAME_LOGIC_HEIGHT - 80, newY));

      const newWidth = getRandomInt(100, 250);
      const platform: Platform = { x: currentX, y: newY, width: newWidth, height: 20, color: platformColor };
      newPlatforms.push(platform);

      if (Math.random() < 0.65) {
        newFoodItems.push({
            x: platform.x + platform.width / 2 - 7.5,
            y: platform.y - 25,
            width: 15, height: 15,
            collected: false,
            color: foodColor
        });
      }

      const enemySpawnChance = 0.20 + Math.min(0.3, score / 2000);
      if (Math.random() < enemySpawnChance && platform.width > ENEMY_WIDTH + 30) {
         newEnemies.push({
            x: platform.x + 15,
            y: platform.y - ENEMY_HEIGHT,
            width: ENEMY_WIDTH,
            height: ENEMY_HEIGHT,
            vx: ENEMY_SPEED * (Math.random() > 0.5 ? 1 : -1) * (1 + Math.min(1, score/1000)),
            originalX: platform.x + 15,
            patrolRange: Math.min(ENEMY_PATROL_RANGE + (score / 200), platform.width - ENEMY_WIDTH - 30),
            color: enemyColor,
         });
      }

      const trapSpawnChance = 0.15 + Math.min(0.25, score / 3000);
      if (Math.random() < trapSpawnChance) {
        if (gapX > TRAP_SIZE + 30 && lastPlatformY > GAME_LOGIC_HEIGHT - 100 && platform.y > GAME_LOGIC_HEIGHT - 100) {
            newTraps.push({
                x: currentX - gapX + (gapX / 2) - (TRAP_SIZE / 2),
                y: GAME_LOGIC_HEIGHT - TRAP_SIZE - 10,
                width: TRAP_SIZE,
                height: TRAP_SIZE,
                color: trapColor,
            });
        } else if (platform.width > TRAP_SIZE + 40 && Math.random() < 0.5) {
             newTraps.push({
                x: platform.x + getRandomInt(15, platform.width - TRAP_SIZE - 15),
                y: platform.y - TRAP_SIZE,
                width: TRAP_SIZE,
                height: TRAP_SIZE,
                color: trapColor,
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

  }, [score, getThemeColor]);


  const startGame = useCallback(() => {
    setPlayer({
      x: INITIAL_PLAYER_X,
      y: INITIAL_PLAYER_Y,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      vx: 0,
      vy: 0,
      isJumping: false,
      color: getThemeColor('--accent'),
      animationFrame: 0, 
    });
    setPlatforms([]);
    setFoodItems([]);
    setEnemies([]);
    setTraps([]);
    setScore(0);
    setHighScoreState(getHighScore('pixeljumper_endless'));
    setCameraOffsetX(0);
    setLastGeneratedX(0);

    extendWorld(0, INITIAL_PLAYER_Y + PLAYER_HEIGHT + 10);

    setGameState('playing');
    keysPressed.current = {};
    canvasRef.current?.focus();
  }, [getThemeColor, extendWorld]);


  useEffect(() => {
    const gameActiveStates: GameState[] = ['playing', 'game_over_fall', 'game_over_enemy', 'game_over_trap'];
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'playing') {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'a', 'd', 'w', 's'].includes(e.key)) {
          e.preventDefault();
        }
        keysPressed.current[e.key.toLowerCase()] = true; 
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
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [player, gameState]);

  const handleMobileMove = (direction: 'left' | 'right' | 'stop') => {
    if (gameState !== 'playing') return;
    keysPressed.current['mobile_left'] = direction === 'left';
    keysPressed.current['mobile_right'] = direction === 'right';
  };

  const handleMobileJump = () => {
    if (gameState !== 'playing' || !player || player.isJumping) return;
    setPlayer(p => p ? { ...p, vy: JUMP_FORCE, isJumping: true } : null);
  };

  useEffect(() => {
    if (gameState !== 'playing' || !player) return;

    const gameLoop = setInterval(() => {
      setPlayer(prevPlayer => {
        if (!prevPlayer) return null;
        let { x, y, vx, vy, isJumping, width, height, animationFrame } = prevPlayer;

        vx = 0;
        if (keysPressed.current['arrowleft'] || keysPressed.current['a'] || keysPressed.current['mobile_left']) {
          vx = -PLAYER_SPEED;
        }
        if (keysPressed.current['arrowright'] || keysPressed.current['d'] || keysPressed.current['mobile_right']) {
          vx = PLAYER_SPEED;
        }
        x += vx;

        vy += GRAVITY;
        y += vy;

        if (x < cameraOffsetX) x = cameraOffsetX;
        if (x + width > cameraOffsetX + GAME_LOGIC_WIDTH) x = cameraOffsetX + GAME_LOGIC_WIDTH - width;

        if (y < 0) { y = 0; vy = 0; }
        if (y + height > GAME_LOGIC_HEIGHT) {
            if (score > highScore) { saveHighScore('pixeljumper_endless', score); setHighScoreState(score); }
            setGameState('game_over_fall');
            return prevPlayer;
        }

        platforms.forEach(platform => {
          if ( x < platform.x + platform.width && x + width > platform.x && y < platform.y + platform.height && y + height > platform.y ) {
            if (vy > 0 && prevPlayer.y + prevPlayer.height <= platform.y) {
              y = platform.y - height; vy = 0; isJumping = false;
            } else if (vy < 0 && prevPlayer.y >= platform.y + platform.height) {
                y = platform.y + platform.height; vy = 0;
            } else if (vx > 0 && prevPlayer.x + prevPlayer.width <= platform.x && y + height > platform.y +5 && y < platform.y + platform.height -5) {
                x = platform.x - width; vx = 0;
            } else if (vx < 0 && prevPlayer.x >= platform.x + platform.width && y + height > platform.y +5 && y < platform.y + platform.height -5) {
                x = platform.x + platform.width; vx = 0;
            }
          }
        });

        setFoodItems(prevFoodItems =>
          prevFoodItems.map(food => {
            if ( !food.collected && x < food.x + food.width && x + width > food.x && y < food.y + food.height && y + height > food.y ) {
              setScore(s => s + 10);
              return { ...food, collected: true };
            }
            return food;
          }).filter(food => food.x + food.width > cameraOffsetX) 
        );

        enemies.forEach(enemy => {
            if ( x < enemy.x + enemy.width && x + width > enemy.x && y < enemy.y + enemy.height && y + height > enemy.y ) {
                if (score > highScore) { saveHighScore('pixeljumper_endless', score); setHighScoreState(score); }
                setGameState('game_over_enemy');
            }
        });

        traps.forEach(trap => {
            if ( x < trap.x + trap.width && x + width > trap.x && y < trap.y + trap.height && y + height > trap.y ) {
                if (score > highScore) { saveHighScore('pixeljumper_endless', score); setHighScoreState(score); }
                setGameState('game_over_trap');
            }
        });

        if (!isJumping && Math.abs(vx) > 0) {
            animationFrame = (animationFrame + 1); 
        } else {
            animationFrame = 0; 
        }

        return { ...prevPlayer, x, y, vx, vy, isJumping, animationFrame };
      });

      setEnemies(prevEnemies =>
        prevEnemies.map(enemy => {
            let newX = enemy.x + enemy.vx;
            let newVx = enemy.vx;
            let enemyOnValidPlatform = false;
            let currentPlatformX = 0;
            let currentPlatformWidth = 0;

            for (const p of platforms) {
                if (Math.abs(enemy.y + enemy.height - p.y) < 1 && enemy.x + enemy.width > p.x && enemy.x < p.x + p.width) {
                    enemyOnValidPlatform = true; currentPlatformX = p.x; currentPlatformWidth = p.width; break;
                }
            }
            const minPatrolX = enemyOnValidPlatform ? currentPlatformX : enemy.originalX - enemy.patrolRange;
            const maxPatrolX = enemyOnValidPlatform ? currentPlatformX + currentPlatformWidth - enemy.width : enemy.originalX + enemy.patrolRange;
            if (newX <= minPatrolX || newX >= maxPatrolX) { newVx = -enemy.vx; newX = enemy.x + newVx; }
            newX = Math.max(minPatrolX, Math.min(newX, maxPatrolX));
            return {...enemy, x: newX, vx: newVx};
        }).filter(enemy => enemy.x + enemy.width > cameraOffsetX) 
      );
      
      setPlatforms(prev => prev.filter(p => p.x + p.width > cameraOffsetX)); 
      setTraps(prev => prev.filter(t => t.x + t.width > cameraOffsetX)); 

      if (player && player.x + (GAME_LOGIC_WIDTH * WORLD_GENERATION_THRESHOLD_FACTOR) > lastGeneratedX) {
        const lastPlatform = platforms[platforms.length -1] || {y: INITIAL_PLAYER_Y + PLAYER_HEIGHT + 10};
        extendWorld(lastGeneratedX, lastPlatform.y);
      }

      if (player) {
        const targetCameraX = player.x - GAME_LOGIC_WIDTH / (isMobile ? 2 : 3); 
        const clampedCameraX = Math.max(0, targetCameraX);
        setCameraOffsetX(clampedCameraX);
      }

    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [gameState, player, platforms, enemies, traps, score, highScore, lastGeneratedX, extendWorld, cameraOffsetX, isMobile]);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const bgColor = getThemeColor('--background');
    const fgColor = getThemeColor('--foreground'); 
    const playerColor = player?.color || getThemeColor('--accent'); 

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, GAME_LOGIC_WIDTH, GAME_LOGIC_HEIGHT);

    if (gameState !== 'menu') {
        ctx.save();
        ctx.translate(-cameraOffsetX, 0);

        platforms.forEach(platform => {
            ctx.fillStyle = platform.color || getThemeColor('--muted'); 
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        });
        foodItems.forEach(food => {
            if (!food.collected) {
              const itemColor = food.color || getThemeColor('--accent'); 
              ctx.fillStyle = itemColor;
              ctx.beginPath();
              ctx.arc(food.x + food.width / 2, food.y + food.height / 2, food.width / 1.7, 0, 2 * Math.PI);
              ctx.fill();
              ctx.closePath();
            }
        });
        enemies.forEach(enemy => {
            const enemyColor = enemy.color || getThemeColor('--destructive'); 
            ctx.fillStyle = enemyColor;
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        });
        traps.forEach(trap => {
            const trapColor = trap.color || getThemeColor('--destructive'); 
            ctx.fillStyle = trapColor;
            ctx.beginPath();
            ctx.moveTo(trap.x, trap.y + trap.height);
            ctx.lineTo(trap.x + trap.width / 2, trap.y);
            ctx.lineTo(trap.x + trap.width, trap.y + trap.height);
            ctx.closePath();
            ctx.fill();
        });
        
        if (player) {
            ctx.fillStyle = playerColor;
            const pX = player.x;
            const pY = player.y;

            // Player part dimensions
            const headH = PLAYER_HEIGHT * 0.25;
            const headW = PLAYER_WIDTH * 0.5;
            const torsoH = PLAYER_HEIGHT * 0.45;
            const torsoW = PLAYER_WIDTH * 0.7;
            const legH = PLAYER_HEIGHT * 0.4;
            const legW = PLAYER_WIDTH * 0.2;
            const armH = PLAYER_HEIGHT * 0.35;
            const armW = PLAYER_WIDTH * 0.15;

            // Relative positions
            const headRelX = (PLAYER_WIDTH - headW) / 2;
            const headRelY = 0;
            const torsoRelX = (PLAYER_WIDTH - torsoW) / 2;
            const torsoRelY = headH;
            const legYPos = pY + headH + torsoH;
            const armYPos = pY + torsoRelY + torsoH * 0.1;


            // Draw Head
            ctx.fillRect(pX + headRelX, pY + headRelY, headW, headH);
            // Draw Torso
            ctx.fillRect(pX + torsoRelX, pY + torsoRelY, torsoW, torsoH);

            if (player.isJumping) {
                // Jumping Pose
                // Legs tucked or trailing
                ctx.fillRect(pX + torsoRelX + legW * 0.5, legYPos - legH * 0.1, legW, legH * 0.8); // Left leg
                ctx.fillRect(pX + torsoRelX + torsoW - legW * 1.5, legYPos, legW, legH * 0.8); // Right leg
                // Arms up/back
                ctx.fillRect(pX + torsoRelX - armW, armYPos - armH * 0.2, armW, armH); // Left arm
                ctx.fillRect(pX + torsoRelX + torsoW, armYPos - armH * 0.2, armW, armH); // Right arm
            } else if (Math.abs(player.vx) > 0) { // Running
                const animCycle = 20; 
                const currentAnimFrame = player.animationFrame % animCycle;
                const pose = Math.floor(currentAnimFrame / (animCycle / 2)); 

                if (pose === 0) { 
                    // Pose 1: Left leg forward, right leg back
                    ctx.fillRect(pX + torsoRelX, legYPos, legW, legH); // Left leg
                    ctx.fillRect(pX + torsoRelX + torsoW - legW, legYPos + legH * 0.1, legW, legH * 0.9); // Right leg
                    // Arms: Left arm back, right arm forward
                    ctx.fillRect(pX + torsoRelX - armW, armYPos + armH * 0.1, armW, armH); // Left arm
                    ctx.fillRect(pX + torsoRelX + torsoW, armYPos, armW, armH); // Right arm
                } else { 
                    // Pose 2: Right leg forward, left leg back
                    ctx.fillRect(pX + torsoRelX, legYPos + legH * 0.1, legW, legH * 0.9); // Left leg
                    ctx.fillRect(pX + torsoRelX + torsoW - legW, legYPos, legW, legH); // Right leg
                    // Arms: Right arm back, left arm forward
                    ctx.fillRect(pX + torsoRelX - armW, armYPos, armW, armH); // Left arm
                    ctx.fillRect(pX + torsoRelX + torsoW, armYPos + armH * 0.1, armW, armH); // Right arm
                }
            } else { // Idle Pose
                // Legs straight down
                ctx.fillRect(pX + torsoRelX, legYPos, legW, legH); // Left leg
                ctx.fillRect(pX + torsoRelX + torsoW - legW, legYPos, legW, legH); // Right leg
                // Arms straight down
                ctx.fillRect(pX + torsoRelX - armW, armYPos, armW, armH); // Left arm
                ctx.fillRect(pX + torsoRelX + torsoW, armYPos, armW, armH); // Right arm
            }
        }
        ctx.restore();

        ctx.fillStyle = fgColor; 
        ctx.font = '18px "Space Grotesk", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${score}`, 10, 25);
        ctx.textAlign = 'right';
        ctx.fillText(`High Score: ${highScore}`, GAME_LOGIC_WIDTH - 10, 25);
    }

    if (gameState === 'game_over_fall' || gameState === 'game_over_enemy' || gameState === 'game_over_trap') {
        ctx.fillStyle = 'hsla(0, 0%, 4%, 0.8)';
        ctx.fillRect(0, 0, GAME_LOGIC_WIDTH, GAME_LOGIC_HEIGHT);

        ctx.fillStyle = fgColor; 
        ctx.textAlign = 'center';

        ctx.font = 'bold 36px "Space Grotesk", sans-serif';
        ctx.fillText('Game Over!', GAME_LOGIC_WIDTH / 2, GAME_LOGIC_HEIGHT / 2 - 60);
        
        ctx.font = '20px "Space Grotesk", sans-serif';
        let causeMessage = 'An unknown error occurred.';
        if (gameState === 'game_over_fall') causeMessage = 'You fell into the abyss!';
        else if (gameState === 'game_over_enemy') causeMessage = 'Defeated by an enemy!';
        else if (gameState === 'game_over_trap') causeMessage = 'Caught by a trap!';
        ctx.fillText(causeMessage, GAME_LOGIC_WIDTH / 2, GAME_LOGIC_HEIGHT / 2 - 20);
        ctx.fillText(`Final Score: ${score}`, GAME_LOGIC_WIDTH / 2, GAME_LOGIC_HEIGHT / 2 + 20);
        ctx.fillText(`High Score: ${highScore}`, GAME_LOGIC_WIDTH / 2, GAME_LOGIC_HEIGHT / 2 + 50);
    }

  }, [gameState, player, platforms, foodItems, enemies, traps, score, highScore, cameraOffsetX, lastGeneratedX, actualCanvasSize, getThemeColor]);


  if (gameState === 'menu') {
    return (
      <div className="flex flex-col items-center justify-center p-4 min-h-[70vh] gap-6 w-full">
        <Card className="w-full max-w-md bg-card/90 shadow-xl text-center border-border"> 
          <CardHeader>
            <CardTitle 
              className="text-3xl md:text-4xl font-headline text-foreground flex items-center justify-center gap-2"
            >
                <Gamepad2 size={isMobile ? 30: 36} className="text-accent"/> Pixel Jumper Endless
            </CardTitle>
            <CardContent className="text-muted-foreground text-sm md:text-base pt-2">Jump, collect, and survive as long as you can in this endless world!</CardContent>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button 
              onClick={startGame} 
              size="lg" 
              className="bg-primary hover:bg-primary/80 text-primary-foreground font-headline text-base md:text-lg"
            >
              <Play className="mr-2" /> Start Game
            </Button>
             <p className="text-xs md:text-sm text-muted-foreground pt-2">Current High Score: <span className="text-foreground font-semibold">{highScore}</span></p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 p-2 md:p-8 w-full">
      <Card className="w-full bg-card/90 shadow-xl overflow-hidden border-border" style={{maxWidth: actualCanvasSize.width }}> 
        <CardHeader className="text-center pb-2">
            <CardTitle 
              className="text-2xl md:text-3xl font-headline text-foreground"
            >
              Pixel Jumper Endless
            </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 p-2 sm:p-4">
            <div className="border-2 border-border rounded-md overflow-hidden shadow-inner bg-background" style={{ width: actualCanvasSize.width, height: actualCanvasSize.height }}> 
                <canvas
                ref={canvasRef}
                width={GAME_LOGIC_WIDTH} 
                height={GAME_LOGIC_HEIGHT} 
                style={{ width: actualCanvasSize.width, height: actualCanvasSize.height, display: 'block' }} 
                aria-label="Pixel Jumper endless game board"
                role="img"
                tabIndex={0}
                />
            </div>
          {(gameState === 'game_over_fall' || gameState === 'game_over_enemy' || gameState === 'game_over_trap') && (
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 mt-4">
              <Button onClick={startGame} size="lg" className="bg-primary hover:bg-primary/80 text-primary-foreground text-sm sm:text-base"> 
                <RotateCcw className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Try Again
              </Button>
              <Button onClick={() => setGameState('menu')} size="lg" variant="outline" className="text-sm sm:text-base border-primary/70 hover:bg-primary/20 hover:text-primary-foreground"> 
                <Home className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Main Menu
              </Button>
            </div>
          )}
           {gameState === 'playing' && !isMobile && (
             <p className="text-muted-foreground text-xs md:text-sm text-center">Use <kbd className="px-1 md:px-2 py-0.5 md:py-1 text-xs font-semibold text-background bg-foreground/70 border border-border rounded-lg">Arrow Keys</kbd> or <kbd className="px-1 md:px-2 py-0.5 md:py-1 text-xs font-semibold text-background bg-foreground/70 border border-border rounded-lg">A</kbd>/<kbd className="px-1 md:px-2 py-0.5 md:py-1 text-xs font-semibold text-background bg-foreground/70 border border-border rounded-lg">D</kbd> to move, <kbd className="px-1 md:px-2 py-0.5 md:py-1 text-xs font-semibold text-background bg-foreground/70 border border-border rounded-lg">Space</kbd>/<kbd className="px-1 md:px-2 py-0.5 md:py-1 text-xs font-semibold text-background bg-foreground/70 border border-border rounded-lg">W</kbd>/<kbd className="px-1 md:px-2 py-0.5 md:py-1 text-xs font-semibold text-background bg-foreground/70 border border-border rounded-lg">Up Arrow</kbd> to jump. Press <kbd className="px-1 md:px-2 py-0.5 md:py-1 text-xs font-semibold text-background bg-foreground/70 border border-border rounded-lg">Esc</kbd> for menu.</p>
           )}
           {gameState === 'playing' && isMobile && (
             <p className="text-muted-foreground text-xs text-center">Use on-screen controls. Press <kbd className="px-1 text-xs font-semibold text-background bg-foreground/70 border border-border rounded-lg">Esc</kbd> icon for menu (if available).</p>
           )}
        </CardContent>
      </Card>

      {isMobile && gameState === 'playing' && (
        <div className="fixed bottom-4 left-4 right-4 flex justify-between items-center z-10 p-2 bg-card/50 rounded-lg backdrop-blur-sm">
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="aspect-square h-16 w-16 bg-card/70 border-primary/70 hover:bg-primary/30" 
              onTouchStart={() => handleMobileMove('left')}
              onTouchEnd={() => handleMobileMove('stop')}
              onClick={() => handleMobileMove('left')} 
              aria-label="Move Left"
            >
              <ArrowLeft size={32} />
            </Button>
            <Button
              variant="outline"
              className="aspect-square h-16 w-16 bg-card/70 border-primary/70 hover:bg-primary/30"
              onTouchStart={() => handleMobileMove('right')}
              onTouchEnd={() => handleMobileMove('stop')}
              onClick={() => handleMobileMove('right')} 
              aria-label="Move Right"
            >
              <ArrowRight size={32} />
            </Button>
          </div>
          <Button
            variant="outline"
            className="aspect-square h-20 w-20 rounded-full bg-card/70 border-primary/70 hover:bg-primary/30" 
            onClick={handleMobileJump}
            aria-label="Jump"
          >
            <ArrowUp size={40} />
          </Button>
        </div>
      )}

       <div className="text-center text-muted-foreground p-2 md:p-4 bg-card/50 rounded-lg max-w-md text-xs md:text-sm mt-4">
        <h3 className="text-lg md:text-xl font-headline text-foreground mb-1 md:mb-2">How to Play</h3>
        <ul className="list-disc list-inside text-left space-y-0.5 md:space-y-1">
          <li>{isMobile ? "Use on-screen buttons" : "Use Arrow Keys or A/D"} for left/right movement.</li>
          <li>{isMobile ? "Tap the large up arrow button" : "Press Spacebar, W, or Up Arrow"} to jump.</li>
          <li>Collect <span className="font-semibold" style={{color: getThemeColor('--accent')}}>light gray items</span> for points.</li>
          <li>Avoid <span className="font-semibold" style={{color: getThemeColor('--destructive')}}>red enemies & traps</span>!</li>
          <li>Don't fall off the screen! Survive as long as you can.</li>
          <li>{isMobile ? "Use game's menu options" : "Press Esc"} to return to the main menu.</li>
        </ul>
      </div>
    </div>
  );
}
