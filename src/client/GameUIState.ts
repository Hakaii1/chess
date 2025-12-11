/**
 * GameUIState.ts
 * React state wrapper around the GameEngine
 * Bridges the game logic with React components
 */

import { useCallback, useEffect, useState } from 'react';
import { GameEngine, PieceColor, ValidMove, Piece } from '../core';

/**
 * Custom hook to manage game state
 */
export function useGameEngine(gameMode: 'single-player' | 'multiplayer' = 'single-player') {
  const [engine] = useState(() => new GameEngine(gameMode));
  const [gameState, setGameState] = useState({
    boardState: engine.getBoardState(),
    currentTurn: engine.getCurrentTurn(),
    selectedPiece: engine.getSelectedPiece(),
    validMoves: engine.getValidMoves(),
    combatLog: engine.getCombatLog(),
    gameStatus: engine.getGameStatus(),
    turnCount: engine.getTurnCount(),
    winner: engine.getWinner()
  });

  // Update UI when game state changes
  const updateGameState = useCallback(() => {
    setGameState({
      boardState: engine.getBoardState(),
      currentTurn: engine.getCurrentTurn(),
      selectedPiece: engine.getSelectedPiece(),
      validMoves: engine.getValidMoves(),
      combatLog: engine.getCombatLog(),
      gameStatus: engine.getGameStatus(),
      turnCount: engine.getTurnCount(),
      winner: engine.getWinner()
    });
  }, [engine]);

  const handleSelectPiece = useCallback((x: number, y: number) => {
    engine.selectPiece(x, y);
    updateGameState();
  }, [engine, updateGameState]);

  const handleDeselectPiece = useCallback(() => {
    engine.deselectPiece();
    updateGameState();
  }, [engine, updateGameState]);

  const handleExecuteMove = useCallback((toX: number, toY: number) => {
    const success = engine.executeMove(toX, toY);
    if (success) {
      updateGameState();
    }
    return success;
  }, [engine, updateGameState]);

  const handleResetGame = useCallback(() => {
    engine.resetGame();
    updateGameState();
  }, [engine, updateGameState]);

  // Trigger update when AI is thinking (for UI feedback)
  useEffect(() => {
    const aiCheckInterval = setInterval(() => {
      if (gameState.gameStatus === 'in-progress') {
        updateGameState();
      }
    }, 500);

    return () => clearInterval(aiCheckInterval);
  }, [gameState.gameStatus, updateGameState]);

  return {
    engine,
    gameState,
    selectPiece: handleSelectPiece,
    deselectPiece: handleDeselectPiece,
    executeMove: handleExecuteMove,
    resetGame: handleResetGame,
    isAIThinking: engine.isAIThinking()
  };
}
