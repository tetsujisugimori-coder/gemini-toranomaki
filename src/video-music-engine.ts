import {
  actions,
  cameras,
  scenes,
  tempos,
  type VideoSettings,
  type MusicSettings,
  type Fault,
} from "./video-music-data";
export const duration = (s: VideoSettings) => (s.speed === 1 ? 9 : 6);
export function frameAt(s: VideoSettings, time: number, fault: Fault = "none") {
  const progress = Math.max(0, Math.min(1, time / duration(s)));
  const slot = Math.min(2, Math.floor(progress * 3));
  const scene = s.order === 1 ? [0, 2, 1][slot] : slot;
  const phase = progress * Math.PI * 4;
  const x = fault === "jump-v1" && slot === 1 ? 80 : 0;
  return {
    progress,
    slot,
    scene,
    name: scenes[scene],
    panAngle: scene === 1 ? Math.sin(phase) * (s.action === 0 ? 24 : 4) : 0,
    spoonAngle: scene === 1 && s.action === 1 ? Math.sin(phase) * 32 : 0,
    steam: scene === 1 ? 1 : 0,
    steamY: -((progress * 80) % 28),
    smile: scene === 2,
    shirtChanged: fault === "costume-v1" && slot === 1,
    panVisible: !(fault === "tool-v1" && slot === 1),
    x,
    zoom: s.camera === 1 ? 1 + progress * 0.16 : 1,
    cameraX: s.camera === 2 ? -30 * progress : 0,
    backgroundY: progress * 34,
  };
}
export function frameDescription(
  s: VideoSettings,
  time: number,
  fault: Fault = "none",
) {
  const f = frameAt(s, time, fault);
  return `場面${f.slot + 1}：${f.name}。黄色い星エプロン${f.shirtChanged ? "ではなく青い縞の服" : "を着ている"}。調理器具は${f.panVisible ? "見える" : "見えない"}。主役は${f.x ? "基準より右" : "基準位置"}。${f.scene === 1 ? "調理の動作と湯気" : f.smile ? "笑顔で料理を見せる" : "調理器具を持って準備"}。窓の外は${s.background === 0 ? "星" : "夕日"}。動作指示：${actions[s.action]}。画角：${cameras[s.camera]}、倍率${f.zoom.toFixed(2)}、横移動${f.cameraX.toFixed(0)}。窓の演出は開始位置から下へ${f.backgroundY.toFixed(0)}。`;
}
export function judgeRegions(selected: readonly string[], task: number) {
  const correct = ["shirt", "pan", "position"][task];
  return {
    ok: selected.length === 1 && selected[0] === correct,
    missing: selected.includes(correct) ? [] : [correct],
    extra: selected.filter((x) => x !== correct),
  };
}
export function musicNotes(s: MusicSettings) {
  const scales = [
    [0, 4, 7, 12, 7, 4, 2, 0],
    [0, 2, 7, 4, 2, -3, 0, 7],
    [0, 1, 7, 6, 1, 0, -1, 0],
  ];
  const rhythms = [
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1.5, 0.5, 1.5, 0.5, 1.5, 0.5, 1.5, 0.5],
    [0.5, 0.5, 1.5, 1.5, 0.5, 0.5, 1.5, 1.5],
  ];
  const beat = 60 / tempos[s.tempo];
  let offset = 0;
  return scales[s.mood].map((n, i) => {
    const length = rhythms[s.genre][i] * beat;
    const note = {
      frequency: 220 * 2 ** (n / 12),
      start: offset,
      duration: length * 0.8,
      beat: i + 1,
    };
    offset += length;
    return note;
  });
}
export const musicDuration = (s: MusicSettings) => (8 * 60) / tempos[s.tempo];
export const waveforms: OscillatorType[] = ["sine", "triangle", "sawtooth"];
