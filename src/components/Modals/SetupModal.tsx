import React, { useState } from 'react';
import { Bot, User, Play, RotateCcw, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import type { TPlayerColour, TPlayerInitData } from '../../types';
import { playerSequences } from '../../game/players/constants';
import { playerCountToWord } from '../../game/players/logic';
import { saveExists, deleteSaveFromStorage } from '../../game/storage/storage';
import styles from './SetupModal.module.css';

interface SetupModalProps {
  onStartGame: (players: TPlayerInitData[]) => void;
  onResumeGame?: () => void;
  canResume?: boolean;
}

const COLOR_CONFIG: Record<TPlayerColour, { label: string; hex: string; glow: string }> = {
  blue: { label: 'Blue', hex: '#1295e7', glow: 'rgba(18, 149, 231, 0.5)' },
  green: { label: 'Green', hex: '#049645', glow: 'rgba(4, 150, 69, 0.5)' },
  red: { label: 'Red', hex: '#ff0002', glow: 'rgba(255, 0, 2, 0.5)' },
  yellow: { label: 'Yellow', hex: '#ffde15', glow: 'rgba(255, 222, 21, 0.5)' },
};

const DEFAULT_PLAYERS: TPlayerInitData[] = [
  { name: 'Player 1', isBot: false },
  { name: 'Bot 1', isBot: true },
  { name: 'Bot 2', isBot: true },
  { name: 'Bot 3', isBot: true },
];

export const SetupModal: React.FC<SetupModalProps> = ({
  onStartGame,
  onResumeGame,
  canResume = false,
}) => {
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(2);
  const [playersData, setPlayersData] = useState<TPlayerInitData[]>(DEFAULT_PLAYERS);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentSequence = playerSequences[playerCountToWord(playerCount)];

  const handleQuickPreset = (preset: 'vs1bot' | 'vs3bots' | 'pass2p' | 'pass4p') => {
    setErrorMessage(null);
    if (preset === 'vs1bot') {
      setPlayerCount(2);
      setPlayersData([
        { name: 'Player 1', isBot: false },
        { name: 'Cyber Bot', isBot: true },
        { name: 'Bot 2', isBot: true },
        { name: 'Bot 3', isBot: true },
      ]);
    } else if (preset === 'vs3bots') {
      setPlayerCount(4);
      setPlayersData([
        { name: 'Player 1', isBot: false },
        { name: 'Alpha Bot', isBot: true },
        { name: 'Omega Bot', isBot: true },
        { name: 'Neo Bot', isBot: true },
      ]);
    } else if (preset === 'pass2p') {
      setPlayerCount(2);
      setPlayersData([
        { name: 'Player 1', isBot: false },
        { name: 'Player 2', isBot: false },
        { name: 'Player 3', isBot: false },
        { name: 'Player 4', isBot: false },
      ]);
    } else if (preset === 'pass4p') {
      setPlayerCount(4);
      setPlayersData([
        { name: 'Player 1', isBot: false },
        { name: 'Player 2', isBot: false },
        { name: 'Player 3', isBot: false },
        { name: 'Player 4', isBot: false },
      ]);
    }
  };

  const handleStart = () => {
    const selectedPlayers = playersData.slice(0, playerCount);
    const hasEmptyName = selectedPlayers.some((p) => p.name.trim() === '');
    if (hasEmptyName) {
      setErrorMessage('Please give all players a valid name.');
      return;
    }
    const allBots = selectedPlayers.every((p) => p.isBot);
    if (allBots) {
      setErrorMessage('At least one human player is required.');
      return;
    }

    if (saveExists()) {
      deleteSaveFromStorage();
    }
    onStartGame(selectedPlayers);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <Sparkles size={20} className={styles.sparkle} />
            <h2 className={styles.title}>LUXE LUDO</h2>
          </div>
          <p className={styles.subtitle}>Mobile Pass & Play • AI Bot Opponents</p>
        </div>

        {/* Quick Match Presets */}
        <div className={styles.section}>
          <span className={styles.sectionLabel}>Quick Match</span>
          <div className={styles.presetGrid}>
            <button
              type="button"
              className={styles.presetBtn}
              onClick={() => handleQuickPreset('vs1bot')}
            >
              1P vs 1 Bot
            </button>
            <button
              type="button"
              className={styles.presetBtn}
              onClick={() => handleQuickPreset('vs3bots')}
            >
              1P vs 3 Bots
            </button>
            <button
              type="button"
              className={styles.presetBtn}
              onClick={() => handleQuickPreset('pass2p')}
            >
              2 Players
            </button>
            <button
              type="button"
              className={styles.presetBtn}
              onClick={() => handleQuickPreset('pass4p')}
            >
              4 Players
            </button>
          </div>
        </div>

        {/* Player Count Selector Tabs */}
        <div className={styles.section}>
          <span className={styles.sectionLabel}>Number of Players</span>
          <div className={styles.countSelector}>
            {([2, 3, 4] as const).map((num) => (
              <button
                key={num}
                type="button"
                className={clsx(styles.countBtn, { [styles.activeCount]: playerCount === num })}
                onClick={() => {
                  setPlayerCount(num);
                  setErrorMessage(null);
                }}
              >
                {num} Players
              </button>
            ))}
          </div>
        </div>

        {/* Player Input Rows */}
        <div className={styles.playersList}>
          {currentSequence.map((colour, index) => {
            const player = playersData[index];
            const cfg = COLOR_CONFIG[colour];
            return (
              <div
                key={colour}
                className={styles.playerRow}
                style={
                  {
                    '--row-color': cfg.hex,
                    '--row-glow': cfg.glow,
                  } as React.CSSProperties
                }
              >
                {/* Compact Color Avatar Badge */}
                <div
                  className={styles.avatarBadge}
                  title={`${cfg.label} Player`}
                  aria-label={`${cfg.label} Player`}
                >
                  <span className={styles.avatarDot} />
                </div>

                {/* Name Input */}
                <input
                  type="text"
                  maxLength={14}
                  value={player.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPlayersData((prev) =>
                      prev.map((p, i) => (i === index ? { ...p, name: val } : p))
                    );
                    setErrorMessage(null);
                  }}
                  className={styles.nameInput}
                  placeholder={`Player ${index + 1}`}
                  aria-label={`Name for ${cfg.label} player`}
                />

                {/* Compact Icon Toggle: User vs Bot (Never clips on narrow screens!) */}
                <button
                  type="button"
                  className={clsx(styles.botStatusBtn, { [styles.isBot]: player.isBot })}
                  onClick={() => {
                    setPlayersData((prev) =>
                      prev.map((p, i) => (i === index ? { ...p, isBot: !p.isBot } : p))
                    );
                    setErrorMessage(null);
                  }}
                  title={player.isBot ? 'Bot Opponent (tap to switch to Human)' : 'Human Player (tap to switch to Bot)'}
                  aria-label={player.isBot ? 'Bot Opponent' : 'Human Player'}
                >
                  {player.isBot ? (
                    <Bot size={18} className={styles.botIcon} />
                  ) : (
                    <User size={18} className={styles.humanIcon} />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {errorMessage && <div className={styles.errorAlert}>{errorMessage}</div>}

        {/* Actions */}
        <div className={styles.actions}>
          <button type="button" className={styles.playBtn} onClick={handleStart}>
            <Play size={18} fill="currentColor" />
            <span>START GAME</span>
          </button>

          {canResume && onResumeGame && (
            <button type="button" className={styles.resumeBtn} onClick={onResumeGame}>
              <RotateCcw size={15} />
              <span>Resume Saved Game</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
