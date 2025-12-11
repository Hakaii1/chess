/**
 * GameModeSelector.tsx
 * Modal for choosing between AI vs Player mode at the start of the game
 */

import React from 'react';
import styles from './GameModeSelector.module.css';

interface GameModeSelectorProps {
  onSelectMode: (mode: 'single-player' | 'two-player') => void;
}

export const GameModeSelector: React.FC<GameModeSelectorProps> = ({ onSelectMode }) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h1 className={styles.title}>Battle Chess</h1>
        <p className={styles.subtitle}>Choose Your Game Mode</p>

        <div className={styles.buttonContainer}>
          <button
            className={styles.button}
            onClick={() => onSelectMode('single-player')}
          >
            <div className={styles.buttonIcon}>🤖</div>
            <h2>vs AI</h2>
            <p>Challenge the computer opponent</p>
          </button>

          <button
            className={styles.button}
            onClick={() => onSelectMode('two-player')}
          >
            <div className={styles.buttonIcon}>👥</div>
            <h2>vs Player</h2>
            <p>Play against a friend (pass & play)</p>
          </button>
        </div>

        <div className={styles.info}>
          <p>💡 Pieces engage in combat. Losers disappear, winners stay and fight.</p>
        </div>
      </div>
    </div>
  );
};
