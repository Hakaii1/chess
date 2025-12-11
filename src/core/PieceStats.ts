/**
 * PieceStats.ts
 * Defines stats and CLASSES for the new balance system
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

// New: Class System
export enum PieceClass {
  MELEE = 'Melee',   // Knight, Pawn
  RANGED = 'Ranged', // Queen, Bishop
  TANK = 'Tank'      // Rook, King
}

export interface PieceStats {
  hp: number;
  maxHP: number;
  atk: number;
  def: number;
  rng: number; 
  pClass: PieceClass; // New field
}

// Stats tuned for the Class System
export const DEFAULT_STATS: Record<PieceType, Omit<PieceStats, 'hp' | 'maxHP'>> = {
  [PieceType.PAWN]:   { atk: 6,  def: 1, rng: 1, pClass: PieceClass.MELEE },
  [PieceType.KNIGHT]: { atk: 15, def: 6, rng: 1, pClass: PieceClass.MELEE },
  [PieceType.BISHOP]: { atk: 14, def: 2, rng: 3, pClass: PieceClass.RANGED },
  [PieceType.ROOK]:   { atk: 16, def: 9, rng: 1, pClass: PieceClass.TANK },
  [PieceType.QUEEN]:  { atk: 24, def: 2, rng: 3, pClass: PieceClass.RANGED },
  [PieceType.KING]:   { atk: 12, def: 5, rng: 1, pClass: PieceClass.TANK }
};

export const PIECE_MAX_HP: Record<PieceType, number> = {
  [PieceType.PAWN]: 20,
  [PieceType.KNIGHT]: 45,
  [PieceType.BISHOP]: 25,
  [PieceType.ROOK]: 55,
  [PieceType.QUEEN]: 35, // Glass Cannon
  [PieceType.KING]: 50
};

export function getStartingStats(pieceType: PieceType): PieceStats {
  const maxHP = PIECE_MAX_HP[pieceType];
  const baseStats = DEFAULT_STATS[pieceType];
  return {
    ...baseStats,
    hp: maxHP,
    maxHP
  };
}