/**
 * Sidebar.tsx
 * Shows game info: King Health Bars, current turn, piece stats, game status
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
  boardState: (Piece | null)[][]; // Added to calculate King HP
  gameMode?: 'single-player' | 'two-player';
  boardFlipped?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTurn,
  gameStatus,
  turnCount,
  winner,
  onResetGame,
  boardState,
  gameMode = 'single-player',
  boardFlipped = false
}) => {
  // Find Kings and get their stats
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

  const renderHealthBar = (king: Piece | null, label: string) => {
    if (!king) return null;
    const percent = (king.stats.hp / king.stats.maxHP) * 100;
    
    return (
      <div className={styles.healthBarContainer}>
        <div className={styles.healthInfo}>
          <span>{label}</span>
          <span>{king.stats.hp}/{king.stats.maxHP}</span>
        </div>
        <div className={styles.healthTrack}>
          <div 
            className={styles.healthFill} 
            style={{ 
              width: `${percent}%`,
              background: percent < 30 ? '#e74c3c' : percent < 60 ? '#f1c40f' : '#2ecc71'
            }} 
          />
        </div>
      </div>
    );
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <h1>⚔️ Battle Chess</h1>
      </div>

      {/* King Health Section (Boss Bars) */}
      <div className={styles.section}>
        <h2>Commanders</h2>
        {renderHealthBar(blackKing, "♚ Black King")}
        <div style={{ height: 10 }} />
        {renderHealthBar(whiteKing, "♔ White King")}
      </div>

      <div className={styles.section}>
        <h2>Game Status</h2>
        <div className={styles.statusBox}>
          {gameStatus === 'game-over' ? (
            <>
              <p className={styles.gameOverText}>🏆 GAME OVER 🏆</p>
              <p className={styles.winner}>
                {winner === PieceColor.WHITE ? '♔ White' : '♚ Black'} Wins!
              </p>
            </>
          ) : (
            <>
              <p className={styles.currentTurn}>
                Current Turn: <span style={{ color: currentTurn === PieceColor.WHITE ? '#fff' : '#aaa' }}>
                  {currentTurn === PieceColor.WHITE ? '♔ White' : '♚ Black'}
                </span>
              </p>
              <p className={styles.turnCount}>Turn {turnCount}</p>
              {gameMode === 'two-player' && boardFlipped && (
                <p className={styles.boardFlipInfo}>📺 Board Flipped for Black</p>
              )}
            </>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <h2>Controls</h2>
        <button className={styles.resetButton} onClick={onResetGame}>
          🔄 New Game
        </button>
      </div>

      <div className={styles.section}>
        <h2>Piece Stats</h2>
        <div className={styles.statsTable}>
          <div className={styles.statRow}>
            <span className={styles.piece}>♙</span>
            <span>Pawn</span>
            <span className={styles.stats}>HP:20 ATK:5</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.piece}>♘</span>
            <span>Knight</span>
            <span className={styles.stats}>HP:35 ATK:15</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.piece}>♗</span>
            <span>Bishop</span>
            <span className={styles.stats}>HP:30 ATK:12</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.piece}>♖</span>
            <span>Rook</span>
            <span className={styles.stats}>HP:45 ATK:18</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.piece}>♕</span>
            <span>Queen</span>
            <span className={styles.stats}>HP:60 ATK:25</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.piece}>♔</span>
            <span>King</span>
            <span className={styles.stats}>HP:50 ATK:10</span>
          </div>
        </div>
      </div>
    </div>
  );
};