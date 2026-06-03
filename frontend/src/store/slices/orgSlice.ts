import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type OrgState = {
  orgId: string | null;
  orgName: string | null;
};

const initialState: OrgState = {
  orgId: null,
  orgName: null,
};

const orgSlice = createSlice({
  name: "org",
  initialState,
  reducers: {
    setOrg(state, action: PayloadAction<{ orgId: string | null; orgName?: string | null }>) {
      state.orgId = action.payload.orgId;
      state.orgName = action.payload.orgName ?? null;
    },
    clearOrg(state) {
      state.orgId = null;
      state.orgName = null;
    },
  },
});

export const { setOrg, clearOrg } = orgSlice.actions;
export default orgSlice.reducer;
