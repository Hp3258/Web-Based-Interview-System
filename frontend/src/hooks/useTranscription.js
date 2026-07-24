import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@deepgram/sdk";
import { sessionApi } from "../api/sessions";

// Only run transcription if we have an API key and session is active
export default function useTranscription(sessionId, isCandidate, isActive, terminated) {
  const [liveTranscript, setLiveTranscript] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const deepgramSocketRef = useRef(null);
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

      // 3. Connect to Deepgram WebSocket
      const deepgramClient = createClient(apiKey);
      const connection = deepgramClient.listen.live({
        model: "nova-2",
        language: "en-US",
        smart_format: true,
      });

      deepgramSocketRef.current = connection;

      connection.on("open", () => {
        setIsTranscribing(true);
        console.log("Deepgram connection opened");

        // Send audio data as it becomes available
        mediaRecorder.addEventListener("dataavailable", async (event) => {
          if (event.data.size > 0 && connection.getReadyState() === 1) {
            connection.send(event.data);
          }
        });

        // Start capturing every 250ms
        mediaRecorder.start(250);

        // Keep-alive ping
        keepAliveIntervalRef.current = setInterval(() => {
          connection.keepAlive();
        }, 10000);
      });

      connection.on("Results", (data) => {
        const transcript = data.channel.alternatives[0].transcript;
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
      });

      connection.on("error", (err) => {
        console.error("Deepgram Error:", err);
      });

      connection.on("close", () => {
        setIsTranscribing(false);
        console.log("Deepgram connection closed");
      });

    } catch (err) {
      console.error("Failed to start transcription:", err);
    }
  }, [sessionId, isCandidate]);

  const stopTranscription = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    
    if (deepgramSocketRef.current) {
      deepgramSocketRef.current.finish();
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
