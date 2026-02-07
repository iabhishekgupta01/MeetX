import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import styles from "../styles/VideoMeet.module.css";
// import MeetingRecorder from "../components/MeetingRecorder"; // Uncomment if you have this component

const serverUrl = "http://localhost:5000";

// --- Minimalist Modern Icons ---
const Icons = {
  Mic: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  MicOff: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  Video: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
  VideoOff: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  ScreenShare: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  EndCall: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/><line x1="23" y1="1" x2="1" y2="23"/></svg>,
  Copy: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
};

const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

function VideoMeetComponent({ meetingData }) {
  const meetingIdRef = useRef(meetingData?.meetingId || null); 
  const socketRef = useRef(null);
  const socketIdRef = useRef(null);
  const connectionsRef = useRef({});
  const localStreamRef = useRef(null);

  const [meetingCodeInput, setMeetingCodeInput] = useState(meetingData?.meetingCode || "");
  const [username, setUsername] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [videos, setVideos] = useState([]);
  const [usernamesMap, setUsernamesMap] = useState({});
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // AI & Recording State
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      if(localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
      socketRef.current?.disconnect();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      setMicOn(stream.getAudioTracks()[0].enabled);
      setVideoOn(stream.getVideoTracks()[0].enabled);
      setVideos((prev) => [...prev]); 
    } catch (err) {
      console.error("Camera Error:", err);
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setMicOn(track.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setVideoOn(track.enabled);
      }
    }
  };

  const joinMeeting = () => {
    if (!username.trim() || !meetingCodeInput.trim()) {
        alert("Please enter Name and Code");
        return;
    }
    meetingIdRef.current = meetingCodeInput;
    setIsJoined(true);
    
    socketRef.current = io(serverUrl);

    socketRef.current.on("connect", () => {
      socketIdRef.current = socketRef.current.id;
      socketRef.current.emit("join-call", {
        meetingId: meetingIdRef.current,
        userId: socketIdRef.current,
        username: username
      });
      socketRef.current.emit("user-username", username);
    });

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
        if(connectionsRef.current[id]) connectionsRef.current[id].close();
        delete connectionsRef.current[id];
        setVideos((prev) => prev.filter((v) => v.socketId !== id));
    });

    socketRef.current.on("user-username-update", (userId, name) => setUsernamesMap((prev) => ({ ...prev, [userId]: name })));
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
    if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current));
    }
    if (isInitiator) {
        pc.createOffer().then((offer) => {
            pc.setLocalDescription(offer);
            socketRef.current.emit("signal", clientId, JSON.stringify({ sdp: offer }));
        });
    }
  };

  const handleScreenShare = async () => {
    if (!isScreenSharing) {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ cursor: true });
            const screenTrack = screenStream.getVideoTracks()[0];
            for (const pc of Object.values(connectionsRef.current)) {
                const sender = pc.getSenders().find(s => s.track.kind === 'video');
                if (sender) sender.replaceTrack(screenTrack);
            }
            if(localStreamRef.current) {
               const newStream = new MediaStream([...localStreamRef.current.getAudioTracks(), screenTrack]);
               localStreamRef.current = newStream;
               setVideos(prev => [...prev]);
            }
            screenTrack.onended = stopScreenSharing;
            setIsScreenSharing(true);
        } catch (e) { console.error(e); }
    } else {
        stopScreenSharing();
    }
  };

  const stopScreenSharing = async () => {
      try {
          const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          const videoTrack = camStream.getVideoTracks()[0];
          for (const pc of Object.values(connectionsRef.current)) {
              const sender = pc.getSenders().find(s => s.track.kind === 'video');
              if (sender) sender.replaceTrack(videoTrack);
          }
          localStreamRef.current = camStream;
          setIsScreenSharing(false);
          setVideoOn(true); 
          setVideos(prev => [...prev]);
      } catch (e) { console.error(e); }
  };

  const endCall = () => window.location.href = "/";
  
  const copyCode = () => {
    navigator.clipboard.writeText(meetingCodeInput);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className={styles.wrapper}>
      {/* BACKGROUND ELEMENTS */}
      <div className={styles.blob1}></div>
      <div className={styles.blob2}></div>
      <div className={styles.glassOverlay}></div>

      {!isJoined ? (
        <div className={styles.lobbyContainer}>
            <div className={styles.lobbyCard}>
                <div className={styles.brandTitle}>Meet<span className={styles.accentText}>X</span></div>
                <p className={styles.subtitle}>Start your conversation.</p>
                
                <div className={styles.previewContainer}>
                    <div className={styles.videoFrame}>
                        <video 
                            ref={(ref) => { if (ref && localStreamRef.current) ref.srcObject = localStreamRef.current }} 
                            autoPlay muted playsInline
                            className={!videoOn ? styles.hiddenVideo : ''}
                        />
                        {!videoOn && <div className={styles.noCameraPlaceholder}>Camera is Off</div>}
                    </div>
                    
                    <div className={styles.previewControls}>
                         <button onClick={toggleAudio} className={!micOn ? styles.btnOff : styles.btnOn}>
                             {micOn ? <Icons.Mic /> : <Icons.MicOff />}
                         </button>
                         <button onClick={toggleVideo} className={!videoOn ? styles.btnOff : styles.btnOn}>
                             {videoOn ? <Icons.Video /> : <Icons.VideoOff />}
                         </button>
                    </div>
                </div>

                <div className={styles.inputGroup}>
                    <label>Display Name</label>
                    <input 
                        placeholder="e.g. John Doe" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                    />
                </div>
                
                <div className={styles.inputGroup}>
                    <label>Meeting Code</label>
                    <input 
                        placeholder="e.g. 123-abc-456" 
                        value={meetingCodeInput} 
                        onChange={(e) => setMeetingCodeInput(e.target.value)} 
                    />
                </div>

                <button className={styles.primaryBtn} onClick={joinMeeting}>
                    Enter Room
                </button>
            </div>
        </div>
      ) : (
        <div className={styles.roomContainer}>
            {/* TOP BAR */}
            <div className={styles.topBar}>
                <div className={styles.meetingInfo}>
                    <span className={styles.codeLabel}>Meeting Code:</span>
                    <span className={styles.codeValue}>{meetingCodeInput}</span>
                    <button className={styles.copyBtn} onClick={copyCode} title="Copy Code">
                        {copySuccess ? "Copied!" : <Icons.Copy />}
                    </button>
                </div>
                <div className={styles.logoSmall}>Meet<span className={styles.accentText}>X</span></div>
            </div>

            {/* VIDEO GRID */}
            <div className={styles.videoGrid}>
                {videos.length === 0 && (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>👋</div>
                        <h3>You are the only one here.</h3>
                        <p>Share the code <strong>{meetingCodeInput}</strong> to invite others.</p>
                    </div>
                )}
                {videos.map((v) => (
                    <div key={v.socketId} className={styles.videoTile}>
                        <video ref={(ref) => { if(ref) ref.srcObject = v.stream }} autoPlay playsInline />
                        <div className={styles.userInfoTag}>{usernamesMap[v.socketId] || "Guest"}</div>
                    </div>
                ))}
            </div>

            {/* FLOATING SELF VIEW */}
            <div className={styles.selfPip}>
                 <video 
                    ref={(ref) => { if (ref && localStreamRef.current) ref.srcObject = localStreamRef.current }} 
                    autoPlay muted playsInline 
                    className={!videoOn ? styles.hiddenVideo : ''}
                />
                {!videoOn && <div className={styles.pipPlaceholder}>You</div>}
            </div>

            {/* BOTTOM DOCK */}
            <div className={styles.bottomDock}>
                <div className={styles.dockContent}>
                    <button onClick={toggleAudio} className={`${styles.dockBtn} ${!micOn ? styles.isOff : styles.isOn}`}>
                        {micOn ? <Icons.Mic /> : <Icons.MicOff />}
                    </button>
                    <button onClick={toggleVideo} className={`${styles.dockBtn} ${!videoOn ? styles.isOff : styles.isOn}`}>
                        {videoOn ? <Icons.Video /> : <Icons.VideoOff />}
                    </button>
                    <button onClick={handleScreenShare} className={`${styles.dockBtn} ${isScreenSharing ? styles.isSharing : ''}`}>
                        <Icons.ScreenShare />
                    </button>
                    
                    {/* Placeholder for Recorder if you import it */}
                    {/* <div className={styles.divider}></div> */}
                    {/* <MeetingRecorder ... /> */}

                    <button onClick={endCall} className={`${styles.dockBtn} ${styles.hangupBtn}`}>
                        <Icons.EndCall />
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

export default VideoMeetComponent;
