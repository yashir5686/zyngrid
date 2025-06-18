
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getHighScore, saveHighScore } from '@/lib/local-storage';
import { RefreshCcw, Trophy, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const GRID_SIZE = 20;
const MAX_CANVAS_WIDTH = 400; // Max width for the canvas

type Position = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const getRandomPosition = (currentGridSize: number): Position => ({
  x: Math.floor(Math.random() * currentGridSize),
  y: Math.floor(Math.random() * currentGridSize),
});

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>(getRandomPosition(GRID_SIZE));
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [score, setScore] = useState(0);
  const [highScore, setHighScoreState] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameSpeed, setGameSpeed] = useState(150);
  const isMobile = useIsMobile();

  const [canvasSize, setCanvasSize] = useState({ width: MAX_CANVAS_WIDTH, height: MAX_CANVAS_WIDTH });
  const [cellSize, setCellSize] = useState(MAX_CANVAS_WIDTH / GRID_SIZE);

  const getThemeColor = useCallback((cssVariable: string) => {
    if (typeof window !== 'undefined') {
      return `hsl(${getComputedStyle(document.documentElement).getPropertyValue(cssVariable).trim()})`;
    }
    // Fallback colors for non-browser environments (should ideally not be needed for client component)
    switch (cssVariable) {
      case '--background': return 'hsl(0 0% 4%)';
      case '--foreground': return 'hsl(0 0% 98%)';
      case '--primary': return 'hsl(270 70% 60%)';
      case '--accent': return 'hsl(270 70% 70%)';
      case '--card': return 'hsl(0 0% 8%)';
      case '--border': return 'hsl(0 0% 20%)';
      case '--destructive': return 'hsl(0 84% 60%)';
      default: return 'hsl(0 0% 98%)'; // Default to foreground
    }
  }, []);


  useEffect(() => {
    setHighScoreState(getHighScore('snake'));
  }, []);


  const updateCanvasDimensions = useCallback(() => {
    if (typeof window !== 'undefined') {
      const screenWidth = window.innerWidth;
      const newSize = Math.min(MAX_CANVAS_WIDTH, screenWidth - (isMobile ? 32 : 64)); 
      setCanvasSize({ width: newSize, height: newSize });
      setCellSize(newSize / GRID_SIZE);
    }
  }, [isMobile]);

  useEffect(() => {
    updateCanvasDimensions();
    window.addEventListener('resize', updateCanvasDimensions);
    return () => window.removeEventListener('resize', updateCanvasDimensions);
  }, [updateCanvasDimensions]);

  const resetGame = useCallback(() => {
    setSnake([{ x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) }]);
    setFood(getRandomPosition(GRID_SIZE));
    setDirection('RIGHT');
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
    setGameSpeed(150);
    canvasRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape'].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === 'Escape') {
        resetGame();
        return;
      }
      changeDirection(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, gameOver, gameStarted, resetGame]);

  const changeDirection = (keyOrDirection: string) => {
    let newDirection: Direction | null = null;
    switch (keyOrDirection) {
      case 'ArrowUp':
      case 'UP':
        if (direction !== 'DOWN') newDirection = 'UP';
        break;
      case 'ArrowDown':
      case 'DOWN':
        if (direction !== 'UP') newDirection = 'DOWN';
        break;
      case 'ArrowLeft':
      case 'LEFT':
        if (direction !== 'RIGHT') newDirection = 'LEFT';
        break;
      case 'ArrowRight':
      case 'RIGHT':
        if (direction !== 'LEFT') newDirection = 'RIGHT';
        break;
    }
    if (newDirection) setDirection(newDirection);
  };

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
          setFood(getRandomPosition(GRID_SIZE));
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

    ctx.fillStyle = getThemeColor('--background');
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    ctx.strokeStyle = getThemeColor('--border');
    for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, canvasSize.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(canvasSize.width, i * cellSize);
        ctx.stroke();
    }
    
    const foodColor = getThemeColor('--accent');
    ctx.fillStyle = foodColor;
    ctx.fillRect(food.x * cellSize, food.y * cellSize, cellSize, cellSize);
    ctx.strokeStyle = getThemeColor('--accent-foreground');
    ctx.strokeRect(food.x * cellSize, food.y * cellSize, cellSize, cellSize);
    
    const snakeColor = getThemeColor('--primary');
    ctx.fillStyle = snakeColor;
    snake.forEach((segment, index) => {
      ctx.fillRect(segment.x * cellSize, segment.y * cellSize, cellSize, cellSize);
      ctx.strokeStyle = getThemeColor('--primary-foreground');
      ctx.strokeRect(segment.x * cellSize, segment.y * cellSize, cellSize, cellSize);
      if (index === 0) { // Snake Head
        ctx.fillStyle = getThemeColor('--background'); // Eye color
        const eyeSize = cellSize / 5;
        const eyeOffset = cellSize / 4;
        if (direction === 'UP' || direction === 'DOWN') {
            ctx.fillRect(segment.x * cellSize + eyeOffset, segment.y * cellSize + eyeOffset, eyeSize, eyeSize);
            ctx.fillRect(segment.x * cellSize + cellSize - eyeOffset - eyeSize, segment.y * cellSize + eyeOffset, eyeSize, eyeSize);
        } else {
            ctx.fillRect(segment.x * cellSize + eyeOffset, segment.y * cellSize + eyeOffset, eyeSize, eyeSize);
            ctx.fillRect(segment.x * cellSize + eyeOffset, segment.y * cellSize + cellSize - eyeOffset - eyeSize, eyeSize, eyeSize);
        }
        ctx.fillStyle = snakeColor; // Reset fillStyle for next segment
      }
    });

    if (!gameStarted && !gameOver) {
      ctx.fillStyle = getThemeColor('--foreground'); // Use foreground for text
      ctx.textAlign = 'center';
      ctx.font = `${Math.max(16, canvasSize.width / 20)}px "Space Grotesk", sans-serif`;
      ctx.fillText('Press "Start Game" to Play!', canvasSize.width / 2, canvasSize.height / 2);
    }

    if (gameOver) {
      ctx.fillStyle = `hsla(${getComputedStyle(document.documentElement).getPropertyValue('--background').trim()}, 0.8)`; // Simpler overlay
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
      ctx.fillStyle = getThemeColor('--foreground');
      ctx.textAlign = 'center';
      ctx.font = `bold ${Math.max(24, canvasSize.width / 12)}px "Space Grotesk", sans-serif`;
      ctx.fillText('Game Over!', canvasSize.width / 2, canvasSize.height / 2 - 20);
      ctx.font = `${Math.max(16, canvasSize.width / 20)}px "Space Grotesk", sans-serif`;
      ctx.fillText(`Final Score: ${score}`, canvasSize.width / 2, canvasSize.height / 2 + 20);
    }

  }, [snake, food, gameOver, gameStarted, score, direction, canvasSize, cellSize, getThemeColor]);


  return (
    <div className="flex flex-col items-center gap-4 p-2 md:p-8 w-full">
      <Card className="w-full max-w-md bg-card/90 shadow-lg border-primary/50">
        <CardHeader>
          <CardTitle 
            className="text-2xl md:text-3xl font-headline text-primary text-center"
          >
            Classic Snake
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="flex justify-around w-full text-md md:text-lg">
            <p className="font-semibold text-foreground/80">Score: <span className="text-accent font-headline">{score}</span></p>
            <p className="font-semibold text-foreground/80 flex items-center"><Trophy className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5 text-yellow-400" /> High Score: <span className="text-accent font-headline">{highScore}</span></p>
          </div>
          <div className="border-2 border-primary rounded-md overflow-hidden shadow-inner bg-background" style={{ width: canvasSize.width, height: canvasSize.height }}>
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              aria-label="Snake game board"
              role="img"
              tabIndex={0}
            />
          </div>
          {!gameStarted || gameOver ? (
            <Button 
              onClick={resetGame} 
              size="lg" 
              className="bg-primary hover:bg-primary/80 text-primary-foreground font-headline text-base md:text-lg"
            >
              <RefreshCcw className="mr-2 h-5 w-5" /> {gameOver ? 'Play Again' : 'Start Game'}
            </Button>
          ) : (
             <p className="text-muted-foreground text-xs md:text-sm text-center">
               {isMobile ? "Use on-screen controls." : "Use arrow keys."} Press <kbd className="px-1 md:px-2 py-0.5 md:py-1 text-xs font-semibold text-background bg-foreground/70 border border-border rounded-lg">Esc</kbd> to reset.
             </p>
          )}
        </CardContent>
      </Card>

      {isMobile && gameStarted && !gameOver && (
        <div className="mt-4 grid grid-cols-3 gap-2 w-full max-w-xs">
          <div></div> 
          <Button variant="outline" className="aspect-square h-16 w-full bg-card/70 border-primary/70 hover:bg-primary/30" onClick={() => changeDirection('UP')} aria-label="Move Up">
            <ArrowUp size={32} />
          </Button>
          <div></div> 

          <Button variant="outline" className="aspect-square h-16 w-full bg-card/70 border-primary/70 hover:bg-primary/30" onClick={() => changeDirection('LEFT')} aria-label="Move Left">
            <ArrowLeft size={32} />
          </Button>
          <Button variant="outline" className="aspect-square h-16 w-full bg-card/70 border-primary/70 hover:bg-primary/30" onClick={() => changeDirection('DOWN')} aria-label="Move Down">
            <ArrowDown size={32} />
          </Button>
          <Button variant="outline" className="aspect-square h-16 w-full bg-card/70 border-primary/70 hover:bg-primary/30" onClick={() => changeDirection('RIGHT')} aria-label="Move Right">
            <ArrowRight size={32} />
          </Button>
        </div>
      )}

      <div className="text-center text-muted-foreground p-2 md:p-4 bg-card/50 rounded-lg max-w-md text-xs md:text-sm">
        <h3 className="text-lg md:text-xl font-headline text-foreground mb-1 md:mb-2">How to Play</h3>
        <ul className="list-disc list-inside text-left space-y-0.5 md:space-y-1">
          <li>{isMobile ? "Use the on-screen buttons" : "Use Arrow Keys"} to control the snake.</li>
          <li>Eat the <span className="text-accent font-semibold">purple food</span> to grow and score points.</li>
          <li>Avoid hitting the walls or your own tail.</li>
          <li>The game speeds up as you eat more food!</li>
          <li>Press <kbd className="px-1 md:px-2 py-0.5 md:py-1 text-xs font-semibold text-background bg-foreground/70 border border-border rounded-lg">Esc</kbd> to reset the game (desktop only).</li>
        </ul>
      </div>
    </div>
  );
}
