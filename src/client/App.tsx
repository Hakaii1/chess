/**
 * App.tsx
 * Main React component - Revamped for Arena UI
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

  useEffect(() => {
    if (gameState.lastMove && gameState.lastMove.combatResult) {
      setActiveBattle(gameState.lastMove.combatResult);
    }
  }, [gameState.lastMove]);

  useEffect(() => {
    if (gameMode === 'two-player' && gameState.gameStatus === 'in-progress') {
      setBoardFlipped(gameState.currentTurn === PieceColor.BLACK);
    }
  }, [gameState.currentTurn, gameMode, gameState.gameStatus]);

  const handleSquareClick = (x: number, y: number) => {
    if (isAIThinking || gameState.gameStatus === 'game-over' || activeBattle) {
      return;
    }

    if (gameState.selectedPiece) {
      const isValidMove = (gameState.validMoves || []).some((m: any) => m.x === x && m.y === y);
      if (isValidMove) {
        executeMove(x, y);
        return;
      } else if (gameState.selectedPiece.x === x && gameState.selectedPiece.y === y) {
        deselectPiece();
        return;
      } else {
        selectPiece(x, y);
        return;
      }
    }
    selectPiece(x, y);
  };

  const handleBattleComplete = () => {
    setActiveBattle(null);
  };

  const handleResetGame = () => {
    resetGame();
    setBoardFlipped(false);
  };

  if (!gameMode) {
    return <GameModeSelector onSelectMode={(mode) => { setGameMode(mode); setBoardFlipped(false); }} />;
  }

  return (
    <div className={styles.gameLayout}>
      {/* Background Ambience */}
      <div className={styles.ambientLight}></div>

      {activeBattle && (
        <BattleScene 
          combatResult={activeBattle} 
          onComplete={handleBattleComplete} 
        />
      )}

      {/* Top HUD: Health Bars & Score */}
      <div className={styles.topHud}>
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

      {/* Main Arena Area */}
      <div className={styles.arenaContainer}>
        <div className={styles.boardWrapper}>
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
        </div>
      </div>

      {/* Bottom Terminal: Logs */}
      <div className={styles.bottomHud}>
        <CombatLog logs={gameState.combatLog} />
      </div>

      {/* Victory Overlay */}
      {gameState.gameStatus === 'game-over' && !activeBattle && (
        <div className={styles.victoryOverlay}>
          <div className={styles.victoryCard}>
            <h1 className={styles.victoryTitle}>VICTORY</h1>
            <p className={styles.victorySubtitle}>
              {gameState.winner === PieceColor.WHITE ? 'White Legion' : 'Black Army'} Prevails
            </p>
            <button className={styles.victoryButton} onClick={handleResetGame}>
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;