import {
  canvasJudgments,
  defaultTimer,
  sanitizeTimer,
  timerCopyIds,
  timerEvents,
  type TimerSettings,
} from "./canvas-workshop";
import {
  canvasChecks,
  canvasCopyKey,
  defaultCanvasSettings,
  quizTopics,
  type CanvasPlatform,
  type CanvasSettings,
  type PromptKind,
  type QuizVersion,
  type Repair,
} from "./canvas-data";
export const canvasKey = "gemini-toranomaki:canvas:v1";
export interface CanvasRecord extends CanvasSettings {
  step: number;
  version: QuizVersion;
  repair: Repair;
  applied: Repair | null;
  prompt: PromptKind;
  platform: CanvasPlatform;
  understanding: Record<string, number>;
  history: string[];
  copied: string[];
  tried: boolean;
  viewed: number[];
  judgments: Record<string, number>;
  timer: TimerSettings;
  timerHistory: string[];
  timerCopied: string[];
}
export const freshCanvas = (): CanvasRecord => ({
  ...defaultCanvasSettings,
  step: 0,
  version: "initial",
  repair: "unanswered",
  applied: null,
  prompt: "create",
  platform: "pc",
  understanding: {},
  history: [],
  copied: [],
  tried: false,
  viewed: [],
  judgments: {},
  timer: { ...defaultTimer },
  timerHistory: [],
  timerCopied: [],
});
const object = (raw: unknown): Record<string, unknown> =>
  raw && typeof raw === "object" && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {};
const choice = <T extends string>(
  raw: unknown,
  ids: readonly T[],
  fallback: T,
): T => (ids.includes(raw as T) ? (raw as T) : fallback);
const list = (raw: unknown, ids: string[]) =>
  Array.isArray(raw)
    ? [
        ...new Set(
          raw.filter(
            (v): v is string => typeof v === "string" && ids.includes(v),
          ),
        ),
      ]
    : [];
const events = ["incomplete-scored", "blocked", "scored", "repeat", "restart"];
export const canvasHistoryIds = quizTopics.flatMap((t) =>
  ["initial", "appearance", "unanswered"].flatMap((v) =>
    events.map((e) => `${t.id}:${v}:${e}`),
  ),
);
export const canvasCopyIds = quizTopics.flatMap((t) =>
  ["beginner", "review"].flatMap((a) =>
    ["score", "reason"].flatMap((f) =>
      ["create", "repair", "verify"].flatMap((k) =>
        ["appearance", "unanswered"].map((repair) =>
          canvasCopyKey(
            k as PromptKind,
            {
              topic: t.id,
              audience: a as CanvasSettings["audience"],
              feedback: f as CanvasSettings["feedback"],
            },
            repair as Repair,
          ),
        ),
      ),
    ),
  ),
);
export function sanitizeCanvas(raw: unknown): CanvasRecord {
  const r = object(raw),
    applied =
      r.applied === "appearance" || r.applied === "unanswered"
        ? r.applied
        : null;
  return {
    topic: choice(
      r.topic,
      quizTopics.map((t) => t.id),
      "science",
    ),
    audience: choice(r.audience, ["beginner", "review"], "beginner"),
    feedback: choice(r.feedback, ["score", "reason"], "reason"),
    step:
      typeof r.step === "number" &&
      Number.isInteger(r.step) &&
      r.step >= 0 &&
      r.step < 4
        ? r.step
        : 0,
    applied,
    version: r.version === "revised" && applied ? "revised" : "initial",
    repair: choice(r.repair, ["appearance", "unanswered"], "unanswered"),
    prompt: choice(r.prompt, ["create", "repair", "verify"], "create"),
    platform: choice(r.platform, ["pc", "ios", "android"], "pc"),
    understanding: Object.fromEntries(
      canvasChecks.flatMap((c) => {
        const n = object(r.understanding)[c.id];
        return typeof n === "number" &&
          Number.isInteger(n) &&
          n >= 0 &&
          n < c.options.length
          ? [[c.id, n]]
          : [];
      }),
    ),
    copied: list(r.copied, canvasCopyIds),
    history: list(r.history, canvasHistoryIds),
    tried: r.tried === true,
    viewed: Array.isArray(r.viewed)
      ? [
          ...new Set(
            r.viewed.filter(
              (n): n is number => Number.isInteger(n) && n >= 0 && n < 4,
            ),
          ),
        ]
      : [],
    judgments: Object.fromEntries(
      canvasJudgments.flatMap((c) => {
        const n = object(r.judgments)[c.id];
        return typeof n === "number" &&
          Number.isInteger(n) &&
          n >= 0 &&
          n < c.options.length
          ? [[c.id, n]]
          : [];
      }),
    ),
    timer: sanitizeTimer(r.timer),
    timerHistory: list(r.timerHistory, timerEvents),
    timerCopied: list(r.timerCopied, timerCopyIds),
  };
}
export function loadCanvas() {
  try {
    return {
      record: sanitizeCanvas(
        JSON.parse(localStorage.getItem(canvasKey) ?? "null"),
      ),
      available: true,
    };
  } catch {
    return { record: freshCanvas(), available: false };
  }
}
export function saveCanvas(record: CanvasRecord) {
  try {
    localStorage.setItem(canvasKey, JSON.stringify(sanitizeCanvas(record)));
    return true;
  } catch {
    return false;
  }
}
export function removeCanvas() {
  try {
    localStorage.removeItem(canvasKey);
    return true;
  } catch {
    return false;
  }
}
export function visibleCanvasPrompt(r: CanvasRecord): PromptKind | null {
  return r.step === 0
    ? "create"
    : r.step === 2
      ? "repair"
      : r.step === 3
        ? r.prompt
        : null;
}
