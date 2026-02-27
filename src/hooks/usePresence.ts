"use client";

import { useEffect, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

/**
 * Sets user as online on mount and offline only on tab/window close.
 * Heartbeat every 20 seconds maintains online status.
 */
export function usePresence(clerkId: string | undefined) {
  const setPresenceMutation = useMutation(api.presence.setPresence);

  const setOnline = useCallback(() => {
    if (!clerkId) return;
    setPresenceMutation({ clerkId, online: true });
  }, [clerkId, setPresenceMutation]);

  const setOffline = useCallback(() => {
    if (!clerkId) return;
    setPresenceMutation({ clerkId, online: false });
  }, [clerkId, setPresenceMutation]);

  useEffect(() => {
    if (!clerkId) return;

    setOnline();

    const heartbeat = setInterval(setOnline, 20000);

    window.addEventListener("beforeunload", setOffline);

    return () => {
      clearInterval(heartbeat);
      window.removeEventListener("beforeunload", setOffline);
    };
  }, [clerkId, setOnline, setOffline]);
}
