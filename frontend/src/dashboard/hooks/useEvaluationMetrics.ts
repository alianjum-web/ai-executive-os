import { useState, useCallback } from "react";
import type { EvaluationMetrics } from "@/common/types";
import { fetchEvaluationMetrics } from "@/common/api";

export function useEvaluationMetrics(enabled: boolean) {
    const [metrics, setMetrics] = useState<EvaluationMetrics | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
  
    const load = useCallback(async () => {
      if (!enabled) return;
      
      setLoading(true);
      setError(null);
      try {
        const data = await fetchEvaluationMetrics();
        setMetrics(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load evaluation metrics");
      } finally {
        setLoading(false);
      }
    }, [enabled]);
  
    return { metrics, error, loading, load };
  }