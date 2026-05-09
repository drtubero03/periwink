"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";

const messages: Record<string, { heading: string; body: string }> = {
  "share a post": {
    heading: "Your voice matters here",
    body: "Read and explore the conversations freely. Create an account to contribute, connect, and participate in the community.",
  },
  react: {
    heading: "Your support matters",
    body: "Join Periwink to show support with reactions — hearts, hugs, and 'me too' moments that let others know they're not alone.",
  },
  "sign in": {
    heading: "Welcome back",
    body: "Sign in to participate in the conversations, share your experiences, and connect with the community.",
  },
  join: {
    heading: "Join the community",
    body: "Explore the conversations freely. Create an account to contribute, connect, and participate.",
  },
  "follow this room": {
    heading: "Follow this conversation",
    body: "Join Periwink to follow the rooms that matter most and stay connected to the conversations you care about.",
  },
  "follow this conversation": {
    heading: "Follow this conversation",
    body: "Join Periwink to follow the rooms that matter most and stay connected to the conversations you care about.",
  },
  "edit your profile": {
    heading: "Your profile is yours",
    body: "Join Periwink to choose a pseudonym, write your bio, and make this space your own — on your terms.",
  },
  "save your check-in": {
    heading: "Track what matters to you",
    body: "Join Periwink to log your symptoms, track patterns over time, and contribute to community insights.",
  },
  "share your thoughts": {
    heading: "Your voice matters here",
    body: "Explore the conversations freely. Join Periwink to share your experiences, reflections, and insights with the community.",
  },
  default: {
    heading: "Join the community",
    body: "Explore the conversations freely. Create an account to contribute, connect, and be part of this community.",
  },
};

function getMsg(action: string) {
  return messages[action] || messages.default;
}

export default function GrowingMessage({
  isOpen,
  onClose,
  action = "default",
}: {
  isOpen: boolean;
  onClose: () => void;
  action?: string;
}) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const msg = getMsg(action);

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        background: "rgba(43,36,51,0.35)", backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        style={{
          background: "var(--color-card, #FDFBF8)", borderRadius: 24,
          maxWidth: 400, width: "100%", padding: "44px 36px",
          textAlign: "center",
          border: "1px solid var(--color-border-warm, #DDD7CE)",
          boxShadow: "0 20px 60px rgba(43,36,51,0.12)",
          animation: "fadeUp 0.3s ease-out",
        }}
      >
        <div style={{
          width: 48, height: 48, borderRadius: "50%", margin: "0 auto 20px",
          background: "var(--color-soft-mist, #E8E3EA)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20,
        }}>
          🌱
        </div>
        <h3 style={{
          fontFamily: "var(--font-heading, 'Cormorant Garamond', serif)",
          fontSize: 24, fontWeight: 400, marginBottom: 12,
          color: "var(--color-ink, #2B2433)",
        }}>
          {msg.heading}
        </h3>
        <p style={{
          fontSize: 15, lineHeight: 1.7, marginBottom: 20,
          color: "var(--color-text-2, #6B6575)",
        }}>
          {msg.body}
        </p>
        <p style={{
          fontSize: 13, fontStyle: "italic", marginBottom: 28,
          color: "var(--color-text-3, #9B94A3)", opacity: 0.75,
        }}>
          You are not early. You are exactly on time.
        </p>
        <Link
          href="/auth/signup"
          style={{
            display: "inline-block",
            background: "var(--color-dusty-plum, #6E5A7E)", color: "#fff",
            textDecoration: "none", borderRadius: 999, padding: "12px 32px",
            fontSize: 14, fontWeight: 400,
            fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
          }}
        >
          Join Periwink
        </Link>
      </div>
    </div>
  );
}

export function LockedButton({
  children,
  action,
  className,
  style,
}: {
  children: ReactNode;
  action: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className={className} style={style}>
        {children}
      </button>
      <GrowingMessage isOpen={open} onClose={() => setOpen(false)} action={action} />
    </>
  );
}
