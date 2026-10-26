import { afterEach, describe, expect, it, vi } from "vitest";
import { loadProgress, saveProgress, resetProgress } from "./storage";
import { lessons } from "./curriculum";
afterEach(() => vi.unstubAllGlobals());
describe("progress", () => {
  it("saves, restores and resets valid progress", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => values.get(k) ?? null,
      setItem: (k: string, v: string) => values.set(k, v),
      removeItem: (k: string) => values.delete(k),
    });
    expect(saveProgress({ completed: ["chapter-1"] })).toBe(true);
    expect(loadProgress().progress.completed).toEqual(["chapter-1"]);
    expect(resetProgress()).toBe(true);
    expect(loadProgress().progress.completed).toEqual([]);
  });
  it("survives blocked storage", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw Error("blocked");
      },
      setItem: () => {
        throw Error("blocked");
      },
      removeItem: () => {
        throw Error("blocked");
      },
    });
    expect(loadProgress()).toEqual({
      progress: { completed: [] },
      available: false,
    });
    expect(saveProgress({ completed: [] })).toBe(false);
    expect(resetProgress()).toBe(false);
  });
  it("rejects corrupt and unknown completion data", () => {
    vi.stubGlobal("localStorage", { getItem: () => "{bad" });
    expect(loadProgress().progress.completed).toEqual([]);
    vi.stubGlobal("localStorage", {
      getItem: () =>
        JSON.stringify({
          completed: ["chapter-9", 1, "chapter-1", "chapter-1"],
        }),
    });
    expect(loadProgress().progress.completed).toEqual(["chapter-1"]);
  });
});
it("keeps Issue #1 curriculum order and chapters 1 through 8 available", () => {
  expect(lessons).toHaveLength(10);
  expect(lessons.map((l) => l.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  expect(lessons[2].title).toBe("Deep Research：調査計画から出典検証まで");
  expect(lessons.filter((l) => l.status === "ready").map((l) => l.id)).toEqual([
    "chapter-1",
    "chapter-2",
    "chapter-3",
    "chapter-4",
    "chapter-5",
    "chapter-6",
    "chapter-7",
    "chapter-8",
  ]);
  expect(lessons[0].steps).toHaveLength(6);
  for (const l of lessons) {
    expect(l.references[0].url).toMatch(/^https:\/\//);
    expect(l.conditions).toContain("未確認");
  }
});

it("reports deletion failure when stored progress is still readable", () => {
  const stored = JSON.stringify({ completed: ["chapter-1"] });
  vi.stubGlobal("localStorage", {
    getItem: () => stored,
    removeItem: () => {
      throw Error("deletion denied");
    },
  });
  expect(loadProgress().available).toBe(true);
  expect(resetProgress()).toBe(false);
  expect(loadProgress().progress.completed).toEqual(["chapter-1"]);
});
