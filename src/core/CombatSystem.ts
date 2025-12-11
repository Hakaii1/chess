/**
 * CombatSystem.ts
 * Handles all combat logic: damage calculation, counter-attacks, special abilities
 * Pure function module - no side effects on board state
 */

import { Piece } from './Piece';
import { PieceType } from './PieceStats';

export interface CombatResult {
  attacker: Piece;
  defender: Piece;
  attackDamage: number;
  defenderCounterDamage: number;
  defenderAlive: boolean;
  log: string[];
}

/**
 * Calculate damage dealt by attacker to defender
 * Formula: max(ATK - DEF, 1)
 */
function calculateDamage(attacker: Piece, defender: Piece): number {
  const baseDamage = Math.max(attacker.stats.atk - defender.stats.def, 1);
  return baseDamage;
}

/**
 * Resolve combat between attacker and defender
 * Defender counter-attacks if alive after attack
 */
export function resolveCombat(attacker: Piece, defender: Piece): CombatResult {
  const log: string[] = [];
  
  // Attacker deals damage
  const attackDamage = calculateDamage(attacker, defender);
  defender.takeDamage(attackDamage);
  log.push(`${attacker.type} (${attacker.color}) attacks ${defender.type} (${defender.color}) for ${attackDamage} damage!`);
  log.push(`${defender.type} HP: ${defender.stats.hp}/${defender.stats.maxHP}`);

  let counterDamage = 0;

  // Defender counter-attacks if alive
  if (defender.isAlive()) {
    counterDamage = calculateDamage(defender, attacker);
    attacker.takeDamage(counterDamage);
    log.push(`${defender.type} (${defender.color}) counter-attacks for ${counterDamage} damage!`);
    log.push(`${attacker.type} HP: ${attacker.stats.hp}/${attacker.stats.maxHP}`);
  } else {
    log.push(`${defender.type} (${defender.color}) is defeated!`);
  }

  return {
    attacker,
    defender,
    attackDamage,
    defenderCounterDamage: counterDamage,
    defenderAlive: defender.isAlive(),
    log
  };
}

/**
 * Apply special ability effects (e.g., King heals allies)
 * Called at end of turn
 */
export function applySpecialAbilities(piece: Piece, allPieces: Piece[]): string[] {
  const log: string[] = [];

  if (piece.type === PieceType.KING) {
    // King heals allies within range 1
    const alliesInRange = allPieces.filter(p => 
      p.color === piece.color && 
      p.id !== piece.id &&
      Math.abs(p.x - piece.x) <= 1 && 
      Math.abs(p.y - piece.y) <= 1
    );

    alliesInRange.forEach(ally => {
      const healAmount = 5;
      const oldHP = ally.stats.hp;
      ally.heal(healAmount);
      if (ally.stats.hp > oldHP) {
        log.push(`${piece.color} King heals ${ally.type} for ${healAmount} HP!`);
      }
    });
  }

  return log;
}
