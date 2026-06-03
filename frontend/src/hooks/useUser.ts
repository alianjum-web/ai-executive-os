"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearUser, setUser } from "@/store/slices/userSlice";

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
