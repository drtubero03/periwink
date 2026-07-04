"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ButterflyVideoOverlay } from "@/components/ButterflyOverlay";

function inputStyle(focused: boolean) {
  return {
    width: "100%", padding: "12px 14px",
    border: `1px solid ${focused ? "var(--color-dusty-plum, #6E5A7E)" : "var(--color-border-warm, #DDD7CE)"}`,
    borderRadius: 10, fontSize: 15, outline: "none",
    background: "var(--color-warm-ivory, #F7F3EE)",
    color: "var(--color-ink, #2B2433)",
    fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
    transition: "border-color 0.15s",
    boxSizing: "border-box" as const,
  };
}

// Botanical sprig from the Periwink logo, scaled for use as an icon
function BotanicalSprig({ size = 64 }: { size?: number }) {
  const scale = size / 60;
  return (
    <svg
      width={size}
      height={size * 0.6}
      viewBox="0 0 120 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", margin: "0 auto" }}
    >
      <path d="M 42 34 C 46 26 54 20 60 18 C 66 16 72 18 74 24 C 76 28 73 33 68 33 C 64 33 61 30 63 26"
        stroke="#8B7AA8" strokeWidth="1.1" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.75"/>
      <path d="M 46 28 C 40 22 34 20 31 22"
        stroke="#8B7AA8" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.65"/>
      <path d="M 70 20 C 76 14 82 13 84 16"
        stroke="#8B7AA8" strokeWidth="0.85" fill="none" strokeLinecap="round" opacity="0.6"/>
      <path d="M 31 22 C 28 18 29 14 32 15 C 35 16 34 20 31 22 Z" fill="#8B7AA8" opacity="0.5"/>
      <path d="M 50 24 C 47 19 49 15 52 16 C 55 17 53 22 50 24 Z" fill="#8B7AA8" opacity="0.42"/>
      <path d="M 84 16 C 82 12 85 10 87 12 C 89 14 86 17 84 16 Z" fill="#8B7AA8" opacity="0.45"/>
      <path d="M 63 26 C 60 21 62 17 65 18 C 68 19 66 24 63 26 Z" fill="#8B7AA8" opacity="0.4"/>
      <circle cx="58" cy="17" r="1.2" fill="#8B7AA8" opacity="0.32"/>
      <circle cx="78" cy="21" r="1" fill="#8B7AA8" opacity="0.28"/>
      <circle cx="37" cy="19" r="0.9" fill="#8B7AA8" opacity="0.28"/>
    </svg>
  );
}

function VerificationScreen({ email }: { email: string }) {
  const [showOverlay, setShowOverlay] = useState(true);

  return (
    <>
      <ButterflyVideoOverlay active={showOverlay} onDismiss={() => setShowOverlay(false)} />

      {/* Sprig sits directly below the layout wordmark, above the card */}
      <div style={{ textAlign: "center", marginBottom: 20, marginTop: -26 }}>
        <BotanicalSprig size={64} />
      </div>

      <div style={{
        background: "var(--color-card, #FDFBF8)",
        border: "1px solid var(--color-border-warm, #DDD7CE)",
        borderRadius: 20, padding: "40px 32px",
        textAlign: "center",
      }}>
        {/* Heading */}
        <h1 style={{
          fontFamily: "var(--font-heading, 'Cormorant Garamond', serif)",
          fontSize: 26, fontWeight: 300, color: "var(--color-ink, #2B2433)",
          marginBottom: 10, lineHeight: 1.3,
        }}>
          Welcome to Periwink
        </h1>

        {/* Warm subtext */}
        <p style={{
          fontSize: 15, color: "var(--color-text-2, #6B6575)",
          lineHeight: 1.7, marginBottom: 24,
        }}>
          We&apos;re so glad you joined our community.
        </p>

        {/* Divider */}
        <div style={{
          width: 40, height: 1,
          background: "var(--color-border-warm, #DDD7CE)",
          margin: "0 auto 24px",
        }} />

        {/* Email instruction */}
        <p style={{
          fontSize: 14, color: "var(--color-text-2, #6B6575)",
          lineHeight: 1.7, marginBottom: 6,
        }}>
          Please check your email. We sent a verification link to:
        </p>
        <p style={{
          fontSize: 15, color: "var(--color-dusty-plum, #6E5A7E)",
          fontWeight: 500, marginBottom: 20,
          wordBreak: "break-word",
        }}>
          {email}
        </p>

        <p style={{
          fontSize: 14, color: "var(--color-text-2, #6B6575)",
          lineHeight: 1.7, marginBottom: 6,
        }}>
          Click the link in the email to verify your account and sign in.
        </p>
        <p style={{
          fontSize: 13, color: "var(--color-text-3, #9B94A3)",
          marginBottom: 28, lineHeight: 1.6,
        }}>
          This link expires in 24 hours.
        </p>

        <ResendButton email={email} />
      </div>
    </>
  );
}

function SignUpForm() {
  const searchParams = useSearchParams();

  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [displayName, setDisplayName] = useState(searchParams.get("name") || "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const passwordMismatch = confirm.length > 0 && password !== confirm;
  const canSubmit = email && displayName && password.length >= 8 && password === confirm;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        password,
        displayName: displayName.trim(),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return <VerificationScreen email={email} />;
  }

  return (
    <div style={{
      background: "var(--color-card, #FDFBF8)",
      border: "1px solid var(--color-border-warm, #DDD7CE)",
      borderRadius: 20, padding: "36px 32px",
    }}>
      <h1 style={{
        fontFamily: "var(--font-heading, 'Cormorant Garamond', serif)",
        fontSize: 24, fontWeight: 300, color: "var(--color-ink, #2B2433)",
        marginBottom: 6, textAlign: "center",
      }}>
        Join Periwink
      </h1>
      <p style={{
        fontSize: 14, color: "var(--color-text-3, #9B94A3)",
        textAlign: "center", marginBottom: 28,
      }}>
        Your community for perimenopause &amp; menopause
      </p>

      {error && (
        <div style={{
          background: "rgba(201,154,165,0.12)",
          border: "1px solid var(--color-muted-rose, #C99AA5)",
          borderRadius: 10, padding: "12px 16px",
          fontSize: 14, color: "var(--color-text-2, #6B6575)",
          marginBottom: 20,
        }}>
          {error === "An account with this email already exists" ? (
            <>
              An account with this email already exists.{" "}
              <Link href={`/auth/signin?email=${encodeURIComponent(email)}`} style={{ color: "var(--color-dusty-plum, #6E5A7E)" }}>
                Sign in instead
              </Link>
            </>
          ) : error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={{
            display: "block", fontSize: 13, color: "var(--color-text-2, #6B6575)",
            marginBottom: 6, fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
          }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setFocused("email")}
            onBlur={() => setFocused(null)}
            autoComplete="email"
            required
            style={inputStyle(focused === "email")}
          />
        </div>

        <div>
          <label style={{
            display: "block", fontSize: 13, color: "var(--color-text-2, #6B6575)",
            marginBottom: 6, fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
          }}>
            Your pseudonym{" "}
            <span style={{ color: "var(--color-text-3, #9B94A3)", fontWeight: 300 }}>
              (how you&apos;ll appear in the community)
            </span>
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            onFocus={() => setFocused("displayName")}
            onBlur={() => setFocused(null)}
            placeholder="e.g. MoonlitSage, WinterBloom…"
            autoComplete="username"
            required
            style={inputStyle(focused === "displayName")}
          />
        </div>

        <div>
          <label style={{
            display: "block", fontSize: 13, color: "var(--color-text-2, #6B6575)",
            marginBottom: 6, fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
          }}>
            Password{" "}
            <span style={{ color: "var(--color-text-3, #9B94A3)", fontWeight: 300 }}>
              (8+ characters)
            </span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setFocused("password")}
            onBlur={() => setFocused(null)}
            autoComplete="new-password"
            required
            minLength={8}
            style={inputStyle(focused === "password")}
          />
        </div>

        <div>
          <label style={{
            display: "block", fontSize: 13, color: "var(--color-text-2, #6B6575)",
            marginBottom: 6, fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
          }}>
            Confirm password
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onFocus={() => setFocused("confirm")}
            onBlur={() => setFocused(null)}
            autoComplete="new-password"
            required
            style={{
              ...inputStyle(focused === "confirm"),
              borderColor: passwordMismatch
                ? "var(--color-muted-rose, #C99AA5)"
                : focused === "confirm"
                ? "var(--color-dusty-plum, #6E5A7E)"
                : "var(--color-border-warm, #DDD7CE)",
            }}
          />
          {passwordMismatch && (
            <p style={{ fontSize: 12, color: "var(--color-muted-rose, #C99AA5)", marginTop: 4 }}>
              Passwords don&apos;t match
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !canSubmit}
          style={{
            width: "100%", padding: "13px",
            background: loading || !canSubmit
              ? "var(--color-border-warm, #DDD7CE)"
              : "var(--color-dusty-plum, #6E5A7E)",
            color: loading || !canSubmit ? "var(--color-text-3, #9B94A3)" : "#fff",
            border: "none", borderRadius: 12, fontSize: 15,
            fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
            cursor: loading || !canSubmit ? "not-allowed" : "pointer",
            marginTop: 6,
          }}
        >
          {loading ? "Creating your account…" : "Create account"}
        </button>
      </form>

      <p style={{
        fontSize: 12, color: "var(--color-text-3, #9B94A3)",
        textAlign: "center", marginTop: 20, lineHeight: 1.6,
      }}>
        By joining, you agree to our privacy-first principles — your identity is always yours to control.
      </p>

      <p style={{
        fontSize: 13, color: "var(--color-text-3, #9B94A3)",
        textAlign: "center", marginTop: 16,
      }}>
        Already have an account?{" "}
        <Link href="/auth/signin" style={{ color: "var(--color-dusty-plum, #6E5A7E)", textDecoration: "none" }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}

function ResendButton({ email }: { email: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  async function handleResend() {
    setState("sending");
    await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setState("sent");
  }

  if (state === "sent") {
    return (
      <p style={{ fontSize: 14, color: "var(--color-text-3, #9B94A3)" }}>
        A new link has been sent.
      </p>
    );
  }

  return (
    <button
      onClick={handleResend}
      disabled={state === "sending"}
      style={{
        background: "none", border: "none", cursor: "pointer",
        fontSize: 13, color: "var(--color-dusty-plum, #6E5A7E)",
        textDecoration: "underline", padding: 0,
      }}
    >
      {state === "sending" ? "Sending…" : "Resend verification email"}
    </button>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpForm />
    </Suspense>
  );
}
