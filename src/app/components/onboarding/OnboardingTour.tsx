import { useEffect, useState, useCallback, useRef, useLayoutEffect } from "react";
import { X, ArrowRight, ArrowLeft } from "lucide-react";
import { aero } from "./aeroTheme";

export interface TourStep {
  target: string;
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

const CARD_WIDTH = 320;
const VIEWPORT_PAD = 16;
const SPOTLIGHT_PAD = 10;
const GAP = 20;

function getTargetRect(selector: string): Rect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function computeCardPosition(
  spotlight: Rect,
  preferred: TourStep["position"],
  cardW: number,
  cardH: number,
): { top: number; left: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const s = {
    top: spotlight.top - SPOTLIGHT_PAD,
    left: spotlight.left - SPOTLIGHT_PAD,
    width: spotlight.width + SPOTLIGHT_PAD * 2,
    height: spotlight.height + SPOTLIGHT_PAD * 2,
  };

  const candidates: { pos: NonNullable<TourStep["position"]>; top: number; left: number }[] = [];

  const add = (pos: NonNullable<TourStep["position"]>, top: number, left: number) => {
    candidates.push({ pos, top, left });
  };

  add("right", s.top, s.left + s.width + GAP);
  add("bottom", s.top + s.height + GAP, s.left + s.width / 2 - cardW / 2);
  add("top", s.top - cardH - GAP, s.left + s.width / 2 - cardW / 2);
  add("left", s.top, s.left - cardW - GAP);

  const order: NonNullable<TourStep["position"]>[] = [
    preferred ?? "right",
    "bottom",
    "right",
    "left",
    "top",
  ];
  const seen = new Set<string>();
  const sorted = candidates.sort((a, b) => {
    const ai = order.indexOf(a.pos);
    const bi = order.indexOf(b.pos);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  for (const c of sorted) {
    const key = `${c.pos}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const top = clamp(c.top, VIEWPORT_PAD, vh - cardH - VIEWPORT_PAD);
    const left = clamp(c.left, VIEWPORT_PAD, vw - cardW - VIEWPORT_PAD);

    const fitsVertically = top >= VIEWPORT_PAD && top + cardH <= vh - VIEWPORT_PAD;
    const fitsHorizontally = left >= VIEWPORT_PAD && left + cardW <= vw - VIEWPORT_PAD;

    if (fitsVertically && fitsHorizontally) {
      return { top, left };
    }
  }

  return {
    top: clamp(vh - cardH - VIEWPORT_PAD, VIEWPORT_PAD, vh - cardH - VIEWPORT_PAD),
    left: clamp(vw / 2 - cardW / 2, VIEWPORT_PAD, vw - cardW - VIEWPORT_PAD),
  };
}

export function OnboardingTour({ steps, onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [cardPos, setCardPos] = useState({ top: 0, left: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  const updateRect = useCallback(() => {
    if (!step) return;
    const r = getTargetRect(step.target);
    setRect(r);
  }, [step]);

  useEffect(() => {
    step?.onEnter?.();
    const timer = setTimeout(updateRect, 200);
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [step, updateRect]);

  const spotlight = rect
    ? {
        top: rect.top - SPOTLIGHT_PAD,
        left: rect.left - SPOTLIGHT_PAD,
        width: rect.width + SPOTLIGHT_PAD * 2,
        height: rect.height + SPOTLIGHT_PAD * 2,
      }
    : null;

  useLayoutEffect(() => {
    if (!spotlight || !cardRef.current) {
      setCardPos({
        top: window.innerHeight / 2 - 120,
        left: window.innerWidth / 2 - CARD_WIDTH / 2,
      });
      return;
    }
    const cardH = cardRef.current.offsetHeight;
    const pos = computeCardPosition(spotlight, step?.position, CARD_WIDTH, cardH);
    setCardPos(pos);
  }, [spotlight, step, currentStep]);

  const goNext = () => {
    if (isLast) onComplete();
    else setCurrentStep((s) => s + 1);
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  if (!step) return null;

  return (
    <div className="fixed inset-0 z-[100]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {spotlight && (
              <rect
                x={spotlight.left}
                y={spotlight.top}
                width={spotlight.width}
                height={spotlight.height}
                rx="14"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill={aero.overlay}
          mask="url(#tour-mask)"
        />
      </svg>

      <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />

      {spotlight && (
        <div
          className="absolute rounded-2xl pointer-events-none transition-all duration-300"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
            boxShadow: aero.spotlightRing,
          }}
        />
      )}

      {/* Tour card — fixed width, viewport-clamped position */}
      <div
        ref={cardRef}
        className="fixed z-[101] flex flex-col rounded-3xl border overflow-hidden transition-all duration-300"
        style={{
          top: cardPos.top,
          left: cardPos.left,
          width: CARD_WIDTH,
          background: aero.glass.background,
          borderColor: aero.glass.border,
          boxShadow: aero.glass.shadow,
          backdropFilter: aero.glass.backdrop,
          WebkitBackdropFilter: aero.glass.backdrop,
        }}
      >
        {/* Gloss highlight strip */}
        <div
          className="h-1 flex-shrink-0"
          style={{ background: aero.gradientProgress }}
        />

        <div className="p-5 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span
                className="inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mb-2"
                style={{
                  background: "rgba(45, 212, 200, 0.2)",
                  color: aero.aquaDeep,
                }}
              >
                Step {currentStep + 1} of {steps.length}
              </span>
              <h3
                className="text-base font-bold leading-snug"
                style={{ color: aero.text }}
              >
                {step.title}
              </h3>
            </div>
            <button
              onClick={onSkip}
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-white/50"
              style={{ color: aero.textMuted }}
              aria-label="Skip tour"
            >
              <X size={15} />
            </button>
          </div>

          {/* Body */}
          <p
            className="text-sm leading-relaxed"
            style={{ color: aero.textMuted }}
          >
            {step.description}
          </p>

          {/* Progress pills */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === currentStep ? 20 : 8,
                  background:
                    i === currentStep
                      ? aero.gradientProgress
                      : "rgba(110, 198, 232, 0.35)",
                }}
              />
            ))}
          </div>

          {/* Footer actions */}
          <div
            className="flex items-center justify-between gap-2 pt-1 border-t"
            style={{ borderColor: "rgba(255,255,255,0.5)" }}
          >
            <button
              onClick={goBack}
              disabled={currentStep === 0}
              className="flex items-center gap-1 text-xs font-medium transition-opacity disabled:opacity-30 disabled:pointer-events-none"
              style={{ color: aero.textMuted }}
            >
              <ArrowLeft size={14} />
              Back
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={onSkip}
                className="text-xs font-medium px-2 py-1 rounded-lg transition-colors hover:bg-white/40"
                style={{ color: aero.textMuted }}
              >
                Skip
              </button>
              <button
                onClick={goNext}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: aero.gradientBtn,
                  color: aero.text,
                  boxShadow: "0 2px 8px rgba(58,158,196,0.3), inset 0 1px 0 rgba(255,255,255,0.8)",
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
}
