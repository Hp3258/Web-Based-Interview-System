import { useEffect, useRef, useState, useCallback } from "react";
import { sessionApi } from "../api/sessions";
import toast from "react-hot-toast";

const MAX_WARNINGS = 3;

/**
 * Proctoring hook — enforces fullscreen and detects tab/window switches.
 *
 * @param {string}  sessionId   - current session mongo id
 * @param {boolean} isCandidate - true when the user is the participant (not the host)
 * @param {boolean} isActive    - true when session status === "active"
 * @param {object}  channel     - Stream Chat channel (used to notify host in real-time)
 */
export default function useProctoring(sessionId, isCandidate, isActive, channel) {
  const [violationCount, setViolationCount] = useState(0);
  const [terminated, setTerminated] = useState(false);
  const [fullscreenActive, setFullscreenActive] = useState(false);
  const fullscreenRequested = useRef(false);
  const violationRef = useRef(0); // mirror for async callbacks

  // ─── Request fullscreen ────────────────────────────────────────────
  const enterFullscreen = useCallback(async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      else if (el.msRequestFullscreen) await el.msRequestFullscreen();
      setFullscreenActive(true);
      fullscreenRequested.current = true;
    } catch (err) {
      console.warn("Fullscreen request denied:", err);
    }
  }, []);

  // ─── Record a violation (backend + toast + host notification) ──────
  const recordViolation = useCallback(
    async (type, description) => {
      const newCount = violationRef.current + 1;
      violationRef.current = newCount;
      setViolationCount(newCount);

      // persist to backend
      try {
        await sessionApi.recordViolation({ sessionId, type, description });
      } catch (err) {
        console.error("Failed to record violation:", err);
      }

      // notify host via stream channel event
      if (channel) {
        channel
          .sendEvent({
            type: "proctoring_violation",
            violationType: type,
            description,
            violationCount: newCount,
          })
          .catch(() => {});
      }

      const remaining = MAX_WARNINGS - newCount;

      if (remaining > 0) {
        toast.error(
          `⚠️ Warning ${newCount}/${MAX_WARNINGS}: ${description}. ${remaining} warning(s) left before session termination!`,
          { duration: 5000 }
        );
      } else {
        setTerminated(true);
        toast.error(
          "🚫 Maximum violations reached! Your session has been flagged and terminated.",
          { duration: 8000 }
        );
      }
    },
    [sessionId, channel]
  );

  // ─── Fullscreen change handler ─────────────────────────────────────
  useEffect(() => {
    if (!isCandidate || !isActive || terminated) return;

    const handleFullscreenChange = () => {
      const isFS = !!document.fullscreenElement;
      setFullscreenActive(isFS);

      // Only count as violation if we previously had fullscreen and user exited
      if (!isFS && fullscreenRequested.current) {
        recordViolation("fullscreen_exit", "Exited fullscreen mode");
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, [isCandidate, isActive, terminated, recordViolation]);

  // ─── Tab / window visibility handler (debounced to avoid double-fire) ──
  const lastTabViolationTime = useRef(0);

  useEffect(() => {
    if (!isCandidate || !isActive || terminated) return;

    const triggerTabViolation = (description) => {
      const now = Date.now();
      // debounce: ignore if a tab-switch violation was logged within 2 seconds
      if (now - lastTabViolationTime.current < 2000) return;
      lastTabViolationTime.current = now;
      recordViolation("tab_switch", description);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerTabViolation("Switched to another tab or window");
      }
    };

    const handleWindowBlur = () => {
      triggerTabViolation("Window lost focus (possible tab switch)");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    // window blur catches alt-tab and similar
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [isCandidate, isActive, terminated, recordViolation]);

  // ─── Auto-enter fullscreen on mount ────────────────────────────────
  useEffect(() => {
    if (isCandidate && isActive && !terminated) {
      // Small delay to let the page render first
      const timer = setTimeout(() => enterFullscreen(), 800);
      return () => clearTimeout(timer);
    }
  }, [isCandidate, isActive, terminated, enterFullscreen]);

  // ─── Cleanup: exit fullscreen when leaving page ────────────────────
  useEffect(() => {
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  return {
    violationCount,
    terminated,
    fullscreenActive,
    enterFullscreen,
    maxWarnings: MAX_WARNINGS,
  };
}
