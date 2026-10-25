import { afterEach, expect, it, vi } from "vitest";
import {
  conversations,
  frames,
  livePrompt,
  practiceObjects,
  packageTruth,
  sharingCases,
} from "./live-data";
import {
  freshLive,
  historyIds,
  liveKey,
  loadLive,
  removeLive,
  sanitizeLive,
  saveLive,
} from "./live-storage";
import { loadProgress, progressKey } from "./storage";
afterEach(() => vi.unstubAllGlobals());
it("provides substantive, explained conversation changes for both topics", () => {
  for (const c of conversations) {
    expect(new Set(c.replies.map((r) => r[0])).size).toBe(4);
    expect(c.replies[1][1]).toMatch(/用語|比較/);
    expect(c.replies[2][1]).toContain("場面");
    for (const [reply, reason] of c.replies) {
      expect(reply).not.toBe(c.initial);
      expect(reason.length).toBeGreaterThan(20);
    }
  }
});
it("separates visible labels, uncertain claims and the explicit answer key", () => {
  expect(frames.map((f) => f.id)).toEqual(["whole", "zoom", "blur", "covered"]);
  expect(frames[0].visible).toContain(packageTruth.name);
  expect(frames[0].visible).not.toContain(packageTruth.amount);
  expect(frames[1].visible).toContain(packageTruth.amount);
  expect(frames[1].visible).toContain(packageTruth.description);
  expect(frames[1].visible).not.toContain(packageTruth.name);
  for (const id of ["blur", "covered"]) {
    const f = frames.find((f) => f.id === id)!;
    expect(f.visible).not.toContain(packageTruth.amount);
    expect(f.visible).not.toContain(packageTruth.description);
    expect(f.good).toMatch(/文字|読め|隠れ/);
    expect(f.reason).toMatch(/現在|今読め/);
  }
  expect(frames[2].visible).not.toContain(packageTruth.name);
  for (const f of frames) {
    expect(f.bad).not.toBe(f.good);
    expect(f.reason.length).toBeGreaterThan(30);
  }
});
it("judges sharing by purpose rather than always sharing a screen", () => {
  expect(sharingCases[0].answer).toBe(1);
  expect(sharingCases[1].answer).toBe(2);
  for (const s of sharingCases) {
    expect(s.extra).toContain("架空");
    expect(s.reasons).toHaveLength(3);
    expect(s.reasons[s.answer]).toBeTruthy();
  }
});
it("versions fixed practice copy text without inventing the learner's real object result", () => {
  const first = livePrompt("package-v1"),
    second = livePrompt("cup-v1");
  expect(first).not.toBe(second);
  for (const p of [first, second]) {
    expect(p).toContain("今見えている文字や特徴だけ");
    expect(p).toContain("原物と照合");
    expect(p).not.toContain(packageTruth.name);
    expect(p).not.toContain(packageTruth.amount);
  }
});
it("round trips fixed selections and current answers, keeps history separate and preserves old records", () => {
  const oldKeys = [
    "lab",
    "exploration",
    "services",
    "research",
    "notebook",
  ].map((k) => `gemini-toranomaki:${k}:v1`);
  const values = new Map(oldKeys.map((k) => [k, `old:${k}`]));
  values.set(
    progressKey,
    JSON.stringify({
      completed: [
        "chapter-1",
        "chapter-2",
        "chapter-3",
        "chapter-4",
        "chapter-5",
      ],
    }),
  );
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => values.set(k, v),
    removeItem: (k: string) => values.delete(k),
  });
  const record = {
    ...freshLive(),
    frame: "blur",
    packageAnswer: 2,
    followup: 1,
    conversationAnswer: 1,
    copied: [practiceObjects[0].id],
    history: historyIds,
  } as const;
  const data = { ...record, copied: [...record.copied] };
  expect(saveLive(data)).toBe(true);
  expect(loadLive().record).toEqual(data);
  expect(loadProgress().progress.completed).toHaveLength(5);
  expect(removeLive()).toBe(true);
  expect(loadLive().record).toEqual(freshLive());
  for (const key of oldKeys) expect(values.get(key)).toBe(`old:${key}`);
});
it("filters unknown IDs and private fields, and does not grant current answers from history", () => {
  const r = sanitizeLive({
    step: 99,
    frame: "private image",
    packageAnswer: 1,
    conversation: "private speech",
    conversationAnswer: 1,
    followup: 0,
    sharing: "private screen",
    sharingAnswer: 0,
    stopAnswer: 0,
    history: ["package:whole", "package:whole", "secret"],
    copied: ["package-v1", "secret"],
    audio: "secret",
    image: "secret",
    prompt: "secret",
  });
  expect(r.step).toBe(0);
  expect(r.packageAnswer).toBeNull();
  expect(r.conversationAnswer).toBeNull();
  expect(r.sharingAnswer).toBeNull();
  expect(r.stopAnswer).toBeNull();
  expect(r.history).toEqual(["package:whole"]);
  expect(r.copied).toEqual(["package-v1"]);
  expect(r).not.toHaveProperty("audio");
  expect(r).not.toHaveProperty("image");
  expect(r).not.toHaveProperty("prompt");
  expect(
    sanitizeLive({ copied: true, packageAnswer: -1, tried: "true" }).copied,
  ).toEqual([]);
});
it("reports corrupt, denied and quota-limited storage without blocking in-memory learning", () => {
  vi.stubGlobal("localStorage", {
    getItem: () => "{bad",
    setItem: () => {
      throw Error("quota");
    },
    removeItem: () => {
      throw Error("denied");
    },
  });
  expect(loadLive()).toEqual({ record: freshLive(), available: false });
  expect(saveLive(freshLive())).toBe(false);
  expect(removeLive()).toBe(false);
  vi.stubGlobal("localStorage", {
    getItem: () => {
      throw Error("denied");
    },
  });
  expect(loadLive().available).toBe(false);
  expect(liveKey).toBe("gemini-toranomaki:live:v1");
});
