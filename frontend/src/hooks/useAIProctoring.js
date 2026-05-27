import { useEffect, useRef, useState, useCallback } from "react";
import { sessionApi } from "../api/sessions";
import toast from "react-hot-toast";

const SCAN_INTERVAL = 4000; // analyse every 4s
const VID_W = 320;
const VID_H = 240;

// Per-type cooldown so we don't spam the same alert (ms)
const COOLDOWN = {
  phone_detected: 30000,
  suspicious_object: 30000,
  person_away: 15000,
  looking_away: 20000,
  multiple_persons: 30000,
  external_webcam: 120000,
};

const SUSPICIOUS = new Set(["cell phone", "book", "remote"]);

/**
 * AI-based proctoring — runs COCO-SSD (object detection) and BlazeFace
 * (gaze / face detection) on the candidate's webcam feed in-browser.
 */
export default function useAIProctoring(sessionId, isCandidate, isActive, terminated, channel) {
  const [aiReady, setAiReady] = useState(false);
  const [alerts, setAlerts] = useState([]); // current frame alerts
  const [cameraCount, setCameraCount] = useState(1);

  const videoEl = useRef(null);
  const mediaStream = useRef(null);
  const cocoModel = useRef(null);
  const faceModel = useRef(null);
  const canvas = useRef(null);
  const loopId = useRef(null);
  const lastReport = useRef({});

  const enabled = isCandidate && isActive && !terminated;

  // ── helpers ────────────────────────────────────────────────────────
  const canReport = useCallback((type) => {
    const now = Date.now();
    if (now - (lastReport.current[type] || 0) < (COOLDOWN[type] || 15000)) return false;
    lastReport.current[type] = now;
    return true;
  }, []);

  const report = useCallback(
    async (type, description) => {
      if (!canReport(type)) return;
      try { await sessionApi.recordViolation({ sessionId, type, description }); } catch {}
      if (channel) {
        channel.sendEvent({ type: "proctoring_violation", violationType: type, description, ai: true }).catch(() => {});
      }
      toast.error(`🤖 AI Alert: ${description}`, { duration: 4000 });
    },
    [sessionId, channel, canReport]
  );

  // ── camera enumeration ─────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const checkCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cams = devices.filter((d) => d.kind === "videoinput");
        setCameraCount(cams.length);
        if (cams.length > 1) {
          report("external_webcam", `Multiple cameras detected (${cams.length}). Possible external webcam.`);
        }
      } catch {}
    };

    checkCameras();
    navigator.mediaDevices.addEventListener("devicechange", checkCameras);
    return () => navigator.mediaDevices.removeEventListener("devicechange", checkCameras);
  }, [enabled, report]);

  // ── load models + start video ──────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const init = async () => {
      try {
        // lazy-import so the bundle stays small for non-candidates
        const [tf, cocoSsd, blazeface] = await Promise.all([
          import("@tensorflow/tfjs"),
          import("@tensorflow-models/coco-ssd"),
          import("@tensorflow-models/blazeface"),
        ]);
        await tf.ready();

        const [coco, face] = await Promise.all([cocoSsd.load(), blazeface.load()]);
        if (cancelled) return;
        cocoModel.current = coco;
        faceModel.current = face;

        // hidden video element for frame capture
        const vid = document.createElement("video");
        vid.setAttribute("autoplay", "");
        vid.setAttribute("playsinline", "");
        vid.width = VID_W;
        vid.height = VID_H;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: VID_W, height: VID_H, facingMode: "user" },
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }

        vid.srcObject = stream;
        await vid.play();
        videoEl.current = vid;
        mediaStream.current = stream;

        const cvs = document.createElement("canvas");
        cvs.width = VID_W;
        cvs.height = VID_H;
        canvas.current = cvs;

        setAiReady(true);
      } catch (err) {
        console.warn("AI Proctoring init failed:", err);
      }
    };

    init();
    return () => { cancelled = true; };
  }, [enabled]);

  // ── analysis loop ──────────────────────────────────────────────────
  useEffect(() => {
    if (!aiReady || !enabled) return;

    const analyse = async () => {
      const vid = videoEl.current;
      const cvs = canvas.current;
      if (!vid || !cvs || vid.readyState < 2) return;

      const ctx = cvs.getContext("2d");
      ctx.drawImage(vid, 0, 0, VID_W, VID_H);

      const frameAlerts = [];

      // ─ COCO-SSD: objects ─────────────────────────────────
      try {
        const preds = await cocoModel.current.detect(cvs);

        // phone / suspicious objects
        for (const p of preds) {
          if (SUSPICIOUS.has(p.class) && p.score > 0.5) {
            const label = p.class === "cell phone" ? "phone_detected" : "suspicious_object";
            const desc = p.class === "cell phone"
              ? "Phone detected in camera view"
              : `Suspicious object detected: ${p.class}`;
            frameAlerts.push(desc);
            report(label, desc);
          }
        }

        // multiple persons
        const persons = preds.filter((p) => p.class === "person" && p.score > 0.45);
        if (persons.length > 1) {
          frameAlerts.push("Multiple persons detected");
          report("multiple_persons", `${persons.length} persons detected in frame — possible assistance`);
        }
      } catch {}

      // ─ BlazeFace: gaze / presence ────────────────────────
      try {
        const faces = await faceModel.current.estimateFaces(cvs, false);

        if (faces.length === 0) {
          frameAlerts.push("No face detected — candidate may be away");
          report("person_away", "No face detected in camera — candidate may have left");
        } else {
          // check head orientation using landmarks
          const face = faces[0];
          const landmarks = face.landmarks; // [rightEye, leftEye, nose, mouth, rightEar, leftEar]
          if (landmarks && landmarks.length >= 3) {
            const rightEye = landmarks[0];
            const leftEye = landmarks[1];
            const nose = landmarks[2];
            const eyeMidX = (rightEye[0] + leftEye[0]) / 2;
            const faceW = Math.abs(rightEye[0] - leftEye[0]) || 1;
            const noseOffset = Math.abs(nose[0] - eyeMidX) / faceW;

            if (noseOffset > 0.7) {
              frameAlerts.push("Candidate appears to be looking away");
              report("looking_away", "Candidate is looking significantly away from screen");
            }
          }
        }
      } catch {}

      setAlerts(frameAlerts);
    };

    loopId.current = setInterval(analyse, SCAN_INTERVAL);
    return () => clearInterval(loopId.current);
  }, [aiReady, enabled, report]);

  // ── cleanup ────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (loopId.current) clearInterval(loopId.current);
      if (mediaStream.current) mediaStream.current.getTracks().forEach((t) => t.stop());
      videoEl.current = null;
    };
  }, []);

  return { aiReady, alerts, cameraCount };
}
