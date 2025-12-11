/**
 * App.tsx
 * Main React component - ties everything together
 */

import React from 'react';
import { ChessboardCanvas } from './ChessboardCanvas';
import { Sidebar } from './Sidebar';
import { CombatLog } from './CombatLog';
import { useGameEngine } from './GameUIState';
import { PieceColor } from '../core';
import styles from './App.module.css';

export const App: React.FC = () => {
  const {
    gameState,
    selectPiece,
    deselectPiece,
    executeMove,
    resetGame,
    isAIThinking
  } = useGameEngine('single-player');

  const handleSquareClick = (x: number, y: number) => {
    if (isAIThinking || gameState.gameStatus === 'game-over') {
      return;
    }

    if (gameState.selectedPiece) {
      const isValidMove = (gameState.validMoves || []).some((m: any) => m.x === x && m.y === y);
      if (isValidMove) {
        executeMove(x, y);
        return;
      } else {
        deselectPiece();
      }
    }

    selectPiece(x, y);
  };

  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
        <ChessboardCanvas
          boardState={gameState.boardState}
          selectedPiece={gameState.selectedPiece}
          validMoves={gameState.validMoves}
          onSquareClick={handleSquareClick}
          isAIThinking={isAIThinking}
          lastMove={gameState.lastMove}
        />
        
        {/* Game Over Overlay */}
        {gameState.gameStatus === 'game-over' && (
          <div className={styles.overlay}>
            <h1 className={styles.overlayTitle}>Victory!</h1>
            <p className={styles.overlaySubtitle}>
              {gameState.winner === PieceColor.WHITE ? 'White' : 'Black'} Wins the Battle
            </p>
            <button className={styles.overlayButton} onClick={resetGame}>
              Play Again
            </button>
          </div>
        )}

        <CombatLog logs={gameState.combatLog} />
      </div>
      <Sidebar
        currentTurn={gameState.currentTurn}
        gameStatus={gameState.gameStatus}
        turnCount={gameState.turnCount}
        winner={gameState.winner}
        onResetGame={resetGame}
        boardState={gameState.boardState}
      />
    </div>
  );
};

export default App;