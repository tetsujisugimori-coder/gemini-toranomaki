import { afterEach, describe, expect, it, vi } from "vitest";
import {
  defaultVideo,
  defaultMusic,
  videoPrompt,
  musicPrompt,
  repairPrompt,
  copyId,
  actions,
  cameras,
  speeds,
  backgrounds,
  orders,
  genres,
  tempos,
  instruments,
  moods,
  references,
  faults,
  checks,
} from "./video-music-data";
import {
  duration,
  frameAt,
  frameDescription,
  judgeRegions,
  musicNotes,
  musicDuration,
  waveforms,
} from "./video-music-engine";
import {
  freshVideoMusic,
  sanitizeVideoMusic,
  loadVideoMusic,
  saveVideoMusic,
  removeVideoMusic,
  videoMusicKey,
} from "./video-music-storage";
import { loadProgress, saveProgress, progressKey } from "./storage";
import {
  MusicDemo,
  maximumVolume,
  createAudioContext,
  type AudioStatus,
} from "./video-music-audio";
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe("video and prompt invariants", () => {
  it("reflects every director condition in full text and reproduces restored conditions", () => {
    for (let action = 0; action < 2; action++)
      for (let camera = 0; camera < 3; camera++)
        for (let speed = 0; speed < 2; speed++)
          for (let background = 0; background < 2; background++)
            for (let order = 0; order < 2; order++) {
              const s = { action, camera, speed, background, order },
                text = videoPrompt(s);
              for (const token of [
                actions[action],
                cameras[camera],
                speeds[speed],
                backgrounds[background],
                orders[order],
                "顔",
                "エプロン",
                "全場面",
                "自動公開はしない",
              ])
                expect(text).toContain(token);
            }
    expect(videoPrompt({ ...defaultVideo })).toBe(videoPrompt(defaultVideo));
  });
  it("clamps time and uses exact scene boundaries in both orders", () => {
    expect(frameAt(defaultVideo, -1).slot).toBe(0);
    expect(frameAt(defaultVideo, 2).slot).toBe(1);
    expect(frameAt(defaultVideo, 99).slot).toBe(2);
    expect([1, 3, 5].map((t) => frameAt(defaultVideo, t).scene)).toEqual([
      0, 1, 2,
    ]);
    expect(
      [1, 3, 5].map((t) => frameAt({ ...defaultVideo, order: 1 }, t).scene),
    ).toEqual([0, 2, 1]);
  });
  it("speed changes duration, and action/camera/background change actual frame values", () => {
    expect(duration({ ...defaultVideo, speed: 1 })).toBe(9);
    expect(frameAt(defaultVideo, 2.7).panAngle).not.toBe(
      frameAt({ ...defaultVideo, action: 1 }, 2.7).panAngle,
    );
    expect(frameAt({ ...defaultVideo, action: 1 }, 2.7).spoonAngle).not.toBe(0);
    expect(frameAt({ ...defaultVideo, camera: 1 }, 3).zoom).toBeGreaterThan(1);
    expect(frameAt({ ...defaultVideo, camera: 2 }, 3).cameraX).toBeLessThan(0);
    expect(frameAt(defaultVideo, 3).backgroundY).toBeGreaterThan(
      frameAt(defaultVideo, 1).backgroundY,
    );
  });
  it.each(faults)(
    "fault $id exists only in the middle, and text matches frame evidence",
    (t) => {
      const before = frameAt(defaultVideo, 1, t.id),
        middle = frameAt(defaultVideo, 3, t.id),
        after = frameAt(defaultVideo, 5, t.id);
      expect(before).toEqual(frameAt(defaultVideo, 1));
      expect(after).toEqual(frameAt(defaultVideo, 5));
      expect(middle).not.toEqual(frameAt(defaultVideo, 3));
      const desc = frameDescription(defaultVideo, 3, t.id);
      expect(desc).toContain(
        t.region === "shirt"
          ? "青い縞"
          : t.region === "pan"
            ? "見えない"
            : "基準より右",
      );
    },
  );
  it.each(faults)(
    "scores missed and excess regions separately for $id",
    (t) => {
      const i = faults.indexOf(t);
      expect(judgeRegions([t.region], i)).toEqual({
        ok: true,
        missing: [],
        extra: [],
      });
      expect(judgeRegions([], i).missing).toEqual([t.region]);
      expect(judgeRegions([t.region, "face"], i)).toEqual({
        ok: false,
        missing: [],
        extra: ["face"],
      });
      expect(repairPrompt(i, [t.region], 1)).toContain(t.expected);
    },
  );
  it("distinguishes prompt fingerprints by kind and body", () => {
    const a = copyId("video", videoPrompt(defaultVideo));
    expect(copyId("video", videoPrompt({ ...defaultVideo }))).toBe(a);
    expect(
      copyId("video", videoPrompt({ ...defaultVideo, camera: 1 })),
    ).not.toBe(a);
    expect(copyId("music", videoPrompt(defaultVideo))).not.toBe(a);
  });
  it("uses explicit OS reference metadata and meaningful checked reasons", () => {
    for (const os of ["pc", "ios", "android"])
      expect(
        references.filter((r) => r.os === os || r.os === "all"),
      ).toHaveLength(3);
    for (const c of checks) {
      expect(c.options[c.answer]).toBeTruthy();
      expect(c.reason.length).toBeGreaterThan(30);
    }
  });
});
describe("music composition", () => {
  it("maps tempo to real scheduled intervals and length", () => {
    const slow = musicNotes({ ...defaultMusic, tempo: 0 }),
      fast = musicNotes({ ...defaultMusic, tempo: 2 });
    expect(slow[1].start).toBeGreaterThan(fast[1].start);
    expect(musicDuration({ ...defaultMusic, tempo: 0 })).toBe(6);
    for (const tempo of [0, 1, 2])
      expect(musicDuration({ ...defaultMusic, tempo })).toBe(
        480 / tempos[tempo],
      );
  });
  it("genre changes rhythm, mood changes pitch, instrument changes waveform", () => {
    expect(musicNotes({ ...defaultMusic, genre: 1 })).not.toEqual(
      musicNotes(defaultMusic),
    );
    expect(
      musicNotes({ ...defaultMusic, mood: 2 }).map((n) => n.frequency),
    ).not.toEqual(musicNotes(defaultMusic).map((n) => n.frequency));
    expect(new Set(waveforms).size).toBe(3);
  });
  it("represents all conditions, vocal only in text, and notes remain independent", () => {
    const s = { genre: 2, tempo: 0, instrument: 2, mood: 2, vocal: 1 },
      text = musicPrompt(s);
    for (const token of [
      genres[2],
      "80 BPM",
      instruments[2],
      moods[2],
      "ボーカルあり",
      "約6.0秒",
    ])
      expect(text).toContain(token);
    expect(musicNotes({ ...s, vocal: 0 })).toEqual(musicNotes(s));
  });
});
function store(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const storage = {
    getItem: vi.fn((k: string) => data.get(k) ?? null),
    setItem: vi.fn((k: string, v: string) => {
      data.set(k, v);
    }),
    removeItem: vi.fn((k: string) => {
      data.delete(k);
    }),
  };
  vi.stubGlobal("localStorage", storage);
  return { data, storage };
}
describe("chapter-eight storage compatibility", () => {
  it("restores only fixed fields, dedupes histories and never stores current playback or predictions", () => {
    const raw = {
      ...freshVideoMusic(),
      step: 3,
      video: { ...defaultVideo, camera: 2 },
      history: ["video:v1", "video:v1", "wrong"],
      visited: [0, 0, 3, 99],
      answers: {
        "direction-v1": 0,
        "costume-v1": ["shirt", "shirt", "0:same", 1],
        unknown: 0,
      },
      copied: [copyId("video", "abc"), "wrong"],
      position: 4,
      context: "private",
      prediction: 1,
    };
    const record = sanitizeVideoMusic(raw);
    expect(record.history).toEqual(["video:v1"]);
    expect(record.visited).toEqual([0, 3]);
    expect(record.answers).toEqual({
      "direction-v1": 0,
      "costume-v1": ["shirt"],
    });
    expect(record).not.toHaveProperty("position");
    expect(record).not.toHaveProperty("prediction");
    store();
    expect(saveVideoMusic(record)).toBe(true);
    expect(loadVideoMusic().record).toEqual(record);
  });
  it("rejects corrupt JSON and invalid types while preserving safe defaults", () => {
    store({ [videoMusicKey]: "{bad" });
    expect(loadVideoMusic().available).toBe(false);
    expect(
      sanitizeVideoMusic({
        step: 1.5,
        video: { camera: 99 },
        music: { tempo: -1 },
        answers: { "direction-v1": 9, "music-v1": "1", "tool-v1": "pan" },
        tried: "yes",
      }),
    ).toEqual(freshVideoMusic());
  });
  it("keeps normal v1 data, valid answer order and all other chapter keys", () => {
    const oldKeys = Object.fromEntries(
      ["services", "lab", "exploration", "live", "canvas", "nano-banana"].map(
        (x) => [`gemini-toranomaki:${x}:v1`, x],
      ),
    );
    const record = {
      ...freshVideoMusic(),
      answers: { "tool-v1": ["pan", "face"], "music-v1": 1 },
      tried: true,
    };
    const { data } = store(oldKeys);
    expect(saveVideoMusic(record)).toBe(true);
    expect(loadVideoMusic().record).toEqual(record);
    expect(removeVideoMusic()).toBe(true);
    expect(Object.fromEntries(data)).toEqual(oldKeys);
  });
  it.each(["getItem", "setItem", "removeItem"] as const)(
    "survives %s refusal without claiming persistence",
    (method) => {
      const { storage } = store({
        [videoMusicKey]: JSON.stringify({ ...freshVideoMusic(), tried: true }),
      });
      storage[method].mockImplementation(() => {
        throw new DOMException("quota", "QuotaExceededError");
      });
      if (method === "getItem")
        expect(loadVideoMusic()).toEqual({
          record: freshVideoMusic(),
          available: false,
        });
      else if (method === "setItem") {
        expect(saveVideoMusic(freshVideoMusic())).toBe(false);
        expect(loadVideoMusic().record.tried).toBe(true);
      } else {
        expect(removeVideoMusic()).toBe(false);
        expect(loadVideoMusic().record.tried).toBe(true);
      }
    },
  );
  it("preserves chapter1–7 completion and independently toggles chapter8", () => {
    const completed = Array.from({ length: 7 }, (_, i) => `chapter-${i + 1}`),
      { data } = store({ [progressKey]: JSON.stringify({ completed }) });
    expect(loadProgress().progress.completed).toEqual(completed);
    expect(saveProgress({ completed: [...completed, "chapter-8"] })).toBe(true);
    expect(loadProgress().progress.completed).toEqual([
      ...completed,
      "chapter-8",
    ]);
    expect(saveProgress({ completed })).toBe(true);
    expect(JSON.parse(data.get(progressKey)!).completed).toEqual(completed);
  });
});
function audioFixture() {
  const nodes: {
      type: string;
      frequency: { value: number };
      start: ReturnType<typeof vi.fn>;
      stop: ReturnType<typeof vi.fn>;
      connect: ReturnType<typeof vi.fn>;
      disconnect: ReturnType<typeof vi.fn>;
    }[] = [],
    gains: {
      gain: {
        value: number;
        setValueAtTime: ReturnType<typeof vi.fn>;
        linearRampToValueAtTime: ReturnType<typeof vi.fn>;
      };
      connect: ReturnType<typeof vi.fn>;
    }[] = [];
  let resolve!: () => void;
  const ctx = {
    state: "running",
    currentTime: 10,
    destination: {},
    resume: vi.fn(async () => {}),
    close: vi.fn(async () => {}),
    createGain: vi.fn(() => {
      const g = {
        gain: {
          value: 0,
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
      };
      gains.push(g);
      return g;
    }),
    createOscillator: vi.fn(() => {
      const n = {
        type: "",
        frequency: { value: 0 },
        start: vi.fn(),
        stop: vi.fn(),
        connect: vi.fn(),
        disconnect: vi.fn(),
      };
      nodes.push(n);
      return n;
    }),
  };
  return {
    ctx,
    nodes,
    gains,
    factory: () => ctx as unknown as AudioContext,
    defer: () => {
      ctx.resume.mockImplementation(
        () =>
          new Promise<void>((r) => {
            resolve = r;
          }),
      );
    },
    resolve: () => resolve(),
  };
}
describe("Web Audio lifecycle without asserting audible quality", () => {
  it("does not initialize audio until an explicit play and caps master volume", async () => {
    vi.useFakeTimers();
    const f = audioFixture(),
      factory = vi.fn(f.factory),
      demo = new MusicDemo(factory),
      notify = vi.fn();
    expect(factory).not.toHaveBeenCalled();
    await demo.play(defaultMusic, notify);
    expect(factory).toHaveBeenCalledTimes(1);
    expect(f.nodes).toHaveLength(8);
    expect(f.gains[0].gain.value).toBe(maximumVolume);
    expect(maximumVolume).toBeLessThanOrEqual(0.06);
    expect(notify.mock.calls.map((x) => x[0])).toEqual(["starting", "playing"]);
    await vi.advanceTimersByTimeAsync(4200);
    expect(notify).toHaveBeenLastCalledWith("ended");
    expect(f.ctx.close).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
    demo.dispose();
  });
  it("applies waveforms, pitch and timing to actual oscillator calls", async () => {
    vi.useFakeTimers();
    const f = audioFixture(),
      demo = new MusicDemo(f.factory),
      s = { ...defaultMusic, instrument: 2, tempo: 0, mood: 2 };
    await demo.play(s, vi.fn());
    const expected = musicNotes(s);
    expect(f.nodes[0].type).toBe("sawtooth");
    expect(f.nodes[1].frequency.value).toBe(expected[1].frequency);
    expect(f.nodes[1].start).toHaveBeenCalledWith(10.04 + expected[1].start);
    demo.dispose();
  });
  it("stops and disconnects the previous run before replay, with one end timer", async () => {
    vi.useFakeTimers();
    const f = audioFixture(),
      demo = new MusicDemo(f.factory);
    await demo.play(defaultMusic, vi.fn());
    const old = [...f.nodes];
    await demo.play({ ...defaultMusic, tempo: 2 }, vi.fn());
    for (const node of old) {
      expect(node.disconnect).toHaveBeenCalledTimes(1);
      expect(node.stop).toHaveBeenCalledTimes(2);
    }
    expect(f.ctx.close).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(1);
    demo.dispose();
    expect(vi.getTimerCount()).toBe(0);
  });
  it.each(["stop", "dispose"] as const)(
    "invalidates a deferred resume after %s and never schedules or notifies late",
    async (method) => {
      const f = audioFixture();
      f.defer();
      const notify = vi.fn(),
        demo = new MusicDemo(f.factory),
        pending = demo.play(defaultMusic, notify);
      demo[method]();
      f.resolve();
      await pending;
      expect(f.nodes).toHaveLength(0);
      expect(notify.mock.calls.map((x) => x[0])).toEqual(["starting"]);
      expect(f.ctx.close).toHaveBeenCalledTimes(1);
    },
  );
  it("route validation cancels resume before React cleanup and closes its own context", async () => {
    const f = audioFixture();
    f.defer();
    let matches = true;
    const demo = new MusicDemo(f.factory),
      notify = vi.fn();
    const pending = demo.play(defaultMusic, notify, false, () => matches);
    matches = false;
    f.resolve();
    await pending;
    expect(f.nodes).toHaveLength(0);
    expect(f.ctx.close).toHaveBeenCalledTimes(1);
    expect(notify.mock.calls.map((x) => x[0])).toEqual(["starting"]);
    demo.dispose();
  });
  it("old resume cannot overwrite a new run or resurrect audio", async () => {
    vi.useFakeTimers();
    const old = audioFixture(),
      next = audioFixture();
    old.defer();
    const factories = [old.factory, next.factory],
      demo = new MusicDemo(() => factories.shift()!()),
      a = vi.fn(),
      b = vi.fn();
    const pending = demo.play(defaultMusic, a);
    await demo.play({ ...defaultMusic, tempo: 2 }, b);
    old.resolve();
    await pending;
    expect(old.nodes).toHaveLength(0);
    expect(next.nodes).toHaveLength(8);
    expect(a.mock.calls.map((x) => x[0])).toEqual(["starting"]);
    expect(b).toHaveBeenLastCalledWith("playing");
    expect(vi.getTimerCount()).toBe(1);
    demo.dispose();
  });
  it("falls back safely on unsupported APIs, resume refusal and non-running contexts", async () => {
    const states: AudioStatus[] = [];
    const unsupported = new MusicDemo(() => {
      throw Error("unsupported");
    });
    await unsupported.play(defaultMusic, (s) => states.push(s));
    expect(states).toEqual(["starting", "error"]);
    const f = audioFixture();
    f.ctx.resume.mockRejectedValue(Error("denied"));
    const demo = new MusicDemo(f.factory);
    await demo.play(defaultMusic, (s) => states.push(s));
    expect(f.ctx.close).toHaveBeenCalled();
    expect(f.nodes).toHaveLength(0);
    f.ctx.resume.mockResolvedValue();
    f.ctx.state = "suspended";
    await demo.play(defaultMusic, (s) => states.push(s));
    expect(states.at(-1)).toBe("error");
    demo.dispose();
  });
  it("muted and disposed players do not create contexts, and legacy webkitAudioContext is supported", async () => {
    const factory = vi.fn(),
      demo = new MusicDemo(factory);
    await demo.play(defaultMusic, vi.fn(), true);
    expect(factory).not.toHaveBeenCalled();
    demo.dispose();
    await demo.play(defaultMusic, vi.fn());
    expect(factory).not.toHaveBeenCalled();
    vi.stubGlobal("window", {});
    expect(() => createAudioContext()).toThrow();
    const f = audioFixture();
    function Legacy() {
      return f.ctx;
    }
    vi.stubGlobal("window", { webkitAudioContext: Legacy });
    expect(createAudioContext()).toBe(f.ctx);
  });
});
