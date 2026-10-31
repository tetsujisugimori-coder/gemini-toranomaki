import {
  defaultVideo,
  defaultMusic,
  checks,
  faults,
  type VideoSettings,
  type MusicSettings,
} from "./video-music-data";
export const videoMusicKey = "gemini-toranomaki:video-music:v1";
export interface VideoMusicRecord {
  step: number;
  video: VideoSettings;
  music: MusicSettings;
  task: number;
  mix: number;
  visited: number[];
  history: string[];
  answers: Record<string, number | string[]>;
  copied: string[];
  tried: boolean;
  heard: boolean;
}
export const freshVideoMusic = (): VideoMusicRecord => ({
  step: 0,
  video: { ...defaultVideo },
  music: { ...defaultMusic },
  task: 0,
  mix: 0,
  visited: [],
  history: [],
  answers: {},
  copied: [],
  tried: false,
  heard: false,
});
const object = (x: unknown): Record<string, unknown> =>
  x && typeof x === "object" && !Array.isArray(x)
    ? (x as Record<string, unknown>)
    : {};
const num = (x: unknown, max: number, fallback = 0) =>
  typeof x === "number" && Number.isInteger(x) && x >= 0 && x < max
    ? x
    : fallback;
const list = (x: unknown, allow: (s: string) => boolean) =>
  Array.isArray(x)
    ? [
        ...new Set(
          x.filter((s): s is string => typeof s === "string" && allow(s)),
        ),
      ]
    : [];
export const historyIds = [
  "video:v1",
  "rhythm:v1",
  "audio-api:v1",
  "mix:v1",
  ...faults.map((t) => `find:${t.id}`),
];
export function sanitizeVideoMusic(raw: unknown): VideoMusicRecord {
  const r = object(raw),
    v = object(r.video),
    m = object(r.music),
    a = object(r.answers);
  const answers: VideoMusicRecord["answers"] = {};
  for (const c of checks)
    if (
      typeof a[c.id] === "number" &&
      Number.isInteger(a[c.id]) &&
      (a[c.id] as number) >= 0 &&
      (a[c.id] as number) < c.options.length
    )
      answers[c.id] = a[c.id] as number;
  for (const t of faults)
    if (Array.isArray(a[t.id]))
      answers[t.id] = list(a[t.id], (s) =>
        ["shirt", "pan", "position", "window", "face"].includes(s),
      );
  return {
    step: num(r.step, 4),
    video: {
      action: num(v.action, 2),
      camera: num(v.camera, 3),
      speed: num(v.speed, 2),
      background: num(v.background, 2),
      order: num(v.order, 2),
    },
    music: {
      genre: num(m.genre, 3),
      tempo: num(m.tempo, 3, defaultMusic.tempo),
      instrument: num(m.instrument, 3, defaultMusic.instrument),
      mood: num(m.mood, 3),
      vocal: num(m.vocal, 2),
    },
    task: num(r.task, 3),
    mix: num(r.mix, 4),
    visited: Array.isArray(r.visited)
      ? [
          ...new Set(
            r.visited.filter(
              (x): x is number =>
                typeof x === "number" && Number.isInteger(x) && x >= 0 && x < 4,
            ),
          ),
        ]
      : [],
    history: list(r.history, (s) => historyIds.includes(s)),
    answers,
    copied: list(r.copied, (s) =>
      /^(video|music|repair|mix-video|mix-music):v1:[a-f0-9]{8}$/.test(s),
    ).slice(-100),
    tried: r.tried === true,
    heard: r.heard === true,
  };
}
export function loadVideoMusic() {
  try {
    return {
      record: sanitizeVideoMusic(
        JSON.parse(localStorage.getItem(videoMusicKey) ?? "null"),
      ),
      available: true,
    };
  } catch {
    return { record: freshVideoMusic(), available: false };
  }
}
export function saveVideoMusic(r: VideoMusicRecord) {
  try {
    localStorage.setItem(videoMusicKey, JSON.stringify(sanitizeVideoMusic(r)));
    return true;
  } catch {
    return false;
  }
}
export function removeVideoMusic() {
  try {
    localStorage.removeItem(videoMusicKey);
    return true;
  } catch {
    return false;
  }
}
