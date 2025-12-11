/**
 * MoveValidator.ts
 * Determines valid moves for each piece type
 * Handles movement patterns and captures
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
 */
export function getValidMoves(piece: Piece, board: (Piece | null)[][]): ValidMove[] {
  const moves: ValidMove[] = [];
  const potentialMoves = getPotentialMoves(piece);

  for (const move of potentialMoves) {
    // Check bounds
    if (move.x < 0 || move.x >= 8 || move.y < 0 || move.y >= 8) {
      continue;
    }

    const targetSquare = board[move.y][move.x];

    // Empty square - valid move
    if (!targetSquare) {
      moves.push({ ...move, isAttack: false });
      continue;
    }

    // Enemy piece - valid attack
    if (targetSquare.color !== piece.color) {
      moves.push({ ...move, isAttack: true });
      continue;
    }

    // Friendly piece - cannot move there
  }

  return moves;
}

/**
 * Get potential moves without checking board state
 * Movement patterns are defined per piece type
 */
function getPotentialMoves(piece: Piece): Position[] {
  const moves: Position[] = [];
  const x = piece.x;
  const y = piece.y;

  switch (piece.type) {
    case PieceType.PAWN:
      return getPawnMoves(piece);
    
    case PieceType.KNIGHT:
      return getKnightMoves(x, y);
    
    case PieceType.BISHOP:
      return getBishopMoves(x, y);
    
    case PieceType.ROOK:
      return getRookMoves(x, y);
    
    case PieceType.QUEEN:
      return getQueenMoves(x, y);
    
    case PieceType.KING:
      return getKingMoves(x, y);
    
    default:
      return [];
  }
}

function getPawnMoves(piece: Piece): Position[] {
  const moves: Position[] = [];
  const x = piece.x;
  const y = piece.y;
  const direction = piece.color === PieceColor.WHITE ? -1 : 1; // White moves up (negative y), Black moves down

  // Forward move only (no capture logic, handled in getValidMoves)
  moves.push({ x, y: y + direction });

  // Double move from starting position
  const startingRow = piece.color === PieceColor.WHITE ? 6 : 1;
  if (y === startingRow) {
    moves.push({ x, y: y + 2 * direction });
  }

  // Diagonal captures
  moves.push({ x: x - 1, y: y + direction });
  moves.push({ x: x + 1, y: y + direction });

  return moves;
}

function getKnightMoves(x: number, y: number): Position[] {
  const moves: Position[] = [];
  const offsets = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ];

  for (const [dx, dy] of offsets) {
    moves.push({ x: x + dx, y: y + dy });
  }

  return moves;
}

function getBishopMoves(x: number, y: number): Position[] {
  return getDiagonalMoves(x, y, 7); // Full board range
}

function getRookMoves(x: number, y: number): Position[] {
  const moves: Position[] = [];

  // Horizontal and vertical lines
  for (let i = 0; i < 8; i++) {
    if (i !== x) moves.push({ x: i, y });
    if (i !== y) moves.push({ x, y: i });
  }

  return moves;
}

function getQueenMoves(x: number, y: number): Position[] {
  // Queen = Rook + Bishop
  return [...getRookMoves(x, y), ...getDiagonalMoves(x, y, 7)];
}

function getKingMoves(x: number, y: number): Position[] {
  const moves: Position[] = [];

  // One square in any direction
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      moves.push({ x: x + dx, y: y + dy });
    }
  }

  return moves;
}

function getDiagonalMoves(x: number, y: number, maxRange: number): Position[] {
  const moves: Position[] = [];
  const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

  for (const [dx, dy] of directions) {
    for (let i = 1; i <= maxRange; i++) {
      moves.push({ x: x + dx * i, y: y + dy * i });
    }
  }

  return moves;
}
