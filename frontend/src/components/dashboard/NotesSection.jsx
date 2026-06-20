import React, { useState, useMemo } from "react";
import styles from "./NotesSection.module.css";

function NotesSection({ allMeetings, onOpenDetail }) {
  const [search, setSearch] = useState("");

  const meetingsWithSummary = useMemo(() => {
    return allMeetings
      .filter((m) => m.summary && m.summary.trim().length > 0)
      .filter((m) => {
        if (!search.trim()) return true;
        return (
          m.title?.toLowerCase().includes(search.toLowerCase()) ||
          m.summary?.toLowerCase().includes(search.toLowerCase())
        );
      })
      .sort((a, b) => new Date(b.endedAt || b.createdAt) - new Date(a.endedAt || a.createdAt));
  }, [allMeetings, search]);

  const totalNotes = meetingsWithSummary.length;
  const displayList = meetingsWithSummary;

  return (
    <div className={styles.section}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Meeting Notes</h2>
          <p className={styles.pageSub}>AI-generated summaries from your meetings</p>
        </div>
      </div>

      {totalNotes === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>📝</span>
          <p className={styles.emptyTitle}>No notes yet</p>
          <p className={styles.emptyMsg}>
            AI summaries will appear here once your meetings are completed.
          </p>
        </div>
      ) : (
        <>
          {/* Tab bar + search */}
          <div className={styles.controls}>
            <div className={styles.tabs}>
              <button className={`${styles.tab} ${styles.tabActive}`}>
                <SummaryIcon />
                AI Summaries
                {meetingsWithSummary.length > 0 && (
                  <span className={styles.tabBadge}>{meetingsWithSummary.length}</span>
                )}
              </button>
            </div>

            <div className={styles.searchWrap}>
              <SearchIcon />
              <input
                className={styles.searchInput}
                placeholder="Search summaries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className={styles.clearSearch} onClick={() => setSearch("")}>✕</button>
              )}
            </div>
          </div>

          {displayList.length === 0 ? (
            <div className={styles.emptyTab}>
              <p className={styles.emptyTabText}>
                {search
                  ? `No summaries matching "${search}"`
                  : "No AI summaries available yet"}
              </p>
            </div>
          ) : (
            <div className={styles.grid}>
              {displayList.map((m) => (
                <NoteCard
                  key={m.meetingId || m._id}
                  meeting={m}
                  type="summary"
                  onOpenDetail={onOpenDetail}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function NoteCard({ meeting, type, onOpenDetail }) {
  const [expanded, setExpanded] = useState(false);
  const content = meeting.summary;
  const previewLength = 220;
  const isLong = content && content.length > previewLength;
  const displayText = expanded || !isLong ? content : content.slice(0, previewLength) + "...";

  const date = meeting.endedAt || meeting.createdAt;
  const dateStr = date
    ? new Date(date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Unknown date";

  const durationSec = (() => {
    if (meeting?.duration && Number.isFinite(meeting.duration)) return meeting.duration;
    const start = meeting?.startedAt || meeting?.createdAt;
    const end = meeting?.endedAt;
    if (!start || !end) return 0;
    const diff = Math.floor((new Date(end) - new Date(start)) / 1000);
    return diff > 0 ? diff : 0;
  })();

  const durationLabel = (() => {
    if (!durationSec) return null;
    const mins = Math.max(1, Math.floor(durationSec / 60));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  })();

  return (
    <div className={styles.noteCard}>
      <div className={styles.noteHeader}>
        <div className={styles.noteTitleGroup}>
          <h4 className={styles.noteTitle}>{meeting.title || "Untitled Meeting"}</h4>
          <div className={styles.noteMeta}>
            <span className={styles.metaItem}>
              <CalendarIcon />
              {dateStr}
            </span>
            {durationLabel && (
              <span className={styles.metaItem}>
                <ClockIcon />
                {durationLabel}
              </span>
            )}
            {meeting.role && (
              <span className={`${styles.rolePill} ${meeting.role === "host" ? styles.pillHost : styles.pillJoined}`}>
                {meeting.role === "host" ? "Host" : "Participant"}
              </span>
            )}
          </div>
        </div>
        <span className={`${styles.typeBadge} ${styles.badgeSummary}`}>
          AI Summary
        </span>
      </div>

      <p className={styles.noteContent}>{displayText}</p>

      <div className={styles.noteActions}>
        {isLong && (
          <button className={styles.toggleBtn} onClick={() => setExpanded(!expanded)}>
            {expanded ? "Show less ↑" : "Read more ↓"}
          </button>
        )}
        {onOpenDetail && (
          <button className={styles.detailBtn} onClick={() => onOpenDetail(meeting)}>
            View Meeting Details
            <ChevronRightIcon />
          </button>
        )}
      </div>
    </div>
  );
}

/* Icons */
const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const SummaryIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
  </svg>
);
const CalendarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const ClockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const ChevronRightIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export default NotesSection;
