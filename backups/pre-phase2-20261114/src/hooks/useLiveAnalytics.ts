import { useState, useEffect, useCallback, useRef } from "react";
import { analyticsService, LiveAnalyticsData } from "../services/analyticsService";

export type { LiveAnalyticsData };

export type ConnectionStatus = "connecting" | "live" | "reconnecting" | "offline";

export interface LiveAnalyticsHook {
  data: LiveAnalyticsData | null;
  status: ConnectionStatus;
  isSimulating: boolean;
  simulateMsg: string;
  reconnect: () => void;
  recordConversion: (latencyMs?: number, success?: boolean) => Promise<boolean>;
}

export const useLiveAnalytics = (pollFallbackMs = 5000): LiveAnalyticsHook => {
  const [data, setData] = useState<LiveAnalyticsData | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulateMsg, setSimulateMsg] = useState("");
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const connect = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    unsubscribeRef.current = analyticsService.subscribeToLiveMetrics({
      onData: (newData) => {
        setData(newData);
      },
      onStatusChange: (newStatus) => {
        setStatus(newStatus);
      },
      onError: (err) => {
        console.warn("Live analytics stream error:", err);
      },
    });
  }, []);

  useEffect(() => {
    connect();

    // Periodic poll loop to ensure fresh snapshot
    const pollInterval = setInterval(async () => {
      const snapshot = await analyticsService.getSnapshot();
      if (snapshot) {
        setData(snapshot);
      }
    }, pollFallbackMs);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      clearInterval(pollInterval);
    };
  }, [connect, pollFallbackMs]);

  const recordConversion = useCallback(async (latencyMs = 15, success = true): Promise<boolean> => {
    setIsSimulating(true);
    setSimulateMsg("");

    try {
      const updatedStats = await analyticsService.recordConversion(latencyMs, success);
      if (updatedStats) {
        setData(updatedStats);
        setSimulateMsg(`✓ Real-time conversion recorded! (${latencyMs}ms)`);
        setTimeout(() => setSimulateMsg(""), 3000);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to record conversion:", err);
      return false;
    } finally {
      setIsSimulating(false);
    }
  }, []);

  return {
    data,
    status,
    isSimulating,
    simulateMsg,
    reconnect: connect,
    recordConversion,
  };
};
