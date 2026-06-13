import React, { useMemo } from "react";
import { cn } from "./utils";

interface LayerConfig {
  className: string;
  speed: string;
  size: string;
  zIndex: number;
  image: string;
  animation?: string;
  bottom?: string;
  noRepeat?: boolean;
}

export interface MountainVistaParallaxProps {
  title?: string;
  subtitle?: string;
  className?: string;
  scrollProgress?: number;
  children?: React.ReactNode;
}

const layersData: LayerConfig[] = [
  { className: "layer-6", speed: "120s", size: "222px", zIndex: 1, image: "6" },
  { className: "layer-5", speed: "95s", size: "311px", zIndex: 1, image: "5" },
  { className: "layer-4", speed: "75s", size: "468px", zIndex: 1, image: "4" },
  {
    className: "bike-1",
    speed: "10s",
    size: "75px",
    zIndex: 2,
    image: "bike",
    animation: "parallax_bike",
    bottom: "100px",
    noRepeat: true,
  },
  {
    className: "bike-2",
    speed: "15s",
    size: "75px",
    zIndex: 2,
    image: "bike",
    animation: "parallax_bike",
    bottom: "100px",
    noRepeat: true,
  },
  { className: "layer-3", speed: "55s", size: "158px", zIndex: 3, image: "3" },
  { className: "layer-2", speed: "30s", size: "145px", zIndex: 4, image: "2" },
  { className: "layer-1", speed: "20s", size: "136px", zIndex: 5, image: "1" },
];

const ASSET_BASE = "https://s3-us-west-2.amazonaws.com/s.cdpn.io/24650";

function MountainVistaParallax({
  title = "",
  subtitle = "",
  className,
  scrollProgress = 0,
  children,
}: MountainVistaParallaxProps) {
  const dynamicStyles = useMemo(() => {
    return layersData
      .map((layer) => {
        const url = `${ASSET_BASE}/${layer.image}.png`;
        return `
          .mountain-vista-hero .${layer.className} {
            background-image: url(${url});
            animation-duration: ${layer.speed};
            background-size: auto ${layer.size};
            z-index: ${layer.zIndex};
            ${layer.animation ? `animation-name: ${layer.animation};` : ""}
            ${layer.bottom ? `bottom: ${layer.bottom};` : ""}
            ${layer.noRepeat ? "background-repeat: no-repeat;" : ""}
          }
        `;
      })
      .join("\n");
  }, []);

  return (
    <section
      className={cn("mountain-vista-hero hero-container", className)}
      aria-label="An animated parallax landscape of mountains and cyclists."
      style={{
        transform: `scale(${1 + scrollProgress * 0.08})`,
      }}
    >
      <style>{dynamicStyles}</style>

      <div
        className="hero-scroll-overlay"
        style={{ opacity: scrollProgress * 0.55 }}
      />

      {layersData.map((layer) => (
        <div
          key={layer.className}
          className={`parallax-layer ${layer.className}`}
        />
      ))}

      {(title || subtitle) && (
        <div
          className="hero-content"
          style={{
            opacity: 1 - scrollProgress * 0.95,
            transform: `translateY(${scrollProgress * 48}px)`,
          }}
        >
          <div className="hero-text-panel">
            {title && <h1 className="hero-title">{title}</h1>}
            {subtitle && <p className="hero-subtitle">{subtitle}</p>}
          </div>
        </div>
      )}

      {children}
    </section>
  );
}

export default React.memo(MountainVistaParallax);
export { MountainVistaParallax };
