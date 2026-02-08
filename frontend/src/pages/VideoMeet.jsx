import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import io from "socket.io-client";
import axios from "axios";
import styles from "../styles/VideoMeet.module.css";
import MeetingRecorder from "../components/MeetingRecorder";

// ⚠️ CHECK THIS: Must match your Backend Port
const serverUrl = "http://localhost:5000";

const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

// --- SVG Icons ---
const Icons = {
  Mic: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  MicOff: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  Video: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
  VideoOff: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  ScreenShare: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  EndCall: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/><line x1="23" y1="1" x2="1" y2="23"/></svg>,
  Lock: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>,
  Copy: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>,
  Check: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
};

const VideoPlayer = ({ stream, username, isLocal = false, isActive = false }) => {
  const videoRef = useRef(null);
  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  return (
    <div className={`${styles.videoTile} ${isLocal ? styles.localVideoFloating : ""} ${isActive ? styles.activeSpeaker : ""}`}>
      <video ref={videoRef} autoPlay playsInline muted={isLocal} />
      <span className={isLocal ? styles.localNameTag : styles.nameTag}>{username || "User"} {isLocal && "(You)"}</span>
    </div>
  );
};

function VideoMeetComponent() {
  const [searchParams] = useSearchParams();
  const { meetingId: routeMeetingId } = useParams();
  
  // --- STATE ---
  const [meetingCode, setMeetingCode] = useState("");
  const [meetingId, setMeetingId] = useState("");
  const [username, setUsername] = useState("");
  const [isInLobby, setIsInLobby] = useState(true);
  
  // URL & Validation
  const urlMeetingId = routeMeetingId || searchParams.get("id");
  const [isFetchingCode, setIsFetchingCode] = useState(!!urlMeetingId);
  const [linkError, setLinkError] = useState(null);
  const [isLocked, setIsLocked] = useState(false); // Controls if input is read-only
  const [isJoining, setIsJoining] = useState(false);

  // Media
  const [localStream, setLocalStream] = useState(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [activeSpeakerId, setActiveSpeakerId] = useState("local");
  const [codeCopied, setCodeCopied] = useState(false);

  // WebRTC
  const [peers, setPeers] = useState([]);
  const socketRef = useRef(null);
  const connectionsRef = useRef({});
  const localStreamRef = useRef(null);
  const audioMonitorRef = useRef({});

  const orderedPeers = (() => {
    const list = [...peers];
    if (activeSpeakerId && activeSpeakerId !== "local") {
      const idx = list.findIndex((p) => p.socketId === activeSpeakerId);
      if (idx > 0) {
        const [active] = list.splice(idx, 1);
        list.unshift(active);
      }
    }
    return list;
  })();

  useEffect(() => {
    // 1. Init Media
    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        setLocalStream(stream);
        setVideoEnabled(stream.getVideoTracks()[0].enabled);
        setAudioEnabled(stream.getAudioTracks()[0].enabled);
      } catch (err) { console.error("Media Error:", err); }
    };
    initMedia();

    // 2. Validate Meeting Link
    const validateLink = async () => {
      if (!urlMeetingId) return;
      try {
        // Calling: http://localhost:5000/api/v1/meeting/:id
        const response = await axios.get(`${serverUrl}/api/v1/meeting/${urlMeetingId}`);
        
        // Success case
        if (response.data && response.data.meeting) {
            setMeetingId(response.data.meeting.meetingId);
            setMeetingCode(response.data.meeting.meetingCode || "");
            setIsLocked(true); // Lock it only on success
            setLinkError(null);
        } 
      } catch (error) {
        console.error("API Error:", error);
        // If API fails, we ALLOW manual entry instead of blocking user
        setIsLocked(false); 
        if (error.response?.status === 410) setLinkError("Meeting Expired");
        else if (error.response?.status === 404) setLinkError("Invalid Meeting Link");
        else setLinkError(null); // Clear error to allow manual typing
      } finally {
        setIsFetchingCode(false);
      }
    };
    validateLink();

    return () => {
        if(localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
        if(socketRef.current) socketRef.current.disconnect();
        Object.values(audioMonitorRef.current).forEach((monitor) => {
          if (monitor?.rafId) cancelAnimationFrame(monitor.rafId);
          if (monitor?.audioContext && monitor.audioContext.state !== "closed") {
            monitor.audioContext.close();
          }
        });
    }
  }, [urlMeetingId]);

  const startAudioMonitor = (stream, id) => {
    if (!stream || audioMonitorRef.current[id]) return;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i += 1) sum += data[i];
      const avg = sum / data.length;
      if (avg > 25) {
        setActiveSpeakerId(id);
      }
      audioMonitorRef.current[id].rafId = requestAnimationFrame(tick);
    };

    audioMonitorRef.current[id] = { audioContext, rafId: requestAnimationFrame(tick) };
  };

  // --- JOIN LOGIC ---
  const resolveMeetingId = async () => {
    if (meetingId) return meetingId;

    const code = meetingCode.trim().toUpperCase();
    if (!code) {
      throw new Error("Meeting code is required");
    }

    const response = await axios.get(`${serverUrl}/api/v1/meeting/code/${code}`);
    if (response.data && response.data.meeting) {
      setMeetingId(response.data.meeting.meetingId);
      setMeetingCode(response.data.meeting.meetingCode || code);
      setIsLocked(true);
      setLinkError(null);
      return response.data.meeting.meetingId;
    }

    throw new Error("Meeting not found");
  };

  const joinMeeting = async () => {
    if (!username.trim()) {
      alert("Please enter your name");
      return;
    }

    setIsJoining(true);
    let resolvedMeetingId;

    try {
      resolvedMeetingId = await resolveMeetingId();
    } catch (error) {
      console.error("Join Error:", error);
      if (error.response?.status === 410) setLinkError("Meeting Expired");
      else if (error.response?.status === 404) setLinkError("Invalid Meeting Code");
      else if (error.message) setLinkError(error.message);
      setIsLocked(false);
      setIsJoining(false);
      return;
    }

    setIsInLobby(false);

    // CONNECT TO SOCKET
    socketRef.current = io(serverUrl);

    socketRef.current.on("connect", () => {
      const userId = localStorage.getItem("userId") || "guest";
      console.log("Socket Connected!", socketRef.current.id);
      // IMPORTANT: This event name must match your Backend
      socketRef.current.emit("join-call", { meetingId: resolvedMeetingId, username, userId });
    });

    socketRef.current.on("user-joined", (socketId, clients) => {
      console.log("User joined room:", clients);
      const normalizedClients = (clients || []).map((client) => {
        if (typeof client === "string") {
          return { socketId: client, username: "User" };
        }
        return client;
      });

      const isSelfJoin = socketId === socketRef.current.id;
      if (!isSelfJoin) return;

      normalizedClients.forEach((client) => {
        if (client.socketId !== socketRef.current.id && !connectionsRef.current[client.socketId]) {
          initiateConnection(client.socketId, client.username, true);
        }
      });
    });

    socketRef.current.on("signal", (fromId, message, senderName) => {
        if (!connectionsRef.current[fromId]) {
            initiateConnection(fromId, senderName, false);
        }
        
        const signal = JSON.parse(message);
        const pc = connectionsRef.current[fromId];

        if (signal.sdp) {
        const remoteDesc = new RTCSessionDescription(signal.sdp);
        const isOffer = signal.sdp.type === "offer";
        const isAnswer = signal.sdp.type === "answer";

        if (isAnswer && pc.signalingState !== "have-local-offer") {
          return;
        }

        pc.setRemoteDescription(remoteDesc).then(() => {
          if (isOffer) {
            pc.createAnswer().then((answer) => {
              pc.setLocalDescription(answer);
              socketRef.current.emit("signal", fromId, JSON.stringify({ sdp: answer }));
            });
          }
        });
        }
        
        if (signal.ice) {
            pc.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(() => {});
        }
    });

    socketRef.current.on("user-left", (id) => {
        if (connectionsRef.current[id]) connectionsRef.current[id].close();
        delete connectionsRef.current[id];
        setPeers((prev) => prev.filter((p) => p.socketId !== id));
        if (audioMonitorRef.current[id]) {
          const monitor = audioMonitorRef.current[id];
          if (monitor.rafId) cancelAnimationFrame(monitor.rafId);
          if (monitor.audioContext && monitor.audioContext.state !== "closed") {
            monitor.audioContext.close();
          }
          delete audioMonitorRef.current[id];
        }
    });
    setIsJoining(false);
  };

  const initiateConnection = (partnerId, partnerName, isInitiator) => {
    const pc = new RTCPeerConnection(peerConfigConnections);
    connectionsRef.current[partnerId] = pc;

    if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current));
    }

    pc.onicecandidate = (e) => {
        if (e.candidate) {
            socketRef.current.emit("signal", partnerId, JSON.stringify({ ice: e.candidate }));
        }
    };

    pc.ontrack = (e) => {
      startAudioMonitor(e.streams[0], partnerId);
        setPeers((prev) => {
            if (prev.some(p => p.socketId === partnerId)) return prev;
            return [...prev, { socketId: partnerId, stream: e.streams[0], username: partnerName }];
        });
    };

    if (isInitiator) {
        pc.createOffer().then((offer) => {
            pc.setLocalDescription(offer);
            socketRef.current.emit("signal", partnerId, JSON.stringify({ sdp: offer }));
        });
    }
  };

  // --- TOGGLES & UTILS ---
  const toggleAudio = () => {
    if (localStreamRef.current) {
        const t = localStreamRef.current.getAudioTracks()[0];
        if (t) { t.enabled = !t.enabled; setAudioEnabled(t.enabled); }
    }
  };
  const toggleVideo = () => {
    if (localStreamRef.current) {
        const t = localStreamRef.current.getVideoTracks()[0];
        if (t) { t.enabled = !t.enabled; setVideoEnabled(t.enabled); }
    }
  };
  const handleScreenShare = async () => {
      if(!isScreenSharing) {
          try {
              const stream = await navigator.mediaDevices.getDisplayMedia({cursor:true});
          localStreamRef.current = stream;
              const track = stream.getVideoTracks()[0];
              Object.values(connectionsRef.current).forEach(pc => {
                  const sender = pc.getSenders().find(s => s.track.kind === 'video');
                  if(sender) sender.replaceTrack(track);
              });
              track.onended = () => stopScreenSharing();
              setLocalStream(stream);
              setIsScreenSharing(true);
          } catch(e){}
      } else { stopScreenSharing(); }
  };
  const stopScreenSharing = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({video:true, audio:true});
      localStreamRef.current = stream;
      startAudioMonitor(stream, "local");
      const track = stream.getVideoTracks()[0];
      Object.values(connectionsRef.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track.kind === 'video');
          if(sender) sender.replaceTrack(track);
      });
      setLocalStream(stream);
      setIsScreenSharing(false);
  };
  const endCall = () => { socketRef.current?.disconnect(); window.location.href = "/"; };
  const copyMeetingCode = async () => {
    const code = meetingCode?.trim();
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCodeCopied(true);
      window.setTimeout(() => setCodeCopied(false), 1800);
    } catch (error) {
      console.error("Failed to copy meeting code:", error);
      setCodeCopied(false);
    }
  };

  // --- RENDER ---
  return (
    <div className={styles.wrapper}>
      {isInLobby ? (
        <div className={styles.lobbyContainer}>
          <div className={styles.lobbyCard}>
            <h1 className={styles.logoText}>Meet<span className={styles.logoX}>X</span></h1>

            <div className={styles.previewWrapper}>
              <div className={styles.lobbyPreview}>
                {localStream ? <video ref={r => { if(r) r.srcObject = localStream }} autoPlay muted playsInline /> : <div className={styles.loader}>Camera Loading...</div>}
                <div className={styles.previewOverlay}>
                    <button onClick={toggleAudio} className={`${styles.miniToggle} ${!audioEnabled ? styles.off : ''}`}>{audioEnabled ? <Icons.Mic /> : <Icons.MicOff />}</button>
                    <button onClick={toggleVideo} className={`${styles.miniToggle} ${!videoEnabled ? styles.off : ''}`}>{videoEnabled ? <Icons.Video /> : <Icons.VideoOff />}</button>
                </div>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <div className={styles.inputWrapper}>
                  {isFetchingCode ? (
                      <div className={styles.verifyingMsg}>Verifying Link...</div>
                  ) : linkError ? (
                      // Show error but allow typing anyway (Fallback)
                      <div className={styles.errorMsg}>{linkError}</div>
                  ) : null}

                  <div className={styles.lockedInputContainer}>
                      <input
                        placeholder="Meeting Code"
                        value={meetingCode}
                        onChange={(e) => setMeetingCode(e.target.value)}
                        readOnly={isLocked}
                        className={isLocked ? styles.inputLocked : ''}
                      />
                      {isLocked && <span className={styles.lockIcon}><Icons.Lock /></span>}
                  </div>
              </div>
              
              <input
                placeholder="Enter Your Display Name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <button 
                className={styles.joinBtn} 
                onClick={joinMeeting}
                disabled={isFetchingCode || isJoining}
            >
              {isFetchingCode || isJoining ? "Please Wait..." : "Join Meeting"}
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.meetingRoom}>
          <div className={styles.gridShell}>
            {peers.length === 0 && (
              <div className={styles.waitingOverlay}>
                <p>Waiting for others...</p>
                <span
                  className={`${styles.codePill} ${codeCopied ? styles.codePillCopied : ""}`}
                  onClick={copyMeetingCode}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      copyMeetingCode();
                    }
                  }}
                >
                  <span className={styles.codePillIcon} aria-hidden="true">
                    {codeCopied ? <Icons.Check /> : <Icons.Copy />}
                  </span>
                  Code: {meetingCode}
                </span>
              </div>
            )}
            <div
              className={`${styles.videoGrid} ${peers.length + 1 >= 9 ? styles.compactGrid : ""}`}
            >
              <VideoPlayer
                stream={localStream}
                username={username}
                isLocal={true}
                isActive={activeSpeakerId === "local"}
              />
              {orderedPeers.map((p) => (
                <VideoPlayer
                  key={p.socketId}
                  stream={p.stream}
                  username={p.username}
                  isActive={activeSpeakerId === p.socketId}
                />
              ))}
            </div>
          </div>
          
          <div className={styles.controlBar}>
             <button onClick={toggleAudio} className={`${styles.iconBtn} ${!audioEnabled ? styles.off : ''}`}>{audioEnabled ? <Icons.Mic /> : <Icons.MicOff />}</button>
             <button onClick={toggleVideo} className={`${styles.iconBtn} ${!videoEnabled ? styles.off : ''}`}>{videoEnabled ? <Icons.Video /> : <Icons.VideoOff />}</button>
             <button onClick={handleScreenShare} className={`${styles.iconBtn} ${isScreenSharing ? styles.active : ''}`}><Icons.ScreenShare /></button>
             <div className={styles.sep}></div>
             <MeetingRecorder transcript={transcript} setTranscript={setTranscript} isRecording={isRecording} setIsRecording={setIsRecording}/>
             <button onClick={endCall} className={`${styles.iconBtn} ${styles.endCallBtn}`}><Icons.EndCall /></button>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoMeetComponent;