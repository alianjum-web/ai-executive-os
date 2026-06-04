"use client";

import { useAppDispatch, useAppSelector } from "@/common/store/hooks";
import { setSidebarOpen, toggleSidebar } from "@/common/state/slices/uiSlice";

export function useSidebar() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((s) => s.ui.sidebarOpen);

  return {
    isOpen,
    toggle: () => dispatch(toggleSidebar()),
    setOpen: (open: boolean) => dispatch(setSidebarOpen(open)),
  };
}
