import React, { useEffect } from "react";
import styles from "./DashboardMobileNav.module.css";

function DashboardMobileNav({
  isMenuOpen = false,
  onToggleMenu = () => {},
  onNavigateHome = () => {},
  onGoScheduled = () => {},
  onGoCompleted = () => {},
  onLogout = () => {},
  username = "User" // Added username to show in mobile menu
}) {

  // UX Fix: Lock body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMenuOpen]);

  // Helper to handle navigation and auto-close
  const handleNav = (action) => {
    if (action) action();
    onToggleMenu();
  };

  return (
    <>
      {/* 1. The Sticky Header */}
      <div className={styles.navContainer}>
        <div className={styles.navContent}>
          
          {/* Brand */}
          <div className={styles.brand} onClick={() => handleNav(onNavigateHome)}>
            <div className={styles.logoBox}>M</div>
            <span className={styles.logoText}>Meet<span className={styles.accent}>X</span></span>
          </div>

          {/* Hamburger Toggle */}
          <button 
            className={`${styles.menuToggle} ${isMenuOpen ? styles.active : ''}`} 
            onClick={onToggleMenu}
            aria-label="Toggle Navigation"
          >
            <span className={styles.bar}></span>
            <span className={styles.bar}></span>
            <span className={styles.bar}></span>
          </button>
        </div>
      </div>

      {/* 2. The Dropdown Menu (Conditionally Rendered) */}
      <div className={`${styles.menuOverlay} ${isMenuOpen ? styles.open : ''}`}>
        
        {/* Backdrop (Click to close) */}
        <div className={styles.backdrop} onClick={onToggleMenu}></div>

        {/* Menu Panel */}
        <div className={styles.menuPanel}>
          
          {/* User Info (Mobile Only) */}
          <div className={styles.userInfo}>
            <div className={styles.avatar}>{username.charAt(0).toUpperCase()}</div>
            <div className={styles.userDetails}>
              <span className={styles.welcome}>Signed in as</span>
              <span className={styles.username}>{username}</span>
            </div>
          </div>

          <div className={styles.divider} />

          {/* Links */}
          <nav className={styles.navLinks}>
            <button className={styles.linkItem} onClick={() => handleNav(onNavigateHome)}>
              <HomeIcon /> <span>Dashboard</span>
            </button>
            <button className={styles.linkItem} onClick={() => handleNav(onGoScheduled)}>
              <CalendarIcon /> <span>Scheduled</span>
            </button>
            <button className={styles.linkItem} onClick={() => handleNav(onGoCompleted)}>
              <ClockIcon /> <span>History</span>
            </button>
          </nav>

          <div className={styles.divider} />

          {/* Footer Actions */}
          <div className={styles.menuFooter}>
            <button className={styles.logoutBtn} onClick={() => handleNav(onLogout)}>
              <LogoutIcon /> <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Robust Icons
const HomeIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
const CalendarIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const ClockIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
const LogoutIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;

export default DashboardMobileNav;