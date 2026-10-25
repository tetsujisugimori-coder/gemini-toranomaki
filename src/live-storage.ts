import {
  conversations,
  frames,
  practiceObjects,
  sharingCases,
  type ConversationId,
  type FrameId,
  type PracticeId,
} from "./live-data";
export const liveKey = "gemini-toranomaki:live:v1";
export interface LiveRecord {
  step: number;
  conversation: ConversationId;
  followup: number | null;
  conversationAnswer: number | null;
  frame: FrameId;
  packageAnswer: number | null;
  sharing: (typeof sharingCases)[number]["id"];
  sharingAnswer: number | null;
  stopAnswer: number | null;
  platform: "ios" | "android";
  practice: PracticeId;
  copied: PracticeId[];
  tried: boolean;
  compared: boolean;
  ended: boolean;
  history: string[];
}
export function freshLive(): LiveRecord {
  return {
    step: 0,
    conversation: "ice",
    followup: null,
    conversationAnswer: null,
    frame: "whole",
    packageAnswer: null,
    sharing: "calendar",
    sharingAnswer: null,
    stopAnswer: null,
    platform: "ios",
    practice: "package-v1",
    copied: [],
    tried: false,
    compared: false,
    ended: false,
    history: [],
  };
}
const object = (raw: unknown): Record<string, unknown> =>
  raw && typeof raw === "object" && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {};
const choice = <T extends string>(
  raw: unknown,
  ids: readonly T[],
  fallback: T,
): T => (ids.includes(raw as T) ? (raw as T) : fallback);
const answer = (raw: unknown, max: number) =>
  typeof raw === "number" && Number.isInteger(raw) && raw >= 0 && raw < max
    ? raw
    : null;
export const historyIds = [
  ...conversations.flatMap((c) =>
    c.replies.map((_, i) => `conversation:${c.id}:${i}`),
  ),
  ...frames.map((f) => `package:${f.id}`),
  ...sharingCases.map((s) => `sharing:${s.id}`),
];
const ids = (raw: unknown, allowed: readonly string[]) =>
  Array.isArray(raw)
    ? [
        ...new Set(
          raw.filter(
            (v): v is string => typeof v === "string" && allowed.includes(v),
          ),
        ),
      ]
    : [];
export function sanitizeLive(raw: unknown): LiveRecord {
  const r = object(raw);
  const conversation = choice(
    r.conversation,
    conversations.map((c) => c.id),
    "ice",
  );
  const frame = choice(
    r.frame,
    frames.map((f) => f.id),
    "whole",
  );
  const sharing = choice(
    r.sharing,
    sharingCases.map((s) => s.id),
    "calendar",
  );
  const practice = choice(
    r.practice,
    practiceObjects.map((p) => p.id),
    "package-v1",
  );
  const followup = answer(r.followup, 4);
  return {
    step: answer(r.step, 4) ?? 0,
    conversation,
    followup,
    conversationAnswer:
      conversation === r.conversation && followup !== null
        ? answer(r.conversationAnswer, 3)
        : null,
    frame,
    packageAnswer: frame === r.frame ? answer(r.packageAnswer, 3) : null,
    sharing,
    sharingAnswer: sharing === r.sharing ? answer(r.sharingAnswer, 3) : null,
    stopAnswer: sharing === r.sharing ? answer(r.stopAnswer, 3) : null,
    platform: choice(r.platform, ["ios", "android"], "ios"),
    practice,
    copied: ids(
      r.copied,
      practiceObjects.map((p) => p.id),
    ) as PracticeId[],
    tried: r.tried === true,
    compared: r.compared === true,
    ended: r.ended === true,
    history: ids(r.history, historyIds),
  };
}
export function loadLive() {
  try {
    return {
      record: sanitizeLive(JSON.parse(localStorage.getItem(liveKey) ?? "null")),
      available: true,
    };
  } catch {
    return { record: freshLive(), available: false };
  }
}
export function saveLive(record: LiveRecord) {
  try {
    localStorage.setItem(liveKey, JSON.stringify(sanitizeLive(record)));
    return true;
  } catch {
    return false;
  }
}
export function removeLive() {
  try {
    localStorage.removeItem(liveKey);
    return true;
  } catch {
    return false;
  }
}
