/**
 * App.tsx
 * Main React component - ties everything together
 */

import React, { useEffect, useState } from 'react';
import { ChessboardCanvas } from './ChessboardCanvas';
import { Sidebar } from './Sidebar';
import { CombatLog } from './CombatLog';
import { BattleScene } from './BattleScene';
import { GameModeSelector } from './GameModeSelector';
import { useGameEngine } from './GameUIState';
import { PieceColor, CombatResult } from '../core';
import styles from './App.module.css';

export const App: React.FC = () => {
  const [gameMode, setGameMode] = useState<'single-player' | 'two-player' | null>(null);
  const [boardFlipped, setBoardFlipped] = useState(false);

  const {
    gameState,
    selectPiece,
    deselectPiece,
    executeMove,
    resetGame,
    isAIThinking,
    engine
  } = useGameEngine(gameMode);

  const [activeBattle, setActiveBattle] = useState<CombatResult | null>(null);

  // Watch for new combat events in the game state
  useEffect(() => {
    if (gameState.lastMove && gameState.lastMove.combatResult) {
      // Trigger battle scene
      setActiveBattle(gameState.lastMove.combatResult);
    }
  }, [gameState.lastMove]);

  // Auto-flip board for two-player after each turn
  useEffect(() => {
    if (gameMode === 'two-player' && gameState.gameStatus === 'in-progress') {
      // Flip board when it's the other player's turn
      setBoardFlipped(gameState.currentTurn === PieceColor.BLACK);
    }
  }, [gameState.currentTurn, gameMode, gameState.gameStatus]);

  const handleSquareClick = (x: number, y: number) => {
    // Disable interaction during AI turn, Game Over, or Active Battle Animation
    if (isAIThinking || gameState.gameStatus === 'game-over' || activeBattle) {
      return;
    }

    if (gameState.selectedPiece) {
      const isValidMove = (gameState.validMoves || []).some((m: any) => m.x === x && m.y === y);
      if (isValidMove) {
        executeMove(x, y);
        return;
      } else if (gameState.selectedPiece.x === x && gameState.selectedPiece.y === y) {
        // Clicking on selected piece deselects it
        deselectPiece();
        return;
      } else {
        // Clicking on a different piece - select it instead
        selectPiece(x, y);
        return;
      }
    }

    // Always try to select the clicked piece (even if something was previously selected)
    selectPiece(x, y);
  };

  const handleBattleComplete = () => {
    setActiveBattle(null);
  };

  const handleGameModeSelect = (mode: 'single-player' | 'two-player') => {
    setGameMode(mode);
    setBoardFlipped(false);
  };

  const handleResetGame = () => {
    resetGame();
    setBoardFlipped(false);
  };

  // Show mode selector if mode not yet chosen
  if (!gameMode) {
    return <GameModeSelector onSelectMode={handleGameModeSelect} />;
  }

  return (
    <div className={styles.container}>
      {/* 1v1 Battle Overlay */}
      {activeBattle && (
        <BattleScene 
          combatResult={activeBattle} 
          onComplete={handleBattleComplete} 
        />
      )}

      <div className={styles.mainContent}>
        <ChessboardCanvas
          boardState={gameState.boardState}
          selectedPiece={gameState.selectedPiece}
          validMoves={gameState.validMoves}
          onSquareClick={handleSquareClick}
          isAIThinking={isAIThinking}
          lastMove={gameState.lastMove}
          boardFlipped={boardFlipped}
          gameMode={gameMode}
          currentTurn={gameState.currentTurn}
        />
        
        {/* Game Over Overlay */}
        {gameState.gameStatus === 'game-over' && !activeBattle && (
          <div className={styles.overlay}>
            <h1 className={styles.overlayTitle}>Victory!</h1>
            <p className={styles.overlaySubtitle}>
              {gameState.winner === PieceColor.WHITE ? 'White' : 'Black'} Dominates the Board
            </p>
            <button className={styles.overlayButton} onClick={handleResetGame}>
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
        onResetGame={handleResetGame}
        boardState={gameState.boardState}
        gameMode={gameMode}
        boardFlipped={boardFlipped}
      />
    </div>
  );
};

export default App;