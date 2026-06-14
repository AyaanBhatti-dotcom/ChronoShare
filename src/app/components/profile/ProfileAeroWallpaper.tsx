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
      <div className="profile-aero-cloud profile-aero-cloud-4" />
      <div className="profile-aero-sun" />
      <div className="profile-aero-sun-flare" />
      <div className="profile-aero-hill-distant" />
      <div className="profile-aero-hill-bliss" />
      <div className="profile-aero-meadow" />
      <div className="profile-aero-grass profile-aero-grass-back" />
      <div className="profile-aero-grass profile-aero-grass-front" />
      <div className="profile-aero-grass-blades" />
      <div className="profile-aero-shimmer" />
      <div className="profile-aero-dew profile-aero-dew-1" />
      <div className="profile-aero-dew profile-aero-dew-2" />
      <div className="profile-aero-dew profile-aero-dew-3" />
      <div className="profile-aero-dew profile-aero-dew-4" />
      <div className="profile-aero-spark profile-aero-spark-1" />
      <div className="profile-aero-spark profile-aero-spark-2" />
      <div className="profile-aero-spark profile-aero-spark-3" />
      <div className="profile-aero-gloss" />
    </div>
  );
}
