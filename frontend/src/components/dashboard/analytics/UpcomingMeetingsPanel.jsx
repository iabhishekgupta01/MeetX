import React from "react";
import styles from "./UpcomingMeetingsPanel.module.css";

function UpcomingMeetingsPanel({ meetings }) {
  return (
    <section className={styles.card}>
      <h3 className={styles.title}>Upcoming Meetings</h3>
      <ul className={styles.list}>
        {meetings.length === 0 ? (
          <li className={styles.empty}>No upcoming meetings</li>
        ) : (
          meetings.map((meeting) => (
            <li key={meeting._id || meeting.meetingId} className={styles.item}>
              <div>
                <p className={styles.meetingTitle}>{meeting.title || "Untitled Meeting"}</p>
                <p className={styles.meta}>
                  <span className={styles.metaPart}><span aria-hidden="true">🕒</span> {meeting.whenText}</span>
                  <span className={styles.metaPart}><span aria-hidden="true">👥</span> {meeting.participantsCount}</span>
                </p>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

export default UpcomingMeetingsPanel;
