import React from "react";
import styles from "./JoinByCodeModal.module.css";
// You can use the same overlay style from before, or the one included in the CSS below

function JoinByCodeModal({ meetingCode, onMeetingCodeChange, onClose, onJoin }) {
  
  // Handle Enter key inside the input
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      onJoin();
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.compactModal}>
        
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <KeyboardIcon />
            <h3>Join Meeting</h3>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          <p className={styles.subText}>Enter the code shared by the host.</p>
          
          <div className={styles.inputWrapper}>
            <input
              type="text"
              placeholder="ABC-123"
              value={meetingCode}
              onChange={(e) => onMeetingCodeChange(e.target.value.toUpperCase())}
              className={styles.codeInput}
              maxLength="6"
              onKeyPress={handleKeyPress}
              autoFocus
            />
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.joinBtn} onClick={onJoin}>
            Join Now
          </button>
        </div>

      </div>
    </div>
  );
}

// Simple Icon
const KeyboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#3b82f6' }}><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><line x1="6" y1="12" x2="6" y2="12"></line><line x1="10" y1="12" x2="10" y2="12"></line><line x1="14" y1="12" x2="14" y2="12"></line><line x1="18" y1="12" x2="18" y2="12"></line><line x1="6" y1="16" x2="6" y2="16"></line><line x1="10" y1="16" x2="14" y2="16"></line><line x1="18" y1="16" x2="18" y2="16"></line><line x1="6" y1="8" x2="6" y2="8"></line><line x1="10" y1="8" x2="10" y2="8"></line><line x1="14" y1="8" x2="14" y2="8"></line><line x1="18" y1="8" x2="18" y2="8"></line></svg>
);

export default JoinByCodeModal;