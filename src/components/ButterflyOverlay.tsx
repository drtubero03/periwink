"use client";

import { useState, useEffect } from "react";

export function ButterflyVideoOverlay({
  active,
  onDismiss,
  title = "Welcome to Periwink",
  subtitle = "You are exactly where you need to be.",
}: {
  active: boolean;
  onDismiss: () => void;
  title?: string;
  subtitle?: string;
}) {
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setShowText(true), 600);
    const auto = setTimeout(onDismiss, 7000);
    return () => { clearTimeout(t); clearTimeout(auto); };
  }, [active, onDismiss]);

  if (!active) return null;

  return (
    <>
      <style>{`
        @keyframes bv-fadein { from { opacity: 0; } to { opacity: 1; } }
        @keyframes bv-textrise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <div
        onClick={onDismiss}
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "#000",
          cursor: "pointer",
          animation: "bv-fadein 0.5s ease forwards",
        }}
      >
        <video
          autoPlay muted playsInline
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        >
          <source src="/butterfly-thankyou.mp4" type="video/mp4" />
        </video>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          zIndex: 1,
        }}>
          {showText && (
            <>
              <h2 style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 300,
                color: "#fff", textAlign: "center",
                textShadow: "0 2px 20px rgba(0,0,0,0.4)",
                marginBottom: 12,
                animation: "bv-textrise 1s ease forwards",
              }}>
                {title}
              </h2>
              <p style={{
                fontSize: "clamp(16px, 2.5vw, 22px)",
                color: "rgba(255,255,255,0.9)",
                textAlign: "center",
                textShadow: "0 1px 10px rgba(0,0,0,0.3)",
                animation: "bv-textrise 1s ease 0.3s both",
              }}>
                {subtitle}
              </p>
              <p style={{
                fontSize: 12, color: "rgba(255,255,255,0.4)",
                marginTop: 40,
                animation: "bv-textrise 1s ease 1s both",
              }}>
                tap anywhere to continue
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
