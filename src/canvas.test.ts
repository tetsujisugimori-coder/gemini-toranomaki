import { afterEach, expect, it, vi } from "vitest";
import {
  canvasCopyKey,
  canvasPrompt,
  canvasReferences,
  defaultCanvasSettings,
  quizTopics,
} from "./canvas-data";
import {
  emptyQuiz,
  gradeQuiz,
  presetAnswers,
  setQuizAnswers,
  submitQuiz,
} from "./canvas-engine";
import {
  canvasKey,
  freshCanvas,
  loadCanvas,
  removeCanvas,
  sanitizeCanvas,
  saveCanvas,
} from "./canvas-storage";
import { loadProgress, progressKey } from "./storage";
afterEach(() => vi.unstubAllGlobals());
it("scores all 64 complete/incomplete combinations for both original themes without treating missing as answered", () => {
  for (const t of quizTopics) {
    expect(t.questions.map((q) => q.options.length)).toEqual([3, 3, 3]);
    for (const a of [null, 0, 1, 2])
      for (const b of [null, 0, 1, 2])
        for (const c of [null, 0, 1, 2]) {
          const answers = [a, b, c],
            missing = answers.flatMap((v, i) => (v === null ? [i + 1] : []));
          const expected = answers.filter(
            (v, i) => v === t.questions[i].answer,
          ).length;
          expect(gradeQuiz(t.id, answers, false)).toEqual({
            kind: "scored",
            score: expected,
          });
          expect(gradeQuiz(t.id, answers, true)).toEqual(
            missing.length
              ? { kind: "blocked", missing }
              : { kind: "scored", score: expected },
          );
        }
  }
  expect(gradeQuiz("science", [1, 0, 2], true)).toEqual({
    kind: "scored",
    score: 3,
  });
  expect(gradeQuiz("evidence", [2, 1, 0], true)).toEqual({
    kind: "scored",
    score: 3,
  });
  expect(gradeQuiz("science", [false, {}, 99], true)).toEqual({
    kind: "blocked",
    missing: [1, 2, 3],
  });
});
it("keeps answers common but grades independent by version, never adds points on repeated submission, and clears old results on actual answer changes", () => {
  const initial = submitQuiz(emptyQuiz(), "science", "initial", false);
  expect(initial.runs.initial.grade).toEqual({ kind: "scored", score: 0 });
  expect(initial.runs.revised.grade).toBeNull();
  const revised = submitQuiz(initial, "science", "revised", true);
  expect(revised.runs.revised.grade).toEqual({
    kind: "blocked",
    missing: [1, 2, 3],
  });
  expect(revised.runs.initial.grade).toEqual(initial.runs.initial.grade);
  expect(setQuizAnswers(revised, [null, null, null])).toBe(revised);
  let full = setQuizAnswers(revised, [1, 0, 2]);
  expect(full.runs.initial.grade).toBeNull();
  expect(full.runs.revised.grade).toBeNull();
  for (let i = 0; i < 4; i++)
    full = submitQuiz(full, "science", "revised", true);
  expect(full.runs.revised.grade).toEqual({ kind: "scored", score: 3 });
  expect(full.runs.revised.submissions).toBe(4);
  expect(setQuizAnswers(full, [1, 0, 1]).runs.revised.grade).toBeNull();
  expect(emptyQuiz().answers).toEqual([null, null, null]);
  expect(emptyQuiz().runs).toEqual({
    initial: { grade: null, submissions: 0 },
    revised: { grade: null, submissions: 0 },
  });
});
it("sets actual option values for empty, partial, correct, incorrect and mixed boundaries", () => {
  for (const t of quizTopics) {
    expect(gradeQuiz(t.id, presetAnswers(t.id, "correct"), false)).toEqual({
      kind: "scored",
      score: 3,
    });
    expect(gradeQuiz(t.id, presetAnswers(t.id, "wrong"), false)).toEqual({
      kind: "scored",
      score: 0,
    });
    expect(gradeQuiz(t.id, presetAnswers(t.id, "mixed"), true)).toEqual({
      kind: "scored",
      score: 1,
    });
    expect(gradeQuiz(t.id, presetAnswers(t.id, "partial"), true)).toEqual({
      kind: "blocked",
      missing: [2, 3],
    });
    expect(presetAnswers(t.id, "empty")).toEqual([null, null, null]);
  }
});
it("reflects selected conditions in full prompts, preserves grading and reset rules, and distinguishes cosmetic from behavioral repair", () => {
  const s = {
    ...defaultCanvasSettings,
    topic: "evidence",
    audience: "review",
    feedback: "score",
  } as const;
  const create = canvasPrompt("create", s, "unanswered");
  expect(create).toContain("情報の確かめ方");
  expect(create).toContain("一度学んだ人");
  expect(create).toContain("結果表示：点数と各問の正誤");
  expect(create).toContain("3問");
  expect(create).toContain("正答：引用元の本文と主張を照合する");
  expect(create).toContain("やり直し：回答・点数・未回答案内をすべて消し");
  const repair = canvasPrompt("repair", s, "unanswered"),
    appearance = canvasPrompt("repair", s, "appearance");
  expect(repair).toContain("未回答の問題番号をすべて表示");
  expect(repair).toContain("維持する機能：3問・各3択、正答");
  expect(appearance).toContain("動作変更は含めません");
  expect(repair).not.toBe(appearance);
  expect(canvasPrompt("verify", s, "unanswered")).toContain(
    "連続して採点し、点数が増えないか",
  );
});
it("ties copy IDs to all and only conditions used by each fixed prompt", () => {
  const s = defaultCanvasSettings;
  expect(canvasCopyKey("create", s, "appearance")).toBe(
    canvasCopyKey("create", s, "unanswered"),
  );
  expect(canvasPrompt("create", s, "appearance")).toBe(
    canvasPrompt("create", s, "unanswered"),
  );
  expect(canvasCopyKey("repair", s, "appearance")).not.toBe(
    canvasCopyKey("repair", s, "unanswered"),
  );
  for (const kind of ["create", "repair", "verify"] as const) {
    expect(
      canvasCopyKey(kind, { ...s, audience: "review" }, "unanswered"),
    ).not.toBe(canvasCopyKey(kind, s, "unanswered"));
    expect(
      canvasPrompt(kind, { ...s, audience: "review" }, "unanswered"),
    ).not.toBe(canvasPrompt(kind, s, "unanswered"));
  }
});
it("classifies PC, iOS, Android and common official sources explicitly", () => {
  expect(canvasReferences.map((r) => r.platform)).toEqual([
    "all",
    "pc",
    "ios",
    "android",
  ]);
  for (const platform of ["pc", "ios", "android"] as const)
    expect(
      canvasReferences.filter(
        (r) => r.platform === "all" || r.platform === platform,
      ),
    ).toHaveLength(2);
});
it("restores fixed records but never persists quiz answers, scores, current test evidence or private text", () => {
  const raw = {
    ...freshCanvas(),
    applied: "unanswered",
    version: "revised",
    step: 3,
    understanding: { requirements: 1 },
    history: ["science:unanswered:blocked"],
    copied: [canvasCopyKey("create", defaultCanvasSettings, "unanswered")],
    answers: [1, 0, 2],
    score: 3,
    verified: true,
    promptText: "private",
  };
  const r = sanitizeCanvas(raw);
  expect(r.applied).toBe("unanswered");
  expect(r.version).toBe("revised");
  expect(r.understanding).toEqual({ requirements: 1 });
  expect(r).not.toHaveProperty("answers");
  expect(r).not.toHaveProperty("score");
  expect(r).not.toHaveProperty("verified");
  expect(r).not.toHaveProperty("promptText");
  expect(
    sanitizeCanvas({
      version: "revised",
      applied: "invalid",
      history: ["private"],
      copied: ["unknown"],
      understanding: { proof: 9 },
      topic: "private",
    }),
  ).toEqual(freshCanvas());
});
it("saves and removes only chapter six without touching old activity or completion keys", () => {
  const keys = [
      "lab",
      "exploration",
      "services",
      "research",
      "notebook",
      "live",
    ].map((k) => `gemini-toranomaki:${k}:v1`),
    values = new Map(keys.map((k) => [k, `old:${k}`]));
  values.set(
    progressKey,
    JSON.stringify({
      completed: [
        "chapter-1",
        "chapter-2",
        "chapter-3",
        "chapter-4",
        "chapter-5",
        "chapter-6",
      ],
    }),
  );
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => values.set(k, v),
    removeItem: (k: string) => values.delete(k),
  });
  const r = { ...freshCanvas(), step: 2 };
  expect(saveCanvas(r)).toBe(true);
  expect(loadCanvas().record).toEqual(r);
  expect(loadProgress().progress.completed).toHaveLength(6);
  expect(removeCanvas()).toBe(true);
  expect(values.has(canvasKey)).toBe(false);
  for (const k of keys) expect(values.get(k)).toBe(`old:${k}`);
});
it("continues with safe defaults when JSON, read, quota or removal fail", () => {
  vi.stubGlobal("localStorage", {
    getItem: () => "{bad",
    setItem: () => {
      throw Error("quota");
    },
    removeItem: () => {
      throw Error("denied");
    },
  });
  expect(loadCanvas()).toEqual({ record: freshCanvas(), available: false });
  expect(saveCanvas(freshCanvas())).toBe(false);
  expect(removeCanvas()).toBe(false);
  vi.stubGlobal("localStorage", {
    getItem: () => {
      throw Error("denied");
    },
  });
  expect(loadCanvas().available).toBe(false);
});
