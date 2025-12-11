/**
 * CombatLog.tsx
 * Displays the history of moves and combat events with stylized visuals
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

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const parseLog = (log: string) => {
    const isAttack = log.includes('attacks');
    const isCounter = log.includes('counter-attacks');
    const isDefeat = log.includes('defeated');
    const isCastle = log.includes('castles');
    const isWin = log.includes('WINS');

    let type = 'move';
    if (isAttack) type = 'attack';
    if (isCounter) type = 'counter';
    if (isDefeat) type = 'defeat';
    if (isCastle) type = 'special';
    if (isWin) type = 'win';

    return { type, text: log };
  };

  const getCombatIcons = (text: string) => {
    // Extract pieces involved if possible "Pawn (white) attacks..."
    const pieces = ['Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King'];
    const found = pieces.filter(p => text.includes(p));
    
    if (found.length >= 2) {
      return (
        <div className={styles.battleVisual}>
          <span className={styles.iconLeft}>{PIECE_ICONS[found[0].toLowerCase()]}</span>
          <span className={styles.swords}>⚔️</span>
          <span className={styles.iconRight}>{PIECE_ICONS[found[1].toLowerCase()]}</span>
        </div>
      );
    }
    if (found.length === 1 && (text.includes('counter') || text.includes('defeated'))) {
       return <span className={styles.singleIcon}>{PIECE_ICONS[found[0].toLowerCase()]}</span>;
    }
    return null;
  };

  return (
    <div className={styles.logContainer}>
      <div className={styles.header}>
        <span className={styles.blink}>_</span> SYSTEM LOG
      </div>
      <div className={styles.logContent}>
        {logs.length === 0 ? (
          <p className={styles.emptyLog}>Waiting for battle initiation...</p>
        ) : (
          logs.map((log, index) => {
            const { type, text } = parseLog(log);
            return (
              <div key={index} className={`${styles.logEntry} ${styles[type]}`}>
                <span className={styles.lineNumber}>{(index + 1).toString().padStart(3, '0')}</span>
                <div className={styles.entryContent}>
                  {type === 'attack' && getCombatIcons(text)}
                  <span className={styles.logText}>{text}</span>
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