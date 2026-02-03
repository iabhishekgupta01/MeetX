import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import styles from "../styles/VideoMeet.module.css";
import MeetingRecorder from "../components/MeetingRecorder";

const serverUrl = "http://localhost:8080";

const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

function VideoMeetComponent() {
  const meetingIdRef = useRef(Date.now().toString());

  const socketRef = useRef(null);
  const socketIdRef = useRef(null);
  const lobbyVideoRef = useRef(null);
  const callVideoRef = useRef(null);
  const connectionsRef = useRef({});

  // ✅ FIX: localStream STATE (instead of window.localStream)
  const [localStream, setLocalStream] = useState(null);

  const [videos, setVideos] = useState([]);
  const [askForUsername, setAskForUsername] = useState(true);
  const [username, setUsername] = useState("");

  const [video, setVideo] = useState(true);
  const [audio, setAudio] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  /* ---------------- PERMISSIONS ---------------- */
  const getPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setLocalStream(stream);

      if (lobbyVideoRef.current) {
        lobbyVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Permission error:", err);
    }
  };

  /* ---------------- TOGGLES (UNCHANGED UI) ---------------- */
  const toggleAudio = () => {
    const track = localStream?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setAudio(track.enabled);
  };

  const toggleVideo = () => {
    const track = localStream?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setVideo(track.enabled);
  };

  /* ---------------- SIGNAL HANDLER ---------------- */
  const gotMessageFromServer = (fromId, message) => {
    const signal = JSON.parse(message);
    const pc = connectionsRef.current[fromId];
    if (!pc) return;

    if (signal.sdp) {
      pc.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
        if (signal.sdp.type === "offer") {
          pc.createAnswer().then((answer) => {
            pc.setLocalDescription(answer);
            socketRef.current.emit(
              "signal",
              fromId,
              JSON.stringify({ sdp: answer })
            );
          });
        }
      });
    }

    if (signal.ice) {
      pc.addIceCandidate(new RTCIceCandidate(signal.ice));
    }
  };

  /* ---------------- SOCKET ---------------- */
  const connectToSocketServer = () => {
    socketRef.current = io(serverUrl);

    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("user-left", (id) => {
      connectionsRef.current[id]?.close();
      delete connectionsRef.current[id];
      setVideos((prev) => prev.filter((v) => v.socketId !== id));
    });

    socketRef.current.on("user-joined", (newUserId, clients) => {
      clients.forEach((clientId) => {
        if (clientId === socketIdRef.current) return;
        if (connectionsRef.current[clientId]) return;

        const pc = new RTCPeerConnection(peerConfigConnections);
        connectionsRef.current[clientId] = pc;

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socketRef.current.emit(
              "signal",
              clientId,
              JSON.stringify({ ice: event.candidate })
            );
          }
        };

        pc.ontrack = (event) => {
          const remoteStream = event.streams[0];
          setVideos((prev) =>
            prev.find((v) => v.socketId === clientId)
              ? prev
              : [...prev, { socketId: clientId, stream: remoteStream }]
          );
        };

        // ✅ FIX: use localStream
        localStream?.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });

        if (newUserId !== socketIdRef.current) return;

        pc.createOffer().then((offer) => {
          pc.setLocalDescription(offer);
          socketRef.current.emit(
            "signal",
            clientId,
            JSON.stringify({ sdp: offer })
          );
        });
      });
    });

    socketRef.current.on("connect", () => {
      socketIdRef.current = socketRef.current.id;
      socketRef.current.emit("join-call", window.location.href);
    });
  };

  const connect = () => {
    if (!username.trim()) return;
    setAskForUsername(false);

    setTimeout(() => {
      if (callVideoRef.current && localStream) {
        callVideoRef.current.srcObject = localStream;
      }
    }, 0);

    connectToSocketServer();
  };

  useEffect(() => {
    getPermissions();

    return () => {
      socketRef.current?.disconnect();
      Object.values(connectionsRef.current).forEach((pc) => pc.close());
      connectionsRef.current = {};
    };
  }, []);

  /* ---------------- SCREEN SHARE (UNCHANGED UI) ---------------- */
  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];

      Object.values(connectionsRef.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        sender?.replaceTrack(screenTrack);
      });

      const newStream = new MediaStream([
        screenTrack,
        ...localStream.getAudioTracks(),
      ]);

      setLocalStream(newStream);
      callVideoRef.current.srcObject = newStream;
      setIsScreenSharing(true);

      screenTrack.onended = stopScreenShare;
    } catch (err) {
      console.error("Screen share error:", err);
    }
  };

  const stopScreenShare = async () => {
    const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
    const camTrack = camStream.getVideoTracks()[0];

    Object.values(connectionsRef.current).forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      sender?.replaceTrack(camTrack);
    });

    const newStream = new MediaStream([
      camTrack,
      ...localStream.getAudioTracks(),
    ]);

    setLocalStream(newStream);
    callVideoRef.current.srcObject = newStream;
    setIsScreenSharing(false);
  };

  /* ---------------- END CALL (ONLY LOGIC FIX) ---------------- */
  const endCall = async () => {
    // 🔥 tell recorder to send FINAL chunk
    window.dispatchEvent(new Event("MEETING_END"));

    await new Promise((r) => setTimeout(r, 2000));

    localStream?.getTracks().forEach((track) => track.stop());

    Object.values(connectionsRef.current).forEach((pc) => pc.close());
    connectionsRef.current = {};

    socketRef.current?.disconnect();

    window.location.href = "/";
  };

  /* ---------------- UI (UNCHANGED) ---------------- */
  return (
    <div className={styles.wrapper}>
      {askForUsername ? (
        <div className={styles.lobby}>
          <div className={styles.lobbyCard}>
            <h2>Enter Lobby</h2>
            <input
              className={styles.input}
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <button className={styles.connectBtn} onClick={connect}>
              Connect
            </button>
          </div>

          <div className={styles.preview}>
            <video ref={lobbyVideoRef} autoPlay muted playsInline />
          </div>
        </div>
      ) : (
        <div className={styles.call}>
          <div className={styles.peers}>
            {videos.map((v) => (
              <div key={v.socketId} className={styles.peerTile}>
                <video
                  ref={(ref) => ref && (ref.srcObject = v.stream)}
                  autoPlay
                  playsInline
                />
              </div>
            ))}
          </div>

          <div className={styles.selfView}>
            <video ref={callVideoRef} autoPlay muted playsInline />
          </div>

          <div className={styles.controls}>
            <button className={styles.controlBtn} onClick={toggleVideo}>
              {video ? "Camera Off" : "Camera On"}
            </button>

            <button className={styles.controlBtn} onClick={toggleAudio}>
              {audio ? "Mute" : "Unmute"}
            </button>

            <button
              className={styles.controlBtn}
              onClick={isScreenSharing ? stopScreenShare : startScreenShare}
            >
              {isScreenSharing ? "Stop Share" : "Share Screen"}
            </button>

            {/* ✅ RECORD BUTTON IS BACK */}
            <MeetingRecorder
              localStream={localStream}
              meetingId={meetingIdRef.current}
            />

            <button
              className={`${styles.controlBtn} ${styles.endBtn}`}
              onClick={endCall}
            >
              End Call
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoMeetComponent;
