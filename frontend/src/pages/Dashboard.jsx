
import React, { useState, useEffect, useContext, useMemo, useRef } from "react";
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
import AnalyticsSection from "../components/dashboard/analytics/AnalyticsSection";
import MeetingActivityChart from "../components/dashboard/analytics/MeetingActivityChart";
import RecentActivityFeed from "../components/dashboard/analytics/RecentActivityFeed";
import UpcomingMeetingsPanel from "../components/dashboard/analytics/UpcomingMeetingsPanel";
import MeetingInsights from "../components/dashboard/analytics/MeetingInsights";
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
  const [meetingDuration, setMeetingDuration] = useState(30); // default 30 minutes
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetailMeeting, setSelectedDetailMeeting] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [showJoinByCodeModal, setShowJoinByCodeModal] = useState(false);
  const [meetingCode, setMeetingCode] = useState("");
  const [activeTab, setActiveTab] = useState("scheduled"); // scheduled or completed
  const [activeSection, setActiveSection] = useState("meetings"); // meetings or analytics
  const [completedFilter, setCompletedFilter] = useState("all"); // all, hosted, participated
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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
        durationMinutes: meetingDuration,
      });

      const newMeeting = response.data.meeting;
      setHostedMeetings([newMeeting, ...hostedMeetings]);
      setMeetingTitle("");
      setMeetingDescription("");
      setMeetingDuration(30); // reset to default
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
      const detailMeetingId = meeting?.meetingId;
      if (!detailMeetingId) {
        setDetailError("Meeting details are unavailable.");
        return;
      }

      const response = await axios.get(`${serverUrl}/api/v1/meeting/${detailMeetingId}?includeInactive=true`);
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
    setActiveSection("meetings");
    setActiveTab(tab);
    if (window.innerWidth <= 768 && meetingsSectionRef.current) {
      meetingsSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setIsMobileMenuOpen(false);
  };

  const openMeetingsSection = () => {
    setActiveSection("meetings");
    setIsMobileMenuOpen(false);
  };

  const openAnalyticsSection = () => {
    setActiveSection("analytics");
    fetchMeetings();
    setIsMobileMenuOpen(false);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setActiveSection("meetings");
    if (value === "completed") {
      handleTabChange("completed");
      return;
    }
    if (value === "upcoming") {
      handleTabChange("scheduled");
    }
  };

  const formatDurationFromSeconds = (seconds) => {
    if (!seconds || Number.isNaN(seconds)) return "0m";
    const totalMinutes = Math.max(1, Math.floor(seconds / 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
  };

  const getDurationSeconds = (meeting) => {
    if (meeting?.duration && Number.isFinite(meeting.duration)) return meeting.duration;
    const startedAt = meeting?.startedAt || meeting?.createdAt;
    const endedAt = meeting?.endedAt;
    if (!startedAt || !endedAt) return 0;
    const diff = Math.floor((new Date(endedAt) - new Date(startedAt)) / 1000);
    return diff > 0 ? diff : 0;
  };

  const formatUpcomingLabel = (value) => {
    if (!value) return "No date";
    const date = new Date(value);
    const now = new Date();
    const oneDayMs = 1000 * 60 * 60 * 24;
    const diffDays = Math.floor((date.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0)) / oneDayMs);
    const time = new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 0) return `Today ${time}`;
    if (diffDays === 1) return `Tomorrow ${time}`;
    return `${new Date(value).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} ${time}`;
  };

  const analyticsData = useMemo(() => {
    const allMeetings = getAllMeetingsUnique();
    const completedMeetingsAll = mergeMeetingsByStatus(true);
    const upcomingMeetingsAll = mergeMeetingsByStatus(false);

    const totalDurationSec = allMeetings.reduce((sum, meeting) => sum + getDurationSeconds(meeting), 0);

    const now = new Date();
    const activityMap = new Map();
    const activityPoints = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      activityMap.set(key, 0);
      activityPoints.push({
        key,
        label: d.toLocaleDateString(undefined, { weekday: "short" }),
        count: 0,
      });
    }

    allMeetings.forEach((meeting) => {
      const dateSource = meeting?.createdAt || meeting?.startedAt || meeting?.endedAt;
      if (!dateSource) return;
      const key = new Date(dateSource).toISOString().slice(0, 10);
      if (activityMap.has(key)) {
        activityMap.set(key, activityMap.get(key) + 1);
      }
    });

    const activityChartData = activityPoints.map((point) => ({
      label: point.label,
      count: activityMap.get(point.key) || 0,
    }));

    const recentActivity = allMeetings
      .map((meeting) => {
        const completed = isMeetingCompleted(meeting);
        const dateSource = completed ? (meeting?.endedAt || meeting?.createdAt) : (meeting?.createdAt || meeting?.startedAt);
        return {
          text: completed
            ? `Meeting completed: ${meeting?.title || "Untitled Meeting"}`
            : `Meeting created: ${meeting?.title || "Untitled Meeting"}`,
          date: dateSource ? new Date(dateSource) : new Date(0),
        };
      })
      .sort((a, b) => b.date - a.date)
      .slice(0, 5)
      .map((item) => ({
        text: item.text,
        time: item.date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      }));

    const upcomingList = upcomingMeetingsAll
      .sort((a, b) => new Date(a.scheduledFor || a.createdAt) - new Date(b.scheduledFor || b.createdAt))
      .slice(0, 5)
      .map((meeting) => ({
        ...meeting,
        whenText: formatUpcomingLabel(meeting?.scheduledFor || meeting?.createdAt),
        participantsCount: (meeting?.participants || []).length,
      }));

    const participantFrequency = new Map();
    allMeetings.forEach((meeting) => {
      (meeting?.participants || []).forEach((participant) => {
        const key = participant?.userId || participant?.username;
        if (!key) return;
        participantFrequency.set(key, {
          name: participant?.username || "Guest",
          count: (participantFrequency.get(key)?.count || 0) + 1,
        });
      });
    });

    const mostActive = Array.from(participantFrequency.values()).sort((a, b) => b.count - a.count)[0];

    const completedDurations = completedMeetingsAll.map((meeting) => ({
      title: meeting?.title || "Untitled Meeting",
      duration: getDurationSeconds(meeting),
    }));

    const totalCompletedDuration = completedDurations.reduce((sum, item) => sum + item.duration, 0);
    const averageDuration = completedDurations.length
      ? formatDurationFromSeconds(Math.floor(totalCompletedDuration / completedDurations.length))
      : "--";

    const longestMeeting = completedDurations.sort((a, b) => b.duration - a.duration)[0];

    const cards = [
      {
        title: "Total Meetings",
        value: String(allMeetings.length),
        description: "All hosted and joined meetings",
        icon: "📊",
        tone: "blue",
      },
      {
        title: "Completed Meetings",
        value: String(completedMeetingsAll.length),
        description: "Meetings marked finished",
        icon: "✅",
        tone: "green",
      },
      {
        title: "Upcoming Meetings",
        value: String(upcomingMeetingsAll.length),
        description: "Scheduled and active sessions",
        icon: "📅",
        tone: "amber",
      },
      {
        title: "Total Meeting Time",
        value: formatDurationFromSeconds(totalDurationSec),
        description: "Combined duration",
        icon: "⏱",
        tone: "violet",
      },
    ];

    return {
      cards,
      activityChartData,
      recentActivity,
      upcomingList,
      insights: {
        mostActiveParticipant: mostActive ? `${mostActive.name} (${mostActive.count})` : "--",
        averageDuration,
        longestMeeting: longestMeeting
          ? `${longestMeeting.title} (${formatDurationFromSeconds(longestMeeting.duration)})`
          : "--",
      },
    };
  }, [hostedMeetings, participatedMeetings, getAllMeetingsUnique, isMeetingCompleted, mergeMeetingsByStatus]);

  if (loading) {
    return <div className={styles.loading}>Loading your dashboard...</div>;
  }

  return (
    <div className={styles.dashboardLayout}>
      <DashboardSidebar
        username={localStorage.getItem("username") || "User"}
        activeSection={activeSection}
        onOpenMeetings={openMeetingsSection}
        onOpenAnalytics={openAnalyticsSection}
        onCreateMeeting={() => setShowCreateModal(true)}
        onJoinByCode={() => setShowJoinByCodeModal(true)}
        onRefresh={fetchMeetings}
        onLogout={handleLogoutClick}
      />

      <main className={styles.mainContent}>
        <DashboardMobileNav
          isMenuOpen={isMobileMenuOpen}
          username={localStorage.getItem("username") || "User"}
          activeSection={activeSection}
          onToggleMenu={() => setIsMobileMenuOpen((prev) => !prev)}
          onNavigateHome={() => navigate("/")}
          onGoMeetings={openMeetingsSection}
          onGoScheduled={() => handleTabChange("scheduled")}
          onGoCompleted={() => handleTabChange("completed")}
          onGoAnalytics={openAnalyticsSection}
          onLogout={handleLogoutClick}
        />

        {activeSection === "meetings" ? (
          <>
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
          </>
        ) : (
          <section className={styles.analyticsStack}>
            <div className={styles.analyticsHeaderRow}>
              <div>
                <h2 className={styles.analyticsTitle}>Analytics</h2>
                <p className={styles.analyticsSub}>Insights and trends from your meetings</p>
              </div>
            </div>

            <AnalyticsSection
              cards={analyticsData.cards}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusFilterChange={handleStatusFilterChange}
            />

            <div className={styles.analyticsGrid}>
              <MeetingActivityChart data={analyticsData.activityChartData} />

              <div className={styles.analyticsSideColumn}>
                <RecentActivityFeed items={analyticsData.recentActivity} />
                <UpcomingMeetingsPanel meetings={analyticsData.upcomingList} />
              </div>
            </div>

            <MeetingInsights insights={analyticsData.insights} />
          </section>
        )}

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
