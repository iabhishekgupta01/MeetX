import React from "react";
import AnalyticsCard from "./AnalyticsCard";
import styles from "./AnalyticsSection.module.css";

function AnalyticsSection({ cards, searchTerm, onSearchChange, statusFilter, onStatusFilterChange }) {
  return (
    <section className={styles.section}>
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.title}>Meeting Analytics</h2>
          <p className={styles.subtitle}>Quick snapshot of your meeting workspace</p>
        </div>

        <div className={styles.controls}>
          <label className={styles.searchWrap}>
            <span className={styles.srOnly}>Search meetings</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search meeting title"
              className={styles.searchInput}
            />
          </label>

          <label className={styles.statusWrap}>
            <span className={styles.srOnly}>Filter by status</span>
            <select
              value={statusFilter}
              onChange={(event) => onStatusFilterChange(event.target.value)}
              className={styles.statusSelect}
            >
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
            </select>
          </label>
        </div>
      </div>

      <div className={styles.grid}>
        {cards.map((card) => (
          <AnalyticsCard
            key={card.title}
            title={card.title}
            value={card.value}
            description={card.description}
            icon={card.icon}
            tone={card.tone}
          />
        ))}
      </div>
    </section>
  );
}

export default AnalyticsSection;
