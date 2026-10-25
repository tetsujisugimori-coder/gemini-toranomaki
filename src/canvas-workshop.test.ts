import { expect, it } from "vitest";
import {
  canvasJudgments,
  defaultTimer,
  freshTimerRun,
  sanitizeTimer,
  tickTimer,
  timerCopyId,
  timerPrompt,
  type TimerSettings,
} from "./canvas-workshop";
import { freshCanvas, sanitizeCanvas } from "./canvas-storage";
it("timer actually counts down, stops or loops at zero, and never advances while paused", () => {
  for (const seconds of [10, 20] as const)
    for (const finish of ["stop", "loop"] as const) {
      const s = { ...defaultTimer, seconds, finish };
      let run = freshTimerRun(s);
      expect(tickTimer(run, s)).toBe(run);
      run = { ...run, running: true };
      for (let i = 0; i < seconds - 1; i++) run = tickTimer(run, s);
      expect(run.remaining).toBe(1);
      run = tickTimer(run, s);
      expect(run).toEqual({
        remaining: finish === "stop" ? 0 : seconds,
        running: finish === "loop",
        laps: 1,
      });
      expect(freshTimerRun(s)).toEqual({
        remaining: seconds,
        running: false,
        laps: 0,
      });
    }
});
it("each timer condition and prompt kind has matching full text and a distinct copy identity", () => {
  const ids = new Set<string>();
  for (const seconds of [10, 20] as const)
    for (const look of ["plain", "large"] as const)
      for (const finish of ["stop", "loop"] as const)
        for (const kind of ["create", "repair", "verify"] as const) {
          const s: TimerSettings = { seconds, look, finish };
          ids.add(timerCopyId(kind, s));
          const text = timerPrompt(kind, s);
          expect(text).toContain(`${seconds}秒`);
          expect(text).toContain(
            look === "large" ? "数字を大きく" : "標準の読みやすい数字",
          );
          expect(text).toContain(
            finish === "stop" ? "0秒で停止" : "設定秒数に戻り、繰り返す",
          );
          expect(text).toContain("外部通信、ログイン、個人情報入力");
        }
  expect(ids.size).toBe(24);
});
it("old chapter records keep old answers and copies but cannot earn new judgments or viewing credit", () => {
  const old = {
    ...freshCanvas(),
    understanding: { requirements: 1, repair: 2, proof: 0 },
    judgments: undefined,
    viewed: undefined,
    timer: undefined,
    timerHistory: undefined,
    timerCopied: undefined,
  };
  const next = sanitizeCanvas(old);
  expect(next.understanding).toEqual(old.understanding);
  expect(next.judgments).toEqual({});
  expect(next.viewed).toEqual([]);
  expect(next.timer).toEqual(defaultTimer);
  expect(next.timerHistory).toEqual([]);
  expect(
    sanitizeCanvas({
      ...next,
      judgments: { requirements: 1, "brief-v1": 9 },
      viewed: [-1, 0, 0, 4, "private"],
      timer: { seconds: 999 },
      timerHistory: ["start", "start", "private"],
      timerCopied: [timerCopyId("create", defaultTimer), "private"],
      remaining: 5,
      running: true,
    }).viewed,
  ).toEqual([0]);
  const record = sanitizeCanvas({
    ...next,
    judgments: { [canvasJudgments[0].id]: canvasJudgments[0].answer },
    timerCopied: [timerCopyId("create", defaultTimer)],
    remaining: 5,
    running: true,
  });
  expect(record.judgments).toEqual({ "brief-v1": 1 });
  expect(record.timerCopied).toHaveLength(1);
  expect(record).not.toHaveProperty("remaining");
  expect(record).not.toHaveProperty("running");
  expect(
    sanitizeTimer({ seconds: Infinity, look: "private", finish: "private" }),
  ).toEqual(defaultTimer);
});
it("new failure scenarios have distinct versioned IDs, plausible alternatives and reasons about evidence and regression", () => {
  expect(new Set(canvasJudgments.map((c) => c.id)).size).toBe(3);
  for (const c of canvasJudgments) {
    expect(c.id).toMatch(/-v1$/);
    expect(c.options).toHaveLength(3);
    expect(c.options[c.answer].length).toBeGreaterThan(20);
    expect(c.reason.length).toBeGreaterThan(40);
  }
});
