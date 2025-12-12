/**
 * Piece.ts
 * Represents a single chess piece with stats, position, and now Buffs.
 * Pure data class - no UI logic
 */

import { PieceType, PieceColor, PieceStats, getStartingStats } from './PieceStats';

export interface Buff {
  id: string;
  type: 'dmg_reduction';
  value: number; // 0-1 (percentage reduction)
  duration: number; // Turns
}

export class Piece {
  public type: PieceType;
  public color: PieceColor;
  public stats: PieceStats;
  public x: number;
  public y: number;
  public id: string; // Unique identifier for tracking
  public moveCount: number; // Track moves for castling
  public buffs: Buff[]; // New: Status effects

  constructor(type: PieceType, color: PieceColor, x: number, y: number, id: string) {
    this.type = type;
    this.color = color;
    this.x = x;
    this.y = y;
    this.id = id;
    this.stats = getStartingStats(type);
    this.moveCount = 0;
    this.buffs = [];
  }

  /**
   * Apply damage to this piece
   * @returns true if piece is still alive, false if dead
   */
  public takeDamage(damage: number): boolean {
    this.stats.hp = Math.max(0, this.stats.hp - damage);
    return this.stats.hp > 0;
  }

  /**
   * Heal this piece
   */
  public heal(amount: number): void {
    this.stats.hp = Math.min(this.stats.maxHP, this.stats.hp + amount);
  }

  /**
   * Check if piece is alive
   */
  public isAlive(): boolean {
    return this.stats.hp > 0;
  }

  /**
   * Get health percentage for UI rendering
   */
  public getHealthPercent(): number {
    return this.stats.hp / this.stats.maxHP;
  }

  /**
   * Clone this piece (useful for move validation/simulation)
   */
  public clone(): Piece {
    const cloned = new Piece(this.type, this.color, this.x, this.y, this.id);
    cloned.stats = { ...this.stats };
    cloned.moveCount = this.moveCount;
    cloned.buffs = this.buffs.map(b => ({ ...b })); // Deep copy buffs
    return cloned;
  }

  /**
   * Move piece to new position and increment move counter
   */
  public moveTo(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.moveCount++;
  }

  /**
   * Add a status effect
   */
  public addBuff(buff: Buff): void {
    this.buffs.push(buff);
  }

  /**
   * Reduce duration of buffs and remove expired ones
   */
  public tickBuffs(): void {
    this.buffs.forEach(b => b.duration--);
    this.buffs = this.buffs.filter(b => b.duration > 0);
  }
}