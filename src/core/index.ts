/**
 * index.ts
 * Core game engine exports
 */

export { GameEngine } from './GameEngine';
export type { GameMode, GameStatus } from './GameEngine';
export { Board } from './Board';
export { Piece } from './Piece';
export type { PieceStats } from './PieceStats';
export { PieceType, PieceColor, PieceClass, getStartingStats } from './PieceStats';
export type { CombatResult } from './CombatSystem';
export { resolveCombat, applySpecialAbilities } from './CombatSystem';
export { getValidMoves } from './MoveValidator';
export type { ValidMove, Position } from './MoveValidator';
export { AI } from './AI';
export type { ScoredMove } from './AI';