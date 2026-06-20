import React from "react";
import styles from "./DashboardSidebar.module.css";

function DashboardSidebar({
  username,
  onCreateMeeting,
  onJoinByCode,
  onRefresh,
  onOpenMeetings,
  onOpenAnalytics,
  onOpenProfile,
  onOpenNotes,
  activeSection = "meetings",
  onLogout,
}) {
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
            <span className={styles.userName} title={username}>{username}</span>
            <span className={styles.userLabel}>Signed in</span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className={styles.navSection}>

        {/* Quick Actions at top */}
        <p className={styles.sectionTitle}>Quick Actions</p>

        <div className={styles.quickActionsGrid}>
          <button className={`${styles.quickBtn} ${styles.quickBtnNew}`} onClick={onCreateMeeting}>
            <PlusIcon />
            <span>New Meeting</span>
          </button>
          <button className={`${styles.quickBtn} ${styles.quickBtnJoin}`} onClick={onJoinByCode}>
            <KeyboardIcon />
            <span>Join Code</span>
          </button>
        </div>

        {/* Navigation pages */}
        <p className={styles.sectionTitle} style={{ marginTop: "0.75rem" }}>Pages</p>

        <button
          className={`${styles.navItem} ${activeSection === "meetings" ? styles.navItemActive : ""}`}
          onClick={onOpenMeetings}
        >
          <HomeIcon />
          <span>Meetings</span>
        </button>

        <button
          className={`${styles.navItem} ${activeSection === "analytics" ? styles.navItemActive : ""}`}
          onClick={onOpenAnalytics}
        >
          <ChartIcon />
          <span>Analytics</span>
        </button>

        <button
          className={`${styles.navItem} ${activeSection === "profile" ? styles.navItemActive : ""}`}
          onClick={onOpenProfile}
        >
          <ProfileIcon />
          <span>My Profile</span>
        </button>

        <button
          className={`${styles.navItem} ${activeSection === "notes" ? styles.navItemActive : ""}`}
          onClick={onOpenNotes}
        >
          <NotesIcon />
          <span>Meeting Notes</span>
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
const HomeIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
const ChartIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>;
const KeyboardIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><line x1="6" y1="12" x2="6" y2="12"></line><line x1="10" y1="12" x2="10" y2="12"></line><line x1="14" y1="12" x2="14" y2="12"></line><line x1="18" y1="12" x2="18" y2="12"></line><line x1="6" y1="16" x2="6" y2="16"></line><line x1="10" y1="16" x2="14" y2="16"></line></svg>;
const RefreshIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>;
const LogoutIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;
const ProfileIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const NotesIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;

export default DashboardSidebar;