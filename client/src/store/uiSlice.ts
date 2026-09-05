import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type UiState = {
  learnerLearnStatus: 'all' | 'continue' | 'assigned' | 'completed';
};

const initialState: UiState = {
  learnerLearnStatus: 'all',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLearnerLearnStatus(
      state,
      action: PayloadAction<UiState['learnerLearnStatus']>,
    ) {
      state.learnerLearnStatus = action.payload;
    },
  },
});

export const { setLearnerLearnStatus } = uiSlice.actions;
export default uiSlice.reducer;
