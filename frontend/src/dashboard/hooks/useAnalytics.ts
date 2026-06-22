"use client";

import { useCallback, useEffect, useRef } from "react";
import { analyticsPolling } from "@/common/config/polling.config";
import { useVisibilityPolling } from "@/common/hooks/useVisibilityPolling";
import { isApiUnreachableError } from "@/common/api/fetch";
import { fetchAnalytics } from "@/common/api/client";
import { useFeatureFlag } from "@/common/hooks/useFeatureFlag";
import { useAppDispatch, useAppSelector } from "@/common/store/hooks";
import {
  clearAnalyticsFetchError,
  finishAnalyticsLoading,
  setAnalyticsFetchError,
  setAnalyticsLoading,
  setMetrics,
} from "@/dashboard/state/analyticsSlice";

export function useAnalytics() {
  const dispatch = useAppDispatch();
  const enabled = useFeatureFlag("ANALYTICS_DASHBOARD_ENABLED");
  const metrics = useAppSelector((s) => s.analytics.metrics);
  const isLoading = useAppSelector((s) => s.analytics.isLoading);
  const error = useAppSelector((s) => s.analytics.error);
  const apiUnreachable = useAppSelector((s) => s.analytics.apiUnreachable);
  const showLoadingOnNextPoll = useRef(enabled);
  const lastFingerprint = useRef("");

  const refresh = useCallback(async () => {
    if (!enabled) return;
    if (showLoadingOnNextPoll.current) {
      showLoadingOnNextPoll.current = false;
      dispatch(setAnalyticsLoading(true));
    }
    try {
      const data = await fetchAnalytics();
      const fp = JSON.stringify(data);
      if (fp !== lastFingerprint.current) {
        lastFingerprint.current = fp;
        dispatch(setMetrics(data));
      } else {
        dispatch(clearAnalyticsFetchError());
        dispatch(finishAnalyticsLoading());
      }
    } catch (e) {
      dispatch(
        setAnalyticsFetchError({
          error: e instanceof Error ? e.message : "Failed to load metrics",
          apiUnreachable: isApiUnreachableError(e),
        })
      );
    } finally {
      dispatch(finishAnalyticsLoading());
    }
  }, [dispatch, enabled]);

  useEffect(() => {
    if (enabled) {
      showLoadingOnNextPoll.current = true;
      dispatch(setAnalyticsLoading(true));
    }
  }, [dispatch, enabled]);

  useVisibilityPolling({
    enabled: enabled && !apiUnreachable,
    onPoll: refresh,
    ...analyticsPolling,
  });

  return {
    enabled,
    metrics,
    isLoading: enabled ? isLoading : false,
    error: enabled ? error : null,
    apiUnreachable,
    refresh,
  };
}
