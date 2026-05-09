"use client";

import { useState } from "react";
import Link from "next/link";

const c = {
  plum: "#6E5A7E",
  plumLight: "#B7A8C9",
  plumMist: "#E8E1F0",
  plumWhisper: "#F5F2F9",
  lavender: "#8C92FF",
  ivory: "#F7F3EE",
  card: "#FDFBF8",
  ink: "#2B2433",
  inkSoft: "#6B6575",
  inkMuted: "#9B94A3",
  border: "#DDD7CE",
  rose: "#C99AA5",
  sage: "#7CB07F",
};

function ApplyForm() {
  const offerings = [
    "Midlife Group — 6-Week Virtual Program (Thursdays 4:30–6 PM EST)",
    "Retreat (notify me when available)",
    "One-on-one with Dr. Tubero",
    "Other / not sure yet",
  ];

  const [form, setForm] = useState({ name: "", email: "", interest: "", message: "" });
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [focused, setFocused] = useState<string | null>(null);

  const inputStyle = (field: string) => ({
    width: "100%",
    padding: "12px 14px",
    border: `1px solid ${focused === field ? c.plum : c.border}`,
    borderRadius: 10,
    fontSize: 15,
    outline: "none",
    background: c.ivory,
    color: c.ink,
    fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
    transition: "border-color 0.15s",
    boxSizing: "border-box" as const,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch("/api/groups/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setState(res.ok ? "success" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%", background: "rgba(124,176,127,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, margin: "0 auto 20px",
        }}>
          ✓
        </div>
        <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 300, color: c.ink, marginBottom: 12 }}>
          Application received.
        </h3>
        <p style={{ fontSize: 15, color: c.inkSoft, lineHeight: 1.7, maxWidth: 360, margin: "0 auto" }}>
          Dr. Tubero will be in touch within a few days. Check your email for a confirmation.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <label style={{ display: "block", fontSize: 13, color: c.inkSoft, marginBottom: 6 }}>
          Your name <span style={{ color: c.rose }}>*</span>
        </label>
        <input
          required
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          onFocus={() => setFocused("name")}
          onBlur={() => setFocused(null)}
          placeholder="How you'd like to be addressed"
          style={inputStyle("name")}
        />
      </div>

      <div>
        <label style={{ display: "block", fontSize: 13, color: c.inkSoft, marginBottom: 6 }}>
          Email <span style={{ color: c.rose }}>*</span>
        </label>
        <input
          required
          type="email"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          onFocus={() => setFocused("email")}
          onBlur={() => setFocused(null)}
          placeholder="you@example.com"
          style={inputStyle("email")}
        />
      </div>

      <div>
        <label style={{ display: "block", fontSize: 13, color: c.inkSoft, marginBottom: 6 }}>
          I'm interested in <span style={{ color: c.rose }}>*</span>
        </label>
        <select
          required
          value={form.interest}
          onChange={e => setForm({ ...form, interest: e.target.value })}
          onFocus={() => setFocused("interest")}
          onBlur={() => setFocused(null)}
          style={{ ...inputStyle("interest"), appearance: "none" as const }}
        >
          <option value="">Select an offering...</option>
          {offerings.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      <div>
        <label style={{ display: "block", fontSize: 13, color: c.inkSoft, marginBottom: 6 }}>
          A little about yourself{" "}
          <span style={{ color: c.inkMuted, fontWeight: 300 }}>(optional)</span>
        </label>
        <textarea
          value={form.message}
          onChange={e => setForm({ ...form, message: e.target.value })}
          onFocus={() => setFocused("message")}
          onBlur={() => setFocused(null)}
          placeholder="What brings you here? What are you hoping for?"
          rows={4}
          style={{
            ...inputStyle("message"),
            resize: "vertical",
            minHeight: 96,
          }}
        />
      </div>

      {state === "error" && (
        <p style={{ fontSize: 13, color: c.rose }}>Something went wrong — please try again.</p>
      )}

      <button
        type="submit"
        disabled={state === "loading"}
        style={{
          padding: "14px",
          background: state === "loading" ? c.border : c.plum,
          color: state === "loading" ? c.inkMuted : "#fff",
          border: "none", borderRadius: 12, fontSize: 15,
          fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
          cursor: state === "loading" ? "not-allowed" : "pointer",
          marginTop: 4,
        }}
      >
        {state === "loading" ? "Sending…" : "Submit application"}
      </button>
    </form>
  );
}

type Tab = "groups" | "retreats" | "workshops" | "one-to-one";

const TAB_LABELS: { id: Tab; label: string }[] = [
  { id: "groups", label: "Groups" },
  { id: "retreats", label: "Retreats" },
  { id: "workshops", label: "Workshops" },
  { id: "one-to-one", label: "One-to-One" },
];

function EmptyState({ title }: { title: string }) {
  return (
    <div style={{
      background: c.card, border: `1px solid ${c.border}`,
      borderRadius: 20, padding: "64px 32px",
      textAlign: "center",
    }}>
      <h2 style={{
        fontFamily: "var(--font-heading, 'Cormorant Garamond', serif)",
        fontSize: 26, fontWeight: 300, color: c.ink, marginBottom: 12,
      }}>
        {title}
      </h2>
      <p style={{ fontSize: 15, color: c.inkMuted, lineHeight: 1.75 }}>
        Nothing scheduled at this time. Please check back soon.
      </p>
    </div>
  );
}

function OneToOneSection() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Main card */}
      <div style={{
        background: c.card, border: `1px solid ${c.border}`,
        borderRadius: 20, padding: "40px 36px",
      }}>
        {/* Photo + name */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
          <img
            src="/adrian-tubero.jpg"
            alt="Dr. Adrian Tubero"
            style={{
              width: 80, height: 80, borderRadius: "50%",
              objectFit: "cover",
              border: `2px solid ${c.plumMist}`,
              flexShrink: 0,
            }}
          />
          <div>
            <div style={{
              fontFamily: "var(--font-heading, 'Cormorant Garamond', serif)",
              fontSize: 20, fontWeight: 400, color: c.ink, marginBottom: 4,
            }}>
              Dr. Adrian Tubero, Psy.D.
            </div>
            <div style={{ fontSize: 13, color: c.plum, lineHeight: 1.5 }}>
              Clinical Psychologist · AEDP · CSRT · 22 years experience
            </div>
          </div>
        </div>

        <h2 style={{
          fontFamily: "var(--font-heading, 'Cormorant Garamond', serif)",
          fontSize: "clamp(22px, 4vw, 28px)", fontWeight: 300,
          color: c.ink, marginBottom: 20, lineHeight: 1.3,
        }}>
          One-to-One Work with Adrian
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
          <p style={{ fontSize: 15, color: c.inkSoft, lineHeight: 1.85 }}>
            Adrian is a clinical psychologist with over 20 years of experience helping people navigate emotional change, relationships, identity, and life transitions.
          </p>
          <p style={{ fontSize: 15, color: c.inkSoft, lineHeight: 1.85 }}>
            Her work is depth-oriented, relational, and emotionally attuned. She helps people slow down, make sense of what is shifting internally, and reconnect with clarity, self-trust, and a more grounded sense of direction.
          </p>
          <p style={{ fontSize: 15, color: c.inkSoft, lineHeight: 1.85 }}>
            For individual therapy or consultation inquiries, please visit Adrian&apos;s professional website.
          </p>
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a
            href="https://www.adriantubero.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              background: c.plum, color: "#fff",
              textDecoration: "none", borderRadius: 999,
              padding: "12px 28px", fontSize: 14,
              fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
            }}
          >
            Visit Adrian&apos;s website →
          </a>
          <Link
            href="/"
            style={{
              display: "inline-block",
              background: "transparent", color: c.plum,
              textDecoration: "none", borderRadius: 999,
              padding: "12px 28px", fontSize: 14,
              border: `1px solid ${c.plumMist}`,
              fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
            }}
          >
            Learn more about Adrian →
          </Link>
        </div>
      </div>

      {/* Reassurance note */}
      <div style={{
        background: `linear-gradient(135deg, ${c.plumWhisper}, ${c.ivory})`,
        border: `1px solid ${c.plumMist}`,
        borderRadius: 16, padding: "28px 32px",
        textAlign: "center",
      }}>
        <p style={{ fontSize: 14, color: c.inkMuted, lineHeight: 1.75 }}>
          The Periwink community is always free and open. Individual work with Adrian is an optional next step — not a requirement.
        </p>
      </div>
    </div>
  );
}

export default function GroupsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("groups");

  return (
    <div style={{ color: c.ink }}>

      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${c.plumWhisper}, ${c.ivory})`,
        borderRadius: 20,
        padding: "52px 36px",
        marginBottom: 32,
        textAlign: "center",
        border: `1px solid ${c.plumMist}`,
      }}>
        <h1 style={{
          fontFamily: "var(--font-heading, 'Cormorant Garamond', serif)",
          fontSize: "clamp(30px, 5.5vw, 44px)",
          fontWeight: 300,
          lineHeight: 1.2,
          color: c.ink,
          marginBottom: 16,
          maxWidth: 560,
          margin: "0 auto 16px",
        }}>
          Midlife changes more than your body.
        </h1>
        <p style={{ fontSize: 16, color: c.inkSoft, lineHeight: 1.75, maxWidth: 500, margin: "0 auto 24px" }}>
          A thoughtful space for women navigating identity, emotion, relationships, and change — together.
        </p>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(124,176,127,0.12)", border: "1px solid rgba(124,176,127,0.3)",
          borderRadius: 999, padding: "8px 16px", fontSize: 13, color: "#3d7a40",
        }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.sage, display: "inline-block" }} />
          The Periwink community is always free &amp; open — groups are entirely optional
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{
        display: "flex", gap: 8, marginBottom: 28,
        borderBottom: `1px solid ${c.border}`, paddingBottom: 0,
        overflowX: "auto",
      }}>
        {TAB_LABELS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "10px 18px", fontSize: 14,
              fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
              color: activeTab === id ? c.plum : c.inkMuted,
              borderBottom: activeTab === id ? `2px solid ${c.plum}` : "2px solid transparent",
              marginBottom: -1,
              fontWeight: activeTab === id ? 500 : 400,
              whiteSpace: "nowrap",
              transition: "color 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "retreats" && <EmptyState title="Retreats" />}
      {activeTab === "workshops" && <EmptyState title="Workshops" />}
      {activeTab === "one-to-one" && <OneToOneSection />}

      {activeTab === "groups" && <>

      {/* Intro: different from going through it alone */}
      <div style={{
        background: "#fff",
        border: `1px solid ${c.border}`,
        borderRadius: 20,
        padding: "36px 32px",
        marginBottom: 24,
      }}>
        <p style={{
          fontSize: 14,
          color: c.inkMuted,
          lineHeight: 1.85,
          maxWidth: 520,
          marginBottom: 28,
        }}>
          Many women arrive here feeling unlike themselves — emotionally overwhelmed, disconnected, invisible, restless, uncertain, or simply changed in ways they can&apos;t fully explain.
        </p>
        <h2 style={{
          fontFamily: "var(--font-heading, 'Cormorant Garamond', serif)",
          fontSize: "clamp(22px, 4vw, 30px)",
          fontWeight: 300,
          color: c.ink,
          marginBottom: 16,
        }}>
          This is different from going through it alone.
        </h2>
        <p style={{ fontSize: 15, color: c.inkSoft, lineHeight: 1.8, marginBottom: 20 }}>
          These groups are designed to offer something many women don&apos;t have access to during this phase:
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            "A space to speak honestly — without having to explain yourself first",
            "A way to understand what's happening more clearly",
            "The experience of moving through it alongside others who truly get it",
          ].map((point, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ color: c.plum, fontSize: 16, marginTop: 1, flexShrink: 0 }}>→</span>
              <p style={{ fontSize: 15, color: c.inkSoft, lineHeight: 1.7, margin: 0 }}>{point}</p>
            </div>
          ))}
        </div>
      </div>

      {/* What to expect */}
      <div style={{
        background: `linear-gradient(135deg, ${c.plumWhisper}, ${c.ivory})`,
        border: `1px solid ${c.plumMist}`,
        borderRadius: 20,
        padding: "32px",
        marginBottom: 24,
      }}>
        <h2 style={{
          fontFamily: "var(--font-heading, 'Cormorant Garamond', serif)",
          fontSize: 22,
          fontWeight: 300,
          color: c.ink,
          marginBottom: 20,
        }}>
          What to expect
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {[
            { icon: "🗣", text: "Guided conversations with structure and intention" },
            { icon: "🧠", text: "A clearer understanding of what's happening emotionally, relationally, and physically" },
            { icon: "👥", text: "A consistent group of women over several weeks" },
            { icon: "🌿", text: "A space that is thoughtful, grounded, and real" },
          ].map((item, i) => (
            <div key={i} style={{
              background: "#fff",
              borderRadius: 14,
              padding: "20px 18px",
              border: `1px solid ${c.plumMist}`,
            }}>
              <div style={{ fontSize: 22, marginBottom: 10 }}>{item.icon}</div>
              <p style={{ fontSize: 14, color: c.inkSoft, lineHeight: 1.65, margin: 0 }}>{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Group */}
      <div style={{
        background: c.card,
        border: `1px solid ${c.border}`,
        borderRadius: 20,
        overflow: "hidden",
        marginBottom: 24,
      }}>
        <div style={{
          background: `linear-gradient(135deg, ${c.plum}, #5A4668)`,
          padding: "28px 32px",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <span style={{
                fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.7)", display: "block", marginBottom: 8,
              }}>
                Now forming · Virtual
              </span>
              <h2 style={{
                fontFamily: "var(--font-heading, 'Cormorant Garamond', serif)",
                fontSize: 26, fontWeight: 400, color: "#fff", margin: 0,
              }}>
                Midlife Group for Women
              </h2>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 15, margin: "6px 0 0" }}>
                Perimenopause &amp; Menopause · 6 weeks
              </p>
            </div>
            <div style={{
              background: "rgba(255,255,255,0.15)",
              borderRadius: 12, padding: "10px 16px", textAlign: "center",
              backdropFilter: "blur(8px)",
            }}>
              <div style={{ fontSize: 18, fontWeight: 500, color: "#fff" }}>$80–90</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>per session</div>
            </div>
          </div>
        </div>

        <div style={{ padding: "28px 32px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 24 }}>
            {[
              { icon: "📅", label: "Schedule", value: "Thursdays, 4:30–6 PM EST" },
              { icon: "🗓", label: "Duration", value: "6 weeks" },
              { icon: "💻", label: "Format", value: "Virtual (Zoom)" },
              { icon: "👥", label: "Size", value: "Small, intimate group" },
            ].map(item => (
              <div key={item.label} style={{
                background: c.ivory, borderRadius: 12, padding: "14px 16px",
                border: `1px solid ${c.border}`,
              }}>
                <div style={{ fontSize: 18, marginBottom: 6 }}>{item.icon}</div>
                <div style={{ fontSize: 11, color: c.inkMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 14, color: c.ink, fontWeight: 400 }}>{item.value}</div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 15, color: c.inkSoft, lineHeight: 1.8, marginBottom: 16 }}>
            A small, closed group for women navigating perimenopause and menopause together. Facilitated by Dr. Tubero using AEDP and relational trauma-informed approaches — this is not just psychoeducation. It's real, experiential work with women who truly get it.
          </p>
          <p style={{ fontSize: 15, color: c.inkSoft, lineHeight: 1.8 }}>
            Sessions move gently but meaningfully — from symptom to self, from isolation to recognition. Many women find that something shifts in the first session simply from being in a room where nobody needs an explanation.
          </p>

          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            marginTop: 24, padding: "16px 20px",
            background: c.plumWhisper, borderRadius: 12,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: `linear-gradient(135deg, ${c.plumLight}, ${c.rose})`,
              flexShrink: 0,
            }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: c.ink }}>Dr. Adrian Tubero, Psy.D.</div>
              <div style={{ fontSize: 13, color: c.plum }}>Clinical Psychologist · AEDP · CSRT · 22 years experience</div>
            </div>
          </div>
        </div>
      </div>

      {/* Application form */}
      <div id="apply" style={{
        background: c.card, border: `1px solid ${c.border}`,
        borderRadius: 20, padding: "36px 32px", marginBottom: 32,
      }}>
        <h2 style={{
          fontFamily: "var(--font-heading, 'Cormorant Garamond', serif)",
          fontSize: 26, fontWeight: 300, color: c.ink, marginBottom: 8,
        }}>
          Join an upcoming group
        </h2>
        <p style={{ fontSize: 15, color: c.inkSoft, lineHeight: 1.7, marginBottom: 28 }}>
          Tell us a little about yourself and which offering interests you. Dr. Tubero will follow up personally.
        </p>
        <ApplyForm />
      </div>

      {/* Community reassurance */}
      <div style={{
        background: `linear-gradient(160deg, ${c.plumWhisper} 0%, #fff 50%, ${c.ivory} 100%)`,
        border: `1px solid ${c.plumMist}`,
        borderRadius: 20, padding: "56px 40px",
        textAlign: "center",
      }}>
        <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(20px, 4vw, 26px)", fontWeight: 300, color: c.ink, marginBottom: 12 }}>
          You don&apos;t have to figure this out alone.
        </h3>
        <p style={{ fontSize: 15, color: c.inkSoft, lineHeight: 1.75, marginBottom: 8, maxWidth: 480, margin: "0 auto 8px" }}>
          There is a way forward — and it&apos;s better shared.
        </p>
        <p style={{ fontSize: 14, color: c.inkMuted, lineHeight: 1.7, marginBottom: 24, maxWidth: 440, margin: "0 auto 24px" }}>
          The Periwink community is always free and open. Groups are an optional next step — not a requirement.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/auth/signup"
            style={{
              display: "inline-block",
              background: c.plum, color: "#fff",
              textDecoration: "none", borderRadius: 10,
              padding: "12px 24px", fontSize: 14, fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
            }}
          >
            Join the Conversation →
          </Link>
          <a
            href="#apply"
            style={{
              display: "inline-block",
              background: "transparent", color: c.plum,
              textDecoration: "none", borderRadius: 10,
              padding: "12px 24px", fontSize: 14,
              border: `1px solid ${c.plumMist}`,
              fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
            }}
          >
            Stay in the loop
          </a>
        </div>
      </div>

      </>}

    </div>
  );
}
