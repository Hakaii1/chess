/**
 * ChessboardCanvas.tsx
 * "Royal Dark Fantasy" Theme
 * Updated: Stronger Last Move Highlights, Ability Targeting, Buff Indicators
 */

import React, { useRef, useEffect, useState } from 'react';
import { Piece, PieceColor, PieceType, ValidMove } from '../core';
import { TileType } from '../core/Board'; 
import styles from './ChessboardCanvas.module.css';

interface ChessboardCanvasProps {
  boardState: (Piece | null)[][];
  terrain?: TileType[][];
  selectedPiece: Piece | null;
  validMoves: ValidMove[];
  onSquareClick: (x: number, y: number) => void;
  isAIThinking: boolean;
  lastMove?: any;
  boardFlipped?: boolean;
  gameMode?: string;
  currentTurn?: PieceColor;
  // New Props
  isRescueMode?: boolean;
  activeAbility?: string | null;
}

const TILE_SIZE = 80;
const CANVAS_SIZE = TILE_SIZE * 8;

const COLORS = {
  lightSquare: '#2f2b3a',
  darkSquare: '#151019',
  highlight: 'rgba(212, 175, 55, 0.2)',
  moveDot: 'rgba(212, 175, 55, 0.3)',
  attackRing: 'rgba(255, 50, 50, 0.5)',
  lastMove: 'rgba(212, 175, 55, 0.4)', // Increased visibility
  abilityTarget: 'rgba(100, 255, 100, 0.3)' // Green for rescue targets
};

const PIECE_ICONS: Record<PieceType, string> = {
  [PieceType.PAWN]: '♟', 
  [PieceType.KNIGHT]: '♞',
  [PieceType.BISHOP]: '♝',
  [PieceType.ROOK]: '♜',
  [PieceType.QUEEN]: '♛',
  [PieceType.KING]: '♚'
};

export const ChessboardCanvas: React.FC<ChessboardCanvasProps> = ({
  boardState,
  terrain,
  selectedPiece,
  validMoves,
  onSquareClick,
  isAIThinking,
  lastMove,
  boardFlipped = false,
  gameMode = 'single-player',
  currentTurn,
  isRescueMode,
  activeAbility
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredSquare, setHoveredSquare] = useState<{x: number, y: number} | null>(null);

  const getLogicCoords = (rx: number, ry: number) => {
    const col = gameMode === 'two-player' && boardFlipped ? 7 - rx : rx;
    const row = gameMode === 'two-player' && boardFlipped ? 7 - ry : ry;
    return { x: col, y: row };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let ry = 0; ry < 8; ry++) {
        for (let rx = 0; rx < 8; rx++) {
          const { x, y } = getLogicCoords(rx, ry);
          const px = rx * TILE_SIZE;
          const py = ry * TILE_SIZE;

          // 1. Draw Board Base
          const isLight = (x + y) % 2 === 0;
          ctx.fillStyle = isLight ? COLORS.lightSquare : COLORS.darkSquare;
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

          // 2. Highlight Last Move (Updated for Better Visibility)
          const isLastMove = lastMove && ((lastMove.fromX === x && lastMove.fromY === y) || (lastMove.toX === x && lastMove.toY === y));
          if (isLastMove) {
            ctx.fillStyle = COLORS.lastMove;
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            // Add a border to make it distinct
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
          }

          // 3. Highlight Selection
          const isSelected = selectedPiece?.x === x && selectedPiece?.y === y;
          if (isSelected) {
            ctx.fillStyle = COLORS.highlight;
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = '#d4af37'; 
            ctx.lineWidth = 2;
            ctx.strokeRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
          }

          // 4. Terrain Markers
          const tileType = terrain ? terrain[y][x] : 'normal';
          if (tileType !== 'normal') {
            drawTerrainMarker(ctx, px, py, tileType);
          }

          // 5. Special Ability Targeting (Rescue Mode)
          if (isRescueMode && activeAbility) {
            const piece = boardState[y][x];
            let isValidTarget = false;
            
            if (activeAbility === 'teleport' && !piece) isValidTarget = true;
            if (activeAbility === 'swap' && piece && piece.color === currentTurn) isValidTarget = true;

            if (isValidTarget) {
               ctx.fillStyle = COLORS.abilityTarget;
               ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
               ctx.strokeStyle = '#0f0';
               ctx.lineWidth = 1;
               ctx.strokeRect(px+2, py+2, TILE_SIZE-4, TILE_SIZE-4);
            }
          }

          // 6. Draw Valid Move Indicators (Standard Mode)
          if (!isRescueMode) {
            const isValidMove = validMoves.find(m => m.x === x && m.y === y);
            if (isValidMove) {
               if (isValidMove.isAttack) {
                  ctx.strokeStyle = COLORS.attackRing;
                  ctx.lineWidth = 3;
                  ctx.beginPath();
                  ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2, TILE_SIZE/2 - 8, 0, Math.PI * 2);
                  ctx.stroke();
               } else {
                  ctx.fillStyle = COLORS.moveDot;
                  ctx.beginPath();
                  ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2, 6, 0, Math.PI * 2);
                  ctx.fill();
               }
            }
          }

          // 7. Draw Piece
          const piece = boardState[y][x];
          if (piece) {
            drawPiece(ctx, piece, px, py);
          }
          
          // Coordinate Labels
          ctx.fillStyle = '#665577';
          ctx.font = '10px serif';
          if (ry === 7) ctx.fillText(['a','b','c','d','e','f','g','h'][x], px + TILE_SIZE - 12, py + TILE_SIZE - 4);
          if (rx === 0) ctx.fillText((8-y).toString(), px + 3, py + 12);
        }
      }
      
      // Board Border
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    };
    render();
  }, [boardState, terrain, selectedPiece, validMoves, hoveredSquare, isAIThinking, lastMove, isRescueMode, activeAbility]);

  const drawTerrainMarker = (ctx: CanvasRenderingContext2D, x: number, y: number, type: string) => {
     let color = '';
     let label = '';
     if (type === 'fire') { color = 'rgba(200, 50, 50, 0.15)'; label = '🔥'; }
     if (type === 'water') { color = 'rgba(50, 100, 200, 0.15)'; label = '💧'; }
     if (type === 'forest') { color = 'rgba(50, 150, 50, 0.15)'; label = '🌲'; }

     ctx.fillStyle = color;
     ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
     ctx.font = '12px Arial';
     ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
     ctx.fillText(label, x + TILE_SIZE - 16, y + 16);
  };

  const drawPiece = (ctx: CanvasRenderingContext2D, piece: Piece, x: number, y: number) => {
    const cx = x + TILE_SIZE / 2;
    const cy = y + TILE_SIZE / 2;
    const isWhite = piece.color === PieceColor.WHITE;
    
    ctx.font = `${TILE_SIZE * 0.75}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    if (isWhite) {
        ctx.fillStyle = '#f0f0f0';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
        ctx.shadowBlur = 10;
        ctx.fillText(PIECE_ICONS[piece.type], cx, cy);
        ctx.shadowBlur = 0;
    } else {
        ctx.fillStyle = '#ffb74d';
        ctx.shadowColor = 'rgba(255, 183, 77, 0.3)';
        ctx.shadowBlur = 10;
        ctx.fillText(PIECE_ICONS[piece.type], cx, cy);
        ctx.shadowBlur = 0;
    }

    // Health Bar
    const hpPct = piece.stats.hp / piece.stats.maxHP;
    if (hpPct < 1.0) { 
        const barW = TILE_SIZE - 20;
        const barX = x + 10;
        const barY = y + TILE_SIZE - 8;
        
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(barX, barY, barW, 3);
        
        const gradient = ctx.createLinearGradient(barX, 0, barX + barW, 0);
        gradient.addColorStop(0, '#d4af37');
        gradient.addColorStop(1, '#ff3333');
        
        ctx.fillStyle = hpPct > 0.5 ? '#d4af37' : '#ff3333';
        ctx.fillRect(barX, barY, barW * hpPct, 3);
    }

    // Buff Indicator (Blue Dot)
    if (piece.buffs && piece.buffs.length > 0) {
      ctx.fillStyle = '#00ffff';
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(x + TILE_SIZE - 12, y + 12, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const rx = Math.floor(mouseX / TILE_SIZE);
    const ry = Math.floor(mouseY / TILE_SIZE);

    if (rx >= 0 && rx < 8 && ry >= 0 && ry < 8) {
      const { x, y } = getLogicCoords(rx, ry);
      onSquareClick(x, y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const rx = Math.floor((e.clientX - rect.left) / TILE_SIZE);
    const ry = Math.floor((e.clientY - rect.top) / TILE_SIZE);

    if (rx >= 0 && rx < 8 && ry >= 0 && ry < 8) {
       setHoveredSquare({ x: rx, y: ry });
       canvasRef.current!.style.cursor = 'pointer';
    } else {
       setHoveredSquare(null);
       canvasRef.current!.style.cursor = 'default';
    }
  };

  return (
    <div className={styles.canvasContainer}>
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredSquare(null)}
        className={styles.canvas}
      />
    </div>
  );
};