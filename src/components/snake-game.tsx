
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getHighScore, saveHighScore } from '@/lib/local-storage';
import { RefreshCcw, Trophy } from 'lucide-react';

const GRID_SIZE = 20;
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 400;
const CELL_SIZE = CANVAS_WIDTH / GRID_SIZE;

type Position = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const getRandomPosition = (): Position => ({
  x: Math.floor(Math.random() * GRID_SIZE),
  y: Math.floor(Math.random() * GRID_SIZE),
});

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>(getRandomPosition());
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [score, setScore] = useState(0);
  const [highScore, setHighScoreState] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameSpeed, setGameSpeed] = useState(150); // Milliseconds

  const [colorValues, setColorValues] = useState({
    card: '220 11% 20%', // Default HSL components
    border: '220 11% 30%',
    accent: '197 84% 54%',
    accentForeground: '0 0% 98%',
    primary: '286 82% 54%',
    primaryForeground: '0 0% 98%',
    background: '220 11% 15%',
    foreground: '0 0% 98%',
    destructiveHslComps: '0 72% 51%',
  });

  useEffect(() => {
    // Fetch actual CSS variable values once the component is mounted
    if (typeof window !== 'undefined' && document.documentElement) {
      const computedStyle = getComputedStyle(document.documentElement);
      setColorValues({
        card: computedStyle.getPropertyValue('--card').trim(),
        border: computedStyle.getPropertyValue('--border').trim(),
        accent: computedStyle.getPropertyValue('--accent').trim(),
        accentForeground: computedStyle.getPropertyValue('--accent-foreground').trim(),
        primary: computedStyle.getPropertyValue('--primary').trim(),
        primaryForeground: computedStyle.getPropertyValue('--primary-foreground').trim(),
        background: computedStyle.getPropertyValue('--background').trim(),
        foreground: computedStyle.getPropertyValue('--foreground').trim(),
        destructiveHslComps: computedStyle.getPropertyValue('--destructive').trim(),
      });
    }
  }, []);

  useEffect(() => {
    setHighScoreState(getHighScore('snake'));
  }, []);

  const resetGame = useCallback(() => {
    setSnake([{ x: 10, y: 10 }]);
    setFood(getRandomPosition());
    setDirection('RIGHT');
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
    setGameSpeed(150);
  }, []);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      switch (e.key) {
        case 'ArrowUp':
          if (direction !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown':
          if (direction !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft':
          if (direction !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight':
          if (direction !== 'LEFT') setDirection('RIGHT');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, gameOver, gameStarted]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameLoopInterval = setInterval(() => {
      setSnake(prevSnake => {
        const newSnake = [...prevSnake];
        const head = { ...newSnake[0] };

        switch (direction) {
          case 'UP': head.y -= 1; break;
          case 'DOWN': head.y += 1; break;
          case 'LEFT': head.x -= 1; break;
          case 'RIGHT': head.x += 1; break;
        }

        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          setGameOver(true);
          return prevSnake;
        }

        for (let i = 1; i < newSnake.length; i++) {
          if (newSnake[i].x === head.x && newSnake[i].y === head.y) {
            setGameOver(true);
            return prevSnake;
          }
        }

        newSnake.unshift(head);

        if (head.x === food.x && head.y === food.y) {
          setScore(s => s + 10);
          setFood(getRandomPosition());
          setGameSpeed(s => Math.max(50, s - 5));
        } else {
          newSnake.pop();
        }
        return newSnake;
      });
    }, gameSpeed);

    return () => clearInterval(gameLoopInterval);
  }, [snake, direction, food, gameOver, gameStarted, gameSpeed]);

  useEffect(() => {
    if (gameOver) {
      if (score > highScore) {
        saveHighScore('snake', score);
        setHighScoreState(score);
      }
    }
  }, [gameOver, score, highScore]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = `hsl(${colorValues.card})`;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = `hsl(${colorValues.border})`;
    for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, CANVAS_HEIGHT);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(CANVAS_WIDTH, i * CELL_SIZE);
        ctx.stroke();
    }
    
    ctx.fillStyle = `hsl(${colorValues.accent})`;
    ctx.fillRect(food.x * CELL_SIZE, food.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    ctx.strokeStyle = `hsl(${colorValues.accentForeground})`;
    ctx.strokeRect(food.x * CELL_SIZE, food.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

    ctx.fillStyle = `hsl(${colorValues.primary})`;
    snake.forEach((segment, index) => {
      ctx.fillRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      ctx.strokeStyle = `hsl(${colorValues.primaryForeground})`;
      ctx.strokeRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      if (index === 0) {
        ctx.fillStyle = `hsl(${colorValues.background})`; 
        const eyeSize = CELL_SIZE / 5;
        const eyeOffset = CELL_SIZE / 4;
        if (direction === 'UP' || direction === 'DOWN') {
            ctx.fillRect(segment.x * CELL_SIZE + eyeOffset, segment.y * CELL_SIZE + eyeOffset, eyeSize, eyeSize);
            ctx.fillRect(segment.x * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize, segment.y * CELL_SIZE + eyeOffset, eyeSize, eyeSize);
        } else { 
            ctx.fillRect(segment.x * CELL_SIZE + eyeOffset, segment.y * CELL_SIZE + eyeOffset, eyeSize, eyeSize);
            ctx.fillRect(segment.x * CELL_SIZE + eyeOffset, segment.y * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize, eyeSize, eyeSize);
        }
      }
    });

    if (!gameStarted && !gameOver) {
      ctx.fillStyle = `hsla(${colorValues.foreground}, 0.8)`;
      ctx.textAlign = 'center';
      ctx.font = '24px "Space Grotesk", sans-serif';
      ctx.fillText('Press "Start Game" to Play!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
    
    if (gameOver) {
      ctx.fillStyle = `hsla(${colorValues.destructiveHslComps}, 0.8)`;
      ctx.textAlign = 'center';
      ctx.font = 'bold 48px "Space Grotesk", sans-serif';
      ctx.fillText('Game Over!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
      ctx.font = '24px "Space Grotesk", sans-serif';
      ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    }

  }, [snake, food, gameOver, gameStarted, score, direction, colorValues]);


  return (
    <div className="flex flex-col items-center gap-6 p-4 md:p-8">
      <Card className="w-full max-w-md bg-card/90 shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-primary text-center">Classic Snake</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="flex justify-around w-full text-lg">
            <p className="font-semibold">Score: <span className="text-accent font-headline">{score}</span></p>
            <p className="font-semibold flex items-center"><Trophy className="mr-2 h-5 w-5 text-yellow-400" /> High Score: <span className="text-accent font-headline">{highScore}</span></p>
          </div>
          <div className="border-4 border-primary rounded-md overflow-hidden shadow-inner bg-background">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              aria-label="Snake game board"
              role="img"
            />
          </div>
          {!gameStarted || gameOver ? (
            <Button onClick={resetGame} size="lg" className="bg-primary hover:bg-primary/80 text-primary-foreground font-headline">
              <RefreshCcw className="mr-2 h-5 w-5" /> {gameOver ? 'Play Again' : 'Start Game'}
            </Button>
          ) : (
             <p className="text-muted-foreground text-sm">Use arrow keys to control the snake.</p>
          )}
        </CardContent>
      </Card>
      <div className="text-center text-muted-foreground p-4 bg-card/50 rounded-lg max-w-md">
        <h3 className="text-xl font-headline text-foreground mb-2">How to Play</h3>
        <ul className="list-disc list-inside text-left space-y-1">
          <li>Use <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Arrow Keys</kbd> to control the snake.</li>
          <li>Eat the <span className="text-accent font-semibold">blue food</span> to grow and score points.</li>
          <li>Avoid hitting the walls or your own tail.</li>
          <li>The game speeds up as you eat more food!</li>
        </ul>
      </div>
    </div>
  );
}
