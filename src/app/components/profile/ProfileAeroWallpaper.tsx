import { cn } from "../ui/utils";

interface ProfileAeroWallpaperProps {
  className?: string;
}

export function ProfileAeroWallpaper({ className }: ProfileAeroWallpaperProps) {
  return (
    <div className={cn("profile-aero-scene", className)} aria-hidden="true">
      <div className="profile-aero-sky" />
      <div className="profile-aero-cloud profile-aero-cloud-1" />
      <div className="profile-aero-cloud profile-aero-cloud-2" />
      <div className="profile-aero-cloud profile-aero-cloud-3" />
      <div className="profile-aero-sun" />
      <div className="profile-aero-sun-flare" />
      <div className="profile-aero-horizon" />
      <div className="profile-aero-coast" />
      <div className="profile-aero-water" />
      <div className="profile-aero-wave profile-aero-wave-1" />
      <div className="profile-aero-wave profile-aero-wave-2" />
      <div className="profile-aero-orb profile-aero-orb-aqua" />
      <div className="profile-aero-orb profile-aero-orb-coral" />
      <div className="profile-aero-shimmer" />
      <div className="profile-aero-spark profile-aero-spark-1" />
      <div className="profile-aero-spark profile-aero-spark-2" />
      <div className="profile-aero-spark profile-aero-spark-3" />
      <div className="profile-aero-gloss" />
    </div>
  );
}
