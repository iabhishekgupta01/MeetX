import React from "react";
import styles from "./CreateMeetingModal.module.css";

function CreateMeetingModal({
  meetingTitle,
  meetingDescription,
  meetingDuration,
  onTitleChange,
  onDescriptionChange,
  onDurationChange,
  onClose,
  onCreate,
}) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.compactModal}>
        
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <PlusIcon />
            <h3>New Meeting</h3>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          
          {/* Title Input */}
          <div className={styles.inputGroup}>
            <div className={styles.iconWrapper}><TypeIcon /></div>
            <input
              type="text"
              placeholder="Meeting Title"
              value={meetingTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              className={styles.input}
              autoFocus
            />
          </div>

          {/* Description Input */}
          <div className={styles.inputGroup}>
            <div className={`${styles.iconWrapper} ${styles.alignTop}`}><FileIcon /></div>
            <textarea
              placeholder="Description (Optional)"
              value={meetingDescription}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className={styles.textarea}
              rows="3"
            />
          </div>

          {/* Duration Select */}
          <div className={styles.inputGroup}>
             <div className={styles.iconWrapper}><ClockIcon /></div>
             <div className={styles.selectWrapper}>
                <select
                  value={meetingDuration}
                  onChange={(e) => onDurationChange(Number(e.target.value))}
                  className={styles.select}
                >
                  <option value={1}>1 Hour</option>
                  <option value={3}>3 Hours</option>
                  <option value={6}>6 Hours</option>
                  <option value={12}>12 Hours</option>
                  <option value={24}>24 Hours (Default)</option>
                  <option value={48}>2 Days</option>
                  <option value={72}>3 Days</option>
                  <option value={168}>1 Week</option>
                </select>
                <span className={styles.arrowIcon}>▼</span>
             </div>
          </div>

        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.createBtn} onClick={onCreate}>Create</button>
        </div>
      </div>
    </div>
  );
}

// Icons
const PlusIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:'#10b981'}}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>);
const TypeIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>);
const FileIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>);
const ClockIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>);

export default CreateMeetingModal;