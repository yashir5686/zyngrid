
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
const BULLET_SPEED = 10;
const ENEMY_WIDTH = 35;
const ENEMY_HEIGHT = 30;
const ENEMY_BASE_SPEED = 1.5; 
const ENEMY_SPAWN_INTERVAL = 1200; 
const MAX_ENEMIES = 12; 
const STAR_COUNT = 100;
const PLAYER_SHOOT_INTERVAL = 300; 

type GameState = 'menu' | 'playing' | 'game_over';

export default function StarShooterGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>('menu');
  const [player, setPlayer] = useState<StarShooterPlayer | null>(null); // For React rendering
  const playerRef = useRef<StarShooterPlayer | null>(null); // For game loop logic

  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [enemies, setEnemies] = useState<EnemyShip[]>([]);
  const [stars, setStars] = useState<Star[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScoreState] = useState(0);
  
  const lastEnemySpawnTime = useRef(0);
  const lastPlayerShotTime = useRef(Date.now()); // Initialize to avoid immediate shot
  const isMobile = useIsMobile();

  const [actualCanvasSize, setActualCanvasSize] = useState({ width: LOGIC_CANVAS_WIDTH, height: LOGIC_CANVAS_HEIGHT });

  const [colorValues, setColorValues] = useState({
    background: '220 11% 15%',
    foreground: '0 0% 98%',
    primary: '286 82% 54%',
    accent: '197 84% 54%',
    destructive: '0 72% 51%',
    card: '220 11% 20%',
    enemyColor1: '30 100% 50%', 
    enemyColor2: '60 100% 50%', 
    starColor: '0 0% 70%', 
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
      }));
    }
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
    for (let i = 0; i < STAR_COUNT; i++) {
      newStars.push({
        x: Math.random() * LOGIC_CANVAS_WIDTH,
        y: Math.random() * LOGIC_CANVAS_HEIGHT,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 1 + 0.2,
        color: `hsla(${colorValues.starColor}, ${Math.random() * 0.5 + 0.3})`
      });
    }
    setStars(newStars);
  }, [colorValues.starColor]);

  const startGame = useCallback(() => {
    const initialPlayer: StarShooterPlayer = {
      x: LOGIC_CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
      y: LOGIC_CANVAS_HEIGHT - PLAYER_HEIGHT - 20,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      speed: PLAYER_SPEED,
      color: `hsl(${colorValues.primary})`,
    };
    setPlayer(initialPlayer);
    playerRef.current = initialPlayer;

    setBullets([]);
    setEnemies([]);
    initStars();
    setScore(0);
    setHighScoreState(getHighScore('starshooter_highscore'));
    lastEnemySpawnTime.current = Date.now();
    lastPlayerShotTime.current = Date.now(); 
    setGameState('playing');
    keysPressed.current = {};
    canvasRef.current?.focus();
  }, [colorValues, initStars]);

  useEffect(() => {
    const gameActiveStates: GameState[] = ['playing', 'game_over'];
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'playing') {
        if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(e.key)) {
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
         if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(e.key)) {
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
    
    // Sync playerRef with player state if it exists (e.g., after startGame)
    // This ensures playerRef is up-to-date if the effect re-runs.
    if (player && playerRef.current !== player) {
        playerRef.current = player;
    }

    const gameLoop = setInterval(() => {
      const currentTime = Date.now();
      const currentPlayerLogic = playerRef.current;

      // Player Movement
      if (currentPlayerLogic) {
        let newX = currentPlayerLogic.x;
        if (keysPressed.current['arrowleft'] || keysPressed.current['a'] || keysPressed.current['mobile_left']) {
          newX -= currentPlayerLogic.speed;
        }
        if (keysPressed.current['arrowright'] || keysPressed.current['d'] || keysPressed.current['mobile_right']) {
          newX += currentPlayerLogic.speed;
        }
        newX = Math.max(0, Math.min(newX, LOGIC_CANVAS_WIDTH - currentPlayerLogic.width));

        if (newX !== currentPlayerLogic.x) {
          playerRef.current = { ...currentPlayerLogic, x: newX };
          setPlayer(pState => pState ? { ...pState, x: newX } : null); 
        }
      }
      
      // Automatic Player Shooting
      if (playerRef.current && (currentTime - lastPlayerShotTime.current > PLAYER_SHOOT_INTERVAL)) {
        const p = playerRef.current;
        setBullets(prevBullets => [
          ...prevBullets,
          {
            x: p.x + p.width / 2 - BULLET_WIDTH / 2,
            y: p.y,
            width: BULLET_WIDTH,
            height: BULLET_HEIGHT,
            speed: BULLET_SPEED,
            color: `hsl(${colorValues.accent})`,
          },
        ]);
        lastPlayerShotTime.current = currentTime;
      }

      // Update bullets, enemies, and handle collisions
      setBullets(prevAllBullets => {
        let stillExistingBullets = prevAllBullets
          .map(b => ({ ...b, y: b.y - b.speed })) 
          .filter(b => b.y + b.height > 0); 

        setEnemies(prevAllEnemies => {
          let scoreGainedThisTick = 0;
          let playerHitThisTick = false;

          const enemiesAfterCollisions = prevAllEnemies.reduce((acc: EnemyShip[], enemy) => {
            let currentEnemy = { ...enemy, y: enemy.y + enemy.speed }; 
            let enemyWasHitByBullet = false;

            const bulletsThatDidNotHitThisEnemy: Bullet[] = [];
            for (const bullet of stillExistingBullets) {
              if (
                bullet.x < currentEnemy.x + currentEnemy.width &&
                bullet.x + bullet.width > currentEnemy.x &&
                bullet.y < currentEnemy.y + currentEnemy.height &&
                bullet.y + bullet.height > currentEnemy.y
              ) {
                enemyWasHitByBullet = true;
                scoreGainedThisTick += 10;
              } else {
                bulletsThatDidNotHitThisEnemy.push(bullet);
              }
            }
            stillExistingBullets = bulletsThatDidNotHitThisEnemy; 

            if (enemyWasHitByBullet) {
              return acc; 
            }
            
            const pLogic = playerRef.current;
            if (pLogic &&
              pLogic.x < currentEnemy.x + currentEnemy.width &&
              pLogic.x + pLogic.width > currentEnemy.x &&
              pLogic.y < currentEnemy.y + currentEnemy.height &&
              pLogic.y + pLogic.height > currentEnemy.y 
            ) {
              playerHitThisTick = true;
            }

            if (currentEnemy.y < LOGIC_CANVAS_HEIGHT) {
              acc.push(currentEnemy); 
            }
            return acc;
          }, [] as EnemyShip[]);

          if (scoreGainedThisTick > 0) {
            setScore(s => s + scoreGainedThisTick);
          }

          if (playerHitThisTick && gameState === 'playing') { // gameState check to prevent multiple triggers
            setScore(currentScoreVal => {
                setHighScoreState(currentHighScoreVal => {
                    if (currentScoreVal > currentHighScoreVal) {
                        saveHighScore('starshooter_highscore', currentScoreVal);
                        return currentScoreVal;
                    }
                    return currentHighScoreVal;
                });
                return currentScoreVal;
            });
            setGameState('game_over');
          }
          return enemiesAfterCollisions;
        });
        return stillExistingBullets; 
      });
      
      // Spawn new enemies
      if (currentTime - lastEnemySpawnTime.current > ENEMY_SPAWN_INTERVAL) {
        setEnemies(prevEnemies => {
          if (prevEnemies.length < MAX_ENEMIES) {
            // Read score directly from state for difficulty factor, functional update for score ensures it is up-to-date
            const difficultyFactor = 1 + Math.min(score / 500, 2.5); 
            return [
              ...prevEnemies,
              {
                x: Math.random() * (LOGIC_CANVAS_WIDTH - ENEMY_WIDTH),
                y: -ENEMY_HEIGHT,
                width: ENEMY_WIDTH,
                height: ENEMY_HEIGHT,
                speed: (ENEMY_BASE_SPEED + Math.random() * 1.0) * difficultyFactor,
                color: Math.random() > 0.5 ? `hsl(${colorValues.enemyColor1})` : `hsl(${colorValues.enemyColor2})`,
              },
            ];
          }
          return prevEnemies;
        });
        lastEnemySpawnTime.current = currentTime;
      }
      
      // Update stars
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
  }, [gameState, colorValues, initStars, score, saveHighScore]); // Added score and saveHighScore as they are read in the loop

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

    ctx.fillStyle = `hsl(${colorValues.background})`;
    ctx.fillRect(0, 0, LOGIC_CANVAS_WIDTH, LOGIC_CANVAS_HEIGHT);

    stars.forEach(star => {
      ctx.fillStyle = star.color || `hsla(${colorValues.starColor}, 0.7)`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });
    
    if (gameState !== 'menu') {
      const playerToDraw = playerRef.current || player; // Prefer ref for current position if available
      if (playerToDraw) {
        ctx.fillStyle = playerToDraw.color || `hsl(${colorValues.primary})`;
        ctx.beginPath();
        ctx.moveTo(playerToDraw.x + playerToDraw.width / 2, playerToDraw.y); 
        ctx.lineTo(playerToDraw.x, playerToDraw.y + playerToDraw.height); 
        ctx.lineTo(playerToDraw.x + playerToDraw.width, playerToDraw.y + playerToDraw.height); 
        ctx.closePath();
        ctx.fill();
      }

      bullets.forEach(bullet => {
        ctx.fillStyle = bullet.color || `hsl(${colorValues.accent})`;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
      });

      enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color || `hsl(${colorValues.destructive})`;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
      });

      ctx.fillStyle = `hsl(${colorValues.foreground})`;
      ctx.font = '20px "Space Grotesk", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${score}`, 10, 30);
      ctx.textAlign = 'right';
      ctx.fillText(`High Score: ${highScore}`, LOGIC_CANVAS_WIDTH - 10, 30);
    }

    if (gameState === 'game_over') {
      ctx.fillStyle = `hsla(${colorValues.card}, 0.9)`; 
      ctx.fillRect(LOGIC_CANVAS_WIDTH / 4, LOGIC_CANVAS_HEIGHT / 2 - 60, LOGIC_CANVAS_WIDTH / 2, 120); 
      
      ctx.fillStyle = `hsl(${colorValues.foreground})`;
      ctx.textAlign = 'center';
      ctx.font = 'bold 28px "Space Grotesk", sans-serif'; 
      ctx.fillText('Game Over!', LOGIC_CANVAS_WIDTH / 2, LOGIC_CANVAS_HEIGHT / 2 - 20);
      ctx.font = '18px "Space Grotesk", sans-serif';
      ctx.fillText(`Final Score: ${score}`, LOGIC_CANVAS_WIDTH / 2, LOGIC_CANVAS_HEIGHT / 2 + 10);
      ctx.fillText(`High Score: ${highScore}`, LOGIC_CANVAS_WIDTH / 2, LOGIC_CANVAS_HEIGHT / 2 + 35);
    }
    
    ctx.restore();

  }, [gameState, player, bullets, enemies, stars, score, highScore, colorValues, actualCanvasSize]);


  if (gameState === 'menu') {
    return (
      <div className="flex flex-col items-center justify-center p-4 min-h-[70vh] gap-6 w-full">
        <Card className="w-full max-w-md bg-card/90 shadow-xl text-center">
          <CardHeader>
            <CardTitle className="text-3xl md:text-4xl font-headline text-primary flex items-center justify-center gap-2">
                <Gamepad2 size={isMobile ? 30: 36} /> Star Shooter
            </CardTitle>
            <CardContent className="text-muted-foreground text-sm md:text-base pt-2">Blast through endless waves of aliens! Your ship fires automatically.</CardContent>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button onClick={startGame} size="lg" className="bg-primary hover:bg-primary/80 text-primary-foreground font-headline text-base md:text-lg">
              <Play className="mr-2" /> Start Game
            </Button>
             <p className="text-xs md:text-sm text-muted-foreground pt-2">Current High Score: {highScore}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 p-2 md:p-8 w-full">
      <Card className="w-full bg-card/90 shadow-xl overflow-hidden" style={{maxWidth: actualCanvasSize.width }}>
        <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl md:text-3xl font-headline text-primary">
              Star Shooter
            </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 p-2 sm:p-4">
            <div className="border-4 border-primary rounded-md overflow-hidden shadow-inner bg-background" style={{ width: actualCanvasSize.width, height: actualCanvasSize.height }}>
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
              <Button onClick={() => setGameState('menu')} size="lg" variant="outline" className="text-sm sm:text-base">
                <Home className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Main Menu
              </Button>
            </div>
          )}
           {gameState === 'playing' && !isMobile && (
             <p className="text-muted-foreground text-xs md:text-sm text-center">Use <kbd className="px-1 md:px-2 py-0.5 md:py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Arrow Keys</kbd> or <kbd className="px-1 md:px-2 py-0.5 md:py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">A</kbd>/<kbd className="px-1 md:px-2 py-0.5 md:py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">D</kbd> to move. Ship fires automatically. Press <kbd className="px-1 md:px-2 py-0.5 md:py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Esc</kbd> for menu.</p>
           )}
           {gameState === 'playing' && isMobile && (
             <p className="text-muted-foreground text-xs text-center">Use on-screen controls to move. Ship fires automatically. Press <kbd className="px-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Esc</kbd> icon for menu (if available).</p>
           )}
        </CardContent>
      </Card>

      {isMobile && gameState === 'playing' && (
        <div className="fixed bottom-4 left-4 right-4 flex justify-between items-center z-10 p-2 bg-card/50 rounded-lg">
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="aspect-square h-16 w-16"
              onTouchStart={() => handleMobileMove('left')}
              onTouchEnd={() => handleMobileMove('stop')}
              onClick={() => handleMobileMove('left')} 
              aria-label="Move Left"
            >
              <MoveLeft size={32} />
            </Button>
            <Button
              variant="outline"
              className="aspect-square h-16 w-16"
              onTouchStart={() => handleMobileMove('right')}
              onTouchEnd={() => handleMobileMove('stop')}
              onClick={() => handleMobileMove('right')} 
              aria-label="Move Right"
            >
              <MoveRight size={32} />
            </Button>
          </div>
          <div className="aspect-square h-20 w-20 rounded-full flex items-center justify-center bg-card/30" aria-hidden="true">
            <Pointer size={40} className="text-muted-foreground opacity-50" />
          </div>
        </div>
      )}

       <div className="text-center text-muted-foreground p-2 md:p-4 bg-card/50 rounded-lg max-w-md text-xs md:text-sm mt-4">
        <h3 className="text-lg md:text-xl font-headline text-foreground mb-1 md:mb-2">How to Play Star Shooter</h3>
        <ul className="list-disc list-inside text-left space-y-0.5 md:space-y-1">
          <li>{isMobile ? "Use on-screen buttons" : "Use Arrow Keys or A/D"} for left/right movement.</li>
          <li>Your ship fires bullets automatically!</li>
          <li>Destroy enemy ships to score points.</li>
          <li>Avoid colliding with enemy ships.</li>
          <li>The game gets faster as your score increases!</li>
          <li>{isMobile ? "Use game's menu options" : "Press Esc"} to return to the main menu.</li>
        </ul>
      </div>
    </div>
  );
}
