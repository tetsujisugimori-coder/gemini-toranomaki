import { afterEach, expect, it, vi } from "vitest";
import {
  canonicalEvent,
  eventFields,
  mails,
  scenarios,
  troubles,
} from "./services-data";
import {
  buildRegistrationPrompt,
  buildSearchPrompt,
  defaultServiceSettings,
} from "./services-prompts";
import {
  loadServices,
  sanitizeServices,
  saveServices,
  servicesKey,
} from "./services-storage";
import { loadProgress, progressKey, saveProgress } from "./storage";
import { labKey } from "./lab-storage";
import { explorationKey } from "./exploration-storage";
afterEach(() => vi.unstubAllGlobals());
it("uses explicit corrections rather than sent dates, old dates or a newer unrelated message", () => {
  expect(canonicalEvent.date).toBe("2026-10-31");
  expect(canonicalEvent.time).toBe("15:00–16:30");
  expect(canonicalEvent.zone).toContain("UTC+09:00");
  expect(mails[1].body).toContain("10月18日送信");
  expect(mails[2].body).toContain("訂正ではありません");
  for (const f of eventFields) expect(f.options[f.answer]).toBeTruthy();
  expect(scenarios.filter((s) => s.safe).map((s) => s.id)).toEqual(["correct"]);
  expect(scenarios.find((s) => s.id === "ambiguous")?.event.time).toContain(
    "未定",
  );
  expect(scenarios.find((s) => s.id === "duplicate")?.duplicate).toContain(
    "登録済み",
  );
});
it("separates fictional search from real Gmail, includes all source messages and reflects conditions", () => {
  const mock = buildSearchPrompt(defaultServiceSettings);
  expect(mock).toContain("実際のGmailやカレンダーにはアクセスせず");
  expect(mock).toContain("作成・変更・削除は行わない");
  for (const mail of mails) expect(mock).toContain(mail.body);
  const changed = buildSearchPrompt({
    ...defaultServiceSettings,
    target: "sender",
    period: "recent",
    sources: false,
    uncertainty: false,
  });
  expect(changed).toContain("learning@example.invalid");
  expect(changed).toContain("10月20日〜10月23日");
  expect(changed).toContain("簡潔に整理");
  expect(changed).toContain("不明点が残る場合は登録せず");
  const real = buildSearchPrompt({
    ...defaultServiceSettings,
    mode: "real",
    period: "recent",
  });
  expect(real).toContain("過去7日間");
  expect(real).not.toContain(mails[0].body);
  expect(real).toContain("未発見なら");
  expect(real).toContain("非機密");
});
it("keeps registration a separate explicit instruction with unknown, duplicate and target guards", () => {
  expect(buildRegistrationPrompt("mock")).toContain("実登録禁止");
  expect(buildRegistrationPrompt("mock")).toContain("2026-10-31");
  const real = buildRegistrationPrompt("real");
  for (const term of [
    "同じ会話",
    "確認済み",
    "タイムゾーン",
    "対象カレンダー",
    "重複",
    "登録せず",
    "Googleカレンダーを直接開き",
  ])
    expect(real).toContain(term);
  expect(troubles).toHaveLength(6);
});
it("restores old chapter 1 progress and saves independent chapter completions without touching other keys", () => {
  const values = new Map([
    [progressKey, '{"completed":["chapter-1"]}'],
    [labKey, "lab"],
    [explorationKey, "explore"],
  ]);
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => values.set(k, v),
  });
  expect(loadProgress().progress.completed).toEqual(["chapter-1"]);
  saveProgress({ completed: ["chapter-1", "chapter-2"] });
  expect(loadProgress().progress.completed).toEqual(["chapter-1", "chapter-2"]);
  const record = {
    ...sanitizeServices(null),
    step: 3,
    simulated: true,
    copied: ["mock-search"],
    tried: true,
  };
  expect(saveServices(record)).toBe(true);
  expect(loadServices().progress).toEqual(record);
  expect(values.get(labKey)).toBe("lab");
  expect(values.get(explorationKey)).toBe("explore");
  expect(loadProgress().progress.completed).toEqual(["chapter-1", "chapter-2"]);
});
it("whitelists only fixed exercise choices and record types; never retains email text or review authorization", () => {
  const record = sanitizeServices({
    step: 9,
    mail: "private",
    scenario: "unknown",
    copied: ["mock-search", "mock-search", "invented", 3],
    extraction: { date: 1, title: 99, time: "1" },
    troubles: { 0: 1, 2: -1, 99: 1 },
    tried: "true",
    calendarChecked: true,
    approved: true,
    body: "private",
  });
  expect(record.step).toBe(0);
  expect(record.mail).toBe("original");
  expect(record.scenario).toBe("old");
  expect(record.copied).toEqual(["mock-search"]);
  expect(record.extraction).toEqual({ date: 1 });
  expect(record.troubles).toEqual({ 0: 1 });
  expect(record.tried).toBe(false);
  expect(record.calendarChecked).toBe(true);
  expect(JSON.stringify(record)).not.toContain("private");
  expect(record).not.toHaveProperty("approved");
  vi.stubGlobal("localStorage", { getItem: () => "{broken" });
  expect(loadServices().available).toBe(false);
  for (const value of ["null", "[]", "42", '{"extraction":null}']) {
    vi.stubGlobal("localStorage", { getItem: () => value });
    expect(loadServices().progress).toEqual(sanitizeServices(null));
  }
  vi.stubGlobal("localStorage", {
    getItem: () => {
      throw Error("blocked");
    },
    setItem: () => {
      throw Error("quota");
    },
  });
  expect(loadServices().available).toBe(false);
  expect(saveServices(sanitizeServices(null))).toBe(false);
  expect(servicesKey).not.toBe(progressKey);
});
