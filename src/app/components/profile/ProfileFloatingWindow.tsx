import { cloneElement, isValidElement, useEffect, useRef, useState, type PointerEvent, type ReactElement, type ReactNode } from "react";

interface ProfileFloatingWindowProps {
  x: number;
  y: number;
  width: number;
  zIndex: number;
  onPositionChange: (x: number, y: number) => void;
  onFocus: () => void;
  children: ReactNode;
}

export function ProfileFloatingWindow({
  x,
  y,
  width,
  zIndex,
  onPositionChange,
  onFocus,
  children,
}: ProfileFloatingWindowProps) {
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleTitlePointerDown = (e: PointerEvent) => {
    e.preventDefault();
    onFocus();
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: x, origY: y };
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;

    const onMove = (e: globalThis.PointerEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      onPositionChange(
        Math.max(0, dragRef.current.origX + dx),
        Math.max(0, dragRef.current.origY + dy),
      );
    };

    const onUp = () => {
      dragRef.current = null;
      setDragging(false);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging, onPositionChange]);

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
