/**
 * AI.ts
 * Simple AI opponent for single-player mode
 * Uses a minimax-like approach with move scoring
 */

import { Piece } from './Piece';
import { Board } from './Board';
import { PieceColor } from './PieceStats';
import { getValidMoves, ValidMove } from './MoveValidator';
import { resolveCombat } from './CombatSystem';

export interface ScoredMove {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  score: number;
}

/**
 * AI logic: evaluate all possible moves and pick the best one
 */
export class AI {
  /**
   * Choose the best move for the given color
   */
  static chooseMove(board: Board, color: PieceColor): ScoredMove | null {
    const pieces = board.getPiecesByColor(color);
    const allMoves: ScoredMove[] = [];

    // Generate all possible moves for this color
    for (const piece of pieces) {
      if (!piece.isAlive()) continue;

      const validMoves = getValidMoves(piece, board.squares);
      
      for (const move of validMoves) {
        const score = this.evaluateMove(piece, move, board);
        allMoves.push({
          fromX: piece.x,
          fromY: piece.y,
          toX: move.x,
          toY: move.y,
          score
        });
      }
    }

    // Return the move with highest score
    if (allMoves.length === 0) return null;
    return allMoves.reduce((best, current) => current.score > best.score ? current : best);
  }

  /**
   * Evaluate a single move
   * Higher score = better move
   */
  private static evaluateMove(piece: Piece, move: ValidMove, board: Board): number {
    // Clone board for simulation
    const testBoard = board.clone();
    const testPiece = testBoard.getPieceAt(piece.x, piece.y)!;
    const targetPiece = testBoard.getPieceAt(move.x, move.y);

    // Move the piece
    testBoard.movePiece(testPiece.x, testPiece.y, move.x, move.y);

    let score = 0;

    if (move.isAttack && targetPiece) {
      // Combat happens
      const combatResult = resolveCombat(testPiece, targetPiece);

      // Reward dealing damage
      score += combatResult.attackDamage * 2;

      // Penalty for taking counter-damage
      score -= combatResult.defenderCounterDamage;

      // Big bonus for killing a piece
      if (!combatResult.defenderAlive) {
        score += 100;
        // Extra bonus for high-value pieces
        switch (targetPiece.type) {
          case 'queen':
            score += 200;
            break;
          case 'rook':
            score += 150;
            break;
          case 'bishop':
          case 'knight':
            score += 100;
            break;
          case 'king':
            score += 1000; // Winning move!
            break;
        }
      }
    } else {
      // Non-attacking move: position matters
      // Prefer moves toward enemy pieces
      const enemyPieces = testBoard.getPiecesByColor(piece.color === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE);
      if (enemyPieces.length > 0) {
        const closestEnemy = enemyPieces.reduce((closest, current) => {
          const currentDist = Math.abs(current.x - move.x) + Math.abs(current.y - move.y);
          const closestDist = Math.abs(closest.x - move.x) + Math.abs(closest.y - move.y);
          return currentDist < closestDist ? current : closest;
        });

        const distance = Math.abs(closestEnemy.x - move.x) + Math.abs(closestEnemy.y - move.y);
        score += (7 - distance) * 5; // Closer is better
      }

      // Slight penalty for moving far from own pieces
      const ownPieces = testBoard.getPiecesByColor(piece.color);
      const avgDistance = ownPieces.reduce((sum, p) => sum + (Math.abs(p.x - move.x) + Math.abs(p.y - move.y)), 0) / Math.max(ownPieces.length, 1);
      score -= avgDistance * 0.5;
    }

    // Avoid suicide moves: penalty if this move exposes piece to immediate danger
    if (this.isExposedToAttack(testPiece, testBoard)) {
      score -= 50;
    }

    return score;
  }

  /**
   * Check if a piece is exposed to enemy attack
   */
  private static isExposedToAttack(piece: Piece, board: Board): boolean {
    const enemyColor = piece.color === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;
    const enemyPieces = board.getPiecesByColor(enemyColor);

    for (const enemy of enemyPieces) {
      if (!enemy.isAlive()) continue;
      const validMoves = getValidMoves(enemy, board.squares);
      if (validMoves.some(m => m.x === piece.x && m.y === piece.y)) {
        return true;
      }
    }

    return false;
  }
}
