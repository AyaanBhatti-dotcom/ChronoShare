import type { ReactNode } from "react";

interface ProfileWin7WindowProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  id?: string;
}

export function ProfileWin7Window({
  title,
  subtitle,
  children,
  className = "",
  icon,
  id,
}: ProfileWin7WindowProps) {
  return (
    <div id={id} className={`profile-win7-window ${className}`}>
      <div className="profile-win7-titlebar">
        <div className="profile-win7-title">
          {icon}
          <span>{title}</span>
          {subtitle && <span className="profile-win7-subtitle">— {subtitle}</span>}
        </div>
        <div className="profile-win7-controls" aria-hidden="true">
          <span className="profile-win7-btn profile-win7-btn-min" />
          <span className="profile-win7-btn profile-win7-btn-max" />
          <span className="profile-win7-btn profile-win7-btn-close" />
        </div>
      </div>
      <div className="profile-win7-body">{children}</div>
    </div>
  );
}
