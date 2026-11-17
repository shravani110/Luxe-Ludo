import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { Volume2, VolumeX, HelpCircle, RotateCcw } from 'lucide-react';
import clsx from 'clsx';
import type { AppDispatch, RootState } from '../../state/store';
import {
  registerNewPlayer,
  setPlayerSequence,
} from '../../state/slices/playersSlice';
import { registerDice } from '../../state/slices/diceSlice';
import { addToGameInactiveTime, setGameStartTime } from '../../state/slices/sessionSlice';
import { hydrateRootState } from '../../state/store';
import { playerCountToWord } from '../../game/players/logic';
import { playerSequences } from '../../game/players/constants';
import { saveExists, deleteSaveFromStorage } from '../../game/storage/storage';
import { retrieveState } from '../../game/storage/retrieveState';
import { saveState } from '../../game/storage/saveState';
import { useExecuteBotMove } from '../../hooks/useExecuteBotMove';
import { useRollDice } from '../../hooks/useRollDice';
import { useCleanup } from '../../hooks/useCleanup';
import { isAnyTokenActiveOfColour } from '../../game/tokens/logic';
import { soundManager } from '../../utils/audio';
import { logError } from '../../utils/logError';
import type { TPlayerInitData } from '../../types';

import ludoWallpaper from '../../assets/ludo_wallpaper_hd.png';
import { BackToMenuButton } from '../BackToMenuButton/BackToMenuButton';
import { Board } from '../Board/Board';
import { SetupModal } from '../Modals/SetupModal';
import { ExitConfirmModal } from '../Modals/ExitConfirmModal';
import { GameOverModal } from '../Modals/GameOverModal';
import { RulesModal } from '../Modals/RulesModal';

import styles from './Game.module.css';

const PLAYER_NAME_HEX: Record<string, string> = {
  red: '#ff0002',
  green: '#049645',
  yellow: '#ffde15',
  blue: '#1295e7',
};

export const Game: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const store = useStore<RootState>();
  const { players, currentPlayerColour, isGameEnded, playerFinishOrder, isAnyTokenMoving } =
    useSelector((state: RootState) => state.players);

  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());

  const cleanup = useCleanup();
  const executeBotMove = useExecuteBotMove();
  const rollDice = useRollDice();
  const gameInactiveStartTime = useRef(0);

  // Check for existing save file on mount
  useEffect(() => {
    if (saveExists()) {
      try {
        const { success, data } = retrieveState(store.getState());
        if (success && data) {
          store.dispatch(hydrateRootState(data));
          return;
        }
      } catch (e) {
        console.warn('Failed to restore save, opening setup:', e);
        deleteSaveFromStorage();
      }
    }
    if (store.getState().players.players.length === 0) {
      setIsSetupOpen(true);
    }
  }, [store]);

  // Bot Turn Automation
  useEffect(() => {
    if (players.length === 0 || isGameEnded) return;
    const currentPlayer = store
      .getState()
      .players.players.find((p) => p.colour === currentPlayerColour);

    if (currentPlayer?.isBot) {
      const timer = setTimeout(() => {
        rollDice(currentPlayerColour)
          .then((diceNum) => executeBotMove(currentPlayerColour, diceNum))
          .catch(logError('Game.botTurnEffect'));
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [currentPlayerColour, executeBotMove, isGameEnded, rollDice, store, players.length]);

  // Auto-save on visibilitychange
  useEffect(() => {
    const handlePageVisibilityChange = () => {
      if (isGameEnded) return;
      if (document.visibilityState === 'hidden') {
        gameInactiveStartTime.current = Date.now();
        try {
          saveState(store.getState());
        } catch {
          // ignore
        }
      } else if (document.visibilityState === 'visible' && gameInactiveStartTime.current > 0) {
        const diff = Date.now() - gameInactiveStartTime.current;
        dispatch(addToGameInactiveTime(diff));
        try {
          saveState(store.getState());
        } catch {
          // ignore
        }
        gameInactiveStartTime.current = 0;
      }
    };

    document.addEventListener('visibilitychange', handlePageVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handlePageVisibilityChange);
  }, [dispatch, isGameEnded, store]);

  // Start new game
  const handleStartGame = (initData: TPlayerInitData[]) => {
    cleanup();
    deleteSaveFromStorage();

    const word = playerCountToWord(initData.length);
    const seq = playerSequences[word];

    dispatch(setPlayerSequence({ playerCount: word }));
    dispatch(setGameStartTime(Date.now()));

    for (let i = 0; i < initData.length; i++) {
      dispatch(
        registerNewPlayer({
          name: initData[i].name,
          colour: seq[i],
          isBot: initData[i].isBot,
        })
      );
      dispatch(registerDice(seq[i]));
    }

    try {
      saveState(store.getState());
    } catch {
      // ignore
    }
    setIsSetupOpen(false);
  };

  // Resume saved game
  const handleResumeGame = () => {
    try {
      const { success, data } = retrieveState(store.getState());
      if (success && data) {
        store.dispatch(hydrateRootState(data));
        setIsSetupOpen(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Sound toggle
  const handleToggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  // Floating Back Button Click (iframe messaging + exit modal)
  const handleBackButtonClick = () => {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'LUDO_BACK_TO_MENU' }, '*');
      }
    } catch {
      // ignore
    }
    setIsExitModalOpen(true);
  };

  const handleConfirmExit = () => {
    setIsExitModalOpen(false);
    setIsSetupOpen(true);
  };

  // Active status helper
  const currentPlayer = players.find((p) => p.colour === currentPlayerColour);
  const anyTokenActive = isAnyTokenActiveOfColour(currentPlayerColour, players);

  const statusMessage = () => {
    if (isGameEnded) return 'Match Finished!';
    if (isAnyTokenMoving) return 'Token moving...';
    if (currentPlayer?.isBot) return `${currentPlayer.name} (Bot) is playing...`;
    if (anyTokenActive) return 'Select a bouncing token to move!';
    return `${currentPlayer?.name ?? 'Player'}'s turn - Tap your glowing dice!`;
  };

  return (
    <div
      className={clsx(styles.appContainer, styles.themeClassic)}
      style={{
        backgroundColor: '#041c42',
        backgroundImage: `url(${ludoWallpaper})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Floating glass 'Back to Menu' button (Top-Left) */}
      <BackToMenuButton onClick={handleBackButtonClick} />

      {/* Main Viewport Container */}
      <main className={styles.mobileViewport}>
        {/* Top Navbar */}
        <header className={styles.navbar}>
          <div className={styles.navSpacer} />
          <div className={styles.navControls}>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={handleToggleSound}
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
              aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
            </button>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => setIsRulesOpen(true)}
              title="How to Play"
              aria-label="How to Play"
            >
              <HelpCircle size={17} />
            </button>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => setIsSetupOpen(true)}
              title="New Match"
              aria-label="New Match"
            >
              <RotateCcw size={17} />
            </button>
          </div>
        </header>

        {/* Center: The Authentic Ludo Board with Corner Dice and Tokens */}
        <div className={styles.boardContainer}>
          <Board />
        </div>

        {/* Bottom Floating Turn Banner */}
        <footer className={styles.statusFooter}>
          <div className={styles.statusPill}>
            <span
              className={styles.colorDot}
              style={{
                backgroundColor: PLAYER_NAME_HEX[currentPlayerColour] ?? '#1295e7',
                boxShadow: `0 0 10px ${PLAYER_NAME_HEX[currentPlayerColour] ?? '#1295e7'}`,
              }}
            />
            <span className={styles.statusText}>{statusMessage()}</span>
            {(currentPlayer?.numberOfConsecutiveSix ?? 0) > 0 && (
              <span className={styles.streakNotice}>
                Sixes: {currentPlayer?.numberOfConsecutiveSix}/3
              </span>
            )}
          </div>
        </footer>
      </main>

      {/* Modals */}
      {isSetupOpen && (
        <SetupModal
          onStartGame={handleStartGame}
          onResumeGame={handleResumeGame}
          canResume={saveExists()}
        />
      )}

      <ExitConfirmModal
        isOpen={isExitModalOpen}
        onCancel={() => setIsExitModalOpen(false)}
        onConfirmExit={handleConfirmExit}
      />

      {isGameEnded && (
        <GameOverModal
          finishOrder={playerFinishOrder}
          onPlayAgain={() => setIsSetupOpen(true)}
          onGoHome={handleConfirmExit}
        />
      )}

      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
    </div>
  );
};
