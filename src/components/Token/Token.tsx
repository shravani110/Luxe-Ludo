import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { animate, motion, useMotionValue } from 'framer-motion';
import clsx from 'clsx';
import type { AppDispatch, RootState } from '../../state/store';
import {
  deactivateAllTokens,
  getToken,
  setIsAnyTokenMoving,
} from '../../state/slices/playersSlice';
import type { TPlayer, TPlayerColour, TTokenClickData, TToken } from '../../types';
import { useCoordsToPosition } from '../../hooks/useCoordsToPosition';
import { useMoveAndCaptureToken } from '../../hooks/useMoveAndCaptureToken';
import { useChangeTurn } from '../../hooks/useChangeTurn';
import { useUnlockAndAlignTokens } from '../../hooks/useUnlockAndAlignTokens';
import { transitionStates } from '../../game/tokens/constants';
import { playerColours } from '../../game/players/constants';
import { getGloballyUniqueTokenId, getStepsFromStart, getTokenAriaLabel } from '../../game/tokens/logic';
import { tokenMotionRegistry } from '../../game/movement/tokenMotionRegistry';
import { saveState } from '../../game/storage/saveState';
import { logError } from '../../utils/logError';
import TokenImage from '../../assets/token.svg?react';
import styles from './Token.module.css';

interface TokenProps {
  colour: TPlayerColour;
  id: number;
  tokenClickData: TTokenClickData | null;
}

export const Token: React.FC<TokenProps> = ({ colour, id, tokenClickData }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { tokenHeight, tokenWidth } = useSelector((state: RootState) => state.board);
  const { players } = useSelector((state: RootState) => state.players);
  const tokenClickDataRef = useRef(tokenClickData);
  const [isCurrentlyFocused, setIsCurrentlyFocused] = useState(false);
  const tokenElRef = useRef<HTMLButtonElement | null>(null);
  const changeTurnFn = useChangeTurn();
  const unlockAndAlignTokens = useUnlockAndAlignTokens();
  const store = useStore<RootState>();
  const isExternallyAnimating = useRef(false);

  const player = useMemo(
    () => players.find((v) => v.colour === colour),
    [players, colour]
  ) as TPlayer | undefined;

  const numberOfConsecutiveSix = player?.numberOfConsecutiveSix ?? 0;
  const token = useMemo(
    () => player?.tokens.find((t) => t.id === id),
    [player, id]
  ) as TToken | undefined;

  const diceNumber = useSelector(
    (state: RootState) => state.dice.dice.find((d) => d.colour === colour)?.diceNumber
  );

  const getPosition = useCoordsToPosition();
  const moveAndCapture = useMoveAndCaptureToken();

  const coordinates = token?.coordinates ?? { x: 0, y: 0 };
  const isActive = token?.isActive ?? false;
  const isLocked = token?.isLocked ?? true;
  const hasTokenReachedHome = token?.hasTokenReachedHome ?? false;
  const tokenAlignmentData = token?.tokenAlignmentData ?? { xOffset: 0, yOffset: 0, scaleFactor: 1 };
  const direction = token?.direction ?? null;

  const { x, y } = getPosition(coordinates, tokenAlignmentData);
  const motionX = useMotionValue<number>(x);
  const motionY = useMotionValue<number>(y);

  useEffect(() => {
    if (isExternallyAnimating.current) return;
    if (!direction) {
      motionX.set(x);
      motionY.set(y);
      return;
    }
    const controlsX = animate(motionX, x, {
      duration: transitionStates[direction].durationMs / 1000,
      ease: transitionStates[direction].timingFn,
    });
    const controlsY = animate(motionY, y, {
      duration: transitionStates[direction].durationMs / 1000,
      ease: transitionStates[direction].timingFn,
    });
    return () => {
      controlsX.stop();
      controlsY.stop();
    };
  }, [direction, motionX, motionY, x, y]);

  useEffect(() => {
    tokenMotionRegistry.set(getGloballyUniqueTokenId(colour, id), {
      x: motionX,
      y: motionY,
      setExternallyAnimating: (v) => {
        isExternallyAnimating.current = v;
      },
      animateTo: (targetX, targetY, transition) =>
        Promise.all([animate(motionX, targetX, transition), animate(motionY, targetY, transition)]).then(
          () => {}
        ),
    });
    return () => {
      tokenMotionRegistry.delete(getGloballyUniqueTokenId(colour, id));
    };
  }, [colour, id, motionX, motionY]);

  const unlock = async () => {
    try {
      dispatch(setIsAnyTokenMoving(true));
      unlockAndAlignTokens({ colour, id });
      dispatch(deactivateAllTokens(colour));
      const updatedToken = getToken(store.getState().players, colour, id);
      const { x: targetX, y: targetY } = getPosition(
        updatedToken.coordinates,
        updatedToken.tokenAlignmentData
      );
      const entry = tokenMotionRegistry.get(getGloballyUniqueTokenId(colour, id));
      if (!entry) return;
      entry.setExternallyAnimating(true);
      await entry.animateTo(targetX, targetY, {
        duration: transitionStates.forward.durationMs / 1000,
        ease: transitionStates.forward.timingFn,
      });
      entry.setExternallyAnimating(false);
      dispatch(setIsAnyTokenMoving(false));
      try {
        saveState(store.getState());
      } catch {
        // ignore
      }
    } catch (e) {
      logError('Token.unlock')(e);
    }
  };

  const executeTokenMove = useCallback(async () => {
    try {
      if (!token || !isActive || diceNumber === -1 || !diceNumber || isLocked) return;
      const moveData = await moveAndCapture(token, diceNumber);
      if (!moveData) return;
      const { hasTokenReachedHome: reachedHome, isCaptured, hasPlayerWon } = moveData;
      if (hasPlayerWon) return changeTurnFn();
      if ((diceNumber !== 6 || numberOfConsecutiveSix >= 3) && !isCaptured && !reachedHome) {
        return changeTurnFn();
      }
      try {
        saveState(store.getState());
      } catch {
        // ignore
      }
    } catch (e) {
      logError('Token.executeTokenMove')(e);
    }
  }, [
    changeTurnFn,
    diceNumber,
    isActive,
    isLocked,
    moveAndCapture,
    numberOfConsecutiveSix,
    store,
    token,
  ]);

  useEffect(() => {
    const prevClickData = tokenClickDataRef.current;
    const newTokenClickData = tokenClickData;

    if (!newTokenClickData || prevClickData?.timestamp === newTokenClickData.timestamp) return;
    tokenClickDataRef.current = newTokenClickData;

    if (newTokenClickData.colour === colour && newTokenClickData.id === id) {
      void executeTokenMove();
    }
  }, [colour, executeTokenMove, id, tokenClickData]);

  const handleTokenClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    if (e.detail === 0) e.stopPropagation();
    if (isLocked && isActive && diceNumber !== -1 && diceNumber === 6) {
      void unlock();
      return;
    }
    tokenElRef.current?.blur?.();
    void executeTokenMove();
  };

  if (!token) return null;

  return (
    <motion.button
      id={getGloballyUniqueTokenId(colour, id)}
      className={clsx(styles.token, {
        [styles.active]: isActive,
      })}
      onFocus={() => setIsCurrentlyFocused(true)}
      onBlur={() => setIsCurrentlyFocused(false)}
      disabled={!isActive}
      onClick={handleTokenClick}
      ref={tokenElRef}
      animate={{ scale: tokenAlignmentData.scaleFactor }}
      aria-label={getTokenAriaLabel(
        colour,
        id,
        isLocked,
        hasTokenReachedHome,
        getStepsFromStart(token)
      )}
      transition={{
        duration: direction ? transitionStates[direction].durationMs / 1000 : 0,
        ease: direction ? transitionStates[direction].timingFn : undefined,
      }}
      style={
        {
          height: tokenHeight,
          width: tokenWidth,
          x: motionX,
          y: motionY,
        } as unknown as React.CSSProperties
      }
    >
      <span className={clsx(styles.bouncer, { [styles.active]: isActive && !isCurrentlyFocused })}>
        <TokenImage
          className={styles.svg}
          aria-hidden="true"
          style={
            {
              '--fill-colour': playerColours[colour],
            } as React.CSSProperties
          }
        />
      </span>
    </motion.button>
  );
};
