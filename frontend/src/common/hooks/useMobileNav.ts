"use client";

import { useAppDispatch, useAppSelector } from "@/common/store/hooks";
import {
  setMobileNavOpen,
  toggleMobileNav,
} from "@/common/state/slices/uiSlice";

export function useMobileNav() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((s) => s.ui.mobileNavOpen);

  return {
    isOpen,
    open: () => dispatch(setMobileNavOpen(true)),
    close: () => dispatch(setMobileNavOpen(false)),
    toggle: () => dispatch(toggleMobileNav()),
  };
}
