import type { MusicSettings } from "./video-music-data";
import { musicNotes, musicDuration, waveforms } from "./video-music-engine";
export type AudioStatus = "idle" | "starting" | "playing" | "ended" | "error";
export const maximumVolume = 0.06;
export function createAudioContext(): AudioContext {
  const Audio =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Audio) throw new Error("Web Audio APIを利用できません");
  return new Audio();
}
// Own one context/run. Async resume and every cleanup are guarded by generation.
export class MusicDemo {
  private generation = 0;
  private context: AudioContext | null = null;
  private nodes: OscillatorNode[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;
  constructor(private factory: () => AudioContext = createAudioContext) {}
  stop() {
    this.generation++;
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    for (const node of this.nodes) {
      try {
        node.stop();
      } catch {
        /* Already ended. */
      }
      node.disconnect();
    }
    this.nodes = [];
    const context = this.context;
    this.context = null;
    if (context) void context.close().catch(() => {});
  }
  dispose() {
    this.disposed = true;
    this.stop();
  }
  async play(
    settings: MusicSettings,
    notify: (state: AudioStatus) => void,
    muted = false,
    matches: () => boolean = () => true,
  ) {
    if (this.disposed) return;
    this.stop();
    const ticket = this.generation;
    const current = () =>
      !this.disposed && ticket === this.generation && matches();
    if (muted) {
      notify("idle");
      return;
    }
    notify("starting");
    try {
      const ctx = this.factory();
      this.context = ctx;
      await ctx.resume();
      if (!current()) {
        if (ticket === this.generation) this.stop();
        return;
      }
      if (ctx.state !== "running")
        throw new Error("AudioContext is not running");
      const master = ctx.createGain();
      master.gain.value = maximumVolume;
      master.connect(ctx.destination);
      const start = ctx.currentTime + 0.04;
      for (const note of musicNotes(settings)) {
        const osc = ctx.createOscillator(),
          env = ctx.createGain();
        this.nodes.push(osc);
        osc.type = waveforms[settings.instrument];
        osc.frequency.value = note.frequency;
        env.gain.setValueAtTime(0, start + note.start);
        env.gain.linearRampToValueAtTime(0.65, start + note.start + 0.015);
        env.gain.linearRampToValueAtTime(0, start + note.start + note.duration);
        osc.connect(env);
        env.connect(master);
        osc.start(start + note.start);
        osc.stop(start + note.start + note.duration + 0.01);
      }
      notify("playing");
      this.timer = setTimeout(
        () => {
          if (current()) {
            this.stop();
            notify("ended");
          }
        },
        (musicDuration(settings) + 0.1) * 1000,
      );
    } catch {
      if (current()) {
        this.stop();
        notify("error");
      } else if (ticket === this.generation) this.stop();
    }
  }
}
