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
const SPOTLIGHT_PAD = 8;
const GAP = 20;

function getTargetRect(selector: string): Rect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 1 || r.height < 1) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

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

export function OnboardingTour({ steps, onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [cardPos, setCardPos] = useState({
    top: Math.max(VIEWPORT_PAD, window.innerHeight / 2 - 120),
    left: Math.max(VIEWPORT_PAD, window.innerWidth / 2 - CARD_WIDTH / 2),
  });
  const cardRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  const updateRect = useCallback(() => {
    if (!step?.target) {
      setRect(null);
      return;
    }
    const r = getTargetRect(step.target);
    setRect(r && isRectVisible(r) ? r : null);
  }, [step]);

  useEffect(() => {
    step?.onEnter?.();
    updateRect();
    const timer = setTimeout(updateRect, 100);
    const timer2 = setTimeout(updateRect, 350);
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [step, updateRect, currentStep]);

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
        top: clamp(window.innerHeight / 2 - 120, VIEWPORT_PAD, window.innerHeight - 300),
        left: clamp(window.innerWidth / 2 - CARD_WIDTH / 2, VIEWPORT_PAD, window.innerWidth - CARD_WIDTH - VIEWPORT_PAD),
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

  if (!step) return null;

  const content = (
    <div
      className="fixed inset-0"
      style={{ zIndex: 9999, fontFamily: "'Inter', sans-serif" }}
    >
      {/* Backdrop — full dim when no target; box-shadow hole when spotlight */}
      {spotlight ? (
        <>
          <div
            className="fixed pointer-events-none rounded-xl transition-all duration-300"
            style={{
              top: spotlight.top,
              left: spotlight.left,
              width: spotlight.width,
              height: spotlight.height,
              boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.78)",
              zIndex: 9999,
            }}
          />
          <div
            className="fixed pointer-events-none rounded-xl transition-all duration-300"
            style={{
              top: spotlight.top,
              left: spotlight.left,
              width: spotlight.width,
              height: spotlight.height,
              boxShadow: "0 0 0 2px #10B981, 0 0 20px rgba(16,185,129,0.4)",
              zIndex: 10000,
            }}
          />
        </>
      ) : (
        <div
          className="fixed inset-0"
          style={{ background: "rgba(0, 0, 0, 0.78)", zIndex: 9999 }}
        />
      )}

      {/* Block interaction with dashboard beneath */}
      <div className="fixed inset-0" style={{ zIndex: 9999 }} aria-hidden />

      <div
        ref={cardRef}
        className="fixed flex flex-col rounded-2xl border overflow-hidden pointer-events-auto"
        style={{
          top: cardPos.top,
          left: cardPos.left,
          width: CARD_WIDTH,
          zIndex: 10001,
          background: "#0D1220",
          borderColor: "#1F2937",
          boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
        }}
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
