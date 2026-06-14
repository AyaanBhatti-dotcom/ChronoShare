import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  Camera,
  Check,
  CheckCircle2,
  Handshake,
  HeartHandshake,
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
import { formatLocationLabel, type UserLocation } from "../../../lib/location";
import { LocationPicker } from "../LocationPicker";
import { LogoBrand } from "../Logo";
import {
  INSECURE_PASSWORD_MESSAGE,
  isPasswordInRockyou,
  preloadRockyouSet,
} from "../../../lib/password-leak-check";
import { setNewSignupTourPending } from "../../utils/onboarding";
import { aero } from "../onboarding/aeroTheme";

const STEPS = [
  { id: "welcome", label: "Welcome" },
  { id: "identity", label: "You" },
  { id: "account", label: "Account" },
  { id: "verify", label: "Verify" },
  { id: "photo", label: "Photo" },
  { id: "location", label: "Location" },
  { id: "done", label: "Ready" },
] as const;

function clearSignupDraft() {
  sessionStorage.removeItem("chronoshare-signup-draft");
}

function ProgressBar({ step }: { step: number }) {
  const progress = ((step + 1) / STEPS.length) * 100;
  return (
    <div className="mb-8">
      <p className="signup-progress-step sm:hidden">
        Step {step + 1} of {STEPS.length}
        <span className="signup-progress-label-active"> · {STEPS[step]?.label}</span>
      </p>
      <div className="signup-progress-labels hidden sm:flex">
        {STEPS.map((s, i) => (
          <span
            key={s.id}
            className={`transition-colors ${i <= step ? "signup-progress-label-active" : ""}`}
          >
            {s.label}
          </span>
        ))}
      </div>
      <div className="signup-progress-track">
        <div className="signup-progress-fill" style={{ width: `${progress}%` }} />
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
      <h2 className="signup-step-title">{title}</h2>
      <p className="signup-step-subtitle">{subtitle}</p>
      {children}
    </div>
  );
}

function SignupScene() {
  return (
    <div className="auth-aero-scene" aria-hidden="true">
      <div className="auth-aero-sky" />
      <div className="auth-aero-sun" />
      <div className="auth-aero-ocean" />
      <div className="auth-aero-wave auth-aero-wave-1" />
      <div className="auth-aero-wave auth-aero-wave-2" />
      <div className="auth-aero-shimmer" />
      <div className="auth-aero-shimmer-grid" />
      <div className="auth-aero-grass auth-aero-grass-back" />
      <div className="auth-aero-grass auth-aero-grass-front" />
      <div className="auth-aero-orb auth-aero-orb-aqua" />
      <div className="auth-aero-orb auth-aero-orb-grass" />
      <div className="auth-aero-spark auth-aero-spark-1" />
      <div className="auth-aero-spark auth-aero-spark-2" />
      <div className="auth-aero-spark auth-aero-spark-3" />
    </div>
  );
}

export function SignupOnboarding() {
  const { user, signup, signInAfterEmailConfirmation, resendSignupEmail, finishProfileSetup, refreshUser } =
    useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const resumingSetup = !!user && !user.profileSetupCompleted;
  const initialStep = resumingSetup ? 4 : 0;

  const [step, setStep] = useState(initialStep);
  const [name, setName] = useState(resumingSetup ? user!.name : "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [usernameOk, setUsernameOk] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [emailVerified, setEmailVerified] = useState(!!user);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [linkResent, setLinkResent] = useState(false);
  const [passwordInsecure, setPasswordInsecure] = useState(false);
  const [checkingPassword, setCheckingPassword] = useState(false);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [locationSaved, setLocationSaved] = useState(false);
  const [savedLocation, setSavedLocation] = useState<UserLocation | null>(null);

  const firstName = name.trim().split(" ")[0] || "friend";
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  useEffect(() => {
    clearSignupDraft();
    return () => {
      clearSignupDraft();
    };
  }, []);

  useEffect(() => {
    if (step !== 2) return;
    preloadRockyouSet();
  }, [step]);

  useEffect(() => {
    if (step !== 2 || !password) {
      setPasswordInsecure(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setCheckingPassword(true);
      try {
        const insecure = await isPasswordInRockyou(password);
        if (!cancelled) setPasswordInsecure(insecure);
      } catch {
        if (!cancelled) setPasswordInsecure(false);
      } finally {
        if (!cancelled) setCheckingPassword(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [password, step]);

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

    if (result.warning) {
      setError(result.warning);
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
    setLinkResent(false);
    setLoading(true);
    const err = await resendSignupEmail(email);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    setLinkResent(true);
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

    clearSignupDraft();
    setNewSignupTourPending();

    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.65 },
      colors: [aero.grass, aero.aqua, aero.sky, aero.sun, "#ffffff"],
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
    <div className="auth-aero-page signup-aero-page min-h-screen flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <SignupScene />

      <header className="signup-header auth-aero-content">
        <Link to="/" className="signup-brand">
          <LogoBrand size="sm" nameClassName="signup-brand-name" />
        </Link>
        {step > 0 && step < STEPS.length - 1 && (
          <Link to="/login" className="signup-header-link">
            Already have an account?
          </Link>
        )}
      </header>

      <main className="signup-main auth-aero-content">
        <div className="signup-shell">
          {step < STEPS.length - 1 && <ProgressBar step={step} />}

          <div className="auth-glass-card p-6 sm:p-8">
            {error && <div className="auth-alert-error mb-5">{error}</div>}

            {step === 0 && (
              <StepShell
                title="Trade time, not money"
                subtitle="Join a solarpunk community where skills flow in hours — help neighbors, earn credits, and tap the Community Pool when you need a boost."
              >
                <div className="grid gap-3 mb-8">
                  {[
                    {
                      icon: <Handshake size={18} />,
                      title: "Real people, real skills",
                      desc: "Tutoring, tech help, rides, design — whatever your community offers.",
                    },
                    {
                      icon: <MapPin size={18} />,
                      title: "Nearby map on Home",
                      desc: "See listings around you on an interactive map, or browse worldwide.",
                    },
                    {
                      icon: <HeartHandshake size={18} />,
                      title: "Community Pool",
                      desc: "Donate spare hours or claim from the pool after helping others — a safety net for the community.",
                    },
                    {
                      icon: <Sparkles size={18} />,
                      title: "Start with 1 free hour",
                      desc: "Every new member gets an hour in the bank. Both sides confirm before hours move.",
                    },
                  ].map((item) => (
                    <div key={item.title} className="signup-feature-card">
                      <div className="signup-feature-icon">{item.icon}</div>
                      <div>
                        <p className="signup-feature-title">{item.title}</p>
                        <p className="signup-feature-desc">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={goNext} className="auth-btn-primary flex items-center justify-center gap-2">
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
                    <label className="auth-label">Full name</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Johnson"
                      className="auth-input"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="auth-label">Username</label>
                    <div className="relative">
                      <AtSign size={14} className="signup-input-icon" />
                      <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                        placeholder="alex_j"
                        className="auth-input signup-input-with-icon"
                        maxLength={20}
                      />
                    </div>
                    <p className="text-[11px] signup-status-muted pl-1">
                      3–20 characters · letters, numbers, underscores
                    </p>
                    {username && (
                      <p
                        className={`text-xs pl-1 flex items-center gap-1 ${
                          checkingUsername
                            ? "signup-status-muted"
                            : usernameOk
                              ? "signup-status-ok"
                              : "signup-status-error"
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
                <div className="signup-btn-row">
                  <button type="button" onClick={goBack} className="signup-btn-back">
                    <ArrowLeft size={16} />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={!name.trim() || !usernameOk}
                    className="auth-btn-primary"
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
                    <label className="auth-label">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="auth-input"
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="auth-label">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="auth-input"
                      autoComplete="new-password"
                    />
                    {password && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-[11px]">
                          <span style={{ color: passwordStrength.color }}>{passwordStrength.label}</span>
                          <span className="signup-status-muted">{password.length} chars</span>
                        </div>
                        <div className="signup-strength-track">
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
                    {passwordInsecure && (
                      <p className="text-xs signup-status-error pl-1">{INSECURE_PASSWORD_MESSAGE}</p>
                    )}
                    {checkingPassword && password && !passwordInsecure && (
                      <p className="text-xs signup-status-muted pl-1">Checking password safety...</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="auth-label">Confirm password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="auth-input"
                      autoComplete="new-password"
                    />
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-xs signup-status-error pl-1">Passwords do not match</p>
                    )}
                  </div>
                </div>
                <div className="signup-btn-row">
                  <button type="button" onClick={goBack} className="signup-btn-back">
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateAccount}
                    disabled={
                      loading ||
                      checkingPassword ||
                      passwordInsecure ||
                      !email ||
                      password.length < 6 ||
                      password !== confirmPassword
                    }
                    className="auth-btn-primary"
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
                    <CheckCircle2 size={48} className="signup-status-ok mx-auto mb-3" />
                    <p className="text-sm auth-aero-title font-semibold">Email confirmed!</p>
                  </div>
                ) : (
                  <div className="space-y-4 mb-6">
                    <div className="signup-inner-panel">
                      <Mail size={32} className="mx-auto mb-3" />
                      <p className="text-sm signup-step-subtitle mb-0 leading-relaxed">
                        Check your inbox (and spam folder) for an email from{" "}
                        <span className="auth-aero-title font-medium">noreply@mail.app.supabase.io</span> with a
                        confirmation link. Proton and other providers sometimes delay or filter
                        these — also check All Mail.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleContinueAfterLink}
                      disabled={checkingEmail || !password}
                      className="auth-btn-primary"
                    >
                      {checkingEmail ? "Checking..." : "I've clicked the link — continue"}
                    </button>
                    <button
                      type="button"
                      onClick={handleResendLink}
                      disabled={loading || resendCooldown > 0}
                      className="signup-text-btn"
                    >
                      {resendCooldown > 0
                        ? `Resend link in ${resendCooldown}s`
                        : "Didn't get it? Resend confirmation link"}
                    </button>
                    {linkResent && (
                      <p className="text-xs signup-status-ok text-center">
                        Link sent again — check spam and wait a minute.
                      </p>
                    )}
                    <p className="text-xs signup-status-muted text-center">
                      Already have an account?{" "}
                      <Link to="/login" className="auth-link">
                        Sign in instead
                      </Link>
                    </p>
                  </div>
                )}
                <div className="signup-btn-row">
                  <button type="button" onClick={goBack} className="signup-btn-back">
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={!emailVerified}
                    className="auth-btn-primary"
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
                  <div className="signup-avatar-ring">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" />
                    ) : (
                      <span className="signup-avatar-initials">
                        {name ? getInitials(name) : <User size={32} />}
                      </span>
                    )}
                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={() => handleAvatarChange(null)}
                        className="signup-avatar-remove"
                      >
                        <X size={12} />
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
                    className="signup-upload-btn"
                  >
                    {avatarPreview ? <Camera size={14} /> : <Upload size={14} />}
                    {avatarPreview ? "Choose a different photo" : "Upload a photo"}
                  </button>
                </div>
                <div className="signup-btn-row">
                  <button type="button" onClick={goBack} className="signup-btn-back">
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePhotoContinue(!avatarFile)}
                    disabled={loading}
                    className="auth-btn-primary"
                  >
                    {loading ? "Uploading..." : avatarFile ? "Save & continue" : "Skip for now"}
                  </button>
                </div>
              </StepShell>
            )}

            {step === 5 && (
              <StepShell
                title="Where are you based?"
                subtitle="This powers your nearby map and local listings. Search any city worldwide, or use detect as a shortcut."
              >
                <LocationPicker onSaved={handleLocationSaved} compact showSuccessMessage />
                <div className="signup-btn-row mt-4">
                  <button type="button" onClick={goBack} className="signup-btn-back">
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={!locationSaved}
                    className="auth-btn-primary"
                  >
                    {locationSaved ? "Continue" : "Save location to continue"}
                  </button>
                </div>
              </StepShell>
            )}

            {step === 6 && (
              <div className="text-center py-4">
                <div className="signup-done-icon">
                  <Sparkles size={36} />
                </div>
                <h2 className="signup-step-title text-center">You&apos;re all set, {firstName}!</h2>
                <p className="signup-step-subtitle text-center mb-2">
                  Welcome to ChronoShare
                  {user?.username ? `, @${user.username}` : ""}.
                </p>
                {savedLocation && (
                  <p className="signup-location-tag">
                    <MapPin size={12} />
                    Based in {formatLocationLabel(savedLocation)}
                  </p>
                )}
                <p className="signup-step-subtitle text-center mb-8">
                  You start with <span className="signup-highlight">1 hour</span> in your
                  bank. We&apos;ll show you the map, Job Board, and Community Pool on a quick tour.
                </p>
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={loading}
                  className="auth-btn-primary"
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
