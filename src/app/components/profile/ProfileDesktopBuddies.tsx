import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";

const BUDDIES = {
  tikki: {
    name: "Tikki",
    tagline: "Chrono desk companion",
    btnMore: "Another tip",
    btnDismiss: "See ya",
    tips: [
      "Tick-tock! I'm Tikki — your ChronoShare desk companion. Click me whenever you want a tip.",
      "Looks like you're trading time! Open Exchange Ledger to review completed swaps.",
      "Both people must confirm before hours move. I’ll wait right here while you handle that.",
      "Every hour counts the same here — guitar, gardening, coding, all equal on the clock.",
      "Press ChronoStart on the taskbar for rotating community tips. Fancy, right?",
      "Your hour balance is your renewable energy. Spend it wisely, grow it generously.",
    ],
  },
  sprig: {
    name: "Sprig",
    tagline: "Solarpunk sidekick",
    btnMore: "Tell me more",
    btnDismiss: "Bye for now",
    tips: [
      "Hi! I'm Sprig — your solarpunk sidekick. The community garden says hello.",
      "Post an offer to earn hours from the pool. Sunlight optional but encouraged.",
      "Needs spend hours; offers earn them. Think of it as composting time back into the soil.",
      "Double-click your avatar for a little surprise. I tried — very wholesome.",
      "Browse the Job Board when you’re ready to trade. Someone nearby might need your skill.",
      "Solarpunk rule: leave every exchange sunnier than you found it.",
    ],
  },
} as const;

type BuddyId = keyof typeof BUDDIES;

function TikkiSvg() {
  return (
    <svg viewBox="0 0 80 80" className="profile-buddy-svg profile-buddy-tikki-art" aria-hidden>
      <defs>
        <linearGradient id="tikki-face" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff7c2" />
          <stop offset="55%" stopColor="#ffd166" />
          <stop offset="100%" stopColor="#f4a836" />
        </linearGradient>
        <linearGradient id="tikki-ring" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8ed4f0" />
          <stop offset="100%" stopColor="#3dd9c8" />
        </linearGradient>
      </defs>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <rect
          key={deg}
          x="38"
          y="4"
          width="4"
          height="10"
          rx="2"
          fill="#ffd166"
          transform={`rotate(${deg} 40 40)`}
        />
      ))}
      <circle cx="40" cy="40" r="28" fill="url(#tikki-ring)" stroke="#18a89e" strokeWidth="2" />
      <circle cx="40" cy="40" r="22" fill="url(#tikki-face)" />
      <ellipse cx="32" cy="36" rx="5" ry="6" fill="#fff" stroke="#1b5f7a" strokeWidth="1.2" />
      <ellipse cx="48" cy="36" rx="5" ry="6" fill="#fff" stroke="#1b5f7a" strokeWidth="1.2" />
      <ellipse cx="32" cy="37" rx="2.5" ry="3" fill="#1b5f7a" />
      <ellipse cx="48" cy="37" rx="2.5" ry="3" fill="#1b5f7a" />
      <ellipse cx="33" cy="35.5" rx="0.9" ry="1.1" fill="#fff" />
      <ellipse cx="49" cy="35.5" rx="0.9" ry="1.1" fill="#fff" />
      <path d="M32 48 Q40 54 48 48" fill="none" stroke="#1b5f7a" strokeWidth="2" strokeLinecap="round" />
      <line x1="40" y1="40" x2="40" y2="26" stroke="#1b5f7a" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="40" y1="40" x2="50" y2="44" stroke="#1b5f7a" strokeWidth="2" strokeLinecap="round" />
      <circle cx="40" cy="40" r="2.5" fill="#1b5f7a" />
    </svg>
  );
}

function SprigSvg() {
  return (
    <svg viewBox="0 0 80 88" className="profile-buddy-svg profile-buddy-sprig-art" aria-hidden>
      <defs>
        <linearGradient id="sprig-body" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#9ae0ae" />
          <stop offset="100%" stopColor="#3d8b5e" />
        </linearGradient>
        <linearGradient id="sprig-leaf" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b8e8a0" />
          <stop offset="100%" stopColor="#5bc77a" />
        </linearGradient>
      </defs>
      <ellipse cx="22" cy="18" rx="14" ry="10" fill="url(#sprig-leaf)" transform="rotate(-28 22 18)" />
      <ellipse cx="58" cy="18" rx="14" ry="10" fill="url(#sprig-leaf)" transform="rotate(28 58 18)" />
      <path d="M36 8 Q40 2 44 8 L42 14 Q40 12 38 14 Z" fill="#5bc77a" />
      <ellipse cx="40" cy="48" rx="26" ry="28" fill="url(#sprig-body)" stroke="#2e7d52" strokeWidth="2" />
      <ellipse cx="30" cy="44" rx="6" ry="7" fill="#fff" stroke="#1b5f7a" strokeWidth="1.2" />
      <ellipse cx="50" cy="44" rx="6" ry="7" fill="#fff" stroke="#1b5f7a" strokeWidth="1.2" />
      <ellipse cx="30" cy="45" rx="3" ry="3.5" fill="#1b5f7a" />
      <ellipse cx="50" cy="45" rx="3" ry="3.5" fill="#1b5f7a" />
      <ellipse cx="31" cy="43.5" rx="1" ry="1.2" fill="#fff" />
      <ellipse cx="51" cy="43.5" rx="1" ry="1.2" fill="#fff" />
      <path d="M30 58 Q40 66 50 58" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="24" cy="54" rx="4" ry="3" fill="#ffd166" opacity="0.45" />
      <ellipse cx="56" cy="54" rx="4" ry="3" fill="#ffd166" opacity="0.45" />
      <path d="M32 76 Q40 82 48 76" fill="none" stroke="#2e7d52" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="40" cy="84" rx="8" ry="3" fill="#5bc77a" opacity="0.6" />
    </svg>
  );
}

interface ProfileDesktopBuddiesProps {
  hoursAvailable?: number;
}

export function ProfileDesktopBuddies({ hoursAvailable = 0 }: ProfileDesktopBuddiesProps) {
  const [activeBuddy, setActiveBuddy] = useState<BuddyId | null>(null);
  const [tipIndex, setTipIndex] = useState<Record<BuddyId, number>>({ tikki: 0, sprig: 0 });
  const [hidden, setHidden] = useState<Record<BuddyId, boolean>>({ tikki: false, sprig: false });
  const [wiggle, setWiggle] = useState<BuddyId | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setActiveBuddy("tikki"), 2400);
    return () => window.clearTimeout(timer);
  }, []);

  const getTip = useCallback(
    (id: BuddyId) => {
      const idx = tipIndex[id];
      if (id === "tikki" && idx === 0 && hoursAvailable <= 0) {
        return "Tick-tock — your hour tank is empty! Post an offer on the Job Board to earn some time.";
      }
      return BUDDIES[id].tips[idx % BUDDIES[id].tips.length]!;
    },
    [tipIndex, hoursAvailable],
  );

  const handleBuddyClick = (id: BuddyId) => {
    setHidden((prev) => ({ ...prev, [id]: false }));
    setActiveBuddy((current) => (current === id ? null : id));
    setWiggle(id);
    window.setTimeout(() => setWiggle(null), 500);
  };

  const handleNextTip = (id: BuddyId) => {
    setTipIndex((prev) => ({ ...prev, [id]: prev[id] + 1 }));
    setActiveBuddy(id);
  };

  const dismissBuddy = (id: BuddyId) => {
    setHidden((prev) => ({ ...prev, [id]: true }));
    setActiveBuddy((current) => (current === id ? null : current));
  };

  const dismissBubble = (id: BuddyId) => {
    setActiveBuddy((current) => (current === id ? null : current));
  };

  if (hidden.tikki && hidden.sprig) return null;

  return (
    <div className="profile-buddies" aria-label="ChronoShare desktop buddies">
      {(Object.keys(BUDDIES) as BuddyId[]).map((id) => {
        if (hidden[id]) return null;
        const buddy = BUDDIES[id];
        const isSprig = id === "sprig";

        return (
          <div
            key={id}
            className={`profile-buddy profile-buddy-${id} ${wiggle === id ? "profile-buddy-wiggle" : ""}`}
          >
            {activeBuddy === id && (
              <div
                className={`profile-buddy-bubble ${isSprig ? "profile-buddy-bubble-sprig" : "profile-buddy-bubble-tikki"}`}
                role="dialog"
                aria-label={`${buddy.name} says`}
              >
                <button
                  type="button"
                  className="profile-buddy-bubble-close"
                  aria-label="Dismiss message"
                  onClick={() => dismissBubble(id)}
                >
                  <X size={12} />
                </button>
                <p className="profile-buddy-bubble-text">{getTip(id)}</p>
                <div className="profile-buddy-bubble-actions">
                  <button
                    type="button"
                    className={`profile-buddy-bubble-btn ${isSprig ? "profile-buddy-bubble-btn-sprig" : "profile-buddy-bubble-btn-tikki"}`}
                    onClick={() => handleNextTip(id)}
                  >
                    {buddy.btnMore}
                  </button>
                  <button
                    type="button"
                    className="profile-buddy-bubble-btn profile-buddy-bubble-btn-muted"
                    onClick={() => dismissBuddy(id)}
                  >
                    {buddy.btnDismiss}
                  </button>
                </div>
              </div>
            )}
            <button
              type="button"
              className="profile-buddy-trigger"
              aria-label={`${buddy.name}, ${buddy.tagline}`}
              title={buddy.name}
              onClick={() => handleBuddyClick(id)}
            >
              {id === "tikki" ? <TikkiSvg /> : <SprigSvg />}
              <span className="profile-buddy-name">{buddy.name}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
