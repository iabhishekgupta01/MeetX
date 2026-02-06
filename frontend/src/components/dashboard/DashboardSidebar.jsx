import React from "react";
import styles from "./DashboardSidebar.module.css";

function DashboardSidebar({ username, onCreateMeeting, onJoinByCode, onRefresh, onLogout }) {
  const initial = username ? username.charAt(0).toUpperCase() : "U";

  return (
    <aside className={styles.sidebar}>
      
      {/* Brand Section */}
      <div className={styles.brandSection}>
        <div className={styles.logoIcon}>M</div>
        <span className={styles.brandText}>Meet<span className={styles.brandAccent}>X</span></span>
      </div>

      {/* User Profile Card */}
      <div className={styles.userSection}>
        <div className={styles.userCard}>
          <div className={styles.avatar}>{initial}</div>
          <div className={styles.userInfo}>
            <span className={styles.userLabel}>Workspace</span>
            <span className={styles.userName} title={username}>{username}</span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className={styles.navSection}>
        <p className={styles.sectionTitle}>Menu</p>
        
        <button className={`${styles.navItem} ${styles.primaryBtn}`} onClick={onCreateMeeting}>
          <PlusIcon />
          <span>New Meeting</span>
        </button>

        <button className={styles.navItem} onClick={onJoinByCode}>
          <KeyboardIcon />
          <span>Join with Code</span>
        </button>

        <button className={styles.navItem} onClick={onRefresh}>
          <RefreshIcon />
          <span>Refresh List</span>
        </button>
      </nav>

      {/* Footer / Logout */}
      <div className={styles.footerSection}>
        <button className={styles.logoutBtn} onClick={onLogout}>
          <LogoutIcon />
          <span>Log Out</span>
        </button>
      </div>

    </aside>
  );
}

// Icons
const PlusIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const KeyboardIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><line x1="6" y1="12" x2="6" y2="12"></line><line x1="10" y1="12" x2="10" y2="12"></line><line x1="14" y1="12" x2="14" y2="12"></line><line x1="18" y1="12" x2="18" y2="12"></line><line x1="6" y1="16" x2="6" y2="16"></line><line x1="10" y1="16" x2="14" y2="16"></line></svg>;
const RefreshIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>;
const LogoutIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;

export default DashboardSidebar;