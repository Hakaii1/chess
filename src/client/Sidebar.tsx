/**
 * Sidebar.tsx -> TopHUD.tsx
 * Revamped to be a horizontal HUD bar
 */

import React, { useMemo } from 'react';
import { PieceColor, PieceType, Piece } from '../core';
import styles from './Sidebar.module.css';

interface SidebarProps {
  currentTurn: PieceColor;
  gameStatus: string;
  turnCount: number;
  winner: PieceColor | null;
  onResetGame: () => void;
  boardState: (Piece | null)[][];
  gameMode?: 'single-player' | 'two-player';
  boardFlipped?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTurn,
  gameStatus,
  turnCount,
  onResetGame,
  boardState
}) => {
  const { whiteKing, blackKing } = useMemo(() => {
    let wKing: Piece | null = null;
    let bKing: Piece | null = null;
    boardState.forEach(row => {
      row.forEach(piece => {
        if (!piece) return;
        if (piece.type === PieceType.KING) {
          if (piece.color === PieceColor.WHITE) wKing = piece;
          else bKing = piece;
        }
      });
    });
    return { whiteKing: wKing, blackKing: bKing };
  }, [boardState]);

  const renderHealthBar = (king: Piece | null, label: string, color: string) => {
    if (!king) return null;
    const percent = (king.stats.hp / king.stats.maxHP) * 100;
    
    return (
      <div className={styles.bossBarWrapper}>
        <div className={styles.bossBarLabel} style={{ color }}>{label}</div>
        <div className={styles.bossBarTrack}>
          <div 
            className={styles.bossBarFill} 
            style={{ 
              width: `${percent}%`,
              background: color,
              boxShadow: `0 0 10px ${color}`
            }} 
          />
        </div>
        <div className={styles.bossBarValue}>{king.stats.hp}/{king.stats.maxHP}</div>
      </div>
    );
  };

  return (
    <div className={styles.hudBar}>
      <div className={styles.leftSide}>
        {renderHealthBar(whiteKing, "WHITE KING", "#4deeea")}
      </div>

      <div className={styles.centerInfo}>
        <div className={styles.turnIndicator}>
          TURN {turnCount}
        </div>
        <div className={styles.turnPlayer} style={{ color: currentTurn === PieceColor.WHITE ? '#4deeea' : '#ff5555' }}>
          {currentTurn === PieceColor.WHITE ? "WHITE'S MOVE" : "BLACK'S MOVE"}
        </div>
      </div>

      <div className={styles.rightSide}>
        {renderHealthBar(blackKing, "BLACK KING", "#ff5555")}
        <button className={styles.miniResetBtn} onClick={onResetGame} title="Reset Game">
          ⟳
        </button>
      </div>
    </div>
  );
};