import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import styles from "../styles/VideoMeet.module.css";
import MeetingRecorder from "../components/MeetingRecorder";



const serverUrl = "http://localhost:8080";

const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

function VideoMeetComponent() {
  const socketRef = useRef(null);
  const socketIdRef = useRef(null);
  const lobbyVideoRef = useRef(null);
  const callVideoRef = useRef(null);
  const connectionsRef = useRef({});

  const [videos, setVideos] = useState([]);
  const [askForUsername, setAskForUsername] = useState(true);
  const [username, setUsername] = useState("");

  const [video, setVideo] = useState(true);
  const [audio, setAudio] = useState(true);

  const [isScreenSharing, setIsScreenSharing] = useState(false);




  const getPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      window.localStream = stream;
      if (lobbyVideoRef.current) {
        lobbyVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Permission error:", err);
    }
  };



  const toggleAudio = () => {
    const track = window.localStream?.getAudioTracks()[0];
    if (!track) return;

    track.enabled = !track.enabled;
    setAudio(track.enabled);
  };

  const toggleVideo = () => {
    const track = window.localStream?.getVideoTracks()[0];
    if (!track) return;

    track.enabled = !track.enabled;
    setVideo(track.enabled);
  };



  const gotMessageFromServer = (fromId, message) => {
    const signal = JSON.parse(message);
    const pc = connectionsRef.current[fromId];
    if (!pc) return;

    if (signal.sdp) {
      pc.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
        // ONLY responder creates answer
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



  const connectToSocketServer = () => {
    socketRef.current = io(serverUrl);

    // listeners ONCE
    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("user-left", (id) => {
      if (connectionsRef.current[id]) {
        connectionsRef.current[id].close();
        delete connectionsRef.current[id];
      }
      setVideos((prev) => prev.filter((v) => v.socketId !== id));
    });

    socketRef.current.on("user-joined", (newUserId, clients) => {
      clients.forEach((clientId) => {
        if (clientId === socketIdRef.current) return;
        if (connectionsRef.current[clientId]) return;

        const pc = new RTCPeerConnection(peerConfigConnections);
        connectionsRef.current[clientId] = pc;

        // ICE
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socketRef.current.emit(
              "signal",
              clientId,
              JSON.stringify({ ice: event.candidate })
            );
          }
        };

        // Remote stream
        pc.ontrack = (event) => {
          const remoteStream = event.streams[0];

          setVideos((prev) => {
            if (prev.find((v) => v.socketId === clientId)) return prev;
            return [...prev, { socketId: clientId, stream: remoteStream }];
          });
        };

        // ADD TRACKS FIRST
        window.localStream?.getTracks().forEach((track) => {
          pc.addTrack(track, window.localStream);
        });

        // ONLY existing users create offer
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
      if (callVideoRef.current && window.localStream) {
        callVideoRef.current.srcObject = window.localStream;
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



  const endCall = () => {

    if (window.localStream) {
      window.localStream.getTracks().forEach((track) => track.stop());
      window.localStream = null;
    }


    if (lobbyVideoRef.current) lobbyVideoRef.current.srcObject = null;
    if (callVideoRef.current) callVideoRef.current.srcObject = null;


    Object.values(connectionsRef.current).forEach((pc) => pc.close());
    connectionsRef.current = {};

    socketRef.current?.disconnect();
    socketRef.current = null;
    socketIdRef.current = null;

    setVideos([]);
    setVideo(true);
    setAudio(true);
    setAskForUsername(true);
    setIsScreenSharing(false);


    window.location.href = "/";
  };



  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];


      const sender = Object.values(connectionsRef.current).map(pc =>
        pc.getSenders().find(s => s.track.kind === 'video')
      );
      sender.forEach(s => s.replaceTrack(screenTrack));


      window.localStream.removeTrack(window.localStream.getVideoTracks()[0]);
      window.localStream.addTrack(screenTrack);
      if (callVideoRef.current) {
        callVideoRef.current.srcObject = window.localStream;
      }
      setIsScreenSharing(true);
      screenTrack.onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.error("Error sharing screen:", err);
    }
  };

  const stopScreenShare = () => {
    const videoTrack = window.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.stop();
      window.localStream.removeTrack(videoTrack);
    }
    navigator.mediaDevices.getUserMedia({ video: true }).then((cameraStream) => {
      const cameraTrack = cameraStream.getVideoTracks()[0];


      const sender = Object.values(connectionsRef.current).map(pc =>
        pc.getSenders().find(s => s.track.kind === 'video')
      );
      sender.forEach(s => s.replaceTrack(cameraTrack));

      window.localStream.addTrack(cameraTrack);
      if (callVideoRef.current) {
        callVideoRef.current.srcObject = window.localStream;
      }
      setIsScreenSharing(false);
    }
    ).catch((err) => {
      console.error("Error stopping screen share:", err);
    });
  };


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
            <div className={styles.videoBox}>
              <video ref={lobbyVideoRef} autoPlay muted playsInline />

            </div>
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

            <MeetingRecorder
              localStream={window.localStream}
              peerStreams={videos.map(v => v.stream)}
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
