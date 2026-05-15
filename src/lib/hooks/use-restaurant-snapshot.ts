"use client";

import { useCallback, useEffect, useState } from "react";
import {
  demoSnapshot,
  loadRestaurantSnapshot,
  type RestaurantSnapshot,
} from "@/lib/data-source";
import {
  subscribeToRestaurantRealtime,
  type RestaurantRealtimeStatus,
} from "@/lib/realtime";
import { isSupabaseConfigured } from "@/lib/supabase";

export type SnapshotConnectionState = "demo" | "loading" | "ready" | "fallback";

export function useRestaurantSnapshot() {
  const [snapshot, setSnapshot] = useState<RestaurantSnapshot>(demoSnapshot);
  const [connectionState, setConnectionState] =
    useState<SnapshotConnectionState>(() =>
      isSupabaseConfigured() ? "loading" : "demo",
    );
  const [realtimeStatus, setRealtimeStatus] = useState<RestaurantRealtimeStatus>(
    isSupabaseConfigured() ? "connecting" : "off",
  );
  const [loading, setLoading] = useState(isSupabaseConfigured());

  const applySnapshot = useCallback((next: RestaurantSnapshot) => {
    setSnapshot(next);
    setConnectionState(
      next.source === "supabase" && !next.error ? "ready" : "fallback",
    );
    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      applySnapshot(demoSnapshot);
      return demoSnapshot;
    }

    setLoading(true);
    const next = await loadRestaurantSnapshot();
    applySnapshot(next);
    return next;
  }, [applySnapshot]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let cancelled = false;
    let reloadTimer: number | undefined;

    const unsubscribe = subscribeToRestaurantRealtime({
      onChange: () => {
        window.clearTimeout(reloadTimer);
        reloadTimer = window.setTimeout(() => {
          if (!cancelled) void refresh();
        }, 350);
      },
      onStatus: (status) => {
        if (!cancelled) setRealtimeStatus(status);
      },
    });

    return () => {
      cancelled = true;
      window.clearTimeout(reloadTimer);
      unsubscribe();
    };
  }, [refresh]);

  return {
    snapshot,
    loading,
    connectionState,
    realtimeStatus,
    refresh,
  };
}
