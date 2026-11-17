import React, { useCallback, useEffect, useMemo } from 'react';
import { useSelector, useStore } from 'react-redux';
import clsx from 'clsx';
import type { RootState } from '../../state/store';
import type { TPlayerColour } from '../../types';
import { playerColours } from '../../game/players/constants';
import { isAnyTokenActiveOfColour } from '../../game/tokens/logic';
import { useRollDice } from '../../hooks/useRollDice';
import { useHandlePostDiceRoll } from '../../hooks/useHandlePostDiceRoll';
import { useChangeTurn } from '../../hooks/useChangeTurn';
import { saveState } from '../../game/storage/saveState';
import { logError } from '../../utils/logError';

import dice1 from '../../assets/dice/1.svg';
import dice2 from '../../assets/dice/2.svg';
import dice3 from '../../assets/dice/3.svg';
import dice4 from '../../assets/dice/4.svg';
import dice5 from '../../assets/dice/5.svg';
import dice6 from '../../assets/dice/6.svg';
import dicePlaceholder from '../../assets/dice/dice_placeholder.gif';
import TokenImage from '../../assets/token.svg?react';

import styles from './Dice.module.css';

interface DiceProps {
  colour: TPlayerColour;
  playerName: string;
}

function getDiceImage(diceNumber: number | undefined): string {
  switch (diceNumber) {
    case 1:
      return dice1;
    case 2:
      return dice2;
    case 3:
      return dice3;
    case 4:
      return dice4;
    case 5:
      return dice5;
    case 6:
      return dice6;
    default:
      return dice1;
  }
}

export const Dice: React.FC<DiceProps> = ({ colour, playerName }) => {
  const {
    isAnyTokenMoving,
    isGameEnded,
    currentPlayerColour: currentPlayer,
    players,
  } = useSelector((state: RootState) => state.players);

  const diceData = useSelector((state: RootState) =>
    state.dice.dice.find((d) => d.colour === colour)
  );
  const diceNumber = diceData?.diceNumber ?? 1;
  const isPlaceholderShowing = diceData?.isPlaceholderShowing ?? false;

  const anyTokenActive = useMemo(
    () => isAnyTokenActiveOfColour(colour, players),
    [colour, players]
  );

  const handlePostDiceRoll = useHandlePostDiceRoll();
  const changeTurnFn = useChangeTurn();
  const rollDice = useRollDice();
  const store = useStore<RootState>();

  const isBot = players.find((p) => p.colour === colour)?.isBot ?? false;
  const isCurrentPlayer = currentPlayer === colour;
  const isDiceDisabled =
    !isCurrentPlayer ||
    anyTokenActive ||
    isAnyTokenMoving ||
    isGameEnded ||
    isPlaceholderShowing ||
    isBot;

  const handleDiceClick = useCallback(async () => {
    if (isDiceDisabled) return;
    try {
      const rolledNumber = await rollDice(colour);
      const res = await handlePostDiceRoll(colour, rolledNumber);
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
      logError('Dice.handleDiceClick')(e);
    }
  }, [isDiceDisabled, rollDice, colour, handlePostDiceRoll, store, changeTurnFn]);

  // Press 'D' to roll active dice
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.key.toLowerCase() !== 'd' || isDiceDisabled) return;
      handleDiceClick().catch(logError('Dice.handleKeyDown'));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDiceClick, isDiceDisabled]);

  return (
    <div className={clsx(styles.diceContainer, styles[colour])}>
      {/* Golden Console Capsule matching reference screenshot */}
      <div
        className={clsx(styles.consoleCapsule, {
          [styles.activeTurn]: isCurrentPlayer,
        })}
      >
        {/* Token box on the left for blue and red */}
        {(colour === 'blue' || colour === 'red') && (
          <div
            className={clsx(styles.tokenAvatarBox, styles[colour])}
            style={{ '--player-colour': playerColours[colour] } as React.CSSProperties}
          >
            <TokenImage className={styles.avatarTokenSvg} aria-hidden="true" />
          </div>
        )}

        {/* Dice box */}
        <button
          className={clsx(styles.dice, {
            [styles.active]: !isDiceDisabled,
            [styles.rolling]: isPlaceholderShowing,
          })}
          title={!isDiceDisabled ? 'Roll Dice (Press D)' : undefined}
          disabled={isDiceDisabled}
          style={{ '--player-colour': playerColours[colour] } as React.CSSProperties}
          type="button"
          aria-label={
            isPlaceholderShowing
              ? `${playerName} is rolling`
              : `${playerName}'s dice, showing ${diceNumber}${
                  !isDiceDisabled ? '. Press to roll' : ''
                }`
          }
          onClick={handleDiceClick}
        >
          <img
            src={isPlaceholderShowing ? dicePlaceholder : getDiceImage(diceNumber)}
            alt={`Dice showing ${diceNumber}`}
            aria-hidden="true"
          />
        </button>

        {/* Token box on the right for green and yellow */}
        {(colour === 'green' || colour === 'yellow') && (
          <div
            className={clsx(styles.tokenAvatarBox, styles[colour])}
            style={{ '--player-colour': playerColours[colour] } as React.CSSProperties}
          >
            <TokenImage className={styles.avatarTokenSvg} aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Animated 3D Pointer Arrow (When it's this player's turn to roll) */}
      {isCurrentPlayer && !isDiceDisabled && (
        <div className={clsx(styles.pointerArrow, styles[colour])} aria-hidden="true">
          <svg viewBox="0 0 24 24" className={styles.arrowSvg}>
            <path
              d={
                colour === 'blue' || colour === 'red'
                  ? 'M20 7h-8V3L2 12l10 9v-4h8z'
                  : 'M4 7h8V3l10 9-10 9v-4H4z'
              }
              className={styles.arrowPath}
            />
          </svg>
        </div>
      )}
    </div>
  );
};
