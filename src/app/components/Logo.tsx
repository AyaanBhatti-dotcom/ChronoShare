import { cn } from "./ui/utils";

type LogoVariant = "mark" | "minimal";
type LogoSize = "xs" | "sm" | "md" | "lg" | "xl";

const SOURCES: Record<LogoVariant, string> = {
  mark: "/logo.png",
  minimal: "/logo-minimal.png",
};

const SIZE_PX: Record<LogoSize, number> = {
  xs: 28,
  sm: 36,
  md: 48,
  lg: 64,
  xl: 80,
};

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize | number;
  className?: string;
}

export function Logo({ variant = "mark", size = "sm", className }: LogoProps) {
  const px = typeof size === "number" ? size : SIZE_PX[size];

  return (
    <img
      src={SOURCES[variant]}
      alt="ChronoShare"
      width={px}
      height={px}
      className={cn("object-contain flex-shrink-0 select-none", className)}
      draggable={false}
    />
  );
}

interface LogoBrandProps extends LogoProps {
  nameClassName?: string;
  showName?: boolean;
}

export function LogoBrand({
  variant = "mark",
  size = "sm",
  className,
  nameClassName,
  showName = true,
}: LogoBrandProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Logo variant={variant} size={size} />
      {showName && (
        <span className={cn("text-sm font-semibold tracking-tight", nameClassName)}>
          ChronoShare
        </span>
      )}
    </div>
  );
}
