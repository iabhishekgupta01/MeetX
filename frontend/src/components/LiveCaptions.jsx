import React, { useEffect, useState, useRef } from "react";
import styles from "../styles/VideoMeet.module.css";

const LiveCaptions = ({ socketRef, meetingId, username, isOn }) => {
  const [captions, setCaptions] = useState([]); 
  const [interimText, setInterimText] = useState(""); 
  
  // REFS
  const recognitionRef = useRef(null);
  const fullTranscriptRef = useRef([]);
  
  // THE KILL SWITCH: Prevents the "Restart Loop"
  const isIntentionallyStopped = useRef(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    // 1. CREATE INSTANCE
    console.log("🛠️ Creating Speech Instance...");
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    // 2. SETUP HANDLERS
    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          const finalText = event.results[i][0].transcript;
          console.log(`✅ Text: "${finalText}"`); 

          const note = { 
            user: username, 
            text: finalText, 
            timestamp: new Date().toISOString() 
          };
          
          setCaptions(prev => [...prev.slice(-4), note]);
          fullTranscriptRef.current.push(note);

          if (socketRef.current) {
            socketRef.current.emit("send-transcript", note);
          }
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setInterimText(interim);
    };

    recognition.onerror = (event) => {
        // If aborted, it means we stopped it. Don't worry.
        if (event.error === 'aborted') {
            isIntentionallyStopped.current = true;
        } else {
            console.warn("⚠️ Speech Error:", event.error);
        }
    };

    recognition.onend = () => {
        // CRITICAL CHECK: Did we stop it? Or did it crash?
        if (isIntentionallyStopped.current) {
            console.log("🛑 Engine Stopped (User Request). No Restart.");
        } else {
            console.log("🔄 Silence/Crash detected. Restarting...");
            try { recognition.start(); } catch (e) { }
        }
    };

    recognitionRef.current = recognition;

    // 3. START/STOP LOGIC (Based on 'isOn' prop)
    if (isOn) {
        isIntentionallyStopped.current = false; // Enable Restarting
        try {
            recognition.start();
            console.log("🟢 Microphone STARTED");
        } catch(e) { /* Ignore if already started */ }
    }

    // 4. CLEANUP (Runs on unmount OR when 'isOn' changes)
    return () => {
        console.log("⚠️ Cleaning up instance...");
        isIntentionallyStopped.current = true; // FLIP THE SWITCH: Do not restart!
        recognition.stop();
    };

  }, [isOn]); // <--- Re-create the instance whenever 'isOn' toggles. 
              // This is safer than keeping one instance alive forever.

  // --- SAVE LOGIC ---
  const saveTranscript = () => {
      const data = fullTranscriptRef.current;
      if (data.length === 0) return;

      console.log("📤 Saving transcript...", data.length, "lines");
      fetch("http://localhost:8081/api/v1/meeting/save-transcript", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ meetingId, transcript: data }),
          keepalive: true
      });
  };

  useEffect(() => {
      return () => saveTranscript();
  }, []);

  if (!isOn && captions.length === 0) return null;

  return (
    <div className={styles.captionsOverlay}>
      <div className={styles.captionsHeader}>
          {isOn && <span className={styles.recordDot}></span>}
          <span>Live Captions</span>
      </div>
      
      <div className={styles.captionsScroll}>
        {captions.map((msg, i) => (
          <div key={i} className={styles.captionLine}>
            <span style={{fontWeight:'bold', color: '#ffdd59'}}>{msg.user}:</span> {msg.text}
          </div>
        ))}
        {interimText && <div style={{opacity: 0.6}}>{username}: {interimText}...</div>}
      </div>
    </div>
  );
};

export default LiveCaptions;