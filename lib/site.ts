export const SITE_BASE_PATH =
  process.env.NEXT_PUBLIC_BASE_PATH ||
  (process.env.GITHUB_PAGES === "true" ? "/Mariel-MarkFitnessApp" : "");
