"use client";

import { useAppDispatch, useAppSelector } from "@/common/store/hooks";
import { clearUser, setUser } from "@/common/state/slices/userSlice";

export function useUser() {
  const dispatch = useAppDispatch();
  const email = useAppSelector((s) => s.user.email);
  const role = useAppSelector((s) => s.user.role);

  return {
    email,
    role,
    setUser: (payload: { email: string | null; role?: string | null }) =>
      dispatch(setUser(payload)),
    clearUser: () => dispatch(clearUser()),
  };
}
