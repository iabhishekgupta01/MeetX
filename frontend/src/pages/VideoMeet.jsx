import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import io from "socket.io-client";
import styles from "../styles/VideoMeet.module.css";
import MeetingRecorder from "../components/MeetingRecorder";

const serverUrl = "http://localhost:5000";

const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

// --- Simple SVG Icons for clean UI ---
const Icons = {
  Mic: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  MicOff: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  Video: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
  VideoOff: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  ScreenShare: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  EndCall: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/><line x1="23" y1="1" x2="1" y2="23"/></svg>
};

function VideoMeetComponent({ meetingData }) {
  const meetingIdRef = useRef(meetingData?.meetingId || Date.now().toString());
  const socketRef = useRef(null);
  const socketIdRef = useRef(null);
  const connectionsRef = useRef({});

  // Refs for media
  const localVideoRef = useRef(null);
  const streamRef = useRef(null); // Keep track of the active stream (camera or screen)

  const [videos, setVideos] = useState([]); // Remote streams
  const [askForUsername, setAskForUsername] = useState(true);
  const [username, setUsername] = useState("");
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [usernamesMap, setUsernamesMap] = useState({});
  
  // AI Transcription
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  // 1. Get initial Camera permissions
  const getPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      
      // Initialize track states
      setVideoEnabled(stream.getVideoTracks()[0].enabled);
      setAudioEnabled(stream.getAudioTracks()[0].enabled);
      return stream;
    } catch (err) {
      console.error("Permission error:", err);
    }
  };

  // 2. Toggle Audio/Video safely
  const toggleAudio = () => {
    if (!streamRef.current) return;
    const audioTrack = streamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setAudioEnabled(audioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    if (!streamRef.current) return;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    // If screen sharing, don't allow toggling video off, or handle differently
    if (isScreenSharing) return; 

    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setVideoEnabled(videoTrack.enabled);
    }
  };

  // 3. Screen Sharing Logic (Stable replaceTrack method)
  const handleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ cursor: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        // Replace track for all peers
        Object.values(connectionsRef.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track.kind === "video");
          if (sender) sender.replaceTrack(screenTrack);
        });

        // Update local view
        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
        
        // Listen for "Stop Sharing" from browser UI
        screenTrack.onended = () => stopScreenSharing();

        setIsScreenSharing(true);
      } catch (err) {
        console.error("Failed to share screen", err);
      }
    } else {
      stopScreenSharing();
    }
  };

  const stopScreenSharing = async () => {
    // Get camera back
    const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    const videoTrack = cameraStream.getVideoTracks()[0];

    // Replace track back to camera for all peers
    Object.values(connectionsRef.current).forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track.kind === "video");
      if (sender) sender.replaceTrack(videoTrack);
    });

    // Update local view
    if (localVideoRef.current) localVideoRef.current.srcObject = cameraStream;
    streamRef.current = cameraStream;
    setIsScreenSharing(false);
    setVideoEnabled(true);
  };

  // 4. Socket & WebRTC Logic (Condensed for stability)
  const connectToSocketServer = () => {
    socketRef.current = io(serverUrl);

    socketRef.current.on("user-joined", (newUserId, clients) => {
      clients.forEach((clientId) => {
        if (clientId === socketIdRef.current || connectionsRef.current[clientId]) return;
        initiateConnection(clientId, newUserId === socketIdRef.current);
      });
    });

    socketRef.current.on("signal", (fromId, message) => {
      const signal = JSON.parse(message);
      const pc = connectionsRef.current[fromId];
      if (!pc) return;

      if (signal.sdp) {
        pc.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
          if (signal.sdp.type === "offer") {
            pc.createAnswer().then((answer) => {
              pc.setLocalDescription(answer);
              socketRef.current.emit("signal", fromId, JSON.stringify({ sdp: answer }));
            });
          }
        });
      }
      if (signal.ice) pc.addIceCandidate(new RTCIceCandidate(signal.ice));
    });

    socketRef.current.on("user-left", (id) => {
      if(connectionsRef.current[id]) {
          connectionsRef.current[id].close();
          delete connectionsRef.current[id];
      }
      setVideos((prev) => prev.filter((v) => v.socketId !== id));
      setUsernamesMap((prev) => {
        const newMap = { ...prev };
        delete newMap[id];
        return newMap;
      });
    });

    socketRef.current.on("connect", () => {
      socketIdRef.current = socketRef.current.id;
      socketRef.current.emit("join-call", { meetingId: meetingIdRef.current, username });
      socketRef.current.emit("user-username", username);
    });

    socketRef.current.on("user-username-update", (userId, name) => {
      setUsernamesMap((prev) => ({ ...prev, [userId]: name }));
    });
  };

  const initiateConnection = (clientId, isInitiator) => {
    const pc = new RTCPeerConnection(peerConfigConnections);
    connectionsRef.current[clientId] = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) socketRef.current.emit("signal", clientId, JSON.stringify({ ice: event.candidate }));
    };

    pc.ontrack = (event) => {
      setVideos((prev) => {
        if (prev.find((v) => v.socketId === clientId)) return prev;
        return [...prev, { socketId: clientId, stream: event.streams[0] }];
      });
    };

    if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => pc.addTrack(track, streamRef.current));
    }

    if (isInitiator) {
      pc.createOffer().then((offer) => {
        pc.setLocalDescription(offer);
        socketRef.current.emit("signal", clientId, JSON.stringify({ sdp: offer }));
      });
    }
  };

  const connect = () => {
    if (!username.trim()) return;
    setAskForUsername(false);
    connectToSocketServer();
  };

  useEffect(() => {
    getPermissions();
    return () => {
      socketRef.current?.disconnect();
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const endCall = async () => {
    // Send only necessary data or save transcript before this step
    window.location.href = "/"; 
  };

  // --- RENDER ---
  return (
    <div className={styles.wrapper}>
      {askForUsername ? (
        <div className={styles.lobbyContainer}>
          <div className={styles.lobbyCard}>
            <h1>MeetX</h1>
            <p>Ready to join the discussion?</p>
            <div className={styles.lobbyPreview}>
                <video ref={localVideoRef} autoPlay muted playsInline />
            </div>
            <input
              placeholder="Enter your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <button onClick={connect}>Join Meeting</button>
          </div>
        </div>
      ) : (
        <div className={styles.meetingRoom}>
          {/* Main Grid for Remote Videos */}
          <div className={styles.videoGrid}>
            {videos.length === 0 && (
                <div className={styles.waitingState}>
                    <p>Waiting for others to join...</p>
                    <span>Share Meeting ID: {meetingIdRef.current}</span>
                </div>
            )}
            {videos.map((v) => (
              <div key={v.socketId} className={styles.videoTile}>
                <video ref={(ref) => ref && (ref.srcObject = v.stream)} autoPlay playsInline />
                <span className={styles.nameTag}>{usernamesMap[v.socketId] || "User"}</span>
              </div>
            ))}
          </div>

          {/* Floating Local Video (PiP Style) */}
          <div className={styles.localVideoFloating}>
            <video ref={localVideoRef} autoPlay muted playsInline />
            <span className={styles.localNameTag}>You {isScreenSharing && "(Sharing)"}</span>
          </div>

          {/* Recording Status */}
          {isRecording && (
              <div className={styles.recordingIndicator}>
                  <div className={styles.redDot}></div>
                  <span>AI Secretary Listening</span>
              </div>
          )}

          {/* Bottom Control Bar */}
          <div className={styles.controlBar}>
            <button 
                onClick={toggleAudio} 
                className={`${styles.iconBtn} ${!audioEnabled ? styles.off : ''}`}
                title="Toggle Mic"
            >
              {audioEnabled ? <Icons.Mic /> : <Icons.MicOff />}
            </button>

            <button 
                onClick={toggleVideo} 
                className={`${styles.iconBtn} ${!videoEnabled ? styles.off : ''}`}
                title="Toggle Video"
            >
              {videoEnabled ? <Icons.Video /> : <Icons.VideoOff />}
            </button>

            <button 
                onClick={handleScreenShare} 
                className={`${styles.iconBtn} ${isScreenSharing ? styles.active : ''}`}
                title="Share Screen"
            >
              <Icons.ScreenShare />
            </button>

            {/* Recorder Component Button Container */}
            <div className={styles.recorderWrapper}>
                <MeetingRecorder 
                    transcript={transcript} 
                    setTranscript={setTranscript}
                    isRecording={isRecording}
                    setIsRecording={setIsRecording}
                />
            </div>

            <button onClick={endCall} className={`${styles.iconBtn} ${styles.endCallBtn}`}>
              <Icons.EndCall />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoMeetComponent;