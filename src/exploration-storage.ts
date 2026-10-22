import { features } from "./exploration-data";
export const explorationKey = "gemini-toranomaki:exploration:v1";
export interface ExplorationProgress {
  visited: string[];
  tried: string[];
}
export const emptyExploration = (): ExplorationProgress => ({
  visited: [],
  tried: [],
});
export function sanitizeExploration(raw: unknown): ExplorationProgress {
  const data =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const ids = new Set(features.map((f) => f.id));
  const clean = (value: unknown) =>
    Array.isArray(value)
      ? [
          ...new Set(
            value.filter(
              (id): id is string => typeof id === "string" && ids.has(id),
            ),
          ),
        ]
      : [];
  return { visited: clean(data.visited), tried: clean(data.tried) };
}
export function loadExploration() {
  try {
    return {
      progress: sanitizeExploration(
        JSON.parse(localStorage.getItem(explorationKey) || "{}"),
      ),
      available: true,
    };
  } catch {
    return { progress: emptyExploration(), available: false };
  }
}
export function saveExploration(progress: ExplorationProgress) {
  try {
    localStorage.setItem(
      explorationKey,
      JSON.stringify(sanitizeExploration(progress)),
    );
    return true;
  } catch {
    return false;
  }
}
