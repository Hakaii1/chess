/**
 * MoveValidator.ts
 * Determines valid moves for each piece type
 * NOW INCLUDES: Check validation logic
 */

import { Piece } from './Piece';
import { PieceColor, PieceType } from './PieceStats';

export interface Position {
  x: number;
  y: number;
}

export interface ValidMove extends Position {
  isAttack: boolean;
}

/**
 * Get all STRICTLY LEGAL moves (handles Check rules)
 */
export function getValidMoves(piece: Piece, board: (Piece | null)[][]): ValidMove[] {
  // 1. Get all physically possible moves (ignoring check)
  const potentialMoves = getPotentialMoves(piece, board);
  
  // 2. Filter out moves that leave the King in check
  return potentialMoves.filter(move => {
    // Create a temporary board simulation
    const tempBoard = simulateMove(board, piece, move);
    
    // Check if the King is safe in this new state
    return !isKingInCheck(piece.color, tempBoard);
  });
}

/**
 * Helper: Check if a specific position is under attack by enemy pieces
 */
function isPositionUnderAttack(color: PieceColor, y: number, x: number, board: (Piece | null)[][]): boolean {
  const enemyColor = color === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;

  for (let checkY = 0; checkY < 8; checkY++) {
    for (let checkX = 0; checkX < 8; checkX++) {
      const piece = board[checkY][checkX];
      if (piece && piece.color === enemyColor && piece.isAlive()) {
        const moves = getPotentialMoves(piece, board);
        if (moves.some(m => m.x === x && m.y === y)) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Check if the King of a specific color is under attack
 */
export function isKingInCheck(color: PieceColor, board: (Piece | null)[][]): boolean {
  // 1. Find the King
  let kingPos: Position | null = null;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const p = board[y][x];
      if (p && p.type === PieceType.KING && p.color === color) {
        kingPos = { x, y };
        break;
      }
    }
    if (kingPos) break;
  }

  if (!kingPos) return true; // King is dead/missing, technically "in check" (lost)

  // 2. Check if any enemy piece can attack the King's position
  const enemyColor = color === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const p = board[y][x];
      if (p && p.color === enemyColor && p.isAlive()) {
        const moves = getPotentialMoves(p, board);
        if (moves.some(m => m.x === kingPos!.x && m.y === kingPos!.y)) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Helper: Simulate a move on a virtual board (shallow copy structure)
 */
function simulateMove(board: (Piece | null)[][], piece: Piece, move: ValidMove): (Piece | null)[][] {
  // Clone the grid
  const newBoard = board.map(row => [...row]);
  
  // Execute move
  newBoard[piece.y][piece.x] = null; // Remove from old
  
  // Place cloned piece at new spot (preserving type/color for validation)
  const clonedPiece = piece.clone();
  clonedPiece.x = move.x;
  clonedPiece.y = move.y;
  newBoard[move.y][move.x] = clonedPiece;

  return newBoard;
}

/**
 * Get all physically possible moves (geometry + blocking only)
 * This was the original getValidMoves
 */
export function getPotentialMoves(piece: Piece, board: (Piece | null)[][]): ValidMove[] {
  const moves: ValidMove[] = [];
  const { x, y, color, type } = piece;

  const addMoveIfValid = (tx: number, ty: number): boolean => {
    if (tx < 0 || tx >= 8 || ty < 0 || ty >= 8) return false;
    const targetSquare = board[ty][tx];

    if (!targetSquare) {
      moves.push({ x: tx, y: ty, isAttack: false });
      return true;
    }
    if (targetSquare.color !== color) {
      moves.push({ x: tx, y: ty, isAttack: true });
      return false;
    }
    return false;
  };

  const castRay = (dx: number, dy: number) => {
    let currX = x + dx;
    let currY = y + dy;
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
      const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
      directions.forEach(([dx, dy]) => castRay(dx, dy));
      break;
    }

    case PieceType.ROOK: {
      const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
      directions.forEach(([dx, dy]) => castRay(dx, dy));
      break;
    }

    case PieceType.QUEEN: {
      const directions = [
        [-1, -1], [-1, 1], [1, -1], [1, 1], // Diagonals
        [0, 1], [0, -1], [1, 0], [-1, 0]    // Orthogonals
      ];
      directions.forEach(([dx, dy]) => castRay(dx, dy));
      break;
    }

    case PieceType.KING: {
      // Normal moves (1 square in any direction)
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;
          addMoveIfValid(x + dx, y + dy);
        }
      }

      // Castling logic
      const castleRow = color === PieceColor.WHITE ? 7 : 0;
      
      // King must not have moved and not be in check
      if (y === castleRow && piece.moveCount === 0 && !isKingInCheck(color, board)) {
        // Kingside castling (right)
        const rightRook = board[castleRow][7];
        if (rightRook && 
            rightRook.type === PieceType.ROOK && 
            rightRook.color === color && 
            rightRook.moveCount === 0 &&
            !board[castleRow][5] && 
            !board[castleRow][6]) {
          // Check if king and squares are not under attack
          if (!isPositionUnderAttack(color, castleRow, 5, board) &&
              !isPositionUnderAttack(color, castleRow, 6, board)) {
            moves.push({ x: 6, y: castleRow, isAttack: false });
          }
        }

        // Queenside castling (left)
        const leftRook = board[castleRow][0];
        if (leftRook && 
            leftRook.type === PieceType.ROOK && 
            leftRook.color === color && 
            leftRook.moveCount === 0 &&
            !board[castleRow][1] && 
            !board[castleRow][2] && 
            !board[castleRow][3]) {
          // Check if king and squares are not under attack
          if (!isPositionUnderAttack(color, castleRow, 2, board) &&
              !isPositionUnderAttack(color, castleRow, 3, board)) {
            moves.push({ x: 2, y: castleRow, isAttack: false });
          }
        }
      }
      break;
    }
  }

  return moves;
}