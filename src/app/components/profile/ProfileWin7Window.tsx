import type { MouseEvent, ReactNode } from "react";

interface ProfileWin7WindowProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  id?: string;
  active?: boolean;
  onClose?: () => void;
  onFocus?: () => void;
}

export function ProfileWin7Window({
  title,
  subtitle,
  children,
  className = "",
  icon,
  id,
  active = true,
  onClose,
  onFocus,
}: ProfileWin7WindowProps) {
  const handleChromeClick = (e: MouseEvent) => {
    e.stopPropagation();
    onFocus?.();
  };

  return (
    <div
      id={id}
      className={`profile-win7-window profile-window-slot ${active ? "profile-window-active" : ""} ${className}`}
      onMouseDown={onFocus}
    >
      <div className="profile-win7-titlebar" onMouseDown={handleChromeClick}>
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
            onClick={onClose}
          />
          <button
            type="button"
            className="profile-win7-btn profile-win7-btn-max"
            aria-label="Maximize"
            onClick={onFocus}
          />
          <button
            type="button"
            className="profile-win7-btn profile-win7-btn-close"
            aria-label="Close"
            onClick={onClose}
          />
        </div>
      </div>
      <div className="profile-win7-body">{children}</div>
    </div>
  );
}
