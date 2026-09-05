import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type UiState = {
  /** Last videos-list page so edit → back lands on the same page. */
  videosPage: number;
  /** Last learners-list page. */
  learnersPage: number;
};

const initialState: UiState = {
  videosPage: 1,
  learnersPage: 1,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setVideosPage(state, action: PayloadAction<number>) {
      state.videosPage = Math.max(1, action.payload);
    },
    setLearnersPage(state, action: PayloadAction<number>) {
      state.learnersPage = Math.max(1, action.payload);
    },
  },
});

export const { setVideosPage, setLearnersPage } = uiSlice.actions;
export default uiSlice.reducer;
