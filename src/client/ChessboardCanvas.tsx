/**
 * ChessboardCanvas.tsx
 * Canvas-based board renderer
 * Features: Stat Tooltips, Neon Terrain, Smart Cursor
 */

import React, { useRef, useEffect, useState } from 'react';
import { Piece, PieceColor, PieceType, ValidMove, PieceClass } from '../core';
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
}

const BOARD_SIZE = 8;
const SQUARE_SIZE = 70;
const HP_BAR_HEIGHT = 6;
const HP_BAR_WIDTH = SQUARE_SIZE - 8;

interface Particle {
  x: number; y: number; vx: number; vy: number; color: string; life: number; size: number;
}

const PIECE_SYMBOLS: Record<PieceType, Record<PieceColor, string>> = {
  [PieceType.PAWN]: { [PieceColor.WHITE]: '♙', [PieceColor.BLACK]: '♟' },
  [PieceType.KNIGHT]: { [PieceColor.WHITE]: '♘', [PieceColor.BLACK]: '♞' },
  [PieceType.BISHOP]: { [PieceColor.WHITE]: '♗', [PieceColor.BLACK]: '♝' },
  [PieceType.ROOK]: { [PieceColor.WHITE]: '♖', [PieceColor.BLACK]: '♜' },
  [PieceType.QUEEN]: { [PieceColor.WHITE]: '♕', [PieceColor.BLACK]: '♛' },
  [PieceType.KING]: { [PieceColor.WHITE]: '♔', [PieceColor.BLACK]: '♚' }
};

const CLASS_ICONS: Record<PieceClass, string> = {
  [PieceClass.TANK]: '🛡️',
  [PieceClass.MELEE]: '⚔️',
  [PieceClass.RANGED]: '🏹'
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
  currentTurn
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animation, setAnimation] = useState<any>(null);
  const particles = useRef<Particle[]>([]);
  const [hoveredSquare, setHoveredSquare] = useState<{x: number, y: number} | null>(null);

  useEffect(() => {
    if (lastMove) {
      setAnimation({
        startTime: Date.now(),
        type: lastMove.combatResult ? 'combat' : 'move',
        data: lastMove
      });
      if (lastMove.combatResult && !lastMove.combatResult.defenderAlive) {
        spawnParticles(lastMove.toX, lastMove.toY, lastMove.combatResult.defender.color);
      }
      const timer = setTimeout(() => setAnimation(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [lastMove]);

  const getBoardCoordinates = (x: number, y: number) => {
    if (gameMode === 'two-player' && boardFlipped) {
      return { x: 7 - x, y: 7 - y };
    }
    return { x, y };
  };

  const spawnParticles = (gx: number, gy: number, color: PieceColor) => {
    const coords = getBoardCoordinates(gx, gy);
    const centerX = coords.x * SQUARE_SIZE + SQUARE_SIZE / 2;
    const centerY = coords.y * SQUARE_SIZE + SQUARE_SIZE / 2;
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      // 1. Draw Board Background
      ctx.fillStyle = '#1a0f2e';
      ctx.fillRect(0, 0, BOARD_SIZE * SQUARE_SIZE, BOARD_SIZE * SQUARE_SIZE);

      for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
          const renderCoords = getBoardCoordinates(x, y);
          const isLight = (x + y) % 2 === 0;
          const px = renderCoords.x * SQUARE_SIZE;
          const py = renderCoords.y * SQUARE_SIZE;

          // Default Colors
          let fillColor = isLight ? '#e8d5b7' : '#5d3a5d';
          let overlayColor = null;

          // TERRAIN RENDERING (Neon Style)
          if (terrain) {
            const tileType = terrain[y][x];
            if (tileType === 'fire') {
              fillColor = isLight ? '#3a1a1a' : '#2a0f0f';
              overlayColor = 'rgba(255, 50, 50, 0.15)'; // Red glow
            }
            if (tileType === 'water') {
              fillColor = isLight ? '#1a2a3a' : '#0f1f2f';
              overlayColor = 'rgba(50, 100, 255, 0.15)'; // Blue glow
            }
            if (tileType === 'forest') {
              fillColor = isLight ? '#1a3a1a' : '#0f2f0f';
              overlayColor = 'rgba(50, 255, 50, 0.1)'; // Green glow
            }
          }

          ctx.fillStyle = fillColor;
          ctx.fillRect(px, py, SQUARE_SIZE, SQUARE_SIZE);

          if (overlayColor) {
            ctx.fillStyle = overlayColor;
            ctx.fillRect(px, py, SQUARE_SIZE, SQUARE_SIZE);
            // Border glow
            ctx.strokeStyle = overlayColor.replace('0.15', '0.5');
            ctx.lineWidth = 1;
            ctx.strokeRect(px + 2, py + 2, SQUARE_SIZE - 4, SQUARE_SIZE - 4);
          }

          // Add icons for terrain
          if (terrain && terrain[y][x] !== 'normal') {
             ctx.font = '16px Arial';
             ctx.textAlign = 'right';
             ctx.textBaseline = 'top';
             const icon = terrain[y][x] === 'fire' ? '🔥' : terrain[y][x] === 'water' ? '💧' : '🌲';
             ctx.fillText(icon, px + SQUARE_SIZE - 4, py + 4);
          }
        }
      }

      // Border
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 3;
      ctx.strokeRect(0, 0, BOARD_SIZE * SQUARE_SIZE, BOARD_SIZE * SQUARE_SIZE);

      // 2. Highlights & Moves
      if (lastMove) {
        const from = getBoardCoordinates(lastMove.fromX, lastMove.fromY);
        const to = getBoardCoordinates(lastMove.toX, lastMove.toY);
        ctx.fillStyle = 'rgba(255, 200, 50, 0.2)';
        ctx.fillRect(from.x * SQUARE_SIZE, from.y * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
        ctx.fillRect(to.x * SQUARE_SIZE, to.y * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
      }

      if (selectedPiece) {
        const sel = getBoardCoordinates(selectedPiece.x, selectedPiece.y);
        ctx.fillStyle = 'rgba(200, 100, 255, 0.3)';
        ctx.fillRect(sel.x * SQUARE_SIZE, sel.y * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2;
        ctx.strokeRect(sel.x * SQUARE_SIZE, sel.y * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
      }

      validMoves.forEach(move => {
        const mc = getBoardCoordinates(move.x, move.y);
        const cx = mc.x * SQUARE_SIZE + SQUARE_SIZE / 2;
        const cy = mc.y * SQUARE_SIZE + SQUARE_SIZE / 2;
        
        if (move.isAttack) {
          ctx.fillStyle = 'rgba(255, 50, 50, 0.5)';
          ctx.beginPath();
          ctx.arc(cx, cy, 25, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'red';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          ctx.fillStyle = 'rgba(100, 255, 100, 0.5)';
          ctx.beginPath();
          ctx.arc(cx, cy, 12, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 3. Pieces
      boardState.forEach((row, y) => {
        row.forEach((piece, x) => {
          if (!piece) return;
          const pc = getBoardCoordinates(x, y);
          drawPiece(ctx, piece, pc.x * SQUARE_SIZE, pc.y * SQUARE_SIZE);
        });
      });

      // 4. Particles & Combat Text (Existing logic...)
      // ... (Keeping particles logic from before)
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        p.x += p.vx; p.y += p.vy; p.life -= 0.03; p.vy += 0.3; p.vx *= 0.98;
        if (p.life <= 0) particles.current.splice(i, 1);
        else {
          ctx.fillStyle = p.color; ctx.globalAlpha = p.life;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1.0;
        }
      }

      if (animation && animation.type === 'combat') {
        const { toX, toY, fromX, fromY, combatResult } = animation.data;
        const to = getBoardCoordinates(toX, toY);
        const from = getBoardCoordinates(fromX, fromY);
        const elapsed = Date.now() - animation.startTime;
        const duration = 1200;

        if (elapsed < duration) {
          const alpha = Math.max(0, 1 - (elapsed / duration));
          const offset = (elapsed / duration) * 50;
          
          ctx.font = 'bold 36px Arial';
          ctx.textAlign = 'center';
          
          // Damage
          ctx.fillStyle = `rgba(255, 50, 50, ${alpha})`;
          ctx.fillText(`-${combatResult.attackDamage}`, to.x * SQUARE_SIZE + 35, to.y * SQUARE_SIZE + 35 - offset);

          // Counter
          if (combatResult.defenderCounterDamage > 0) {
            ctx.fillStyle = `rgba(255, 150, 0, ${alpha})`;
            ctx.fillText(`-${combatResult.defenderCounterDamage}`, from.x * SQUARE_SIZE + 35, from.y * SQUARE_SIZE + 35 - offset);
          }
        }
      }

      // 5. TOOLTIPS (New Feature)
      if (hoveredSquare && !isAIThinking) {
        // Need to reverse flip logic to get actual board index
        let actualX = hoveredSquare.x;
        let actualY = hoveredSquare.y;
        
        if (gameMode === 'two-player' && boardFlipped) {
          actualX = 7 - hoveredSquare.x;
          actualY = 7 - hoveredSquare.y;
        }

        if (actualX >= 0 && actualX < 8 && actualY >= 0 && actualY < 8) {
          const hoveredPiece = boardState[actualY][actualX];
          if (hoveredPiece) {
            drawTooltip(ctx, hoveredPiece, hoveredSquare.x * SQUARE_SIZE, hoveredSquare.y * SQUARE_SIZE, terrain ? terrain[actualY][actualX] : 'normal');
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [boardState, terrain, selectedPiece, validMoves, isAIThinking, animation, lastMove, boardFlipped, hoveredSquare]);

  const drawPiece = (ctx: CanvasRenderingContext2D, piece: Piece, x: number, y: number) => {
    const cx = x + SQUARE_SIZE / 2;
    const cy = y + SQUARE_SIZE / 2;
    const isWhite = piece.color === PieceColor.WHITE;

    // Piece Background
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.fillStyle = isWhite ? '#ddd' : '#333';
    ctx.fill();
    ctx.strokeStyle = isWhite ? '#fff' : '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Symbol
    ctx.font = '40px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isWhite ? 'black' : 'white'; // Contrast text
    ctx.fillText(PIECE_SYMBOLS[piece.type][piece.color], cx, cy);

    // HP Bar
    const hpPct = piece.stats.hp / piece.stats.maxHP;
    const barW = SQUARE_SIZE - 10;
    const barX = x + 5;
    const barY = y + SQUARE_SIZE - 8;
    
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, 6);
    ctx.fillStyle = hpPct > 0.5 ? '#00ff00' : hpPct > 0.2 ? '#ffff00' : '#ff0000';
    ctx.fillRect(barX, barY, barW * hpPct, 6);
  };

  const drawTooltip = (ctx: CanvasRenderingContext2D, piece: Piece, x: number, y: number, tileType: string) => {
    // Tooltip Box
    const boxW = 160;
    const boxH = 95;
    let boxX = x + 20;
    let boxY = y - 100;

    // Boundary check
    if (boxY < 0) boxY = y + 80;
    if (boxX + boxW > 560) boxX = x - 140;

    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = 'rgba(20, 20, 30, 0.95)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX, boxY, boxW, boxH);
    ctx.shadowBlur = 0;

    // Text
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    
    // Header: Icon + Name
    const name = piece.type.charAt(0).toUpperCase() + piece.type.slice(1);
    ctx.fillText(`${CLASS_ICONS[piece.stats.pClass]} ${name}`, boxX + 10, boxY + 10);

    // Stats
    ctx.font = '12px monospace';
    ctx.fillStyle = '#ccc';
    ctx.fillText(`HP:  ${piece.stats.hp}/${piece.stats.maxHP}`, boxX + 10, boxY + 35);
    ctx.fillText(`ATK: ${piece.stats.atk}`, boxX + 10, boxY + 50);
    
    // Def + Terrain Bonus
    let defText = `DEF: ${piece.stats.def}`;
    if (tileType === 'forest') {
      ctx.fillStyle = '#66ff66'; // Green for buff
      defText += ` (+3 🌲)`;
    }
    ctx.fillText(defText, boxX + 10, boxY + 65);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.floor((e.clientX - rect.left) / SQUARE_SIZE);
    const y = Math.floor((e.clientY - rect.top) / SQUARE_SIZE);
    
    if (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
      setHoveredSquare({x, y});
      
      // Dynamic Cursor
      let cursor = 'default';
      const isPiece = boardState.some(row => row.some(p => p && p.x === x && p.y === y)); // Simplified check
      
      // Check if this square is a valid move/attack
      const validMove = validMoves.find(m => {
        let checkX = m.x; let checkY = m.y;
        if (gameMode === 'two-player' && boardFlipped) {
           checkX = 7 - checkX; checkY = 7 - checkY;
        }
        return checkX === x && checkY === y;
      });

      if (validMove) {
        cursor = validMove.isAttack ? 'crosshair' : 'pointer';
      } else if (isPiece && !isAIThinking) {
        cursor = 'help'; // Hovering over a piece for stats
      }
      
      if (canvasRef.current) canvasRef.current.style.cursor = cursor;
    } else {
      setHoveredSquare(null);
    }
  };

  const handleMouseLeave = () => setHoveredSquare(null);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!hoveredSquare) return;
    let { x, y } = hoveredSquare;
    if (gameMode === 'two-player' && boardFlipped) {
      x = 7 - x; y = 7 - y;
    }
    onSquareClick(x, y);
  };

  return (
    <div className={styles.canvasContainer}>
      <canvas
        ref={canvasRef}
        width={560}
        height={560}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleCanvasClick}
        className={styles.canvas}
      />
    </div>
  );
};