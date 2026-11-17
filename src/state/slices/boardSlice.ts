import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type TBoardState = {
  boardSideLength: number;
  boardTileSize: number;
  tokenHeight: number;
  tokenWidth: number;
};

export const NUMBER_OF_BLOCKS_IN_ONE_ROW = 15;
export const TOKEN_WIDTH_HEIGHT_RATIO = 0.625;

const DEFAULT_BOARD_LENGTH = 360;
const DEFAULT_TILE_SIZE = DEFAULT_BOARD_LENGTH / NUMBER_OF_BLOCKS_IN_ONE_ROW; // 24
const DEFAULT_TOKEN_HEIGHT = DEFAULT_TILE_SIZE * 0.8; // 19.2
const DEFAULT_TOKEN_WIDTH = DEFAULT_TOKEN_HEIGHT * TOKEN_WIDTH_HEIGHT_RATIO; // 12

export const initialState: TBoardState = {
  boardSideLength: DEFAULT_BOARD_LENGTH,
  boardTileSize: DEFAULT_TILE_SIZE,
  tokenHeight: DEFAULT_TOKEN_HEIGHT,
  tokenWidth: DEFAULT_TOKEN_WIDTH,
};

const reducers = {
  resizeBoard: (state: TBoardState, action: PayloadAction<number>) => {
    if (action.payload <= 0) return;
    state.boardSideLength = action.payload;
    state.boardTileSize = action.payload / NUMBER_OF_BLOCKS_IN_ONE_ROW;
    state.tokenHeight = (action.payload / NUMBER_OF_BLOCKS_IN_ONE_ROW) * 0.8;
    state.tokenWidth =
      (action.payload / NUMBER_OF_BLOCKS_IN_ONE_ROW) * 0.8 * TOKEN_WIDTH_HEIGHT_RATIO;
  },
  clearBoardState: (state: TBoardState) => {
    // Retain existing measured dimensions if available, rather than zeroing
    if (state.boardTileSize <= 0) {
      state.boardSideLength = DEFAULT_BOARD_LENGTH;
      state.boardTileSize = DEFAULT_TILE_SIZE;
      state.tokenHeight = DEFAULT_TOKEN_HEIGHT;
      state.tokenWidth = DEFAULT_TOKEN_WIDTH;
    }
  },
};

const boardSlice = createSlice({
  name: 'board',
  initialState,
  reducers,
});

export const { resizeBoard, clearBoardState } = boardSlice.actions;

export default boardSlice.reducer;
