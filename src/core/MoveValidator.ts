/**
 * MoveValidator.ts
 * Determines valid moves for each piece type
 * Handles movement patterns, path blocking, and captures
 */

import { Piece } from './Piece';
import { PieceColor, PieceType } from './PieceStats';

export interface Position {
  x: number;
  y: number;
}

export interface ValidMove extends Position {
  isAttack: boolean; // true if moving to a square with enemy piece
}

/**
 * Get all valid moves for a piece on the current board
 * Checks for blocking pieces and board boundaries
 */
export function getValidMoves(piece: Piece, board: (Piece | null)[][]): ValidMove[] {
  const moves: ValidMove[] = [];
  const { x, y, color, type } = piece;

  /**
   * Helper to check a specific square and add it if valid.
   * Returns true if the path can continue (empty square), false if blocked.
   */
  const addMoveIfValid = (tx: number, ty: number): boolean => {
    // Check bounds
    if (tx < 0 || tx >= 8 || ty < 0 || ty >= 8) {
      return false;
    }

    const targetSquare = board[ty][tx];

    // Empty square - valid move, path continues
    if (!targetSquare) {
      moves.push({ x: tx, y: ty, isAttack: false });
      return true;
    }

    // Enemy piece - valid attack, but path stops here
    if (targetSquare.color !== color) {
      moves.push({ x: tx, y: ty, isAttack: true });
      return false;
    }

    // Friendly piece - blocked, path stops
    return false;
  };

  /**
   * Cast a ray in a direction for sliding pieces (Rook, Bishop, Queen)
   * Stops at the first obstacle
   */
  const castRay = (dx: number, dy: number) => {
    let currX = x + dx;
    let currY = y + dy;
    
    // Keep moving in direction until blocked or out of bounds
    while (addMoveIfValid(currX, currY)) {
      currX += dx;
      currY += dy;
    }
  };

  switch (type) {
    case PieceType.PAWN: {
      const direction = color === PieceColor.WHITE ? -1 : 1; // White moves up (-1), Black moves down (+1)
      const startRow = color === PieceColor.WHITE ? 6 : 1;

      // 1. Forward Move (1 square) - Non-capturing
      if (y + direction >= 0 && y + direction < 8) {
        if (!board[y + direction][x]) {
          moves.push({ x, y: y + direction, isAttack: false });

          // 2. Double Move (from start) - Non-capturing
          // Only allowed if 1st square was also empty
          if (y === startRow) {
             if (!board[y + 2 * direction][x]) {
               moves.push({ x, y: y + 2 * direction, isAttack: false });
             }
          }
        }
      }

      // 3. Diagonal Captures
      const captureOffsets = [[-1, direction], [1, direction]];
      for (const [dx, dy] of captureOffsets) {
        const tx = x + dx;
        const ty = y + dy;
        
        if (tx >= 0 && tx < 8 && ty >= 0 && ty < 8) {
          const target = board[ty][tx];
          if (target && target.color !== color) {
            moves.push({ x: tx, y: ty, isAttack: true });
          }
        }
      }
      break;
    }

    case PieceType.KNIGHT: {
      // Knight jumps over pieces, so we just check the destination squares
      const offsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
      ];
      
      for (const [dx, dy] of offsets) {
        addMoveIfValid(x + dx, y + dy);
      }
      break;
    }

    case PieceType.BISHOP: {
      // Diagonals
      const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
      directions.forEach(([dx, dy]) => castRay(dx, dy));
      break;
    }

    case PieceType.ROOK: {
      // Orthogonals
      const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
      directions.forEach(([dx, dy]) => castRay(dx, dy));
      break;
    }

    case PieceType.QUEEN: {
      // All 8 directions
      const directions = [
        [-1, -1], [-1, 1], [1, -1], [1, 1], // Diagonals
        [0, 1], [0, -1], [1, 0], [-1, 0]    // Orthogonals
      ];
      directions.forEach(([dx, dy]) => castRay(dx, dy));
      break;
    }

    case PieceType.KING: {
      // One step in any direction
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;
          addMoveIfValid(x + dx, y + dy);
        }
      }
      break;
    }
  }

  return moves;
}