import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type UserState = {
  email: string | null;
  role: string | null;
};

const initialState: UserState = {
  email: null,
  role: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser(
      state,
      action: PayloadAction<{ email: string | null; role?: string | null }>
    ) {
      state.email = action.payload.email;
      state.role = action.payload.role ?? "employee";
    },
    clearUser(state) {
      state.email = null;
      state.role = null;
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
