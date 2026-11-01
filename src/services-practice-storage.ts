import { environments, practiceSteps } from "./services-practice-data";
export const practiceKey = "gemini-toranomaki:services-practice:v1";
export const statusLabels = [
  "未記録",
  "利用できず未実施",
  "確認できず保留",
] as const;
export interface PracticeRecord {
  mode: "real" | "mock";
  step: number;
  environment: number;
  performed: number[];
  verified: number[];
  copied: string[];
  status: Record<string, number>;
}
export function sanitizePractice(raw: unknown): PracticeRecord {
  const r =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const index = (v: unknown, max: number) =>
    typeof v === "number" && Number.isInteger(v) && v >= 0 && v < max;
  const indices = (v: unknown) =>
    Array.isArray(v)
      ? [
          ...new Set(
            v.filter((x): x is number => index(x, practiceSteps.length)),
          ),
        ]
      : [];
  const status: Record<string, number> = {};
  if (r.status && typeof r.status === "object")
    for (const [k, v] of Object.entries(r.status))
      if (/^[0-8]$/.test(k) && index(v, statusLabels.length)) status[k] = v;
  return {
    mode: r.mode === "mock" ? "mock" : "real",
    step: index(r.step, practiceSteps.length) ? (r.step as number) : 0,
    environment: index(r.environment, environments.length)
      ? (r.environment as number)
      : 0,
    performed: indices(r.performed),
    verified: indices(r.verified),
    status,
    copied: Array.isArray(r.copied)
      ? [
          ...new Set(
            r.copied.filter(
              (x): x is string =>
                typeof x === "string" && /^(step-[1-8]|execution)$/.test(x),
            ),
          ),
        ]
      : [],
  };
}
export function loadPractice() {
  try {
    return {
      record: sanitizePractice(
        JSON.parse(localStorage.getItem(practiceKey) || "{}"),
      ),
      available: true,
    };
  } catch {
    return { record: sanitizePractice(null), available: false };
  }
}
export function savePractice(record: PracticeRecord) {
  try {
    localStorage.setItem(practiceKey, JSON.stringify(sanitizePractice(record)));
    return true;
  } catch {
    return false;
  }
}
