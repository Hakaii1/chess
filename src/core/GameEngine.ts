/**
 * GameEngine.ts
 * Manages game state, including new Rescue Protocols and Buffs
 * Fixed: executeAIMove logic to correctly handle 'king-rescue' state
 */

import { Board } from './Board';
import { Piece } from './Piece';
import { PieceColor, PieceType } from './PieceStats';
import { getValidMoves, ValidMove, isKingInCheck } from './MoveValidator';
import { resolveCombat, CombatResult, applySpecialAbilities, applyEnvironmentalEffects } from './CombatSystem';
import { AI, ScoredMove } from './AI';

export type GameMode = 'single-player' | 'multiplayer' | 'two-player';
export type GameStatus = 'waiting' | 'in-progress' | 'game-over' | 'king-rescue';

export class GameEngine {
  private board: Board;
  private currentTurn: PieceColor;
  private gameStatus: GameStatus;
  private gameMode: GameMode;
  private selectedPiece: Piece | null;
  private validMoves: ValidMove[];
  private combatLog: string[];
  private moveHistory: any[];
  private turnCount: number;

  // Rescue Protocol State
  private kingRescueAvailable: Record<PieceColor, boolean>;
  private activeAbility: 'teleport' | 'swap' | null;

  constructor(gameMode: GameMode = 'single-player') {
    this.board = new Board();
    this.currentTurn = PieceColor.WHITE;
    this.gameStatus = 'in-progress';
    this.gameMode = gameMode;
    this.selectedPiece = null;
    this.validMoves = [];
    this.combatLog = [];
    this.moveHistory = [];
    this.turnCount = 1;
    
    // Both players start with one rescue available
    this.kingRescueAvailable = {
      [PieceColor.WHITE]: true,
      [PieceColor.BLACK]: true
    };
    this.activeAbility = null;
  }

  public getBoard(): Board { return this.board; }
  public getBoardState(): (Piece | null)[][] { return this.board.squares; }
  public getCurrentTurn(): PieceColor { return this.currentTurn; }
  public getGameStatus(): GameStatus { return this.gameStatus; }
  public getSelectedPiece(): Piece | null { return this.selectedPiece; }
  public getValidMoves(): ValidMove[] { return this.validMoves; }
  public getCombatLog(): string[] { return this.combatLog; }
  public getTurnCount(): number { return this.turnCount; }
  public getGameMode(): GameMode { return this.gameMode; }
  public getMoveHistory() { return this.moveHistory; }
  public getActiveAbility() { return this.activeAbility; }
  public isKingRescueActive(): boolean { return this.gameStatus === 'king-rescue'; }

  public selectPiece(x: number, y: number): ValidMove[] {
    if (this.gameStatus === 'king-rescue') return []; // Disable normal selection during rescue

    const piece = this.board.getPieceAt(x, y);
    if (!piece || piece.color !== this.currentTurn || !piece.isAlive()) {
      this.selectedPiece = null;
      this.validMoves = [];
      return [];
    }
    this.selectedPiece = piece;
    this.validMoves = getValidMoves(piece, this.board.squares);
    return this.validMoves;
  }

  public deselectPiece(): void {
    this.selectedPiece = null;
    this.validMoves = [];
  }

  // --- SPECIAL ABILITY LOGIC ---

  public activateKingAbility(type: 'teleport' | 'swap'): void {
    if (this.gameStatus !== 'king-rescue') return;
    this.activeAbility = type;
    this.combatLog.push(`🔮 Select a target for ${type.toUpperCase()}...`);
  }

  public executeKingAbilityAction(targetX: number, targetY: number): boolean {
    if (this.gameStatus !== 'king-rescue' || !this.activeAbility) return false;

    const king = this.board.getPiecesByColor(this.currentTurn).find(p => p.type === PieceType.KING);
    if (!king) return false;

    if (this.activeAbility === 'teleport') {
      const targetPiece = this.board.getPieceAt(targetX, targetY);
      if (targetPiece) return false; // Must be empty for teleport

      // Move King directly (bypass standard move logic)
      this.board.setPieceAt(king.x, king.y, null);
      this.board.setPieceAt(targetX, targetY, king);
      king.moveTo(targetX, targetY);
      
      this.combatLog.push(`✨ King Teleported to escape danger!`);

    } else if (this.activeAbility === 'swap') {
      const targetPiece = this.board.getPieceAt(targetX, targetY);
      if (!targetPiece || targetPiece.color !== this.currentTurn) return false; // Must swap with ally

      // Swap Logic
      const kX = king.x; const kY = king.y;
      this.board.setPieceAt(targetX, targetY, king);
      this.board.setPieceAt(kX, kY, targetPiece);
      king.moveTo(targetX, targetY);
      targetPiece.moveTo(kX, kY);

      this.combatLog.push(`🔄 King swapped places with ${targetPiece.type}!`);
    }

    // Apply Buffs (Damage Reduction for 3 turns)
    king.addBuff({
      id: `rescue-${Date.now()}`,
      type: 'dmg_reduction',
      value: 0.8, // 80% Damage Reduction
      duration: 3
    });
    this.combatLog.push(`🛡️ King gains Massive Resistance (3 turns)!`);

    // Consume Ability and Resume Game
    this.kingRescueAvailable[this.currentTurn] = false;
    this.activeAbility = null;
    this.gameStatus = 'in-progress';
    this.endTurn();
    return true;
  }

  // --- STANDARD MOVE LOGIC ---

  public executeMove(toX: number, toY: number): boolean {
    if (this.gameStatus === 'king-rescue') return false;
    if (!this.selectedPiece) return false;
    
    const move = this.validMoves.find(m => m.x === toX && m.y === toY);
    if (!move) return false;

    const fromX = this.selectedPiece.x;
    const fromY = this.selectedPiece.y;
    const attacker = this.selectedPiece;
    const target = this.board.getPieceAt(toX, toY);

    let combatResult: CombatResult | null = null;
    let defenderDied = false;
    this.combatLog = [];

    // Castling Logic
    if (attacker.type === PieceType.KING && Math.abs(toX - fromX) === 2) {
      if (toX > fromX) { // Kingside
        const rook = this.board.getPieceAt(7, fromY);
        if (rook) {
          this.board.setPieceAt(7, fromY, null);
          this.board.setPieceAt(5, fromY, rook);
          rook.moveTo(5, fromY);
          this.combatLog.push(`${attacker.color} King castles (Kingside)!`);
        }
      } else { // Queenside
        const rook = this.board.getPieceAt(0, fromY);
        if (rook) {
          this.board.setPieceAt(0, fromY, null);
          this.board.setPieceAt(3, fromY, rook);
          rook.moveTo(3, fromY);
          this.combatLog.push(`${attacker.color} King castles (Queenside)!`);
        }
      }
      this.board.setPieceAt(fromX, fromY, null);
      this.board.setPieceAt(toX, toY, attacker);
      attacker.moveTo(toX, toY);
    }
    // Combat
    else if (target && move.isAttack) {
      combatResult = resolveCombat(attacker, target, this.board);
      this.combatLog.push(...combatResult.log);

      if (!target.isAlive()) {
        defenderDied = true;
        this.board.setPieceAt(toX, toY, null); 
        if (attacker.isAlive()) {
          this.board.setPieceAt(fromX, fromY, null);
          this.board.setPieceAt(toX, toY, attacker);
          attacker.moveTo(toX, toY);
        } else {
          this.board.setPieceAt(fromX, fromY, null);
        }
      } else {
        if (!attacker.isAlive()) {
          this.board.setPieceAt(fromX, fromY, null);
        }
      }
    }
    // Normal Move
    else {
      this.board.setPieceAt(fromX, fromY, null);
      this.board.setPieceAt(toX, toY, attacker);
      attacker.moveTo(toX, toY);
    }

    // End of Turn Effects
    const abilityLog = applySpecialAbilities(attacker, this.board.getAlivePieces());
    this.combatLog.push(...abilityLog);

    this.moveHistory.push({
      fromX, fromY, toX, toY,
      capturedPiece: defenderDied ? target : null,
      combatResult
    });

    this.selectedPiece = null;
    this.validMoves = [];

    // Environmental Effects
    const envLog = applyEnvironmentalEffects(this.board.getAlivePieces(), this.board);
    if (envLog.length > 0) this.combatLog.push(...envLog);

    // Clean up burned pieces
    for(let y=0; y<8; y++) {
      for(let x=0; x<8; x++) {
        const p = this.board.getPieceAt(x, y);
        if (p && !p.isAlive()) {
          this.board.setPieceAt(x, y, null);
          this.combatLog.push(`💀 ${p.type} burned to death!`);
        }
      }
    }

    const gameOverCheck = this.board.isGameOver();
    if (gameOverCheck.gameOver) {
      this.gameStatus = 'game-over';
      this.combatLog.push(`\n🏆 ${gameOverCheck.winner} WINS! 🏆`);
    } else {
      this.endTurn();
    }

    return true;
  }

  private endTurn(): void {
    this.turnCount++;
    this.currentTurn = this.currentTurn === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;
    
    // 1. Tick Buffs for current player
    this.board.getPiecesByColor(this.currentTurn).forEach(p => p.tickBuffs());

    // 2. Check for "Trapped" condition
    if (this.checkForTrap(this.currentTurn)) {
      // If King is in Check AND Trap AND Rescue Available
      if (this.kingRescueAvailable[this.currentTurn] && isKingInCheck(this.currentTurn, this.board.squares)) {
        this.gameStatus = 'king-rescue';
        this.combatLog.push(`⚠️ ${this.currentTurn.toUpperCase()} KING TRAPPED! INITIATE RESCUE PROTOCOL!`);
        
        // If it's AI turn (Single Player Black), execute rescue automatically
        if (this.gameMode === 'single-player' && this.currentTurn === PieceColor.BLACK) {
             setTimeout(() => this.executeAIMove(), 1000);
        }
        return; 
      }
    }

    if (this.gameMode === 'single-player' && this.currentTurn === PieceColor.BLACK) {
      setTimeout(() => this.executeAIMove(), 1000);
    }
  }

  /**
   * Returns true if the current player has NO valid moves (Checkmate or Stalemate scenario)
   */
  private checkForTrap(color: PieceColor): boolean {
    const pieces = this.board.getPiecesByColor(color);
    for (const p of pieces) {
      if (!p.isAlive()) continue;
      if (getValidMoves(p, this.board.squares).length > 0) return false;
    }
    return true; // No valid moves found
  }

  private executeAIMove(): void {
    // 1. Handle Rescue Mode for AI
    if (this.gameStatus === 'king-rescue') {
        const king = this.board.getPiecesByColor(this.currentTurn).find(p => p.type === PieceType.KING);
        if(king) {
           this.activateKingAbility('teleport');
           let tx, ty;
           // Attempt to find a random empty square 100 times to escape
           for(let i=0; i<100; i++) {
             tx = Math.floor(Math.random()*8); 
             ty = Math.floor(Math.random()*8);
             if (!this.board.getPieceAt(tx, ty)) {
               this.executeKingAbilityAction(tx, ty);
               break;
             }
           }
        }
        return;
    }

    // 2. Standard AI Move Logic
    if (this.gameStatus === 'in-progress') {
      const aiMove = AI.chooseMove(this.board, this.currentTurn);
      if (aiMove) {
        this.selectPiece(aiMove.fromX, aiMove.fromY);
        this.executeMove(aiMove.toX, aiMove.toY);
      }
    }
  }

  public getWinner(): PieceColor | null {
    const gameOver = this.board.isGameOver();
    return gameOver.gameOver ? gameOver.winner : null;
  }

  public resetGame(): void {
    this.board = new Board();
    this.currentTurn = PieceColor.WHITE;
    this.gameStatus = 'in-progress';
    this.selectedPiece = null;
    this.validMoves = [];
    this.combatLog = [];
    this.moveHistory = [];
    this.turnCount = 1;
    this.kingRescueAvailable = { [PieceColor.WHITE]: true, [PieceColor.BLACK]: true };
    this.activeAbility = null;
  }

  public isAIThinking(): boolean {
    return this.gameMode === 'single-player' && this.currentTurn === PieceColor.BLACK && (this.gameStatus === 'in-progress' || this.gameStatus === 'king-rescue');
  }
}