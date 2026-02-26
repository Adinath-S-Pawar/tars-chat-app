"use client";

import { useEffect, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

/**
 * Sets user as online on mount and offline on unmount.
 * Sends a heartbeat every 30 seconds to maintain online status.
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

    const heartbeat = setInterval(setOnline, 30000);

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        setOffline();
      } else {
        setOnline();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", setOffline);

    return () => {
      clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", setOffline);
    };
  }, [clerkId, setOnline, setOffline]);
}
