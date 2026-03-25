"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Mic, Square, Loader2 } from "lucide-react";
import { transcribeVoiceNote } from "@/services/ai";

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
}

export function VoiceRecorder({ onTranscription }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4",
      });

      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });

        setTranscribing(true);
        try {
          const text = await transcribeVoiceNote(blob);
          onTranscription(text);
        } catch (err) {
          console.error("Transcription failed:", err);
        } finally {
          setTranscribing(false);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  }

  if (transcribing) {
    return (
      <Button variant="secondary" size="lg" className="w-full" disabled>
        <Loader2 className="h-5 w-5 animate-spin" />
        Transcribing...
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={recording ? "destructive" : "outline"}
      size="lg"
      className="w-full"
      onClick={recording ? stopRecording : startRecording}
    >
      {recording ? (
        <>
          <Square className="h-5 w-5" />
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
          Stop Recording
        </>
      ) : (
        <>
          <Mic className="h-5 w-5" />
          Record Inspection Note
        </>
      )}
    </Button>
  );
}
