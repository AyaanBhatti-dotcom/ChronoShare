import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Briefcase,
  PlusCircle,
  User,
  Home,
  Settings as SettingsIcon,
  Handshake,
  TrendingUp,
  Search,
  HeartHandshake,
  CheckCircle2,
  Gift,
} from "lucide-react";
import { POOL_RULES, formatClaimWindowLabel } from "../../../lib/community-pool";
import { useAuth } from "../../context/AuthContext";
import { AeroBackground, aero } from "./aeroTheme";
import { Logo } from "../Logo";
import { setTourPending } from "../../utils/onboarding";

interface Step {
  id: string;
  title: string;
  subtitle: string;
  content: React.ReactNode;
}

const glassCard: React.CSSProperties = {
  background: aero.glassCard.background,
  border: `1px solid ${aero.glassCard.border}`,
  boxShadow: aero.glassCard.shadow,
  backdropFilter: aero.glass.backdrop,
  WebkitBackdropFilter: aero.glass.backdrop,
};

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl p-4 flex items-start gap-3" style={glassCard}>
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
        style={{
          background: aero.gradientIcon,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
        }}
      >
        <span style={{ color: aero.text }}>{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold" style={{ color: aero.text }}>
          {title}
        </p>
        <p className="text-xs mt-1 leading-relaxed" style={{ color: aero.textMuted }}>
          {description}
        </p>
      </div>
    </div>
  );
}

function NavPreview({
  icon,
  label,
  description,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  badge?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={glassCard}>
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(110, 198, 232, 0.25)" }}
      >
        <span style={{ color: aero.skyDeep }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold" style={{ color: aero.text }}>
          {label}
        </p>
        <p className="text-xs mt-0.5 leading-snug" style={{ color: aero.textMuted }}>
          {description}
        </p>
      </div>
      {badge && (
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 uppercase tracking-wide"
          style={{
            background: "rgba(91, 199, 122, 0.25)",
            color: aero.grass,
            border: "1px solid rgba(91, 199, 122, 0.4)",
          }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

function StepCard({
  number,
  title,
  desc,
}: {
  number: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl p-4" style={glassCard}>
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm"
        style={{
          background: aero.gradientBtn,
          color: aero.text,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
        }}
      >
        {number}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold" style={{ color: aero.text }}>
          {title}
        </p>
        <p className="text-xs mt-1 leading-relaxed" style={{ color: aero.textMuted }}>
          {desc}
        </p>
      </div>
    </div>
  );
}

export function OnboardingFlow() {
  const { user, completeOnboarding } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState("");

  const firstName = user?.name.split(" ")[0] ?? "there";

  const handleFinish = async (withTour: boolean) => {
    setError("");
    setFinishing(true);

    if (withTour) {
      setTourPending();
      setFinishing(false);
      navigate("/dashboard?tour=1", { replace: true });
      return;
    }

    const err = await completeOnboarding();
    if (err) {
      setError(err);
      setFinishing(false);
      return;
    }
    navigate("/dashboard", { replace: true });
  };

  const handleSkipAll = async () => {
    setError("");
    setFinishing(true);
    const err = await completeOnboarding();
    if (err) {
      setError(err);
      setFinishing(false);
      return;
    }
    navigate("/dashboard", { replace: true });
  };

  const steps: Step[] = [
    {
      id: "welcome",
      title: `Welcome, ${firstName}!`,
      subtitle: "A solarpunk time bank — trade skills with hours, not money.",
      content: (
        <div className="space-y-4">
          <div
            className="rounded-2xl p-6 text-center"
            style={{
              ...glassCard,
              background: "rgba(255, 255, 255, 0.55)",
            }}
          >
            <Logo size="lg" className="mx-auto mb-4 rounded-2xl shadow-md" />
            <p className="text-sm leading-relaxed" style={{ color: aero.textMuted }}>
              ChronoShare connects neighbors through a{" "}
              <strong style={{ color: aero.text }}>shared hour economy</strong>. Offer skills,
              request help, and give back through the{" "}
              <strong style={{ color: aero.text }}>Community Pool</strong>.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "1 hr", label: "Starting balance" },
              { value: "0$", label: "Money involved" },
              { value: "∞", label: "Skills to trade" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl p-3 text-center" style={glassCard}>
                <p
                  className="text-xl font-bold"
                  style={{ fontFamily: "'DM Mono', monospace", color: aero.text }}
                >
                  {stat.value}
                </p>
                <p className="text-[10px] font-medium mt-1 uppercase tracking-wide" style={{ color: aero.textMuted }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "how-it-works",
      title: "How time banking works",
      subtitle: "Every exchange is tracked — both people confirm before hours move.",
      content: (
        <div className="space-y-2.5">
          <FeatureCard
            icon={<PlusCircle size={18} />}
            title="Offer your time"
            description="Post a skill — tutoring, repairs, design, rides. Earn hours when someone accepts your offer."
          />
          <FeatureCard
            icon={<Search size={18} />}
            title="Find what you need"
            description="Browse the Job Board or the nearby map on Home. Filter needs vs. offers and join an exchange."
          />
          <FeatureCard
            icon={<CheckCircle2 size={18} />}
            title="Both confirm, then settle"
            description="After you help each other, both people confirm in Profile. Hours transfer only once you're both satisfied."
          />
          <FeatureCard
            icon={<TrendingUp size={18} />}
            title="Track your activity"
            description="Home shows your balance and recent exchanges. Profile has your full history and stats."
          />
        </div>
      ),
    },
    {
      id: "community-pool",
      title: "The Community Pool",
      subtitle: "A solidarity fund — donate hours, earn access by helping others.",
      content: (
        <div className="space-y-2.5">
          <FeatureCard
            icon={<Gift size={18} />}
            title="Donate spare hours"
            description="Give hours back to the community when you're doing well. Donors get credit toward pool access."
          />
          <FeatureCard
            icon={<Handshake size={18} />}
            title="Give to get"
            description={`Help ${POOL_RULES.helpsRequired} people in ${POOL_RULES.lookbackDays} days to unlock a claim. Donations can reduce that requirement.`}
          />
          <FeatureCard
            icon={<HeartHandshake size={18} />}
            title="Weekend claim windows"
            description={`Eligible members can claim up to ${POOL_RULES.maxClaimPerWeek} hour per week during ${formatClaimWindowLabel()}.`}
          />
          <div
            className="rounded-2xl px-4 py-3 text-xs leading-relaxed"
            style={{
              ...glassCard,
              background: "rgba(91, 199, 122, 0.12)",
              border: "1px solid rgba(91, 199, 122, 0.35)",
              color: aero.textMuted,
            }}
          >
            <strong style={{ color: aero.grassDeep }}>Tip:</strong> The pool is separate from
            offer minting — it&apos;s a safety net for members who need a boost after contributing.
          </div>
        </div>
      ),
    },
    {
      id: "navigation",
      title: "Navigate the app",
      subtitle: "Everything lives in the sidebar — here's your map.",
      content: (
        <div className="space-y-2">
          <NavPreview
            icon={<Home size={16} />}
            label="Home"
            description="Nearby map, listings, balance, and recent exchanges."
          />
          <NavPreview
            icon={<Briefcase size={16} />}
            label="Job Board"
            description="Browse and join open needs and offers."
            badge="Live"
          />
          <NavPreview
            icon={<HeartHandshake size={16} />}
            label="Community Pool"
            description="Donate hours or claim from the solidarity fund."
            badge="New"
          />
          <NavPreview
            icon={<PlusCircle size={16} />}
            label="Post Request"
            description="Offer your skills or request help from others."
          />
          <NavPreview
            icon={<User size={16} />}
            label="Profile"
            description="Confirm exchanges, view history, and public profile."
          />
          <NavPreview
            icon={<SettingsIcon size={16} />}
            label="Settings"
            description="Privacy, notifications, and restart this tour anytime."
          />
        </div>
      ),
    },
    {
      id: "first-steps",
      title: "Your first steps",
      subtitle: "The fastest way to get value from ChronoShare.",
      content: (
        <div className="space-y-2.5">
          <StepCard
            number="1"
            title="Set your location"
            desc="Home uses your city to show nearby listings on the map. You can browse worldwide too."
          />
          <StepCard
            number="2"
            title="Browse the Job Board"
            desc="See what others need or offer. Join a listing that matches your skills or goals."
          />
          <StepCard
            number="3"
            title="Post your first offer"
            desc="Share a skill you can help with — even 30 minutes counts toward earning hours."
          />
          <StepCard
            number="4"
            title="Take the guided tour"
            desc="We'll walk through the real dashboard — map, pool, confirmations, and all."
          />
        </div>
      ),
    },
    {
      id: "ready",
      title: "You're all set!",
      subtitle: "Choose how you'd like to explore your new dashboard.",
      content: (
        <div className="space-y-4">
          <div
            className="rounded-2xl p-6 text-center"
            style={{
              ...glassCard,
              background: "rgba(255, 255, 255, 0.55)",
            }}
          >
            <Sparkles size={32} className="mx-auto mb-3" style={{ color: aero.aquaDeep }} />
            <p className="text-sm leading-relaxed" style={{ color: aero.textMuted }}>
              We recommend the{" "}
              <strong style={{ color: aero.text }}>guided tour</strong> — about a minute on your
              real dashboard, including the map, Community Pool, and confirmation flow.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleFinish(true)}
              disabled={finishing}
              className="rounded-2xl py-3 px-4 text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 shadow-sm"
              style={{
                background: aero.gradientBtn,
                color: aero.text,
                boxShadow: "0 4px 12px rgba(58,158,196,0.3), inset 0 1px 0 rgba(255,255,255,0.8)",
              }}
            >
              {finishing ? "Loading..." : "Take the tour"}
            </button>
            <button
              type="button"
              onClick={() => handleFinish(false)}
              disabled={finishing}
              className="rounded-2xl py-3 px-4 text-sm font-semibold transition-all hover:bg-white/60 active:scale-[0.98] disabled:opacity-60"
              style={{
                ...glassCard,
                color: aero.textMuted,
              }}
            >
              Skip to dashboard
            </button>
          </div>
        </div>
      ),
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div
      className="relative min-h-screen flex items-center justify-center px-4 py-10 overflow-hidden"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <AeroBackground />

      <div className="relative z-10 w-full max-w-lg">
        {/* Progress bar */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: aero.text }}>
              Step {step + 1} of {steps.length}
            </span>
            {!isLast && (
              <button
                onClick={handleSkipAll}
                disabled={finishing}
                className="text-xs font-medium transition-opacity hover:opacity-70"
                style={{ color: aero.textMuted }}
              >
                Skip onboarding
              </button>
            )}
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.45)",
              boxShadow: "inset 0 1px 3px rgba(58,158,196,0.15)",
            }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: aero.gradientProgress }}
            />
          </div>
        </div>

        {/* Main card */}
        <div
          className="rounded-3xl border overflow-hidden"
          style={{
            background: aero.glass.background,
            borderColor: aero.glass.border,
            boxShadow: aero.glass.shadow,
            backdropFilter: aero.glass.backdrop,
            WebkitBackdropFilter: aero.glass.backdrop,
          }}
        >
          <div
            className="h-1.5"
            style={{ background: aero.gradientProgress }}
          />

          <div className="p-7">
            <div className="mb-6">
              <h1 className="text-2xl font-bold" style={{ color: aero.text }}>
                {current.title}
              </h1>
              <p className="text-sm mt-1.5 leading-relaxed" style={{ color: aero.textMuted }}>
                {current.subtitle}
              </p>
            </div>

            {error && (
              <div
                className="mb-4 rounded-xl px-4 py-3 text-sm border"
                style={{
                  background: "rgba(239,68,68,0.12)",
                  borderColor: "rgba(239,68,68,0.3)",
                  color: "#B91C1C",
                }}
              >
                {error}
              </div>
            )}

            <div className="mb-7 max-h-[50vh] overflow-y-auto pr-1">{current.content}</div>

            {!isLast && (
              <div
                className="flex items-center justify-between gap-3 pt-5 border-t"
                style={{ borderColor: "rgba(255,255,255,0.5)" }}
              >
                <button
                  onClick={() => setStep((s) => s - 1)}
                  disabled={step === 0}
                  className="flex items-center gap-1.5 text-sm font-medium transition-opacity disabled:opacity-30 disabled:pointer-events-none"
                  style={{ color: aero.textMuted }}
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
                <button
                  onClick={() => setStep((s) => s + 1)}
                  className="flex items-center gap-1.5 rounded-2xl py-2.5 px-6 text-sm font-bold shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: aero.gradientBtn,
                    color: aero.text,
                    boxShadow: "0 4px 12px rgba(58,158,196,0.3), inset 0 1px 0 rgba(255,255,255,0.8)",
                  }}
                >
                  Continue
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
