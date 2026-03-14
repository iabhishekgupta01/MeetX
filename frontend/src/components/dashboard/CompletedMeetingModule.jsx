import React, { useMemo, useState } from "react";
import styles from "./CompletedMeetingModule.module.css";

function formatDate(value) {
  if (!value) return "--";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatTime(value) {
  if (!value) return "--:--";
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(seconds) {
  if (!seconds || Number.isNaN(seconds)) return "--";
  const totalMinutes = Math.max(1, Math.floor(seconds / 60));
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function getSummary(meeting) {
  return (
    meeting?.notesSummary ||
    meeting?.summary ||
    meeting?.aiSummary ||
    meeting?.description ||
    "No notes were captured for this meeting."
  );
}

function buildDownloadText(meeting) {
  return [
    `Meeting: ${meeting?.title || "Untitled Meeting"}`,
    `Date: ${meeting?.endedAt || meeting?.createdAt || "--"}`,
    `Organizer: ${meeting?.hostName || "Admin"}`,
    `Duration: ${formatDuration(meeting?.duration)}`,
    "",
    "Notes",
    "-----",
    getSummary(meeting),
  ].join("\n");
}

function downloadNotes(meeting) {
  const baseName = (meeting?.title || "meeting-notes")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const fileName = `${baseName || "meeting-notes"}.txt`;
  const blob = new Blob([buildDownloadText(meeting)], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function CompletedMeetingModule({ meeting, onOpenDetail }) {
  const [expanded, setExpanded] = useState(false);

  const participants = useMemo(() => meeting?.participants || [], [meeting]);
  const dateSource = meeting?.endedAt || meeting?.createdAt;
  const summary = useMemo(() => getSummary(meeting), [meeting]);

  const visibleParticipants = participants.slice(0, 4);
  const overflowCount = Math.max(0, participants.length - visibleParticipants.length);

  return (
    <article className={`${styles.module} ${expanded ? styles.expanded : ""}`}>
      <button
        type="button"
        className={styles.header}
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
      >
        <div className={styles.leftSection}>
          <h3 className={styles.title} title={meeting?.title || "Untitled Meeting"}>
            {meeting?.title || "Untitled Meeting"}
          </h3>
        </div>

        <div className={styles.rightSection}>
          <span className={styles.statusBadge}>
            <span className={styles.statusDot} aria-hidden="true" />
            Completed
          </span>
          <span className={styles.chevron} aria-hidden="true">
            <ChevronIcon />
          </span>
        </div>
      </button>

      <div className={styles.panel}>
        <div className={styles.panelInner}>
          <div className={styles.metaGrid}>
            <span className={styles.metaItem}>
              <CalendarIcon />
              {formatDate(dateSource)}
            </span>
            <span className={styles.metaItem}>
              <ClockIcon />
              {formatTime(dateSource)}
            </span>
            <span className={styles.metaItem}>
              <TimerIcon />
              {formatDuration(meeting?.duration)}
            </span>
            <span className={styles.metaItem}>
              <UserIcon />
              {meeting?.hostName || "Admin"}
            </span>
          </div>

          <div className={styles.participantsRow}>
            <div className={styles.avatarGroup}>
              {visibleParticipants.map((participant, index) => (
                <span
                  key={`${participant?.userId || participant?.username || "guest"}-${index}`}
                  className={styles.avatar}
                  title={participant?.username || "Guest"}
                >
                  {(participant?.username || "G").charAt(0).toUpperCase()}
                </span>
              ))}
              {overflowCount > 0 && <span className={styles.avatarMore}>+{overflowCount}</span>}
            </div>
            <span className={styles.participantText}>{participants.length} participants</span>
          </div>

          <p className={styles.summary}>{summary}</p>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.actionPrimary}
              onClick={() => onOpenDetail(meeting)}
            >
              View Details
            </button>
            <button
              type="button"
              className={styles.actionGhost}
              onClick={() => downloadNotes(meeting)}
            >
              Download Notes
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function CalendarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function TimerIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="10" y1="2" x2="14" y2="2" />
      <line x1="12" y1="14" x2="12" y2="8" />
      <circle cx="12" cy="14" r="8" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
