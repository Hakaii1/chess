/**
 * BattleScene.tsx
 * A cinematic overlay for 1v1 combat resolution - Premium Battle Experience
 */

import React, { useEffect, useState } from 'react';
import { CombatResult, Piece, PieceType, PieceColor } from '../core';
import styles from './BattleScene.module.css';

interface BattleSceneProps {
  combatResult: CombatResult;
  onComplete: () => void;
}

const PIECE_NAMES: Record<PieceType, string> = {
  [PieceType.PAWN]: 'Pawn',
  [PieceType.KNIGHT]: 'Knight',
  [PieceType.BISHOP]: 'Bishop',
  [PieceType.ROOK]: 'Rook',
  [PieceType.QUEEN]: 'Queen',
  [PieceType.KING]: 'King'
};

const PIECE_ICONS: Record<PieceType, string> = {
  [PieceType.PAWN]: '♟',
  [PieceType.KNIGHT]: '♞',
  [PieceType.BISHOP]: '♝',
  [PieceType.ROOK]: '♜',
  [PieceType.QUEEN]: '♛',
  [PieceType.KING]: '♚'
};

export const BattleScene: React.FC<BattleSceneProps> = ({ combatResult, onComplete }) => {
  const [phase, setPhase] = useState<'intro' | 'attack' | 'counter' | 'result'>('intro');
  const { attacker, defender, attackDamage, defenderCounterDamage, defenderAlive } = combatResult;

  // Calculate starting HP based on the result (reverse engineering for display)
  const attCurrentHP = attacker.stats.hp;
  const defCurrentHP = defender.stats.hp;
  
  const attStartHP = attCurrentHP + defenderCounterDamage;
  const defStartHP = defenderAlive ? (defCurrentHP + attackDamage) : attackDamage; 

  useEffect(() => {
    // Sequence the animation
    const attackTimer = setTimeout(() => setPhase('attack'), 800);
    
    let counterTimer: any;
    let resultTimer: any;
    let closeTimer: any;

    if (defenderAlive && defenderCounterDamage > 0) {
      counterTimer = setTimeout(() => setPhase('counter'), 2000);
      resultTimer = setTimeout(() => setPhase('result'), 3200);
      closeTimer = setTimeout(onComplete, 4500);
    } else {
      resultTimer = setTimeout(() => setPhase('result'), 2200);
      closeTimer = setTimeout(onComplete, 3500);
    }

    return () => {
      clearTimeout(attackTimer);
      clearTimeout(counterTimer);
      clearTimeout(resultTimer);
      clearTimeout(closeTimer);
    };
  }, [defenderAlive, defenderCounterDamage, onComplete]);

  const renderCard = (piece: Piece, role: 'attacker' | 'defender', startHP: number, damageTaken: number) => {
    const isAttacker = role === 'attacker';
    const isDead = role === 'defender' && !defenderAlive && phase === 'result';
    const isWhite = piece.color === PieceColor.WHITE;
    
    // Determine current HP for display based on phase
    let displayedHP = startHP;
    let showDamage = false;

    if (role === 'defender' && (phase === 'attack' || phase === 'counter' || phase === 'result')) {
      displayedHP = Math.max(0, startHP - attackDamage);
      showDamage = phase === 'attack';
    }
    if (role === 'attacker' && (phase === 'counter' || phase === 'result')) {
      displayedHP = Math.max(0, startHP - defenderCounterDamage);
      showDamage = phase === 'counter';
    }

    const hpPercent = (displayedHP / piece.stats.maxHP) * 100;

    return (
      <div className={`${styles.card} ${styles[role]} ${styles[isWhite ? 'white' : 'black']} ${isDead ? styles.dead : ''}`}>
        <div className={styles.pieceTypeLabel}>{PIECE_NAMES[piece.type]}</div>
        
        <div className={styles.pieceIconContainer}>
          <div className={styles.pieceIcon}>{PIECE_ICONS[piece.type]}</div>
        </div>
        
        <div className={styles.statRow}>
          <div className={styles.statBox}>
            <div className={styles.statLabel}>ATK</div>
            <div className={styles.statValue}>{piece.stats.atk}</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statLabel}>DEF</div>
            <div className={styles.statValue}>{piece.stats.def}</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statLabel}>SPD</div>
            <div className={styles.statValue}>{Math.floor(piece.stats.maxHP / 2)}</div>
          </div>
        </div>

        <div className={styles.hpContainer}>
          <div className={styles.hpLabel}>HP</div>
          <div className={styles.hpBar}>
            <div className={styles.hpFill} style={{ width: `${hpPercent}%` }} />
            <span className={styles.hpText}>{displayedHP}/{piece.stats.maxHP}</span>
          </div>
        </div>

        {showDamage && damageTaken > 0 && (
          <div className={`${styles.damagePopup} ${role === 'attacker' ? styles.counterDmg : styles.attackDmg}`}>
            <span className={styles.damageValue}>-{damageTaken}</span>
            <span className={styles.damageLabel}>{role === 'attacker' ? 'Counter' : 'Hit'}</span>
          </div>
        )}

        <div className={`${styles.actionAnim} ${phase === 'attack' && isAttacker ? styles.lungeRight : ''} ${phase === 'counter' && !isAttacker ? styles.lungeLeft : ''}`}>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.bgEffects}>
        <div className={styles.bgGlow1}></div>
        <div className={styles.bgGlow2}></div>
      </div>
      
      <div className={styles.battleContainer}>
        <div className={styles.vsBadge}>
          <div className={styles.vsText}>⚔️</div>
        </div>
        
        <div className={styles.cardWrapper}>
          {renderCard(attacker, 'attacker', attStartHP, defenderCounterDamage)}
        </div>

        <div className={styles.cardWrapper}>
          {renderCard(defender, 'defender', defStartHP, attackDamage)}
        </div>
      </div>
      
      <div className={styles.log}>
        {phase === 'attack' && (
          <div className={`${styles.logItem} ${styles.attackLog}`}>
            ⚔️ {PIECE_NAMES[attacker.type]} attacks for {attackDamage} damage!
          </div>
        )}
        {phase === 'counter' && (
          <div className={`${styles.logItem} ${styles.counterLog}`}>
            🛡️ {PIECE_NAMES[defender.type]} counters for {defenderCounterDamage} damage!
          </div>
        )}
        {phase === 'result' && !defenderAlive && (
          <div className={`${styles.logItem} ${styles.killLog}`}>
            💀 {PIECE_NAMES[defender.type]} has been defeated!
          </div>
        )}
      </div>
    </div>
  );
};