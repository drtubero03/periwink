"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ButterflyVideoOverlay } from "./ButterflyOverlay";

// — Design Tokens —
const c = {
  periwinkle: "#8B7AA8",
  periwinkleDeep: "#6E5A7E",
  periwinkleSoft: "#A799BE",
  periwinkleLight: "#C4B8D6",
  periwinkleMist: "#E8E1F0",
  periwinkleWhisper: "#F5F2F9",
  lavenderBlush: "#F8F4FC",
  cream: "#FFFCF9",
  warmWhite: "#FEFDFB",
  blush: "#F2E4E6",
  roseSoft: "#E8C4C4",
  sageSoft: "#D4DED0",
  ink: "#2D2438",
  inkSoft: "#5C4E6A",
  inkMuted: "#8B7D98",
};

// — SVG Illustrations —
function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Large organic background shapes */}
      <circle cx="300" cy="300" r="200" fill={c.periwinkleMist} opacity="0.12" />
      <circle cx="340" cy="260" r="150" fill={c.periwinkleWhisper} opacity="0.2" />
      {/* Periwinkle flower - stylized */}
      <g transform="translate(300,280)">
        {[0, 72, 144, 216, 288].map((angle, i) => (
          <ellipse
            key={i}
            cx="0"
            cy="-60"
            rx="28"
            ry="55"
            fill={c.periwinkleLight}
            opacity={0.25 + i * 0.03}
            transform={`rotate(${angle})`}
          />
        ))}
        <circle cx="0" cy="0" r="15" fill={c.periwinkleSoft} opacity="0.4" />
        <circle cx="0" cy="0" r="8" fill={c.periwinkle} opacity="0.3" />
      </g>
      {/* Flowing lines */}
      <path d="M100 400 Q200 350 300 380 Q400 410 500 360" stroke={c.periwinkleLight} strokeWidth="1.5" fill="none" opacity="0.3" />
      <path d="M80 430 Q180 380 280 410 Q380 440 480 390" stroke={c.periwinkleMist} strokeWidth="1" fill="none" opacity="0.25" />
      {/* Scattered elements */}
      <circle cx="150" cy="180" r="4" fill={c.roseSoft} opacity="0.3" />
      <circle cx="450" cy="200" r="3" fill={c.roseSoft} opacity="0.25" />
      <circle cx="200" cy="450" r="3.5" fill={c.periwinkleSoft} opacity="0.2" />
      <circle cx="420" cy="420" r="2.5" fill={c.sageSoft} opacity="0.3" />
    </svg>
  );
}

// — Scroll Reveal Hook —
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// — Modal —
function Modal({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(45, 36, 56, 0.6)", backdropFilter: "blur(8px)", animation: "fadeIn 0.2s ease" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto relative"
        style={{ animation: "fadeInUp 0.3s ease-out" }}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center text-xl transition-colors cursor-pointer"
          style={{ background: c.periwinkleWhisper, color: c.inkMuted }}
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

// — Input Component —
function FormInput({
  label,
  required,
  ...props
}: { label: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium mb-2">
        {label} {required && <span style={{ color: c.periwinkle }}>*</span>}
      </label>
      <input
        required={required}
        className="w-full px-5 py-4 rounded-xl text-base transition-all"
        style={{ border: `1px solid ${c.periwinkleMist}`, outline: "none" }}
        {...props}
      />
    </div>
  );
}

function FormTextarea({
  label,
  required,
  hint,
  ...props
}: { label: string; required?: boolean; hint?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium mb-2">
        {label} {required && <span style={{ color: c.periwinkle }}>*</span>}
      </label>
      <textarea
        required={required}
        className="w-full px-5 py-4 rounded-xl text-base min-h-[100px] resize-y transition-all"
        style={{ border: `1px solid ${c.periwinkleMist}`, outline: "none" }}
        {...props}
      />
      {hint && <p className="text-sm mt-1.5" style={{ color: c.inkMuted }}>{hint}</p>}
    </div>
  );
}

// — Email Signup —
function EmailSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="py-20 px-6" style={{ background: "#fff" }}>
      <div className="max-w-xl mx-auto text-center">
        <Reveal>
          <h2 className="font-display text-3xl md:text-4xl mb-3">Stay connected</h2>
          <p className="text-base mb-8" style={{ color: c.inkSoft, lineHeight: 1.7 }}>
            Be the first to hear about new groups, conversations, and openings.
          </p>
          {status === "done" ? (
            <p className="text-base font-medium" style={{ color: c.periwinkleDeep }}>
              You&apos;re on the list. We&apos;ll be in touch.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-3 max-w-md mx-auto">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 px-5 py-3.5 rounded-full text-base"
                style={{
                  border: `1px solid ${c.periwinkleLight}`,
                  outline: "none",
                  background: c.lavenderBlush,
                  color: c.ink,
                }}
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="px-7 py-3.5 rounded-full text-sm font-medium transition-all hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                style={{ background: c.periwinkleDeep, color: "#fff" }}
              >
                {status === "loading" ? "..." : "Stay in the loop"}
              </button>
            </form>
          )}
          {status === "error" && (
            <p className="text-sm mt-3" style={{ color: "#991B1B" }}>Something went wrong — please try again.</p>
          )}
        </Reveal>
      </div>
    </section>
  );
}

// — Main Landing Page —
export default function LandingPage() {
  const [joinChoiceOpen, setJoinChoiceOpen] = useState(false);
  const [communityModalOpen, setCommunityModalOpen] = useState(false);
  const [foundingModalOpen, setFoundingModalOpen] = useState(false);
  const [foundingStep, setFoundingStep] = useState(1);
  const [successModal, setSuccessModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    signupUrl?: string;
  }>({ open: false, title: "", message: "" });
  const [isScrolled, setIsScrolled] = useState(false);
  const [formError, setFormError] = useState("");
  const [showJoinButterfly, setShowJoinButterfly] = useState(false);

  const openJoin = useCallback(() => setJoinChoiceOpen(true), []);

  // Community form
  const [communityForm, setCommunityForm] = useState({
    name: "",
    email: "",
    pseudonym: "",
  });

  // Founding form — matches API fields
  const [foundingForm, setFoundingForm] = useState({
    name: "",
    email: "",
    roleType: "",
    whatDrawsYou: "",
    whatYouOffer: "",
    currentApproach: "",
    holdingSpace: "",
    wantToBuild: "",
    organization: "",
    website: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleCommunitySubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);
    setShowJoinButterfly(true);
    try {
      const res = await fetch("/api/signup/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(communityForm),
      });
      const data = await res.json();
      if (res.ok) {
        const savedEmail = communityForm.email;
        setCommunityModalOpen(false);
        setCommunityForm({ name: "", email: "", pseudonym: "" });
        setSuccessModal({
          open: true,
          title: "You're in.",
          message: "Check your email for your welcome note. You can also set up your account right now to start exploring the community.",
          signupUrl: `/auth/signup?email=${encodeURIComponent(savedEmail)}`,
        });
      } else {
        setFormError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setFormError("Network error. Please check your connection and try again.");
    }
    setIsSubmitting(false);
  }, [communityForm]);

  const handleFoundingSubmit = useCallback(async () => {
    setFormError("");
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/signup/founding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(foundingForm),
      });
      const data = await res.json();
      if (res.ok) {
        setFoundingModalOpen(false);
        setFoundingStep(1);
        setFoundingForm({
          name: "", email: "", roleType: "",
          whatDrawsYou: "", whatYouOffer: "", currentApproach: "",
          holdingSpace: "", wantToBuild: "", organization: "", website: "",
        });
        setSuccessModal({
          open: true,
          title: "Application received.",
          message: "We'll review and be in touch within a few days. Thank you for wanting to build with us.",
        });
      } else {
        setFormError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setFormError("Network error. Please check your connection and try again.");
    }
    setIsSubmitting(false);
  }, [foundingForm]);

  const conversations = [
    { emoji: "🔥", slug: "hot-flashes", name: "Hot Flashes & Night Sweats", desc: "The sudden heat, the disrupted nights, the body doing things no one fully warned you about." },
    { emoji: "🌙", slug: "sleep", name: "Sleep & Fatigue", desc: "When rest becomes elusive and exhaustion runs deeper than sleep alone can explain." },
    { emoji: "💊", slug: "hrt", name: "HRT & Hormone Therapy", desc: "Navigating hormone therapy, options, research, and conversations with your doctor." },
    { emoji: "🌊", slug: "mood", name: "Mood & Emotional Health", desc: "The anxiety, the overwhelm, the feelings that seem outsized — and what they're really about." },
    { emoji: "🧠", slug: "brain-fog", name: "Brain Fog & Cognitive Changes", desc: "When your memory, focus, and mental clarity aren't behaving the way they used to." },
    { emoji: "🌿", slug: "supplements", name: "Supplements & Nutrition", desc: "What actually helps? Evidence-informed conversations about nourishment and support." },
    { emoji: "💜", slug: "relationships", name: "Relationships & Intimacy", desc: "How midlife reshapes connection — with partners, friends, and yourself." },
    { emoji: "🦋", slug: "body-changes", name: "Your Changing Body", desc: "A compassionate space for body image, weight, skin, and reconnecting with who you are now." },
    { emoji: "💼", slug: "work-life", name: "Work & Career", desc: "Ambition, burnout, reinvention, and professional identity in midlife." },
    { emoji: "✨", slug: "becoming", name: "Becoming & Identity", desc: "Conversations about identity, reinvention, meaning, emotional growth, and who you are becoming now.", featured: true },
  ];

  const features = [
    { icon: "💬", title: "Shared Circles", desc: "Intimate spaces for real conversations. Topics that matter, with women who truly understand." },
    { icon: "✨", title: "Collective Wisdom", desc: "Learn what actually works from women who've been there. Real insights from lived experience." },
    { icon: "📖", title: "Your Story, Tracked", desc: "Notice patterns in your experience. Understand your body better. Share on your terms." },
    { icon: "🤝", title: "Always Supported", desc: "Feeling understood isn't optional — it's essential. Every interaction helps you feel seen." },
    { icon: "🔒", title: "Truly Private", desc: "Your story is yours. Pseudonymous by default, with full control over what you share." },
    { icon: "🌱", title: "Always Growing", desc: "Periwink evolves with the community. Your voice shapes what we build next." },
  ];

  const roleOptions = [
    { value: "PRACTITIONER", label: "Healthcare Practitioner" },
    { value: "RESEARCHER", label: "Researcher" },
    { value: "CONTENT_CREATOR", label: "Content Creator" },
    { value: "COMMUNITY_BUILDER", label: "Community Builder" },
    { value: "BRAND_PARTNER", label: "Brand Partner" },
  ];

  return (
    <>
      <ButterflyVideoOverlay active={showJoinButterfly} onDismiss={() => setShowJoinButterfly(false)} />
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Outfit:wght@300;400;500;600&display=swap');

        body {
          font-family: 'Outfit', -apple-system, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        .font-display { font-family: 'Playfair Display', Georgia, serif; }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 0.15; }
          50% { transform: scale(1.05); opacity: 0.25; }
        }

        .animate-fade-in-up { animation: fadeInUp 0.8s ease-out forwards; }
        .animate-fade-in { animation: fadeIn 0.6s ease-out forwards; }
        .delay-1 { animation-delay: 0.1s; opacity: 0; }
        .delay-2 { animation-delay: 0.2s; opacity: 0; }
        .delay-3 { animation-delay: 0.3s; opacity: 0; }
        .delay-4 { animation-delay: 0.4s; opacity: 0; }
        .delay-5 { animation-delay: 0.5s; opacity: 0; }

        .highlight {
          background: linear-gradient(180deg, transparent 60%, rgba(196, 184, 214, 0.4) 60%);
          padding: 0 4px;
        }

        .hero-illustration {
          animation: breathe 6s ease-in-out infinite;
        }

        input:focus, textarea:focus {
          border-color: ${c.periwinkleSoft} !important;
          box-shadow: 0 0 0 3px rgba(139, 122, 168, 0.12) !important;
        }

        ::selection { background: rgba(196, 184, 214, 0.35); }
      `}</style>

      {/* Navigation */}
      <nav
        className="fixed top-0 left-0 right-0 z-40 transition-all duration-300"
        style={{
          padding: isScrolled ? "12px 0" : "20px 0",
          background: isScrolled ? "rgba(255, 252, 249, 0.95)" : "transparent",
          backdropFilter: isScrolled ? "blur(20px)" : "none",
          boxShadow: isScrolled ? "0 2px 30px rgba(110, 90, 126, 0.08)" : "none",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="font-display text-2xl cursor-pointer"
            style={{ color: c.periwinkleDeep, background: "none", border: "none", padding: 0, fontFamily: "inherit" }}
          >
            periwink
          </button>
          <div className="flex items-center gap-8">
            <a href="#about" className="hidden md:block text-sm hover:opacity-70 transition-opacity" style={{ color: c.inkSoft, textDecoration: "none" }}>
              Our Story
            </a>
            <a href="#conversations" className="hidden md:block text-sm hover:opacity-70 transition-opacity" style={{ color: c.inkSoft, textDecoration: "none" }}>
              Conversations
            </a>
            <a href="/app/groups" className="hidden md:block text-sm hover:opacity-70 transition-opacity" style={{ color: c.inkSoft, textDecoration: "none" }}>
              Groups &amp; Retreats
            </a>
            <button
              onClick={openJoin}
              className="px-6 py-3 rounded-full text-sm font-medium transition-all hover:-translate-y-0.5 cursor-pointer"
              style={{
                background: c.periwinkleDeep,
                color: "#fff",
                boxShadow: "0 4px 20px rgba(110, 90, 126, 0.3)",
              }}
            >
              Join the Community
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        className="min-h-screen flex items-center justify-center text-center px-6 pt-32 pb-20 relative overflow-hidden"
        style={{
          background: `linear-gradient(180deg, ${c.lavenderBlush} 0%, ${c.cream} 100%)`,
        }}
      >
        {/* Background video */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <video
            autoPlay muted loop playsInline
            className="w-full h-full object-cover"
            style={{ opacity: 0.55 }}
          >
            <source src="/hero-video.mp4" type="video/mp4" />
          </video>
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(180deg, ${c.lavenderBlush}99 0%, ${c.cream}CC 75%, ${c.cream} 100%)` }}
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none hero-illustration">
          <HeroIllustration className="w-full max-w-2xl h-auto opacity-30" />
        </div>

        <div className="max-w-3xl relative z-10">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full text-sm font-medium mb-8 animate-fade-in-up"
            style={{
              background: "rgba(255,255,255,0.9)",
              border: `1px solid ${c.periwinkleLight}`,
              color: c.periwinkleDeep,
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: "#7CB07F", animation: "pulse 2s ease-in-out infinite" }}
            />
            Building something meaningful
          </div>

          {/* Main Headline */}
          <h1
            className="font-display text-5xl md:text-6xl lg:text-7xl leading-tight mb-6 animate-fade-in-up delay-1"
            style={{ fontWeight: 400 }}
          >
            A wiser way forward —
            <em style={{ color: c.periwinkleDeep }}>together.</em>
          </h1>

          <p
            className="text-lg md:text-xl mb-4 animate-fade-in-up delay-2"
            style={{ color: c.inkSoft, maxWidth: "600px", margin: "0 auto", lineHeight: 1.7 }}
          >
            A space to understand what&apos;s changing, feel supported, and grow into what&apos;s next.
          </p>

          <p
            className="text-base mb-10 animate-fade-in-up delay-3"
            style={{ color: c.inkMuted, fontStyle: "italic" }}
          >
            More truth. Deeper alignment. More you.
          </p>

          {/* Primary CTA */}
          <div className="animate-fade-in-up delay-4 flex flex-col items-center gap-4">
            <button
              onClick={openJoin}
              className="px-10 py-4 rounded-full text-base font-medium transition-all hover:-translate-y-0.5 cursor-pointer"
              style={{
                background: c.periwinkleDeep,
                color: "#fff",
                boxShadow: "0 6px 28px rgba(110, 90, 126, 0.35)",
              }}
            >
              Join the Community
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 animate-fade-in delay-5">
          <span className="text-xs tracking-widest uppercase" style={{ color: c.inkMuted }}>
            Learn more
          </span>
          <div className="w-px h-10" style={{ background: `linear-gradient(${c.periwinkle}, transparent)` }} />
        </div>
      </section>

      {/* Clarity Section */}
      <section id="about" className="py-24 px-6" style={{ background: "#fff" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <Reveal>
              <div
                className="aspect-[4/3] rounded-3xl overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${c.periwinkleMist}, ${c.lavenderBlush}) center/cover, url('/hero-botanical.png') center/cover no-repeat`,
                }}
              />
            </Reveal>

            <Reveal delay={0.15}>
              <h2 className="font-display text-3xl md:text-4xl leading-tight mb-6">
                Something is changing — and it&apos;s not just physical.
              </h2>
              <p className="text-base mb-5" style={{ color: c.inkSoft, lineHeight: 1.8 }}>
                What you&apos;re experiencing is real. And it&apos;s more than symptoms.
              </p>
              <p className="text-base mb-5" style={{ color: c.inkSoft, lineHeight: 1.8 }}>
                This phase often brings shifts in mood, sleep, focus, relationships, and sense of self. It can feel confusing — especially when there isn&apos;t a clear way to understand it.
              </p>
              <p className="text-base" style={{ color: c.inkSoft, lineHeight: 1.8 }}>
                <span className="highlight">Periwink exists to change that.</span>
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* What You'll Find Section */}
      <section
        className="py-24 px-6"
        style={{ background: `linear-gradient(180deg, #fff 0%, ${c.lavenderBlush} 100%)` }}
      >
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="font-display text-3xl md:text-4xl mb-4">
                What you&apos;ll find here
              </h2>
              <p className="text-base" style={{ color: c.inkSoft }}>
                Support, understanding, and connection — designed for this phase of life.
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "🌿",
                title: "Groups & Circles",
                desc: "Guided spaces for reflection, conversation, and shared experience.",
                href: "/app/groups",
                linkText: "Learn about groups →",
              },
              {
                icon: "✨",
                title: "Learning & Insight",
                desc: "Clear, grounded information to help you understand what's changing — without the noise.",
                href: null,
                linkText: null,
              },
              {
                icon: "💜",
                title: "Community",
                desc: "A place to connect with others who truly understand — because they're living it too.",
                href: null,
                linkText: null,
              },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div
                  className="p-8 rounded-3xl h-full"
                  style={{
                    background: "#fff",
                    border: `1px solid ${c.periwinkleMist}`,
                    boxShadow: "0 4px 24px rgba(110, 90, 126, 0.06)",
                  }}
                >
                  <span className="text-3xl mb-5 block">{item.icon}</span>
                  <h3 className="font-display text-xl mb-3">{item.title}</h3>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: c.inkSoft }}>
                    {item.desc}
                  </p>
                  {item.href && (
                    <a
                      href={item.href}
                      className="text-sm font-medium transition-opacity hover:opacity-70"
                      style={{ color: c.periwinkleDeep, textDecoration: "none" }}
                    >
                      {item.linkText}
                    </a>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Conversations Section */}
      <section id="conversations" className="py-24 px-6" style={{ background: c.cream }}>
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="font-display text-3xl md:text-4xl mb-4">
                Explore the Conversations
              </h2>
              <p className="text-base" style={{ color: c.inkSoft, lineHeight: 1.75 }}>
                Community conversations for every part of the midlife experience.
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {conversations.map((conv, i) => (
              <Reveal key={conv.slug} delay={i * 0.05} className={conv.featured ? "lg:col-start-2" : ""}>
                <a
                  href={`/app/rooms/${conv.slug}`}
                  className="text-left p-6 rounded-2xl transition-all hover:-translate-y-1 block"
                  style={{
                    background: conv.featured ? "rgba(248,245,255,.5)" : "#fff",
                    border: conv.featured
                      ? "1px solid rgba(183,168,201,.42)"
                      : `1px solid ${c.periwinkleMist}`,
                    boxShadow: "0 2px 16px rgba(110, 90, 126, 0.04)",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <span className="text-3xl mb-3 block">{conv.emoji}</span>
                  <h4
                    className="font-display text-lg mb-2"
                    style={{ color: "inherit" }}
                  >
                    {conv.name}
                  </h4>
                  <p className="text-sm" style={{ color: c.inkMuted, lineHeight: 1.65 }}>
                    {conv.desc}
                  </p>
                </a>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="text-center mt-14">
              <p
                className="font-display text-xl md:text-2xl mb-3"
                style={{ color: c.ink, fontWeight: 300 }}
              >
                Join the conversation.
              </p>
              <p className="text-sm mb-8" style={{ color: c.inkSoft, lineHeight: 1.75 }}>
                Read, reflect, and connect with women navigating similar experiences.
              </p>
              <button
                onClick={openJoin}
                className="px-8 py-3 rounded-full text-sm transition-all hover:-translate-y-0.5 cursor-pointer"
                style={{
                  background: c.periwinkleDeep,
                  color: "#fff",
                  border: "none",
                  boxShadow: "0 4px 18px rgba(110, 90, 126, 0.25)",
                }}
              >
                Explore the Community
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Testimonial */}
      <Reveal>
        <section
          className="py-24 px-6 text-center"
          style={{ background: c.periwinkleDeep }}
        >
          <div className="max-w-3xl mx-auto">
            <span className="font-display text-7xl opacity-20 text-white block mb-0">&ldquo;</span>
            <blockquote
              className="font-display text-2xl md:text-3xl italic text-white leading-relaxed mb-8 -mt-8"
            >
              I've learned more about what's happening in my body from two weeks in Periwink than from a decade of doctor visits. And I finally don't feel like I'm the only one.
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div
                className="w-12 h-12 rounded-full"
                style={{ background: `linear-gradient(135deg, ${c.periwinkleLight}, ${c.roseSoft})` }}
              />
              <div className="text-left">
                <strong className="text-white block">Sarah M.</strong>
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Member since January
                </span>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Builders Section */}
      <section id="builders" className="py-24 px-6" style={{ background: "#fff" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <Reveal>
              <h2 className="font-display text-3xl md:text-4xl leading-tight mb-5">
                Help build something that matters.
              </h2>
              <p className="text-base mb-6" style={{ color: c.inkSoft, lineHeight: 1.8 }}>
                We&apos;re looking for practitioners, researchers, creators, and community builders to help shape what Periwink becomes — from the inside.
              </p>
              <div className="flex flex-wrap gap-3 mb-8">
                {roleOptions.map((role) => (
                  <span
                    key={role.value}
                    className="px-5 py-2.5 rounded-full text-sm font-medium"
                    style={{
                      background: c.lavenderBlush,
                      border: `1px solid ${c.periwinkleMist}`,
                      color: c.periwinkleDeep,
                    }}
                  >
                    {role.label}
                  </span>
                ))}
              </div>
              <button
                onClick={() => { setFormError(""); setFoundingStep(1); setFoundingModalOpen(true); }}
                className="px-8 py-4 rounded-full text-base font-medium transition-all hover:-translate-y-0.5 cursor-pointer"
                style={{
                  background: c.periwinkleDeep,
                  color: "#fff",
                  boxShadow: "0 6px 28px rgba(110, 90, 126, 0.35)",
                }}
              >
                Apply as a Founding Member →
              </button>
            </Reveal>

            <Reveal delay={0.15}>
              <div
                className="aspect-[4/3] rounded-3xl overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${c.periwinkleMist}, ${c.lavenderBlush}) center/cover, url('/bg-floral.png') center/cover no-repeat`,
                }}
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* Groups teaser */}
      <Reveal>
        <section className="py-20 px-6" style={{ background: c.lavenderBlush }}>
          <div className="max-w-4xl mx-auto">
            <div
              className="rounded-3xl p-10 flex flex-col md:flex-row gap-8 items-center"
              style={{ background: "#fff", border: `1px solid ${c.periwinkleMist}`, boxShadow: "0 4px 24px rgba(110, 90, 126, 0.07)" }}
            >
              <div className="flex-1">
                <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: c.periwinkle }}>
                  Optional · Led by Dr. Tubero
                </p>
                <h2 className="font-display text-2xl md:text-3xl mb-3" style={{ color: c.ink }}>
                  Groups &amp; retreats
                </h2>
                <p className="text-base mb-2" style={{ color: c.inkSoft, lineHeight: 1.75 }}>
                  For women who want structured support alongside the community — small virtual groups, retreats, and one-on-one sessions with Dr. Tubero.
                </p>
                <p className="text-sm" style={{ color: c.inkMuted }}>
                  The community is always free. Groups are an optional next step.
                </p>
              </div>
              <a
                href="/app/groups"
                className="px-8 py-4 rounded-full text-sm font-medium transition-all hover:-translate-y-0.5 whitespace-nowrap"
                style={{ background: c.periwinkleDeep, color: "#fff", textDecoration: "none", boxShadow: "0 6px 28px rgba(110, 90, 126, 0.3)" }}
              >
                Learn more &amp; apply →
              </a>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Email Signup Section */}
      <EmailSignup />

      {/* CTA Section */}
      <Reveal>
        <section
          className="py-28 px-6 text-center"
          style={{ background: `linear-gradient(180deg, ${c.lavenderBlush} 0%, ${c.periwinkleWhisper} 100%)` }}
        >
          <div className="max-w-2xl mx-auto">
            <h2 className="font-display text-4xl md:text-5xl leading-tight mb-5">
              A wiser way forward —{" "}
              <em style={{ color: c.periwinkleDeep }}>together.</em>
            </h2>
            <p className="text-lg mb-3" style={{ color: c.inkSoft, lineHeight: 1.7 }}>
              You don&apos;t have to figure this out alone.
            </p>
            <p className="text-lg mb-10" style={{ color: c.inkSoft, lineHeight: 1.7 }}>
              There is a way forward — and it&apos;s better shared.
            </p>
            <div className="flex justify-center">
              <button
                onClick={openJoin}
                className="px-10 py-4 rounded-full text-base font-medium transition-all hover:-translate-y-0.5 cursor-pointer"
                style={{
                  background: c.periwinkleDeep,
                  color: "#fff",
                  boxShadow: "0 6px 28px rgba(110, 90, 126, 0.35)",
                }}
              >
                Join the Community
              </button>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Footer */}
      <footer className="py-12 px-6" style={{ background: c.ink }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <span className="font-display text-xl text-white">periwink</span>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
            &copy; {new Date().getFullYear()} Periwink. All rights reserved.
          </p>
          <div className="flex gap-8">
            {["Privacy", "Terms", "Contact"].map((link) => (
              <a
                key={link}
                href="#"
                className="text-sm transition-colors hover:text-white"
                style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none" }}
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>

      {/* ============================================================ */}
      {/* MODALS                                                       */}
      {/* ============================================================ */}

      {/* Join Choice Modal */}
      <Modal isOpen={joinChoiceOpen} onClose={() => setJoinChoiceOpen(false)}>
        <div className="p-10 pt-12 text-center border-b" style={{ borderColor: c.periwinkleMist }}>
          <h3 className="font-display text-3xl mb-2">Join Periwink</h3>
          <p style={{ color: c.inkMuted }}>How would you like to be part of our community?</p>
        </div>
        <div className="p-8 flex flex-col gap-4">
          <button
            onClick={() => {
              setJoinChoiceOpen(false);
              setFormError("");
              setCommunityModalOpen(true);
            }}
            className="w-full text-left p-7 rounded-2xl transition-all hover:-translate-y-0.5 cursor-pointer"
            style={{
              background: c.lavenderBlush,
              border: `2px solid ${c.periwinkleLight}`,
            }}
          >
            <div className="text-2xl mb-3">💜</div>
            <h4 className="font-display text-xl mb-1" style={{ color: c.periwinkleDeep }}>
              Join as a Member
            </h4>
            <p className="text-sm" style={{ color: c.inkMuted }}>
              Access circles, share experiences, and connect with women navigating the same journey.
            </p>
          </button>

          <button
            onClick={() => {
              setJoinChoiceOpen(false);
              setFormError("");
              setFoundingStep(1);
              setFoundingModalOpen(true);
            }}
            className="w-full text-left p-7 rounded-2xl transition-all hover:-translate-y-0.5 cursor-pointer"
            style={{
              background: "#fff",
              border: `2px solid ${c.periwinkleMist}`,
            }}
          >
            <div className="text-2xl mb-3">🌱</div>
            <h4 className="font-display text-xl mb-1" style={{ color: c.ink }}>
              Become a Founding Member
            </h4>
            <p className="text-sm" style={{ color: c.inkMuted }}>
              For practitioners, researchers, creators, and builders who want to help shape what Periwink becomes.
            </p>
          </button>
        </div>
      </Modal>

      {/* Community Signup Modal */}
      <Modal isOpen={communityModalOpen} onClose={() => setCommunityModalOpen(false)}>
        <div className="p-10 pt-12 text-center border-b" style={{ borderColor: c.periwinkleMist }}>
          <h3 className="font-display text-3xl mb-2">Join the Community</h3>
          <p style={{ color: c.inkMuted }}>You're taking the first step. We'll be in touch soon.</p>
        </div>
        <form onSubmit={handleCommunitySubmit} className="p-10">
          {formError && (
            <div className="mb-6 p-4 rounded-xl text-sm" style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA" }}>
              {formError}
            </div>
          )}
          <FormInput
            label="Your name"
            required
            placeholder="How you'd like to be addressed"
            value={communityForm.name}
            onChange={(e) => setCommunityForm({ ...communityForm, name: e.target.value })}
          />
          <FormInput
            label="Email"
            required
            placeholder="you@example.com"
            value={communityForm.email}
            onChange={(e) => setCommunityForm({ ...communityForm, email: e.target.value })}
          />
          <div className="mb-8">
            <label className="block text-sm font-medium mb-2">
              Choose a pseudonym <span style={{ color: c.periwinkle }}>*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Your identity in the community"
              value={communityForm.pseudonym}
              onChange={(e) => setCommunityForm({ ...communityForm, pseudonym: e.target.value })}
              className="w-full px-5 py-4 rounded-xl text-base transition-all"
              style={{ border: `1px solid ${c.periwinkleMist}`, outline: "none" }}
            />
            <p className="text-sm mt-2" style={{ color: c.inkMuted }}>
              This is how you'll appear to others. You can stay as anonymous as you'd like.
            </p>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-xl text-base font-medium transition-all disabled:opacity-50 cursor-pointer"
            style={{ background: c.periwinkleDeep, color: "#fff" }}
          >
            {isSubmitting ? "Joining..." : "Join Periwink"}
          </button>
        </form>
      </Modal>

      {/* Founding Member Modal */}
      <Modal
        isOpen={foundingModalOpen}
        onClose={() => {
          setFoundingModalOpen(false);
          setFoundingStep(1);
        }}
      >
        <div className="p-10 pt-12 text-center border-b" style={{ borderColor: c.periwinkleMist }}>
          <h3 className="font-display text-3xl mb-2">Become a Founding Member</h3>
          <p style={{ color: c.inkMuted }}>Help shape what Periwink becomes.</p>
        </div>
        <div className="p-10">
          {/* Step indicator */}
          <div className="flex justify-center gap-3 mb-8">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className="w-3 h-3 rounded-full transition-all"
                style={{
                  background: foundingStep >= step ? c.periwinkleDeep : c.periwinkleMist,
                  transform: foundingStep === step ? "scale(1.2)" : "scale(1)",
                }}
              />
            ))}
          </div>

          {formError && (
            <div className="mb-6 p-4 rounded-xl text-sm" style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA" }}>
              {formError}
            </div>
          )}

          {foundingStep === 1 && (
            <>
              <FormInput
                label="Your name"
                required
                placeholder="Full name"
                value={foundingForm.name}
                onChange={(e) => setFoundingForm({ ...foundingForm, name: e.target.value })}
              />
              <FormInput
                label="Email"
                required
                type="email"
                placeholder="you@example.com"
                value={foundingForm.email}
                onChange={(e) => setFoundingForm({ ...foundingForm, email: e.target.value })}
              />
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">
                  What role interests you? <span style={{ color: c.periwinkle }}>*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {roleOptions.map((role) => (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => setFoundingForm({ ...foundingForm, roleType: role.value })}
                      className="p-4 rounded-xl text-sm font-medium transition-all text-center cursor-pointer"
                      style={{
                        border: `2px solid ${foundingForm.roleType === role.value ? c.periwinkleDeep : c.periwinkleMist}`,
                        background: foundingForm.roleType === role.value ? c.lavenderBlush : "#fff",
                        color: c.ink,
                      }}
                    >
                      {role.label}
                    </button>
                  ))}
                </div>
              </div>
              <FormInput
                label="Organization"
                placeholder="Your company or practice (optional)"
                value={foundingForm.organization}
                onChange={(e) => setFoundingForm({ ...foundingForm, organization: e.target.value })}
              />
              <button
                type="button"
                onClick={() => {
                  setFormError("");
                  if (foundingForm.name && foundingForm.email && foundingForm.roleType) {
                    setFoundingStep(2);
                  } else {
                    setFormError("Please fill in your name, email, and select a role.");
                  }
                }}
                className="w-full py-4 rounded-xl text-base font-medium cursor-pointer"
                style={{ background: c.periwinkleDeep, color: "#fff" }}
              >
                Continue
              </button>
            </>
          )}

          {foundingStep === 2 && (
            <>
              <FormTextarea
                label="What draws you to Periwink?"
                required
                placeholder="What resonates with you about what we're building?"
                value={foundingForm.whatDrawsYou}
                onChange={(e) => setFoundingForm({ ...foundingForm, whatDrawsYou: e.target.value })}
              />
              <FormTextarea
                label="What do you hope to offer this community?"
                required
                placeholder="Your expertise, perspective, or contribution..."
                value={foundingForm.whatYouOffer}
                onChange={(e) => setFoundingForm({ ...foundingForm, whatYouOffer: e.target.value })}
              />
              <FormTextarea
                label="How do you approach supporting women in your current work?"
                required
                placeholder="Tell us about your current approach..."
                value={foundingForm.currentApproach}
                onChange={(e) => setFoundingForm({ ...foundingForm, currentApproach: e.target.value })}
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setFormError(""); setFoundingStep(1); }}
                  className="flex-1 py-4 rounded-xl text-base font-medium cursor-pointer"
                  style={{ background: c.periwinkleWhisper, color: c.ink }}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormError("");
                    if (foundingForm.whatDrawsYou && foundingForm.whatYouOffer && foundingForm.currentApproach) {
                      setFoundingStep(3);
                    } else {
                      setFormError("Please answer all required questions.");
                    }
                  }}
                  className="flex-[2] py-4 rounded-xl text-base font-medium cursor-pointer"
                  style={{ background: c.periwinkleDeep, color: "#fff" }}
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {foundingStep === 3 && (
            <>
              <FormTextarea
                label="What does 'holding space' mean to you?"
                required
                placeholder="In your own words..."
                value={foundingForm.holdingSpace}
                onChange={(e) => setFoundingForm({ ...foundingForm, holdingSpace: e.target.value })}
              />
              <FormTextarea
                label="Anything you'd want to build, create, or contribute?"
                placeholder="Ideas, content, features... (optional)"
                value={foundingForm.wantToBuild}
                onChange={(e) => setFoundingForm({ ...foundingForm, wantToBuild: e.target.value })}
              />
              <FormInput
                label="Website or LinkedIn"
                type="url"
                placeholder="https://..."
                value={foundingForm.website}
                onChange={(e) => setFoundingForm({ ...foundingForm, website: e.target.value })}
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setFormError(""); setFoundingStep(2); }}
                  className="flex-1 py-4 rounded-xl text-base font-medium cursor-pointer"
                  style={{ background: c.periwinkleWhisper, color: c.ink }}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!foundingForm.holdingSpace) {
                      setFormError("Please answer the required question.");
                      return;
                    }
                    handleFoundingSubmit();
                  }}
                  disabled={isSubmitting}
                  className="flex-[2] py-4 rounded-xl text-base font-medium disabled:opacity-50 cursor-pointer"
                  style={{ background: c.periwinkleDeep, color: "#fff" }}
                >
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal isOpen={successModal.open} onClose={() => setSuccessModal({ ...successModal, open: false })}>
        <div className="p-12 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-6"
            style={{ background: c.sageSoft }}
          >
            &#10003;
          </div>
          <h4 className="font-display text-2xl mb-3">{successModal.title}</h4>
          <p className="mb-6" style={{ color: c.inkSoft }}>{successModal.message}</p>
          {successModal.signupUrl && (
            <a
              href={successModal.signupUrl}
              className="block px-8 py-3 rounded-full text-sm font-medium mb-3"
              style={{ background: c.periwinkleDeep, color: "#fff", textDecoration: "none" }}
            >
              Set up your account →
            </a>
          )}
          <button
            onClick={() => setSuccessModal({ ...successModal, open: false })}
            className="px-8 py-3 rounded-full text-sm font-medium cursor-pointer"
            style={{ background: "transparent", color: c.inkSoft, border: `1px solid ${c.periwinkleMist}` }}
          >
            Close
          </button>
        </div>
      </Modal>
    </>
  );
}
