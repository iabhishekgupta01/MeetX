import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../contexts/AuthContext";
import VideoMeetComponent from "./VideoMeet";

const serverUrl ="http://localhost:5000";

function MeetingPage() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);
  const [meetingExists, setMeetingExists] = useState(false);
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }

    validateMeeting();
  }, [meetingId, isAuthenticated, navigate]);

  const validateMeeting = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${serverUrl}/api/v1/meeting/${meetingId}`
      );

      if (response.data.meeting) {
        setMeeting(response.data.meeting);
        setMeetingExists(true);
      }
    } catch (error) {
      console.error("Error validating meeting:", error);
      if (error.response?.status === 410) {
        setError("This meeting has expired and is no longer available.");
      } else {
        setError("Invalid meeting link. Meeting does not exist.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#0f172a",
        color: "white",
        fontSize: "1.2rem",
      }}>
        Validating meeting...
      </div>
    );
  }

  if (error || !meetingExists) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#0f172a",
        color: "white",
      }}>
        <div style={{ textAlign: "center" }}>
          <h1>Meeting Not Found</h1>
          <p style={{ color: "#94a3b8", marginBottom: "2rem" }}>{error}</p>
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              padding: "0.8rem 2rem",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "600",
            }}
          >
            Go Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <VideoMeetComponent meetingData={meeting} />;
}

export default MeetingPage;
