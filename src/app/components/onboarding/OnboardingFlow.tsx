import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Clock,
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
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ShaderBackground } from "../ui/shader-background";

interface Step {
  id: string;
  title: string;
  subtitle: string;
  content: React.ReactNode;
}

const gradientBtn =
  "rounded-xl py-2.5 px-5 text-sm font-semibold transition-opacity disabled:opacity-60";
const gradientBtnStyle = {
  background: "linear-gradient(135deg, #10B981, #06B6D4)",
  color: "#000",
};

const cardStyle = {
  background: "#111827",
  borderColor: "#1F2937",
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
    <div className="rounded-xl p-4 border flex items-start gap-3" style={cardStyle}>
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.2)" }}
      >
        <span className="text-emerald-400">{icon}</span>
      </div>
      <div>
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="text-xs text-[#9CA3AF] mt-0.5 leading-relaxed">{description}</p>
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
    <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 border" style={cardStyle}>
      <span className="text-emerald-400">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-[#9CA3AF]">{description}</p>
      </div>
      {badge && (
        <span
          className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
          style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

export function OnboardingFlow() {
  const { user, completeOnboarding } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [finishing, setFinishing] = useState(false);

  const firstName = user?.name.split(" ")[0] ?? "there";

  const steps: Step[] = [
    {
      id: "welcome",
      title: `Welcome, ${firstName}!`,
      subtitle: "You're about to join a community that trades skills with time, not money.",
      content: (
        <div className="space-y-4">
          <div
            className="rounded-2xl p-6 border text-center"
            style={{ background: "rgba(16,185,129,0.06)", borderColor: "rgba(16,185,129,0.2)" }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "linear-gradient(135deg, #10B981, #06B6D4)" }}
            >
              <Clock size={28} style={{ color: "#000" }} />
            </div>
            <p className="text-sm text-[#D1D5DB] leading-relaxed">
              ChronoShare lets you <strong className="text-white">offer your skills</strong> to earn
              time credits, then <strong className="text-white">spend those hours</strong> getting help
              from others in the community.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { value: "1 hr", label: "Starting balance" },
              { value: "0$", label: "Money involved" },
              { value: "∞", label: "Skills to trade" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl p-3 border" style={cardStyle}>
                <p
                  className="text-lg font-semibold text-white"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {stat.value}
                </p>
                <p className="text-[10px] text-[#9CA3AF] mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "how-it-works",
      title: "How time banking works",
      subtitle: "Every exchange is tracked in your personal hour balance.",
      content: (
        <div className="space-y-3">
          <FeatureCard
            icon={<PlusCircle size={18} />}
            title="Offer your time"
            description="Post a skill you can help with — tutoring, design, repairs, coding, and more. Set how many hours it's worth."
          />
          <FeatureCard
            icon={<Search size={18} />}
            title="Find what you need"
            description="Browse the Job Board for people offering skills or requesting help. Match with someone and start an exchange."
          />
          <FeatureCard
            icon={<Handshake size={18} />}
            title="Complete the exchange"
            description="When you help someone, you earn hours. When someone helps you, hours are deducted from your balance."
          />
          <FeatureCard
            icon={<TrendingUp size={18} />}
            title="Track your activity"
            description="Your dashboard shows hours earned vs. spent, active exchanges, and your full history on your profile."
          />
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
            icon={<Home size={18} />}
            label="Home"
            description="Your dashboard — hour balance, charts, and recent exchanges at a glance."
          />
          <NavPreview
            icon={<Briefcase size={18} />}
            label="Job Board"
            description="Browse active posts from the community. Filter by needs and offers."
            badge="Live"
          />
          <NavPreview
            icon={<PlusCircle size={18} />}
            label="Post Request"
            description="Create a new post — offer your skills or request help from others."
          />
          <NavPreview
            icon={<User size={18} />}
            label="Profile"
            description="View your exchange history, ratings, and public profile."
          />
          <NavPreview
            icon={<SettingsIcon size={18} />}
            label="Settings"
            description="Manage notifications, privacy, and account preferences."
          />
        </div>
      ),
    },
    {
      id: "first-steps",
      title: "Your first steps",
      subtitle: "Here's the fastest way to get value from ChronoShare.",
      content: (
        <div className="space-y-3">
          {[
            {
              step: "1",
              title: "Check your hour balance",
              desc: "You start with 1 hour in your time bank. It's shown in the sidebar and on your dashboard.",
            },
            {
              step: "2",
              title: "Browse the Job Board",
              desc: "See what others are offering or needing. This is where exchanges begin.",
            },
            {
              step: "3",
              title: "Post your first offer",
              desc: "Share a skill you can help with — even 30 minutes counts. The more you offer, the more you can request.",
            },
            {
              step: "4",
              title: "Take the guided tour",
              desc: "We'll walk you through the real dashboard and highlight each area so you know exactly where to click.",
            },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3 rounded-xl p-4 border" style={cardStyle}>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #10B981, #06B6D4)", color: "#000" }}
              >
                {item.step}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{item.title}</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
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
            className="rounded-2xl p-6 border text-center"
            style={{ background: "rgba(6,182,212,0.06)", borderColor: "rgba(6,182,212,0.2)" }}
          >
            <Sparkles size={32} className="text-cyan-400 mx-auto mb-3" />
            <p className="text-sm text-[#D1D5DB] leading-relaxed">
              We recommend the <strong className="text-white">guided tour</strong> — it takes about
              a minute and shows you exactly where everything is in the real app.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleFinish(true)}
              disabled={finishing}
              className={`${gradientBtn} w-full`}
              style={gradientBtnStyle}
            >
              {finishing ? "Loading..." : "Take the tour"}
            </button>
            <button
              onClick={() => handleFinish(false)}
              disabled={finishing}
              className="rounded-xl py-2.5 px-5 text-sm font-medium text-[#9CA3AF] border transition-colors hover:text-white hover:border-[#374151] w-full"
              style={{ background: "#111827", borderColor: "#1F2937" }}
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

  const handleFinish = async (withTour: boolean) => {
    setFinishing(true);
    const err = await completeOnboarding();
    if (err) {
      setFinishing(false);
      return;
    }
    navigate(withTour ? "/dashboard?tour=1" : "/dashboard", { replace: true });
  };

  const handleSkipAll = async () => {
    setFinishing(true);
    const err = await completeOnboarding();
    if (!err) navigate("/dashboard", { replace: true });
    setFinishing(false);
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center px-4 py-10 overflow-hidden"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <ShaderBackground />

      <div className="relative z-10 w-full max-w-lg">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#9CA3AF]">
              Step {step + 1} of {steps.length}
            </span>
            {!isLast && (
              <button
                onClick={handleSkipAll}
                disabled={finishing}
                className="text-xs text-[#6B7280] hover:text-[#9CA3AF] transition-colors"
              >
                Skip onboarding
              </button>
            )}
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "#1F2937" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #10B981, #06B6D4)",
              }}
            />
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border p-8"
          style={{ background: "#0D1220", borderColor: "#1F2937" }}
        >
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-white">{current.title}</h1>
            <p className="text-sm text-[#9CA3AF] mt-1">{current.subtitle}</p>
          </div>

          <div className="mb-8">{current.content}</div>

          {!isLast && (
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => setStep((s) => s - 1)}
                disabled={step === 0}
                className="flex items-center gap-1.5 text-sm text-[#9CA3AF] hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <ArrowLeft size={16} />
                Back
              </button>
              <button
                onClick={() => setStep((s) => s + 1)}
                className={`${gradientBtn} flex items-center gap-1.5`}
                style={gradientBtnStyle}
              >
                Continue
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
