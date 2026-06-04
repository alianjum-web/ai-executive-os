import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Theme } from "@/common/lib/theme";

type UIState = {
  sidebarOpen: boolean;
  mobileNavOpen: boolean;
  theme: Theme;
};

const initialState: UIState = {
  sidebarOpen: true,
  theme: "dark",
  mobileNavOpen: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setTheme(state, action: PayloadAction<Theme>) {
      state.theme = action.payload;
    },
    toggleTheme(state) {
      state.theme = state.theme === "light" ? "dark" : "light";
    },
    setMobileNavOpen(state, action: PayloadAction<boolean>) {
      state.mobileNavOpen = action.payload;
    },
    toggleMobileNav(state) {
      state.mobileNavOpen = !state.mobileNavOpen;
    },
  },
});

export const {
  setSidebarOpen,
  toggleSidebar,
  setTheme,
  toggleTheme,
  setMobileNavOpen,
  toggleMobileNav,
} = uiSlice.actions;
export default uiSlice.reducer;
