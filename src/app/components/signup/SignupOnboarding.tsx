import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Handshake,
  Loader2,
  Mail,
  MapPin,
  Sparkles,
  Upload,
  User,
  X,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useAuth, getInitials } from "../../context/AuthContext";
import {
  getPasswordStrength,
  isUsernameAvailable,
  isValidUsername,
  updateProfileFields,
  uploadAvatar,
} from "../../../lib/profile";
import type { UserLocation } from "../../../lib/location";
import { LocationPicker } from "../LocationPicker";
import { setNewSignupTourPending } from "../../utils/onboarding";

const DRAFT_KEY = "chronoshare-signup-draft";

const STEPS = [
  { id: "welcome", label: "Welcome" },
  { id: "identity", label: "You" },
  { id: "account", label: "Account" },
  { id: "verify", label: "Verify" },
  { id: "photo", label: "Photo" },
  { id: "location", label: "Location" },
  { id: "done", label: "Ready" },
] as const;

interface SignupDraft {
  step: number;
  name: string;
  username: string;
  email: string;
  emailVerified?: boolean;
}

function computeInitialStep(draft: SignupDraft | null, hasSession: boolean): number {
  if (hasSession) {
    return Math.max(4, draft?.step ?? 4);
  }
  return draft?.step ?? 0;
}

function loadDraft(): SignupDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as SignupDraft) : null;
  } catch {
    return null;
  }
}

function saveDraft(draft: SignupDraft) {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

function clearDraft() {
  sessionStorage.removeItem(DRAFT_KEY);
}

const inputClass =
  "w-full rounded-xl px-4 py-3 text-sm text-white placeholder-[#4B5563] outline-none transition-all focus:ring-2 focus:ring-emerald-500/40";
const inputStyle = { background: "#111827", border: "1px solid #1F2937" } as const;

function ProgressBar({ step }: { step: number }) {
  const progress = ((step + 1) / STEPS.length) * 100;
  return (
    <div className="mb-8">
      <div className="flex justify-between text-[10px] uppercase tracking-wider text-[#6B7280] mb-2 px-1">
        {STEPS.map((s, i) => (
          <span
            key={s.id}
            className={`transition-colors ${i <= step ? "text-emerald-400" : ""}`}
          >
            {s.label}
          </span>
        ))}
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#1F2937" }}>
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, #10B981, #06B6D4)",
          }}
        />
      </div>
    </div>
  );
}

function StepShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-white mb-2">{title}</h2>
      <p className="text-sm text-[#9CA3AF] mb-6 leading-relaxed">{subtitle}</p>
      {children}
    </div>
  );
}

export function SignupOnboarding() {
  const { user, signup, signInAfterEmailConfirmation, resendSignupEmail, finishProfileSetup, refreshUser } =
    useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const draft = loadDraft();
  const hasSession = !!user;
  const initialStep = computeInitialStep(draft, hasSession);

  const [step, setStep] = useState(initialStep);
  const [name, setName] = useState(draft?.name ?? "");
  const [username, setUsername] = useState(draft?.username ?? "");
  const [email, setEmail] = useState(draft?.email ?? user?.email ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [usernameOk, setUsernameOk] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [emailVerified, setEmailVerified] = useState(
    draft?.emailVerified ?? hasSession,
  );
  const [resendCooldown, setResendCooldown] = useState(0);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [locationSaved, setLocationSaved] = useState(false);
  const [savedLocation, setSavedLocation] = useState<UserLocation | null>(null);

  const firstName = name.trim().split(" ")[0] || "friend";
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  useEffect(() => {
    saveDraft({ step, name, username, email, emailVerified });
  }, [step, name, username, email, emailVerified]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (!user || step !== 3) return;
    setEmailVerified(true);
    setStep(4);
  }, [user, step]);

  useEffect(() => {
    if (step !== 3 || emailVerified) return;
    const onFocus = () => {
      void refreshUser();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [step, emailVerified, refreshUser]);

  useEffect(() => {
    if (!username || !isValidUsername(username)) {
      setUsernameOk(null);
      return;
    }

    const timer = window.setTimeout(async () => {
      setCheckingUsername(true);
      const available = await isUsernameAvailable(username, user?.userId);
      setUsernameOk(available);
      setCheckingUsername(false);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [username, user?.userId]);

  const minStep = user && !user.profileSetupCompleted ? 4 : 0;

  const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => setStep((s) => Math.max(s - 1, minStep));

  const handleContinueAfterLink = async () => {
    if (!password) {
      setError("Password missing — go back and create your account again.");
      return;
    }

    setCheckingEmail(true);
    setError("");
    const err = await signInAfterEmailConfirmation(email, password);
    setCheckingEmail(false);

    if (err) {
      setError(err);
      return;
    }

    setEmailVerified(true);
    setStep(4);
  };

  const handleCreateAccount = async () => {
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!usernameOk) {
      setError("Choose an available username.");
      return;
    }

    setLoading(true);
    const result = await signup({ name, username, email, password });
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.needsEmailVerification) {
      setResendCooldown(60);
      goNext();
    } else {
      setEmailVerified(true);
      setStep(4);
    }
  };

  const handleResendLink = async () => {
    if (resendCooldown > 0 || emailVerified) return;
    setError("");
    setLoading(true);
    const err = await resendSignupEmail(email);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    setResendCooldown(60);
  };

  const handlePhotoContinue = async (skipped: boolean) => {
    setError("");
    if (skipped || !avatarFile || !user) {
      goNext();
      return;
    }

    setLoading(true);
    try {
      const url = await uploadAvatar(user.userId, avatarFile);
      await updateProfileFields(user.userId, { avatarUrl: url });
      await refreshUser();
      goNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload photo.");
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSaved = (location: UserLocation) => {
    setSavedLocation(location);
    setLocationSaved(true);
  };

  const handleFinish = useCallback(async () => {
    setError("");
    setLoading(true);

    const err = await finishProfileSetup();
    if (err) {
      setError(err);
      setLoading(false);
      return;
    }

    clearDraft();
    setNewSignupTourPending();

    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.65 },
      colors: ["#10B981", "#06B6D4", "#ffffff"],
    });

    window.setTimeout(() => {
      navigate("/dashboard", { replace: true });
    }, 1200);
  }, [finishProfileSetup, navigate]);

  const handleAvatarChange = (file: File | null) => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(file ? URL.createObjectURL(file) : null);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "radial-gradient(ellipse at top, #0f1e2e 0%, #0B0F19 50%, #050810 100%)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #10B981, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 -left-24 w-80 h-80 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #06B6D4, transparent 70%)" }}
        />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-5 max-w-2xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-2 group">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #10B981, #06B6D4)" }}
          >
            <Clock size={18} style={{ color: "#000" }} />
          </div>
          <span className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
            ChronoShare
          </span>
        </Link>
        {step > 0 && step < STEPS.length - 1 && (
          <Link to="/login" className="text-xs text-[#9CA3AF] hover:text-white transition-colors">
            Already have an account?
          </Link>
        )}
      </header>

      <main className="relative z-10 flex-1 flex items-start justify-center px-4 pb-12">
        <div className="w-full max-w-lg">
          {step < STEPS.length - 1 && <ProgressBar step={step} />}

          <div
            className="rounded-3xl border p-6 sm:p-8"
            style={{
              background: "rgba(17, 24, 39, 0.85)",
              borderColor: "#1F2937",
              boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
            }}
          >
            {error && (
              <div
                className="rounded-xl px-4 py-3 text-sm text-red-400 border mb-5"
                style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)" }}
              >
                {error}
              </div>
            )}

            {step === 0 && (
              <StepShell
                title="Trade time, not money"
                subtitle="Join a community where skills are exchanged in hours. Help a neighbor, earn time credits, and get help when you need it."
              >
                <div className="grid gap-3 mb-8">
                  {[
                    {
                      icon: <Handshake size={18} className="text-emerald-400" />,
                      title: "Real people, real skills",
                      desc: "Tutoring, tech help, rides, design — whatever your community offers.",
                    },
                    {
                      icon: <Sparkles size={18} className="text-cyan-400" />,
                      title: "Start with 1 free hour",
                      desc: "Every new member gets an hour in the bank to kick things off.",
                    },
                    {
                      icon: <MapPin size={18} className="text-emerald-400" />,
                      title: "Local by design",
                      desc: "Find listings near you on an interactive map.",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="flex items-start gap-3 rounded-2xl p-4 border transition-colors hover:border-emerald-500/30"
                      style={{ background: "#0B0F19", borderColor: "#1F2937" }}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(16,185,129,0.1)" }}
                      >
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{item.title}</p>
                        <p className="text-xs text-[#9CA3AF] mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={goNext}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99]"
                  style={{ background: "linear-gradient(135deg, #10B981, #06B6D4)", color: "#000" }}
                >
                  Let&apos;s set up your account
                  <ArrowRight size={16} />
                </button>
              </StepShell>
            )}

            {step === 1 && (
              <StepShell
                title="First, tell us about you"
                subtitle="Your name and username are how the community will recognize you."
              >
                <div className="space-y-4 mb-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">
                      Full name
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Johnson"
                      className={inputClass}
                      style={inputStyle}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">
                      Username
                    </label>
                    <div className="relative">
                      <AtSign
                        size={14}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280]"
                      />
                      <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                        placeholder="alex_j"
                        className={`${inputClass} pl-9`}
                        style={inputStyle}
                        maxLength={20}
                      />
                    </div>
                    <p className="text-[11px] text-[#6B7280] pl-1">
                      3–20 characters · letters, numbers, underscores
                    </p>
                    {username && (
                      <p
                        className={`text-xs pl-1 flex items-center gap-1 ${
                          checkingUsername
                            ? "text-[#9CA3AF]"
                            : usernameOk
                              ? "text-emerald-400"
                              : "text-red-400"
                        }`}
                      >
                        {checkingUsername ? (
                          <>
                            <Loader2 size={12} className="animate-spin" /> Checking...
                          </>
                        ) : usernameOk ? (
                          <>
                            <Check size={12} /> @{username} is available
                          </>
                        ) : isValidUsername(username) ? (
                          <>@{username} is taken</>
                        ) : (
                          <>Enter a valid username</>
                        )}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={goBack}
                    className="px-5 py-3 rounded-full text-sm border text-[#9CA3AF] hover:text-white transition-colors"
                    style={{ borderColor: "#374151" }}
                  >
                    <ArrowLeft size={16} className="inline mr-1" />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={!name.trim() || !usernameOk}
                    className="flex-1 py-3 rounded-full text-sm font-semibold disabled:opacity-40 transition-all"
                    style={{ background: "#10B981", color: "#000" }}
                  >
                    Continue
                  </button>
                </div>
              </StepShell>
            )}

            {step === 2 && (
              <StepShell
                title={`Nice to meet you, ${firstName}!`}
                subtitle="Create your login credentials. You'll use these to sign in from any device."
              >
                <div className="space-y-4 mb-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={inputClass}
                      style={inputStyle}
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className={inputClass}
                      style={inputStyle}
                      autoComplete="new-password"
                    />
                    {password && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-[11px]">
                          <span style={{ color: passwordStrength.color }}>{passwordStrength.label}</span>
                          <span className="text-[#6B7280]">{password.length} chars</span>
                        </div>
                        <div className="h-1 rounded-full overflow-hidden" style={{ background: "#1F2937" }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${(passwordStrength.score / 5) * 100}%`,
                              background: passwordStrength.color,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">
                      Confirm password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className={inputClass}
                      style={inputStyle}
                      autoComplete="new-password"
                    />
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-xs text-red-400 pl-1">Passwords do not match</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={goBack}
                    className="px-5 py-3 rounded-full text-sm border text-[#9CA3AF]"
                    style={{ borderColor: "#374151" }}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateAccount}
                    disabled={loading || !email || password.length < 6 || password !== confirmPassword}
                    className="flex-1 py-3 rounded-full text-sm font-semibold disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg, #10B981, #06B6D4)", color: "#000" }}
                  >
                    {loading ? "Creating account..." : "Continue — we'll email you a link"}
                  </button>
                </div>
              </StepShell>
            )}

            {step === 3 && (
              <StepShell
                title="Confirm your email"
                subtitle={`We sent a confirmation link to ${email}. Open it to verify your account, then return here to continue setup.`}
              >
                {emailVerified ? (
                  <div className="text-center py-6 mb-4">
                    <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-3" />
                    <p className="text-sm text-white font-medium">Email confirmed!</p>
                  </div>
                ) : (
                  <div className="space-y-4 mb-6">
                    <div
                      className="rounded-2xl p-5 border text-center"
                      style={{ background: "#0B0F19", borderColor: "#1F2937" }}
                    >
                      <Mail size={32} className="text-emerald-400 mx-auto mb-3" />
                      <p className="text-sm text-[#9CA3AF] leading-relaxed">
                        Check your inbox (and spam folder) for an email from ChronoShare with a
                        confirmation link. Click the link, then come back to this tab.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleContinueAfterLink}
                      disabled={checkingEmail || !password}
                      className="w-full py-3 rounded-full text-sm font-semibold disabled:opacity-40"
                      style={{ background: "#10B981", color: "#000" }}
                    >
                      {checkingEmail ? "Checking..." : "I've clicked the link — continue"}
                    </button>
                    <button
                      type="button"
                      onClick={handleResendLink}
                      disabled={loading || resendCooldown > 0}
                      className="w-full text-xs text-[#9CA3AF] hover:text-emerald-400 disabled:opacity-50 transition-colors"
                    >
                      {resendCooldown > 0
                        ? `Resend link in ${resendCooldown}s`
                        : "Didn't get it? Resend confirmation link"}
                    </button>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={goBack}
                    className="px-5 py-3 rounded-full text-sm border text-[#9CA3AF]"
                    style={{ borderColor: "#374151" }}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={!emailVerified}
                    className="flex-1 py-3 rounded-full text-sm font-semibold disabled:opacity-40"
                    style={{ background: "#10B981", color: "#000" }}
                  >
                    Continue
                  </button>
                </div>
              </StepShell>
            )}

            {step === 4 && (
              <StepShell
                title="Add a face to your profile"
                subtitle="A photo helps neighbors recognize you. Totally optional — you can always add one later."
              >
                <div className="flex flex-col items-center mb-6">
                  <div
                    className="relative w-28 h-28 rounded-full flex items-center justify-center overflow-hidden border-2 mb-4"
                    style={{
                      borderColor: avatarPreview ? "#10B981" : "#374151",
                      background: "linear-gradient(135deg, #10B981, #06B6D4)",
                    }}
                  >
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-black">
                        {name ? getInitials(name) : <User size={32} />}
                      </span>
                    )}
                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={() => handleAvatarChange(null)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center"
                      >
                        <X size={12} className="text-white" />
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => handleAvatarChange(e.target.files?.[0] ?? null)}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium border transition-all hover:border-emerald-500/50"
                    style={{ borderColor: "#374151", color: "#9CA3AF" }}
                  >
                    {avatarPreview ? <Camera size={14} /> : <Upload size={14} />}
                    {avatarPreview ? "Choose a different photo" : "Upload a photo"}
                  </button>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={goBack}
                    className="px-5 py-3 rounded-full text-sm border text-[#9CA3AF]"
                    style={{ borderColor: "#374151" }}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePhotoContinue(!avatarFile)}
                    disabled={loading}
                    className="flex-1 py-3 rounded-full text-sm font-semibold disabled:opacity-40"
                    style={{ background: "#10B981", color: "#000" }}
                  >
                    {loading ? "Uploading..." : avatarFile ? "Save & continue" : "Skip for now"}
                  </button>
                </div>
              </StepShell>
            )}

            {step === 5 && (
              <StepShell
                title="Where are you based?"
                subtitle="This powers your nearby map and local listings. Use detect as a shortcut — you confirm before we save."
              >
                <LocationPicker onSaved={handleLocationSaved} compact showSuccessMessage />
                <div className="flex gap-3 mt-4">
                  <button
                    type="button"
                    onClick={goBack}
                    className="px-5 py-3 rounded-full text-sm border text-[#9CA3AF]"
                    style={{ borderColor: "#374151" }}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={!locationSaved}
                    className="flex-1 py-3 rounded-full text-sm font-semibold disabled:opacity-40"
                    style={{ background: "#10B981", color: "#000" }}
                  >
                    {locationSaved ? "Continue" : "Save location to continue"}
                  </button>
                </div>
              </StepShell>
            )}

            {step === 6 && (
              <div className="text-center py-4">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{
                    background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,182,212,0.2))",
                    border: "2px solid rgba(16,185,129,0.4)",
                  }}
                >
                  <Sparkles size={36} className="text-emerald-400" />
                </div>
                <h2 className="text-2xl font-semibold text-white mb-2">
                  You&apos;re all set, {firstName}!
                </h2>
                <p className="text-sm text-[#9CA3AF] mb-2">
                  Welcome to ChronoShare
                  {user?.username ? `, @${user.username}` : ""}.
                </p>
                {savedLocation && (
                  <p className="text-xs text-emerald-400/80 mb-6 flex items-center justify-center gap-1">
                    <MapPin size={12} />
                    Listings near {savedLocation.city}, {savedLocation.state}
                  </p>
                )}
                <p className="text-sm text-[#9CA3AF] mb-8 leading-relaxed">
                  You start with <span className="text-emerald-400 font-medium">1 hour</span> in your
                  bank. Browse nearby listings or post your first offer — we&apos;ll show you around.
                </p>
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={loading}
                  className="w-full py-3.5 rounded-full text-sm font-semibold transition-all hover:scale-[1.01] disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #10B981, #06B6D4)", color: "#000" }}
                >
                  {loading ? "Opening dashboard..." : "Enter ChronoShare"}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
