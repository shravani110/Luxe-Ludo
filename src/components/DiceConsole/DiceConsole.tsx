import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector, useStore } from 'react-redux';
import { Dices, Sparkles, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import type { RootState } from '../../state/store';
import { isAnyTokenActiveOfColour } from '../../game/tokens/logic';
import { useRollDice } from '../../hooks/useRollDice';
import { useHandlePostDiceRoll } from '../../hooks/useHandlePostDiceRoll';
import { useChangeTurn } from '../../hooks/useChangeTurn';
import { saveState } from '../../game/storage/saveState';
import { logError } from '../../utils/logError';
import styles from './DiceConsole.module.css';

const PLAYER_COLORS: Record<string, { main: string; glow: string; name: string }> = {
  red: { main: '#ff3366', glow: 'rgba(255, 51, 102, 0.7)', name: 'Red' },
  green: { main: '#00f59b', glow: 'rgba(0, 245, 155, 0.7)', name: 'Green' },
  yellow: { main: '#ffc837', glow: 'rgba(255, 200, 55, 0.7)', name: 'Yellow' },
  blue: { main: '#00d2ff', glow: 'rgba(0, 210, 255, 0.7)', name: 'Blue' },
};

// SVG Pip renderer for premium glowing dice face
const DiceFace: React.FC<{ number: number; glowColor: string }> = ({ number, glowColor }) => {
  const pips = useMemo(() => {
    switch (number) {
      case 1:
        return [{ x: 50, y: 50 }];
      case 2:
        return [
          { x: 30, y: 30 },
          { x: 70, y: 70 },
        ];
      case 3:
        return [
          { x: 25, y: 25 },
          { x: 50, y: 50 },
          { x: 75, y: 75 },
        ];
      case 4:
        return [
          { x: 28, y: 28 },
          { x: 72, y: 28 },
          { x: 28, y: 72 },
          { x: 72, y: 72 },
        ];
      case 5:
        return [
          { x: 28, y: 28 },
          { x: 72, y: 28 },
          { x: 50, y: 50 },
          { x: 28, y: 72 },
          { x: 72, y: 72 },
        ];
      case 6:
        return [
          { x: 28, y: 25 },
          { x: 72, y: 25 },
          { x: 28, y: 50 },
          { x: 72, y: 50 },
          { x: 28, y: 75 },
          { x: 72, y: 75 },
        ];
      default:
        return [{ x: 50, y: 50 }];
    }
  }, [number]);

  return (
    <svg viewBox="0 0 100 100" className={styles.diceSvg} aria-hidden="true">
      <defs>
        <radialGradient id="pipGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor={glowColor} />
          <stop offset="100%" stopColor="#ffffff" />
        </radialGradient>
      </defs>
      {pips.map((pip, idx) => (
        <circle
          key={idx}
          cx={pip.x}
          cy={pip.y}
          r={number === 1 ? 14 : 9}
          fill="url(#pipGrad)"
          filter="drop-shadow(0 0 4px rgba(255,255,255,0.85))"
        />
      ))}
    </svg>
  );
};

export const DiceConsole: React.FC = () => {
  const {
    isAnyTokenMoving,
    isGameEnded,
    currentPlayerColour,
    players,
  } = useSelector((state: RootState) => state.players);

  const currentDice = useSelector((state: RootState) =>
    state.dice.dice.find((d) => d.colour === currentPlayerColour)
  );

  const diceNumber = currentDice?.diceNumber ?? 1;
  const isPlaceholderShowing = currentDice?.isPlaceholderShowing ?? false;

  const currentPlayer = useMemo(
    () => players.find((p) => p.colour === currentPlayerColour),
    [players, currentPlayerColour]
  );

  const anyTokenActive = useMemo(
    () => isAnyTokenActiveOfColour(currentPlayerColour, players),
    [currentPlayerColour, players]
  );

  const handlePostDiceRoll = useHandlePostDiceRoll();
  const changeTurnFn = useChangeTurn();
  const rollDice = useRollDice();
  const store = useStore<RootState>();

  const [isRollingAnimation, setIsRollingAnimation] = useState(false);

  const isBot = currentPlayer?.isBot ?? false;
  const isDiceDisabled =
    anyTokenActive ||
    isAnyTokenMoving ||
    isGameEnded ||
    isPlaceholderShowing ||
    isBot;

  const colorConfig = PLAYER_COLORS[currentPlayerColour] ?? {
    main: '#00d2ff',
    glow: 'rgba(0, 210, 255, 0.7)',
    name: 'Player',
  };

  const handleDiceClick = useCallback(async () => {
    if (isDiceDisabled) return;
    setIsRollingAnimation(true);
    try {
      const rolledNumber = await rollDice(currentPlayerColour);
      const res = await handlePostDiceRoll(currentPlayerColour, rolledNumber);
      if (store.getState().players.isGameEnded) return;
      try {
        saveState(store.getState());
      } catch {
        // ignore
      }
      if (res?.shouldChangeTurn) {
        changeTurnFn();
      }
    } catch (e) {
      logError('DiceConsole.handleDiceClick')(e);
    } finally {
      setIsRollingAnimation(false);
    }
  }, [
    isDiceDisabled,
    rollDice,
    currentPlayerColour,
    handlePostDiceRoll,
    store,
    changeTurnFn,
  ]);

  // Keyboard shortcut 'D'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.key.toLowerCase() !== 'd' || isDiceDisabled) return;
      handleDiceClick().catch(logError('DiceConsole.handleKeyDown'));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDiceClick, isDiceDisabled]);

  // Guidance status text
  const statusMessage = useMemo(() => {
    if (isGameEnded) return 'Game Finished!';
    if (isAnyTokenMoving) return 'Token moving...';
    if (isPlaceholderShowing || isRollingAnimation) return 'Rolling dice...';
    if (isBot) return `${currentPlayer?.name} (Bot) is calculating...`;
    if (anyTokenActive) return 'Select a glowing token to move!';
    if (currentPlayer?.numberOfConsecutiveSix === 2) return 'Careful! 3 sixes will skip your turn!';
    return 'Tap Dice or press (D) to Roll';
  }, [
    isGameEnded,
    isAnyTokenMoving,
    isPlaceholderShowing,
    isRollingAnimation,
    isBot,
    currentPlayer?.name,
    currentPlayer?.numberOfConsecutiveSix,
    anyTokenActive,
  ]);

  return (
    <div
      className={styles.console}
      style={
        {
          '--current-color': colorConfig.main,
          '--current-glow': colorConfig.glow,
        } as React.CSSProperties
      }
    >
      <div className={styles.leftInfo}>
        <div className={styles.turnLabel}>
          <span className={styles.pulseDot} />
          <span className={styles.playerName}>{currentPlayer?.name ?? 'Player'}</span>
        </div>
        <div className={styles.statusRow}>
          {anyTokenActive ? (
            <Sparkles size={13} className={styles.statusIcon} />
          ) : isBot ? (
            <div className={styles.botSpinner} />
          ) : (
            <Dices size={13} className={styles.statusIcon} />
          )}
          <span className={styles.statusText}>{statusMessage}</span>
        </div>
        {(currentPlayer?.numberOfConsecutiveSix ?? 0) > 0 && (
          <div className={styles.streakBadge}>
            <AlertCircle size={11} />
            <span>Sixes: {currentPlayer?.numberOfConsecutiveSix}/3</span>
          </div>
        )}
      </div>

      <div className={styles.diceSection}>
        <button
          type="button"
          className={clsx(styles.diceButton, {
            [styles.rollable]: !isDiceDisabled,
            [styles.rolling]: isPlaceholderShowing || isRollingAnimation,
          })}
          disabled={isDiceDisabled}
          onClick={handleDiceClick}
          aria-label={
            isPlaceholderShowing
              ? 'Rolling dice'
              : `Dice value ${diceNumber}. ${!isDiceDisabled ? 'Tap to roll' : ''}`
          }
        >
          <div className={styles.diceCube}>
            {isPlaceholderShowing || isRollingAnimation ? (
              <div className={styles.tumbler}>
                <Dices size={34} className={styles.tumblerIcon} />
              </div>
            ) : (
              <DiceFace number={diceNumber} glowColor={colorConfig.main} />
            )}
          </div>
        </button>
      </div>
    </div>
  );
};
