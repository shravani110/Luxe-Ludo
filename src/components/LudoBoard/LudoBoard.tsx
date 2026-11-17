import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../state/store';
import { resizeBoard } from '../../state/slices/boardSlice';
import { tokensWithCoord, getGloballyUniqueTokenId } from '../../game/tokens/logic';
import type { TTokenClickData } from '../../types/tokens';
import { useResizeObserver } from '../../hooks/useResizeObserver';
import { Token } from '../Token/Token';
import styles from './LudoBoard.module.css';

const BLOCKS_COUNT = 15;

export const LudoBoard: React.FC = () => {
  const { players, currentPlayerColour } = useSelector((state: RootState) => state.players);
  const { boardTileSize, boardSideLength } = useSelector((state: RootState) => state.board);
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

  const handleBoardClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const currentPlayer = players.find((p) => p.colour === currentPlayerColour);
    if (currentPlayer?.isBot) return;
    if (!boardNode || boardTileSize <= 0) return;

    const { top, left } = boardNode.getBoundingClientRect();
    const boardX = e.clientX - left;
    const boardY = e.clientY - top;

    if (boardX < 0 || boardY < 0 || boardX > boardSideLength || boardY > boardSideLength) return;

    const coordX = Math.min(BLOCKS_COUNT - 1, Math.max(0, Math.floor(boardX / boardTileSize)));
    const coordY = Math.min(BLOCKS_COUNT - 1, Math.max(0, Math.floor(boardY / boardTileSize)));

    const matchingTokens = tokensWithCoord({ x: coordX, y: coordY }, players).filter(
      (t) => t.colour === currentPlayerColour
    );

    if (matchingTokens.length > 0 && !matchingTokens[0].isLocked) {
      setTokenClickData({
        timestamp: Date.now(),
        colour: matchingTokens[0].colour,
        id: matchingTokens[0].id,
      });
    }
  };

  return (
    <div
      className={styles.boardWrapper}
      ref={setBoardNode}
      onClick={handleBoardClick}
      style={
        {
          '--board-tile-size': `${boardTileSize}px`,
        } as React.CSSProperties
      }
    >
      {/* SVG Board Background (1500 x 1500 resolution, exactly 100px per tile) */}
      <svg
        viewBox="0 0 1500 1500"
        className={styles.svgBoard}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          {/* Radial glow gradients for player bases */}
          <radialGradient id="redBaseGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff3366" stopOpacity="0.22" />
            <stop offset="60%" stopColor="#ff3366" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#ff3366" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="greenBaseGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00f59b" stopOpacity="0.22" />
            <stop offset="60%" stopColor="#00f59b" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#00f59b" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="yellowBaseGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffc837" stopOpacity="0.22" />
            <stop offset="60%" stopColor="#ffc837" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#ffc837" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="blueBaseGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00d2ff" stopOpacity="0.22" />
            <stop offset="60%" stopColor="#00d2ff" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#00d2ff" stopOpacity="0" />
          </radialGradient>

          {/* Linear gradients for home pathways */}
          <linearGradient id="redHomeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff3366" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ff3366" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="greenHomeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00f59b" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00f59b" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="yellowHomeGrad" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#ffc837" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ffc837" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="blueHomeGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#00d2ff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00d2ff" stopOpacity="0.95" />
          </linearGradient>

          {/* Star glyph for safe spots */}
          <g id="safeStar">
            <path
              d="M 50,22 L 58,40 L 78,41 L 62,54 L 67,73 L 50,61 L 33,73 L 38,54 L 22,41 L 42,40 Z"
              fill="#ffffff"
              fillOpacity="0.85"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinejoin="round"
              filter="drop-shadow(0 0 6px rgba(255,255,255,0.7))"
            />
          </g>

          {/* Docking circle pocket for locked tokens */}
          <g id="dockPocket">
            <circle cx="0" cy="0" r="42" fill="#0d111b" stroke="rgba(255,255,255,0.12)" strokeWidth="2.5" />
            <circle cx="0" cy="0" r="32" fill="#131926" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="16" fill="rgba(255,255,255,0.04)" />
          </g>
        </defs>

        {/* Board Background */}
        <rect width="1500" height="1500" rx="32" ry="32" fill="#0c0e15" stroke="rgba(255,255,255,0.14)" strokeWidth="3" />

        {/* ========================================================
            1. FOUR CORNER BASES (6x6 = 600 x 600 px)
            ======================================================== */}
        {/* TOP-LEFT: RED BASE */}
        <g>
          <rect x="20" y="20" width="560" height="560" rx="26" ry="26" fill="#121622" stroke="rgba(255,51,102,0.4)" strokeWidth="2.5" />
          <rect x="20" y="20" width="560" height="560" rx="26" ry="26" fill="url(#redBaseGlow)" />
          <rect x="70" y="70" width="460" height="460" rx="22" ry="22" fill="#090c13" stroke="rgba(255,51,102,0.25)" strokeWidth="2" />
          <text x="300" y="290" textAnchor="middle" fill="#ff3366" fontSize="26" fontWeight="700" letterSpacing="4" opacity="0.6">
            RED
          </text>
          {/* 4 Docks: (1.5, 1.2)=>(200,170), (3.5, 1.2)=>(400,170), (1.5, 3.2)=>(200,370), (3.5, 3.2)=>(400,370) */}
          <use href="#dockPocket" x="200" y="170" />
          <use href="#dockPocket" x="400" y="170" />
          <use href="#dockPocket" x="200" y="370" />
          <use href="#dockPocket" x="400" y="370" />
        </g>

        {/* TOP-RIGHT: GREEN BASE */}
        <g>
          <rect x="920" y="20" width="560" height="560" rx="26" ry="26" fill="#121622" stroke="rgba(0,245,155,0.4)" strokeWidth="2.5" />
          <rect x="920" y="20" width="560" height="560" rx="26" ry="26" fill="url(#greenBaseGlow)" />
          <rect x="970" y="70" width="460" height="460" rx="22" ry="22" fill="#090c13" stroke="rgba(0,245,155,0.25)" strokeWidth="2" />
          <text x="1200" y="290" textAnchor="middle" fill="#00f59b" fontSize="26" fontWeight="700" letterSpacing="4" opacity="0.6">
            GREEN
          </text>
          {/* 4 Docks: (10.5, 1.2)=>(1100,170), (12.5, 1.2)=>(1300,170), (10.5, 3.2)=>(1100,370), (12.5, 3.2)=>(1300,370) */}
          <use href="#dockPocket" x="1100" y="170" />
          <use href="#dockPocket" x="1300" y="170" />
          <use href="#dockPocket" x="1100" y="370" />
          <use href="#dockPocket" x="1300" y="370" />
        </g>

        {/* BOTTOM-LEFT: BLUE BASE */}
        <g>
          <rect x="20" y="920" width="560" height="560" rx="26" ry="26" fill="#121622" stroke="rgba(0,210,255,0.4)" strokeWidth="2.5" />
          <rect x="20" y="920" width="560" height="560" rx="26" ry="26" fill="url(#blueBaseGlow)" />
          <rect x="70" y="970" width="460" height="460" rx="22" ry="22" fill="#090c13" stroke="rgba(0,210,255,0.25)" strokeWidth="2" />
          <text x="300" y="1190" textAnchor="middle" fill="#00d2ff" fontSize="26" fontWeight="700" letterSpacing="4" opacity="0.6">
            BLUE
          </text>
          {/* 4 Docks: (1.5, 10.2)=>(200,1070), (3.5, 10.2)=>(400,1070), (1.5, 12.2)=>(200,1270), (3.5, 12.2)=>(400,1270) */}
          <use href="#dockPocket" x="200" y="1070" />
          <use href="#dockPocket" x="400" y="1070" />
          <use href="#dockPocket" x="200" y="1270" />
          <use href="#dockPocket" x="400" y="1270" />
        </g>

        {/* BOTTOM-RIGHT: YELLOW BASE */}
        <g>
          <rect x="920" y="920" width="560" height="560" rx="26" ry="26" fill="#121622" stroke="rgba(255,200,55,0.4)" strokeWidth="2.5" />
          <rect x="920" y="920" width="560" height="560" rx="26" ry="26" fill="url(#yellowBaseGlow)" />
          <rect x="970" y="970" width="460" height="460" rx="22" ry="22" fill="#090c13" stroke="rgba(255,200,55,0.25)" strokeWidth="2" />
          <text x="1200" y="1190" textAnchor="middle" fill="#ffc837" fontSize="26" fontWeight="700" letterSpacing="4" opacity="0.6">
            YELLOW
          </text>
          {/* 4 Docks: (10.5, 10.2)=>(1100,1070), (12.5, 10.2)=>(1300,1070), (10.5, 12.2)=>(1100,1270), (12.5, 12.2)=>(1300,1270) */}
          <use href="#dockPocket" x="1100" y="1070" />
          <use href="#dockPocket" x="1300" y="1070" />
          <use href="#dockPocket" x="1100" y="1270" />
          <use href="#dockPocket" x="1300" y="1270" />
        </g>

        {/* ========================================================
            2. ALL TRACK CELLS (15x15 grid)
            ======================================================== */}
        <g id="trackCells">
          {Array.from({ length: 15 }).map((_, y) =>
            Array.from({ length: 15 }).map((_, x) => {
              // Skip inside corner bases and center 3x3
              const inRedBase = x < 6 && y < 6;
              const inGreenBase = x > 8 && y < 6;
              const inBlueBase = x < 6 && y > 8;
              const inYellowBase = x > 8 && y > 8;
              const inCenter = x >= 6 && x <= 8 && y >= 6 && y <= 8;

              if (inRedBase || inGreenBase || inBlueBase || inYellowBase || inCenter) {
                return null;
              }

              // Determine color / style of this tile
              let fill = '#121622';
              let stroke = 'rgba(255,255,255,0.08)';
              let strokeWidth = '1.5';

              // Red Home Entry Track (y=7, x=1..6)
              if (y === 7 && x >= 1 && x <= 6) {
                fill = 'url(#redHomeGrad)';
                stroke = 'rgba(255,51,102,0.6)';
              }
              // Green Home Entry Track (x=7, y=1..6)
              else if (x === 7 && y >= 1 && y <= 6) {
                fill = 'url(#greenHomeGrad)';
                stroke = 'rgba(0,245,155,0.6)';
              }
              // Yellow Home Entry Track (y=7, x=8..13)
              else if (y === 7 && x >= 8 && x <= 13) {
                fill = 'url(#yellowHomeGrad)';
                stroke = 'rgba(255,200,55,0.6)';
              }
              // Blue Home Entry Track (x=7, y=8..13)
              else if (x === 7 && y >= 8 && y <= 13) {
                fill = 'url(#blueHomeGrad)';
                stroke = 'rgba(0,210,255,0.6)';
              }
              // Player Starts:
              else if (x === 1 && y === 6) {
                // Red Start
                fill = '#ff3366';
                stroke = '#ffffff';
                strokeWidth = '2';
              } else if (x === 8 && y === 1) {
                // Green Start
                fill = '#00f59b';
                stroke = '#ffffff';
                strokeWidth = '2';
              } else if (x === 13 && y === 8) {
                // Yellow Start
                fill = '#ffc837';
                stroke = '#ffffff';
                strokeWidth = '2';
              } else if (x === 6 && y === 13) {
                // Blue Start
                fill = '#00d2ff';
                stroke = '#ffffff';
                strokeWidth = '2';
              }

              return (
                <rect
                  key={`cell-${x}-${y}`}
                  x={x * 100 + 4}
                  y={y * 100 + 4}
                  width="92"
                  height="92"
                  rx="14"
                  ry="14"
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                />
              );
            })
          )}
        </g>

        {/* ========================================================
            3. SAFE SPOT ICONS (Stars on safe tiles)
            ======================================================== */}
        <g id="safeStars">
          {/* Red Safe: (1, 6) start, (2, 8) safe */}
          <use href="#safeStar" x={1 * 100} y={6 * 100} />
          <use href="#safeStar" x={2 * 100} y={8 * 100} />

          {/* Green Safe: (8, 1) start, (6, 2) safe */}
          <use href="#safeStar" x={8 * 100} y={1 * 100} />
          <use href="#safeStar" x={6 * 100} y={2 * 100} />

          {/* Yellow Safe: (13, 8) start, (12, 6) safe */}
          <use href="#safeStar" x={13 * 100} y={8 * 100} />
          <use href="#safeStar" x={12 * 100} y={6 * 100} />

          {/* Blue Safe: (6, 13) start, (8, 12) safe */}
          <use href="#safeStar" x={6 * 100} y={13 * 100} />
          <use href="#safeStar" x={8 * 100} y={12 * 100} />
        </g>

        {/* ========================================================
            4. CENTER HOME TRIANGLES (600..900, 600..900)
            ======================================================== */}
        <g id="centerHome">
          {/* Base plate */}
          <rect x="600" y="600" width="300" height="300" fill="#090c13" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />

          {/* Left: Red Triangle (600,600) -> (600,900) -> (750,750) */}
          <polygon
            points="600,600 600,900 750,750"
            fill="#ff3366"
            fillOpacity="0.8"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1.5"
          />

          {/* Top: Green Triangle (600,600) -> (900,600) -> (750,750) */}
          <polygon
            points="600,600 900,600 750,750"
            fill="#00f59b"
            fillOpacity="0.8"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1.5"
          />

          {/* Right: Yellow Triangle (900,600) -> (900,900) -> (750,750) */}
          <polygon
            points="900,600 900,900 750,750"
            fill="#ffc837"
            fillOpacity="0.8"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1.5"
          />

          {/* Bottom: Blue Triangle (600,900) -> (900,900) -> (750,750) */}
          <polygon
            points="600,900 900,900 750,750"
            fill="#00d2ff"
            fillOpacity="0.8"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1.5"
          />

          {/* Center Golden Medallion */}
          <circle cx="750" cy="750" r="38" fill="#121622" stroke="#ffd166" strokeWidth="3" filter="drop-shadow(0 0 10px rgba(255,209,102,0.8))" />
          <path
            d="M 750,724 L 757,742 L 775,742 L 760,754 L 766,772 L 750,760 L 734,772 L 740,754 L 725,742 L 743,742 Z"
            fill="#ffd166"
          />
        </g>
      </svg>

      {/* Render Tokens directly over the board with exact coordinates */}
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
    </div>
  );
};
