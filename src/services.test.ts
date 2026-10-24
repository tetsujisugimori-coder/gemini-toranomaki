import { afterEach, expect, it, vi } from "vitest";
import {
  canonicalEvent,
  eventFields,
  mails,
  scenarios,
  troubles,
} from "./services-data";
import {
  buildFinalExecutionPrompt,
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

it("real preflight identifies one candidate and presents every field without authorizing an operation", () => {
  const prompt = buildRegistrationPrompt("real");
  expect(prompt).toContain(
    "このメッセージでは予定の作成・変更・削除を一切実行しない",
  );
  expect(prompt).toContain("確認と作成を連続実行せず");
  expect(prompt).toContain("私が明示的に選んだ1件だけ");
  expect(prompt).toContain("複数候補、対象不明、情報不足");
  expect(prompt).toContain("登録せず質問");
  for (const field of [
    "確認用ID",
    "イベント名",
    "開催日",
    "開始時刻",
    "終了時刻",
    "タイムゾーン",
    "場所",
    "訂正情報",
    "対象カレンダー",
    "所有者",
    "利用アカウント",
    "重複確認の結果",
  ])
    expect(prompt).toContain(field);
  expect(prompt).toContain("提示した全項目が一致");
  expect(prompt).toContain("別の最終実行メッセージ");
  expect(prompt).toContain(
    "教材の7項目チェックや以前のコピー、検索依頼は最終承認ではありません",
  );
  expect(prompt).not.toContain("新規作成してください");
  expect(prompt).not.toContain("追加してください");
});

it("final execution requires filled identity fields matching the displayed single candidate and a later separate approval", () => {
  const prompt = buildFinalExecutionPrompt();
  for (const field of [
    "確認用ID",
    "イベント名",
    "開催日",
    "開始時刻",
    "終了時刻",
    "タイムゾーン",
    "場所",
    "訂正情報",
    "対象カレンダー",
    "重複確認の結果",
  ])
    expect(prompt).toMatch(new RegExp(`${field}[^\\n]*：【記入欄`));
  expect(prompt).toContain("Gemini側の入力欄だけ");
  expect(prompt).toContain(
    "未記入・仮の値・テンプレートのままでは最終承認は成立しません",
  );
  expect(prompt).toContain("全項目提示より後に送ったこの別メッセージ");
  expect(prompt).toContain(
    "全項目が提示済みの対象1件と完全に一致する場合に限り",
  );
  expect(prompt).toContain("複数候補、対象不明、情報不足");
  expect(prompt).toContain("登録せず質問し、停止");
  expect(prompt).toContain("確認と作成を連続実行しない");
  expect(prompt).toContain("既存予定の変更・削除");
  expect(prompt).toContain("承認を無効");
  expect(prompt).toContain("Googleカレンダーを直接開き");
  expect(buildRegistrationPrompt("mock")).toContain("実登録禁止");
  expect(buildRegistrationPrompt("mock")).not.toContain("新規作成を承認");
});

it("retains legacy copy history alongside new preflight and execution history without persisting authorization or event data", () => {
  const legacy = {
    ...sanitizeServices(null),
    copied: ["real-registration", "mock-search"],
    tried: true,
  };
  const values = new Map([[servicesKey, JSON.stringify(legacy)]]);
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => values.set(k, v),
  });
  expect(loadServices().progress).toEqual(legacy);
  const progress = sanitizeServices({
    ...loadServices().progress,
    copied: [...legacy.copied, "real-preflight", "real-execution"],
    finalReviewed: true,
    realChecks: ["private"],
    event: "private",
    reply: "private",
  });
  expect(saveServices(progress)).toBe(true);
  expect(loadServices().progress.copied).toEqual([
    "real-registration",
    "mock-search",
    "real-preflight",
    "real-execution",
  ]);
  expect(loadServices().progress.tried).toBe(true);
  for (const field of ["finalReviewed", "realChecks", "event", "reply"])
    expect(loadServices().progress).not.toHaveProperty(field);
  expect(values.get(servicesKey)).not.toContain("private");
});
