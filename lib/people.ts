import type { PersonId } from "./types";

export interface Person {
  id: PersonId;
  name: string;
  short: string;
  blurb: string;
  accent: string;
}

export const PEOPLE: Record<PersonId, Person> = {
  mark: {
    id: "mark",
    name: "Mark",
    short: "MK",
    blurb: "Your sessions, your numbers.",
    accent: "mark",
  },
  mariel: {
    id: "mariel",
    name: "Mariel",
    short: "ML",
    blurb: "Show up, log it, keep going.",
    accent: "mariel",
  },
};

export const PERSON_IDS: PersonId[] = ["mark", "mariel"];

export function isPersonId(value: string): value is PersonId {
  return value === "mark" || value === "mariel";
}
