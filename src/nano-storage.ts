import { defaultImage, regions, tasks, type ImageSettings } from "./nano-data";
export const nanoKey = "gemini-toranomaki:nano-banana:v1";
export interface NanoRecord {
  step: number;
  image: ImageSettings;
  editTask: number;
  findTask: number;
  pins: number[];
  history: string[];
  answers: Record<string, string[]>;
  copied: string[];
  tried: boolean;
}
export const freshNano = (): NanoRecord => ({
  step: 0,
  image: { ...defaultImage },
  editTask: 0,
  findTask: 0,
  pins: [0, 1, 2, 3, 4],
  history: [],
  answers: {},
  copied: [],
  tried: false,
});
const obj = (x: unknown): Record<string, unknown> =>
  x && typeof x === "object" && !Array.isArray(x)
    ? (x as Record<string, unknown>)
    : {};
const num = (x: unknown, max: number, fallback = 0) =>
  typeof x === "number" && Number.isInteger(x) && x >= 0 && x < max
    ? x
    : fallback;
const list = (x: unknown, allow: (s: string) => boolean) =>
  Array.isArray(x)
    ? [
        ...new Set(
          x.filter((s): s is string => typeof s === "string" && allow(s)),
        ),
      ]
    : [];
export const answerIds = tasks
  .flatMap((t) => [`edit:${t.id}`, `find:${t.id}`])
  .concat(["character:v1"]);
export const historyIds = ["workshop:v1", ...answerIds];
export function sanitizeNano(raw: unknown): NanoRecord {
  const r = obj(raw),
    s = obj(r.image);
  return {
    step: num(r.step, 4),
    image: {
      subject: num(s.subject, 3),
      background: num(s.background, 3),
      style: num(s.style, 3),
      composition: num(s.composition, 3),
    },
    editTask: num(r.editTask, 3),
    findTask: num(r.findTask, 3),
    pins: Array.isArray(r.pins)
      ? [
          ...new Set(
            r.pins.filter(
              (x): x is number =>
                typeof x === "number" && Number.isInteger(x) && x >= 0 && x < 5,
            ),
          ),
        ]
      : freshNano().pins,
    history: list(r.history, (s) => historyIds.includes(s)),
    answers: Object.fromEntries(
      answerIds
        .filter((id) => Array.isArray(obj(r.answers)[id]))
        .map((id) => [
          id,
          list(
            obj(r.answers)[id],
            (s) =>
              id === "character:v1"
                ? /^[0-4]:(same|different)$/.test(s)
                : regions.some((r) => r.id === s),
          ),
        ]),
    ),
    copied: list(r.copied, (s) =>
      /^(workshop|edit|repair|character):v1:[a-f0-9]{8}$/.test(s),
    ).slice(-100),
    tried: r.tried === true,
  };
}
export function loadNano() {
  try {
    return {
      record: sanitizeNano(JSON.parse(localStorage.getItem(nanoKey) ?? "null")),
      available: true,
    };
  } catch {
    return { record: freshNano(), available: false };
  }
}
export function saveNano(r: NanoRecord) {
  try {
    localStorage.setItem(nanoKey, JSON.stringify(sanitizeNano(r)));
    return true;
  } catch {
    return false;
  }
}
export function removeNano() {
  try {
    localStorage.removeItem(nanoKey);
    return true;
  } catch {
    return false;
  }
}
