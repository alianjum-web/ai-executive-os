import { useState, useCallback } from "react";
import { fetchUnansweredReport } from "@/common/api/client";
import type { UnansweredQuestionsReport as UnansweredReport } from "@/common/types";

export function useUnansweredReport() {
    const [report, setReport] = useState<UnansweredReport | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
  
    const load = useCallback(async () => {
      setLoading(true);
      setError(null);
  
      try {
        const data = await fetchUnansweredReport();
        setReport(data);
      } catch (e) {
        setError(
          e instanceof Error 
            ? e.message 
            : "Failed to load gap report"
        );
      } finally {
        setLoading(false);
      }
    }, []);
  
    return { report, error, loading, load };
  }