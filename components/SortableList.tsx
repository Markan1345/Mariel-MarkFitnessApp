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
import { createPortal } from "react-dom";
import { AppIcon } from "./AppIcon";
import { indexFromPointerY } from "@/lib/reorder";

type DragState = {
  id: string;
  fromIndex: number;
  overIndex: number;
  pointerId: number;
  originY: number;
  offsetY: number;
  width: number;
  height: number;
  left: number;
  top: number;
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
  const slotRefs = useRef(new Map<number, HTMLDivElement | null>());
  const itemsRef = useRef(items);
  const getIdRef = useRef(getId);
  const onReorderRef = useRef(onReorder);
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const draggingId = drag?.id ?? null;

  itemsRef.current = items;
  getIdRef.current = getId;
  onReorderRef.current = onReorder;

  const setSlotRef = useCallback((index: number, node: HTMLDivElement | null) => {
    if (node) slotRefs.current.set(index, node);
    else slotRefs.current.delete(index);
  }, []);

  useEffect(() => {
    dragRef.current = drag;
  }, [drag]);

  useEffect(() => {
    if (!draggingId) return;

    function slotRects(): { tops: number[]; heights: number[] } {
      const tops: number[] = [];
      const heights: number[] = [];
      for (let index = 0; index < itemsRef.current.length; index += 1) {
        const node = slotRefs.current.get(index);
        if (!node) continue;
        const rect = node.getBoundingClientRect();
        tops.push(rect.top);
        heights.push(rect.height);
      }
      return { tops, heights };
    }

    function onPointerMove(event: PointerEvent) {
      const current = dragRef.current;
      if (!current || event.pointerId !== current.pointerId) return;
      const { tops, heights } = slotRects();
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

    function onPointerUp(event: PointerEvent) {
      if (dragRef.current?.pointerId !== event.pointerId) return;
      finish(true);
    }

    function onPointerCancel(event: PointerEvent) {
      if (dragRef.current?.pointerId !== event.pointerId) return;
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
    const node = slotRefs.current.get(index);
    const rect = node?.getBoundingClientRect();
    if (!rect) return;
    const next: DragState = {
      id,
      fromIndex: index,
      overIndex: index,
      pointerId: event.pointerId,
      originY: event.clientY,
      offsetY: 0,
      width: rect.width,
      height: rect.height,
      left: rect.left,
      top: rect.top,
    };
    dragRef.current = next;
    setDrag(next);
  }

  const noopHandle: DragHandleProps = {
    onPointerDown: (event) => {
      event.preventDefault();
    },
  };

  const draggedItem =
    drag === null
      ? null
      : items.find((item, index) => getId(item) === drag.id && index === drag.fromIndex);

  const previewStyle: CSSProperties | undefined = drag
    ? {
        position: "fixed",
        left: drag.left,
        top: drag.top + drag.offsetY,
        width: drag.width,
        zIndex: 60,
        pointerEvents: "none",
        boxShadow: "0 18px 40px rgba(39, 27, 18, 0.2)",
        transform: "scale(1.02)",
      }
    : undefined;

  return (
    <>
      <div className={className}>
        {items.map((item, index) => {
          const id = getId(item);
          const isSourceSlot = drag?.fromIndex === index;

          if (isSourceSlot) {
            return (
              <div
                key={id}
                ref={(node) => setSlotRef(index, node)}
                aria-hidden
                className="rounded-[1.25rem] border-2 border-dashed border-line/70 bg-bg/40"
                style={{ minHeight: drag?.height }}
              />
            );
          }

          return (
            <div key={id} ref={(node) => setSlotRef(index, node)}>
              {renderItem(item, index, {
                onPointerDown: (event) => startDrag(id, index, event),
              })}
            </div>
          );
        })}
      </div>
      {drag && draggedItem && typeof document !== "undefined"
        ? createPortal(
            <div style={previewStyle}>{renderItem(draggedItem, drag.fromIndex, noopHandle)}</div>,
            document.body,
          )
        : null}
    </>
  );
}
