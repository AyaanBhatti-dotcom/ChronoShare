import {
  cloneElement,
  isValidElement,
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
  boundsRef?: RefObject<HTMLElement | null>;
  onPositionChange: (x: number, y: number) => void;
  onFocus: () => void;
  children: ReactNode;
}

function clampToDesktop(
  x: number,
  y: number,
  width: number,
  bounds: DOMRect,
) {
  const minVisible = 56;
  return {
    x: Math.max(-width + minVisible, Math.min(x, bounds.width - minVisible)),
    y: Math.max(0, Math.min(y, bounds.height - 28)),
  };
}

export function ProfileFloatingWindow({
  x,
  y,
  width,
  zIndex,
  boundsRef,
  onPositionChange,
  onFocus,
  children,
}: ProfileFloatingWindowProps) {
  const dragRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    pointerId: number;
    captureEl: HTMLElement;
  } | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleTitlePointerDown = (e: PointerEvent) => {
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
    if (!dragging) return;

    const onMove = (e: globalThis.PointerEvent) => {
      if (!dragRef.current || e.pointerId !== dragRef.current.pointerId) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      let nextX = dragRef.current.origX + dx;
      let nextY = dragRef.current.origY + dy;

      const bounds = boundsRef?.current?.getBoundingClientRect();
      if (bounds) {
        ({ x: nextX, y: nextY } = clampToDesktop(nextX, nextY, width, bounds));
      }

      onPositionChange(nextX, nextY);
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
  }, [dragging, boundsRef, onPositionChange, width]);

  const child = isValidElement(children)
    ? cloneElement(children as ReactElement<{ onTitlePointerDown?: (e: PointerEvent) => void }>, {
        onTitlePointerDown: handleTitlePointerDown,
      })
    : children;

  return (
    <div
      className={`profile-window-float ${dragging ? "profile-window-dragging" : ""}`}
      style={{ left: x, top: y, width, zIndex }}
    >
      {child}
    </div>
  );
}
