
'use client';

import type { StarShooterPlayer, Bullet, EnemyShip, Star } from '@/types';
import { getHighScore, saveHighScore } from '@/lib/local-storage';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Play, RotateCcw, Gamepad2, MoveLeft, MoveRight, Pointer } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const LOGIC_CANVAS_WIDTH = 400;
const LOGIC_CANVAS_HEIGHT = 600;

const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 30;
const PLAYER_SPEED = 7;
const BULLET_WIDTH = 5;
const BULLET_HEIGHT = 15;
const BULLET_SPEED = 7;
const ENEMY_WIDTH = 35;
const ENEMY_HEIGHT = 30;
const ENEMY_BASE_SPEED = 1.5;
const ENEMY_SPAWN_INTERVAL = 1200;
const MAX_ENEMIES = 12;
const STAR_COUNT = 100;
const PLAYER_SHOOT_INTERVAL = 300;

type GameState = 'menu' | 'playing' | 'game_over';

const playerBodySVGPath = "M20 0 L16 4 L12 4 L12 8 L8 8 L8 12 L4 12 L4 20 L8 20 L8 24 L12 24 L12 28 L16 28 L16 20 L24 20 L24 28 L28 28 L28 24 L32 24 L32 20 L36 20 L36 12 L32 12 L32 8 L28 8 L28 4 L24 4 L20 0 Z M16 12 L24 12 L24 16 L16 16 L16 12 Z";
const playerThrusterSVGPath = "M16 28 L24 28 L24 30 L16 30 Z";

let playerBodyPath2D: Path2D | null = null;
let playerThrusterPath2D: Path2D | null = null;

// Enemy Path Data (approximating the provided SVG style for a 35x30 area)
// Variant A: Star-like shape from SVG
const ENEMY_A_OUTER_PATH_DATA = "M17.5,0 L12.5,5 L12.5,10 L7.5,10 L7.5,12.5 L2.5,12.5 L2.5,17.5 L7.5,17.5 L7.5,20 L12.5,20 L12.5,25 L17.5,30 L22.5,25 L22.5,20 L27.5,20 L27.5,17.5 L32.5,17.5 L32.5,12.5 L27.5,12.5 L27.5,10 L22.5,10 L22.5,5 Z";
// Central plus for Variant A, made of two rectangles
const ENEMY_A_INNER_PLUS_RECT1_PATH_DATA = "M11.25,13.75 h12.5 v2.5 h-12.5 Z"; // Horizontal bar
const ENEMY_A_INNER_PLUS_RECT2_PATH_DATA = "M16.25,8.75 h2.5 v12.5 h-2.5 Z"; // Vertical bar

// Variant B: Simpler diamond shape
const ENEMY_B_PATH_DATA = "M17.5,5 L27.5,15 L17.5,25 L7.5,15 Z";

let enemyOuterPathA: Path2D | null = null;
let enemyInnerPathAPlusRect1: Path2D | null = null;
let enemyInnerPathAPlusRect2: Path2D | null = null;
let enemyPathB: Path2D | null = null;


if (typeof window !== 'undefined') {
  playerBodyPath2D = new Path2D(playerBodySVGPath);
  playerThrusterPath2D = new Path2D(playerThrusterSVGPath);

  enemyOuterPathA = new Path2D(ENEMY_A_OUTER_PATH_DATA);
  enemyInnerPathAPlusRect1 = new Path2D(ENEMY_A_INNER_PLUS_RECT1_PATH_DATA);
  enemyInnerPathAPlusRect2 = new Path2D(ENEMY_A_INNER_PLUS_RECT2_PATH_DATA);
  enemyPathB = new Path2D(ENEMY_B_PATH_DATA);
}


export default function StarShooterGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>('menu');
  const [player, setPlayer] = useState<StarShooterPlayer | null>(null);
  const playerRef = useRef<StarShooterPlayer | null>(null);

  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [enemies, setEnemies] = useState<EnemyShip[]>([]);
  const enemiesForCollisionRef = useRef<EnemyShip[]>([]);
  const [stars, setStars] = useState<Star[]>([]);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [highScore, setHighScoreState] = useState(0);

  const lastEnemySpawnTime = useRef(Date.now());
  const lastPlayerShotTime = useRef(Date.now());
  const isMobile = useIsMobile();

  const [actualCanvasSize, setActualCanvasSize] = useState({ width: LOGIC_CANVAS_WIDTH, height: LOGIC_CANVAS_HEIGHT });

  const keysPressed = useRef<{ [key: string]: boolean }>({});

  const getThemeColor = useCallback((cssVariable: string) => {
    if (typeof window !== 'undefined') {
      return `hsl(${getComputedStyle(document.documentElement).getPropertyValue(cssVariable).trim()})`;
    }
    // Fallback colors
    switch (cssVariable) {
      case '--background': return 'hsl(0 0% 4%)';
      case '--foreground': return 'hsl(0 0% 98%)';
      case '--primary': return 'hsl(260 48% 65%)';
      case '--accent': return 'hsl(0 0% 80%)';
      case '--destructive': return 'hsl(0 84% 60%)';
      case '--card': return 'hsl(0 0% 8%)';
      case '--secondary': return 'hsl(0 0% 15%)';
      case '--muted': return 'hsl(0 0% 15%)';
      case '--muted-foreground': return 'hsl(0 0% 65%)';
      default: return 'hsl(0 0% 98%)';
    }
  }, []);


  useEffect(() => {
    setHighScoreState(getHighScore('starshooter_highscore'));
  }, []);

  const updateActualCanvasDimensions = useCallback(() => {
    if (typeof window !== 'undefined') {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const aspectRatio = LOGIC_CANVAS_WIDTH / LOGIC_CANVAS_HEIGHT;

      let newCanvasWidth = screenWidth - (isMobile ? 32 : 64);
      let newCanvasHeight = newCanvasWidth / aspectRatio;

      if (newCanvasHeight > screenHeight * 0.7) {
        newCanvasHeight = screenHeight * 0.7;
        newCanvasWidth = newCanvasHeight * aspectRatio;
      }
      newCanvasWidth = Math.min(newCanvasWidth, LOGIC_CANVAS_WIDTH);
      newCanvasHeight = Math.min(newCanvasHeight, LOGIC_CANVAS_HEIGHT);

      setActualCanvasSize({ width: Math.max(150, newCanvasWidth), height: Math.max(225, newCanvasHeight) });
    }
  }, [isMobile]);

  useEffect(() => {
    updateActualCanvasDimensions();
    window.addEventListener('resize', updateActualCanvasDimensions);
    return () => window.removeEventListener('resize', updateActualCanvasDimensions);
  }, [updateActualCanvasDimensions]);

  const initStars = useCallback(() => {
    const newStars: Star[] = [];
    const starBaseColorHsl = getThemeColor('--muted-foreground');
    for (let i = 0; i < STAR_COUNT; i++) {
      newStars.push({
        x: Math.random() * LOGIC_CANVAS_WIDTH,
        y: Math.random() * LOGIC_CANVAS_HEIGHT,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 1 + 0.2,
        color: starBaseColorHsl.replace(')', `, ${Math.random() * 0.5 + 0.3})`).replace('hsl','hsla')
      });
    }
    setStars(newStars);
  }, [getThemeColor]);

  const startGame = useCallback(() => {
    const initialPlayer: StarShooterPlayer = {
      id: 'player',
      x: LOGIC_CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
      y: LOGIC_CANVAS_HEIGHT - PLAYER_HEIGHT - 20,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      speed: PLAYER_SPEED,
      color: getThemeColor('--accent'),
    };
    setPlayer(initialPlayer);
    playerRef.current = initialPlayer;

    setBullets([]);
    setEnemies([]);
    enemiesForCollisionRef.current = [];
    initStars();
    setScore(0);
    scoreRef.current = 0;
    setHighScoreState(getHighScore('starshooter_highscore'));
    lastEnemySpawnTime.current = Date.now();
    lastPlayerShotTime.current = Date.now();
    setGameState('playing');
    keysPressed.current = {};
    canvasRef.current?.focus();
  }, [getThemeColor, initStars]);

  useEffect(() => {
    const gameActiveStates: GameState[] = ['playing', 'game_over'];
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'playing') {
        if (['ArrowLeft', 'ArrowRight', 'a', 'd', ' '].includes(e.key)) {
          e.preventDefault();
        }
        keysPressed.current[e.key.toLowerCase()] = true;
      }
       if (e.key === 'Escape' && gameActiveStates.includes(gameState)) {
        e.preventDefault();
        setGameState('menu');
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (gameState === 'playing') {
         if (['ArrowLeft', 'ArrowRight', 'a', 'd', ' '].includes(e.key)) {
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
  }, [gameState]);

  const handleMobileMove = (direction: 'left' | 'right' | 'stop') => {
    if (gameState !== 'playing') return;
    keysPressed.current['mobile_left'] = direction === 'left';
    keysPressed.current['mobile_right'] = direction === 'right';
  };

 useEffect(() => {
    if (gameState !== 'playing') {
      return;
    }

    const gameLoop = setInterval(() => {
      const currentTime = Date.now();
      let LOCAL_playerHitInThisTick = false;

      // Update player position based on input
      setPlayer(prevPlayer => {
        if (!prevPlayer || !playerRef.current) return prevPlayer;
        let newX = playerRef.current.x;
        if (keysPressed.current['arrowleft'] || keysPressed.current['a'] || keysPressed.current['mobile_left']) {
          newX -= playerRef.current.speed;
        }
        if (keysPressed.current['arrowright'] || keysPressed.current['d'] || keysPressed.current['mobile_right']) {
          newX += playerRef.current.speed;
        }
        newX = Math.max(0, Math.min(newX, LOGIC_CANVAS_WIDTH - playerRef.current.width));

        if (newX !== playerRef.current.x) {
          playerRef.current = { ...playerRef.current, x: newX };
          return { ...prevPlayer, x: newX };
        }
        return prevPlayer;
      });

      let newBulletObjectForTick: Bullet | null = null;
      if (playerRef.current && (currentTime - lastPlayerShotTime.current > PLAYER_SHOOT_INTERVAL)) {
        const p = playerRef.current;
        newBulletObjectForTick = {
          id: `bullet_${performance.now()}_${Math.random().toString(36).substring(2, 9)}`,
          x: p.x + p.width / 2 - BULLET_WIDTH / 2,
          y: p.y,
          width: BULLET_WIDTH,
          height: BULLET_HEIGHT,
          speed: BULLET_SPEED,
          color: getThemeColor('--accent'),
        };
        lastPlayerShotTime.current = currentTime;
      }

      setEnemies(prevEnemies => {
        const movedEnemies = prevEnemies.map(e => ({ ...e, y: e.y + e.speed }));
        const currentFrameEnemies = movedEnemies.filter(e => e.y < LOGIC_CANVAS_HEIGHT);
        enemiesForCollisionRef.current = currentFrameEnemies;
        return currentFrameEnemies;
      });

      const currentPlayer = playerRef.current;
      if (currentPlayer) {
        for (const enemy of enemiesForCollisionRef.current) {
          if (
            currentPlayer.x < enemy.x + enemy.width &&
            currentPlayer.x + currentPlayer.width > enemy.x &&
            currentPlayer.y < enemy.y + enemy.height &&
            currentPlayer.y + currentPlayer.height > enemy.y
          ) {
            LOCAL_playerHitInThisTick = true;
            break;
          }
        }
      }

      if (!LOCAL_playerHitInThisTick) {
        setBullets(prevBullets => {
          let currentTickBullets = [...prevBullets];
          if (newBulletObjectForTick) {
            currentTickBullets.push(newBulletObjectForTick);
          }

          const movedBullets = currentTickBullets.map(b => ({ ...b, y: b.y - b.speed }));
          const finalSurvivingBullets: Bullet[] = [];
          const hitEnemyIdsThisTick = new Set<string>();

          for (const bullet of movedBullets) {
            if (bullet.y + bullet.height <= 0) continue;

            let bulletSurvivedThisCollisionPass = true;
            for (const enemy of enemiesForCollisionRef.current) {
              if (hitEnemyIdsThisTick.has(enemy.id!)) continue;

              if (
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y
              ) {
                hitEnemyIdsThisTick.add(enemy.id!);
                bulletSurvivedThisCollisionPass = false;
                break;
              }
            }
            if (bulletSurvivedThisCollisionPass) {
              finalSurvivingBullets.push(bullet);
            }
          }

          if (hitEnemyIdsThisTick.size > 0) {
            const pointsEarnedThisTick = hitEnemyIdsThisTick.size * 10;
            setScore(s => {
              const newScoreVal = s + pointsEarnedThisTick;
              scoreRef.current = newScoreVal;
              return newScoreVal;
            });
            setEnemies(currentEnemiesState => {
              const remainingEnemiesAfterHits = currentEnemiesState.filter(e => !hitEnemyIdsThisTick.has(e.id!));
              enemiesForCollisionRef.current = remainingEnemiesAfterHits;
              return remainingEnemiesAfterHits;
            });
          }
          return finalSurvivingBullets;
        });
      }


      if (LOCAL_playerHitInThisTick && gameState === 'playing') {
        setHighScoreState(currentHighScoreVal => {
          if (scoreRef.current > currentHighScoreVal) {
            saveHighScore('starshooter_highscore', scoreRef.current);
            return scoreRef.current;
          }
          return currentHighScoreVal;
        });
        setGameState('game_over');
      }

      if (
        currentTime - lastEnemySpawnTime.current > ENEMY_SPAWN_INTERVAL &&
        enemies.length < MAX_ENEMIES &&
        gameState === 'playing' &&
        !LOCAL_playerHitInThisTick
      ) {
        const difficultyFactor = 1 + Math.min(scoreRef.current / 500, 2.5);
        const enemyColor = getThemeColor('--primary'); // Enemies use primary color
        const newEnemy: EnemyShip = {
          id: `enemy_${performance.now()}_${Math.random().toString(36).substring(2, 9)}`,
          x: Math.random() * (LOGIC_CANVAS_WIDTH - ENEMY_WIDTH),
          y: -ENEMY_HEIGHT,
          width: ENEMY_WIDTH,
          height: ENEMY_HEIGHT,
          speed: (ENEMY_BASE_SPEED + Math.random() * 1.0) * difficultyFactor,
          color: enemyColor,
          variant: Math.random() < 0.6 ? 'A' : 'B', // Assign variant
        };
        setEnemies(prev => [...prev, newEnemy]);
        lastEnemySpawnTime.current = currentTime;
      }

      setStars(prevStars => prevStars.map(star => {
          let newY = star.y + star.speed;
          if (newY > LOGIC_CANVAS_HEIGHT) {
              newY = 0;
              star.x = Math.random() * LOGIC_CANVAS_WIDTH;
          }
          return {...star, y: newY};
      }));

    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [gameState, getThemeColor, initStars, enemies.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scaleX = actualCanvasSize.width / LOGIC_CANVAS_WIDTH;
    const scaleY = actualCanvasSize.height / LOGIC_CANVAS_HEIGHT;

    ctx.clearRect(0, 0, actualCanvasSize.width, actualCanvasSize.height);
    ctx.save();
    ctx.scale(scaleX, scaleY);

    const bgColor = getThemeColor('--background');
    const fgColor = getThemeColor('--foreground');
    const playerColor = player?.color || getThemeColor('--accent');
    const bulletColor = getThemeColor('--accent');
    const enemyAccentColor = getThemeColor('--accent');

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, LOGIC_CANVAS_WIDTH, LOGIC_CANVAS_HEIGHT);

    stars.forEach(star => {
      ctx.fillStyle = star.color || getThemeColor('--muted-foreground');
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });

    if (gameState !== 'menu') {
      const playerToDraw = playerRef.current || player;
      if (playerToDraw && gameState === 'playing' && playerBodyPath2D && playerThrusterPath2D) {
        ctx.save();
        ctx.translate(playerToDraw.x, playerToDraw.y);
        ctx.fillStyle = playerToDraw.color || playerColor;
        ctx.fill(playerBodyPath2D);
        ctx.fillStyle = getThemeColor('--destructive');
        ctx.fill(playerThrusterPath2D);
        ctx.restore();
      }

      bullets.forEach(bullet => {
        const currentBulletColor = bullet.color || bulletColor;
        ctx.fillStyle = currentBulletColor;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
      });

      enemiesForCollisionRef.current.forEach(enemy => {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.fillStyle = enemy.color || getThemeColor('--primary'); // Default to primary

        if (enemy.variant === 'A' && enemyOuterPathA && enemyInnerPathAPlusRect1 && enemyInnerPathAPlusRect2) {
          ctx.fill(enemyOuterPathA);
          ctx.fillStyle = enemyAccentColor; // Bright center for variant A
          ctx.fill(enemyInnerPathAPlusRect1);
          ctx.fill(enemyInnerPathAPlusRect2);
        } else if (enemy.variant === 'B' && enemyPathB) {
          ctx.fill(enemyPathB);
        } else { // Fallback to simple rect if paths are not ready or variant is unknown
          ctx.fillRect(0, 0, enemy.width, enemy.height);
        }
        ctx.restore();
      });

      ctx.fillStyle = fgColor;
      ctx.font = '20px "Space Grotesk", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${score}`, 10, 30);
      ctx.textAlign = 'right';
      ctx.fillText(`High Score: ${highScore}`, LOGIC_CANVAS_WIDTH - 10, 30);
    }

    if (gameState === 'game_over') {
      ctx.fillStyle = 'hsla(0, 0%, 4%, 0.8)'; // Explicit dark semi-transparent overlay
      ctx.fillRect(0, 0, LOGIC_CANVAS_WIDTH, LOGIC_CANVAS_HEIGHT);

      ctx.fillStyle = fgColor;
      ctx.textAlign = 'center';
      ctx.font = 'bold 28px "Space Grotesk", sans-serif';
      ctx.fillText('Game Over!', LOGIC_CANVAS_WIDTH / 2, LOGIC_CANVAS_HEIGHT / 2 - 20);

      ctx.font = '18px "Space Grotesk", sans-serif';
      ctx.fillText(`Final Score: ${score}`, LOGIC_CANVAS_WIDTH / 2, LOGIC_CANVAS_HEIGHT / 2 + 10);
      ctx.fillText(`High Score: ${highScore}`, LOGIC_CANVAS_WIDTH / 2, LOGIC_CANVAS_HEIGHT / 2 + 35);
    }
    ctx.restore();

  }, [gameState, player, bullets, enemies, stars, score, highScore, actualCanvasSize, getThemeColor]);


  if (gameState === 'menu') {
    return (
      <div className="flex flex-col items-center justify-center p-4 min-h-[70vh] gap-6 w-full">
        <Card className="w-full max-w-md bg-card/90 shadow-xl text-center border-border">
          <CardHeader>
            <CardTitle
              className="text-3xl md:text-4xl font-headline text-foreground flex items-center justify-center gap-2" // Use foreground for menu title
            >
                <Gamepad2 size={isMobile ? 30: 36} className="text-accent"/> Star Shooter
            </CardTitle>
            <CardContent className="text-muted-foreground text-sm md:text-base pt-2">Blast through endless waves of aliens! Your ship fires automatically.</CardContent>
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
              Star Shooter
            </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 p-2 sm:p-4">
            <div className="border-2 border-border rounded-md overflow-hidden shadow-inner bg-background" style={{ width: actualCanvasSize.width, height: actualCanvasSize.height }}>
                <canvas
                ref={canvasRef}
                width={actualCanvasSize.width}
                height={actualCanvasSize.height}
                aria-label="Star Shooter game board"
                role="img"
                tabIndex={0}
                />
            </div>
          {gameState === 'game_over' && (
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
             <p className="text-muted-foreground text-xs md:text-sm text-center">Use <kbd className="px-1 md:px-2 py-0.5 md:py-1 text-xs font-semibold text-background bg-foreground/70 border border-border rounded-lg">Arrow Keys</kbd> or <kbd className="px-1 md:px-2 py-0.5 md:py-1 text-xs font-semibold text-background bg-foreground/70 border border-border rounded-lg">A</kbd>/<kbd className="px-1 md:px-2 py-0.5 md:py-1 text-xs font-semibold text-background bg-foreground/70 border border-border rounded-lg">D</kbd> to move. Ship fires automatically. Press <kbd className="px-1 md:px-2 py-0.5 md:py-1 text-xs font-semibold text-background bg-foreground/70 border border-border rounded-lg">Esc</kbd> for menu.</p>
           )}
           {gameState === 'playing' && isMobile && (
             <p className="text-muted-foreground text-xs text-center">Use on-screen controls to move. Ship fires automatically. Press <kbd className="px-1 text-xs font-semibold text-background bg-foreground/70 border border-border rounded-lg">Esc</kbd> icon for menu (if available).</p>
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
              <MoveLeft size={32} />
            </Button>
            <Button
              variant="outline"
              className="aspect-square h-16 w-16 bg-card/70 border-primary/70 hover:bg-primary/30"
              onTouchStart={() => handleMobileMove('right')}
              onTouchEnd={() => handleMobileMove('stop')}
              onClick={() => handleMobileMove('right')}
              aria-label="Move Right"
            >
              <MoveRight size={32} />
            </Button>
          </div>
          <div className="aspect-square h-20 w-20 rounded-full flex items-center justify-center bg-card/30 border border-primary/50" aria-hidden="true">
            <Pointer size={40} className="text-primary opacity-70" />
          </div>
        </div>
      )}

       <div className="text-center text-muted-foreground p-2 md:p-4 bg-card/50 rounded-lg max-w-md text-xs md:text-sm mt-4">
        <h3 className="text-lg md:text-xl font-headline text-foreground mb-1 md:mb-2">How to Play Star Shooter</h3>
        <ul className="list-disc list-inside text-left space-y-0.5 md:space-y-1">
          <li>{isMobile ? "Use on-screen buttons" : "Use Arrow Keys or A/D"} for left/right movement.</li>
          <li>Your ship fires <span className="font-semibold" style={{color: getThemeColor('--accent')}}>light gray bullets</span> automatically!</li>
          <li>Destroy <span className="font-semibold" style={{color: getThemeColor('--primary')}}>enemy ships (purple)</span> to score points.</li>
          <li>Avoid colliding with enemy ships.</li>
          <li>The game gets faster as your score increases!</li>
          <li>{isMobile ? "Use game's menu options" : "Press Esc"} to return to the main menu.</li>
        </ul>
      </div>
    </div>
  );
}

