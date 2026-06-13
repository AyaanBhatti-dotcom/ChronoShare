import { useEffect, useState, useCallback } from "react";
import { X, ArrowRight, ArrowLeft } from "lucide-react";

export interface TourStep {
  target: string;
  title: string;
  description: string;
  position?: "right" | "bottom" | "top";
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

function getTargetRect(selector: string): Rect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export function OnboardingTour({ steps, onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  const updateRect = useCallback(() => {
    if (!step) return;
    const r = getTargetRect(step.target);
    setRect(r);
  }, [step]);

  useEffect(() => {
    step?.onEnter?.();
    const timer = setTimeout(updateRect, 150);
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [step, updateRect]);

  const goNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  if (!step) return null;

  const pad = 8;
  const spotlight = rect
    ? {
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : null;

  const tooltipStyle = (): React.CSSProperties => {
    if (!spotlight) {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        maxWidth: 340,
      };
    }

    const pos = step.position ?? "right";
    const gap = 16;

    if (pos === "right") {
      return {
        top: spotlight.top,
        left: spotlight.left + spotlight.width + gap,
        maxWidth: 300,
      };
    }
    if (pos === "bottom") {
      return {
        top: spotlight.top + spotlight.height + gap,
        left: Math.max(16, spotlight.left),
        maxWidth: 340,
      };
    }
    return {
      top: spotlight.top - gap,
      left: Math.max(16, spotlight.left),
      transform: "translateY(-100%)",
      maxWidth: 340,
    };
  };

  return (
    <div className="fixed inset-0 z-[100]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Overlay with spotlight cutout */}
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
          mask="url(#tour-mask)"
        />
      </svg>

      {/* Click blocker */}
      <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />

      {/* Spotlight ring */}
      {spotlight && (
        <div
          className="absolute rounded-xl pointer-events-none transition-all duration-300"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
            boxShadow: "0 0 0 2px #10B981, 0 0 20px rgba(16,185,129,0.3)",
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="absolute z-[101] rounded-2xl border p-5 shadow-2xl transition-all duration-300"
        style={{
          ...tooltipStyle(),
          background: "#0D1220",
          borderColor: "#1F2937",
        }}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider mb-1">
              {currentStep + 1} of {steps.length}
            </p>
            <h3 className="text-sm font-semibold text-white">{step.title}</h3>
          </div>
          <button
            onClick={onSkip}
            className="text-[#6B7280] hover:text-white transition-colors flex-shrink-0"
            aria-label="Skip tour"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-[#9CA3AF] leading-relaxed mb-4">{step.description}</p>

        {/* Progress dots */}
        <div className="flex items-center gap-1 mb-4">
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

        <div className="flex items-center justify-between gap-2">
          <button
            onClick={goBack}
            disabled={currentStep === 0}
            className="flex items-center gap-1 text-xs text-[#9CA3AF] hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onSkip}
              className="text-xs text-[#6B7280] hover:text-[#9CA3AF] transition-colors px-2 py-1"
            >
              Skip
            </button>
            <button
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
  );
}
