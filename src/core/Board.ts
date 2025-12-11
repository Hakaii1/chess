/**
 * Board.ts
 * Manages the 8x8 game board and piece placement
 */

import { Piece } from './Piece';
import { PieceType, PieceColor } from './PieceStats';

export class Board {
  public squares: (Piece | null)[][];

  constructor() {
    this.squares = Array(8).fill(null).map(() => Array(8).fill(null));
    this.initializeBoard();
  }

  /**
   * Set up the initial board position
   */
  private initializeBoard(): void {
    // White pieces at bottom (rows 6-7)
    this.placeRow(7, PieceColor.WHITE);
    this.placePawns(6, PieceColor.WHITE);

    // Black pieces at top (rows 0-1)
    this.placeRow(0, PieceColor.BLACK);
    this.placePawns(1, PieceColor.BLACK);
  }

  /**
   * Place back row (rook, knight, bishop, queen, king, bishop, knight, rook)
   */
  private placeRow(row: number, color: PieceColor): void {
    const order = [
      PieceType.ROOK, PieceType.KNIGHT, PieceType.BISHOP, PieceType.QUEEN,
      PieceType.KING, PieceType.BISHOP, PieceType.KNIGHT, PieceType.ROOK
    ];

    order.forEach((type, col) => {
      const id = `${color}-${type}-${col}`;
      this.squares[row][col] = new Piece(type, color, col, row, id);
    });
  }

  /**
   * Place pawns
   */
  private placePawns(row: number, color: PieceColor): void {
    for (let col = 0; col < 8; col++) {
      const id = `${color}-pawn-${col}`;
      this.squares[row][col] = new Piece(PieceType.PAWN, color, col, row, id);
    }
  }

  /**
   * Get piece at position
   */
  public getPieceAt(x: number, y: number): Piece | null {
    if (x < 0 || x >= 8 || y < 0 || y >= 8) return null;
    return this.squares[y][x];
  }

  /**
   * Place piece at position
   */
  public setPieceAt(x: number, y: number, piece: Piece | null): void {
    if (x < 0 || x >= 8 || y < 0 || y >= 8) return;
    this.squares[y][x] = piece;
  }

  /**
   * Move piece from one position to another
   * Returns the captured piece if any
   */
  public movePiece(fromX: number, fromY: number, toX: number, toY: number): Piece | null {
    const piece = this.getPieceAt(fromX, fromY);
    if (!piece) return null;

    const captured = this.getPieceAt(toX, toY);
    
    piece.moveTo(toX, toY);
    this.setPieceAt(fromX, fromY, null);
    this.setPieceAt(toX, toY, piece);

    return captured;
  }

  /**
   * Get all pieces of a color
   */
  public getPiecesByColor(color: PieceColor): Piece[] {
    const pieces: Piece[] = [];
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const piece = this.squares[y][x];
        if (piece && piece.color === color) {
          pieces.push(piece);
        }
      }
    }
    return pieces;
  }

  /**
   * Check if either king is dead
   */
  public isGameOver(): { gameOver: boolean; winner: PieceColor | null } {
    const whitePieces = this.getPiecesByColor(PieceColor.WHITE);
    const blackPieces = this.getPiecesByColor(PieceColor.BLACK);

    const whiteKingAlive = whitePieces.some(p => p.type === PieceType.KING && p.isAlive());
    const blackKingAlive = blackPieces.some(p => p.type === PieceType.KING && p.isAlive());

    if (!whiteKingAlive) {
      return { gameOver: true, winner: PieceColor.BLACK };
    }
    if (!blackKingAlive) {
      return { gameOver: true, winner: PieceColor.WHITE };
    }

    return { gameOver: false, winner: null };
  }

  /**
   * Get all alive pieces on the board
   */
  public getAlivePieces(): Piece[] {
    const pieces: Piece[] = [];
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const piece = this.squares[y][x];
        if (piece && piece.isAlive()) {
          pieces.push(piece);
        }
      }
    }
    return pieces;
  }

  /**
   * Clone the entire board (for move validation simulations)
   */
  public clone(): Board {
    const cloned = new Board();
    cloned.squares = this.squares.map(row =>
      row.map(piece => piece ? piece.clone() : null)
    );
    return cloned;
  }
}
