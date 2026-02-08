
import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../contexts/AuthContext";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import DashboardMobileNav from "../components/dashboard/DashboardMobileNav";
import DashboardMobileActions from "../components/dashboard/DashboardMobileActions";
import DashboardTopBar from "../components/dashboard/DashboardTopBar";
import MeetingsSection from "../components/dashboard/MeetingsSection";
import JoinByCodeModal from "../components/dashboard/JoinByCodeModal";
import CreateMeetingModal from "../components/dashboard/CreateMeetingModal";
import ShareMeetingModal from "../components/dashboard/ShareMeetingModal";
import MeetingDetailModal from "../components/dashboard/MeetingDetailModal";
import styles from "../styles/Dashboard.module.css";


const serverUrl ="http://localhost:5000";

function Dashboard() {
  const navigate = useNavigate();
  const { handleLogout, isAuthenticated } = useContext(AuthContext);
  
  const [hostedMeetings, setHostedMeetings] = useState([]);
  const [participatedMeetings, setParticipatedMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDescription, setMeetingDescription] = useState("");
  const [meetingDuration, setMeetingDuration] = useState(24); // default 24 hours
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetailMeeting, setSelectedDetailMeeting] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [showJoinByCodeModal, setShowJoinByCodeModal] = useState(false);
  const [meetingCode, setMeetingCode] = useState("");
  const [activeTab, setActiveTab] = useState("scheduled"); // scheduled or completed
  const [completedFilter, setCompletedFilter] = useState("all"); // all, hosted, participated
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const meetingsSectionRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }

    fetchMeetings();
  }, [isAuthenticated, navigate]);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem("userId") || "test-user";

      const [hostedRes, participatedRes] = await Promise.all([
        axios.get(`${serverUrl}/api/v1/meeting/user/${userId}/hosted`),
        axios.get(`${serverUrl}/api/v1/meeting/user/${userId}/participated`),
      ]);

      setHostedMeetings(hostedRes.data.meetings || []);
      setParticipatedMeetings(participatedRes.data.meetings || []);
    } catch (error) {
      console.error("Error fetching meetings:", error);
    } finally {
      setLoading(false);
    }
  };

  const createMeeting = async () => {
    if (!meetingTitle.trim()) {
      alert("Please enter a meeting title");
      return;
    }

    try {
      const userId = localStorage.getItem("userId") || "test-user";
      const username = localStorage.getItem("username") || "User";

      const response = await axios.post(`${serverUrl}/api/v1/meeting/create`, {
        hostId: userId,
        hostName: username,
        title: meetingTitle,
        description: meetingDescription,
        durationHours: meetingDuration,
      });

      const newMeeting = response.data.meeting;
      setHostedMeetings([newMeeting, ...hostedMeetings]);
      setMeetingTitle("");
      setMeetingDescription("");
      setMeetingDuration(24); // reset to default
      setShowCreateModal(false);

      // Redirect to meeting
      navigate(`/meeting/${newMeeting.meetingId}`);
    } catch (error) {
      console.error("Error creating meeting:", error);
      alert("Failed to create meeting");
    }
  };

  const joinMeeting = (meetingId) => {
    navigate(`/meeting/${meetingId}`);
  };

  const copyMeetingLink = (meetingId) => {
    const link = `${window.location.origin}/meeting/${meetingId}`;
    navigator.clipboard.writeText(link);
    alert("Meeting link copied to clipboard!");
  };

  const openShareModal = (meeting) => {
    setSelectedMeeting(meeting);
    setShowShareModal(true);
  };

  const getMeetingLink = () => {
    if (!selectedMeeting) return "";
    return `${window.location.origin}/meeting/${selectedMeeting.meetingId}`;
  };

  const getMeetingCode = () => {
    if (!selectedMeeting) return "";
    return selectedMeeting.meetingCode || "";
  };

  const shareOnWhatsApp = () => {
    const link = getMeetingLink();
    const code = getMeetingCode();
    const text = `Join my meeting: "${selectedMeeting.title}".\n\n🔗 Link: ${link}\n🔐 Code: ${code}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const shareOnEmail = () => {
    const link = getMeetingLink();
    const code = getMeetingCode();
    const subject = `Join Meeting: ${selectedMeeting.title}`;
    const body = `You are invited to join my meeting "${selectedMeeting.title}".\n\nMeeting Link: ${link}\nMeeting Code: ${code}\n\nDescription: ${selectedMeeting.description || "No description"}`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url);
  };

  const shareOnTwitter = () => {
    const link = getMeetingLink();
    const code = getMeetingCode();
    const text = `Join my meeting: "${selectedMeeting.title}"\n🔗 Link: ${link}\n🔐 Code: ${code}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const shareOnFacebook = () => {
    const link = getMeetingLink();
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
    window.open(url, "_blank");
  };

  const copyMeetingLinkModal = () => {
    const link = getMeetingLink();
    navigator.clipboard.writeText(link);
    alert("Meeting link copied!");
  };

  const copyMeetingCodeModal = () => {
    const code = getMeetingCode();
    navigator.clipboard.writeText(code);
    alert("Meeting code copied!");
  };

  const openDetailModal = async (meeting) => {
    setShowDetailModal(true);
    setSelectedDetailMeeting(meeting);
    setDetailError("");
    setDetailLoading(true);

    try {
      const response = await axios.get(`${serverUrl}/api/v1/meeting/${meeting.meetingId}`);
      if (response.data?.meeting) {
        setSelectedDetailMeeting(response.data.meeting);
      }
    } catch (error) {
      console.error("Error fetching meeting details:", error);
      if (error.response?.status === 410) {
        setDetailError("This meeting has expired and is no longer available.");
      } else if (error.response?.status === 404) {
        setDetailError("Meeting not found.");
      } else {
        setDetailError("Failed to load meeting details.");
      }
    } finally {
      setDetailLoading(false);
    }
  };

  const isExpired = (expiresAt) => {
    return new Date() > new Date(expiresAt);
  };

  const isMeetingCompleted = (meeting) => {
    return !meeting.isActive || isExpired(meeting.expiresAt);
  };

  const getMeetingKey = (meeting) => meeting.meetingId || meeting._id;

  const matchesSearch = (meeting) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    const fields = [
      meeting.title,
      meeting.description,
      meeting.hostName,
      meeting.meetingCode,
    ];
    return fields.some((value) => value && value.toLowerCase().includes(term));
  };

  const mergeMeetingsByStatus = (completed) => {
    const map = new Map();

    hostedMeetings.forEach((meeting) => {
      if (isMeetingCompleted(meeting) === completed) {
        map.set(getMeetingKey(meeting), { ...meeting, role: "host" });
      }
    });

    participatedMeetings.forEach((meeting) => {
      if (isMeetingCompleted(meeting) === completed) {
        const key = getMeetingKey(meeting);
        if (!map.has(key)) {
          map.set(key, { ...meeting, role: "participant" });
        }
      }
    });

    return Array.from(map.values());
  };

  const getScheduledMeetings = () => {
    return mergeMeetingsByStatus(false)
      .filter(matchesSearch)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const getCompletedMeetings = () => {
    const completed = mergeMeetingsByStatus(true)
      .filter(matchesSearch)
      .sort((a, b) => new Date(b.endedAt || b.createdAt) - new Date(a.endedAt || a.createdAt));

    if (completedFilter === "hosted") {
      return completed.filter((m) => m.role === "host");
    }
    if (completedFilter === "participated") {
      return completed.filter((m) => m.role === "participant");
    }

    return completed;
  };

  const getCompletedMeetingsByRole = (role) => {
    return mergeMeetingsByStatus(true).filter((m) => m.role === role);
  };

  const getAllMeetingsUnique = () => {
    const map = new Map();
    hostedMeetings.forEach((meeting) => {
      map.set(getMeetingKey(meeting), { ...meeting, role: "host" });
    });
    participatedMeetings.forEach((meeting) => {
      const key = getMeetingKey(meeting);
      if (!map.has(key)) {
        map.set(key, { ...meeting, role: "participant" });
      }
    });
    return Array.from(map.values());
  };

  const getTotalMeetingsCount = () => getAllMeetingsUnique().length;

  const getUniqueParticipantsCount = () => {
    const all = getAllMeetingsUnique().flatMap((m) => m.participants || []);
    return getUniqueParticipants(all).length;
  };

  const getRecordingsCount = () => {
    return getAllMeetingsUnique().filter((m) => m.recordingFile).length;
  };

  const getUniqueParticipants = (participants = []) => {
    const map = new Map();
    participants.forEach((p) => {
      if (!p?.userId) return;
      const existing = map.get(p.userId);
      if (!existing) {
        map.set(p.userId, p);
        return;
      }
      const existingJoined = existing.joinedAt ? new Date(existing.joinedAt) : null;
      const currentJoined = p.joinedAt ? new Date(p.joinedAt) : null;
      if (currentJoined && (!existingJoined || currentJoined > existingJoined)) {
        map.set(p.userId, p);
      }
    });
    return Array.from(map.values());
  };

  const joinByCode = async () => {
    if (!meetingCode.trim()) {
      alert("Please enter a meeting code");
      return;
    }

    try {
      const response = await axios.get(
        `${serverUrl}/api/v1/meeting/code/${meetingCode.toUpperCase()}`
      );

      if (response.data.meetingId) {
        setMeetingCode("");
        setShowJoinByCodeModal(false);
        navigate(`/meeting/${response.data.meetingId}`);
      }
    } catch (error) {
      console.error("Error joining by code:", error);
      if (error.response?.status === 410) {
        alert("This meeting has expired and is no longer available.");
      } else {
        alert("Invalid meeting code. Please check and try again.");
      }
    }
  };

  const handleLogoutClick = () => {
    handleLogout();
    navigate("/auth");
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (window.innerWidth <= 768 && meetingsSectionRef.current) {
      meetingsSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setIsMobileMenuOpen(false);
  };

  if (loading) {
    return <div className={styles.loading}>Loading your dashboard...</div>;
  }

  return (
    <div className={styles.dashboardLayout}>
      <DashboardSidebar
        username={localStorage.getItem("username") || "User"}
        onCreateMeeting={() => setShowCreateModal(true)}
        onJoinByCode={() => setShowJoinByCodeModal(true)}
        onRefresh={fetchMeetings}
      />

      <main className={styles.mainContent}>
        <DashboardMobileNav
          isMenuOpen={isMobileMenuOpen}
          onToggleMenu={() => setIsMobileMenuOpen((prev) => !prev)}
          onNavigateHome={() => navigate("/")}
          onGoScheduled={() => handleTabChange("scheduled")}
          onGoCompleted={() => handleTabChange("completed")}
          onLogout={handleLogoutClick}
        />

        <DashboardMobileActions
          onCreateMeeting={() => setShowCreateModal(true)}
          onJoinByCode={() => setShowJoinByCodeModal(true)}
        />

        <DashboardTopBar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          scheduledCount={getScheduledMeetings().length}
          completedCount={getCompletedMeetings().length}
        />

        <MeetingsSection
          activeTab={activeTab}
          completedFilter={completedFilter}
          onCompletedFilterChange={setCompletedFilter}
          scheduledMeetings={getScheduledMeetings()}
          completedMeetings={getCompletedMeetings()}
          completedCounts={{
            all: mergeMeetingsByStatus(true).length,
            hosted: getCompletedMeetingsByRole("host").length,
            participated: getCompletedMeetingsByRole("participant").length,
          }}
          onOpenDetail={openDetailModal}
          onJoinMeeting={joinMeeting}
          onShareMeeting={openShareModal}
          sectionRef={meetingsSectionRef}
        />

        {showJoinByCodeModal && (
          <JoinByCodeModal
            meetingCode={meetingCode}
            onMeetingCodeChange={setMeetingCode}
            onClose={() => {
              setShowJoinByCodeModal(false);
              setMeetingCode("");
            }}
            onJoin={joinByCode}
          />
        )}

        {showCreateModal && (
          <CreateMeetingModal
            meetingTitle={meetingTitle}
            meetingDescription={meetingDescription}
            meetingDuration={meetingDuration}
            onTitleChange={setMeetingTitle}
            onDescriptionChange={setMeetingDescription}
            onDurationChange={setMeetingDuration}
            onClose={() => setShowCreateModal(false)}
            onCreate={createMeeting}
          />
        )}

        {showShareModal && selectedMeeting && (
          <ShareMeetingModal
            meeting={selectedMeeting}
            meetingLink={getMeetingLink()}
            meetingCode={getMeetingCode()}
            onClose={() => setShowShareModal(false)}
            onCopyLink={copyMeetingLinkModal}
            onCopyCode={copyMeetingCodeModal}
            onShareWhatsApp={shareOnWhatsApp}
            onShareEmail={shareOnEmail}
            onShareTwitter={shareOnTwitter}
            onShareFacebook={shareOnFacebook}
          />
        )}

        {showDetailModal && selectedDetailMeeting && (
          <MeetingDetailModal
            meeting={selectedDetailMeeting}
            onClose={() => setShowDetailModal(false)}
            getUniqueParticipants={getUniqueParticipants}
            isLoading={detailLoading}
            error={detailError}
          />
        )}
      </main>
    </div>
  );
}

export default Dashboard;
