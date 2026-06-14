import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from "react";

interface ProfileFloatingWindowProps {
  x: number;
  y: number;
  width: number;
  zIndex: number;
  maximized?: boolean;
  boundsRef?: RefObject<HTMLElement | null>;
  onPositionChange: (x: number, y: number) => void;
  onFocus: () => void;
  children: ReactNode;
}

export function clampWindowToBounds(
  x: number,
  y: number,
  windowWidth: number,
  windowHeight: number,
  boundsWidth: number,
  boundsHeight: number,
) {
  const maxX = Math.max(0, boundsWidth - windowWidth);
  const maxY = Math.max(0, boundsHeight - windowHeight);
  return {
    x: Math.min(Math.max(0, x), maxX),
    y: Math.min(Math.max(0, y), maxY),
  };
}

export function ProfileFloatingWindow({
  x,
  y,
  width,
  zIndex,
  maximized = false,
  boundsRef,
  onPositionChange,
  onFocus,
  children,
}: ProfileFloatingWindowProps) {
  const floatRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    pointerId: number;
    captureEl: HTMLElement;
  } | null>(null);
  const [dragging, setDragging] = useState(false);

  const clampPosition = useCallback(
    (nextX: number, nextY: number) => {
      if (maximized) return { x: 0, y: 0 };
      const layer = boundsRef?.current;
      const windowHeight = floatRef.current?.offsetHeight ?? 0;
      if (!layer || windowHeight <= 0) return { x: nextX, y: nextY };
      return clampWindowToBounds(
        nextX,
        nextY,
        width,
        windowHeight,
        layer.clientWidth,
        layer.clientHeight,
      );
    },
    [boundsRef, maximized, width],
  );

  const applyClampedPosition = useCallback(
    (nextX: number, nextY: number) => {
      const clamped = clampPosition(nextX, nextY);
      onPositionChange(clamped.x, clamped.y);
    },
    [clampPosition, onPositionChange],
  );

  useEffect(() => {
    if (maximized) return;
    const el = floatRef.current;
    const layer = boundsRef?.current;
    if (!el || !layer) return;

    const syncPosition = () => {
      const clamped = clampWindowToBounds(
        x,
        y,
        width,
        el.offsetHeight,
        layer.clientWidth,
        layer.clientHeight,
      );
      if (clamped.x !== x || clamped.y !== y) {
        onPositionChange(clamped.x, clamped.y);
      }
    };

    syncPosition();
    const ro = new ResizeObserver(syncPosition);
    ro.observe(el);
    ro.observe(layer);
    return () => ro.disconnect();
  }, [x, y, width, maximized, boundsRef, onPositionChange]);

  const handleTitlePointerDown = (e: PointerEvent) => {
    if (maximized) return;
    e.preventDefault();
    e.stopPropagation();
    onFocus();
    const captureEl = e.currentTarget as HTMLElement;
    captureEl.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: x,
      origY: y,
      pointerId: e.pointerId,
      captureEl,
    };
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging || maximized) return;

    const onMove = (e: globalThis.PointerEvent) => {
      if (!dragRef.current || e.pointerId !== dragRef.current.pointerId) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      applyClampedPosition(dragRef.current.origX + dx, dragRef.current.origY + dy);
    };

    const endDrag = (e: globalThis.PointerEvent) => {
      if (!dragRef.current || e.pointerId !== dragRef.current.pointerId) return;
      try {
        dragRef.current.captureEl.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
      dragRef.current = null;
      setDragging(false);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };
  }, [dragging, maximized, applyClampedPosition]);

  const child = isValidElement(children)
    ? cloneElement(children as ReactElement<{ onTitlePointerDown?: (e: PointerEvent) => void }>, {
        onTitlePointerDown: handleTitlePointerDown,
      })
    : children;

  return (
    <div
      ref={floatRef}
      className={`profile-window-float ${maximized ? "profile-window-maximized" : ""} ${dragging ? "profile-window-dragging" : ""}`}
      style={
        maximized
          ? { left: 0, top: 0, width: "100%", height: "100%", zIndex }
          : { left: x, top: y, width, zIndex }
      }
    >
      {child}
    </div>
  );
}
