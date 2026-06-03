import { configureStore } from "@reduxjs/toolkit";
import chatReducer from "./slices/chatSlice";
import uiReducer from "./slices/uiSlice";
import userReducer from "./slices/userSlice";

export const makeStore = () =>
  configureStore({
    reducer: {
      ui: uiReducer,
      chat: chatReducer,
      user: userReducer,
    },
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
