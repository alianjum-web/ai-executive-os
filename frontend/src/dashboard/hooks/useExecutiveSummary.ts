"use client";

import { useState, useCallback } from "react";
import { fetchExecutiveSummary } from "@/common/api/client";
import type { ExecutiveSummary } from "@/common/types";


export function useExecutiveSummary() {
    const [summary, setSummary] = useState<ExecutiveSummary | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
  
    const load = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchExecutiveSummary();
        setSummary(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load executive summary");
      } finally {
        setLoading(false);
      }
    }, []);
  
    return { summary, error, loading, load };
  }