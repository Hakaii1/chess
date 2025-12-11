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
export function useGameEngine(gameMode: 'single-player' | 'two-player' | 'multiplayer' | null = 'single-player') {
  // Create engine for the selected game mode
  const actualGameMode = gameMode || 'single-player';
  const [engine, setEngine] = useState(() => new GameEngine(actualGameMode));

  // Initialize game state
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

  // Recreate engine when game mode changes
  useEffect(() => {
    const newEngine = new GameEngine(actualGameMode);
    setEngine(newEngine);
    // Reset game state to match new engine
    setGameState({
      boardState: newEngine.getBoardState(),
      currentTurn: newEngine.getCurrentTurn(),
      selectedPiece: newEngine.getSelectedPiece(),
      validMoves: newEngine.getValidMoves(),
      combatLog: newEngine.getCombatLog(),
      gameStatus: newEngine.getGameStatus(),
      turnCount: newEngine.getTurnCount(),
      winner: newEngine.getWinner(),
      lastMove: null,
      isAIThinking: newEngine.isAIThinking()
    });
  }, [actualGameMode]);

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