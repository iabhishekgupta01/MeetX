import React from "react";
import styles from "./DashboardTopBar.module.css";

function DashboardTopBar({ activeTab, onTabChange, scheduledCount, completedCount }) {
  
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'short', 
    day: 'numeric',
    month: 'short' 
  });

  return (
    <div className={styles.container}>
      
      {/* Top Row: Title & Date */}
      <div className={styles.headerRow}>
        <div className={styles.textGroup}>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>Welcome back, Abhishek</p>
        </div>
        
        {/* Date Widget (Visible on Desktop, compact on mobile) */}
        <div className={styles.dateBadge}>
          <span className={styles.dateIcon}>📅</span>
          <span>{today}</span>
        </div>
      </div>

      {/* Bottom Row: Navigation Tabs */}
      <div className={styles.controlsRow}>
        <div className={styles.segmentedControl}>
          <button
            className={`${styles.segmentBtn} ${activeTab === "scheduled" ? styles.active : ""}`}
            onClick={() => onTabChange("scheduled")}
          >
            <span>Upcoming</span>
            {scheduledCount > 0 && <span className={styles.badge}>{scheduledCount}</span>}
          </button>
          
          <button
            className={`${styles.segmentBtn} ${activeTab === "completed" ? styles.active : ""}`}
            onClick={() => onTabChange("completed")}
          >
            <span>History</span>
            {completedCount > 0 && <span className={styles.badgeGray}>{completedCount}</span>}
          </button>
        </div>
      </div>

    </div>
  );
}

export default DashboardTopBar;