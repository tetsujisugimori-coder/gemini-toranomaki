import { afterEach, describe, expect, it, vi } from "vitest";
import { buildPrompt, buildRevision, defaults } from "./lab-prompts";
import { experiences } from "./lab-data";
import { emptyRecord, labKey, loadLab, saveLab } from "./lab-storage";
afterEach(() => vi.unstubAllGlobals());
describe("lab prompt generation", () => {
  for (const { id } of experiences)
    it(`${id}: every editable condition affects the prompt`, () => {
      const baseline = buildPrompt(id, defaults[id]);
      expect(baseline.length).toBeGreaterThan(30);
      for (const key of Object.keys(defaults[id]).filter(
        (k) => k !== "change",
      )) {
        const next = buildPrompt(id, { ...defaults[id], [key]: "テスト変更" });
        expect(next).not.toBe(baseline);
        expect(next).toContain("テスト変更");
      }
    });
  it("image revision explicitly preserves other elements", () => {
    expect(buildRevision(defaults.image)).toContain(
      "エプロンの色だけを青にする",
    );
    expect(buildRevision(defaults.image)).toContain("維持");
  });
});
describe("lab progress privacy and resilience", () => {
  it("only restores known ids and valid records", () => {
    vi.stubGlobal("localStorage", {
      getItem: () =>
        JSON.stringify({
          ask: {
            copied: true,
            tried: false,
            applied: true,
            check: 9,
            source: "private",
          },
          other: { copied: true },
        }),
    });
    expect(loadLab()).toEqual({
      available: true,
      progress: {
        ask: { copied: true, tried: false, applied: true, check: null },
      },
    });
  });
  it("saves no learner text and leaves chapter storage untouched", () => {
    const setItem = vi.fn();
    vi.stubGlobal("localStorage", { setItem });
    saveLab({
      ask: { ...emptyRecord(), copied: true, source: "private" } as ReturnType<
        typeof emptyRecord
      >,
    });
    expect(setItem).toHaveBeenCalledWith(
      labKey,
      JSON.stringify({
        ask: { copied: true, tried: false, applied: false, check: null },
      }),
    );
  });
  it("handles corrupt and blocked storage", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => "{",
      setItem: () => {
        throw Error("denied");
      },
    });
    expect(loadLab().available).toBe(false);
    expect(saveLab({})).toBe(false);
  });
});
