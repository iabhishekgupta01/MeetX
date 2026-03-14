import React from "react";
import styles from "./RecentActivityFeed.module.css";

function RecentActivityFeed({ items }) {
  return (
    <section className={styles.card}>
      <h3 className={styles.title}>Recent Activity</h3>
      <ul className={styles.list}>
        {items.length === 0 ? (
          <li className={styles.empty}>No recent activity</li>
        ) : (
          items.map((item, index) => (
            <li key={`${item.text}-${index}`} className={styles.item}>
              <span className={styles.icon} aria-hidden="true">⚡</span>
              <div className={styles.itemTextWrap}>
                <p className={styles.itemText}>{item.text}</p>
                <span className={styles.itemTime}>{item.time}</span>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

export default RecentActivityFeed;
