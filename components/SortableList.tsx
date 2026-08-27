"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { AppIcon } from "./AppIcon";
import { indexFromPointerY } from "@/lib/reorder";

type DragState = {
  id: string;
  fromIndex: number;
  overIndex: number;
  originY: number;
  offsetY: number;
  height: number;
};

export type DragHandleProps = {
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
};

export function DragHandle({ onPointerDown }: DragHandleProps) {
  return (
    <button
      type="button"
      aria-label="Drag to reorder"
      onPointerDown={onPointerDown}
      className="touch-none grid h-10 w-8 shrink-0 place-items-center rounded-xl text-muted active:bg-line/60"
    >
      <AppIcon name="grip" className="h-5 w-5" />
    </button>
  );
}

export function SortableList<T>({
  items,
  getId,
  onReorder,
  renderItem,
  className = "grid gap-3",
}: {
  items: T[];
  getId: (item: T) => string;
  onReorder: (fromIndex: number, toIndex: number) => void;
  renderItem: (item: T, index: number, handle: DragHandleProps) => ReactNode;
  className?: string;
}) {
  const itemRefs = useRef(new Map<string, HTMLDivElement | null>());
  const itemsRef = useRef(items);
  const getIdRef = useRef(getId);
  const onReorderRef = useRef(onReorder);
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const draggingId = drag?.id ?? null;

  itemsRef.current = items;
  getIdRef.current = getId;
  onReorderRef.current = onReorder;

  const setItemRef = useCallback((id: string, node: HTMLDivElement | null) => {
    if (node) itemRefs.current.set(id, node);
    else itemRefs.current.delete(id);
  }, []);

  useEffect(() => {
    dragRef.current = drag;
  }, [drag]);

  useEffect(() => {
    if (!draggingId) return;

    function onPointerMove(event: PointerEvent) {
      const current = dragRef.current;
      if (!current) return;
      const tops: number[] = [];
      const heights: number[] = [];
      for (const item of itemsRef.current) {
        const id = getIdRef.current(item);
        const node = itemRefs.current.get(id);
        if (!node) continue;
        const rect = node.getBoundingClientRect();
        const shift = Number(node.dataset.shiftY || 0);
        tops.push(rect.top - shift);
        heights.push(rect.height);
      }
      const overIndex = indexFromPointerY(event.clientY, tops, heights);
      const next: DragState = {
        ...current,
        overIndex,
        offsetY: event.clientY - current.originY,
      };
      dragRef.current = next;
      setDrag(next);
    }

    function finish(commit: boolean) {
      const current = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      if (commit && current && current.fromIndex !== current.overIndex) {
        onReorderRef.current(current.fromIndex, current.overIndex);
      }
    }

    function onPointerUp() {
      finish(true);
    }

    function onPointerCancel() {
      finish(false);
    }

    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [draggingId]);

  function startDrag(id: string, index: number, event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const node = itemRefs.current.get(id);
    const height = node?.getBoundingClientRect().height ?? 0;
    const next: DragState = {
      id,
      fromIndex: index,
      overIndex: index,
      originY: event.clientY,
      offsetY: 0,
      height,
    };
    dragRef.current = next;
    setDrag(next);
  }

  function shiftForIndex(index: number): number {
    if (!drag) return 0;
    const { fromIndex, overIndex, height } = drag;
    if (index === fromIndex) return 0;
    if (fromIndex < overIndex && index > fromIndex && index <= overIndex) {
      return -height - 12;
    }
    if (fromIndex > overIndex && index >= overIndex && index < fromIndex) {
      return height + 12;
    }
    return 0;
  }

  return (
    <div className={className}>
      {items.map((item, index) => {
        const id = getId(item);
        const isDragging = drag?.id === id;
        const shiftY = shiftForIndex(index);
        const style: CSSProperties = isDragging
          ? {
              transform: `translateY(${drag.offsetY}px) scale(1.02)`,
              zIndex: 20,
              position: "relative",
              boxShadow: "0 18px 40px rgba(39, 27, 18, 0.18)",
              opacity: 0.96,
              transition: "box-shadow 120ms ease",
            }
          : {
              transform: shiftY ? `translateY(${shiftY}px)` : undefined,
              transition: drag ? "transform 140ms ease" : undefined,
              position: "relative",
              zIndex: 1,
            };

        return (
          <div
            key={id}
            ref={(node) => setItemRef(id, node)}
            data-shift-y={shiftY}
            style={style}
            className={isDragging ? "pointer-events-none" : undefined}
          >
            {renderItem(item, index, {
              onPointerDown: (event) => startDrag(id, index, event),
            })}
          </div>
        );
      })}
    </div>
  );
}
