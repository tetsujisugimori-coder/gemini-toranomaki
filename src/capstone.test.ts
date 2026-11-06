import { afterEach, describe, expect, it, vi } from "vitest";
import { topics, versions } from "./capstone-data";
import {
  answerCorrect,
  capstonePrompt,
  evidenceOptions,
  notebookText,
  qualityCase,
  qualityReady,
  stageReady,
} from "./capstone-engine";
import {
  capstoneKey,
  changeAssignment,
  freshCapstone,
  invalidateFrom,
  loadCapstone,
  removeCapstone,
  sanitizeCapstone,
  saveCapstone,
  type CapstoneRecord,
} from "./capstone-storage";
import { loadProgress, progressKey, resetProgress } from "./storage";
afterEach(() => vi.unstubAllGlobals());
function storage() {
  const map = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => map.set(k, v),
    removeItem: (k: string) => map.delete(k),
  });
  return map;
}
function candidate(): CapstoneRecord {
  return {
    ...freshCapstone(),
    plan: [0, 1, 2, 3],
    prediction: 0,
    researched: true,
    research: [1, 2, 0],
    compared: true,
    notebook: 2,
    prompt: [0, 1, 2, 3],
    created: true,
    applied: true,
    repairStyle: 1,
    trials: [...versions],
  };
}
function checked(r: CapstoneRecord) {
  for (const v of versions)
    r.quality[v] = r.quality[v].map((_, i) => {
      const c = qualityCase(r, v, i);
      return {
        verdict: c.verdict,
        evidence: i % 3,
        improvement: c.improvement,
        checked: true,
      };
    });
  return r;
}
describe("capstone evidence and assignment", () => {
  for (const topic of topics)
    it(`${topic.id}: report and original have different dates; unsupported claim needs evidence`, () => {
      const r = { ...candidate(), topic: topic.id };
      expect(topic.wrong).not.toBe(topic.fact);
      expect(topic.original).not.toContain(topic.unsupported);
      expect(stageReady(r, 2)).toBe(true);
      for (const answers of [
        [0, 2, 0],
        [1, 0, 0],
        [1, 2, 2],
      ])
        expect(stageReady({ ...r, research: answers }, 2)).toBe(false);
      expect(capstonePrompt({ ...r, step: 2 })).toContain(topic.purpose);
      expect(capstonePrompt({ ...r, step: 3 })).toContain(topic.fact);
    });
  it("does not equate a citation with support", () => {
    const r = candidate();
    expect(stageReady({ ...r, notebook: 0 }, 3)).toBe(false);
    expect(stageReady({ ...r, notebook: 1 }, 3)).toBe(false);
    expect(stageReady({ ...r, notebook: 2 }, 3)).toBe(true);
  });
  it("reflects removed sources and excludes unsupported memos", () => {
    const r = candidate();
    expect(notebookText({ ...r, sources: [] })).toContain("資料不足で保留");
    expect(notebookText({ ...r, sources: [0] })).toContain("S2がなく");
    expect(notebookText({ ...r, sources: [0, 1, 2] })).toContain("採用しない");
    expect(stageReady({ ...r, sources: [0, 1, 2] }, 3)).toBe(false);
    expect(stageReady({ ...r, sources: [0] }, 3)).toBe(false);
  });
  it("keeps comparison when the question judgment is updated explicitly", () => {
    const r = candidate();
    expect(
      invalidateFrom(r, 3, { notebook: 2, compared: r.compared }).compared,
    ).toBe(true);
    expect(invalidateFrom(r, 3, { sources: [0] }).compared).toBe(false);
  });
  it("initial checks have independent expected judgments and repairs", () => {
    const r = candidate();
    expect(
      Array.from(
        { length: 10 },
        (_, i) => qualityCase(r, "initial", i).verdict,
      ),
    ).toEqual([0, 1, 1, 1, 1, 1, 2, 0, 0, 1]);
    expect(
      Array.from(
        { length: 10 },
        (_, i) => qualityCase(r, "initial", i).improvement,
      ),
    ).toEqual([0, 2, 1, 1, 1, 2, 3, 0, 0, 2]);
  });
  it("repair changes facts but regresses operation and preservation", () => {
    const r = candidate();
    expect(
      Array.from({ length: 10 }, (_, i) => qualityCase(r, "repair", i).verdict),
    ).toEqual([0, 1, 0, 0, 0, 1, 1, 1, 0, 0]);
    expect(qualityCase(r, "repair", 6).improvement).toBe(4);
    expect(qualityCase(r, "repair", 7).improvement).toBe(3);
    expect(
      Array.from({ length: 10 }, (_, i) => qualityCase(r, "final", i).verdict),
    ).toEqual(Array(10).fill(0));
  });
  it("missing information and no operation remain pending rather than passes", () => {
    const r = candidate();
    expect(qualityCase({ ...r, trials: [] }, "final", 7).verdict).toBe(2);
    expect(qualityCase({ ...r, sources: [] }, "final", 2).verdict).toBe(2);
    expect(
      qualityCase({ ...r, artifact: 1, requirements: [] }, "final", 7).verdict,
    ).toBe(2);
  });
  it("requires actual three-condition trial records for interactive final achievement", () => {
    const r = checked({ ...candidate(), trials: [] });
    expect(qualityReady(r, "final")).toBe(true);
    expect(stageReady(r, 5)).toBe(false);
    expect(stageReady(r, 6)).toBe(false);
    expect(stageReady(checked(candidate()), 6)).toBe(true);
  });
  it("AI success and polished appearance never substitute for evidence", () => {
    const r = checked(candidate());
    for (const v of versions)
      for (let i = 0; i < 10; i++) {
        expect(evidenceOptions(r, v, i)[i % 3]).toBe(
          qualityCase(r, v, i).evidence,
        );
        expect(
          answerCorrect(r, v, i, { ...r.quality[v][i], evidence: (i + 1) % 3 }),
        ).toBe(false);
      }
    expect(qualityReady({ ...r, created: false }, "final")).toBe(false);
  });
  it("judgments, evidence, improvement and explicit checking are all required", () => {
    const r = checked(candidate());
    for (const prop of ["verdict", "evidence", "improvement"] as const) {
      const quality = {
        ...r.quality,
        final: r.quality.final.map((a, i) =>
          i === 0 ? { ...a, [prop]: -1 } : a,
        ),
      };
      expect(qualityReady({ ...r, quality }, "final")).toBe(false);
    }
    expect(
      qualityReady(
        {
          ...r,
          quality: {
            ...r.quality,
            final: r.quality.final.map((a) => ({ ...a, checked: false })),
          },
        },
        "final",
      ),
    ).toBe(false);
  });
  it("incomplete production instruction is not a complete capstone", () => {
    const r = checked(candidate());
    expect(stageReady({ ...r, prompt: [0] }, 4)).toBe(false);
    expect(stageReady({ ...r, prompt: [0] }, 6)).toBe(false);
    expect(qualityCase({ ...r, prompt: [] }, "initial", 5).evidence).toContain(
      "指示自体",
    );
  });
  it("assembled prompts include full conditions and substantive repair safeguards", () => {
    const r = candidate();
    const p = capstonePrompt(r, "今回だけの自由な条件");
    for (const word of [
      "今回だけの自由な条件",
      "対象読者",
      "原文",
      "維持",
      "未確認",
    ])
      expect(p).toContain(word);
    expect(capstonePrompt({ ...r, step: 6, repairStyle: 0 })).toBe("直して。");
    expect(capstonePrompt({ ...r, step: 6 })).toContain("同じ入力");
    expect(capstonePrompt({ ...r, prompt: [] })).toContain("未指定");
  });
  it("all six reasoned self evaluations are required independently of progress", () => {
    const r = candidate();
    expect(stageReady(r, 7)).toBe(false);
    expect(
      stageReady(
        { ...r, ratings: [0, 1, 2, 0, 1, 2], reasons: [0, 1, 2, 0, 1, 2] },
        7,
      ),
    ).toBe(true);
    expect(stageReady(r, 8)).toBe(false);
  });
});
describe("capstone storage isolation and invalidation", () => {
  it("persists only whitelisted fixed values, never additional free text", () => {
    const map = storage();
    const r = {
      ...candidate(),
      custom: "secret",
      externalAnswer: "private",
      credentials: "token",
      history: ["history:2", "private"],
      copied: ["business:6", "untrusted"],
      research: [1, 2, 0, 99],
    };
    expect(saveCapstone(r)).toBe(true);
    const raw = map.get(capstoneKey)!;
    for (const value of ["secret", "private", "token", "untrusted"])
      expect(raw).not.toContain(value);
    expect(loadCapstone().record.history).toEqual(["history:2"]);
    expect(loadCapstone().record.research).toEqual([1, 2, 0]);
  });
  it("validates unknown types, oversized values and exact array lengths", () => {
    const r = sanitizeCapstone({
      topic: "history",
      step: 99,
      mode: -2,
      sources: [0, 1, 1, "2", 9],
      plan: [3, 2, 1, 0],
      quality: {
        initial: [
          { verdict: 99, evidence: 4, improvement: 6, checked: "true" },
        ],
      },
      ratings: [99, null, "1", 2],
      version: "other",
    });
    expect(r.topic).toBe("history");
    expect(
      sanitizeCapstone({ topic: "unknown", achieved: [2, 3] }).achieved,
    ).toEqual([]);
    expect(r.step).toBe(0);
    expect(r.sources).toEqual([0, 1]);
    expect(r.plan).toEqual([0, 1, 2, 3]);
    expect(r.quality.initial[0]).toEqual({
      verdict: -1,
      evidence: -1,
      improvement: -1,
      checked: false,
    });
    expect(r.ratings).toEqual([-1, -1, -1, 2, -1, -1]);
    expect(r.version).toBe("initial");
    expect(sanitizeCapstone(null)).toEqual(freshCapstone());
  });
  it("round trips current and historical records without promoting external success", () => {
    storage();
    const r = checked({
      ...candidate(),
      real: [1, 2, 3, 0, 0, 0, 0, 0],
      history: ["history:2"],
    });
    expect(saveCapstone(r)).toBe(true);
    expect(loadCapstone().record).toEqual(r);
    expect(loadCapstone().record.achieved).toEqual([]);
  });
  it("assignment changes retain history but invalidate all current conclusions", () => {
    const r = checked({
      ...candidate(),
      achieved: [0, 1, 2, 3, 4, 5, 6, 7],
      history: ["history:2"],
      copied: ["history:4"],
      real: Array(8).fill(1),
    });
    const n = changeAssignment(r, {
      topic: "education",
      artifact: 1,
      requirements: [0],
    });
    expect(n.topic).toBe("education");
    expect(n.history).toEqual(r.history);
    expect(n.copied).toEqual(r.copied);
    expect(n.achieved).toEqual([]);
    expect(n.real).toEqual(Array(8).fill(0));
    expect(n.quality.final.every((a) => !a.checked)).toBe(true);
    expect(n.created).toBe(false);
  });
  for (const step of [2, 3, 4, 5, 6, 7])
    it(`retry from ${step} preserves historic records and other earlier stages`, () => {
      const r = checked({
        ...candidate(),
        achieved: [0, 1, 2, 3, 4, 5, 6, 7],
        history: ["history:2"],
        copied: ["history:4"],
        real: Array(8).fill(1),
      });
      const n = invalidateFrom(r, step);
      expect(n.achieved).toEqual(r.achieved.filter((x) => x < step));
      expect(n.history).toEqual(r.history);
      expect(n.copied).toEqual(r.copied);
      expect(n.real.slice(step)).toEqual(Array(8 - step).fill(0));
      if (step <= 5) expect(n.trials).toEqual([]);
      if (step === 6) expect(n.quality.initial).toEqual(r.quality.initial);
    });
  it("per chapter reset leaves every other key intact and global reset removes only progress", () => {
    const map = storage();
    map.set("gemini-toranomaki:research:v1", "older");
    map.set("gemini-toranomaki:services-practice:v1", "older2");
    map.set(
      progressKey,
      JSON.stringify({ completed: ["chapter-1", "chapter-9", "chapter-10"] }),
    );
    saveCapstone(candidate());
    expect(loadProgress().progress.completed).toEqual([
      "chapter-1",
      "chapter-9",
      "chapter-10",
    ]);
    expect(removeCapstone()).toBe(true);
    expect(map.get("gemini-toranomaki:research:v1")).toBe("older");
    expect(map.get("gemini-toranomaki:services-practice:v1")).toBe("older2");
    expect(loadProgress().progress.completed).toHaveLength(3);
    saveCapstone(candidate());
    expect(resetProgress()).toBe(true);
    expect(map.has(capstoneKey)).toBe(true);
  });
  it("handles denied reads, writes and removes without throwing or false success", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw Error("denied");
      },
      setItem: () => {
        throw Error("quota");
      },
      removeItem: () => {
        throw Error("denied");
      },
    });
    expect(loadCapstone().available).toBe(false);
    expect(saveCapstone(candidate())).toBe(false);
    expect(removeCapstone()).toBe(false);
  });
  it("corrupt JSON recovers in memory and does not overwrite storage on load", () => {
    const map = storage();
    map.set(capstoneKey, "{bad");
    expect(loadCapstone()).toEqual({
      record: freshCapstone(),
      available: false,
      protected: true,
    });
    expect(map.get(capstoneKey)).toBe("{bad");
  });
});
it("STEP 6 retry preserves initial operational evidence and invalidates only revisions", () => {
  const r = checked(candidate());
  const n = invalidateFrom(r, 6);
  expect(n.trials).toEqual(["initial"]);
  expect(qualityReady(n, "initial")).toBe(true);
  expect(qualityReady(n, "repair")).toBe(false);
  expect(qualityReady(n, "final")).toBe(false);
});
it("quality follows selected conditions and the instruction in every version", () => {
  const r = candidate();
  expect(qualityCase({ ...r, requirements: [2] }, "initial", 1).verdict).toBe(
    0,
  );
  expect(qualityCase({ ...r, requirements: [] }, "initial", 1).verdict).toBe(0);
  expect(
    qualityCase({ ...r, requirements: [0] }, "initial", 1).evidence,
  ).toContain("原文と出典ID");
  expect(
    qualityCase({ ...r, requirements: [0] }, "initial", 1).evidence,
  ).not.toContain("解説");
  for (const v of versions)
    expect(qualityCase({ ...r, prompt: [0] }, v, 5).verdict).toBe(1);
  expect(
    qualityCase({ ...r, requirements: [] }, "initial", 9).evidence,
  ).toContain("本文には説明がない");
});
it("independent P2-1: broken revision cannot satisfy required explanation or instructions", () => {
  const r = candidate();
  expect(qualityCase(r, "repair", 1).verdict).toBe(1);
  expect(qualityCase(r, "repair", 1).improvement).toBe(3);
  expect(qualityCase(r, "repair", 1).evidence).toContain("解説");
  expect(qualityCase(r, "repair", 5).verdict).toBe(1);
  expect(qualityCase(r, "repair", 5).improvement).toBe(3);
  expect(qualityCase(r, "repair", 7).verdict).toBe(1);
});
it("independent P2-2: valid JSON with corrupt types and unrelated achievements is protected", () => {
  const map = storage(),
    raw = JSON.stringify({
      achieved: [2, 3, 4, 5, 6, 7],
      topic: "corrupt",
      created: "true",
    });
  map.set(capstoneKey, raw);
  const loaded = loadCapstone();
  expect(loaded.record.achieved).toEqual([]);
  expect(loaded.available).toBe(false);
  expect(map.get(capstoneKey)).toBe(raw);
  expect(loaded.record.created).toBe(false);
});
it("storage correlation rejects impossible current successes but preserves historical IDs", () => {
  const map = storage();
  const raw = JSON.stringify({
    ...freshCapstone(),
    achieved: [2, 3, 4, 5, 6, 7],
    history: ["education:2"],
    copied: ["history:4"],
  });
  map.set(capstoneKey, raw);
  const loaded = loadCapstone();
  expect(loaded.record.achieved).toEqual([]);
  expect(loaded.record.history).toEqual(["education:2"]);
  expect(loaded.record.copied).toEqual(["history:4"]);
  expect(loaded.protected).toBe(true);
  expect(map.get(capstoneKey)).toBe(raw);
});
it("load rejects wrong boolean/ID/answer types and primitive JSON without rewriting originals", () => {
  const map = storage();
  for (const raw of [
    "42",
    "null",
    "[]",
    JSON.stringify({ ...freshCapstone(), created: "true" }),
    JSON.stringify({ ...freshCapstone(), topic: "corrupt" }),
    JSON.stringify({ ...freshCapstone(), requirements: [0, 7] }),
    JSON.stringify({ ...freshCapstone(), research: [1, "2", 0] }),
    JSON.stringify({ ...freshCapstone(), extra: "not persisted" }),
  ]) {
    map.set(capstoneKey, raw);
    const loaded = loadCapstone();
    expect(loaded.available).toBe(false);
    expect(loaded.protected).toBe(true);
    expect(map.get(capstoneKey)).toBe(raw);
  }
  map.delete(capstoneKey);
  expect(loadCapstone().protected).toBe(false);
});
it("shared artifact features make the rubric track explanation availability in every topic/condition/version", () => {
  for (const topic of topics)
    for (let mask = 0; mask < 8; mask++) {
      const requirements = [0, 1, 2].filter((i) => mask & (1 << i));
      const r = { ...candidate(), topic: topic.id, requirements };
      for (const v of versions) {
        const missing =
          v === "initial"
            ? requirements.some((i) => i !== 2)
            : v === "repair"
              ? requirements.includes(2)
              : false;
        expect(qualityCase(r, v, 1).verdict).toBe(missing ? 1 : 0);
        expect(qualityCase(r, v, 5).verdict).toBe(v === "final" ? 0 : 1);
      }
    }
});
