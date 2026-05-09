"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function AppHeader() {
  const { data: session } = useSession();

  return (
    <header
      style={{
        position: "sticky", top: 0, zIndex: 30,
        padding: "14px 20px",
        background: "rgba(247,243,238,0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--color-border-warm, #DDD7CE)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}
    >
      <Link
        href="/"
        style={{
          fontFamily: "var(--font-heading, 'Cormorant Garamond', serif)",
          fontSize: 22, fontWeight: 400, color: "var(--color-dusty-plum, #6E5A7E)",
          textDecoration: "none", letterSpacing: 0.5,
        }}
      >
        periwink
      </Link>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {session ? (
          <>
            <span style={{
              fontSize: 13, color: "var(--color-text-2, #6B6575)",
              fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
              maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {session.user?.name || session.user?.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              style={{
                background: "none",
                border: "1px solid var(--color-border-warm, #DDD7CE)",
                borderRadius: 999, padding: "7px 18px", fontSize: 13,
                color: "var(--color-text-2, #6B6575)", cursor: "pointer",
                fontFamily: "var(--font-body, 'DM Sans', sans-serif)", fontWeight: 400,
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link
              href="/auth/signin"
              style={{
                background: "none",
                border: "1px solid var(--color-border-warm, #DDD7CE)",
                borderRadius: 999, padding: "7px 18px", fontSize: 13,
                color: "var(--color-text-2, #6B6575)",
                fontFamily: "var(--font-body, 'DM Sans', sans-serif)", fontWeight: 400,
                textDecoration: "none",
              }}
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              style={{
                background: "var(--color-dusty-plum, #6E5A7E)", color: "#fff",
                border: "none", borderRadius: 999, padding: "7px 18px",
                fontSize: 13,
                fontFamily: "var(--font-body, 'DM Sans', sans-serif)", fontWeight: 400,
                textDecoration: "none",
              }}
            >
              Join
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
