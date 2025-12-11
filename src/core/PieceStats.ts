/**
 * PieceStats.ts
 * Defines the statistics for each piece type
 * These are the core attributes that determine piece behavior
 */

export enum PieceType {
  PAWN = 'pawn',
  KNIGHT = 'knight',
  BISHOP = 'bishop',
  ROOK = 'rook',
  QUEEN = 'queen',
  KING = 'king'
}

export enum PieceColor {
  WHITE = 'white',
  BLACK = 'black'
}

export interface PieceStats {
  hp: number;
  maxHP: number;
  atk: number;
  def: number;
  rng: number; // Attack range
}

/**
 * Default stats for each piece type
 * HP: Health Points
 * ATK: Attack damage
 * DEF: Defense (reduces incoming damage)
 * RNG: Attack range in squares
 */
export const DEFAULT_STATS: Record<PieceType, Omit<PieceStats, 'hp' | 'maxHP'>> = {
  [PieceType.PAWN]: { atk: 5, def: 1, rng: 1 },
  [PieceType.KNIGHT]: { atk: 15, def: 5, rng: 1 },
  [PieceType.BISHOP]: { atk: 12, def: 3, rng: 3 },
  [PieceType.ROOK]: { atk: 18, def: 8, rng: 1 },
  [PieceType.QUEEN]: { atk: 25, def: 10, rng: 3 },
  [PieceType.KING]: { atk: 10, def: 10, rng: 1 }
};

export const PIECE_MAX_HP: Record<PieceType, number> = {
  [PieceType.PAWN]: 20,
  [PieceType.KNIGHT]: 35,
  [PieceType.BISHOP]: 30,
  [PieceType.ROOK]: 45,
  [PieceType.QUEEN]: 60,
  [PieceType.KING]: 50
};

/**
 * Get the starting stats for a piece
 */
export function getStartingStats(pieceType: PieceType): PieceStats {
  const maxHP = PIECE_MAX_HP[pieceType];
  const baseStats = DEFAULT_STATS[pieceType];
  return {
    ...baseStats,
    hp: maxHP,
    maxHP
  };
}
