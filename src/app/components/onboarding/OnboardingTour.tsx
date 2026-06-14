import { useEffect, useState, useCallback, useRef, useLayoutEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, ArrowRight, ArrowLeft } from "lucide-react";
import { aero } from "./aeroTheme";

export interface TourStep {
  target?: string;
  title: string;
  description: string;
  position?: "right" | "bottom" | "top" | "left";
  onEnter?: () => void;
}

interface OnboardingTourProps {
  steps: TourStep[];
  onComplete: () => void;
  onSkip: () => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const CARD_WIDTH_MAX = 320;
const VIEWPORT_PAD = 16;
const SPOTLIGHT_PAD = 8;
const GAP = 20;

function getCardWidth() {
  return Math.min(window.innerWidth - VIEWPORT_PAD * 2, CARD_WIDTH_MAX);
}

function getTargetRect(selector: string): Rect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 1 || r.height < 1) return null;
  return {
    top: Math.round(r.top),
    left: Math.round(r.left),
    width: Math.round(r.width),
    height: Math.round(r.height),
  };
}

/** Sidebar slide-in uses 300ms; allow extra time before giving up on a target. */
const MEASURE_DELAYS_MS = [0, 50, 150, 350, 500, 750];

function isRectVisible(rect: Rect): boolean {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return (
    rect.left + rect.width > 0 &&
    rect.top + rect.height > 0 &&
    rect.left < vw &&
    rect.top < vh
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function rectsEqual(a: Rect | null, b: Rect | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height;
}

function posEqual(a: { top: number; left: number }, b: { top: number; left: number }) {
  return a.top === b.top && a.left === b.left;
}

function computeCardPosition(
  spotlight: Rect,
  preferred: TourStep["position"],
  cardW: number,
  cardH: number,
): { top: number; left: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const candidates: { pos: NonNullable<TourStep["position"]>; top: number; left: number }[] = [];
  const add = (pos: NonNullable<TourStep["position"]>, top: number, left: number) => {
    candidates.push({ pos, top, left });
  };

  add("right", spotlight.top, spotlight.left + spotlight.width + GAP);
  add("bottom", spotlight.top + spotlight.height + GAP, spotlight.left + spotlight.width / 2 - cardW / 2);
  add("top", spotlight.top - cardH - GAP, spotlight.left + spotlight.width / 2 - cardW / 2);
  add("left", spotlight.top, spotlight.left - cardW - GAP);

  const order: NonNullable<TourStep["position"]>[] = [
    preferred ?? "right",
    "bottom",
    "left",
    "top",
    "right",
  ];

  const sorted = [...candidates].sort((a, b) => {
    const ai = order.indexOf(a.pos);
    const bi = order.indexOf(b.pos);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const seen = new Set<string>();
  for (const c of sorted) {
    if (seen.has(c.pos)) continue;
    seen.add(c.pos);

    const top = clamp(c.top, VIEWPORT_PAD, vh - cardH - VIEWPORT_PAD);
    const left = clamp(c.left, VIEWPORT_PAD, vw - cardW - VIEWPORT_PAD);

    if (top + cardH <= vh - VIEWPORT_PAD && left + cardW <= vw - VIEWPORT_PAD) {
      return { top, left };
    }
  }

  return {
    top: clamp(vh / 2 - cardH / 2, VIEWPORT_PAD, vh - cardH - VIEWPORT_PAD),
    left: clamp(vw / 2 - cardW / 2, VIEWPORT_PAD, vw - cardW - VIEWPORT_PAD),
  };
}

function centeredCardPos(): { top: number; left: number } {
  const cardW = getCardWidth();
  return {
    top: clamp(window.innerHeight / 2 - 120, VIEWPORT_PAD, window.innerHeight - 300),
    left: clamp(
      window.innerWidth / 2 - cardW / 2,
      VIEWPORT_PAD,
      window.innerWidth - cardW - VIEWPORT_PAD,
    ),
  };
}

export function OnboardingTour({ steps, onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [cardPos, setCardPos] = useState(centeredCardPos);
  const cardRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef(steps);
  stepsRef.current = steps;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  const measureTarget = useCallback((stepIndex: number) => {
    const s = stepsRef.current[stepIndex];
    if (!s?.target) {
      setTargetRect(null);
      return;
    }
    let r = getTargetRect(s.target);
    if (!r || !isRectVisible(r)) {
      const el = document.querySelector(s.target);
      if (el) {
        el.scrollIntoView({ block: "nearest", inline: "nearest" });
        r = getTargetRect(s.target);
      }
    }
    setTargetRect((prev) => {
      const next = r && isRectVisible(r) ? r : null;
      return rectsEqual(prev, next) ? prev : next;
    });
  }, []);

  // Run onEnter first, then measure after layout settles (sidebar opens, screen changes, etc.)
  useEffect(() => {
    const stepIndex = currentStep;
    const s = stepsRef.current[stepIndex];

    setTargetRect(null);
    s?.onEnter?.();

    const measure = () => measureTarget(stepIndex);

    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(measure);
    });

    const timers = MEASURE_DELAYS_MS.map((ms) => window.setTimeout(measure, ms));

    const onLayoutChange = () => measure();
    window.addEventListener("resize", onLayoutChange);
    window.addEventListener("scroll", onLayoutChange, true);
    window.addEventListener("tour-layout-change", onLayoutChange);

    return () => {
      cancelAnimationFrame(rafId);
      timers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener("resize", onLayoutChange);
      window.removeEventListener("scroll", onLayoutChange, true);
      window.removeEventListener("tour-layout-change", onLayoutChange);
    };
  }, [currentStep, measureTarget]);

  const spotlight = useMemo<Rect | null>(() => {
    if (!targetRect) return null;
    return {
      top: targetRect.top - SPOTLIGHT_PAD,
      left: targetRect.left - SPOTLIGHT_PAD,
      width: targetRect.width + SPOTLIGHT_PAD * 2,
      height: targetRect.height + SPOTLIGHT_PAD * 2,
    };
  }, [targetRect]);

  const spotlightKey = spotlight
    ? `${spotlight.top},${spotlight.left},${spotlight.width},${spotlight.height}`
    : "center";

  useLayoutEffect(() => {
    if (!cardRef.current) return;

    const next = !spotlight
      ? centeredCardPos()
      : computeCardPosition(
          spotlight,
          step?.position,
          getCardWidth(),
          cardRef.current.offsetHeight,
        );

    setCardPos((prev) => (posEqual(prev, next) ? prev : next));
  }, [spotlightKey, currentStep, step?.position]);

  const goNext = () => {
    if (isLast) onComplete();
    else setCurrentStep((s) => s + 1);
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  if (!step) return null;

  const content = (
    <div
      className="fixed inset-0"
      style={{ zIndex: 9999, fontFamily: "'Inter', sans-serif" }}
    >
      {spotlight ? (
        <>
          <div
            className="fixed pointer-events-none rounded-xl"
            style={{
              top: spotlight.top,
              left: spotlight.left,
              width: spotlight.width,
              height: spotlight.height,
              boxShadow: `0 0 0 9999px ${aero.overlay}`,
              zIndex: 9999,
            }}
          />
          <div
            className="fixed pointer-events-none rounded-xl"
            style={{
              top: spotlight.top,
              left: spotlight.left,
              width: spotlight.width,
              height: spotlight.height,
              boxShadow: aero.spotlightRing,
              zIndex: 10000,
            }}
          />
        </>
      ) : (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{ background: aero.overlay, zIndex: 9999 }}
        />
      )}

      <div
        ref={cardRef}
        className="fixed flex flex-col rounded-2xl border overflow-hidden pointer-events-auto"
        style={{
          top: cardPos.top,
          left: cardPos.left,
          width: getCardWidth(),
          maxWidth: `calc(100vw - ${VIEWPORT_PAD * 2}px)`,
          zIndex: 10001,
          background: aero.glass.background,
          borderColor: aero.glass.border,
          boxShadow: aero.glass.shadow,
          backdropFilter: aero.glass.backdrop,
          WebkitBackdropFilter: aero.glass.backdrop,
        }}
      >
        <div
          className="h-1 flex-shrink-0"
          style={{ background: aero.gradientProgress }}
        />

        <div className="p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p
                className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                style={{ color: aero.aquaDeep }}
              >
                Step {currentStep + 1} of {steps.length}
              </p>
              <h3 className="text-sm font-bold leading-snug" style={{ color: aero.text }}>
                {step.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={onSkip}
              className="flex-shrink-0 transition-colors"
              style={{ color: aero.textFaint }}
              aria-label="Skip tour"
            >
              <X size={16} />
            </button>
          </div>

          <p className="text-xs leading-relaxed" style={{ color: aero.textMuted }}>
            {step.description}
          </p>

          <div className="flex items-center gap-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: i === currentStep ? 16 : 6,
                  background:
                    i === currentStep
                      ? aero.aquaDeep
                      : i < currentStep
                        ? aero.grassLight
                        : "rgba(255,255,255,0.45)",
                }}
              />
            ))}
          </div>

          <div
            className="flex items-center justify-between gap-2 pt-3 border-t"
            style={{ borderColor: "rgba(255,255,255,0.55)" }}
          >
            <button
              type="button"
              onClick={goBack}
              disabled={currentStep === 0}
              className="flex items-center gap-1 text-xs transition-colors disabled:opacity-30 disabled:pointer-events-none"
              style={{ color: aero.textMuted }}
            >
              <ArrowLeft size={14} />
              Back
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onSkip}
                className="text-xs transition-colors px-2 py-1"
                style={{ color: aero.textFaint }}
              >
                Skip
              </button>
              <button
                type="button"
                onClick={goNext}
                className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold shadow-sm"
                style={{
                  background: aero.gradientBtn,
                  color: aero.text,
                  boxShadow: "0 4px 12px rgba(58,158,196,0.25), inset 0 1px 0 rgba(255,255,255,0.8)",
                }}
              >
                {isLast ? "Finish" : "Next"}
                {!isLast && <ArrowRight size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
