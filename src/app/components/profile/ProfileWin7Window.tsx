import type { MouseEvent, PointerEvent, ReactNode } from "react";

interface ProfileWin7WindowProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  id?: string;
  active?: boolean;
  maximized?: boolean;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onFocus?: () => void;
  onTitlePointerDown?: (e: PointerEvent) => void;
}

export function ProfileWin7Window({
  title,
  subtitle,
  children,
  className = "",
  icon,
  id,
  active = true,
  maximized = false,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  onTitlePointerDown,
}: ProfileWin7WindowProps) {
  const handleChromeClick = (e: MouseEvent) => {
    e.stopPropagation();
    onFocus?.();
  };

  const handleTitlePointerDown = (e: PointerEvent) => {
    if (maximized) return;
    if ((e.target as HTMLElement).closest("button")) return;
    onTitlePointerDown?.(e);
  };

  const handleTitleDoubleClick = (e: MouseEvent) => {
    e.stopPropagation();
    onMaximize?.();
  };

  return (
    <div
      id={id}
      className={`profile-win7-window profile-window-slot ${active ? "profile-window-active" : ""} ${maximized ? "profile-win7-window-maximized" : ""} ${className}`}
      onMouseDown={(e) => {
        e.stopPropagation();
        onFocus?.();
      }}
    >
      <div
        className="profile-win7-titlebar"
        onMouseDown={handleChromeClick}
        onPointerDown={handleTitlePointerDown}
        onDoubleClick={handleTitleDoubleClick}
      >
        <div className="profile-win7-title">
          {icon}
          <span>{title}</span>
          {subtitle && <span className="profile-win7-subtitle">— {subtitle}</span>}
        </div>
        <div className="profile-win7-controls">
          <button
            type="button"
            className="profile-win7-btn profile-win7-btn-min"
            aria-label="Minimize"
            onClick={onMinimize ?? onClose}
          />
          <button
            type="button"
            className={`profile-win7-btn ${maximized ? "profile-win7-btn-restore" : "profile-win7-btn-max"}`}
            aria-label={maximized ? "Restore down" : "Maximize"}
            onClick={onMaximize}
          />
          <button
            type="button"
            className="profile-win7-btn profile-win7-btn-close"
            aria-label="Close"
            onClick={onClose}
          />
        </div>
      </div>
      <div className={`profile-win7-body ${maximized ? "profile-win7-body-maximized" : ""}`}>{children}</div>
    </div>
  );
}
