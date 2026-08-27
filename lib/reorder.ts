/** Move an item from one index to another within a list. */
export function reorderList<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length
  ) {
    return items;
  }
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

/** Map a pointer Y position to the index it should land on. */
export function indexFromPointerY(
  pointerY: number,
  tops: number[],
  heights: number[],
): number {
  if (tops.length === 0) return 0;
  for (let i = 0; i < tops.length; i += 1) {
    const mid = tops[i] + heights[i] / 2;
    if (pointerY < mid) return i;
  }
  return tops.length - 1;
}
