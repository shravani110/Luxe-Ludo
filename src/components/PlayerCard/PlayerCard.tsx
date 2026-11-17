import React from 'react';
import { Bot, User, Trophy, Crown } from 'lucide-react';
import clsx from 'clsx';
import type { TPlayer, TPlayerColour } from '../../types';
import styles from './PlayerCard.module.css';

interface PlayerCardProps {
  player: TPlayer;
  isCurrentTurn: boolean;
  finishRank?: number;
}

const PLAYER_THEMES: Record<
  TPlayerColour,
  { name: string; hex: string; glow: string; border: string; bg: string }
> = {
  red: {
    name: 'Red',
    hex: '#ff3366',
    glow: 'rgba(255, 51, 102, 0.4)',
    border: 'rgba(255, 51, 102, 0.55)',
    bg: 'rgba(255, 51, 102, 0.08)',
  },
  green: {
    name: 'Green',
    hex: '#00f59b',
    glow: 'rgba(0, 245, 155, 0.4)',
    border: 'rgba(0, 245, 155, 0.55)',
    bg: 'rgba(0, 245, 155, 0.08)',
  },
  yellow: {
    name: 'Yellow',
    hex: '#ffc837',
    glow: 'rgba(255, 200, 55, 0.4)',
    border: 'rgba(255, 200, 55, 0.55)',
    bg: 'rgba(255, 200, 55, 0.08)',
  },
  blue: {
    name: 'Blue',
    hex: '#00d2ff',
    glow: 'rgba(0, 210, 255, 0.4)',
    border: 'rgba(0, 210, 255, 0.55)',
    bg: 'rgba(0, 210, 255, 0.08)',
  },
};

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isCurrentTurn,
  finishRank,
}) => {
  const theme = PLAYER_THEMES[player.colour];
  const homeCount = player.tokens.filter((t) => t.hasTokenReachedHome).length;
  const activeCount = player.tokens.filter((t) => !t.isLocked && !t.hasTokenReachedHome).length;

  return (
    <div
      className={clsx(styles.card, {
        [styles.activeTurn]: isCurrentTurn,
        [styles.finished]: finishRank !== undefined,
      })}
      style={
        {
          '--player-hex': theme.hex,
          '--player-glow': theme.glow,
          '--player-border': theme.border,
          '--player-bg': theme.bg,
        } as React.CSSProperties
      }
    >
      {/* Active turn ambient indicator */}
      {isCurrentTurn && <div className={styles.turnPulseRing} />}

      <div className={styles.header}>
        <div className={styles.avatarWrapper}>
          <div className={styles.avatar}>
            {player.isBot ? (
              <Bot size={15} className={styles.avatarIcon} />
            ) : (
              <User size={15} className={styles.avatarIcon} />
            )}
          </div>
          <span className={styles.colourDot} />
        </div>

        <div className={styles.info}>
          <div className={styles.nameRow}>
            <span className={styles.name}>{player.name}</span>
            {finishRank !== undefined ? (
              <span className={styles.rankBadge}>
                {finishRank === 1 ? (
                  <Crown size={12} className={styles.crownIcon} />
                ) : (
                  <Trophy size={11} />
                )}
                #{finishRank}
              </span>
            ) : isCurrentTurn ? (
              <span className={styles.turnBadge}>TURN</span>
            ) : null}
          </div>
          <span className={styles.roleSubtext}>
            {player.isBot ? 'Bot AI' : 'Human'}
          </span>
        </div>
      </div>

      {/* Token status indicators */}
      <div className={styles.tokenPills}>
        <div className={styles.progressLabel}>
          <span>Home: {homeCount}/4</span>
          {activeCount > 0 && <span className={styles.activePill}>{activeCount} in play</span>}
        </div>
        <div className={styles.dotsRow}>
          {player.tokens.map((t) => {
            const isHome = t.hasTokenReachedHome;
            const isBoard = !t.isLocked && !t.hasTokenReachedHome;
            return (
              <span
                key={t.id}
                className={clsx(styles.tokenDot, {
                  [styles.dotHome]: isHome,
                  [styles.dotBoard]: isBoard,
                  [styles.dotLocked]: t.isLocked,
                })}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
