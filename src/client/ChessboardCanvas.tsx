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
  boardFlipped?: boolean;
  gameMode?: 'single-player' | 'two-player';
  currentTurn?: PieceColor;
}

const BOARD_SIZE = 8;
const SQUARE_SIZE = 70;
const PIECE_FONT_SIZE = 40;
const HP_BAR_HEIGHT = 6;
const HP_BAR_WIDTH = SQUARE_SIZE - 8;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  size: number;
}

// Helper function to draw custom premium pieces
const drawPremiumPiece = (
  ctx: CanvasRenderingContext2D,
  piece: Piece,
  x: number,
  y: number,
  size: number
) => {
  const isWhite = piece.color === PieceColor.WHITE;
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  const radius = size / 2.2;

  // Base circle with gradient
  const gradient = ctx.createRadialGradient(centerX - size / 5, centerY - size / 5, 0, centerX, centerY, radius);
  if (isWhite) {
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.7, '#f0f0f0');
    gradient.addColorStop(1, '#d0d0d0');
  } else {
    gradient.addColorStop(0, '#444444');
    gradient.addColorStop(0.7, '#222222');
    gradient.addColorStop(1, '#000000');
  }
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  // Metallic shine
  const shineGradient = ctx.createLinearGradient(centerX - radius, centerY - radius, centerX + radius, centerY + radius);
  shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
  shineGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
  shineGradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
  ctx.fillStyle = shineGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  // Highlight
  ctx.fillStyle = isWhite ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.3)';
  ctx.beginPath();
  ctx.arc(centerX - radius / 3, centerY - radius / 3, radius / 4, 0, Math.PI * 2);
  ctx.fill();

  // Border
  ctx.strokeStyle = isWhite ? '#888888' : '#ffdd00';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Draw piece symbol with glow
  const symbol = PIECE_SYMBOLS[piece.type][piece.color];
  ctx.fillStyle = isWhite ? '#222222' : '#ffdd00';
  ctx.font = `bold ${size * 0.65}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Shadow for contrast
  ctx.fillStyle = isWhite ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 221, 0, 0.2)';
  ctx.fillText(symbol, centerX, centerY + 2);
  
  // Main text
  ctx.fillStyle = isWhite ? '#000000' : '#ffdd00';
  ctx.fillText(symbol, centerX, centerY);
};

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
  lastMove,
  boardFlipped = false,
  gameMode = 'single-player',
  currentTurn
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

  // Helper to convert board coordinates when flipped
  const getBoardCoordinates = (x: number, y: number) => {
    // Only apply visual flip in two-player mode
    if (gameMode === 'two-player' && boardFlipped) {
      return { x: 7 - x, y: 7 - y };
    }
    return { x, y };
  };

  const spawnParticles = (gx: number, gy: number, color: PieceColor) => {
    const coords = getBoardCoordinates(gx, gy);
    const centerX = coords.x * SQUARE_SIZE + SQUARE_SIZE / 2;
    const centerY = coords.y * SQUARE_SIZE + SQUARE_SIZE / 2;
    
    // Vibrant particle colors based on piece color
    const colors = color === PieceColor.WHITE 
      ? ['#ffffff', '#e0e0e0', '#ffdd00', '#ff99ff']
      : ['#ffdd00', '#ff9900', '#ff33ff', '#ff0066'];

    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 2;
      const speed = Math.random() * 10 + 5;
      particles.current.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1.0,
        size: Math.random() * 6 + 3
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
      // 1. Draw Board - Premium gradient background
      const gradientBg = ctx.createLinearGradient(0, 0, BOARD_SIZE * SQUARE_SIZE, BOARD_SIZE * SQUARE_SIZE);
      gradientBg.addColorStop(0, '#1a0f2e');
      gradientBg.addColorStop(0.5, '#2d1b4e');
      gradientBg.addColorStop(1, '#1a0f2e');
      ctx.fillStyle = gradientBg;
      ctx.fillRect(0, 0, BOARD_SIZE * SQUARE_SIZE, BOARD_SIZE * SQUARE_SIZE);

      // Draw premium checkered pattern
      for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
          const renderCoords = getBoardCoordinates(x, y);
          const isLight = (x + y) % 2 === 0;
          
          if (isLight) {
            // Light squares - warm golden tone
            ctx.fillStyle = '#e8d5b7';
            ctx.fillRect(renderCoords.x * SQUARE_SIZE, renderCoords.y * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
            
            // Subtle texture overlay
            ctx.fillStyle = 'rgba(200, 180, 150, 0.05)';
            ctx.fillRect(renderCoords.x * SQUARE_SIZE, renderCoords.y * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
          } else {
            // Dark squares - deep purple-brown
            ctx.fillStyle = '#5d3a5d';
            ctx.fillRect(renderCoords.x * SQUARE_SIZE, renderCoords.y * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
            
            // Subtle shine effect
            ctx.fillStyle = 'rgba(100, 50, 100, 0.1)';
            ctx.fillRect(renderCoords.x * SQUARE_SIZE, renderCoords.y * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
          }
        }
      }

      // Border around board
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 3;
      ctx.strokeRect(0, 0, BOARD_SIZE * SQUARE_SIZE, BOARD_SIZE * SQUARE_SIZE);

      // 2. Highlight Last Move
      if (lastMove) {
        const fromCoords = getBoardCoordinates(lastMove.fromX, lastMove.fromY);
        const toCoords = getBoardCoordinates(lastMove.toX, lastMove.toY);
        ctx.fillStyle = 'rgba(255, 200, 50, 0.3)';
        ctx.fillRect(fromCoords.x * SQUARE_SIZE, fromCoords.y * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
        ctx.fillRect(toCoords.x * SQUARE_SIZE, toCoords.y * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
      }

      // 3. Highlight Selected
      if (selectedPiece) {
        const selCoords = getBoardCoordinates(selectedPiece.x, selectedPiece.y);
        ctx.fillStyle = 'rgba(200, 100, 255, 0.4)';
        ctx.fillRect(selCoords.x * SQUARE_SIZE, selCoords.y * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
        // Glow effect
        ctx.strokeStyle = 'rgba(200, 100, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(selCoords.x * SQUARE_SIZE + 2, selCoords.y * SQUARE_SIZE + 2, SQUARE_SIZE - 4, SQUARE_SIZE - 4);
      }

      // 4. Valid Moves with premium styling
      validMoves.forEach(move => {
        const moveCoords = getBoardCoordinates(move.x, move.y);
        if (move.isAttack) {
          const pulse = (Math.sin(Date.now() / 200) + 1) / 2;
          ctx.fillStyle = `rgba(255, 60, 60, ${0.3 + pulse * 0.3})`;
          ctx.beginPath();
          ctx.arc(
            moveCoords.x * SQUARE_SIZE + SQUARE_SIZE / 2,
            moveCoords.y * SQUARE_SIZE + SQUARE_SIZE / 2,
            20 + pulse * 5,
            0,
            Math.PI * 2
          );
          ctx.fill();
          // Inner glow
          ctx.strokeStyle = `rgba(255, 100, 100, ${0.6 + pulse * 0.2})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          ctx.fillStyle = 'rgba(100, 200, 100, 0.8)';
          ctx.beginPath();
          ctx.arc(
            moveCoords.x * SQUARE_SIZE + SQUARE_SIZE / 2,
            moveCoords.y * SQUARE_SIZE + SQUARE_SIZE / 2,
            10,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      });

      // 5. Draw Pieces with custom rendering
      boardState.forEach((row, y) => {
        row.forEach((piece, x) => {
          if (!piece) return;

          const pieceCoords = getBoardCoordinates(x, y);
          const pieceX = pieceCoords.x * SQUARE_SIZE;
          const pieceY = pieceCoords.y * SQUARE_SIZE;

          drawPremiumPiece(ctx, piece, pieceX, pieceY, SQUARE_SIZE);

          // HP Bar with premium styling
          if (piece.stats.hp < piece.stats.maxHP) {
            const healthPercent = piece.getHealthPercent();
            const barX = pieceX + 4;
            const barY = pieceY + SQUARE_SIZE - HP_BAR_HEIGHT - 4;
            const barWidth = HP_BAR_WIDTH;

            // Background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(barX, barY, barWidth, HP_BAR_HEIGHT);
            ctx.strokeStyle = 'rgba(200, 100, 255, 0.5)';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barWidth, HP_BAR_HEIGHT);

            // Health fill with gradient
            const healthGradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
            if (healthPercent > 0.5) {
              healthGradient.addColorStop(0, '#00ff00');
              healthGradient.addColorStop(1, '#ffff00');
            } else if (healthPercent > 0.25) {
              healthGradient.addColorStop(0, '#ffff00');
              healthGradient.addColorStop(1, '#ff6600');
            } else {
              healthGradient.addColorStop(0, '#ff6600');
              healthGradient.addColorStop(1, '#ff0000');
            }
            ctx.fillStyle = healthGradient;
            ctx.fillRect(barX, barY, barWidth * healthPercent, HP_BAR_HEIGHT);
          }
        });
      });

      // 6. Update & Draw Particles with glow
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.03;
        p.vy += 0.3; // Gravity
        p.vx *= 0.98; // Air resistance

        if (p.life <= 0) {
          particles.current.splice(i, 1);
        } else {
          // Glow effect
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.life * 0.6;
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size + 2, 0, Math.PI * 2);
          ctx.fill();
          
          // Core
          ctx.globalAlpha = p.life;
          ctx.shadowBlur = 0;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }
      }

      // 7. Draw Combat Text with premium styling
      if (animation && animation.type === 'combat') {
        const { toX, toY, fromX, fromY, combatResult } = animation.data;
        const toCoords = getBoardCoordinates(toX, toY);
        const fromCoords = getBoardCoordinates(fromX, fromY);
        const elapsed = Date.now() - animation.startTime;
        const duration = 1200;

        if (elapsed < duration) {
          const centerX = toCoords.x * SQUARE_SIZE + SQUARE_SIZE / 2;
          const centerY = toCoords.y * SQUARE_SIZE + SQUARE_SIZE / 2;
          const floatOffset = (elapsed / duration) * 60;
          const alpha = Math.max(0, 1 - (elapsed / duration * 0.8));
          const scale = 1 + (elapsed / duration) * 0.3;

          // Damage Text with glow
          const dmgText = `-${combatResult.attackDamage}`;
          ctx.font = 'bold 42px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Glow layers
          for (let i = 5; i > 0; i--) {
            ctx.fillStyle = `rgba(255, 100, 100, ${alpha * 0.2 * (1 - i / 5)})`;
            ctx.fillText(dmgText, centerX, centerY - floatOffset - i);
          }
          
          ctx.fillStyle = `rgba(255, 50, 50, ${alpha})`;
          ctx.strokeStyle = `rgba(255, 200, 100, ${alpha * 0.8})`;
          ctx.lineWidth = 3;
          ctx.strokeText(dmgText, centerX, centerY - floatOffset);
          ctx.fillText(dmgText, centerX, centerY - floatOffset);

          // Counter Damage
          if (combatResult.defenderCounterDamage > 0) {
            const originX = fromCoords.x * SQUARE_SIZE + SQUARE_SIZE / 2;
            const originY = fromCoords.y * SQUARE_SIZE + SQUARE_SIZE / 2;
            const counterText = `-${combatResult.defenderCounterDamage}`;
            
            // Glow layers
            for (let i = 5; i > 0; i--) {
              ctx.fillStyle = `rgba(255, 150, 50, ${alpha * 0.2 * (1 - i / 5)})`;
              ctx.fillText(counterText, originX, originY - floatOffset - i);
            }
            
            ctx.fillStyle = `rgba(255, 140, 0, ${alpha})`;
            ctx.strokeStyle = `rgba(255, 200, 100, ${alpha * 0.8})`;
            ctx.lineWidth = 3;
            ctx.strokeText(counterText, originX, originY - floatOffset);
            ctx.fillText(counterText, originX, originY - floatOffset);
          }
        }
      }

      // 8. AI Thinking Overlay with premium styling
      if (isAIThinking) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, BOARD_SIZE * SQUARE_SIZE, BOARD_SIZE * SQUARE_SIZE);
        
        const pulse = (Math.sin(Date.now() / 300) + 1) / 2;
        
        // Animated glow
        ctx.fillStyle = `rgba(200, 100, 255, ${0.3 + pulse * 0.3})`;
        ctx.beginPath();
        ctx.arc((BOARD_SIZE * SQUARE_SIZE) / 2, (BOARD_SIZE * SQUARE_SIZE) / 2, 40 + pulse * 20, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = `rgba(255, 255, 255, ${0.7 + pulse * 0.2})`;
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('AI is thinking...', (BOARD_SIZE * SQUARE_SIZE) / 2, (BOARD_SIZE * SQUARE_SIZE) / 2);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [boardState, selectedPiece, validMoves, isAIThinking, animation, lastMove, boardFlipped]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    let x = Math.floor((e.clientX - rect.left) / SQUARE_SIZE);
    let y = Math.floor((e.clientY - rect.top) / SQUARE_SIZE);
    
    // Flip only in two-player mode (vs AI shouldn't flip)
    if (gameMode === 'two-player' && boardFlipped) {
      x = 7 - x;
      y = 7 - y;
    }
    
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