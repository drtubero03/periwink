"use client";

import { useEffect, useState, useCallback, useRef } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Stats {
  totalUsers: number;
  totalSignups: number;
  totalApplications: number;
  pendingApplications: number;
  totalPosts: number;
  totalComments: number;
  totalReactions: number;
  totalRooms: number;
  totalSymptomLogs: number;
  recentSignups: { id: string; name: string; email: string; createdAt: string }[];
  recentUsers: { id: string; email: string; createdAt: string; profile: { displayName: string | null } | null }[];
  dailySignups: Record<string, number>;
}

interface Signup {
  id: string;
  name: string;
  email: string;
  pseudonym: string;
  createdAt: string;
}

interface Application {
  id: string;
  name: string;
  email: string;
  roleType: string;
  status: string;
  whatDrawsYou: string | null;
  whatYouOffer: string | null;
  organization: string | null;
  website: string | null;
  createdAt: string;
}

interface Profile {
  displayName: string | null;
  menopauseStage: string | null;
  avatarStyle: string | null;
}

interface UserRecord {
  id: string;
  email: string;
  createdAt: string;
  profile: Profile | null;
}

interface RoomRecord {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string;
  isDefault: boolean;
  isArchived: boolean;
  sortOrder: number;
  _count: { posts: number; followers: number };
}

interface ModeratorRecord {
  id: string;
  userId: string;
  roomId: string;
  role: string;
  user: { email: string; profile: Profile | null };
  room: { name: string };
}

interface PostRecord {
  id: string;
  title: string;
  body: string;
  identity: string;
  isPinned: boolean;
  isLocked: boolean;
  isHidden: boolean;
  viewCount: number;
  createdAt: string;
  author: { email: string; profile: { displayName: string | null } | null };
  room: { name: string; slug: string };
  _count: { comments: number; reactions: number };
}

interface ActivityItem {
  type: "post" | "comment";
  id: string;
  createdAt: string;
  identity: string;
  isHidden: boolean;
  room: { name: string; icon: string | null } | null;
  author: { displayName: string | null; isBot: boolean };
  title?: string;
  body: string;
  postId?: string;
  postTitle?: string;
  commentCount?: number;
  reactionCount?: number;
}

interface FlagRecord {
  id: string;
  postId: string | null;
  commentId: string | null;
  reason: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  status: "PENDING" | "REVIEWED" | "DISMISSED";
  createdAt: string;
  reviewedAt: string | null;
  post: {
    id: string;
    title: string;
    body: string;
    identity: string;
    isHidden: boolean;
    room: { name: string; icon: string | null } | null;
    author: { email: string; profile: { displayName: string | null } | null };
  } | null;
  comment: {
    id: string;
    body: string;
    identity: string;
    isHidden: boolean;
    post: { id: string; title: string; room: { name: string; icon: string | null } | null } | null;
    author: { email: string; profile: { displayName: string | null } | null };
  } | null;
}

// ---------------------------------------------------------------------------
// Colors & Styles
// ---------------------------------------------------------------------------

const C = {
  plum: "#6E5A7E",
  plumLight: "#8B7A9B",
  lavender: "#B7A8C9",
  ivory: "#F7F3EE",
  ink: "#2B2433",
  card: "#FDFBF8",
  border: "#E2DDE8",
  borderLight: "#EDE9F0",
  text2: "#6B6575",
  text3: "#9B94A3",
  green: "#2E7D32",
  greenBg: "#E8F5E9",
  red: "#C62828",
  redBg: "#FFEBEE",
  amber: "#F57F17",
  amberBg: "#FFF8E1",
  blue: "#1565C0",
  blueBg: "#E3F2FD",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type Tab = "dashboard" | "activity" | "flags" | "signups" | "applications" | "users" | "posts" | "rooms" | "moderators" | "expert";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [denied, setDenied] = useState(false);
  const [tab, setTab] = useState<Tab>("dashboard");

  // Data
  const [stats, setStats] = useState<Stats | null>(null);
  const [signups, setSignups] = useState<Signup[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [moderators, setModerators] = useState<ModeratorRecord[]>([]);
  const [rooms, setRooms] = useState<RoomRecord[]>([]);
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [flags, setFlags] = useState<FlagRecord[]>([]);
  const [flagFilter, setFlagFilter] = useState<"ALL" | "PENDING" | "REVIEWED" | "DISMISSED">("PENDING");

  // Forms
  const [newMod, setNewMod] = useState({ userId: "", roomId: "", role: "MODERATOR" });
  const [newRoom, setNewRoom] = useState({ name: "", slug: "", description: "", icon: "", isDefault: false, sortOrder: 0 });

  // Search
  const [searchSignups, setSearchSignups] = useState("");
  const [searchUsers, setSearchUsers] = useState("");
  const [searchPosts, setSearchPosts] = useState("");
  const [appFilter, setAppFilter] = useState("ALL");

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedApp, setExpandedApp] = useState<string | null>(null);

  // Admin token for API auth
  const [adminToken, setAdminToken] = useState("");

  // Expert chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hi Adrian! I'm your Periwink admin expert. Ask me anything about your community — signups, posts, moderation, activity — or tell me to take care of something for you." },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auth
  useEffect(() => {
    const stored = sessionStorage.getItem("periwink-admin-token");
    if (stored) { setAdminToken(stored); setAuthed(true); return; }
    const pw = window.prompt("Enter admin password:");
    if (pw) {
      sessionStorage.setItem("periwink-admin-token", pw);
      setAdminToken(pw);
      setAuthed(true);
    } else {
      setDenied(true);
    }
  }, []);

  // Authenticated fetch helper
  const adminFetch = useCallback((url: string, options?: RequestInit) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options?.headers,
        "X-Admin-Token": adminToken,
      },
    });
  }, [adminToken]);

  // Fetch
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [stRes, sRes, aRes, uRes, mRes, rRes, pRes, actRes, flRes] = await Promise.all([
        adminFetch("/api/admin/stats"),
        adminFetch("/api/admin/signups"),
        adminFetch("/api/admin/applications"),
        adminFetch("/api/admin/users"),
        adminFetch("/api/admin/moderators"),
        adminFetch("/api/admin/rooms"),
        adminFetch("/api/admin/posts"),
        adminFetch("/api/admin/activity"),
        adminFetch("/api/admin/flags"),
      ]);
      // Check if any returned 401 (bad password)
      if ([stRes, sRes, aRes, uRes, mRes, rRes, pRes].some(r => r.status === 401)) {
        sessionStorage.removeItem("periwink-admin-token");
        setAuthed(false);
        setDenied(true);
        return;
      }
      setStats(await stRes.json());
      setSignups(await sRes.json());
      setApplications(await aRes.json());
      setUsers(await uRes.json());
      setModerators(await mRes.json());
      setRooms(await rRes.json());
      setPosts(await pRes.json());
      setActivity(await actRes.json());
      setFlags(await flRes.json());
    } catch (e) {
      setError("Failed to load data. " + (e instanceof Error ? e.message : ""));
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => { if (authed && adminToken) fetchData(); }, [authed, adminToken, fetchData]);

  // Mutations
  async function updateApplicationStatus(id: string, status: string) {
    try {
      await adminFetch(`/api/admin/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await fetchData();
    } catch { setError("Failed to update application status."); }
  }

  async function addModerator() {
    if (!newMod.userId || !newMod.roomId) { setError("Select a user and room."); return; }
    try {
      const res = await adminFetch("/api/admin/moderators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMod),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Failed."); return; }
      setNewMod({ userId: "", roomId: "", role: "MODERATOR" });
      await fetchData();
    } catch { setError("Failed to add moderator."); }
  }

  async function removeModerator(id: string) {
    if (!confirm("Remove this moderator?")) return;
    try {
      await adminFetch("/api/admin/moderators", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await fetchData();
    } catch { setError("Failed to remove moderator."); }
  }

  async function createRoom() {
    if (!newRoom.name || !newRoom.slug || !newRoom.description) {
      setError("Name, slug, and description required."); return;
    }
    try {
      const res = await adminFetch("/api/admin/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRoom),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Failed."); return; }
      setNewRoom({ name: "", slug: "", description: "", icon: "", isDefault: false, sortOrder: 0 });
      await fetchData();
    } catch { setError("Failed to create room."); }
  }

  async function togglePost(id: string, field: "isHidden" | "isPinned" | "isLocked", value: boolean) {
    try {
      await adminFetch("/api/admin/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, [field]: value }),
      });
      await fetchData();
    } catch { setError("Failed to update post."); }
  }

  async function deletePost(id: string) {
    if (!confirm("Soft-delete this post?")) return;
    try {
      await adminFetch("/api/admin/posts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await fetchData();
    } catch { setError("Failed to delete post."); }
  }

  async function resolveFlag(id: string, status: "REVIEWED" | "DISMISSED") {
    try {
      await adminFetch("/api/admin/flags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      setFlags(prev => prev.map(f => f.id === id ? { ...f, status, reviewedAt: new Date().toISOString() } : f));
    } catch { setError("Failed to update flag."); }
  }

  // Guards
  if (denied) return (
    <div style={{ textAlign: "center", marginTop: 80, fontFamily: "'DM Sans', sans-serif", color: C.text2 }}>
      <p style={{ fontSize: "1.1rem" }}>Access denied.</p>
    </div>
  );
  if (!authed) return null;

  // Tab config
  const pendingFlags = flags.filter(f => f.status === "PENDING").length;
  const tabs: { key: Tab; label: string; count?: number; alert?: boolean }[] = [
    { key: "expert", label: "✦ Expert" },
    { key: "dashboard", label: "Dashboard" },
    { key: "activity", label: "Activity", count: activity.length || undefined },
    { key: "flags", label: "Flags", count: pendingFlags || undefined, alert: pendingFlags > 0 },
    { key: "signups", label: "Signups", count: signups.length },
    { key: "applications", label: "Applications", count: applications.filter(a => a.status === "PENDING").length || undefined },
    { key: "users", label: "Users", count: users.length },
    { key: "posts", label: "Posts", count: posts.length },
    { key: "rooms", label: "Rooms", count: rooms.length },
    { key: "moderators", label: "Moderators", count: moderators.length },
  ];

  // Filtered data
  const filteredSignups = signups.filter(s =>
    !searchSignups || [s.name, s.email, s.pseudonym].some(f => f?.toLowerCase().includes(searchSignups.toLowerCase()))
  );
  const filteredUsers = users.filter(u =>
    !searchUsers || [u.email, u.profile?.displayName].some(f => f?.toLowerCase().includes(searchUsers.toLowerCase()))
  );
  const filteredApps = applications.filter(a =>
    appFilter === "ALL" || a.status === appFilter
  );
  const filteredPosts = posts.filter(p =>
    !searchPosts || [p.title, p.body, p.author?.profile?.displayName, p.room?.name].some(f => f?.toLowerCase().includes(searchPosts.toLowerCase()))
  );

  // -----------------------------------------------------------------------
  // Render helpers
  // -----------------------------------------------------------------------

  function StatCard({ label, value, color, bg }: { label: string; value: number | string; color?: string; bg?: string }) {
    return (
      <div style={{
        background: bg || C.card,
        border: `1px solid ${C.borderLight}`,
        borderRadius: 12,
        padding: "20px 24px",
        flex: "1 1 140px",
        minWidth: 140,
      }}>
        <div style={{ fontSize: "2rem", fontWeight: 600, color: color || C.plum, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.1 }}>
          {value}
        </div>
        <div style={{ fontSize: "0.8rem", color: C.text2, marginTop: 4, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 500 }}>
          {label}
        </div>
      </div>
    );
  }

  function Badge({ text, color, bg }: { text: string; color: string; bg: string }) {
    return (
      <span style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 999,
        fontSize: "0.75rem",
        fontWeight: 600,
        color,
        background: bg,
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {text}
      </span>
    );
  }

  function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { color: string; bg: string }> = {
      PENDING: { color: C.amber, bg: C.amberBg },
      REVIEWING: { color: C.blue, bg: C.blueBg },
      APPROVED: { color: C.green, bg: C.greenBg },
      DECLINED: { color: C.red, bg: C.redBg },
    };
    const s = map[status] || { color: C.text2, bg: C.borderLight };
    return <Badge text={status} color={s.color} bg={s.bg} />;
  }

  function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
    return (
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          padding: "8px 14px",
          borderRadius: 10,
          border: `1px solid ${C.border}`,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "0.85rem",
          color: C.ink,
          background: "#fff",
          outline: "none",
          width: "100%",
          maxWidth: 320,
        }}
      />
    );
  }

  function Th({ children }: { children: React.ReactNode }) {
    return (
      <th style={{
        textAlign: "left", padding: "10px 14px", borderBottom: `2px solid ${C.border}`,
        color: C.text2, fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase",
        letterSpacing: "0.04em", whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif",
      }}>
        {children}
      </th>
    );
  }

  function Td({ children, i, style }: { children: React.ReactNode; i: number; style?: React.CSSProperties }) {
    return (
      <td style={{
        padding: "9px 14px", borderBottom: `1px solid ${C.borderLight}`, color: C.ink,
        background: i % 2 === 1 ? "rgba(183,168,201,0.04)" : "transparent",
        fontSize: "0.85rem", fontFamily: "'DM Sans', sans-serif", ...style,
      }}>
        {children}
      </td>
    );
  }

  function Btn({ children, onClick, variant = "primary", small }: { children: React.ReactNode; onClick: () => void; variant?: "primary" | "danger" | "ghost"; small?: boolean }) {
    const styles: Record<string, React.CSSProperties> = {
      primary: { background: C.plum, color: "#fff" },
      danger: { background: C.red, color: "#fff" },
      ghost: { background: "transparent", color: C.plum, border: `1px solid ${C.border}` },
    };
    return (
      <button onClick={onClick} style={{
        padding: small ? "4px 10px" : "8px 18px",
        borderRadius: small ? 6 : 10,
        border: "none",
        cursor: "pointer",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: small ? "0.78rem" : "0.85rem",
        fontWeight: 500,
        transition: "opacity 0.15s",
        ...styles[variant],
      }}>
        {children}
      </button>
    );
  }

  function TableWrap({ children }: { children: React.ReactNode }) {
    return (
      <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          {children}
        </table>
      </div>
    );
  }

  function SectionHead({ title, right }: { title: string; right?: React.ReactNode }) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", fontWeight: 400, color: C.ink, margin: 0 }}>
          {title}
        </h2>
        {right}
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Dashboard
  // -----------------------------------------------------------------------

  function renderDashboard() {
    if (!stats) return <div style={{ color: C.text3, fontFamily: "'DM Sans', sans-serif" }}>Loading stats...</div>;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {/* Stat cards */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <StatCard label="Community Signups" value={stats.totalSignups} />
          <StatCard label="Applications" value={stats.totalApplications} />
          <StatCard label="Pending Review" value={stats.pendingApplications} color={stats.pendingApplications > 0 ? C.amber : C.text3} bg={stats.pendingApplications > 0 ? C.amberBg : undefined} />
          <StatCard label="Users" value={stats.totalUsers} />
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <StatCard label="Posts" value={stats.totalPosts} color={C.plumLight} />
          <StatCard label="Comments" value={stats.totalComments} color={C.plumLight} />
          <StatCard label="Reactions" value={stats.totalReactions} color={C.plumLight} />
          <StatCard label="Rooms" value={stats.totalRooms} color={C.plumLight} />
          <StatCard label="Symptom Logs" value={stats.totalSymptomLogs} color={C.plumLight} />
          <StatCard label="Flags Pending" value={pendingFlags} color={pendingFlags > 0 ? C.red : C.text3} bg={pendingFlags > 0 ? C.redBg : undefined} />
        </div>

        {/* Signup trend - simple bar chart */}
        {Object.keys(stats.dailySignups).length > 0 && (
          <div style={{ background: C.card, border: `1px solid ${C.borderLight}`, borderRadius: 12, padding: 24 }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem", fontWeight: 400, color: C.ink, marginBottom: 16 }}>
              Signups — Last 30 Days
            </h3>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80 }}>
              {Object.entries(stats.dailySignups).map(([day, count]) => {
                const maxVal = Math.max(...Object.values(stats.dailySignups));
                const h = Math.max(8, (count / maxVal) * 80);
                return (
                  <div key={day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ fontSize: "0.65rem", color: C.text3 }}>{count}</div>
                    <div style={{ width: "100%", maxWidth: 28, height: h, background: C.lavender, borderRadius: 4 }} title={`${day}: ${count}`} />
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
              {Object.keys(stats.dailySignups).map(day => (
                <div key={day} style={{ flex: 1, fontSize: "0.6rem", color: C.text3, textAlign: "center" }}>
                  {new Date(day + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent activity side-by-side */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: C.card, border: `1px solid ${C.borderLight}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.05rem", fontWeight: 400, color: C.ink, marginBottom: 12 }}>
              Recent Signups
            </h3>
            {stats.recentSignups.map(s => (
              <div key={s.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.borderLight}`, fontSize: "0.83rem", fontFamily: "'DM Sans', sans-serif" }}>
                <div>
                  <span style={{ color: C.ink, fontWeight: 500 }}>{s.name}</span>
                  <span style={{ color: C.text3, marginLeft: 8 }}>{s.email}</span>
                </div>
                <span style={{ color: C.text3, fontSize: "0.78rem", whiteSpace: "nowrap" }}>{timeAgo(s.createdAt)}</span>
              </div>
            ))}
            {stats.recentSignups.length === 0 && <div style={{ color: C.text3, fontSize: "0.83rem" }}>None yet</div>}
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.borderLight}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.05rem", fontWeight: 400, color: C.ink, marginBottom: 12 }}>
              Recent Users
            </h3>
            {stats.recentUsers.map(u => (
              <div key={u.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.borderLight}`, fontSize: "0.83rem", fontFamily: "'DM Sans', sans-serif" }}>
                <div>
                  <span style={{ color: C.ink, fontWeight: 500 }}>{u.profile?.displayName || "—"}</span>
                  <span style={{ color: C.text3, marginLeft: 8 }}>{u.email}</span>
                </div>
                <span style={{ color: C.text3, fontSize: "0.78rem", whiteSpace: "nowrap" }}>{timeAgo(u.createdAt)}</span>
              </div>
            ))}
            {stats.recentUsers.length === 0 && <div style={{ color: C.text3, fontSize: "0.83rem" }}>None yet</div>}
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Signups
  // -----------------------------------------------------------------------

  function renderSignups() {
    return (
      <>
        <SectionHead title={`Community Signups (${signups.length})`} right={<SearchBar value={searchSignups} onChange={setSearchSignups} placeholder="Search name, email, pseudonym..." />} />
        <TableWrap>
          <thead><tr><Th>Name</Th><Th>Email</Th><Th>Pseudonym</Th><Th>Date</Th></tr></thead>
          <tbody>
            {filteredSignups.map((s, i) => (
              <tr key={s.id}>
                <Td i={i}>{s.name}</Td>
                <Td i={i}><a href={`mailto:${s.email}`} style={{ color: C.plum }}>{s.email}</a></Td>
                <Td i={i}>{s.pseudonym}</Td>
                <Td i={i}>{fmtDate(s.createdAt)}</Td>
              </tr>
            ))}
            {filteredSignups.length === 0 && <tr><Td i={0} style={{ color: C.text3 }}>No signups found.</Td></tr>}
          </tbody>
        </TableWrap>
      </>
    );
  }

  // -----------------------------------------------------------------------
  // Applications
  // -----------------------------------------------------------------------

  function renderApplications() {
    const counts = {
      ALL: applications.length,
      PENDING: applications.filter(a => a.status === "PENDING").length,
      REVIEWING: applications.filter(a => a.status === "REVIEWING").length,
      APPROVED: applications.filter(a => a.status === "APPROVED").length,
      DECLINED: applications.filter(a => a.status === "DECLINED").length,
    };

    return (
      <>
        <SectionHead title={`Founding Member Applications (${applications.length})`} />
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {(["ALL", "PENDING", "REVIEWING", "APPROVED", "DECLINED"] as const).map(f => (
            <button key={f} onClick={() => setAppFilter(f)} style={{
              padding: "5px 14px", borderRadius: 999, border: "none", cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", fontWeight: 500,
              background: appFilter === f ? C.plum : "transparent",
              color: appFilter === f ? "#fff" : C.text2,
            }}>
              {f} {counts[f] > 0 ? `(${counts[f]})` : ""}
            </button>
          ))}
        </div>
        <TableWrap>
          <thead><tr><Th>Name</Th><Th>Email</Th><Th>Role</Th><Th>Status</Th><Th>Date</Th><Th>{" "}</Th></tr></thead>
          <tbody>
            {filteredApps.map((a, i) => (
              <>
                <tr key={a.id} style={{ cursor: "pointer" }} onClick={() => setExpandedApp(expandedApp === a.id ? null : a.id)}>
                  <Td i={i}><span style={{ fontWeight: 500 }}>{a.name}</span></Td>
                  <Td i={i}><a href={`mailto:${a.email}`} style={{ color: C.plum }}>{a.email}</a></Td>
                  <Td i={i}>{a.roleType.replace(/_/g, " ")}</Td>
                  <Td i={i}><StatusBadge status={a.status} /></Td>
                  <Td i={i}>{fmtDateShort(a.createdAt)}</Td>
                  <Td i={i}>
                    <select
                      value={a.status}
                      onClick={e => e.stopPropagation()}
                      onChange={e => updateApplicationStatus(a.id, e.target.value)}
                      style={{
                        padding: "4px 8px", borderRadius: 6, border: `1px solid ${C.border}`,
                        fontSize: "0.78rem", fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
                        background: "#fff", color: C.ink,
                      }}
                    >
                      <option value="PENDING">Pending</option>
                      <option value="REVIEWING">Reviewing</option>
                      <option value="APPROVED">Approved</option>
                      <option value="DECLINED">Declined</option>
                    </select>
                  </Td>
                </tr>
                {expandedApp === a.id && (
                  <tr key={a.id + "-detail"}>
                    <td colSpan={6} style={{ padding: "16px 24px", background: "rgba(183,168,201,0.06)", borderBottom: `1px solid ${C.borderLight}`, fontSize: "0.85rem", fontFamily: "'DM Sans', sans-serif" }}>
                      {a.whatDrawsYou && <div style={{ marginBottom: 8 }}><strong style={{ color: C.text2 }}>What draws them:</strong> {a.whatDrawsYou}</div>}
                      {a.whatYouOffer && <div style={{ marginBottom: 8 }}><strong style={{ color: C.text2 }}>What they offer:</strong> {a.whatYouOffer}</div>}
                      {a.organization && <div style={{ marginBottom: 8 }}><strong style={{ color: C.text2 }}>Organization:</strong> {a.organization}</div>}
                      {a.website && <div><strong style={{ color: C.text2 }}>Website:</strong> <a href={a.website} target="_blank" rel="noopener noreferrer" style={{ color: C.plum }}>{a.website}</a></div>}
                      {!a.whatDrawsYou && !a.whatYouOffer && !a.organization && !a.website && <div style={{ color: C.text3 }}>No additional details provided.</div>}
                    </td>
                  </tr>
                )}
              </>
            ))}
            {filteredApps.length === 0 && <tr><Td i={0} style={{ color: C.text3 }}>No applications match this filter.</Td></tr>}
          </tbody>
        </TableWrap>
      </>
    );
  }

  // -----------------------------------------------------------------------
  // Users
  // -----------------------------------------------------------------------

  function renderUsers() {
    return (
      <>
        <SectionHead title={`Users (${users.length})`} right={<SearchBar value={searchUsers} onChange={setSearchUsers} placeholder="Search email or display name..." />} />
        <TableWrap>
          <thead><tr><Th>Display Name</Th><Th>Email</Th><Th>Stage</Th><Th>Joined</Th></tr></thead>
          <tbody>
            {filteredUsers.map((u, i) => (
              <tr key={u.id}>
                <Td i={i}><span style={{ fontWeight: 500 }}>{u.profile?.displayName || "—"}</span></Td>
                <Td i={i}><a href={`mailto:${u.email}`} style={{ color: C.plum }}>{u.email}</a></Td>
                <Td i={i}>{u.profile?.menopauseStage ? <Badge text={u.profile.menopauseStage} color={C.plum} bg={C.borderLight} /> : "—"}</Td>
                <Td i={i}>{fmtDate(u.createdAt)}</Td>
              </tr>
            ))}
            {filteredUsers.length === 0 && <tr><Td i={0} style={{ color: C.text3 }}>No users found.</Td></tr>}
          </tbody>
        </TableWrap>
      </>
    );
  }

  // -----------------------------------------------------------------------
  // Posts
  // -----------------------------------------------------------------------

  function renderPosts() {
    return (
      <>
        <SectionHead title={`Posts (${posts.length})`} right={<SearchBar value={searchPosts} onChange={setSearchPosts} placeholder="Search title, content, author, room..." />} />
        <TableWrap>
          <thead><tr><Th>Title</Th><Th>Author</Th><Th>Room</Th><Th>Comments</Th><Th>Reactions</Th><Th>Views</Th><Th>Status</Th><Th>Date</Th><Th>Actions</Th></tr></thead>
          <tbody>
            {filteredPosts.map((p, i) => (
              <tr key={p.id}>
                <Td i={i}><span style={{ fontWeight: 500, maxWidth: 220, display: "inline-block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</span></Td>
                <Td i={i}>{p.identity === "ANONYMOUS" ? <span style={{ color: C.text3, fontStyle: "italic" }}>Anonymous</span> : (p.author?.profile?.displayName || p.author?.email || "—")}</Td>
                <Td i={i}>{p.room?.name}</Td>
                <Td i={i}>{p._count.comments}</Td>
                <Td i={i}>{p._count.reactions}</Td>
                <Td i={i}>{p.viewCount}</Td>
                <Td i={i}>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {p.isPinned && <Badge text="Pinned" color={C.blue} bg={C.blueBg} />}
                    {p.isLocked && <Badge text="Locked" color={C.amber} bg={C.amberBg} />}
                    {p.isHidden && <Badge text="Hidden" color={C.red} bg={C.redBg} />}
                    {!p.isPinned && !p.isLocked && !p.isHidden && <span style={{ color: C.text3 }}>—</span>}
                  </div>
                </Td>
                <Td i={i}>{fmtDateShort(p.createdAt)}</Td>
                <Td i={i}>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    <Btn small variant="ghost" onClick={() => togglePost(p.id, "isPinned", !p.isPinned)}>
                      {p.isPinned ? "Unpin" : "Pin"}
                    </Btn>
                    <Btn small variant="ghost" onClick={() => togglePost(p.id, "isHidden", !p.isHidden)}>
                      {p.isHidden ? "Show" : "Hide"}
                    </Btn>
                    <Btn small variant="ghost" onClick={() => togglePost(p.id, "isLocked", !p.isLocked)}>
                      {p.isLocked ? "Unlock" : "Lock"}
                    </Btn>
                    <Btn small variant="danger" onClick={() => deletePost(p.id)}>Delete</Btn>
                  </div>
                </Td>
              </tr>
            ))}
            {filteredPosts.length === 0 && <tr><Td i={0} style={{ color: C.text3 }}>No posts found.</Td></tr>}
          </tbody>
        </TableWrap>
      </>
    );
  }

  // -----------------------------------------------------------------------
  // Rooms
  // -----------------------------------------------------------------------

  function renderRooms() {
    return (
      <>
        <SectionHead title={`Rooms (${rooms.length})`} />
        <TableWrap>
          <thead><tr><Th>Icon</Th><Th>Name</Th><Th>Slug</Th><Th>Posts</Th><Th>Followers</Th><Th>Default</Th><Th>Order</Th></tr></thead>
          <tbody>
            {rooms.map((r, i) => (
              <tr key={r.id}>
                <Td i={i} style={{ fontSize: "1.2rem" }}>{r.icon || "—"}</Td>
                <Td i={i}><span style={{ fontWeight: 500 }}>{r.name}</span></Td>
                <Td i={i} style={{ color: C.text2 }}>{r.slug}</Td>
                <Td i={i}>{r._count.posts}</Td>
                <Td i={i}>{r._count.followers}</Td>
                <Td i={i}>{r.isDefault ? <Badge text="Default" color={C.green} bg={C.greenBg} /> : "—"}</Td>
                <Td i={i}>{r.sortOrder}</Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>

        <div style={{ marginTop: 28, background: C.card, border: `1px solid ${C.borderLight}`, borderRadius: 12, padding: 24 }}>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem", fontWeight: 400, color: C.ink, marginBottom: 16 }}>
            Create Room
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxWidth: 500 }}>
            <input style={inputS} placeholder="Room name" value={newRoom.name} onChange={e => setNewRoom({ ...newRoom, name: e.target.value })} />
            <input style={inputS} placeholder="slug (e.g. hot-flashes)" value={newRoom.slug} onChange={e => setNewRoom({ ...newRoom, slug: e.target.value })} />
            <input style={{ ...inputS, gridColumn: "1 / -1" }} placeholder="Description" value={newRoom.description} onChange={e => setNewRoom({ ...newRoom, description: e.target.value })} />
            <input style={inputS} placeholder="Icon (emoji)" value={newRoom.icon} onChange={e => setNewRoom({ ...newRoom, icon: e.target.value })} />
            <input style={inputS} type="number" placeholder="Sort order" value={newRoom.sortOrder} onChange={e => setNewRoom({ ...newRoom, sortOrder: parseInt(e.target.value) || 0 })} />
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", color: C.text2, fontFamily: "'DM Sans', sans-serif" }}>
              <input type="checkbox" checked={newRoom.isDefault} onChange={e => setNewRoom({ ...newRoom, isDefault: e.target.checked })} />
              Default room
            </label>
            <div><Btn onClick={createRoom}>Create Room</Btn></div>
          </div>
        </div>
      </>
    );
  }

  // -----------------------------------------------------------------------
  // Moderators
  // -----------------------------------------------------------------------

  function renderModerators() {
    return (
      <>
        <SectionHead title={`Moderators (${moderators.length})`} />
        <TableWrap>
          <thead><tr><Th>User</Th><Th>Room</Th><Th>Role</Th><Th>{" "}</Th></tr></thead>
          <tbody>
            {moderators.map((m, i) => (
              <tr key={m.id}>
                <Td i={i}><span style={{ fontWeight: 500 }}>{m.user.profile?.displayName || m.user.email}</span></Td>
                <Td i={i}>{m.room.name}</Td>
                <Td i={i}><Badge text={m.role} color={m.role === "OWNER" ? C.plum : C.blue} bg={m.role === "OWNER" ? C.borderLight : C.blueBg} /></Td>
                <Td i={i}><Btn small variant="danger" onClick={() => removeModerator(m.id)}>Remove</Btn></Td>
              </tr>
            ))}
            {moderators.length === 0 && <tr><Td i={0} style={{ color: C.text3 }}>No moderators assigned.</Td></tr>}
          </tbody>
        </TableWrap>

        <div style={{ marginTop: 28, background: C.card, border: `1px solid ${C.borderLight}`, borderRadius: 12, padding: 24 }}>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem", fontWeight: 400, color: C.ink, marginBottom: 16 }}>
            Add Moderator
          </h3>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <select style={inputS} value={newMod.userId} onChange={e => setNewMod({ ...newMod, userId: e.target.value })}>
              <option value="">Select user...</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.profile?.displayName || u.email}</option>)}
            </select>
            <select style={inputS} value={newMod.roomId} onChange={e => setNewMod({ ...newMod, roomId: e.target.value })}>
              <option value="">Select room...</option>
              {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <select style={inputS} value={newMod.role} onChange={e => setNewMod({ ...newMod, role: e.target.value })}>
              <option value="MODERATOR">Moderator</option>
              <option value="OWNER">Owner</option>
            </select>
            <Btn onClick={addModerator}>Add</Btn>
          </div>
        </div>
      </>
    );
  }

  // -----------------------------------------------------------------------
  // Activity
  // -----------------------------------------------------------------------

  function renderActivity() {
    if (activity.length === 0) {
      return <div style={{ color: C.text3, fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem" }}>No community activity yet.</div>;
    }
    return (
      <>
        <SectionHead title={`Community Activity (${activity.length})`} />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {activity.map((item) => (
            <div key={`${item.type}-${item.id}`} style={{
              background: item.author.isBot
                ? "linear-gradient(135deg, rgba(140,146,255,0.06), rgba(183,168,201,0.08))"
                : C.card,
              border: `1px solid ${item.author.isBot ? "rgba(140,146,255,0.2)" : C.borderLight}`,
              borderRadius: 12,
              padding: "14px 18px",
              opacity: item.isHidden ? 0.5 : 1,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                <span style={{
                  fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
                  padding: "2px 8px", borderRadius: 999,
                  background: item.type === "post" ? C.borderLight : "rgba(183,168,201,0.3)",
                  color: C.plum, fontFamily: "'DM Sans', sans-serif",
                }}>
                  {item.type === "post" ? "Post" : "Reply"}
                </span>
                {item.room && (
                  <span style={{ fontSize: "0.8rem", color: C.text3, fontFamily: "'DM Sans', sans-serif" }}>
                    {item.room.icon} {item.room.name}
                  </span>
                )}
                <span style={{ fontSize: "0.8rem", color: C.text3, fontFamily: "'DM Sans', sans-serif", marginLeft: "auto" }}>
                  {timeAgo(item.createdAt)}
                </span>
                {item.isHidden && <Badge text="Hidden" color={C.red} bg={C.redBg} />}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: "0.83rem", fontWeight: 500, color: C.ink, fontFamily: "'DM Sans', sans-serif" }}>
                  {item.author.displayName || "—"}
                </span>
                {item.author.isBot && (
                  <span style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", padding: "1px 6px", borderRadius: 999, background: "rgba(140,146,255,0.15)", color: "#6670cc", fontFamily: "'DM Sans', sans-serif" }}>
                    AI Guide
                  </span>
                )}
                {item.type === "comment" && item.postTitle && (
                  <span style={{ fontSize: "0.78rem", color: C.text3, fontFamily: "'DM Sans', sans-serif" }}>
                    → {item.postTitle}
                  </span>
                )}
              </div>
              {item.title && (
                <div style={{ fontSize: "0.9rem", fontWeight: 500, color: C.ink, marginBottom: 4, fontFamily: "'Cormorant Garamond', serif" }}>
                  {item.title}
                </div>
              )}
              <p style={{ fontSize: "0.83rem", color: C.text2, lineHeight: 1.55, margin: 0, fontFamily: "'DM Sans', sans-serif", whiteSpace: "pre-wrap" }}>
                {item.body.length > 240 ? item.body.slice(0, 240) + "…" : item.body}
              </p>
              {item.type === "post" && (item.commentCount! > 0 || item.reactionCount! > 0) && (
                <div style={{ marginTop: 8, fontSize: "0.75rem", color: C.text3, fontFamily: "'DM Sans', sans-serif", display: "flex", gap: 12 }}>
                  {item.commentCount! > 0 && <span>{item.commentCount} {item.commentCount === 1 ? "reply" : "replies"}</span>}
                  {item.reactionCount! > 0 && <span>{item.reactionCount} reactions</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </>
    );
  }

  // -----------------------------------------------------------------------
  // Flags
  // -----------------------------------------------------------------------

  function renderFlags() {
    const filteredFlags = flagFilter === "ALL" ? flags : flags.filter(f => f.status === flagFilter);
    const counts = {
      ALL: flags.length,
      PENDING: flags.filter(f => f.status === "PENDING").length,
      REVIEWED: flags.filter(f => f.status === "REVIEWED").length,
      DISMISSED: flags.filter(f => f.status === "DISMISSED").length,
    };

    return (
      <>
        <SectionHead title={`AI Moderation Flags (${flags.length})`} />
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {(["PENDING", "ALL", "REVIEWED", "DISMISSED"] as const).map(f => (
            <button key={f} onClick={() => setFlagFilter(f)} style={{
              padding: "5px 14px", borderRadius: 999, border: "none", cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", fontWeight: 500,
              background: flagFilter === f ? (f === "PENDING" ? C.red : C.plum) : "transparent",
              color: flagFilter === f ? "#fff" : (f === "PENDING" && counts.PENDING > 0 ? C.red : C.text2),
            }}>
              {f} {counts[f] > 0 ? `(${counts[f]})` : ""}
            </button>
          ))}
        </div>

        {filteredFlags.length === 0 ? (
          <div style={{ color: C.text3, fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", padding: "32px 0" }}>
            {flagFilter === "PENDING" ? "No pending flags — community is clean." : "None in this category."}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {filteredFlags.map((flag) => {
              const isPost = !!flag.post;
              const content = isPost ? flag.post : flag.comment;
              const authorName = content?.identity === "ANONYMOUS"
                ? "Anonymous member"
                : (content?.author?.profile?.displayName || content?.author?.email || "Unknown");
              const roomName = isPost
                ? `${flag.post?.room?.icon || ""} ${flag.post?.room?.name || ""}`.trim()
                : `${flag.comment?.post?.room?.icon || ""} ${flag.comment?.post?.room?.name || ""}`.trim();
              const contentTitle = isPost ? flag.post?.title : flag.comment?.post?.title;
              const body = isPost ? flag.post?.body : flag.comment?.body;
              const severityColor = flag.severity === "HIGH" ? C.red : flag.severity === "MEDIUM" ? C.amber : C.blue;
              const severityBg = flag.severity === "HIGH" ? C.redBg : flag.severity === "MEDIUM" ? C.amberBg : C.blueBg;

              return (
                <div key={flag.id} style={{
                  background: C.card,
                  border: `1px solid ${flag.status === "PENDING" ? severityColor : C.borderLight}`,
                  borderRadius: 14,
                  padding: "18px 20px",
                  opacity: flag.status !== "PENDING" ? 0.6 : 1,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", padding: "3px 10px", borderRadius: 999, background: severityBg, color: severityColor, fontFamily: "'DM Sans', sans-serif" }}>
                      {flag.severity}
                    </span>
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: C.text3, fontFamily: "'DM Sans', sans-serif" }}>
                      {isPost ? "Post" : "Comment"}
                    </span>
                    {roomName && <span style={{ fontSize: "0.8rem", color: C.text3, fontFamily: "'DM Sans', sans-serif" }}>{roomName}</span>}
                    <span style={{ marginLeft: "auto", fontSize: "0.78rem", color: C.text3, fontFamily: "'DM Sans', sans-serif" }}>{timeAgo(flag.createdAt)}</span>
                    {flag.status !== "PENDING" && <Badge text={flag.status} color={flag.status === "REVIEWED" ? C.green : C.text2} bg={flag.status === "REVIEWED" ? C.greenBg : C.borderLight} />}
                  </div>

                  <div style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: "0.83rem", fontWeight: 500, color: C.ink, fontFamily: "'DM Sans', sans-serif" }}>{authorName}</span>
                    {contentTitle && !isPost && (
                      <span style={{ fontSize: "0.78rem", color: C.text3, fontFamily: "'DM Sans', sans-serif", marginLeft: 8 }}>→ {contentTitle}</span>
                    )}
                  </div>

                  {isPost && contentTitle && (
                    <div style={{ fontSize: "0.95rem", fontFamily: "'Cormorant Garamond', serif", color: C.ink, fontWeight: 500, marginBottom: 6 }}>{contentTitle}</div>
                  )}

                  <p style={{ fontSize: "0.83rem", color: C.text2, lineHeight: 1.6, margin: "0 0 12px", fontFamily: "'DM Sans', sans-serif", whiteSpace: "pre-wrap" }}>
                    {(body || "").length > 300 ? body!.slice(0, 300) + "…" : body}
                  </p>

                  <div style={{ background: "rgba(183,168,201,0.1)", borderLeft: `3px solid ${severityColor}`, padding: "8px 12px", borderRadius: "0 8px 8px 0", marginBottom: 14 }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: 600, color: C.text2, fontFamily: "'DM Sans', sans-serif" }}>AI note: </span>
                    <span style={{ fontSize: "0.78rem", color: C.text2, fontFamily: "'DM Sans', sans-serif" }}>{flag.reason}</span>
                  </div>

                  {flag.status === "PENDING" && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <Btn small variant="ghost" onClick={() => resolveFlag(flag.id, "REVIEWED")}>Mark Reviewed</Btn>
                      <Btn small variant="ghost" onClick={() => resolveFlag(flag.id, "DISMISSED")}>Dismiss</Btn>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </>
    );
  }

  // -----------------------------------------------------------------------
  // Expert chat
  // -----------------------------------------------------------------------

  async function sendChatMessage() {
    if (!chatInput.trim() || chatLoading) return;
    const userMessage = chatInput.trim();
    setChatInput("");
    const newMessages: ChatMessage[] = [...chatMessages, { role: "user", content: userMessage }];
    setChatMessages(newMessages);
    setChatLoading(true);
    try {
      const res = await adminFetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      setChatMessages([...newMessages, { role: "assistant", content: data.message || "Something went wrong. Please try again." }]);
    } catch {
      setChatMessages([...newMessages, { role: "assistant", content: "I ran into an error. Please try again." }]);
    } finally {
      setChatLoading(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  function renderExpert() {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 220px)", minHeight: 480 }}>
        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", fontWeight: 400, color: C.ink, margin: 0 }}>
            Admin Expert
          </h2>
          <p style={{ fontSize: "0.82rem", color: C.text3, margin: "4px 0 0", fontFamily: "'DM Sans', sans-serif" }}>
            Ask anything about your community, or have me take action — hide a post, approve an application, create a room, and more.
          </p>
        </div>

        {/* Message list */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14, paddingRight: 4, paddingBottom: 8 }}>
          {chatMessages.map((msg, i) => (
            <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
              {msg.role === "assistant" && (
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #8C92FF, #B7A8C9)", flexShrink: 0, marginRight: 10, marginTop: 2 }} />
              )}
              <div style={{
                maxWidth: "72%",
                background: msg.role === "user" ? C.plum : C.card,
                color: msg.role === "user" ? "#fff" : C.ink,
                border: msg.role === "user" ? "none" : `1px solid ${C.borderLight}`,
                borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                padding: "12px 16px",
                fontSize: "0.88rem",
                lineHeight: 1.65,
                fontFamily: "'DM Sans', sans-serif",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}>
                {msg.content}
              </div>
            </div>
          ))}
          {chatLoading && (
            <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "flex-start" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #8C92FF, #B7A8C9)", flexShrink: 0, marginRight: 10, marginTop: 2 }} />
              <div style={{ background: C.card, border: `1px solid ${C.borderLight}`, borderRadius: "16px 16px 16px 4px", padding: "12px 16px", fontSize: "0.88rem", color: C.text3, fontFamily: "'DM Sans', sans-serif" }}>
                Thinking…
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Suggested prompts (only shown at start) */}
        {chatMessages.length === 1 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {[
              "How many signups do we have?",
              "Show me pending applications",
              "Any moderation flags to review?",
              "What's our most active room?",
            ].map(prompt => (
              <button key={prompt} onClick={() => { setChatInput(prompt); }} style={{
                padding: "7px 14px", borderRadius: 999, border: `1px solid ${C.border}`,
                background: "transparent", color: C.plum, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", fontWeight: 500,
              }}>
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{ display: "flex", gap: 10, paddingTop: 14, borderTop: `1px solid ${C.borderLight}` }}>
          <input
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }}
            placeholder="Ask me anything about your community…"
            disabled={chatLoading}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.9rem",
              color: C.ink,
              background: chatLoading ? "#f9f9f9" : "#fff",
              outline: "none",
            }}
          />
          <button onClick={sendChatMessage} disabled={chatLoading || !chatInput.trim()} style={{
            padding: "12px 22px",
            borderRadius: 12,
            border: "none",
            cursor: chatLoading || !chatInput.trim() ? "not-allowed" : "pointer",
            background: chatLoading || !chatInput.trim() ? C.borderLight : C.plum,
            color: chatLoading || !chatInput.trim() ? C.text3 : "#fff",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.88rem",
            fontWeight: 500,
            transition: "all 0.15s",
          }}>
            Send
          </button>
        </div>
      </div>
    );
  }

  // Shared input style
  const inputS: React.CSSProperties = {
    padding: "8px 12px",
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "0.85rem",
    color: C.ink,
    background: "#fff",
    outline: "none",
    minWidth: 160,
  };

  // -----------------------------------------------------------------------
  // Main render
  // -----------------------------------------------------------------------

  return (
    <div>
      {error && (
        <div style={{
          background: C.redBg, border: `1px solid #F5D0D0`, borderRadius: 8, padding: "10px 16px",
          marginBottom: 16, color: C.red, fontSize: "0.85rem", fontFamily: "'DM Sans', sans-serif",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span>{error}</span>
          <button onClick={() => setError("")} style={{ background: "none", border: "none", cursor: "pointer", color: C.red, fontSize: "1rem" }}>x</button>
        </div>
      )}

      {loading && (
        <div style={{ color: C.text3, fontSize: "0.85rem", marginBottom: 16, fontFamily: "'DM Sans', sans-serif" }}>
          Loading...
        </div>
      )}

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, flexWrap: "wrap", borderBottom: `1px solid ${C.borderLight}`, paddingBottom: 12 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", fontWeight: 500,
            background: tab === t.key ? (t.alert ? C.red : C.plum) : "transparent",
            color: tab === t.key ? "#fff" : (t.alert ? C.red : C.text2),
            transition: "all 0.15s ease",
          }}>
            {t.label}
            {t.count !== undefined && (
              <span style={{
                marginLeft: 6, fontSize: "0.75rem", opacity: 0.8,
                background: tab === t.key ? "rgba(255,255,255,0.2)" : (t.alert ? C.redBg : C.borderLight),
                color: tab === t.key ? "#fff" : (t.alert ? C.red : C.text3),
                padding: "1px 7px", borderRadius: 999,
              }}>
                {t.count}
              </span>
            )}
          </button>
        ))}

        <button onClick={fetchData} style={{
          marginLeft: "auto", padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.border}`,
          cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", fontWeight: 500,
          background: "transparent", color: C.text2,
        }}>
          Refresh
        </button>
      </div>

      {tab === "expert" && renderExpert()}
      {tab === "dashboard" && renderDashboard()}
      {tab === "activity" && renderActivity()}
      {tab === "flags" && renderFlags()}
      {tab === "signups" && renderSignups()}
      {tab === "applications" && renderApplications()}
      {tab === "users" && renderUsers()}
      {tab === "posts" && renderPosts()}
      {tab === "rooms" && renderRooms()}
      {tab === "moderators" && renderModerators()}
    </div>
  );
}
