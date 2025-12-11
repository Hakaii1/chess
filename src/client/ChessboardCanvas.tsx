/**
 * ChessboardCanvas.tsx
 * Canvas-based board renderer
 * Features: Animations, Particles, Damage Text, Piece Highlighting
 */

import React, { useRef, useEffect, useState } from 'react';
import { Piece, PieceColor, PieceType, ValidMove } from '../core';
import styles from './ChessboardCanvas.module.css';

interface ChessboardCanvasProps {
  boardState: (Piece | null)[][];
  selectedPiece: Piece | null;
  validMoves: ValidMove[];
  onSquareClick: (x: number, y: number) => void;
  isAIThinking: boolean;
  lastMove?: {
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    combatResult: any | null;
  } | null;
}

const BOARD_SIZE = 8;
const SQUARE_SIZE = 60;
const PIECE_FONT_SIZE = 40;
const HP_BAR_HEIGHT = 4;
const HP_BAR_WIDTH = SQUARE_SIZE - 4;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  size: number;
}

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
  isAIThinking,
  lastMove
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Animation state
  const [animation, setAnimation] = useState<{
    startTime: number;
    type: 'combat' | 'move';
    data: any;
  } | null>(null);

  // Particles state
  const particles = useRef<Particle[]>([]);

  // Initialize animation when move happens
  useEffect(() => {
    if (lastMove) {
      setAnimation({
        startTime: Date.now(),
        type: lastMove.combatResult ? 'combat' : 'move',
        data: lastMove
      });

      // Spawn particles if a piece died
      if (lastMove.combatResult && !lastMove.combatResult.defenderAlive) {
        spawnParticles(lastMove.toX, lastMove.toY, lastMove.combatResult.defender.color);
      }
      
      const timer = setTimeout(() => setAnimation(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [lastMove]);

  const spawnParticles = (gx: number, gy: number, color: PieceColor) => {
    const centerX = gx * SQUARE_SIZE + SQUARE_SIZE / 2;
    const centerY = gy * SQUARE_SIZE + SQUARE_SIZE / 2;
    const particleColor = color === PieceColor.WHITE ? '#eeeeee' : '#333333';

    for (let i = 0; i < 30; i++) {
      particles.current.push({
        x: centerX,
        y: centerY,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        color: particleColor,
        life: 1.0,
        size: Math.random() * 4 + 2
      });
    }
  };

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      // 1. Draw Board
      ctx.fillStyle = '#f0e6d2';
      ctx.fillRect(0, 0, BOARD_SIZE * SQUARE_SIZE, BOARD_SIZE * SQUARE_SIZE);

      for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
          if ((x + y) % 2 === 1) {
            ctx.fillStyle = '#baca44'; 
            ctx.fillRect(x * SQUARE_SIZE, y * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
          }
        }
      }

      // 2. Highlight Last Move
      if (lastMove) {
        ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
        ctx.fillRect(lastMove.fromX * SQUARE_SIZE, lastMove.fromY * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
        ctx.fillRect(lastMove.toX * SQUARE_SIZE, lastMove.toY * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
      }

      // 3. Highlight Selected
      if (selectedPiece) {
        ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
        ctx.fillRect(selectedPiece.x * SQUARE_SIZE, selectedPiece.y * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
      }

      // 4. Valid Moves
      validMoves.forEach(move => {
        if (move.isAttack) {
          const pulse = (Math.sin(Date.now() / 200) + 1) / 2;
          ctx.fillStyle = `rgba(255, 0, 0, ${0.3 + pulse * 0.2})`;
          ctx.fillRect(move.x * SQUARE_SIZE, move.y * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
        } else {
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

      // 5. Draw Pieces
      boardState.forEach((row, y) => {
        row.forEach((piece, x) => {
          if (!piece) return;

          const pieceX = x * SQUARE_SIZE;
          const pieceY = y * SQUARE_SIZE;

          // Don't draw piece if it's currently exploding (wait for next state update to clear it)
          // Actually, we keep drawing it until state removes it, particles overlay on top
          
          ctx.fillStyle = piece.color === PieceColor.WHITE ? '#ffffff' : '#333333';
          ctx.beginPath();
          ctx.arc(pieceX + SQUARE_SIZE / 2, pieceY + SQUARE_SIZE / 2, SQUARE_SIZE / 2.3, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = piece.color === PieceColor.WHITE ? '#333333' : '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = piece.color === PieceColor.WHITE ? '#333333' : '#ffffff';
          ctx.font = `bold ${PIECE_FONT_SIZE}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(PIECE_SYMBOLS[piece.type][piece.color], pieceX + SQUARE_SIZE / 2, pieceY + SQUARE_SIZE / 2 - 2);

          // HP Bar
          if (piece.stats.hp < piece.stats.maxHP) {
            const healthPercent = piece.getHealthPercent();
            const barX = pieceX + 2;
            const barY = pieceY + SQUARE_SIZE - HP_BAR_HEIGHT - 2;

            ctx.fillStyle = '#ff0000';
            ctx.fillRect(barX, barY, HP_BAR_WIDTH, HP_BAR_HEIGHT);

            ctx.fillStyle = '#00ff00';
            ctx.fillRect(barX, barY, HP_BAR_WIDTH * healthPercent, HP_BAR_HEIGHT);
          }
        });
      });

      // 6. Update & Draw Particles
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.05;
        p.vy += 0.5; // Gravity

        if (p.life <= 0) {
          particles.current.splice(i, 1);
        } else {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.life;
          ctx.fillRect(p.x, p.y, p.size, p.size);
          ctx.globalAlpha = 1.0;
        }
      }

      // 7. Draw Combat Text
      if (animation && animation.type === 'combat') {
        const { toX, toY, combatResult } = animation.data;
        const elapsed = Date.now() - animation.startTime;
        const duration = 1000;

        if (elapsed < duration) {
          const centerX = toX * SQUARE_SIZE + SQUARE_SIZE / 2;
          const centerY = toY * SQUARE_SIZE + SQUARE_SIZE / 2;
          const floatOffset = (elapsed / duration) * 40;
          const alpha = Math.max(0, 1 - (elapsed / duration));

          // Damage Text
          ctx.font = 'bold 24px Arial';
          ctx.fillStyle = `rgba(255, 50, 50, ${alpha})`;
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.lineWidth = 4;
          
          const dmgText = `-${combatResult.attackDamage}`;
          ctx.strokeText(dmgText, centerX, centerY - floatOffset);
          ctx.fillText(dmgText, centerX, centerY - floatOffset);

          // Counter Damage
          if (combatResult.defenderCounterDamage > 0) {
            const fromX = animation.data.fromX;
            const fromY = animation.data.fromY;
            const originX = fromX * SQUARE_SIZE + SQUARE_SIZE / 2;
            const originY = fromY * SQUARE_SIZE + SQUARE_SIZE / 2;
            
            ctx.fillStyle = `rgba(255, 140, 0, ${alpha})`;
            const counterText = `-${combatResult.defenderCounterDamage}`;
            ctx.strokeText(counterText, originX, originY - floatOffset);
            ctx.fillText(counterText, originX, originY - floatOffset);
          }
        }
      }

      // 8. AI Thinking Overlay
      if (isAIThinking) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, BOARD_SIZE * SQUARE_SIZE, BOARD_SIZE * SQUARE_SIZE);
        
        const pulse = (Math.sin(Date.now() / 300) + 1) / 2;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.8 + pulse * 0.2})`;
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Enemy Turn...', (BOARD_SIZE * SQUARE_SIZE) / 2, (BOARD_SIZE * SQUARE_SIZE) / 2);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [boardState, selectedPiece, validMoves, isAIThinking, animation, lastMove]);

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