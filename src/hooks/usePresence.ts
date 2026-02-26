"use client";

import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

/**
 * Sets user as online on mount and offline on unmount.
 * Also sets offline when the browser tab is closed or hidden.
 */
export function usePresence(clerkId: string | undefined) {
  const setPresence = useMutation(api.presence.setPresence);

  useEffect(() => {
    if (!clerkId) return;

    setPresence({ clerkId, online: true });

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        setPresence({ clerkId: clerkId!, online: false });
      } else {
        setPresence({ clerkId: clerkId!, online: true });
      }
    }

    function handleBeforeUnload() {
      setPresence({ clerkId: clerkId!, online: false });
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      setPresence({ clerkId: clerkId!, online: false });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [clerkId, setPresence]);
}
