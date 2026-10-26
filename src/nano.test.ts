import { afterEach, expect, it, vi } from "vitest";
import {
  characterPrompt,
  compositions,
  copyId,
  defaultEdit,
  editPrompt,
  imagePrompt,
  nanoReferences,
  pins,
  regions,
  repairPrompt,
  sameRegions,
  subjects,
  backgrounds,
  styles,
  tasks,
} from "./nano-data";
import {
  freshNano,
  loadNano,
  nanoKey,
  removeNano,
  sanitizeNano,
  saveNano,
} from "./nano-storage";
import { loadProgress, progressKey } from "./storage";
afterEach(() => vi.unstubAllGlobals());
it("all 81 conditions have deterministic complete distinct instructions", () => {
  const prompts = new Set();
  for (let a = 0; a < 3; a++)
    for (let b = 0; b < 3; b++)
      for (let c = 0; c < 3; c++)
        for (let d = 0; d < 3; d++) {
          const s = { subject: a, background: b, style: c, composition: d },
            text = imagePrompt(s);
          expect(text).toContain(subjects[a]);
          expect(text).toContain(backgrounds[b]);
          expect(text).toContain(styles[c]);
          expect(text).toContain(compositions[d]);
          expect(imagePrompt({ ...s })).toBe(text);
          prompts.add(text);
        }
  expect(prompts.size).toBe(81);
});
it("edit prompts name changed/retained/checked objects and flag omissions", () => {
  for (let i = 0; i < 3; i++) {
    const t = tasks[i],
      c = {
        ...defaultEdit,
        target: regions.findIndex((r) => r.id === t.target),
        result: i,
      },
      p = editPrompt(i, c);
    expect(p).toContain(t.result);
    expect(p).toContain(t.keep);
    expect(p).toContain(t.inspection);
    expect(editPrompt(i, { ...c, preserve: false })).toContain(
      "維持するものは未指定",
    );
    expect(editPrompt(i, { ...c, inspect: false })).toContain(
      "確認箇所は未指定",
    );
  }
});
it("repair prompt responds to all four evidence sections", () => {
  for (let task = 0; task < 3; task++) {
    const p = repairPrompt(task, [true, true, true, true]);
    for (const text of [
      tasks[task].evidence,
      tasks[task].fix,
      tasks[task].maintain,
      tasks[task].inspection,
    ])
      expect(p).toContain(text);
    expect(repairPrompt(task, [false, false, false, false])).not.toContain(
      tasks[task].evidence,
    );
  }
});
it("character instructions select only pinned features and do not promise identity", () => {
  for (let mask = 0; mask < 32; mask++) {
    const selected = pins.flatMap((_, i) => (mask & (1 << i) ? [i] : [])),
      p = characterPrompt(selected);
    pins.forEach((pin, i) =>
      expect(p.includes(`${pin}（参照画像の特徴）`)).toBe(selected.includes(i)),
    );
    expect(p).toContain("保証するものではありません");
  }
});
it("exact unordered observations reject missed/extra regions", () => {
  expect(sameRegions(["hat", "eyes"], ["eyes", "hat"])).toBe(true);
  expect(sameRegions(["hat"], ["hat", "eyes"])).toBe(false);
  expect(sameRegions(["hat", "eyes", "shirt"], ["hat", "eyes"])).toBe(false);
  for (const t of tasks) expect(t.target).not.toBe(t.unexpected);
});
it("all hit regions lie in the shared image coordinate system", () => {
  regions.forEach((r) => {
    expect(r.x).toBeGreaterThanOrEqual(0);
    expect(r.y).toBeGreaterThanOrEqual(0);
    expect(r.x + r.w).toBeLessThanOrEqual(600);
    expect(r.y + r.h).toBeLessThanOrEqual(440);
  });
});
it("copy identities follow complete text and problem revision", () => {
  const text = imagePrompt(freshNano().image);
  expect(copyId("workshop", text)).toBe(copyId("workshop", text));
  expect(copyId("workshop", text + "x")).not.toBe(copyId("workshop", text));
  expect(copyId("edit", text)).not.toBe(copyId("workshop", text));
});
it("OS references are explicit and the common reference belongs to all OSs", () => {
  for (const os of ["pc", "ios", "android"]) {
    const refs = nanoReferences.filter((r) => r.os === os || r.os === "all");
    expect(refs).toHaveLength(2);
    expect(refs[0].os).toBe(os);
    expect(refs[1].os).toBe("all");
  }
});
it("sanitizer accepts fixed histories but never current explanation or slider", () => {
  const r = sanitizeNano({
    ...freshNano(),
    answers: {
      "find:hat-v1": ["eyes", "eyes", "hat", "secret"],
      "find:hat-v0": ["hat"],
      "character:v1": ["0:same", "4:different", "secret"],
    },
    history: ["find:hat-v1", "bad", "find:hat-v1"],
    copied: [copyId("workshop", "x"), "user text"],
    slider: 99,
    explanation: true,
    externalImage: "secret",
  });
  expect(r.answers).toEqual({
    "find:hat-v1": ["eyes", "hat"],
    "character:v1": ["0:same", "4:different"],
  });
  expect(r.history).toEqual(["find:hat-v1"]);
  expect(r.copied).toHaveLength(1);
  expect(r).not.toHaveProperty("slider");
  expect(r).not.toHaveProperty("explanation");
  expect(r).not.toHaveProperty("externalImage");
});
it("invalid types, out of range settings and old unknown IDs are safe", () => {
  expect(sanitizeNano(null)).toEqual(freshNano());
  const r = sanitizeNano({
    step: 99,
    image: { subject: 3, background: -1, composition: 0.5, style: "2" },
    pins: [0, 0, 9, "1"],
    answers: { "find:hat-v1": "hat" },
    tried: "yes",
  });
  expect(r.step).toBe(0);
  expect(r.image).toEqual(freshNano().image);
  expect(r.pins).toEqual([0]);
  expect(r.answers).toEqual({});
  expect(r.tried).toBe(false);
});
it("roundtrips only chapter 7 state and preserves old keys/completions", () => {
  const values = new Map<string, string>([
    [
      progressKey,
      JSON.stringify({ completed: ["chapter-1", "chapter-6", "chapter-7"] }),
    ],
    ["gemini-toranomaki:canvas:v1", "old"],
  ]);
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => values.set(k, v),
    removeItem: (k: string) => values.delete(k),
  });
  const r = {
    ...freshNano(),
    step: 2,
    history: ["find:hat-v1"],
    answers: { "find:hat-v1": ["hat", "eyes"] },
  };
  expect(saveNano(r)).toBe(true);
  expect(loadNano().record).toEqual(r);
  expect(loadProgress().progress.completed).toEqual([
    "chapter-1",
    "chapter-6",
    "chapter-7",
  ]);
  expect(removeNano()).toBe(true);
  expect(values.has(nanoKey)).toBe(false);
  expect(values.get("gemini-toranomaki:canvas:v1")).toBe("old");
  expect(values.has(progressKey)).toBe(true);
});
it("corrupt JSON, rejected reads/writes and quota failures never claim persistence", () => {
  vi.stubGlobal("localStorage", {
    getItem: () => "{bad",
    setItem: () => {
      throw new DOMException("quota", "QuotaExceededError");
    },
    removeItem: () => {
      throw Error("denied");
    },
  });
  expect(loadNano()).toEqual({ record: freshNano(), available: false });
  expect(saveNano(freshNano())).toBe(false);
  expect(removeNano()).toBe(false);
  vi.stubGlobal("localStorage", {
    getItem: () => {
      throw Error("denied");
    },
  });
  expect(loadNano().available).toBe(false);
});
it("all finite prompt fingerprints map back to the exact same text without collisions", () => {
  const known = new Map<string, string>();
  function check(kind: string, text: string) {
    const id = copyId(kind, text);
    if (known.has(id)) expect(known.get(id)).toBe(text);
    known.set(id, text);
  }
  for (let a = 0; a < 3; a++)
    for (let b = 0; b < 3; b++)
      for (let c = 0; c < 3; c++)
        for (let d = 0; d < 3; d++)
          check(
            "workshop",
            imagePrompt({
              subject: a,
              background: b,
              style: c,
              composition: d,
            }),
          );
  for (let task = 0; task < 3; task++) {
    for (let target = 0; target < 6; target++)
      for (let result = 0; result < 3; result++)
        for (const preserve of [true, false])
          for (const inspect of [true, false])
            check(
              "edit",
              editPrompt(task, { target, result, preserve, inspect }),
            );
    for (let mask = 0; mask < 16; mask++) {
      const flags = [0, 1, 2, 3].map((i) => !!(mask & (1 << i)));
      check("repair", repairPrompt(task, flags));
    }
  }
  for (let mask = 0; mask < 32; mask++)
    check(
      "character",
      characterPrompt(pins.flatMap((_, i) => (mask & (1 << i) ? [i] : []))),
    );
  expect(known.size).toBeGreaterThan(300);
});

it("character answers reject region IDs while preserving valid ordered values", () => {
  const answers = sanitizeNano({
    answers: {
      "character:v1": [
        "hat",
        "4:different",
        "0:same",
        "eyes",
        "0:same",
        "unknown",
      ],
    },
  }).answers;
  expect(answers).toEqual({ "character:v1": ["4:different", "0:same"] });
});

it.each(["edit", "find"])(
  "%s answers keep only region IDs for every versioned task",
  (kind) => {
    for (const task of tasks) {
      const id = `${kind}:${task.id}`;
      expect(
        sanitizeNano({
          answers: {
            [id]: [
              "eyes",
              "0:same",
              "hat",
              "4:different",
              "eyes",
              "unknown",
              1,
              null,
              {},
            ],
          },
        }).answers,
      ).toEqual({ [id]: ["eyes", "hat"] });
    }
  },
);

it("answer IDs and value arrays reject unknown revisions and invalid types", () => {
  expect(
    sanitizeNano({
      answers: {
        "character:v0": ["0:same"],
        "character:v2": ["4:different"],
        "edit:hat-v0": ["hat"],
        "find:unknown-v1": ["eyes"],
        "character:v1": [
          0,
          null,
          false,
          {},
          [],
          "5:same",
          "-1:same",
          "00:same",
          "0:Same",
        ],
        "edit:hat-v1": "hat",
        "find:hat-v1": { value: "eyes" },
      },
    }).answers,
  ).toEqual({ "character:v1": [] });
});

it("character answer format is exact, including rejection of trailing line endings", () => {
  expect(
    sanitizeNano({
      answers: {
        "character:v1": [
          "0:same\n",
          "1:different\r",
          "2:same\r\n",
          "3:same\u2028",
          "4:different\u2029",
          " 0:same",
          "0:same ",
          "4:different",
        ],
      },
    }).answers,
  ).toEqual({ "character:v1": ["4:different"] });
});

it("normal legacy answer records preserve all formats, order and other chapter-seven fields", () => {
  const valid = {
    ...freshNano(),
    step: 3,
    image: { subject: 2, background: 1, style: 2, composition: 1 },
    pins: [4, 0, 2],
    history: ["workshop:v1", "find:apple-v1", "character:v1"],
    copied: [copyId("character", characterPrompt([4, 0, 2]))],
    tried: true,
    answers: {
      ...Object.fromEntries(
        tasks.flatMap((t) => [
          [`edit:${t.id}`, regions.map((r) => r.id).reverse()],
          [`find:${t.id}`, regions.map((r) => r.id)],
        ]),
      ),
      "character:v1": [4, 3, 2, 1, 0].flatMap((i) => [
        `${i}:different`,
        `${i}:same`,
      ]),
    },
  };
  expect(sanitizeNano(valid)).toEqual(valid);
});

it("load and save remove cross-kind contamination without writing other keys or mutating stored input on read", () => {
  const raw = JSON.stringify({
    ...freshNano(),
    answers: {
      "character:v1": ["hat", "4:different", "0:same", "4:different"],
      "edit:hat-v1": ["eyes", "0:same", "hat", "eyes"],
      "find:hat-v1": ["hat", "4:different", "eyes"],
    },
  });
  const oldKeys = [
    progressKey,
    "gemini-toranomaki:canvas:v1",
    "gemini-toranomaki:lab:v1",
    "gemini-toranomaki:exploration:v1",
  ];
  const values = new Map<string, string>([
    [nanoKey, raw],
    ...oldKeys.map((k) => [k, `old:${k}`] as [string, string]),
  ]);
  const writes: string[] = [];
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => {
      writes.push(k);
      values.set(k, v);
    },
  });
  const expected = {
    "edit:hat-v1": ["eyes", "hat"],
    "find:hat-v1": ["hat", "eyes"],
    "character:v1": ["4:different", "0:same"],
  };
  const loaded = loadNano();
  expect(loaded.available).toBe(true);
  expect(loaded.record.answers).toEqual(expected);
  expect(values.get(nanoKey)).toBe(raw);
  expect(writes).toEqual([]);
  expect(saveNano({ ...freshNano(), answers: JSON.parse(raw).answers })).toBe(
    true,
  );
  expect(JSON.parse(values.get(nanoKey)!).answers).toEqual(expected);
  expect(loadNano().record.answers).toEqual(expected);
  expect(writes).toEqual([nanoKey]);
  for (const key of oldKeys) expect(values.get(key)).toBe(`old:${key}`);
});
