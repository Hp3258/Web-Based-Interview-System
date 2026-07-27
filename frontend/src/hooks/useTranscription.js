import { useEffect, useRef, useState, useCallback } from "react";
import { sessionApi } from "../api/sessions";

// Uses native browser WebSocket to connect to Deepgram (no Node.js SDK needed)
export default function useTranscription(sessionId, isCandidate, isActive, terminated) {
  const [liveTranscript, setLiveTranscript] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const wsRef = useRef(null);
  const keepAliveIntervalRef = useRef(null);
  const lastTranscriptTime = useRef(Date.now());

  const startTranscription = useCallback(async () => {
    const apiKey = import.meta.env.VITE_DEEPGRAM_API_KEY;
    if (!apiKey) {
      console.warn("Deepgram API Key is missing. Transcription disabled.");
      return;
    }

    try {
      // 1. Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 2. Setup MediaRecorder to capture audio chunks
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      // 3. Connect to Deepgram via native WebSocket
      const wsUrl = `wss://api.deepgram.com/v1/listen?model=nova-2&language=en-US&smart_format=true`;
      const ws = new WebSocket(wsUrl, ["token", apiKey]);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsTranscribing(true);
        console.log("Deepgram WebSocket opened");

        // Send audio data as it becomes available
        mediaRecorder.addEventListener("dataavailable", (event) => {
          if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            ws.send(event.data);
          }
        });

        // Start capturing every 250ms
        mediaRecorder.start(250);

        // Keep-alive ping every 10 seconds
        keepAliveIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "KeepAlive" }));
          }
        }, 10000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "Results") {
            const transcript = data.channel?.alternatives?.[0]?.transcript;
            if (transcript) {
              const isFinal = data.is_final;
              
              if (isFinal) {
                // Save completed sentence to the backend
                sessionApi.addTranscript({
                  sessionId,
                  text: transcript,
                  speaker: isCandidate ? "candidate" : "host"
                }).catch(err => console.error("Failed to save transcript", err));
                
                // Clear live text as it's been committed
                setLiveTranscript("");
                lastTranscriptTime.current = Date.now();
              } else {
                // Update live UI
                setLiveTranscript(transcript);
              }
            }
          }
        } catch (e) {
          // Ignore non-JSON messages
        }
      };

      ws.onerror = (err) => {
        console.error("Deepgram WebSocket Error:", err);
      };

      ws.onclose = () => {
        setIsTranscribing(false);
        console.log("Deepgram WebSocket closed");
      };

    } catch (err) {
      console.error("Failed to start transcription:", err);
    }
  }, [sessionId, isCandidate]);

  const stopTranscription = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "CloseStream" }));
      wsRef.current.close();
    }
    
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current);
    }
    
    setIsTranscribing(false);
  }, []);

  useEffect(() => {
    if (isActive && !terminated) {
      startTranscription();
    } else {
      stopTranscription();
    }

    return () => {
      stopTranscription();
    };
  }, [isActive, terminated, startTranscription, stopTranscription]);

  // Auto-clear stale live transcripts after 3 seconds of silence
  useEffect(() => {
    const interval = setInterval(() => {
      if (liveTranscript && Date.now() - lastTranscriptTime.current > 3000) {
        setLiveTranscript("");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [liveTranscript]);

  return { liveTranscript, isTranscribing };
}
