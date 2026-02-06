import React from "react";
import styles from "./MeetingsSection.module.css";

function MeetingsSection({
  activeTab,
  completedFilter,
  onCompletedFilterChange,
  scheduledMeetings,
  completedMeetings,
  completedCounts,
  onOpenDetail,
  onJoinMeeting,
  onShareMeeting,
  sectionRef,
}) {
  
  const getExpirationStatus = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry - now;

    if (diffMs < 0) return { text: "Expired", type: "expired" };
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return { text: `${diffDays}d left`, type: "safe" };
    if (diffHours > 0) return { text: `${diffHours}h left`, type: "warn" };
    
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return { text: `${diffMins}m left`, type: "urgent" };
  };

  const renderMeetingCard = (meeting, isCompleted = false) => {
    const expiration = getExpirationStatus(meeting.expiresAt);
    const meetingKey = meeting._id || meeting.meetingId;
    const isHost = meeting.role === "host";

    // LOGIC FIX: Determine if the main button should be disabled
    // It is disabled ONLY if it is NOT completed (scheduled) AND it has expired.
    const isButtonDisabled = !isCompleted && expiration.type === 'expired';

    // LOGIC FIX: Determine action based on state
    const handleMainButtonClick = (e) => {
      e.stopPropagation(); // Prevent card click
      if (isCompleted) {
        onOpenDetail(meeting); // History -> View Details
      } else {
        onJoinMeeting(meeting.meetingId); // Scheduled -> Join
      }
    };

    return (
      <div
        key={meetingKey}
        className={`${styles.card} ${isCompleted ? styles.cardCompleted : ''}`}
        onClick={() => onOpenDetail(meeting)}
      >
        <div className={`${styles.decorBar} ${isHost ? styles.barHost : styles.barGuest}`} />

        <div className={styles.cardContent}>
          <div className={styles.cardHeader}>
            <div className={styles.titleGroup}>
              <h3 className={styles.title} title={meeting.title}>{meeting.title}</h3>
              <span className={isHost ? styles.roleHost : styles.roleGuest}>
                {isHost ? "HOST" : "GUEST"}
              </span>
            </div>
            
            <div className={styles.statusBadgeWrapper}>
               {isCompleted ? (
                 <span className={styles.badgeFinished}>Done</span>
               ) : (
                 <span className={`${styles.timeBadge} ${styles[expiration.type]}`}>
                   {expiration.type === 'urgent' && <span className={styles.pulseDot}/>}
                   {expiration.text}
                 </span>
               )}
            </div>
          </div>

          <div className={styles.cardFooter}>
            {/* CORRECTED BUTTON:
                - If Completed: Says "View Details", Enabled.
                - If Scheduled: Says "Join Now", Disabled ONLY if expired.
            */}
            <button
              className={isCompleted ? styles.btnDetails : styles.btnJoin}
              onClick={handleMainButtonClick}
              disabled={isButtonDisabled}
            >
              {isCompleted ? "View Details" : "Join Now"}
            </button>

            {/* Share button remains enabled for both (to share results or links) */}
            <button
              className={styles.btnShare}
              onClick={(e) => {
                e.stopPropagation();
                onShareMeeting(meeting);
              }}
              title="Share Meeting"
            >
              <ShareIcon />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container} ref={sectionRef}>
      {/* Scheduled Tab */}
      {activeTab === "scheduled" && (
        <div className={styles.grid}>
          {scheduledMeetings.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📅</div>
              <p>No upcoming meetings.</p>
              <span>Create one to get started!</span>
            </div>
          ) : (
            scheduledMeetings.map(m => renderMeetingCard(m, false))
          )}
        </div>
      )}

      {/* Completed Tab */}
      {activeTab === "completed" && (
        <div className={styles.wrapper}>
          <div className={styles.filterScroll}>
            <button
              className={`${styles.filterPill} ${completedFilter === "all" ? styles.pillActive : ""}`}
              onClick={() => onCompletedFilterChange("all")}
            >
              All <span className={styles.count}>{completedCounts.all}</span>
            </button>
            <button
              className={`${styles.filterPill} ${completedFilter === "hosted" ? styles.pillActive : ""}`}
              onClick={() => onCompletedFilterChange("hosted")}
            >
              Hosted <span className={styles.count}>{completedCounts.hosted}</span>
            </button>
            <button
              className={`${styles.filterPill} ${completedFilter === "participated" ? styles.pillActive : ""}`}
              onClick={() => onCompletedFilterChange("participated")}
            >
              Joined <span className={styles.count}>{completedCounts.participated}</span>
            </button>
          </div>

          <div className={styles.grid}>
            {completedMeetings.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📂</div>
                <p>No meeting history found.</p>
              </div>
            ) : (
              completedMeetings.map(m => renderMeetingCard(m, true))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const ShareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
);

export default MeetingsSection;