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
  outline: "rgba(255, 255, 255, 0.85)",
  graticule: "rgba(94, 255, 240, 0.35)",
  ring: "rgba(110, 198, 232, 0.6)",
} as const;

/** Fewer dots = smoother interaction */
const DOT_SPACING = 26;

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

function generateDotsInPolygon(feature: GeoFeature, dotSpacing: number): DotData[] {
  const dots: DotData[] = [];
  const bounds = d3.geoBounds(feature as GeoPermissibleObjects);
  const [[minLng, minLat], [maxLng, maxLat]] = bounds;
  const stepSize = dotSpacing * 0.08;

  for (let lng = minLng; lng <= maxLng; lng += stepSize) {
    for (let lat = minLat; lat <= maxLat; lat += stepSize) {
      const point: [number, number] = [lng, lat];
      if (pointInFeature(point, feature)) {
        dots.push({ lng, lat });
      }
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

    const context = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!context) return;

    let disposed = false;
    let containerWidth = 0;
    let containerHeight = 0;
    let radius = 0;
    let landFeatures: GeoFeatureCollection | null = null;
    let allDots: DotData[] = [];

    const baseCanvas = document.createElement("canvas");
    const baseCtx = baseCanvas.getContext("2d");
    let cachedBaseScale = -1;

    const projection = d3
      .geoOrthographic()
      .scale(100)
      .translate([0, 0])
      .clipAngle(90);

    const path = d3.geoPath().projection(projection).context(context);
    const graticule = d3.geoGraticule();

    const rotation: [number, number] = [0, 0];
    let autoRotate = true;
    let isDragging = false;
    let needsRender = true;
    const rotationSpeed = 0.35;

    let rafId = 0;

    const measure = () => {
      const rect = container.getBoundingClientRect();
      containerWidth = Math.max(160, Math.floor(rect.width || width));
      containerHeight = Math.max(160, Math.floor(rect.height || height));
      radius = Math.min(containerWidth, containerHeight) / 2.35;

      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = containerWidth * dpr;
      canvas.height = containerHeight * dpr;
      canvas.style.width = `${containerWidth}px`;
      canvas.style.height = `${containerHeight}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      baseCanvas.width = canvas.width;
      baseCanvas.height = canvas.height;
      baseCtx?.setTransform(dpr, 0, 0, dpr, 0, 0);

      projection.scale(radius).translate([containerWidth / 2, containerHeight / 2]);
      cachedBaseScale = -1;
      needsRender = true;
    };

    const drawBaseLayer = (scale: number) => {
      if (!baseCtx) return;

      const cx = containerWidth / 2;
      const cy = containerHeight / 2;

      baseCtx.clearRect(0, 0, containerWidth, containerHeight);

      const glow = baseCtx.createRadialGradient(cx, cy, scale * 0.2, cx, cy, scale * 1.15);
      glow.addColorStop(0, "rgba(94, 255, 240, 0.18)");
      glow.addColorStop(0.6, "rgba(45, 212, 200, 0.08)");
      glow.addColorStop(1, "rgba(45, 212, 200, 0)");
      baseCtx.fillStyle = glow;
      baseCtx.fillRect(0, 0, containerWidth, containerHeight);

      baseCtx.beginPath();
      baseCtx.arc(cx, cy, scale, 0, 2 * Math.PI);
      const oceanGrad = baseCtx.createRadialGradient(
        cx - scale * 0.25,
        cy - scale * 0.25,
        scale * 0.1,
        cx,
        cy,
        scale,
      );
      oceanGrad.addColorStop(0, GLOBE_THEME.oceanGlow);
      oceanGrad.addColorStop(0.45, "#3DD9C8");
      oceanGrad.addColorStop(1, GLOBE_THEME.ocean);
      baseCtx.fillStyle = oceanGrad;
      baseCtx.fill();
      baseCtx.strokeStyle = GLOBE_THEME.ring;
      baseCtx.lineWidth = 2;
      baseCtx.stroke();

      cachedBaseScale = scale;
    };

    const drawDotsBatched = (scaleFactor: number) => {
      const dotRadius = 1.05 * scaleFactor;
      context.beginPath();

      for (let i = 0; i < allDots.length; i++) {
        const dot = allDots[i];
        const projected = projection([dot.lng, dot.lat]);
        if (!projected) continue;
        const [px, py] = projected;
        context.moveTo(px + dotRadius, py);
        context.arc(px, py, dotRadius, 0, 2 * Math.PI);
      }

      context.fillStyle = GLOBE_THEME.landDot;
      context.fill();
    };

    const render = () => {
      if (!landFeatures) return;

      needsRender = false;
      const scale = projection.scale();
      const scaleFactor = scale / radius;

      if (cachedBaseScale !== scale) {
        drawBaseLayer(scale);
      }

      context.clearRect(0, 0, containerWidth, containerHeight);
      context.drawImage(baseCanvas, 0, 0);

      projection.rotate(rotation);

      if (!isDragging) {
        context.beginPath();
        path(graticule());
        context.strokeStyle = GLOBE_THEME.graticule;
        context.lineWidth = 0.75 * scaleFactor;
        context.stroke();
      }

      context.beginPath();
      for (let i = 0; i < landFeatures.features.length; i++) {
        path(landFeatures.features[i] as GeoPermissibleObjects);
      }
      context.strokeStyle = GLOBE_THEME.outline;
      context.lineWidth = 1 * scaleFactor;
      context.stroke();

      drawDotsBatched(scaleFactor);
    };

    const loop = () => {
      if (disposed) return;

      if (autoRotate && !paused && !isDragging) {
        rotation[0] += rotationSpeed;
        needsRender = true;
      }

      if (needsRender) {
        render();
      }

      rafId = requestAnimationFrame(loop);
    };

    const startDrag = (clientX: number, clientY: number) => {
      autoRotate = false;
      isDragging = true;
      const startX = clientX;
      const startY = clientY;
      const startRotation: [number, number] = [rotation[0], rotation[1]];

      const onMove = (moveX: number, moveY: number) => {
        rotation[0] = startRotation[0] + (moveX - startX) * 0.45;
        rotation[1] = Math.max(-90, Math.min(90, startRotation[1] - (moveY - startY) * 0.45));
        needsRender = true;
      };

      const onMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
      const onTouchMove = (e: TouchEvent) => {
        if (e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY);
      };

      const endDrag = () => {
        isDragging = false;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", endDrag);
        document.removeEventListener("touchmove", onTouchMove);
        document.removeEventListener("touchend", endDrag);
        needsRender = true;
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
      projection.scale(Math.max(radius * 0.55, Math.min(radius * 2.2, projection.scale() * factor)));
      needsRender = true;
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
    canvas.addEventListener("wheel", handleWheel, { passive: false });

    const ro = new ResizeObserver(() => {
      measure();
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

        allDots = [];
        for (let i = 0; i < landFeatures.features.length; i++) {
          allDots.push(...generateDotsInPolygon(landFeatures.features[i], DOT_SPACING));
        }

        if (!disposed) {
          needsRender = true;
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
    rafId = requestAnimationFrame(loop);

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
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
