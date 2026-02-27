"use client";

import { useEffect, useCallback, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

/**
 * Sets user as online on mount and offline on unmount or logout.
 * Heartbeat every 20 seconds maintains online status.
 */
export function usePresence(clerkId: string | undefined) {
  const setPresenceMutation = useMutation(api.presence.setPresence);
  const prevClerkId = useRef<string | undefined>(undefined);

  const setOnline = useCallback((id: string) => {
    setPresenceMutation({ clerkId: id, online: true });
  }, [setPresenceMutation]);

  const setOffline = useCallback((id: string) => {
    setPresenceMutation({ clerkId: id, online: false });
  }, [setPresenceMutation]);

  useEffect(() => {
    if (clerkId) {
      prevClerkId.current = clerkId;
      setOnline(clerkId);

      const heartbeat = setInterval(() => setOnline(clerkId), 20000);

      function handleBeforeUnload() {
        setOffline(clerkId!);
      }

      window.addEventListener("beforeunload", handleBeforeUnload);

      return () => {
        clearInterval(heartbeat);
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    } else {
      if (prevClerkId.current) {
        setOffline(prevClerkId.current);
        prevClerkId.current = undefined;
      }
    }
  }, [clerkId, setOnline, setOffline]);
}
