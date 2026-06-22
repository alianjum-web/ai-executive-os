import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AnalyticsDashboard } from "@/common/api/client";
import {
  applyFetchError,
  applyFetchSuccess,
  initialAsyncFetch,
} from "@/common/state/asyncResource";

export type AnalyticsState = {
  metrics: AnalyticsDashboard | null;
} & typeof initialAsyncFetch;

const initialState: AnalyticsState = {
  metrics: null,
  ...initialAsyncFetch,
};

const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {
    setAnalyticsLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setMetrics(state, action: PayloadAction<AnalyticsDashboard>) {
      state.metrics = action.payload;
      applyFetchSuccess(state);
    },
    clearAnalyticsFetchError(state) {
      state.error = null;
      state.apiUnreachable = false;
    },
    setAnalyticsFetchError(
      state,
      action: PayloadAction<{ error: string; apiUnreachable?: boolean }>
    ) {
      applyFetchError(
        state,
        action.payload.error,
        action.payload.apiUnreachable ?? false
      );
    },
    finishAnalyticsLoading(state) {
      state.isLoading = false;
    },
    resetAnalytics() {
      return initialState;
    },
  },
});

export const {
  setAnalyticsLoading,
  setMetrics,
  clearAnalyticsFetchError,
  setAnalyticsFetchError,
  finishAnalyticsLoading,
  resetAnalytics,
} = analyticsSlice.actions;
export default analyticsSlice.reducer;
