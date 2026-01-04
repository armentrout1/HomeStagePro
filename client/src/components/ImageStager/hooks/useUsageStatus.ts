import { useCallback, useEffect, useState } from "react";
import { UsageStatus } from "../types";
import { fetchUsageStatus } from "../api/usageStatusApi";

export function useUsageStatus() {
  const [usageStatus, setUsageStatus] = useState<UsageStatus | null>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);

  const refreshUsageStatus = useCallback(async () => {
    setIsLoadingUsage(true);
    try {
      const data = await fetchUsageStatus();
      if (data) {
        setUsageStatus(data);
      }
    } finally {
      setIsLoadingUsage(false);
    }
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    refreshUsageStatus();
  }, [refreshUsageStatus]);

  return {
    usageStatus,
    isLoadingUsage,
    refreshUsageStatus,
  };
}
