import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { GeoPermissibleObjects } from "d3";
import { cn } from "./utils";
import { aero } from "../onboarding/aeroTheme";

/** Frutiger Aero palette for the wireframe globe */
const GLOBE_THEME = {
  ocean: "#1B5F7A",
  oceanGlow: "#2DD4C8",
  landDot: "#5EFFF0",
  landDotDim: "#6EC6E8",
  outline: "rgba(255, 255, 255, 0.85)",
  graticule: "rgba(94, 255, 240, 0.35)",
  ring: "rgba(110, 198, 232, 0.6)",
} as const;

interface GeoFeature {
  type: string;
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
  properties?: { featurecla?: string };
}

interface GeoFeatureCollection {
  type: string;
  features: GeoFeature[];
}

interface DotData {
  lng: number;
  lat: number;
}

export interface RotatingEarthProps {
  width?: number;
  height?: number;
  className?: string;
  /** Pause auto-rotation (e.g. when off-screen) */
  paused?: boolean;
}

function pointInPolygon(point: [number, number], polygon: number[][]): boolean {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }

  return inside;
}

function pointInFeature(point: [number, number], feature: GeoFeature): boolean {
  const { geometry } = feature;

  if (geometry.type === "Polygon") {
    const coordinates = geometry.coordinates as number[][][];
    if (!pointInPolygon(point, coordinates[0])) return false;
    for (let i = 1; i < coordinates.length; i++) {
      if (pointInPolygon(point, coordinates[i])) return false;
    }
    return true;
  }

  if (geometry.type === "MultiPolygon") {
    for (const polygon of geometry.coordinates as number[][][][]) {
      if (pointInPolygon(point, polygon[0])) {
        let inHole = false;
        for (let i = 1; i < polygon.length; i++) {
          if (pointInPolygon(point, polygon[i])) {
            inHole = true;
            break;
          }
        }
        if (!inHole) return true;
      }
    }
  }

  return false;
}

function generateDotsInPolygon(feature: GeoFeature, dotSpacing = 16): [number, number][] {
  const dots: [number, number][] = [];
  const bounds = d3.geoBounds(feature as GeoPermissibleObjects);
  const [[minLng, minLat], [maxLng, maxLat]] = bounds;
  const stepSize = dotSpacing * 0.08;

  for (let lng = minLng; lng <= maxLng; lng += stepSize) {
    for (let lat = minLat; lat <= maxLat; lat += stepSize) {
      const point: [number, number] = [lng, lat];
      if (pointInFeature(point, feature)) dots.push(point);
    }
  }

  return dots;
}

export default function RotatingEarth({
  width = 800,
  height = 600,
  className = "",
  paused = false,
}: RotatingEarthProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let disposed = false;
    let containerWidth = 0;
    let containerHeight = 0;
    let radius = 0;
    let landFeatures: GeoFeatureCollection | null = null;
    const allDots: DotData[] = [];

    const projection = d3
      .geoOrthographic()
      .scale(100)
      .translate([0, 0])
      .clipAngle(90);

    const path = d3.geoPath().projection(projection).context(context);

    const measure = () => {
      const rect = container.getBoundingClientRect();
      containerWidth = Math.max(160, Math.floor(rect.width || width));
      containerHeight = Math.max(160, Math.floor(rect.height || height));
      radius = Math.min(containerWidth, containerHeight) / 2.35;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = containerWidth * dpr;
      canvas.height = containerHeight * dpr;
      canvas.style.width = `${containerWidth}px`;
      canvas.style.height = `${containerHeight}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      projection
        .scale(radius)
        .translate([containerWidth / 2, containerHeight / 2]);
    };

    const render = () => {
      if (!landFeatures) return;

      context.clearRect(0, 0, containerWidth, containerHeight);

      const currentScale = projection.scale();
      const scaleFactor = currentScale / radius;
      const cx = containerWidth / 2;
      const cy = containerHeight / 2;

      // Soft aqua glow behind globe
      const glow = context.createRadialGradient(cx, cy, currentScale * 0.2, cx, cy, currentScale * 1.15);
      glow.addColorStop(0, "rgba(94, 255, 240, 0.18)");
      glow.addColorStop(0.6, "rgba(45, 212, 200, 0.08)");
      glow.addColorStop(1, "rgba(45, 212, 200, 0)");
      context.fillStyle = glow;
      context.fillRect(0, 0, containerWidth, containerHeight);

      // Ocean sphere
      context.beginPath();
      context.arc(cx, cy, currentScale, 0, 2 * Math.PI);
      const oceanGrad = context.createRadialGradient(
        cx - currentScale * 0.25,
        cy - currentScale * 0.25,
        currentScale * 0.1,
        cx,
        cy,
        currentScale,
      );
      oceanGrad.addColorStop(0, GLOBE_THEME.oceanGlow);
      oceanGrad.addColorStop(0.45, "#3DD9C8");
      oceanGrad.addColorStop(1, GLOBE_THEME.ocean);
      context.fillStyle = oceanGrad;
      context.fill();
      context.strokeStyle = GLOBE_THEME.ring;
      context.lineWidth = 2 * scaleFactor;
      context.stroke();

      // Graticule
      const graticule = d3.geoGraticule();
      context.beginPath();
      path(graticule());
      context.strokeStyle = GLOBE_THEME.graticule;
      context.lineWidth = 0.75 * scaleFactor;
      context.stroke();

      // Land outlines
      context.beginPath();
      landFeatures.features.forEach((feature) => {
        path(feature as GeoPermissibleObjects);
      });
      context.strokeStyle = GLOBE_THEME.outline;
      context.lineWidth = 1 * scaleFactor;
      context.stroke();

      // Halftone land dots
      allDots.forEach((dot) => {
        const projected = projection([dot.lng, dot.lat]);
        if (!projected) return;
        const [px, py] = projected;
        const dist = Math.hypot(px - cx, py - cy);
        if (dist > currentScale) return;

        context.beginPath();
        context.arc(px, py, 1.1 * scaleFactor, 0, 2 * Math.PI);
        context.fillStyle = dist < currentScale * 0.85 ? GLOBE_THEME.landDot : GLOBE_THEME.landDotDim;
        context.fill();
      });
    };

    const rotation: [number, number] = [0, 0];
    let autoRotate = true;
    const rotationSpeed = 0.35;

    const rotate = () => {
      if (autoRotate && !paused) {
        rotation[0] += rotationSpeed;
        projection.rotate(rotation);
        render();
      }
    };

    const rotationTimer = d3.timer(rotate);

    const startDrag = (clientX: number, clientY: number) => {
      autoRotate = false;
      const startX = clientX;
      const startY = clientY;
      const startRotation: [number, number] = [rotation[0], rotation[1]];

      const onMove = (moveX: number, moveY: number) => {
        const sensitivity = 0.45;
        rotation[0] = startRotation[0] + (moveX - startX) * sensitivity;
        rotation[1] = startRotation[1] - (moveY - startY) * sensitivity;
        rotation[1] = Math.max(-90, Math.min(90, rotation[1]));
        projection.rotate(rotation);
        render();
      };

      const onMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
      const onTouchMove = (e: TouchEvent) => {
        if (e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY);
      };

      const endDrag = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", endDrag);
        document.removeEventListener("touchmove", onTouchMove);
        document.removeEventListener("touchend", endDrag);
        window.setTimeout(() => {
          autoRotate = true;
        }, 800);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", endDrag);
      document.addEventListener("touchmove", onTouchMove, { passive: true });
      document.addEventListener("touchend", endDrag);
    };

    const handleMouseDown = (e: MouseEvent) => startDrag(e.clientX, e.clientY);
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches[0]) startDrag(e.touches[0].clientX, e.touches[0].clientY);
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.92 : 1.08;
      const next = Math.max(radius * 0.55, Math.min(radius * 2.2, projection.scale() * factor));
      projection.scale(next);
      render();
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
    canvas.addEventListener("wheel", handleWheel, { passive: false });

    const ro = new ResizeObserver(() => {
      measure();
      render();
    });
    ro.observe(container);
    measure();

    const loadWorldData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          "https://raw.githubusercontent.com/martynafford/natural-earth-geojson/refs/heads/master/110m/physical/ne_110m_land.json",
        );
        if (!response.ok) throw new Error("Failed to load land data");

        landFeatures = (await response.json()) as GeoFeatureCollection;

        landFeatures.features.forEach((feature) => {
          generateDotsInPolygon(feature, 16).forEach(([lng, lat]) => {
            allDots.push({ lng, lat });
          });
        });

        if (!disposed) {
          render();
          setIsLoading(false);
        }
      } catch {
        if (!disposed) {
          setError("Could not load globe data");
          setIsLoading(false);
        }
      }
    };

    loadWorldData();

    return () => {
      disposed = true;
      rotationTimer.stop();
      ro.disconnect();
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, [width, height, paused]);

  if (error) {
    return (
      <div
        className={cn(
          "flex h-full min-h-[180px] items-center justify-center rounded-2xl border px-4 py-8 text-center",
          className,
        )}
        style={{
          background: aero.glassCard.background,
          borderColor: aero.glassCard.border,
        }}
      >
        <p className="text-xs" style={{ color: aero.textMuted }}>
          {error}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative h-full w-full min-h-[180px] sm:min-h-[220px]", className)}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full touch-none select-none rounded-2xl"
        aria-label="Interactive rotating globe showing worldwide community connections"
      />
      {isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center rounded-2xl"
          style={{ background: "rgba(255,255,255,0.35)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="h-7 w-7 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: aero.aquaDeep, borderTopColor: "transparent" }}
          />
        </div>
      )}
      <div
        className="pointer-events-none absolute bottom-2 left-2 right-2 sm:bottom-3 sm:left-3 sm:right-auto rounded-lg px-2.5 py-1 text-[10px] sm:text-xs"
        style={{
          background: "rgba(255,255,255,0.72)",
          border: `1px solid ${aero.glass.border}`,
          color: aero.textMuted,
          backdropFilter: "blur(8px)",
        }}
      >
        <span className="hidden sm:inline">Drag to rotate · Scroll to zoom · </span>
        <span className="sm:hidden">Drag to explore · </span>
        One global community
      </div>
    </div>
  );
}
