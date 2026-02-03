import React, { useRef, useState } from "react";
import styles from "../styles/VideoMeet.module.css";

function MeetingRecorder({ localStream, peerStreams = [] }) {
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const audioContextRef = useRef(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  /* ---------- MIX AUDIO (UNCHANGED) ---------- */
  const createMixedAudioStream = async () => {
    const audioContext = new AudioContext();
    await audioContext.resume();

    const destination = audioContext.createMediaStreamDestination();
    audioContextRef.current = audioContext;

    // 🎤 Local mic
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        const source = audioContext.createMediaStreamSource(
          new MediaStream([track])
        );
        source.connect(destination);
      });
    }

    // 🔊 Peer audio
    peerStreams.forEach((stream) => {
      stream.getAudioTracks().forEach((track) => {
        const source = audioContext.createMediaStreamSource(
          new MediaStream([track])
        );
        source.connect(destination);
      });
    });

    return destination.stream;
  };

  /* ---------- START RECORDING ---------- */
  const startRecording = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      const mixedAudioStream = await createMixedAudioStream();

      const finalStream = new MediaStream([
        screenStream.getVideoTracks()[0],
        ...mixedAudioStream.getAudioTracks(),
      ]);

      recordedChunksRef.current = [];

      const recorder = new MediaRecorder(finalStream, {
        mimeType: "video/webm; codecs=vp8,opus",
      });

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        audioContextRef.current?.close();
        await uploadRecording(); // 🔴 CHANGED
      };

      recorder.start();
      setIsRecording(true);

      // Auto stop if screen sharing stops
      screenStream.getVideoTracks()[0].onended = () => {
        stopRecording();
      };
    } catch (err) {
      console.error("Recording failed:", err);
    }
  };

  /* ---------- STOP RECORDING ---------- */
  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setIsProcessing(true);
  };

  /* ---------- UPLOAD TO BACKEND ---------- */
  const uploadRecording = async () => {
    try {
      if (!recordedChunksRef.current.length) return;

      const blob = new Blob(recordedChunksRef.current, {
        type: "video/webm",
      });

      const formData = new FormData();
      formData.append("file", blob, "meeting.webm");

      const res = await fetch(
        "http://localhost:8080/api/v1/meeting/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

console.log("Backend response:", data);


      // 🔴 Download generated PDF
     window.location.href = `http://localhost:8080/api/v1/meeting/download/${data.file}`;

    } catch (err) {
      console.error("Upload failed:", err);
      alert("Meeting processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <button
      className={`${styles.recordBtn} ${
        isRecording ? styles.recording : ""
      }`}
      disabled={isProcessing}
      onClick={isRecording ? stopRecording : startRecording}
    >
      {isProcessing
        ? "Generating Notes..."
        : isRecording
        ? "Stop Recording"
        : "Record Meeting"}
    </button>
  );
}

export default MeetingRecorder;
