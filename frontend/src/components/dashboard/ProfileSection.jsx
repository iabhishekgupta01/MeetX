import React, { useState, useMemo } from "react";
import styles from "./ProfileSection.module.css";

const DEFAULT_DURATION_KEY = "meetx_default_duration";
const DEFAULT_THEME_KEY = "meetx_theme_pref";

function ProfileSection({ hostedMeetings, participatedMeetings }) {
  const storedName = localStorage.getItem("username") || "User";
  const userId = localStorage.getItem("userId") || "N/A";
  const storedEmail = localStorage.getItem("userEmail") || "";

  //  editable profile fields
  const [editMode, setEditMode] = useState(false);
  const [editedName, setEditedName] = useState(storedName);
  const [displayName, setDisplayName] = useState(storedName);
  const [editedBio, setEditedBio] = useState(
    () => localStorage.getItem("meetx_bio") || ""
  );
  const [editedRole, setEditedRole] = useState(
    () => localStorage.getItem("meetx_role") || ""
  );
  const [editedLocation, setEditedLocation] = useState(
    () => localStorage.getItem("meetx_location") || ""
  );
  const [bio, setBio] = useState(() => localStorage.getItem("meetx_bio") || "");
  const [role, setRole] = useState(() => localStorage.getItem("meetx_role") || "");
  const [location, setLocation] = useState(
    () => localStorage.getItem("meetx_location") || ""
  );

  //  preferences
  const [defaultDuration, setDefaultDuration] = useState(
    () => parseInt(localStorage.getItem(DEFAULT_DURATION_KEY) || "30", 10)
  );
  const [themePref, setThemePref] = useState(
    () => localStorage.getItem(DEFAULT_THEME_KEY) || "dark"
  );
  const [meetingStyle, setMeetingStyle] = useState(
    () => localStorage.getItem("meetx_style") || "structured"
  );

  //  notification toggles
  const [notifs, setNotifs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("meetx_notifs") || "{}");
    } catch {
      return {};
    }
  });

  //  workspace toggles
  const [workspace, setWorkspace] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("meetx_workspace") || "{}");
    } catch {
      return {};
    }
  });

  //  privacy
  const [privacy, setPrivacy] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("meetx_privacy") || "{}");
    } catch {
      return {};
    }
  });

  //  availability
  const [availability, setAvailability] = useState(
    () => localStorage.getItem("meetx_availability") || "available"
  );
  const [workHoursStart, setWorkHoursStart] = useState(
    () => localStorage.getItem("meetx_wh_start") || "09:00"
  );
  const [workHoursEnd, setWorkHoursEnd] = useState(
    () => localStorage.getItem("meetx_wh_end") || "18:00"
  );

  //  misc ui state
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const initial = displayName ? displayName.charAt(0).toUpperCase() : "U";

  const allMeetings = useMemo(() => {
    const map = new Map();
    hostedMeetings.forEach((m) => map.set(m.meetingId || m._id, { ...m, role: "host" }));
    participatedMeetings.forEach((m) => {
      const key = m.meetingId || m._id;
      if (!map.has(key)) map.set(key, { ...m, role: "participant" });
    });
    return Array.from(map.values());
  }, [hostedMeetings, participatedMeetings]);

  const memberSince = useMemo(() => {
    if (!allMeetings.length) return null;
    const dates = allMeetings.map((m) => new Date(m.createdAt)).filter((d) => !isNaN(d));
    if (!dates.length) return null;
    return new Date(Math.min(...dates));
  }, [allMeetings]);

  //  Activity streak
  const streakData = useMemo(() => {
    const daySet = new Set(
      allMeetings
        .map((m) => {
          const d = m.createdAt || m.startedAt;
          return d ? new Date(d).toISOString().slice(0, 10) : null;
        })
        .filter(Boolean)
    );
    const sorted = Array.from(daySet).sort();
    if (!sorted.length) return { current: 0, longest: 0, totalDays: 0 };

    let longestStreak = 0;
    let temp = 1;
    for (let i = 1; i < sorted.length; i++) {
      const diff = Math.round(
        (new Date(sorted[i]) - new Date(sorted[i - 1])) / 86400000
      );
      if (diff === 1) temp++;
      else {
        longestStreak = Math.max(longestStreak, temp);
        temp = 1;
      }
    }
    longestStreak = Math.max(longestStreak, temp);

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const lastDay = sorted[sorted.length - 1];
    let currentStreak = 0;
    if (lastDay === today || lastDay === yesterday) {
      currentStreak = 1;
      for (let i = sorted.length - 2; i >= 0; i--) {
        const diff = Math.round(
          (new Date(sorted[i + 1]) - new Date(sorted[i])) / 86400000
        );
        if (diff === 1) currentStreak++;
        else break;
      }
    }
    return { current: currentStreak, longest: longestStreak, totalDays: daySet.size };
  }, [allMeetings]);

  //  Top collaborators
  const topCollaborators = useMemo(() => {
    const freq = new Map();
    hostedMeetings.forEach((m) => {
      (m.participants || []).forEach((p) => {
        if (!p?.userId || p.userId === userId) return;
        const prev = freq.get(p.userId) || { name: p.username || "Guest", count: 0 };
        freq.set(p.userId, { ...prev, count: prev.count + 1 });
      });
    });
    return Array.from(freq.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [hostedMeetings, userId]);

  //  Saved templates (stored in localStorage)
  const [templates] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("meetx_templates") || '["Daily Standup","Client Review","Product Planning"]');
    } catch {
      return ["Daily Standup", "Client Review", "Product Planning"];
    }
  });

  //  Recent activity (last 5 meetings sorted by date)
  const recentActivity = useMemo(() => {
    return [...allMeetings]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  }, [allMeetings]);

  //  Productivity score
  const productivityScore = useMemo(() => {
    if (!allMeetings.length) return 0;
    const completed = allMeetings.filter((m) => !m.isActive).length;
    const withSummary = allMeetings.filter((m) => m.summary?.trim()).length;
    const completionRate = completed / allMeetings.length;
    const summaryRate = withSummary / allMeetings.length;
    return Math.round((completionRate * 60 + summaryRate * 40));
  }, [allMeetings]);

  //  Helpers
  const saveProfile = () => {
    const name = editedName.trim();
    if (name) {
      localStorage.setItem("username", name);
      setDisplayName(name);
    }
    localStorage.setItem("meetx_bio", editedBio.trim());
    localStorage.setItem("meetx_role", editedRole.trim());
    localStorage.setItem("meetx_location", editedLocation.trim());
    setBio(editedBio.trim());
    setRole(editedRole.trim());
    setLocation(editedLocation.trim());
    setEditMode(false);
  };

  const saveDuration = (val) => {
    setDefaultDuration(val);
    localStorage.setItem(DEFAULT_DURATION_KEY, String(val));
  };
  const saveTheme = (val) => {
    setThemePref(val);
    localStorage.setItem(DEFAULT_THEME_KEY, val);
  };
  const saveMeetingStyle = (val) => {
    setMeetingStyle(val);
    localStorage.setItem("meetx_style", val);
  };
  const saveAvailability = (val) => {
    setAvailability(val);
    localStorage.setItem("meetx_availability", val);
  };
  const toggleNotif = (key) => {
    const updated = { ...notifs, [key]: !notifs[key] };
    setNotifs(updated);
    localStorage.setItem("meetx_notifs", JSON.stringify(updated));
  };
  const toggleWorkspace = (key) => {
    const updated = { ...workspace, [key]: !workspace[key] };
    setWorkspace(updated);
    localStorage.setItem("meetx_workspace", JSON.stringify(updated));
  };
  const togglePrivacy = (key) => {
    const updated = { ...privacy, [key]: !privacy[key] };
    setPrivacy(updated);
    localStorage.setItem("meetx_privacy", JSON.stringify(updated));
  };
  const copyUserId = () => {
    navigator.clipboard.writeText(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const fmt = (d) =>
    d
      ? new Date(d).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "";

  const tabs = ["overview", "preferences", "notifications", "workspace", "security"];

  return (
    <div className={styles.section}>
      {/*  Page Header  */}
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>My Profile</h2>
        <p className={styles.pageSub}>Manage your identity, preferences and workspace</p>
      </div>

      {/*  Profile Hero  */}
      <div className={styles.heroCard}>
        <div className={styles.heroBg} />
        <div className={styles.heroBody}>
          <div className={styles.avatarWrap}>
            <div className={styles.avatarLarge}>{initial}</div>
            <span className={styles.activeBadge} style={{
              background: availability === "available" ? "#22c55e" : availability === "busy" ? "#ef4444" : "#f59e0b"
            }}>
              {availability === "available" ? "Available" : availability === "busy" ? "Busy" : "Away"}
            </span>
          </div>
          <div className={styles.heroInfo}>
            {editMode ? (
              <div className={styles.editBlock}>
                <div className={styles.editRow}>
                  <label className={styles.editLabel}>Display Name</label>
                  <input
                    className={styles.editInput}
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    placeholder="Your name"
                    maxLength={40}
                    autoFocus
                  />
                </div>
                <div className={styles.editRow}>
                  <label className={styles.editLabel}>Role / Title</label>
                  <input
                    className={styles.editInput}
                    value={editedRole}
                    onChange={(e) => setEditedRole(e.target.value)}
                    placeholder="e.g. Product Manager"
                    maxLength={50}
                  />
                </div>
                <div className={styles.editRow}>
                  <label className={styles.editLabel}>Location</label>
                  <input
                    className={styles.editInput}
                    value={editedLocation}
                    onChange={(e) => setEditedLocation(e.target.value)}
                    placeholder="e.g. Mumbai, India"
                    maxLength={50}
                  />
                </div>
                <div className={styles.editRow}>
                  <label className={styles.editLabel}>Short Bio</label>
                  <textarea
                    className={styles.editTextarea}
                    value={editedBio}
                    onChange={(e) => setEditedBio(e.target.value)}
                    placeholder="A short tagline about yourself..."
                    maxLength={120}
                    rows={2}
                  />
                </div>
                <div className={styles.editActions}>
                  <button className={styles.saveBtn} onClick={saveProfile}>Save Profile</button>
                  <button className={styles.cancelBtn} onClick={() => setEditMode(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.heroNameRow}>
                  <h3 className={styles.heroName}>{displayName}</h3>
                  <button className={styles.editProfileBtn} onClick={() => { setEditedName(displayName); setEditedBio(bio); setEditedRole(role); setEditedLocation(location); setEditMode(true); }}>
                    <PencilIcon /> Edit Profile
                  </button>
                </div>
                {role && <p className={styles.heroRole}>{role}</p>}
                {location && <p className={styles.heroLocation}><LocationIcon /> {location}</p>}
                {bio && <p className={styles.heroBio}>{bio}</p>}
                {!bio && !role && !location && (
                  <p className={styles.heroBioEmpty}>Click "Edit Profile" to add your bio, role, and location.</p>
                )}
              </>
            )}
            <div className={styles.heroMeta}>
              {storedEmail && <span className={styles.metaChip}><MailIcon /> {storedEmail}</span>}
              <span className={styles.metaChip}>
                <IdIcon /> {userId.slice(0, 12)}...
                <button className={styles.inlineCopy} onClick={copyUserId}>
                  {copied ? <CheckIcon /> : <CopyIcon />}
                </button>
              </span>
              {memberSince && <span className={styles.metaChip}><CalIcon /> Member since {fmt(memberSince)}</span>}
            </div>
          </div>

          {/* Productivity Score */}
          <div className={styles.scoreBox}>
            <div className={styles.scoreRing}>
              <svg viewBox="0 0 60 60" className={styles.scoreRingSvg}>
                <circle cx="30" cy="30" r="24" className={styles.ringBg} />
                <circle
                  cx="30" cy="30" r="24"
                  className={styles.ringFill}
                  strokeDasharray={`${(productivityScore / 100) * 150.8} 150.8`}
                  strokeDashoffset="37.7"
                />
              </svg>
              <span className={styles.scoreNum}>{productivityScore}%</span>
            </div>
            <span className={styles.scoreLabel}>Productivity Score</span>
          </div>
        </div>
      </div>

      {/*  Tabs  */}
      <div className={styles.tabs}>
        {tabs.map((t) => (
          <button
            key={t}
            className={`${styles.tab} ${activeTab === t ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/*  Tab: OVERVIEW  */}
      {activeTab === "overview" && (
        <div className={styles.tabContent}>

          {/* Activity Streak */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}><FlameIcon /> Activity Streak</h3>
            <div className={styles.streakRow}>
              <div className={styles.streakItem}>
                <span className={styles.streakValue}>{streakData.current}</span>
                <span className={styles.streakLabel}>Current streak</span>
                <span className={styles.streakUnit}>days</span>
              </div>
              <div className={styles.streakDivider} />
              <div className={styles.streakItem}>
                <span className={styles.streakValue}>{streakData.longest}</span>
                <span className={styles.streakLabel}>Longest streak</span>
                <span className={styles.streakUnit}>days</span>
              </div>
              <div className={styles.streakDivider} />
              <div className={styles.streakItem}>
                <span className={styles.streakValue}>{streakData.totalDays}</span>
                <span className={styles.streakLabel}>Active days</span>
                <span className={styles.streakUnit}>total</span>
              </div>
            </div>
            {streakData.current > 0 && (
              <p className={styles.streakNote}> You're on a {streakData.current}-day streak  keep it going!</p>
            )}
          </div>

          <div className={styles.twoCol}>
            {/* Recent Activity */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}><ClockIcon /> Recent Activity</h3>
              {recentActivity.length === 0 ? (
                <p className={styles.emptyCard}>No meetings yet.</p>
              ) : (
                <div className={styles.activityList}>
                  {recentActivity.map((m, i) => (
                    <div key={m._id || i} className={styles.activityItem}>
                      <span className={`${styles.activityDot} ${m.role === "host" ? styles.dotHost : styles.dotParticipant}`} />
                      <div className={styles.activityInfo}>
                        <span className={styles.activityTitle}>{m.title || "Untitled Meeting"}</span>
                        <span className={styles.activityMeta}>
                          {m.role === "host" ? "Hosted" : "Joined"}  {fmt(m.createdAt || m.startedAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Collaborators */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}><PeopleIcon /> Top Collaborators</h3>
              <p className={styles.cardSub}>People in your hosted meetings</p>
              {topCollaborators.length === 0 ? (
                <p className={styles.emptyCard}>No participants in your hosted meetings yet.</p>
              ) : (
                <div className={styles.collabList}>
                  {topCollaborators.map((c, i) => (
                    <div key={i} className={styles.collabItem}>
                      <div className={styles.collabRank}>#{i + 1}</div>
                      <div className={styles.collabAvatar}>{c.name.charAt(0).toUpperCase()}</div>
                      <div className={styles.collabInfo}>
                        <span className={styles.collabName}>{c.name}</span>
                        <span className={styles.collabMeta}>{c.count} meeting{c.count !== 1 ? "s" : ""}</span>
                      </div>
                      <span className={styles.collabBadge}>{c.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Availability Status */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}><StatusIcon /> Availability Status</h3>
              <p className={styles.cardSub}>Let others know when you're free</p>
              <div className={styles.statusGrid}>
                {[
                  { key: "available", label: "Available", color: "#22c55e" },
                  { key: "busy", label: "Busy", color: "#ef4444" },
                  { key: "away", label: "Away", color: "#f59e0b" },
                ].map(({ key, label, color }) => (
                  <button
                    key={key}
                    className={`${styles.statusBtn} ${availability === key ? styles.statusActive : ""}`}
                    onClick={() => saveAvailability(key)}
                    style={availability === key ? { borderColor: color, color } : {}}
                  >
                    <span className={styles.statusDot} style={{ background: color }} />
                    {label}
                  </button>
                ))}
              </div>
              <div className={styles.workHoursRow}>
                <label className={styles.whLabel}>Working Hours</label>
                <div className={styles.whInputs}>
                  <input type="time" className={styles.timeInput} value={workHoursStart}
                    onChange={(e) => { setWorkHoursStart(e.target.value); localStorage.setItem("meetx_wh_start", e.target.value); }} />
                  <span className={styles.whSep}></span>
                  <input type="time" className={styles.timeInput} value={workHoursEnd}
                    onChange={(e) => { setWorkHoursEnd(e.target.value); localStorage.setItem("meetx_wh_end", e.target.value); }} />
                </div>
              </div>
            </div>

            {/* Quick Tools  Saved Templates */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}><TemplateIcon /> Quick Tools</h3>
              <p className={styles.cardSub}>Saved meeting templates</p>
              <div className={styles.templateList}>
                {templates.map((t, i) => (
                  <div key={i} className={styles.templateItem}>
                    <span className={styles.templateBullet}></span>
                    <span className={styles.templateName}>{t}</span>
                  </div>
                ))}
              </div>
              <div className={styles.aiSignature}>
                <SignatureIcon />
                <span>AI Signature: <em> Notes from {displayName}'s workspace</em></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/*  Tab: PREFERENCES  */}
      {activeTab === "preferences" && (
        <div className={styles.tabContent}>
          <div className={styles.twoCol}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}><BrushIcon /> Appearance</h3>
              <div className={styles.prefItem}>
                <label className={styles.prefLabel}>Interface Theme</label>
                <div className={styles.btnGroup}>
                  {["dark", "system"].map((t) => (
                    <button key={t} className={`${styles.toggleBtn} ${themePref === t ? styles.toggleActive : ""}`} onClick={() => saveTheme(t)}>
                      {t === "dark" ? " Dark" : " System"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitle}><TimerIcon /> Meeting Defaults</h3>
              <div className={styles.prefItem}>
                <label className={styles.prefLabel}>Default Duration</label>
                <div className={styles.btnGroup}>
                  {[15, 30, 45, 60, 90].map((d) => (
                    <button key={d} className={`${styles.toggleBtn} ${defaultDuration === d ? styles.toggleActive : ""}`} onClick={() => saveDuration(d)}>
                      {d}m
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.prefItem} style={{ marginTop: "0.8rem" }}>
                <label className={styles.prefLabel}>Meeting Style</label>
                <div className={styles.btnGroup}>
                  {["structured", "casual"].map((s) => (
                    <button key={s} className={`${styles.toggleBtn} ${meetingStyle === s ? styles.toggleActive : ""}`} onClick={() => saveMeetingStyle(s)}>
                      {s === "structured" ? " Structured" : " Casual"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI Assistant Settings */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}><AiIcon /> AI Assistant Settings</h3>
            <p className={styles.cardSub}>Configure how the AI assistant works in your meetings</p>
            <div className={styles.toggleList}>
              {[
                { key: "aiSummary", label: "Auto-generate AI Summary", desc: "Summarize meeting content after it ends" },
                { key: "aiActions", label: "AI Action Items Detection", desc: "Extract action items from meeting summaries" },
              ].map(({ key, label, desc }) => (
                <div key={key} className={styles.toggleRow}>
                  <div className={styles.toggleInfo}>
                    <span className={styles.toggleLabel}>{label}</span>
                    <span className={styles.toggleDesc}>{desc}</span>
                  </div>
                  <button
                    className={`${styles.toggle} ${workspace[key] !== false ? styles.toggleOn : ""}`}
                    onClick={() => toggleWorkspace(key)}
                  >
                    <span className={styles.toggleThumb} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/*  Tab: NOTIFICATIONS  */}
      {activeTab === "notifications" && (
        <div className={styles.tabContent}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}><BellIcon /> Notification Controls</h3>
            <p className={styles.cardSub}>Manage how and when you receive alerts</p>
            <div className={styles.toggleList}>
              {[
                { key: "emailNotifs", label: "Email Notifications", desc: "Receive important updates via email" },
                { key: "meetingReminders", label: "Meeting Reminders", desc: "Get reminded before meetings start" },
                { key: "browserNotifs", label: "Browser Notifications", desc: "Push alerts in the browser" },
                { key: "meetingSummary", label: "Meeting Summary Emails", desc: "Receive summary after each meeting ends" },
                { key: "weeklyDigest", label: "Weekly Digest", desc: "A weekly roundup of your meeting activity" },
                { key: "activityAlerts", label: "Activity Alerts", desc: "Alerts when someone joins your meetings" },
              ].map(({ key, label, desc }) => (
                <div key={key} className={styles.toggleRow}>
                  <div className={styles.toggleInfo}>
                    <span className={styles.toggleLabel}>{label}</span>
                    <span className={styles.toggleDesc}>{desc}</span>
                  </div>
                  <button
                    className={`${styles.toggle} ${notifs[key] !== false ? styles.toggleOn : ""}`}
                    onClick={() => toggleNotif(key)}
                  >
                    <span className={styles.toggleThumb} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Focus Mode */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}><FocusIcon /> Focus Mode</h3>
            <div className={styles.toggleRow}>
              <div className={styles.toggleInfo}>
                <span className={styles.toggleLabel}>Enable Focus Mode</span>
                <span className={styles.toggleDesc}>Suppress all notifications except active meeting alerts</span>
              </div>
              <button
                className={`${styles.toggle} ${notifs.focusMode ? styles.toggleOn : ""}`}
                onClick={() => toggleNotif("focusMode")}
              >
                <span className={styles.toggleThumb} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/*  Tab: WORKSPACE  */}
      {activeTab === "workspace" && (
        <div className={styles.tabContent}>
          <div className={styles.twoCol}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}><GearIcon /> Workspace Settings</h3>
              <p className={styles.cardSub}>Control meeting behavior defaults</p>
              <div className={styles.toggleList}>
                {[
                  { key: "autoRecord", label: "Auto-Record Meetings", desc: "Automatically start recording when meeting begins" },
                  { key: "autoNotes", label: "Auto-Save Meeting Notes", desc: "Save notes automatically on end" },
                  { key: "privateByDefault", label: "Private by Default", desc: "New meetings start as private" },
                ].map(({ key, label, desc }) => (
                  <div key={key} className={styles.toggleRow}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleLabel}>{label}</span>
                      <span className={styles.toggleDesc}>{desc}</span>
                    </div>
                    <button
                      className={`${styles.toggle} ${workspace[key] ? styles.toggleOn : ""}`}
                      onClick={() => toggleWorkspace(key)}
                    >
                      <span className={styles.toggleThumb} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitle}><ShieldIcon /> Privacy Settings</h3>
              <div className={styles.toggleList}>
                {[
                  { key: "publicProfile", label: "Public Profile", desc: "Others can view your profile" },
                  { key: "allowInvites", label: "Allow Meeting Invites", desc: "Let others invite you to their meetings" },
                  { key: "showOnlineStatus", label: "Show Online Status", desc: "Display active status to participants" },
                ].map(({ key, label, desc }) => (
                  <div key={key} className={styles.toggleRow}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleLabel}>{label}</span>
                      <span className={styles.toggleDesc}>{desc}</span>
                    </div>
                    <button
                      className={`${styles.toggle} ${privacy[key] !== false ? styles.toggleOn : ""}`}
                      onClick={() => togglePrivacy(key)}
                    >
                      <span className={styles.toggleThumb} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Integrations */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}><LinkIcon /> Integrations</h3>
            <p className={styles.cardSub}>Connect your favorite tools (coming soon)</p>
            <div className={styles.integrationGrid}>
              {[
                { name: "Google Calendar", icon: "", connected: false },
                { name: "Slack", icon: "", connected: false },
                { name: "Notion", icon: "", connected: false },
                { name: "Outlook", icon: "", connected: false },
              ].map(({ name, icon, connected }) => (
                <div key={name} className={styles.integrationItem}>
                  <span className={styles.integrationIcon}>{icon}</span>
                  <div className={styles.integrationInfo}>
                    <span className={styles.integrationName}>{name}</span>
                    <span className={`${styles.integrationStatus} ${connected ? styles.statusConnected : styles.statusDisconnected}`}>
                      {connected ? "Connected" : "Not Connected"}
                    </span>
                  </div>
                  <button className={connected ? styles.disconnectBtn : styles.connectBtn}>
                    {connected ? "Disconnect" : "Connect"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/*  Tab: SECURITY  */}
      {activeTab === "security" && (
        <div className={styles.tabContent}>
          <div className={styles.twoCol}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}><LockIcon /> Account Security</h3>
              <div className={styles.securityList}>
                <button className={styles.securityBtn}>
                  <LockIcon /> Change Password
                </button>
                <button className={styles.securityBtn}>
                  <ShieldIcon /> Enable Two-Factor Authentication
                </button>
                <button className={styles.securityBtn}>
                  <DeviceIcon /> Logout from All Devices
                </button>
              </div>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}><DownloadIcon /> Data & Account</h3>
              <div className={styles.securityList}>
                <button className={styles.securityBtn}>
                  <DownloadIcon /> Download Meeting History
                </button>
                <button className={styles.securityBtn}>
                  <ExportIcon /> Export Personal Data
                </button>
                <button className={`${styles.securityBtn} ${styles.dangerBtn}`}>
                  <TrashIcon /> Delete Account
                </button>
              </div>
            </div>
          </div>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}><IdIcon /> Account Information</h3>
            <div className={styles.accountInfoGrid}>
              <div className={styles.accountInfoItem}>
                <span className={styles.accountInfoLabel}>Account ID</span>
                <span className={styles.accountInfoValue}>{userId}</span>
              </div>
              {storedEmail && (
                <div className={styles.accountInfoItem}>
                  <span className={styles.accountInfoLabel}>Email</span>
                  <span className={styles.accountInfoValue}>{storedEmail}</span>
                </div>
              )}
              {memberSince && (
                <div className={styles.accountInfoItem}>
                  <span className={styles.accountInfoLabel}>Account Created</span>
                  <span className={styles.accountInfoValue}>{fmt(memberSince)}</span>
                </div>
              )}
              <div className={styles.accountInfoItem}>
                <span className={styles.accountInfoLabel}>Total Meetings</span>
                <span className={styles.accountInfoValue}>{allMeetings.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/*  Icons  */
const PencilIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const CopyIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);
const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const FlameIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);
const PeopleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const LinkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);
const LocationIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const MailIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
  </svg>
);
const IdIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);
const CalIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const StatusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const TemplateIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);
const SignatureIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 20H7L3 16l14-14 4 4L7 20" />
  </svg>
);
const BrushIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.58a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3z" /><path d="M9 8c-2 3-4 3.5-7 4l8 8c1-.5 3.5-2.5 4-5" /><path d="M14.5 17.5 4.5 15" />
  </svg>
);
const TimerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const AiIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
  </svg>
);
const BellIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const FocusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
);
const GearIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const DeviceIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);
const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const ExportIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);
const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

export default ProfileSection;
