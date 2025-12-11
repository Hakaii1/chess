/**
 * CombatLog.tsx
 * Displays the history of moves and combat events with animated battle scenes
 */

import React, { useEffect, useRef } from 'react';
import styles from './CombatLog.module.css';

interface CombatLogProps {
  logs: string[];
}

const PIECE_ICONS: Record<string, string> = {
  pawn: '♟',
  knight: '♞',
  bishop: '♝',
  rook: '♜',
  queen: '♛',
  king: '♚'
};

export const CombatLog: React.FC<CombatLogProps> = ({ logs }) => {
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs appear
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Parse combat log entries to extract piece information
  const getPieceInfo = (log: string) => {
    const pieceNames = ['Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King'];
    
    // Check if this is a combat log
    if (log.includes('attacks')) {
      const parts = log.split(' ');
      const pieceName = pieceNames.find(name => log.includes(name));
      return { pieceName, type: 'attack' };
    } else if (log.includes('counters')) {
      const pieceNames = ['Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King'];
      const pieceName = pieceNames.find(name => log.includes(name));
      return { pieceName, type: 'counter' };
    } else if (log.includes('defeated') || log.includes('Defeated')) {
      const pieceNames = ['Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King'];
      const pieceName = pieceNames.find(name => log.includes(name));
      return { pieceName, type: 'defeat' };
    }
    return { pieceName: null, type: 'move' };
  };

  return (
    <div className={styles.logContainer}>
      <h2>⚔️ Battle Log</h2>
      <div className={styles.logContent}>
        {logs.length === 0 ? (
          <p className={styles.emptyLog}>Battle log will appear here...</p>
        ) : (
          logs.map((log, index) => {
            const { pieceName, type } = getPieceInfo(log);
            return (
              <div key={index} className={`${styles.logEntry} ${styles[type]}`}>
                <span className={styles.logNumber}>{index + 1}.</span>
                <div className={styles.logContent_Inner}>
                  {pieceName && type !== 'move' && (
                    <span className={`${styles.battleIcon} ${styles[type]}`}>
                      {PIECE_ICONS[pieceName.toLowerCase()] || '⚔️'}
                    </span>
                  )}
                  <span className={styles.logText}>{log}</span>
                  {type === 'attack' && (
                    <div className={styles.attackAnimation}></div>
                  )}
                  {type === 'counter' && (
                    <div className={styles.counterAnimation}></div>
                  )}
                  {type === 'defeat' && (
                    <div className={styles.defeatAnimation}></div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
};
