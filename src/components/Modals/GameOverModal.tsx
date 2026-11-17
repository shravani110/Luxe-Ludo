import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Crown, RotateCcw, Home } from 'lucide-react';
import type { TPlayerNameAndColour } from '../../types';
import { soundManager } from '../../utils/audio';
import styles from './GameOverModal.module.css';

interface GameOverModalProps {
  finishOrder: TPlayerNameAndColour[];
  onPlayAgain: () => void;
  onGoHome: () => void;
}

const PLAYER_HEX: Record<string, string> = {
  red: '#ff3366',
  green: '#00f59b',
  yellow: '#ffc837',
  blue: '#00d2ff',
};

export const GameOverModal: React.FC<GameOverModalProps> = ({
  finishOrder,
  onPlayAgain,
  onGoHome,
}) => {
  useEffect(() => {
    soundManager.playVictory();

    // Multistage luxury confetti blast
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 300,
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      void confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      colors: ['#00d2ff', '#ff3366', '#ffd166', '#00f59b'],
    });
    fire(0.2, {
      spread: 60,
      colors: ['#00d2ff', '#ffd166'],
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  }, []);

  const winner = finishOrder[0];

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.podiumCrown}>
          <Crown size={38} className={styles.crown} />
        </div>

        <h2 className={styles.title}>Victory Achieved!</h2>
        <p className={styles.winnerText}>
          <span style={{ color: PLAYER_HEX[winner?.colour ?? 'blue'] }}>
            {winner?.name}
          </span>{' '}
          wins the match!
        </p>

        {/* Podium Rank List */}
        <div className={styles.ranksList}>
          {finishOrder.map((player, idx) => (
            <div
              key={player.colour}
              className={styles.rankItem}
              style={{ '--player-color': PLAYER_HEX[player.colour] } as React.CSSProperties}
            >
              <div className={styles.rankBadge}>
                {idx === 0 ? (
                  <Crown size={14} className={styles.goldCrown} />
                ) : (
                  <Trophy size={13} />
                )}
                <span>#{idx + 1}</span>
              </div>
              <div className={styles.playerInfo}>
                <span className={styles.playerName}>{player.name}</span>
                <span className={styles.colorPill}>{player.colour.toUpperCase()}</span>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.replayBtn} onClick={onPlayAgain}>
            <RotateCcw size={16} />
            <span>Play Again</span>
          </button>
          <button type="button" className={styles.homeBtn} onClick={onGoHome}>
            <Home size={16} />
            <span>Menu & Setup</span>
          </button>
        </div>
      </div>
    </div>
  );
};
