import React from "react";
import styles from "./DashboardMobileActions.module.css";

function DashboardMobileActions({ onCreateMeeting, onJoinByCode }) {
  return (
    <div className={styles.mobileActionGrid}>
      
      {/* Create Meeting Button (Green/Teal Theme) */}
      <button
        className={`${styles.actionCard} ${styles.createCard}`}
        onClick={onCreateMeeting}
      >
        <div className={styles.iconWrapper}>
          <PlusIcon />
        </div>
        <div className={styles.textWrapper}>
          <span className={styles.title}>New Meeting</span>
          <span className={styles.subtitle}>Instant start</span>
        </div>
      </button>

      {/* Join Meeting Button (Blue Theme) */}
      <button
        className={`${styles.actionCard} ${styles.joinCard}`}
        onClick={onJoinByCode}
      >
        <div className={styles.iconWrapper}>
          <KeyboardIcon />
        </div>
        <div className={styles.textWrapper}>
          <span className={styles.title}>Join with Code</span>
          <span className={styles.subtitle}>Enter ID</span>
        </div>
      </button>
      
    </div>
  );
}

// Icons
const PlusIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

const KeyboardIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><line x1="6" y1="12" x2="6" y2="12"></line><line x1="10" y1="12" x2="10" y2="12"></line><line x1="14" y1="12" x2="14" y2="12"></line><line x1="18" y1="12" x2="18" y2="12"></line><line x1="6" y1="16" x2="6" y2="16"></line><line x1="10" y1="16" x2="14" y2="16"></line></svg>
);

export default DashboardMobileActions;