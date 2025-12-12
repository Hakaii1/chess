/**
 * KingRescueModal.tsx
 * Modal displayed when the King is trapped, offering special abilities.
 */

import React from 'react';
import styles from './KingRescueModal.module.css';

interface KingRescueModalProps {
  onSelectAbility: (ability: 'teleport' | 'swap') => void;
}

export const KingRescueModal: React.FC<KingRescueModalProps> = ({ onSelectAbility }) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.warningHeader}>⚠️ KING TRAPPED ⚠️</div>
        <h2 className={styles.title}>EMERGENCY PROTOCOL</h2>
        <p className={styles.subtitle}>
          The King is cornered. Choose an escape maneuver.<br/>
          <strong>Bonus:</strong> King gains 80% Damage Reduction for 3 turns.
        </p>

        <div className={styles.cardContainer}>
          <div className={styles.card} onClick={() => onSelectAbility('teleport')}>
            <div className={styles.icon}>🌀</div>
            <h3>Quantum Warp</h3>
            <p>Teleport to ANY empty square on the board.</p>
          </div>

          <div className={styles.card} onClick={() => onSelectAbility('swap')}>
            <div className={styles.icon}>⇄</div>
            <h3>Royal Exchange</h3>
            <p>Swap positions with any allied piece.</p>
          </div>
        </div>
      </div>
    </div>
  );
};