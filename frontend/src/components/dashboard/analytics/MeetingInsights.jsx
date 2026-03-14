import React from "react";
import styles from "./MeetingInsights.module.css";

function MeetingInsights({ insights }) {
  return (
    <section className={styles.card}>
      <h3 className={styles.title}>Meeting Insights</h3>
      <div className={styles.grid}>
        <div className={styles.item}>
          <span className={styles.label}><span aria-hidden="true">⭐</span> Most Active Participant</span>
          <p className={styles.value}>{insights.mostActiveParticipant}</p>
        </div>
        <div className={styles.item}>
          <span className={styles.label}><span aria-hidden="true">⏱</span> Avg. Duration</span>
          <p className={styles.value}>{insights.averageDuration}</p>
        </div>
        <div className={styles.item}>
          <span className={styles.label}><span aria-hidden="true">📌</span> Longest Meeting</span>
          <p className={styles.value}>{insights.longestMeeting}</p>
        </div>
      </div>
    </section>
  );
}

export default MeetingInsights;
