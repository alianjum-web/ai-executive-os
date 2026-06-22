import { configureStore } from "@reduxjs/toolkit";
import chatReducer from "@/chat/state/chatSlice";
import analyticsReducer from "@/dashboard/state/analyticsSlice";
import knowledgeReducer from "@/knowledge/state/knowledgeSlice";
import ticketReducer from "@/tickets/state/ticketSlice";
import uiReducer from "@/common/state/slices/uiSlice";
import orgReducer from "@/common/state/slices/orgSlice";
import userReducer from "@/common/state/slices/userSlice";

export const makeStore = () =>
  configureStore({
    reducer: {
      ui: uiReducer,
      chat: chatReducer,
      user: userReducer,
      org: orgReducer,
      tickets: ticketReducer,
      knowledge: knowledgeReducer,
      analytics: analyticsReducer,
    },
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
