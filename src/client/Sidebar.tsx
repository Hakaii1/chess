/**
 * Sidebar.tsx
 * Shows game info: current turn, piece stats, game status
 */

import React from 'react';
import { PieceColor } from '../core';
import styles from './Sidebar.module.css';

interface SidebarProps {
  currentTurn: PieceColor;
  gameStatus: string;
  turnCount: number;
  winner: PieceColor | null;
  onResetGame: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTurn,
  gameStatus,
  turnCount,
  winner,
  onResetGame
}) => {
  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <h1>⚔️ Battle Chess</h1>
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
                Current Turn: {currentTurn === PieceColor.WHITE ? '♔ White' : '♚ Black'}
              </p>
              <p className={styles.turnCount}>Turn {turnCount}</p>
            </>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <h2>Controls</h2>
        <button className={styles.resetButton} onClick={onResetGame}>
          🔄 Reset Game
        </button>
      </div>

      <div className={styles.section}>
        <h2>How to Play</h2>
        <ul className={styles.instructions}>
          <li>Click a piece to select it</li>
          <li>Green squares = move</li>
          <li>Red squares = attack</li>
          <li>Combat auto-resolves with damage</li>
          <li>King dies = Game Over</li>
        </ul>
      </div>

      <div className={styles.section}>
        <h2>Piece Stats</h2>
        <div className={styles.statsTable}>
          <div className={styles.statRow}>
            <span className={styles.piece}>♙</span>
            <span>Pawn</span>
            <span className={styles.stats}>HP:20 ATK:5 DEF:1</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.piece}>♘</span>
            <span>Knight</span>
            <span className={styles.stats}>HP:35 ATK:15 DEF:5</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.piece}>♗</span>
            <span>Bishop</span>
            <span className={styles.stats}>HP:30 ATK:12 DEF:3</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.piece}>♖</span>
            <span>Rook</span>
            <span className={styles.stats}>HP:45 ATK:18 DEF:8</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.piece}>♕</span>
            <span>Queen</span>
            <span className={styles.stats}>HP:60 ATK:25 DEF:10</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.piece}>♔</span>
            <span>King</span>
            <span className={styles.stats}>HP:50 ATK:10 DEF:10</span>
          </div>
        </div>
      </div>
    </div>
  );
};
