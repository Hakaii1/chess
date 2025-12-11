/**
 * CombatLog.tsx
 * Displays the history of moves and combat events
 */

import React, { useEffect, useRef } from 'react';
import styles from './CombatLog.module.css';

interface CombatLogProps {
  logs: string[];
}

export const CombatLog: React.FC<CombatLogProps> = ({ logs }) => {
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs appear
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className={styles.logContainer}>
      <h2>⚔️ Combat Log</h2>
      <div className={styles.logContent}>
        {logs.length === 0 ? (
          <p className={styles.emptyLog}>Game started. Make your move!</p>
        ) : (
          logs.map((log, index) => (
            <div key={index} className={styles.logEntry}>
              <span className={styles.logNumber}>{index + 1}.</span>
              <span className={styles.logText}>{log}</span>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
};
