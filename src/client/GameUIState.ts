/**
 * GameUIState.ts
 * React state wrapper updated for Rescue Mechanics
 */

import { useCallback, useEffect, useState } from 'react';
import { GameEngine } from '../core';

export function useGameEngine(gameMode: any = 'single-player') {
  const actualGameMode = gameMode || 'single-player';
  const [engine, setEngine] = useState(() => new GameEngine(actualGameMode));

  const [gameState, setGameState] = useState(() => ({
    boardState: engine.getBoardState(),
    terrain: engine.getBoard().terrain,
    currentTurn: engine.getCurrentTurn(),
    selectedPiece: engine.getSelectedPiece(),
    validMoves: engine.getValidMoves(),
    combatLog: engine.getCombatLog(),
    gameStatus: engine.getGameStatus(),
    turnCount: engine.getTurnCount(),
    winner: engine.getWinner(),
    lastMove: null as any,
    isAIThinking: engine.isAIThinking(),
    // New State Fields
    isKingRescue: engine.getGameStatus() === 'king-rescue',
    activeAbility: engine.getActiveAbility(),
    moveHistory: engine.getMoveHistory()
  }));

  const updateGameState = useCallback(() => {
    const history = engine.getMoveHistory();
    const lastMove = history.length > 0 ? history[history.length - 1] : null;

    setGameState({
      boardState: engine.getBoardState(),
      terrain: engine.getBoard().terrain,
      currentTurn: engine.getCurrentTurn(),
      selectedPiece: engine.getSelectedPiece(),
      validMoves: engine.getValidMoves(),
      combatLog: engine.getCombatLog(),
      gameStatus: engine.getGameStatus(),
      turnCount: engine.getTurnCount(),
      winner: engine.getWinner(),
      lastMove,
      isAIThinking: engine.isAIThinking(),
      isKingRescue: engine.getGameStatus() === 'king-rescue',
      activeAbility: engine.getActiveAbility(),
      moveHistory: history
    });
  }, [engine]);

  useEffect(() => {
    const newEngine = new GameEngine(actualGameMode);
    setEngine(newEngine);
    updateGameState();
  }, [actualGameMode]);

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
      setTimeout(() => updateGameState(), 0);
      if (engine.isAIThinking()) {
        setTimeout(() => updateGameState(), 1200);
      }
    }
    return success;
  }, [engine, updateGameState]);

  // New Handlers for Rescue
  const handleRescueAbility = useCallback((type: 'teleport' | 'swap') => {
    engine.activateKingAbility(type);
    updateGameState();
  }, [engine, updateGameState]);

  const handleRescueAction = useCallback((x: number, y: number) => {
    const success = engine.executeKingAbilityAction(x, y);
    if (success) updateGameState();
    return success;
  }, [engine, updateGameState]);

  const handleResetGame = useCallback(() => {
    engine.resetGame();
    updateGameState();
  }, [engine, updateGameState]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Periodic update to catch AI moves or state changes
      if (engine.isAIThinking() !== gameState.isAIThinking || engine.getTurnCount() !== gameState.turnCount || engine.getGameStatus() !== gameState.gameStatus) {
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
    isAIThinking: gameState.isAIThinking,
    activateRescue: handleRescueAbility,
    executeRescue: handleRescueAction
  };
}