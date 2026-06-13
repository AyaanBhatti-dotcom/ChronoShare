import { useEffect, useState, useCallback, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { X, ArrowRight, ArrowLeft } from "lucide-react";

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
    const fitsVertically = top >= VIEWPORT_PAD && top + cardH <= vh - VIEWPORT_PAD;
    const fitsHorizontally = left >= VIEWPORT_PAD && left + cardW <= vw - VIEWPORT_PAD;

    if (fitsVertically && fitsHorizontally) return { top, left };
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
  const [ready, setReady] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  const updateRect = useCallback(() => {
    if (!step?.target) {
      setRect(null);
      return;
    }
    setRect(getTargetRect(step.target));
  }, [step]);

  useEffect(() => {
    setReady(true);
    return () => setReady(false);
  }, []);

  useEffect(() => {
    step?.onEnter?.();
    const timer = setTimeout(updateRect, 250);
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
    if (!cardRef.current) return;

    if (!spotlight) {
      setCardPos({
        top: window.innerHeight / 2 - 120,
        left: window.innerWidth / 2 - CARD_WIDTH / 2,
      });
      return;
    }

    const cardH = cardRef.current.offsetHeight;
    setCardPos(computeCardPosition(spotlight, step?.position, CARD_WIDTH, cardH));
  }, [spotlight, step, currentStep]);

  const goNext = () => {
    if (isLast) onComplete();
    else setCurrentStep((s) => s + 1);
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  if (!step || !ready) return null;

  const content = (
    <div
      className="fixed inset-0"
      style={{ zIndex: 9999, fontFamily: "'Inter', sans-serif" }}
    >
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="tour-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {spotlight && (
              <rect
                x={spotlight.left}
                y={spotlight.top}
                width={spotlight.width}
                height={spotlight.height}
                rx="12"
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
          fill="rgba(0,0,0,0.75)"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      {spotlight && (
        <div
          className="absolute rounded-xl pointer-events-none transition-all duration-300"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
            boxShadow: "0 0 0 2px #10B981, 0 0 20px rgba(16,185,129,0.35)",
          }}
        />
      )}

      <div
        ref={cardRef}
        className="fixed flex flex-col rounded-2xl border overflow-hidden"
        style={{
          top: cardPos.top,
          left: cardPos.left,
          width: CARD_WIDTH,
          zIndex: 10000,
          background: "#0D1220",
          borderColor: "#1F2937",
          boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider mb-1">
                Step {currentStep + 1} of {steps.length}
              </p>
              <h3 className="text-sm font-semibold text-white leading-snug">{step.title}</h3>
            </div>
            <button
              type="button"
              onClick={onSkip}
              className="flex-shrink-0 text-[#6B7280] hover:text-white transition-colors"
              aria-label="Skip tour"
            >
              <X size={16} />
            </button>
          </div>

          <p className="text-xs text-[#9CA3AF] leading-relaxed">{step.description}</p>

          <div className="flex items-center gap-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: i === currentStep ? 16 : 6,
                  background: i === currentStep ? "#10B981" : "#374151",
                }}
              />
            ))}
          </div>

          <div
            className="flex items-center justify-between gap-2 pt-3 border-t"
            style={{ borderColor: "#1F2937" }}
          >
            <button
              type="button"
              onClick={goBack}
              disabled={currentStep === 0}
              className="flex items-center gap-1 text-xs text-[#9CA3AF] hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <ArrowLeft size={14} />
              Back
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onSkip}
                className="text-xs text-[#6B7280] hover:text-[#9CA3AF] transition-colors px-2 py-1"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={goNext}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold"
                style={{
                  background: "linear-gradient(135deg, #10B981, #06B6D4)",
                  color: "#000",
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
