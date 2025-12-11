/**
 * CombatSystem.ts
 * Handles Combat + Class Advantages + Terrain Effects
 */

import { Piece } from './Piece';
import { PieceType, PieceClass } from './PieceStats';
import { Board, TileType } from './Board';

export interface CombatResult {
  attacker: Piece;
  defender: Piece;
  attackDamage: number;
  defenderCounterDamage: number;
  defenderAlive: boolean;
  log: string[];
}

/**
 * Calculate damage with Class Advantages and Terrain
 */
function calculateDamage(attacker: Piece, defender: Piece, board?: Board): number {
  let damage = attacker.stats.atk;
  
  // 1. Terrain Defense Bonus (Forest)
  let defenderDef = defender.stats.def;
  if (board) {
    const tile = board.getTileType(defender.x, defender.y);
    if (tile === TileType.FOREST) {
      defenderDef += 3; // Forest Bonus
    }
  }

  // 2. Class Advantages
  // Ranged > Tank (Kiting)
  if (attacker.stats.pClass === PieceClass.RANGED && defender.stats.pClass === PieceClass.TANK) {
    damage = Math.floor(damage * 1.3);
  }
  // Tank > Melee (Outlast)
  else if (attacker.stats.pClass === PieceClass.TANK && defender.stats.pClass === PieceClass.MELEE) {
    damage = Math.floor(damage * 1.3);
  }
  // Melee > Ranged (Gap Close)
  else if (attacker.stats.pClass === PieceClass.MELEE && defender.stats.pClass === PieceClass.RANGED) {
    damage = Math.floor(damage * 1.3);
  }
  
  // 3. Range Penalty for Ranged units shooting far
  const distance = Math.max(Math.abs(attacker.x - defender.x), Math.abs(attacker.y - defender.y));
  if (distance > 1) {
    damage = Math.floor(damage * 0.8); // 20% penalty at max range
  }

  return Math.max(damage - defenderDef, 1); // Minimum 1 damage
}

export function resolveCombat(attacker: Piece, defender: Piece, board?: Board): CombatResult {
  const log: string[] = [];
  
  const attackDamage = calculateDamage(attacker, defender, board);
  defender.takeDamage(attackDamage);
  
  // Log Class Matchups
  let bonusTxt = "";
  if (attacker.stats.pClass === PieceClass.RANGED && defender.stats.pClass === PieceClass.TANK) bonusTxt = " (Crit vs Tank!)";
  if (attacker.stats.pClass === PieceClass.TANK && defender.stats.pClass === PieceClass.MELEE) bonusTxt = " (Crit vs Melee!)";
  if (attacker.stats.pClass === PieceClass.MELEE && defender.stats.pClass === PieceClass.RANGED) bonusTxt = " (Crit vs Ranged!)";

  log.push(`${attacker.type} attacks ${defender.type} for ${attackDamage}${bonusTxt}`);

  let counterDamage = 0;
  const dist = Math.max(Math.abs(attacker.x - defender.x), Math.abs(attacker.y - defender.y));

  if (defender.isAlive()) {
    if (dist <= defender.stats.rng) {
      counterDamage = calculateDamage(defender, attacker, board);
      attacker.takeDamage(counterDamage);
      log.push(`${defender.type} counters for ${counterDamage}`);
    } else {
      log.push(`${defender.type} out of range to counter!`);
    }
  } else {
    log.push(`${defender.type} is defeated!`);
  }

  return {
    attacker, defender, attackDamage, defenderCounterDamage: counterDamage, defenderAlive: defender.isAlive(), log
  };
}

/**
 * Apply Tile Effects (Fire/Water) at end of turn
 */
export function applyEnvironmentalEffects(pieces: Piece[], board: Board): string[] {
  const log: string[] = [];

  pieces.forEach(p => {
    const tile = board.getTileType(p.x, p.y);
    
    if (tile === TileType.FIRE) {
      p.takeDamage(10);
      log.push(`🔥 ${p.type} took 10 FIRE damage!`);
    }
    else if (tile === TileType.WATER) {
      if (p.stats.hp < p.stats.maxHP) {
        p.heal(5);
        log.push(`💧 ${p.type} healed 5 HP in Water.`);
      }
    }
  });

  return log;
}

export function applySpecialAbilities(piece: Piece, allPieces: Piece[]): string[] {
  const log: string[] = [];
  if (piece.type === PieceType.KING) {
    const allies = allPieces.filter(p => p.color === piece.color && p.id !== piece.id && Math.abs(p.x - piece.x) <= 1 && Math.abs(p.y - piece.y) <= 1);
    if (allies.length > 0) {
      allies.forEach(a => a.heal(5));
      log.push(`👑 King inspires allies (+5 HP)`);
    }
  }
  return log;
}