/**
 * ChessboardCanvas.tsx
 * Canvas-based board renderer
 * Responsible for rendering the chessboard, pieces, and visual feedback
 */

import React, { useRef, useEffect } from 'react';
import { Piece, PieceColor, PieceType, ValidMove } from '../core';
import styles from './ChessboardCanvas.module.css';

interface ChessboardCanvasProps {
  boardState: (Piece | null)[][];
  selectedPiece: Piece | null;
  validMoves: ValidMove[];
  onSquareClick: (x: number, y: number) => void;
  isAIThinking: boolean;
}

const BOARD_SIZE = 8;
const SQUARE_SIZE = 60;
const PIECE_FONT_SIZE = 40;
const HP_BAR_HEIGHT = 4;
const HP_BAR_WIDTH = SQUARE_SIZE - 4;

// Unicode chess pieces
const PIECE_SYMBOLS: Record<PieceType, Record<PieceColor, string>> = {
  [PieceType.PAWN]: { [PieceColor.WHITE]: '♙', [PieceColor.BLACK]: '♟' },
  [PieceType.KNIGHT]: { [PieceColor.WHITE]: '♘', [PieceColor.BLACK]: '♞' },
  [PieceType.BISHOP]: { [PieceColor.WHITE]: '♗', [PieceColor.BLACK]: '♝' },
  [PieceType.ROOK]: { [PieceColor.WHITE]: '♖', [PieceColor.BLACK]: '♜' },
  [PieceType.QUEEN]: { [PieceColor.WHITE]: '♕', [PieceColor.BLACK]: '♛' },
  [PieceType.KING]: { [PieceColor.WHITE]: '♔', [PieceColor.BLACK]: '♚' }
};

export const ChessboardCanvas: React.FC<ChessboardCanvasProps> = ({
  boardState,
  selectedPiece,
  validMoves,
  onSquareClick,
  isAIThinking
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Render board and pieces
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#f0e6d2';
    ctx.fillRect(0, 0, BOARD_SIZE * SQUARE_SIZE, BOARD_SIZE * SQUARE_SIZE);

    // Draw checkerboard
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        if ((x + y) % 2 === 1) {
          ctx.fillStyle = '#baca44';
          ctx.fillRect(x * SQUARE_SIZE, y * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
        }
      }
    }

    // Highlight selected piece
    if (selectedPiece) {
      ctx.fillStyle = 'rgba(255, 255, 0, 0.4)';
      ctx.fillRect(
        selectedPiece.x * SQUARE_SIZE,
        selectedPiece.y * SQUARE_SIZE,
        SQUARE_SIZE,
        SQUARE_SIZE
      );
    }

    // Highlight valid moves
    validMoves.forEach(move => {
      ctx.fillStyle = move.isAttack ? 'rgba(255, 0, 0, 0.3)' : 'rgba(0, 255, 0, 0.3)';
      ctx.fillRect(move.x * SQUARE_SIZE, move.y * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);

      // Draw circle for non-attack moves
      if (!move.isAttack) {
        ctx.fillStyle = 'rgba(0, 150, 0, 0.6)';
        ctx.beginPath();
        ctx.arc(
          move.x * SQUARE_SIZE + SQUARE_SIZE / 2,
          move.y * SQUARE_SIZE + SQUARE_SIZE / 2,
          8,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    });

    // Draw pieces
    boardState.forEach((row, y) => {
      row.forEach((piece, x) => {
        if (!piece) return;

        const pieceX = x * SQUARE_SIZE;
        const pieceY = y * SQUARE_SIZE;

        // Draw piece background
        ctx.fillStyle = piece.color === PieceColor.WHITE ? '#ffffff' : '#333333';
        ctx.beginPath();
        ctx.arc(
          pieceX + SQUARE_SIZE / 2,
          pieceY + SQUARE_SIZE / 2,
          SQUARE_SIZE / 2.3,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // Draw piece border
        ctx.strokeStyle = piece.color === PieceColor.WHITE ? '#333333' : '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw piece symbol
        ctx.fillStyle = piece.color === PieceColor.WHITE ? '#333333' : '#ffffff';
        ctx.font = `bold ${PIECE_FONT_SIZE}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          PIECE_SYMBOLS[piece.type][piece.color],
          pieceX + SQUARE_SIZE / 2,
          pieceY + SQUARE_SIZE / 2 - 2
        );

        // Draw HP bar
        if (piece.stats.hp < piece.stats.maxHP) {
          const healthPercent = piece.getHealthPercent();
          const barX = pieceX + 2;
          const barY = pieceY + SQUARE_SIZE - HP_BAR_HEIGHT - 2;

          // Background (red)
          ctx.fillStyle = '#ff0000';
          ctx.fillRect(barX, barY, HP_BAR_WIDTH, HP_BAR_HEIGHT);

          // Health (green)
          ctx.fillStyle = '#00ff00';
          ctx.fillRect(barX, barY, HP_BAR_WIDTH * healthPercent, HP_BAR_HEIGHT);
        }

        // Draw HP text
        ctx.fillStyle = '#000000';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${piece.stats.hp}/${piece.stats.maxHP}`, pieceX + SQUARE_SIZE / 2, pieceY + 12);
      });
    });

    // AI thinking indicator
    if (isAIThinking) {
      ctx.fillStyle = 'rgba(100, 150, 255, 0.2)';
      ctx.fillRect(0, 0, BOARD_SIZE * SQUARE_SIZE, BOARD_SIZE * SQUARE_SIZE);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('AI Thinking...', (BOARD_SIZE * SQUARE_SIZE) / 2, (BOARD_SIZE * SQUARE_SIZE) / 2);
    }
  }, [boardState, selectedPiece, validMoves, isAIThinking]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / SQUARE_SIZE);
    const y = Math.floor((e.clientY - rect.top) / SQUARE_SIZE);

    if (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
      onSquareClick(x, y);
    }
  };

  return (
    <div className={styles.canvasContainer}>
      <canvas
        ref={canvasRef}
        width={BOARD_SIZE * SQUARE_SIZE}
        height={BOARD_SIZE * SQUARE_SIZE}
        onClick={handleCanvasClick}
        className={styles.canvas}
        style={{ cursor: isAIThinking ? 'wait' : 'pointer' }}
      />
    </div>
  );
};
