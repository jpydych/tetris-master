import React, { useState, useEffect, useCallback } from 'react';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const SHAPES = [
  [[1, 1, 1, 1]], // I
  [[1, 1], [1, 1]], // O
  [[1, 1, 1], [0, 1, 0]], // T
  [[1, 1, 1], [1, 0, 0]], // L
  //[[1, 1, 1], [0, 0, 1]], // J
  [[1, 1, 0], [0, 1, 1]], // S
  //[[0, 1, 1], [1, 1, 0]], // Z
];

const COLORS = ['#00f0f0', '#f0f000', '#a000f0', '#f0a000', '#0000f0', '#00f000', '#f00000'];

const POINTS_TABLE = {
  1: 10,
  2: 30,
  3: 50,
  4: 80
};

const TetrisGame = () => {
  const [board, setBoard] = useState(Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0)));
  const [currentPiece, setCurrentPiece] = useState(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  const resetGame = useCallback(() => {
    setBoard(Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0)));
    setCurrentPiece(null);
    setPosition({ x: 0, y: 0 });
    setGameOver(false);
    setScore(0);
  }, []);

  const createNewPiece = useCallback(() => {
    const shapeIndex = Math.floor(Math.random() * SHAPES.length);
    return {
      shape: SHAPES[shapeIndex],
      color: COLORS[shapeIndex],
    };
  }, []);

  const isCollision = useCallback((piece, pos) => {
    if (!piece) return false;
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = pos.x + x;
          const newY = pos.y + y;
          if (
              newX < 0 ||
              newX >= BOARD_WIDTH ||
              newY >= BOARD_HEIGHT ||
              (newY >= 0 && board[newY][newX])
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }, [board]);

  const checkGameOver = useCallback((piece, pos) => {
    // Check if the new piece collides at starting position
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newY = pos.y + y;
          if (board[newY][pos.x + x]) {
            return true;
          }
        }
      }
    }
    return false;
  }, [board]);

  const rotatePiece = useCallback(() => {
    if (!currentPiece) return;
    const newShape = currentPiece.shape[0].map((_, i) =>
        currentPiece.shape.map(row => row[i]).reverse()
    );
    const newPiece = { ...currentPiece, shape: newShape };
    if (!isCollision(newPiece, position)) {
      setCurrentPiece(newPiece);
    }
  }, [currentPiece, position, isCollision]);

  const mirrorPiece = useCallback(() => {
    if (!currentPiece) return;
    const newShape = currentPiece.shape.map((row) => row.reverse());
    const newPiece = { ...currentPiece, shape: newShape };
    if (!isCollision(newPiece, position)) {
      setCurrentPiece(newPiece);
    }
  }, [currentPiece, position, isCollision]);

  const movePiece = useCallback((dx, dy) => {
    const newPos = { x: position.x + dx, y: position.y + dy };
    if (!isCollision(currentPiece, newPos)) {
      setPosition(newPos);
      return true;
    }
    return false;
  }, [currentPiece, position, isCollision]);

  const mergePiece = useCallback(() => {
    if (!currentPiece) return;
    const newBoard = board.map(row => [...row]);

    // Merge piece into board
    for (let y = 0; y < currentPiece.shape.length; y++) {
      for (let x = 0; x < currentPiece.shape[y].length; x++) {
        if (currentPiece.shape[y][x]) {
          const boardY = position.y + y;
          if (boardY >= 0) {  // Only merge if within board
            newBoard[boardY][position.x + x] = currentPiece.color;
          }
        }
      }
    }
    setBoard(newBoard);

    // Check for completed lines
    let clearedLines = 0;
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (newBoard[y].every(cell => cell !== 0)) {
        newBoard.splice(y, 1);
        newBoard.unshift(Array(BOARD_WIDTH).fill(0));
        clearedLines++;
        y++;
      }
    }

    if (clearedLines > 0) {
      setScore(prev => prev + (POINTS_TABLE[clearedLines] || 0));
    }

    // Create new piece and check for game over
    const newPiece = createNewPiece();
    const newPosition = { x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 };

    if (checkGameOver(newPiece, newPosition)) {
      setGameOver(true);
      return;
    }

    setCurrentPiece(newPiece);
    setPosition(newPosition);
  }, [board, currentPiece, position, createNewPiece, checkGameOver]);

  useEffect(() => {
    if (gameOver) return;
    if (!currentPiece) {
      const newPiece = createNewPiece();
      const newPosition = { x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 };

      if (checkGameOver(newPiece, newPosition)) {
        setGameOver(true);
        return;
      }

      setCurrentPiece(newPiece);
      setPosition(newPosition);
      return;
    }

    const interval = setInterval(() => {
      if (!movePiece(0, 1)) {
        mergePiece();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentPiece, gameOver, movePiece, mergePiece, createNewPiece, checkGameOver]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (gameOver) {
        if (e.key === 'Enter') {
          resetGame();
        }
        return;
      }
      switch (e.key) {
        case 'ArrowLeft':
          movePiece(-1, 0);
          break;
        case 'ArrowRight':
          movePiece(1, 0);
          break;
        case 'ArrowDown':
          movePiece(0, 1);
          break;
        case 'ArrowUp':
          rotatePiece();
          break;
        case ' ': // Space
          mirrorPiece();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameOver, movePiece, rotatePiece, mirrorPiece, resetGame]);

  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);
    if (currentPiece) {
      currentPiece.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell && position.y + y >= 0) {
            displayBoard[position.y + y][position.x + x] = currentPiece.color;
          }
        });
      });
    }

    return displayBoard.map((row, y) => (
        <div key={y} className="flex">
          {row.map((cell, x) => (
              <div
                  key={`${x}-${y}`}
                  className="w-6 h-6 border border-gray"
                  style={{ backgroundColor: cell || '#1a1a1a' }}
              />
          ))}
        </div>
    ));
  };

  return <div className="flex flex-col items-center gap-4 p-4">
    <div className="text-xl font-bold position-absolute left-4 top-4" id="score-counter">Score: {score}</div>
    <div className="border-4 border-gray bg-gray p-2">
      {renderBoard()}
    </div>
    {gameOver && (
        <div className="flex flex-col items-center gap-2">
          <div className="text-xl font-bold text-red-500">Game Over!</div>
          <button
              onClick={resetGame}
              className="px-4 py-2 bg-blue text-white rounded border-none"
          >
            Reset Game (or press Enter)
          </button>
        </div>
    )}
  </div>
};

export default TetrisGame;