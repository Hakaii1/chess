/**
 * GameEngine.ts
 * Main game logic engine
 * Fixed: Combat resolution before movement
 */

import { Board } from './Board';
import { Piece } from './Piece';
import { PieceColor, PieceType } from './PieceStats';
import { getValidMoves, ValidMove } from './MoveValidator';
import { resolveCombat, CombatResult, applySpecialAbilities } from './CombatSystem';
import { AI, ScoredMove } from './AI';

export type GameMode = 'single-player' | 'multiplayer' | 'two-player';
export type GameStatus = 'waiting' | 'in-progress' | 'game-over';

export class GameEngine {
  private board: Board;
  private currentTurn: PieceColor;
  private gameStatus: GameStatus;
  private gameMode: GameMode;
  private selectedPiece: Piece | null;
  private validMoves: ValidMove[];
  private combatLog: string[];
  private moveHistory: Array<{
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    capturedPiece: Piece | null;
    combatResult: CombatResult | null;
  }>;
  private turnCount: number;

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
  }

  // ==================== GETTERS ====================

  public getBoard(): Board { return this.board; }
  public getBoardState(): (Piece | null)[][] { return this.board.squares; }
  public getCurrentTurn(): PieceColor { return this.currentTurn; }
  public getGameStatus(): GameStatus { return this.gameStatus; }
  public getSelectedPiece(): Piece | null { return this.selectedPiece; }
  public getValidMoves(): ValidMove[] { return this.validMoves; }
  public getCombatLog(): string[] { return this.combatLog; }
  public getTurnCount(): number { return this.turnCount; }
  public getGameMode(): GameMode { return this.gameMode; }

  // ==================== GAME LOGIC ====================

  public selectPiece(x: number, y: number): ValidMove[] {
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

  public executeMove(toX: number, toY: number): boolean {
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

    // --- CASTLING LOGIC ---
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
      // King moves normally below
      this.board.setPieceAt(fromX, fromY, null);
      this.board.setPieceAt(toX, toY, attacker);
      attacker.moveTo(toX, toY);
    }
    // --- COMBAT LOGIC ---
    else if (target && move.isAttack) {
      // 1. Resolve Combat BEFORE moving
      combatResult = resolveCombat(attacker, target);
      this.combatLog.push(...combatResult.log);

      // 2. Handle Combat Outcomes
      if (!target.isAlive()) {
        defenderDied = true;
        // Defender dies: Remove defender
        this.board.setPieceAt(toX, toY, null);
        
        // If attacker survived counter-attack, move into the square
        if (attacker.isAlive()) {
          this.board.setPieceAt(fromX, fromY, null);
          this.board.setPieceAt(toX, toY, attacker);
          attacker.moveTo(toX, toY);
        } else {
          // Attacker also died (Mutual Destruction): Remove attacker too
          this.board.setPieceAt(fromX, fromY, null);
        }
      } else {
        // Defender lives: Attacker STAYS put (Battle Chess Rule)
        // If attacker died from counter, remove them
        if (!attacker.isAlive()) {
          this.board.setPieceAt(fromX, fromY, null);
        }
        // If attacker lives, they just lose HP but don't move
      }
    }
    // --- NORMAL MOVEMENT ---
    else {
      this.board.setPieceAt(fromX, fromY, null);
      this.board.setPieceAt(toX, toY, attacker);
      attacker.moveTo(toX, toY);
    }

    // Apply special abilities (Healing, etc.)
    const abilityLog = applySpecialAbilities(attacker, this.board.getAlivePieces());
    this.combatLog.push(...abilityLog);

    this.moveHistory.push({
      fromX, fromY, toX, toY,
      capturedPiece: defenderDied ? target : null,
      combatResult
    });

    this.selectedPiece = null;
    this.validMoves = [];

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

    if (this.gameMode === 'single-player' && this.currentTurn === PieceColor.BLACK) {
      setTimeout(() => this.executeAIMove(), 1000);
    }
  }

  private executeAIMove(): void {
    if (this.gameStatus === 'game-over') return;
    const aiMove = AI.chooseMove(this.board, this.currentTurn);
    if (aiMove) {
      this.selectPiece(aiMove.fromX, aiMove.fromY);
      this.executeMove(aiMove.toX, aiMove.toY);
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
  }

  public getMoveHistory() { return this.moveHistory; }
  
  public isAIThinking(): boolean {
    return this.gameMode === 'single-player' && this.currentTurn === PieceColor.BLACK && this.gameStatus === 'in-progress';
  }
}