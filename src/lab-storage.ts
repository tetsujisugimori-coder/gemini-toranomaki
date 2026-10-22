import { experiences, type LabId } from "./lab-data";
export const labKey = "gemini-toranomaki:lab:v1";
export interface RecordState {
  copied: boolean;
  tried: boolean;
  applied: boolean;
  check: number | null;
}
export type LabProgress = Partial<Record<LabId, RecordState>>;
export const emptyRecord = (): RecordState => ({
  copied: false,
  tried: false,
  applied: false,
  check: null,
});
export function loadLab(): { progress: LabProgress; available: boolean } {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(labKey) || "{}");
    const progress: LabProgress = {};
    if (raw && typeof raw === "object")
      for (const { id } of experiences) {
        const value = (raw as Record<string, unknown>)[id];
        if (value && typeof value === "object") {
          const r = value as Record<string, unknown>;
          progress[id] = {
            copied: r.copied === true,
            tried: r.tried === true,
            applied: r.applied === true,
            check: r.check === 0 || r.check === 1 ? r.check : null,
          };
        }
      }
    return { progress, available: true };
  } catch {
    return { progress: {}, available: false };
  }
}
export function saveLab(progress: LabProgress): boolean {
  try {
    const safe: LabProgress = {};
    for (const { id } of experiences) {
      const r = progress[id];
      if (r)
        safe[id] = {
          copied: r.copied === true,
          tried: r.tried === true,
          applied: r.applied === true,
          check: r.check === 0 || r.check === 1 ? r.check : null,
        };
    }
    localStorage.setItem(labKey, JSON.stringify(safe));
    return true;
  } catch {
    return false;
  }
}
