import { useState, useEffect, useCallback, useRef } from 'react';

type Position = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const GRID_SIZE = 20;
const CELL_SIZE = 24;
const INITIAL_SPEED = 150;
const SPEED_INCREMENT = 3;
const MIN_SPEED = 60;

function App() {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 10 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [speed, setSpeed] = useState(INITIAL_SPEED);

  const directionRef = useRef<Direction>(direction);
  const gameLoopRef = useRef<number | null>(null);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  const generateFood = useCallback((currentSnake: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (currentSnake.some(seg => seg.x === newFood.x && seg.y === newFood.y));
    return newFood;
  }, []);

  const resetGame = useCallback(() => {
    const initialSnake = [{ x: 10, y: 10 }];
    setSnake(initialSnake);
    setFood(generateFood(initialSnake));
    setDirection('RIGHT');
    directionRef.current = 'RIGHT';
    setGameOver(false);
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setIsPaused(false);
    setGameStarted(true);
  }, [generateFood]);

  const moveSnake = useCallback(() => {
    if (gameOver || isPaused || !gameStarted) return;

    setSnake(prevSnake => {
      const head = { ...prevSnake[0] };
      const currentDir = directionRef.current;

      switch (currentDir) {
        case 'UP': head.y -= 1; break;
        case 'DOWN': head.y += 1; break;
        case 'LEFT': head.x -= 1; break;
        case 'RIGHT': head.x += 1; break;
      }

      // Check wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameOver(true);
        setHighScore(prev => Math.max(prev, score));
        return prevSnake;
      }

      // Check self collision
      if (prevSnake.some(seg => seg.x === head.x && seg.y === head.y)) {
        setGameOver(true);
        setHighScore(prev => Math.max(prev, score));
        return prevSnake;
      }

      const newSnake = [head, ...prevSnake];

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        setScore(prev => prev + 10);
        setFood(generateFood(newSnake));
        setSpeed(prev => Math.max(MIN_SPEED, prev - SPEED_INCREMENT));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [gameOver, isPaused, gameStarted, food, score, generateFood]);

  // Game loop
  useEffect(() => {
    if (gameStarted && !gameOver && !isPaused) {
      gameLoopRef.current = window.setInterval(moveSnake, speed);
    }
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [moveSnake, speed, gameStarted, gameOver, isPaused]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted) {
        if (e.key === ' ' || e.key === 'Enter') {
          resetGame();
          return;
        }
      }

      if (gameOver) {
        if (e.key === ' ' || e.key === 'Enter') {
          resetGame();
          return;
        }
      }

      if (e.key === 'p' || e.key === 'P') {
        setIsPaused(prev => !prev);
        return;
      }

      const currentDir = directionRef.current;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (currentDir !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (currentDir !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (currentDir !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (currentDir !== 'LEFT') setDirection('RIGHT');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, gameOver, resetGame]);

  const handleDirectionButton = (newDir: Direction) => {
    const currentDir = directionRef.current;
    if (
      (newDir === 'UP' && currentDir !== 'DOWN') ||
      (newDir === 'DOWN' && currentDir !== 'UP') ||
      (newDir === 'LEFT' && currentDir !== 'RIGHT') ||
      (newDir === 'RIGHT' && currentDir !== 'LEFT')
    ) {
      setDirection(newDir);
    }
  };

  const getDirectionEmoji = () => {
    switch (directionRef.current) {
      case 'UP': return '🚂';
      case 'DOWN': return '🚂';
      case 'LEFT': return '🚂';
      case 'RIGHT': return '🚂';
    }
  };

  const getTrainSegment = (index: number, total: number) => {
    if (index === 0) {
      // Locomotive
      let rotation = '';
      switch (direction) {
        case 'UP': rotation = 'rotate-[-90deg]'; break;
        case 'DOWN': rotation = 'rotate-90'; break;
        case 'LEFT': rotation = 'rotate-180'; break;
        case 'RIGHT': rotation = ''; break;
      }
      return (
        <span className={`text-lg ${rotation} inline-block`}>🚂</span>
      );
    } else {
      // Vagões
      const wagonColors = ['🟫', '🟥', '🟦', '🟩', '🟨', '🟪'];
      return (
        <span className="text-base inline-block">
          {index % 2 === 1 ? '🟧' : '🟪'}
        </span>
      );
    }
  };

  const renderGrid = () => {
    const cells = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const isSnakeHead = snake[0]?.x === x && snake[0]?.y === y;
        const snakeIndex = snake.findIndex(seg => seg.x === x && seg.y === y);
        const isSnakeBody = snakeIndex > 0;
        const isFood = food.x === x && food.y === y;

        let cellContent = null;
        let cellClass = 'relative flex items-center justify-center';

        if (isSnakeHead) {
          cellClass += ' z-10';
          cellContent = (
            <div className={`w-full h-full flex items-center justify-center rounded-md bg-green-600 shadow-lg shadow-green-600/50`}>
              <span className="text-base" style={{
                transform: direction === 'UP' ? 'rotate(-90deg)' :
                  direction === 'DOWN' ? 'rotate(90deg)' :
                    direction === 'LEFT' ? 'rotate(180deg)' : 'rotate(0deg)'
              }}>🚂</span>
            </div>
          );
        } else if (isSnakeBody) {
          const isLast = snakeIndex === snake.length - 1;
          const hue = (snakeIndex * 30) % 360;
          cellContent = (
            <div className={`w-full h-full flex items-center justify-center rounded-sm ${isLast ? 'bg-amber-700' : 'bg-amber-600'} shadow-sm`}>
              <span className="text-xs">🚃</span>
            </div>
          );
        } else if (isFood) {
          cellContent = (
            <div className="w-full h-full flex items-center justify-center animate-bounce">
              <span className="text-lg">⛽</span>
            </div>
          );
        }

        cells.push(
          <div
            key={`${x}-${y}`}
            className={cellClass}
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              backgroundColor: (x + y) % 2 === 0 ? '#2d5016' : '#3a6b1e',
            }}
          >
            {cellContent}
          </div>
        );
      }
    }
    return cells;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-900 via-sky-800 to-emerald-900 flex flex-col items-center justify-center p-4 select-none">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">
          🚂 Trem da Cobrinha 🚃
        </h1>
        <p className="text-sky-200 text-sm md:text-base">
          Colete combustível para adicionar vagões ao trem!
        </p>
      </div>

      {/* Score Board */}
      <div className="flex gap-6 mb-4">
        <div className="bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
          <div className="text-sky-300 text-xs uppercase tracking-wide">Pontos</div>
          <div className="text-white text-2xl font-bold">{score}</div>
        </div>
        <div className="bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
          <div className="text-sky-300 text-xs uppercase tracking-wide">Recorde</div>
          <div className="text-yellow-300 text-2xl font-bold">{highScore}</div>
        </div>
        <div className="bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
          <div className="text-sky-300 text-xs uppercase tracking-wide">Vagões</div>
          <div className="text-white text-2xl font-bold">{Math.max(0, snake.length - 1)}</div>
        </div>
      </div>

      {/* Game Board */}
      <div className="relative border-4 border-amber-800 rounded-lg shadow-2xl shadow-black/50 overflow-hidden">
        {/* Railroad tracks border effect */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
          }}
        >
          {renderGrid()}
        </div>

        {/* Overlay messages */}
        {!gameStarted && !gameOver && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center backdrop-blur-sm">
            <div className="text-6xl mb-4 animate-bounce">🚂</div>
            <h2 className="text-white text-2xl font-bold mb-2">Trem da Cobrinha</h2>
            <p className="text-sky-200 mb-4 text-center px-4">
              Use as setas ou WASD para controlar o trem
            </p>
            <button
              onClick={resetGame}
              className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-full text-lg transition-all hover:scale-105 shadow-lg"
            >
              🚂 Iniciar Viagem!
            </button>
            <p className="text-sky-300 text-xs mt-3">ou pressione Espaço / Enter</p>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center backdrop-blur-sm">
            <div className="text-6xl mb-4">💥</div>
            <h2 className="text-red-400 text-3xl font-bold mb-2">Descarrilou!</h2>
            <p className="text-white text-xl mb-1">Pontuação: {score}</p>
            <p className="text-sky-200 mb-4">Vagões: {Math.max(0, snake.length - 1)}</p>
            {score >= highScore && score > 0 && (
              <p className="text-yellow-300 text-lg mb-4 animate-pulse">🏆 Novo Recorde! 🏆</p>
            )}
            <button
              onClick={resetGame}
              className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-full text-lg transition-all hover:scale-105 shadow-lg"
            >
              🔄 Nova Viagem
            </button>
            <p className="text-sky-300 text-xs mt-3">ou pressione Espaço / Enter</p>
          </div>
        )}

        {isPaused && !gameOver && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center backdrop-blur-sm">
            <div className="text-5xl mb-4">⏸️</div>
            <h2 className="text-white text-2xl font-bold mb-2">Pausado</h2>
            <p className="text-sky-200">Pressione P para continuar</p>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="mt-6 md:hidden">
        <div className="grid grid-cols-3 gap-2 w-40 mx-auto">
          <div></div>
          <button
            onTouchStart={() => handleDirectionButton('UP')}
            onClick={() => handleDirectionButton('UP')}
            className="bg-white/20 hover:bg-white/30 active:bg-white/40 text-white rounded-lg p-3 text-xl flex items-center justify-center backdrop-blur-sm"
          >
            ⬆️
          </button>
          <div></div>
          <button
            onTouchStart={() => handleDirectionButton('LEFT')}
            onClick={() => handleDirectionButton('LEFT')}
            className="bg-white/20 hover:bg-white/30 active:bg-white/40 text-white rounded-lg p-3 text-xl flex items-center justify-center backdrop-blur-sm"
          >
            ⬅️
          </button>
          <button
            onTouchStart={() => handleDirectionButton('DOWN')}
            onClick={() => handleDirectionButton('DOWN')}
            className="bg-white/20 hover:bg-white/30 active:bg-white/40 text-white rounded-lg p-3 text-xl flex items-center justify-center backdrop-blur-sm"
          >
            ⬇️
          </button>
          <button
            onTouchStart={() => handleDirectionButton('RIGHT')}
            onClick={() => handleDirectionButton('RIGHT')}
            className="bg-white/20 hover:bg-white/30 active:bg-white/40 text-white rounded-lg p-3 text-xl flex items-center justify-center backdrop-blur-sm"
          >
            ➡️
          </button>
        </div>
        <div className="flex justify-center mt-3 gap-3">
          <button
            onClick={() => {
              if (!gameStarted || gameOver) resetGame();
              else setIsPaused(prev => !prev);
            }}
            className="bg-white/20 hover:bg-white/30 text-white rounded-lg px-4 py-2 text-sm backdrop-blur-sm"
          >
            {gameOver || !gameStarted ? '🔄 Reiniciar' : isPaused ? '▶️ Continuar' : '⏸️ Pausar'}
          </button>
        </div>
      </div>

      {/* Desktop Controls Info */}
      <div className="hidden md:flex mt-4 gap-4 text-sky-200 text-sm">
        <span className="bg-black/20 px-3 py-1 rounded">⬆️⬇️⬅️➡️ ou WASD: Mover</span>
        <span className="bg-black/20 px-3 py-1 rounded">P: Pausar</span>
        <span className="bg-black/20 px-3 py-1 rounded">Espaço: Iniciar/Reiniciar</span>
      </div>

      {/* Footer */}
      <div className="mt-4 text-sky-400/60 text-xs text-center">
        <p>🚂 A locomotiva puxa os vagões! Colete ⛽ combustível para crescer!</p>
      </div>
    </div>
  );
}

export default App;
