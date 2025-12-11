/**
 * ChessboardCanvas.tsx
 * "Royal Dark Fantasy" Theme
 * Blends with BattleScene.tsx using Gold, Purple, and Onyx.
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
  currentTurn?: PieceColor; // Added to accept current turn from parent
}

const TILE_SIZE = 80;
const CANVAS_SIZE = TILE_SIZE * 8;

// Royal / Battle Scene Palette
const COLORS = {
  // Board Tiles
  lightSquare: '#2f2b3a', // Dark Muted Purple/Grey (Matches "White" card bg)
  darkSquare: '#151019',  // Almost Black/Onyx (Matches "Black" card bg)
  
  // Highlights
  highlight: 'rgba(212, 175, 55, 0.2)',     // Gold Selection
  moveDot: 'rgba(212, 175, 55, 0.3)',       // Gold Move Dot
  attackRing: 'rgba(255, 50, 50, 0.5)',     // Red Attack Ring
  lastMove: 'rgba(212, 175, 55, 0.15)',     // Subtle Gold
  
  // Pieces
  whitePiece: '#e0e0e0', // Silver/White
  blackPiece: '#d4af37'  // Gold (for Black pieces to stand out on dark board) 
                         // OR keep standard White/Black but styled. 
                         // Let's stick to Silver vs Gold for a "Royal" feel.
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
  gameMode = 'single-player'
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

      // 1. Draw Board
      for (let ry = 0; ry < 8; ry++) {
        for (let rx = 0; rx < 8; rx++) {
          const { x, y } = getLogicCoords(rx, ry);
          const px = rx * TILE_SIZE;
          const py = ry * TILE_SIZE;

          const isLight = (x + y) % 2 === 0;
          ctx.fillStyle = isLight ? COLORS.lightSquare : COLORS.darkSquare;
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

          // 2. Highlight Last Move
          const isLastMove = lastMove && ((lastMove.fromX === x && lastMove.fromY === y) || (lastMove.toX === x && lastMove.toY === y));
          if (isLastMove) {
            ctx.fillStyle = COLORS.lastMove;
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          }

          // 3. Highlight Selection
          const isSelected = selectedPiece?.x === x && selectedPiece?.y === y;
          if (isSelected) {
            ctx.fillStyle = COLORS.highlight;
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            // Gold Border for selection
            ctx.strokeStyle = '#d4af37'; 
            ctx.lineWidth = 2;
            ctx.strokeRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
          }

          // 4. Draw Terrain (Classy Icons)
          const tileType = terrain ? terrain[y][x] : 'normal';
          if (tileType !== 'normal') {
            drawTerrainMarker(ctx, px, py, tileType);
          }

          // 5. Draw Valid Move Indicators
          const isValidMove = validMoves.find(m => m.x === x && m.y === y);
          if (isValidMove) {
             if (isValidMove.isAttack) {
                // Threatening Red Ring
                ctx.strokeStyle = COLORS.attackRing;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2, TILE_SIZE/2 - 8, 0, Math.PI * 2);
                ctx.stroke();
             } else {
                // Gold Dot
                ctx.fillStyle = COLORS.moveDot;
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2, 6, 0, Math.PI * 2);
                ctx.fill();
             }
          }

          // 6. Draw Piece
          const piece = boardState[y][x];
          if (piece) {
            drawPiece(ctx, piece, px, py);
          }
          
          // Coordinate Labels (Subtle Gold)
          ctx.fillStyle = '#665577';
          ctx.font = '10px serif';
          if (ry === 7) {
            const files = ['a','b','c','d','e','f','g','h'];
            ctx.fillText(files[x], px + TILE_SIZE - 12, py + TILE_SIZE - 4);
          }
          if (rx === 0) {
            ctx.fillText((8-y).toString(), px + 3, py + 12);
          }
        }
      }
      
      // Board Border
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    };
    render();
  }, [boardState, terrain, selectedPiece, validMoves, hoveredSquare, isAIThinking, lastMove]);

  const drawTerrainMarker = (ctx: CanvasRenderingContext2D, x: number, y: number, type: string) => {
     let color = '';
     let label = '';
     // Muted colors to fit dark theme
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
    
    // "Royal" Pieces: Silver (White) vs Gold (Black)
    // To ensure contrast on dark board:
    // White Pieces = Bright Silver/White
    // Black Pieces = Gold/Amber
    
    if (isWhite) {
        ctx.fillStyle = '#f0f0f0'; // Bright Silver
        ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
        ctx.shadowBlur = 10;
        ctx.fillText(PIECE_ICONS[piece.type], cx, cy);
        ctx.shadowBlur = 0;
    } else {
        ctx.fillStyle = '#ffb74d'; // Gold/Amber
        ctx.shadowColor = 'rgba(255, 183, 77, 0.3)';
        ctx.shadowBlur = 10;
        ctx.fillText(PIECE_ICONS[piece.type], cx, cy);
        ctx.shadowBlur = 0;
    }

    // RPG Stats: Elegant thin line
    const hpPct = piece.stats.hp / piece.stats.maxHP;
    if (hpPct < 1.0) { 
        const barW = TILE_SIZE - 20;
        const barX = x + 10;
        const barY = y + TILE_SIZE - 8;
        
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(barX, barY, barW, 3);
        
        // Gradient Bar
        const gradient = ctx.createLinearGradient(barX, 0, barX + barW, 0);
        gradient.addColorStop(0, '#d4af37'); // Gold
        gradient.addColorStop(1, '#ff3333'); // Red
        
        ctx.fillStyle = hpPct > 0.5 ? '#d4af37' : '#ff3333';
        ctx.fillRect(barX, barY, barW * hpPct, 3);
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
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const rx = Math.floor(mouseX / TILE_SIZE);
    const ry = Math.floor(mouseY / TILE_SIZE);

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