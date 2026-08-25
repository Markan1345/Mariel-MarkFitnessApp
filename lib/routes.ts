import type { PersonId } from "./types";

export function workoutHref(personId: PersonId, id: string): string {
  return `/${personId}/workout?id=${encodeURIComponent(id)}`;
}
