import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { TicketRecord } from "@/common/api/client";
import {
  applyFetchError,
  applyFetchSuccess,
  initialAsyncFetch,
} from "@/common/state/asyncResource";

export type TicketState = {
  tickets: TicketRecord[];
} & typeof initialAsyncFetch;

const initialState: TicketState = {
  tickets: [],
  ...initialAsyncFetch,
};

const ticketSlice = createSlice({
  name: "tickets",
  initialState,
  reducers: {
    setTicketsLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setTickets(state, action: PayloadAction<TicketRecord[]>) {
      state.tickets = action.payload;
      applyFetchSuccess(state);
    },
    clearTicketsFetchError(state) {
      state.error = null;
      state.apiUnreachable = false;
    },
    setTicketsFetchError(
      state,
      action: PayloadAction<{ error: string; apiUnreachable?: boolean }>
    ) {
      applyFetchError(
        state,
        action.payload.error,
        action.payload.apiUnreachable ?? false
      );
    },
    finishTicketsLoading(state) {
      state.isLoading = false;
    },
    resetTickets() {
      return initialState;
    },
  },
});

export const {
  setTicketsLoading,
  setTickets,
  clearTicketsFetchError,
  setTicketsFetchError,
  finishTicketsLoading,
  resetTickets,
} = ticketSlice.actions;
export default ticketSlice.reducer;
