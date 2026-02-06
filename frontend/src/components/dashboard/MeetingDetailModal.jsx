import React from "react";
import styles from "./MeetingDetailModal.module.css";

function MeetingDetailModal({ meeting, onClose, getUniqueParticipants }) {
  if (!meeting) return null;

  const participants = getUniqueParticipants(meeting.participants);
  // Assuming meeting.hostName exists, otherwise default to "Admin"
  const hostName = meeting.hostName || "Admin"; 

  const formatDuration = (seconds) => {
    if (!seconds) return "--";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const formattedDate = new Date(meeting.createdAt).toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric'
  });
  
  const formattedTime = meeting.startedAt 
    ? new Date(meeting.startedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    : "--:--";

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        
        {/* 1. HERO HEADER (Gradient Background) */}
        <div className={styles.heroHeader}>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
          
          <div className={styles.headerTop}>
             <span className={meeting.isActive ? styles.badgeActive : styles.badgeEnded}>
                {meeting.isActive ? "Live" : "Ended"}
             </span>
             <span className={styles.dateBadge}>{formattedDate}</span>
          </div>

          <h2 className={styles.title}>{meeting.title}</h2>

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
               <span>⏳ {formatDuration(meeting.duration)}</span>
            </div>
          </div>
        </div>

        {/* 2. BODY (Scrollable) */}
        <div className={styles.body}>
          
          {/* Description - Only shows if text exists */}
          {meeting.description && (
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
              {participants.length > 0 ? (
                participants.map((p, idx) => (
                  <div key={idx} className={styles.participantRow}>
                    <div className={styles.pLeft}>
                      <div className={styles.pAvatar}>
                        {p.username.charAt(0).toUpperCase()}
                      </div>
                      <div className={styles.pDetails}>
                        <span className={styles.pName}>{p.username}</span>
                        <span className={styles.pJoinTime}>Joined {new Date(p.joinedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    </div>
                    {p.duration && (
                       <div className={styles.pDurationBadge}>
                         {formatDuration(p.duration)}
                       </div>
                    )}
                  </div>
                ))
              ) : (
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