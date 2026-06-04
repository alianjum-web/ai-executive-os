"use client";

import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/common/store/hooks";
import { setTheme, toggleTheme } from "@/common/state/slices/uiSlice";
import {
  applyThemeToDocument,
  getStoredTheme,
  persistTheme,
  type Theme,
} from "@/common/lib/theme";

let didHydrateFromStorage = false;
let skipThemeEffectOnce = true;

export function useTheme() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((s) => s.ui.theme);

  useEffect(() => {
    if (didHydrateFromStorage) return;
    didHydrateFromStorage = true;

    const stored = getStoredTheme();
    if (stored) {
      dispatch(setTheme(stored));
      applyThemeToDocument(stored);
    }
  }, [dispatch]);

  useEffect(() => {
    if (skipThemeEffectOnce) {
      skipThemeEffectOnce = false;
      return;
    }
    applyThemeToDocument(theme);
    persistTheme(theme);
  }, [theme]);

  const set = useCallback(
    (next: Theme) => {
      skipThemeEffectOnce = false;
      dispatch(setTheme(next));
    },
    [dispatch]
  );

  const toggle = useCallback(() => {
    skipThemeEffectOnce = false;
    dispatch(toggleTheme());
  }, [dispatch]);

  return {
    theme,
    setTheme: set,
    toggleTheme: toggle,
    isDark: theme === "dark",
  };
}
