"use client";

import { useAppDispatch, useAppSelector } from "@/common/store/hooks";
import { clearOrg, setOrg } from "@/common/state/slices/orgSlice";

export function useOrg() {
  const dispatch = useAppDispatch();
  const orgId = useAppSelector((s) => s.org.orgId);
  const orgName = useAppSelector((s) => s.org.orgName);

  return {
    orgId,
    orgName,
    setOrg: (payload: { orgId: string | null; orgName?: string | null }) =>
      dispatch(setOrg(payload)),
    clearOrg: () => dispatch(clearOrg()),
  };
}
