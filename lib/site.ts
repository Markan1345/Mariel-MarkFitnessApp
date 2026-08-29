export const SITE_BASE_PATH =
  process.env.NEXT_PUBLIC_BASE_PATH ||
  (process.env.GITHUB_PAGES === "true" ? "/Mariel-MarkFitnessApp" : "");

const PASSPHRASE_PATTERN = /^[A-Z0-9]{12,32}$/;

/** Shared cloud passphrase so every browser on this deployment syncs automatically. */
export function getDefaultHouseholdPassphrase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_HOUSEHOLD_PASSPHRASE?.trim().toUpperCase();
  if (fromEnv && PASSPHRASE_PATTERN.test(fromEnv)) return fromEnv;
  // Stable default for the Mark & Mariel deployment (not secret — data is still encrypted at rest).
  return "MARIELMARKFITAPP";
}
