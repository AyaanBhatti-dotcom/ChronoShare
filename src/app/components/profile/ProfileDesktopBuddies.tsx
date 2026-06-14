import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";

const CLIPPY_TIPS = [
  "It looks like you're trading time! Need help posting a listing?",
  "Tip: Both people must confirm before hours move. I learned that the hard way.",
  "I see you haven't opened Exchange Ledger yet. Want me to? …I'll let you click it.",
  "Writing a letter? I'm a paperclip! Oh wait — this is ChronoShare.",
  "Press the ChronoStart orb for community tips. I would, but I don't have hands.",
  "Your hour balance looks healthy. Unlike my spine. I'm a paperclip.",
];

const BONZI_TIPS = [
  "Hey there! Want to hear a cool fact? ChronoShare runs on renewable time!",
  "You've got mail! …It's probably a pending exchange confirmation.",
  "I'm Bonzi! Your virtual friend on the ChronoShare desktop. Totally harmless. Promise.",
  "Did you know? An hour of guitar equals an hour of gardening here. Science!",
  "Double-click your avatar for a surprise. I tried — nothing happened. I'm purple though.",
  "The rainforest called. It said post more offers and earn community hours.",
];

function ClippySvg() {
  return (
    <svg viewBox="0 0 64 96" className="profile-buddy-svg profile-buddy-clippy-art" aria-hidden>
      <defs>
        <linearGradient id="clippy-metal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f5f5f5" />
          <stop offset="45%" stopColor="#d4d4d4" />
          <stop offset="100%" stopColor="#a8a8a8" />
        </linearGradient>
      </defs>
      <path
        d="M38 8 C52 8 58 22 48 34 L34 48 C28 54 28 62 34 68 L42 76 C48 82 48 90 40 92 C32 94 24 88 24 80 L24 72 C18 66 18 58 24 52 L38 38 C44 32 44 24 38 18 L30 10 C24 4 30 -2 38 8 Z"
        fill="url(#clippy-metal)"
        stroke="#888"
        strokeWidth="1.5"
      />
      <ellipse cx="36" cy="28" rx="9" ry="10" fill="#fff" stroke="#333" strokeWidth="1.2" />
      <ellipse cx="36" cy="28" rx="4" ry="5" fill="#111" />
      <ellipse cx="38" cy="26" rx="1.2" ry="1.5" fill="#fff" />
      <ellipse cx="48" cy="24" rx="8" ry="9" fill="#fff" stroke="#333" strokeWidth="1.2" />
      <ellipse cx="48" cy="24" rx="3.5" ry="4.5" fill="#111" />
      <ellipse cx="49.5" cy="22.5" rx="1" ry="1.2" fill="#fff" />
      <path d="M32 42 Q36 46 40 42" fill="none" stroke="#666" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function BonziSvg() {
  return (
    <svg viewBox="0 0 80 96" className="profile-buddy-svg profile-buddy-bonzi-art" aria-hidden>
      <defs>
        <linearGradient id="bonzi-fur" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#9b59d4" />
          <stop offset="100%" stopColor="#6b2fa0" />
        </linearGradient>
        <linearGradient id="bonzi-face" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#9333ea" />
        </linearGradient>
      </defs>
      <ellipse cx="40" cy="78" rx="22" ry="16" fill="url(#bonzi-fur)" />
      <ellipse cx="40" cy="42" rx="28" ry="30" fill="url(#bonzi-face)" stroke="#5b21b6" strokeWidth="1.5" />
      <ellipse cx="28" cy="38" rx="10" ry="12" fill="#7c3aed" />
      <ellipse cx="52" cy="38" rx="10" ry="12" fill="#7c3aed" />
      <ellipse cx="28" cy="40" rx="6" ry="7" fill="#fff" />
      <ellipse cx="52" cy="40" rx="6" ry="7" fill="#fff" />
      <ellipse cx="28" cy="41" rx="3" ry="4" fill="#111" />
      <ellipse cx="52" cy="41" rx="3" ry="4" fill="#111" />
      <ellipse cx="29" cy="39" rx="1" ry="1.2" fill="#fff" />
      <ellipse cx="53" cy="39" rx="1" ry="1.2" fill="#fff" />
      <ellipse cx="40" cy="52" rx="10" ry="7" fill="#4c1d95" opacity="0.35" />
      <path d="M30 54 Q40 64 50 54" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M34 56 Q40 60 46 56" fill="#fda4af" />
      <ellipse cx="22" cy="48" rx="4" ry="3" fill="#f472b6" opacity="0.45" />
      <ellipse cx="58" cy="48" rx="4" ry="3" fill="#f472b6" opacity="0.45" />
      <path d="M18 30 Q12 18 20 14 Q28 10 32 20" fill="#7c3aed" />
      <path d="M62 30 Q68 18 60 14 Q52 10 48 20" fill="#7c3aed" />
    </svg>
  );
}

type BuddyId = "clippy" | "bonzi";

interface ProfileDesktopBuddiesProps {
  hoursAvailable?: number;
}

export function ProfileDesktopBuddies({ hoursAvailable = 0 }: ProfileDesktopBuddiesProps) {
  const [activeBuddy, setActiveBuddy] = useState<BuddyId | null>(null);
  const [clippyIndex, setClippyIndex] = useState(0);
  const [bonziIndex, setBonziIndex] = useState(0);
  const [hidden, setHidden] = useState<Record<BuddyId, boolean>>({ clippy: false, bonzi: false });
  const [wiggle, setWiggle] = useState<BuddyId | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setActiveBuddy("clippy");
    }, 2400);
    return () => window.clearTimeout(timer);
  }, []);

  const getTip = useCallback(
    (id: BuddyId) => {
      if (id === "clippy") {
        if (clippyIndex === 0 && hoursAvailable <= 0) {
          return "It looks like you're out of hours! Would you like help posting an offer to earn some?";
        }
        return CLIPPY_TIPS[clippyIndex % CLIPPY_TIPS.length]!;
      }
      return BONZI_TIPS[bonziIndex % BONZI_TIPS.length]!;
    },
    [clippyIndex, bonziIndex, hoursAvailable],
  );

  const handleBuddyClick = (id: BuddyId) => {
    setHidden((prev) => ({ ...prev, [id]: false }));
    setActiveBuddy((current) => (current === id ? null : id));
    setWiggle(id);
    window.setTimeout(() => setWiggle(null), 500);
    if (id === "clippy") setClippyIndex((i) => i + 1);
    else setBonziIndex((i) => i + 1);
  };

  const dismissBuddy = (id: BuddyId) => {
    setHidden((prev) => ({ ...prev, [id]: true }));
    setActiveBuddy((current) => (current === id ? null : current));
  };

  const dismissBubble = (id: BuddyId) => {
    setActiveBuddy((current) => (current === id ? null : current));
  };

  if (hidden.clippy && hidden.bonzi) return null;

  return (
    <div className="profile-buddies" aria-label="Desktop assistants">
      {!hidden.clippy && (
        <div className={`profile-buddy profile-buddy-clippy ${wiggle === "clippy" ? "profile-buddy-wiggle" : ""}`}>
          {activeBuddy === "clippy" && (
            <div className="profile-buddy-bubble" role="dialog" aria-label="Clippy says">
              <button
                type="button"
                className="profile-buddy-bubble-close"
                aria-label="Dismiss message"
                onClick={() => dismissBubble("clippy")}
              >
                <X size={12} />
              </button>
              <p className="profile-buddy-bubble-text">{getTip("clippy")}</p>
              <div className="profile-buddy-bubble-actions">
                <button type="button" className="profile-buddy-bubble-btn" onClick={() => handleBuddyClick("clippy")}>
                  Tell me more
                </button>
                <button type="button" className="profile-buddy-bubble-btn profile-buddy-bubble-btn-muted" onClick={() => dismissBuddy("clippy")}>
                  Go away
                </button>
              </div>
            </div>
          )}
          <button
            type="button"
            className="profile-buddy-trigger"
            aria-label="Clippy assistant"
            title="Clippy"
            onClick={() => handleBuddyClick("clippy")}
          >
            <ClippySvg />
            <span className="profile-buddy-name">Clippy</span>
          </button>
        </div>
      )}

      {!hidden.bonzi && (
        <div className={`profile-buddy profile-buddy-bonzi ${wiggle === "bonzi" ? "profile-buddy-wiggle" : ""}`}>
          {activeBuddy === "bonzi" && (
            <div className="profile-buddy-bubble profile-buddy-bubble-bonzi" role="dialog" aria-label="Bonzi says">
              <button
                type="button"
                className="profile-buddy-bubble-close"
                aria-label="Dismiss message"
                onClick={() => dismissBubble("bonzi")}
              >
                <X size={12} />
              </button>
              <p className="profile-buddy-bubble-text">{getTip("bonzi")}</p>
              <div className="profile-buddy-bubble-actions">
                <button type="button" className="profile-buddy-bubble-btn profile-buddy-bubble-btn-bonzi" onClick={() => handleBuddyClick("bonzi")}>
                  Cool!
                </button>
                <button type="button" className="profile-buddy-bubble-btn profile-buddy-bubble-btn-muted" onClick={() => dismissBuddy("bonzi")}>
                  Go away
                </button>
              </div>
            </div>
          )}
          <button
            type="button"
            className="profile-buddy-trigger"
            aria-label="BonziBuddy assistant"
            title="BonziBuddy"
            onClick={() => handleBuddyClick("bonzi")}
          >
            <BonziSvg />
            <span className="profile-buddy-name">BonziBuddy</span>
          </button>
        </div>
      )}
    </div>
  );
}
