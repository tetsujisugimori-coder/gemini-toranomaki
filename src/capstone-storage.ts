import { topics, versions, type Topic, type Version } from "./capstone-data";
export const capstoneKey = "gemini-toranomaki:capstone:v1";
export interface QualityAnswer {
  verdict: number;
  evidence: number;
  improvement: number;
  checked: boolean;
}
export interface CapstoneRecord {
  topic: Topic;
  step: number;
  mode: number;
  environment: number;
  artifact: number;
  audience: number;
  requirements: number[];
  plan: number[];
  prediction: number;
  researched: boolean;
  research: number[];
  sources: number[];
  compared: boolean;
  notebook: number;
  prompt: number[];
  created: boolean;
  version: Version;
  repairStyle: number;
  applied: boolean;
  trials: Version[];
  quality: Record<Version, QualityAnswer[]>;
  visited: number[];
  achieved: number[];
  history: string[];
  copied: string[];
  real: number[];
  ratings: number[];
  reasons: number[];
}
export const emptyQuality = (): QualityAnswer[] =>
  Array.from({ length: 10 }, () => ({
    verdict: -1,
    evidence: -1,
    improvement: -1,
    checked: false,
  }));
export const freshCapstone = (): CapstoneRecord => ({
  topic: "history",
  step: 0,
  mode: 0,
  environment: 0,
  artifact: 0,
  audience: 0,
  requirements: [0, 1, 2],
  plan: [],
  prediction: -1,
  researched: false,
  research: [-1, -1, -1],
  sources: [0, 1],
  compared: false,
  notebook: -1,
  prompt: [],
  created: false,
  version: "initial",
  repairStyle: 0,
  applied: false,
  trials: [],
  quality: {
    initial: emptyQuality(),
    repair: emptyQuality(),
    final: emptyQuality(),
  },
  visited: [],
  achieved: [],
  history: [],
  copied: [],
  real: Array(8).fill(0),
  ratings: Array(6).fill(-1),
  reasons: Array(6).fill(-1),
});
const obj = (x: unknown): Record<string, unknown> =>
  x && typeof x === "object" && !Array.isArray(x)
    ? (x as Record<string, unknown>)
    : {};
const num = (x: unknown, max: number, fallback = 0) =>
  Number.isInteger(x) && (x as number) >= fallback && (x as number) < max
    ? (x as number)
    : fallback;
const list = (x: unknown, max: number) =>
  Array.isArray(x)
    ? [
        ...new Set(
          x.filter(
            (n): n is number => Number.isInteger(n) && n >= 0 && n < max,
          ),
        ),
      ].sort((a, b) => a - b)
    : [];
const array = (x: unknown, length: number, max: number, fallback = -1) =>
  Array.from({ length }, (_, i) =>
    num(Array.isArray(x) ? x[i] : null, max, fallback),
  );
const historyIds = topics.flatMap((t) =>
  Array.from({ length: 8 }, (_, i) => `${t.id}:${i}`),
);
const ids = (x: unknown) =>
  Array.isArray(x)
    ? [...new Set(x.filter((v): v is string => historyIds.includes(v)))]
    : [];
export function sanitizeCapstone(raw: unknown): CapstoneRecord {
  const r = obj(raw),
    base = freshCapstone(),
    quality = obj(r.quality);
  return {
    ...base,
    topic: topics.some((t) => t.id === r.topic)
      ? (r.topic as Topic)
      : base.topic,
    step: num(r.step, 8),
    mode: num(r.mode, 2),
    environment: num(r.environment, 4),
    artifact: num(r.artifact, 3),
    audience: num(r.audience, 2),
    requirements:
      r.requirements === undefined
        ? base.requirements
        : list(r.requirements, 3),
    plan: list(r.plan, 4),
    prediction: num(r.prediction, 3, -1),
    researched: r.researched === true,
    research: array(r.research, 3, 3),
    sources: r.sources === undefined ? base.sources : list(r.sources, 3),
    compared: r.compared === true,
    notebook: num(r.notebook, 3, -1),
    prompt: list(r.prompt, 4),
    created: r.created === true,
    version: versions.includes(r.version as Version)
      ? (r.version as Version)
      : "initial",
    repairStyle: num(r.repairStyle, 2),
    applied: r.applied === true,
    trials: Array.isArray(r.trials)
      ? versions.filter((v) => (r.trials as unknown[]).includes(v))
      : [],
    quality: Object.fromEntries(
      versions.map((v) => [
        v,
        Array.from({ length: 10 }, (_, i) => {
          const a = obj(
            Array.isArray(quality[v]) ? (quality[v] as unknown[])[i] : null,
          );
          return {
            verdict: num(a.verdict, 3, -1),
            evidence: num(a.evidence, 3, -1),
            improvement: num(a.improvement, 6, -1),
            checked: a.checked === true,
          };
        }),
      ]),
    ) as CapstoneRecord["quality"],
    visited: list(r.visited, 8),
    achieved: list(r.achieved, 8),
    history: ids(r.history),
    copied: ids(r.copied),
    real: array(r.real, 8, 4, 0),
    ratings: array(r.ratings, 6, 3),
    reasons: array(r.reasons, 6, 3),
  };
}
export function loadCapstone() {
  try {
    return {
      record: sanitizeCapstone(
        JSON.parse(localStorage.getItem(capstoneKey) ?? "null"),
      ),
      available: true,
    };
  } catch {
    return { record: freshCapstone(), available: false };
  }
}
export function saveCapstone(r: CapstoneRecord) {
  try {
    localStorage.setItem(capstoneKey, JSON.stringify(sanitizeCapstone(r)));
    return true;
  } catch {
    return false;
  }
}
export function removeCapstone() {
  try {
    localStorage.removeItem(capstoneKey);
    return true;
  } catch {
    return false;
  }
}
// Conditions change the assignment: invalidate current conclusions while keeping historical records.
export function changeAssignment(
  r: CapstoneRecord,
  p: Partial<CapstoneRecord>,
): CapstoneRecord {
  return sanitizeCapstone({
    ...freshCapstone(),
    ...p,
    topic: p.topic ?? r.topic,
    artifact: p.artifact ?? r.artifact,
    audience: p.audience ?? r.audience,
    requirements: p.requirements ?? r.requirements,
    step: r.step,
    mode: r.mode,
    environment: r.environment,
    visited: r.visited,
    history: r.history,
    copied: r.copied,
  });
}
export function invalidateFrom(
  r: CapstoneRecord,
  from: number,
  p: Partial<CapstoneRecord> = {},
): CapstoneRecord {
  const base = freshCapstone();
  return sanitizeCapstone({
    ...r,
    ...(from <= 2
      ? { prediction: -1, researched: false, research: base.research }
      : {}),
    ...(from <= 3 ? { compared: false, notebook: -1 } : {}),
    ...(from <= 4 ? { created: false } : {}),
    ...(from <= 5
      ? {
          quality: base.quality,
          version: "initial",
          applied: false,
          trials: [],
          ratings: base.ratings,
          reasons: base.reasons,
        }
      : {}),
    ...(from === 6
      ? {
          applied: false,
          version: "initial",
          trials: r.trials.filter((v) => v === "initial"),
          quality: {
            ...r.quality,
            repair: emptyQuality(),
            final: emptyQuality(),
          },
          ratings: base.ratings,
          reasons: base.reasons,
        }
      : {}),
    ...(from === 7 ? { ratings: base.ratings, reasons: base.reasons } : {}),
    achieved: r.achieved.filter((n) => n < from),
    real: r.real.map((n, i) => (i >= from ? 0 : n)),
    ...p,
  });
}
