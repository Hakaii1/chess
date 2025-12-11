/**
 * GameEngine.ts
 * Main game logic engine
 * This is the heart of the game - completely independent of React/UI
 * Can be used with different frontends (web, mobile, CLI, multiplayer server)
 */

import { Board } from './Board';
import { Piece } from './Piece';
import { PieceColor, PieceType } from './PieceStats';
import { getValidMoves, ValidMove } from './MoveValidator';
import { resolveCombat, CombatResult, applySpecialAbilities } from './CombatSystem';
import { AI, ScoredMove } from './AI';

export type GameMode = 'single-player' | 'multiplayer' | 'two-player';
export type GameStatus = 'waiting' | 'in-progress' | 'game-over';

export interface GameEvent {
  type: 'move' | 'combat' | 'special-ability' | 'piece-death' | 'game-over';
  data: any;
  timestamp: number;
}

/**
 * Core game engine - pure logic, no UI
 */
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
    this.turnCount = 0;
  }

  // ==================== GETTERS ====================

  public getBoard(): Board {
    return this.board;
  }

  public getBoardState(): (Piece | null)[][] {
    return this.board.squares;
  }

  public getCurrentTurn(): PieceColor {
    return this.currentTurn;
  }

  public getGameStatus(): GameStatus {
    return this.gameStatus;
  }

  public getSelectedPiece(): Piece | null {
    return this.selectedPiece;
  }

  public getValidMoves(): ValidMove[] {
    return this.validMoves;
  }

  public getCombatLog(): string[] {
    return this.combatLog;
  }

  public getTurnCount(): number {
    return this.turnCount;
  }

  public getGameMode(): GameMode {
    return this.gameMode;
  }

  // ==================== GAME LOGIC ====================

  /**
   * Select a piece and get its valid moves
   */
  public selectPiece(x: number, y: number): ValidMove[] {
    const piece = this.board.getPieceAt(x, y);

    // Debug log to help identify selection issues
    console.log(`[GameEngine] selectPiece called at (${x},${y}) -> piece=${piece ? piece.id : 'null'} color=${piece ? piece.color : 'n/a'} currentTurn=${this.currentTurn}`);

    // Can only select pieces of current player
    if (!piece || piece.color !== this.currentTurn || !piece.isAlive()) {
      this.selectedPiece = null;
      this.validMoves = [];
      return [];
    }

    this.selectedPiece = piece;
    this.validMoves = getValidMoves(piece, this.board.squares);
    return this.validMoves;
  }

  /**
   * Deselect current piece
   */
  public deselectPiece(): void {
    this.selectedPiece = null;
    this.validMoves = [];
  }

  /**
   * Execute a move from selected piece to target square
   * Returns true if move was successful
   */
  public executeMove(toX: number, toY: number): boolean {
    if (!this.selectedPiece) return false;

    const moveIsValid = this.validMoves.some(m => m.x === toX && m.y === toY);
    if (!moveIsValid) return false;

    const fromX = this.selectedPiece.x;
    const fromY = this.selectedPiece.y;
    const piece = this.selectedPiece;

    // Move piece and capture if applicable
    const capturedPiece = this.board.movePiece(fromX, fromY, toX, toY);
    let combatResult: CombatResult | null = null;

    this.combatLog = [];

    // Handle castling
    if (piece.type === PieceType.KING && Math.abs(toX - fromX) === 2) {
      // Kingside castling (king moves right)
      if (toX > fromX) {
        const rook = this.board.getPieceAt(7, fromY);
        if (rook) {
          this.board.movePiece(7, fromY, 5, fromY);
          const colorName = piece.color === PieceColor.WHITE ? 'White' : 'Black';
          this.combatLog.push(`${colorName} King castles (Kingside)!`);
        }
      } 
      // Queenside castling (king moves left)
      else {
        const rook = this.board.getPieceAt(0, fromY);
        if (rook) {
          this.board.movePiece(0, fromY, 3, fromY);
          const colorName = piece.color === PieceColor.WHITE ? 'White' : 'Black';
          this.combatLog.push(`${colorName} King castles (Queenside)!`);
        }
      }
    }

    // Combat happens if there was a captured piece
    if (capturedPiece) {
      combatResult = resolveCombat(this.selectedPiece, capturedPiece);
      this.combatLog.push(...combatResult.log);

      // Remove dead pieces from board
      if (!capturedPiece.isAlive()) {
        this.board.setPieceAt(capturedPiece.x, capturedPiece.y, null);
      }
    }

    // Apply special abilities (e.g., King healing)
    const abilityLog = applySpecialAbilities(this.selectedPiece, this.board.getAlivePieces());
    this.combatLog.push(...abilityLog);

    // Record move history
    this.moveHistory.push({
      fromX,
      fromY,
      toX,
      toY,
      capturedPiece,
      combatResult
    });

    // Deselect and check for game over
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

  /**
   * End current turn and switch to next player
   */
  private endTurn(): void {
    this.turnCount++;
    this.currentTurn = this.currentTurn === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;

    // AI move in single-player mode
    if (this.gameMode === 'single-player' && this.currentTurn === PieceColor.BLACK) {
      // Schedule AI move for next tick to allow UI update
      setTimeout(() => this.executeAIMove(), 1000);
    }
  }

  /**
   * Execute AI's chosen move
   */
  private executeAIMove(): void {
    if (this.gameStatus === 'game-over') return;

    const aiMove = AI.chooseMove(this.board, this.currentTurn);
    if (aiMove) {
      this.selectPiece(aiMove.fromX, aiMove.fromY);
      this.executeMove(aiMove.toX, aiMove.toY);
    }
  }

  /**
   * Get the winning color (if game is over)
   */
  public getWinner(): PieceColor | null {
    const gameOver = this.board.isGameOver();
    return gameOver.gameOver ? gameOver.winner : null;
  }

  /**
   * Reset the game to initial state
   */
  public resetGame(): void {
    this.board = new Board();
    this.currentTurn = PieceColor.WHITE;
    this.gameStatus = 'in-progress';
    this.selectedPiece = null;
    this.validMoves = [];
    this.combatLog = [];
    this.moveHistory = [];
    this.turnCount = 0;
  }

  /**
   * Get move history for replay/analysis
   */
  public getMoveHistory() {
    return this.moveHistory;
  }

  /**
   * Check if AI is currently thinking (for UI purposes)
   */
  public isAIThinking(): boolean {
    return this.gameMode === 'single-player' && this.currentTurn === PieceColor.BLACK && this.gameStatus === 'in-progress';
  }
}
