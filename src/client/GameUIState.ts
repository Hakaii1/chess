/**
 * GameUIState.ts
 * React state wrapper around the GameEngine
 */

import { useCallback, useEffect, useState } from 'react';
import { GameEngine } from '../core';

export function useGameEngine(gameMode: any = 'single-player') {
  const actualGameMode = gameMode || 'single-player';
  const [engine, setEngine] = useState(() => new GameEngine(actualGameMode));

  const [gameState, setGameState] = useState(() => ({
    boardState: engine.getBoardState(),
    terrain: engine.getBoard().terrain, // Added terrain
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

  useEffect(() => {
    const newEngine = new GameEngine(actualGameMode);
    setEngine(newEngine);
    setGameState({
      boardState: newEngine.getBoardState(),
      terrain: newEngine.getBoard().terrain,
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
      isAIThinking: engine.isAIThinking()
    });
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
      setTimeout(() => updateGameState(), 0);
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

  useEffect(() => {
    const interval = setInterval(() => {
      const isThinking = engine.isAIThinking();
      if (isThinking !== gameState.isAIThinking || engine.getTurnCount() !== gameState.turnCount || engine.getGameStatus() !== gameState.gameStatus) {
        updateGameState();
      }
    }, 200);
    return () => clearInterval(interval);
  }, [engine, gameState.isAIThinking, gameState.turnCount, gameState.gameStatus, updateGameState]);

  return {
    engine, gameState, selectPiece: handleSelectPiece, deselectPiece: handleDeselectPiece, executeMove: handleExecuteMove, resetGame: handleResetGame, isAIThinking: gameState.isAIThinking
  };
}