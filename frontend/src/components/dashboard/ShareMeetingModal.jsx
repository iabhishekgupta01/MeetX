import React, { useState } from "react";
import styles from "./ShareMeetingModal.module.css";
import modalStyles from "./DashboardModal.module.css"; // Assuming this handles the overlay/backdrop

function ShareMeetingModal({
  meeting,
  meetingLink,
  meetingCode,
  onClose,
  onCopyLink,
  onCopyCode,
  onShareWhatsApp,
  onShareEmail,
  onShareTwitter,
  onShareFacebook,
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!meeting) return null;

  const handleCopyLink = () => {
    onCopyLink();
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    onCopyCode();
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className={modalStyles.modal}>
      <div className={styles.compactModalContent}>
        
        {/* Header */}
        <div className={styles.header}>
          <h3>Share "{meeting.title}"</h3>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          
          {/* Main Link Section */}
          <div className={styles.inputGroup}>
            <label>Meeting Link</label>
            <div className={styles.inputWrapper}>
              <input type="text" value={meetingLink} readOnly />
              <button 
                className={`${styles.copyIconBtn} ${copiedLink ? styles.active : ''}`} 
                onClick={handleCopyLink}
                title="Copy Link"
              >
                {copiedLink ? <CheckIcon /> : <CopyIcon />}
              </button>
            </div>
          </div>

          {/* Code Section */}
          <div className={styles.inputGroup}>
            <label>Meeting Code</label>
            <div className={styles.inputWrapper}>
              <input type="text" value={meetingCode} readOnly className={styles.codeText} />
              <button 
                className={`${styles.copyIconBtn} ${copiedCode ? styles.active : ''}`} 
                onClick={handleCopyCode}
                title="Copy Code"
              >
                {copiedCode ? <CheckIcon /> : <CopyIcon />}
              </button>
            </div>
          </div>

          <div className={styles.divider}><span>or share via</span></div>

          {/* Social Icons Row */}
          <div className={styles.socialRow}>
            <button onClick={onShareWhatsApp} className={`${styles.socialBtn} ${styles.wa}`} title="WhatsApp">
              <WhatsAppIcon />
            </button>
            <button onClick={onShareEmail} className={`${styles.socialBtn} ${styles.em}`} title="Email">
              <EmailIcon />
            </button>
            <button onClick={onShareTwitter} className={`${styles.socialBtn} ${styles.tw}`} title="X (Twitter)">
              <TwitterIcon />
            </button>
            <button onClick={onShareFacebook} className={`${styles.socialBtn} ${styles.fb}`} title="Facebook">
              <FacebookIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple Icon Components (SVG)
const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
);
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
);
const EmailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
);
const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
);
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
);

export default ShareMeetingModal;