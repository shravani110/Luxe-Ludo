import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import BoardImage from '../../assets/board.svg?react';
import { Token } from '../Token/Token';
import { Dice } from '../Dice/Dice';
import type { RootState } from '../../state/store';
import { resizeBoard, NUMBER_OF_BLOCKS_IN_ONE_ROW } from '../../state/slices/boardSlice';
import { tokensWithCoord, getGloballyUniqueTokenId } from '../../game/tokens/logic';
import type { TCoordinate } from '../../types';
import type { TTokenClickData } from '../../types/tokens';
import { useResizeObserver } from '../../hooks/useResizeObserver';
import clsx from 'clsx';
import styles from './Board.module.css';

export const Board: React.FC = () => {
  const { players, currentPlayerColour } = useSelector((state: RootState) => state.players);
  const { boardTileSize, boardSideLength } = useSelector((state: RootState) => state.board);
  const { dice } = useSelector((state: RootState) => state.dice);
  const [tokenClickData, setTokenClickData] = useState<TTokenClickData | null>(null);
  const [boardNode, setBoardNode] = useState<HTMLDivElement | null>(null);
  const dispatch = useDispatch();

  const onBoardResize = useCallback(() => {
    if (!boardNode) return;
    const side = boardNode.getBoundingClientRect().width;
    if (side > 0) {
      dispatch(resizeBoard(side));
    }
  }, [boardNode, dispatch]);

  useResizeObserver(boardNode, onBoardResize);

  // Immediate measurement on mount and window resize
  useEffect(() => {
    if (!boardNode) return;
    const updateSize = () => {
      const side = boardNode.getBoundingClientRect().width;
      if (side > 0) {
        dispatch(resizeBoard(side));
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [boardNode, dispatch]);

  const handleBoardClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const currentPlayer = players.find((p) => p.colour === currentPlayerColour);
    if (currentPlayer?.isBot) return;
    if (!boardNode || boardTileSize <= 0) return;

    const { top, left } = boardNode.getBoundingClientRect();
    const boardX = e.clientX - left;
    const boardY = e.clientY - top;

    if (boardX < 0 || boardY < 0 || boardX > boardSideLength || boardY > boardSideLength) return;

    const tileStartCoords = Array(NUMBER_OF_BLOCKS_IN_ONE_ROW)
      .fill(null)
      .map((_, i) => (i + 1) * boardTileSize);

    const coordX = tileStartCoords.findIndex((v) => boardX < v);
    const coordY = tileStartCoords.findIndex((v) => boardY < v);

    if (coordX === -1 || coordY === -1) return;

    const coords: TCoordinate = { x: coordX, y: coordY };
    const tokenToMove = tokensWithCoord(coords, players).filter(
      (t) => t.colour === currentPlayerColour
    )[0];

    if (!tokenToMove || tokenToMove.isLocked) return;

    setTokenClickData({
      timestamp: Date.now(),
      colour: tokenToMove.colour,
      id: tokenToMove.id,
    });
  };

  return (
    <div
      className={styles.board}
      ref={setBoardNode}
      onClick={handleBoardClick}
      style={
        boardTileSize > 0
          ? ({ '--board-tile-size': `${boardTileSize}px` } as React.CSSProperties)
          : undefined
      }
    >
      {/* Tokens Layer */}
      {players.map((p) =>
        p.tokens.map((t) => (
          <Token
            colour={t.colour}
            id={t.id}
            tokenClickData={tokenClickData}
            key={getGloballyUniqueTokenId(t.colour, t.id)}
          />
        ))
      )}

      {/* Embedded Player Names on Board Bases (Authentic Ludo King style) */}
      {players.map((p) => (
        <div
          key={`base-name-${p.colour}`}
          className={clsx(styles.baseNameTag, styles[p.colour], {
            [styles.activeTurn]: p.colour === currentPlayerColour,
          })}
        >
          {p.name}
        </div>
      ))}

      {/* Corner Dice Layer (Exact placement as in screenshot) */}
      {dice.map((d) => (
        <Dice
          colour={d.colour}
          playerName={players.find((p) => p.colour === d.colour)?.name as string}
          key={d.colour}
        />
      ))}

      {/* Authentic Board SVG */}
      <BoardImage className={styles.boardImage} aria-hidden="true" />
    </div>
  );
};
