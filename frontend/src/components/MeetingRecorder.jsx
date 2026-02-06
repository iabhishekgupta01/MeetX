import React, { useRef } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";

const MeetingRecorder = ({ transcript, setTranscript, isRecording, setIsRecording }) => {
  const recognitionRef = useRef(null);

  const startAI = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Speech API not supported in this browser.");

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "hi-IN"; // Handles Hindi/English mix

    recognition.onresult = (event) => {
      let liveText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        liveText += event.results[i][0].transcript;
      }
      setTranscript((prev) => prev + " " + liveText);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  const stopAI = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);

      try {
        const res = await axios.post("http://localhost:5000/api/v1/meeting/summarize", {
          transcript: transcript,
        });
        
        const doc = new jsPDF();
        doc.text(doc.splitTextToSize(res.data.formattedText, 180), 10, 10);
        doc.save("Meeting_Summary.pdf");
      } catch (err) {
        console.error("AI Error:", err);
      }
    }
  };

  return (
    <button 
      onClick={isRecording ? stopAI : startAI}
      style={{
        backgroundColor: isRecording ? "#ff4742" : "#28a745",
        color: "white", padding: "10px 20px", border: "none", borderRadius: "5px", cursor: "pointer"
      }}
    >
      {isRecording ? "Stop & Summarize" : "AI Secretary"}
    </button>
  );
};

export default MeetingRecorder;