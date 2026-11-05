import { expect, it, vi, afterEach } from "vitest";
import * as data from "./services-practice-data";
import {
  buildRegistrationPrompt,
  buildFinalExecutionPrompt,
} from "./services-prompts";
import {
  loadPractice,
  savePractice,
  practiceKey,
  sanitizePractice,
} from "./services-practice-storage";
afterEach(() => vi.unstubAllGlobals());
const fields = [
  "確認用ID",
  "対象となるメール1件（件名・送信日時）",
  "イベント名",
  "開催日（年を含む）",
  "開始時刻",
  "終了時刻",
  "タイムゾーン",
  "場所",
  "目的・予定の説明",
  "訂正情報（出典の件名・送信日時・変更箇所、または訂正なし）",
  "対象カレンダー（名前・所有者・利用アカウント）",
  "重複確認の結果",
];
it("keeps the exact subject and complete multiline body as independent data", () => {
  const mail = data.testMail;
  expect(mail.subject).toBe("Gemini学習用・打ち合わせ案内");
  expect(mail.body).toBe(
    "これは架空の学習用メールです。実際の会議はありません。\n予定名：Gemini学習用・打ち合わせ\n日時：2026年12月15日 15:00〜15:30\nタイムゾーン：日本標準時（Asia/Tokyo、UTC+09:00）\n場所：架空の学習ルームA（実在しません）\n目的：Geminiでメール検索と予定確認の練習\n参加者の招待・通知は不要です。",
  );
  expect(data.searchPractice).toContain(`件名「${mail.subject}」`);
  expect(mail.body).not.toContain("件名：");
});
it("uses the same twelve mandatory fields in both real cards and approval templates", () => {
  const card = buildRegistrationPrompt("real");
  const approval = buildFinalExecutionPrompt();
  const cardFields = card
    .split("1枚の確認カードとして提示してください：")[1]
    ?.split("\n\n")[0];
  expect(cardFields?.split("\n")).toEqual(fields);
  const approvalFields = approval
    .split("\n\n")[2]
    .split("\n")
    .map((line) => line.split("：【記入欄")[0]);
  expect(approvalFields).toEqual(fields);
  for (const prompt of [
    card,
    approval,
    data.practicePrompts[6],
    data.executionPractice,
  ]) {
    expect(prompt).toContain("目的・予定の説明も必須");
    expect(prompt).toContain("未記入");
    expect(prompt).toContain("重複の可能性");
  }
  expect(data.executionPractice).toBe(approval);
  expect(card).toContain("以前の承認を無効");
  expect(card).toContain("Gmailの原文");
  expect(approval).toContain("目的・予定の説明・訂正・重複なし");
});
it("retains v1 history and current status together without rewriting old or other chapter records", () => {
  const record = {
    mode: "real",
    step: 4,
    environment: 3,
    performed: [4],
    verified: [4],
    status: { 4: 1 },
    copied: ["step-1", "mail-subject", "mail-body"],
  };
  const stored = new Map([
    [practiceKey, JSON.stringify(record)],
    ["gemini-toranomaki:services:v1", '{"simulated":true}'],
    ["gemini-toranomaki:progress:v1", '{"completed":["chapter-1"]}'],
  ]);
  const before = new Map(stored);
  const setItem = vi.fn((key: string, value: string) => stored.set(key, value));
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => stored.get(key),
    setItem,
  });
  expect(loadPractice().record).toEqual(record);
  expect(setItem).not.toHaveBeenCalled();
  expect(savePractice(sanitizePractice(record))).toBe(true);
  expect(stored).toEqual(before);
  expect(setItem).toHaveBeenCalledTimes(1);
  expect(setItem.mock.calls[0][0]).toBe(practiceKey);
});
it("distinguishes twelve-field cards from transient self-report and later Gemini approval", () => {
  const prompt = buildRegistrationPrompt("real");
  expect(prompt).not.toContain("7項目チェック");
  expect(prompt).toContain("12必須項目の確認カード");
  expect(prompt).toContain("一時的な自己申告チェック");
  expect(prompt).toContain("最終承認ではありません");
  expect(prompt).toContain("別の最終実行メッセージ");
});
