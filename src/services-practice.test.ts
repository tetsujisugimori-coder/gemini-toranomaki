import { afterEach, expect, it, vi } from "vitest";
import {
  loadPractice,
  practiceKey,
  sanitizePractice,
  savePractice,
} from "./services-practice-storage";
import {
  practicePrompts,
  executionPractice,
  practiceSteps,
  procedures,
  expected,
  troubleHints,
} from "./services-practice-data";
import { servicesKey } from "./services-storage";
afterEach(() => vi.unstubAllGlobals());
it("does not promote old service checkboxes or mock completion to real practice", () => {
  const record = sanitizePractice({
    tried: true,
    calendarChecked: true,
    simulated: true,
    copied: ["real-search"],
    step: 999,
  });
  expect(record.performed).toEqual([]);
  expect(record.verified).toEqual([]);
  expect(record.copied).toEqual([]);
  expect(record.step).toBe(0);
});
it("whitelists fixed states and excludes email text, credentials, free content and invalid indices", () => {
  const r = sanitizePractice({
    performed: [0, 4, 4, 8, 9, -1, "5", NaN],
    verified: [7, 7, 9],
    status: { "4": 1, "7": 2, "8": 99, email: "secret" },
    copied: ["step-4", "execution", "body"],
    mode: "unknown",
    environment: 88,
    email: "private",
    token: "private",
  });
  expect(r).toEqual({
    mode: "real",
    step: 0,
    environment: 0,
    performed: [0, 4, 8],
    verified: [7],
    status: { "4": 1, "7": 2 },
    copied: ["step-4", "execution"],
  });
});
it("reads without rewriting and saves only the isolated practice key", () => {
  const data = new Map([
    [practiceKey, JSON.stringify({ step: 5, mode: "mock", performed: [4] })],
    [servicesKey, '{"simulated":true}'],
    ["gemini-toranomaki:progress:v1", '{"completed":["chapter-1"]}'],
  ]);
  const setItem = vi.fn((k: string, v: string) => data.set(k, v));
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => data.get(k),
    setItem,
  });
  expect(loadPractice().record.performed).toEqual([4]);
  expect(setItem).not.toHaveBeenCalled();
  expect(savePractice(sanitizePractice({ step: 8, verified: [7] }))).toBe(true);
  expect(setItem).toHaveBeenCalledTimes(1);
  expect(setItem.mock.calls[0][0]).toBe(practiceKey);
  expect(data.get(servicesKey)).toBe('{"simulated":true}');
});
it("handles corrupt JSON, denied reads and quota writes without throwing", () => {
  vi.stubGlobal("localStorage", {
    getItem: () => "{bad",
    setItem: () => {
      throw Error("quota");
    },
  });
  expect(loadPractice().available).toBe(false);
  expect(savePractice(sanitizePractice(null))).toBe(false);
  vi.stubGlobal("localStorage", {
    getItem: () => {
      throw Error("denied");
    },
  });
  expect(loadPractice().record.performed).toEqual([]);
});
it("has nine actionable tasks and separates search, preflight, explicit approval and postcheck", () => {
  for (const values of [procedures, expected, troubleHints, practicePrompts])
    expect(values).toHaveLength(practiceSteps.length);
  for (const n of [4, 5, 7, 8])
    expect(practicePrompts[n]).toMatch(/作成・変更・削除.*しない/);
  expect(practicePrompts[4]).toContain("Gmail");
  expect(practicePrompts[4]).toContain("Gemini学習用・打ち合わせ案内");
  expect(practicePrompts[6]).toContain("全項目を提示して返答を止め");
  expect(practicePrompts[6]).toContain("目的");
  expect(executionPractice).toContain("別メッセージ");
  expect(executionPractice).toContain("未記入");
  expect(executionPractice).toContain("完全に一致");
});
