import React from "react";
import styles from "./MeetingDetailModal.module.css";

function MeetingDetailModal({ meeting, onClose, getUniqueParticipants, isLoading = false, error = "" }) {
  if (!meeting && !isLoading && !error) return null;

  const participantsSource = meeting?.participants || [];
  const participants = getUniqueParticipants ? getUniqueParticipants(participantsSource) : participantsSource;
  const hostName = meeting?.hostName || "Admin";

  const formatDuration = (seconds) => {
    if (!seconds || Number.isNaN(seconds)) return "--";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const startedAt = meeting?.startedAt || meeting?.createdAt;
  const endedAt = meeting?.endedAt;
  const expiresAt = meeting?.expiresAt;
  const isExpired = expiresAt ? new Date() > new Date(expiresAt) : false;
  const isEnded = meeting ? !meeting.isActive || isExpired : false;

  const durationSeconds = meeting?.duration
    ? meeting.duration
    : startedAt && endedAt
      ? Math.floor((new Date(endedAt) - new Date(startedAt)) / 1000)
      : 0;

  const formattedDate = startedAt
    ? new Date(startedAt).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : "--";

  const formattedTime = startedAt
    ? new Date(startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "--:--";

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        
        {/* 1. HERO HEADER (Gradient Background) */}
        <div className={styles.heroHeader}>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
          
          <div className={styles.headerTop}>
            <span className={isEnded ? styles.badgeEnded : styles.badgeActive}>
              {isEnded ? "Ended" : "Live"}
            </span>
            <span className={styles.dateBadge}>{formattedDate}</span>
          </div>

          <h2 className={styles.title}>{meeting?.title || "Untitled Meeting"}</h2>

          {/* Compact Metadata Line */}
          <div className={styles.metaLine}>
            <div className={styles.hostInfo}>
              <div className={styles.hostAvatar}>{hostName.charAt(0).toUpperCase()}</div>
              <span>Hosted by <span className={styles.hostNameHighlight}>{hostName}</span></span>
            </div>
            <div className={styles.verticalDivider}></div>
            <div className={styles.timeInfo}>
               <span>⏰ {formattedTime}</span>
               <span className={styles.dot}>•</span>
               <span>⏳ {formatDuration(durationSeconds)}</span>
            </div>
          </div>
        </div>

        {/* 2. BODY (Scrollable) */}
        <div className={styles.body}>
          
          {/* Description - Only shows if text exists */}
          {meeting?.description && (
            <div className={styles.descriptionBox}>
              <p>{meeting.description}</p>
            </div>
          )}

          {/* Participants Section */}
          <div className={styles.listSection}>
            <div className={styles.listHeader}>
              <h3>Participants</h3>
              <span className={styles.countPill}>{participants.length}</span>
            </div>
            
            <div className={styles.participantsList}>
              {isLoading && <div className={styles.emptyState}>Loading details...</div>}
              {!isLoading && error && <div className={styles.emptyState}>{error}</div>}
              {!isLoading && !error && participants.length > 0 && (
                participants.map((p, idx) => (
                  <div key={idx} className={styles.participantRow}>
                    <div className={styles.pLeft}>
                      <div className={styles.pAvatar}>
                        {(p.username || "Guest").charAt(0).toUpperCase()}
                      </div>
                      <div className={styles.pDetails}>
                        <span className={styles.pName}>{p.username || "Guest"}</span>
                        <span className={styles.pJoinTime}>
                          Joined {p.joinedAt ? new Date(p.joinedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--"}
                        </span>
                      </div>
                    </div>
                    {p.duration ? (
                      <div className={styles.pDurationBadge}>
                        {formatDuration(p.duration)}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
              {!isLoading && !error && participants.length === 0 && (
                <div className={styles.emptyState}>No one joined yet.</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default MeetingDetailModal;