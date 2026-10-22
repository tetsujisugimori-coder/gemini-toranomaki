import { afterEach, expect, it, vi } from "vitest";
import { features, goals } from "./exploration-data";
import {
  explorationKey,
  loadExploration,
  saveExploration,
  sanitizeExploration,
} from "./exploration-storage";
import { progressKey } from "./storage";
import { labKey } from "./lab-storage";
import { lessons } from "./curriculum";
afterEach(() => vi.unstubAllGlobals());
it("preserves existing records and round-trips separate exploration records", () => {
  const values = new Map([
    [progressKey, '{"completed":["chapter-1"]}'],
    [labKey, '{"original":true}'],
  ]);
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => values.set(k, v),
  });
  expect(
    saveExploration({ visited: ["model", "attach"], tried: ["attach"] }),
  ).toBe(true);
  expect(loadExploration().progress).toEqual({
    visited: ["model", "attach"],
    tried: ["attach"],
  });
  expect(values.get(progressKey)).toBe('{"completed":["chapter-1"]}');
  expect(values.get(labKey)).toBe('{"original":true}');
  expect(explorationKey).not.toBe(progressKey);
});
it("rejects malformed, duplicate and unknown records without crashing", () => {
  expect(
    sanitizeExploration({
      visited: ["model", "model", 42, "unknown"],
      tried: "attach",
    }),
  ).toEqual({ visited: ["model"], tried: [] });
  for (const value of ["null", "[]", "{broken"]) {
    vi.stubGlobal("localStorage", { getItem: () => value });
    expect(loadExploration().progress).toEqual({ visited: [], tried: [] });
  }
});
it("reports blocked reads and failed writes", () => {
  vi.stubGlobal("localStorage", {
    getItem: () => {
      throw Error("blocked");
    },
    setItem: () => {
      throw Error("quota");
    },
  });
  expect(loadExploration().available).toBe(false);
  expect(saveExploration({ visited: ["model"], tried: [] })).toBe(false);
});
it("routes learning goals to appropriate chapters and valid screen entrances", () => {
  const expected: Record<string, number[]> = {
    pdf: [4, 4],
    photo: [4, 5],
    illustration: [7],
    music: [8, 8],
    research: [3],
    math: [1, 1],
    app: [6],
    google: [2],
  };
  for (const [id, chapters] of Object.entries(expected))
    expect(
      goals.find((g) => g.id === id)?.recommendations.map((r) => r.chapter),
    ).toEqual(chapters);
  for (const g of goals)
    for (const r of g.recommendations) {
      expect(features.some((f) => f.id === r.feature)).toBe(true);
      expect(lessons.some((l) => l.number === r.chapter)).toBe(true);
    }
  expect(new Set(features.map((f) => f.id)).size).toBe(12);
});
