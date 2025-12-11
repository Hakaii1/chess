/**
 * GameUIState.ts
 * React state wrapper around the GameEngine
 * Bridges the game logic with React components
 */

import { useCallback, useEffect, useState } from 'react';
import { GameEngine } from '../core';

/**
 * Custom hook to manage game state
 */
export function useGameEngine(gameMode: 'single-player' | 'multiplayer' = 'single-player') {
  const [engine] = useState(() => new GameEngine(gameMode));
  const [gameState, setGameState] = useState(() => ({
    boardState: engine.getBoardState(),
    currentTurn: engine.getCurrentTurn(),
    selectedPiece: engine.getSelectedPiece(),
    validMoves: engine.getValidMoves(),
    combatLog: engine.getCombatLog(),
    gameStatus: engine.getGameStatus(),
    turnCount: engine.getTurnCount(),
    winner: engine.getWinner(),
    lastMove: null as any,
    isAIThinking: engine.isAIThinking()
  }));

  // Update UI and other side-effects based on engine
  const updateGameState = useCallback(() => {
    const history = engine.getMoveHistory();
    const lastMove = history.length > 0 ? history[history.length - 1] : null;

    // Build next state snapshot from engine
    const nextState = {
      boardState: engine.getBoardState(),
      currentTurn: engine.getCurrentTurn(),
      selectedPiece: engine.getSelectedPiece(),
      validMoves: engine.getValidMoves(),
      combatLog: engine.getCombatLog(),
      gameStatus: engine.getGameStatus(),
      turnCount: engine.getTurnCount(),
      winner: engine.getWinner(),
      lastMove,
      isAIThinking: engine.isAIThinking()
    };

    setGameState(nextState);
  }, [engine]);

  const handleSelectPiece = useCallback((x: number, y: number) => {
    engine.selectPiece(x, y);
    setGameState(prev => ({ ...prev, selectedPiece: engine.getSelectedPiece(), validMoves: engine.getValidMoves() }));
  }, [engine]);

  const handleDeselectPiece = useCallback(() => {
    engine.deselectPiece();
    setGameState(prev => ({ ...prev, selectedPiece: null, validMoves: [] }));
  }, [engine]);

  const handleExecuteMove = useCallback((toX: number, toY: number) => {
    const success = engine.executeMove(toX, toY);
    if (success) {
      // engine may schedule AI move; give engine a tick and then sync
      setTimeout(() => updateGameState(), 0);

      // If AI will think, schedule another sync after AI completes (engine uses 1s delay)
      if (engine.isAIThinking()) {
        setTimeout(() => updateGameState(), 1200);
      }
    }
    return success;
  }, [engine, updateGameState]);

  const handleResetGame = useCallback(() => {
    engine.resetGame();
    updateGameState();
  }, [engine, updateGameState]);

  // Poll engine to keep UI in sync while AI is thinking or moves happen outside React
  useEffect(() => {
    const interval = setInterval(() => {
      // Only update if something changed to avoid excessive renders
      const isThinking = engine.isAIThinking();
      if (isThinking !== gameState.isAIThinking || engine.getTurnCount() !== gameState.turnCount || engine.getGameStatus() !== gameState.gameStatus) {
        updateGameState();
      }
    }, 200);

    return () => clearInterval(interval);
  }, [engine, gameState.isAIThinking, gameState.turnCount, gameState.gameStatus, updateGameState]);

  return {
    engine,
    gameState,
    selectPiece: handleSelectPiece,
    deselectPiece: handleDeselectPiece,
    executeMove: handleExecuteMove,
    resetGame: handleResetGame,
    // expose reactive value from state
    isAIThinking: gameState.isAIThinking
  };
}