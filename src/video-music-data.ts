export const actions = ["フライパンを振る", "スプーンで混ぜる"] as const;
export const cameras = [
  "固定カメラ",
  "ゆっくり近づく",
  "横へ移動する",
] as const;
export const speeds = ["標準・6秒", "ゆっくり・9秒"] as const;
export const backgrounds = [
  "窓の外で星が流れる",
  "窓の外で夕日が沈む",
] as const;
export const orders = ["準備→調理→完成", "準備→完成→調理（回想風）"] as const;
export interface VideoSettings {
  action: number;
  camera: number;
  speed: number;
  background: number;
  order: number;
}
export const defaultVideo: VideoSettings = {
  action: 0,
  camera: 0,
  speed: 0,
  background: 0,
  order: 0,
};
export const genres = [
  "ポップ風の規則的なリズム",
  "アンビエント風の長短リズム",
  "映画風の刻むリズム",
] as const;
export const tempos = [80, 120, 150] as const;
export const instruments = [
  "笛風の柔らかい電子音",
  "鍵盤風の丸い電子音",
  "鋭い電子音",
] as const;
export const moods = [
  "明るく軽快",
  "穏やかで落ち着く",
  "緊張感がある",
] as const;
export interface MusicSettings {
  genre: number;
  tempo: number;
  instrument: number;
  mood: number;
  vocal: number;
}
export const defaultMusic: MusicSettings = {
  genre: 0,
  tempo: 1,
  instrument: 1,
  mood: 0,
  vocal: 0,
};
export const musicPresets: { title: string; settings: MusicSettings }[] = [
  { title: "明るい", settings: { ...defaultMusic } },
  {
    title: "穏やか",
    settings: { genre: 1, tempo: 0, instrument: 0, mood: 1, vocal: 0 },
  },
  {
    title: "緊張",
    settings: { genre: 2, tempo: 2, instrument: 2, mood: 2, vocal: 0 },
  },
];
export const scenes = ["準備", "調理", "完成"] as const;
export const faults = [
  {
    id: "costume-v1",
    title: "A：テイク1",
    region: "shirt",
    description: "服の色・模様",
    observation: "中盤だけ黄色の星エプロンが青い縞に変わる",
    expected: "黄色い星エプロンを全場面で維持する",
  },
  {
    id: "tool-v1",
    title: "B：テイク2",
    region: "pan",
    description: "調理器具の有無",
    observation: "中盤だけ調理器具が消える",
    expected: "フライパンと持ち手を全場面で維持する",
  },
  {
    id: "jump-v1",
    title: "C：テイク3",
    region: "position",
    description: "主役の位置",
    observation: "中盤で主役が右へ飛び、終了で戻る",
    expected: "主役の移動を滑らかにつなぐ",
  },
] as const;
export type Fault = (typeof faults)[number]["id"] | "none";
export const regions = [
  { id: "shirt", label: "服の色・模様" },
  { id: "pan", label: "調理器具の有無" },
  { id: "position", label: "主役の位置" },
  { id: "window", label: "窓の外" },
  { id: "face", label: "顔・耳" },
] as const;
export const checks = [
  {
    id: "direction-v1",
    step: 0,
    question: "フライパンだけを動かす依頼。維持対象をどう指定する？",
    options: [
      "顔・服・厨房の配置を維持し、開始から終了まで確認する",
      "最後の1枚だけ合えばよい",
      "すべての要素を毎回変えて変化を増やす",
    ],
    answer: 0,
    reason:
      "動く対象と維持する対象を分け、途中の場面も照合します。終点だけでは途中の消失を見落とします。",
  },
  {
    id: "music-v1",
    step: 2,
    question: "リズムの点が動いたが音が聞こえない。どう判断する？",
    options: [
      "音楽生成は成功した",
      "音声出力は未確認。無音の構成説明で比較を続ける",
      "教材全体をやり直さないと学べない",
    ],
    answer: 1,
    reason:
      "視覚のリズムと音声出力は別です。APIが開始できても端末の音量や出力先は教材から確認できません。",
  },
] as const;
export function videoPrompt(v: VideoSettings) {
  return `柴犬の料理人が宇宙船の厨房で料理する短い動画を作成してください。\n主役の動作：${actions[v.action]}。カメラ：${cameras[v.camera]}。長さと速さ：${speeds[v.speed]}。背景演出：${backgrounds[v.background]}。\n時間の順序：${orders[v.order]}。開始・中盤・終了を区別してください。\n柴犬の顔・毛色・耳、黄色い星エプロン、調理器具、厨房の配置は維持してください。途中の服の変化・道具の消失・位置の飛びがないか全場面で確認します。\n指定の長さや操作に対応しない場合は、利用可能な条件を説明してください。自動公開はしないでください。`;
}
export function musicPrompt(m: MusicSettings) {
  return `柴犬の料理動画の背景音楽を作成してください。\nジャンル：${genres[m.genre]}。雰囲気：${moods[m.mood]}。テンポ：${tempos[m.tempo]} BPM。楽器のイメージ：${instruments[m.instrument]}。\n長さ：約${((8 * 60) / tempos[m.tempo]).toFixed(1)}秒の短いフレーズ。${m.vocal === 0 ? "ボーカルなし。" : "ボーカルあり（歌詞はオリジナル）。"}\n聞きやすい音量で、映像の動作と雰囲気が合うか比較します。指定の長さ・楽器・歌声に対応しない場合は利用可能な条件を説明してください。既存曲の模倣や自動公開はしないでください。`;
}
export function repairPrompt(
  task: number,
  selected: readonly string[],
  frame: number,
) {
  const t = faults[task];
  return `教材の観察メモをもとに動画を再修正してください。\n確認した時間位置：場面${frame + 1}。確認した対象：${selected.map((id) => regions.find((r) => r.id === id)?.label).join("、") || "まだ特定できていない"}。\n観察できた不具合：${t.observation}。期待：${t.expected}。\n柴犬の顔・毛色・服・器具・厨房のうち、修正対象以外を維持してください。開始・中盤・終了を同じ時間位置で比較し、前後のつながりと指定外の変化を再確認します。自動公開はしないでください。`;
}
export function copyId(kind: string, text: string) {
  let hash = 2166136261;
  for (const c of text) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619);
  return `${kind}:v1:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
export type Device = "pc" | "ios" | "android";
export const references = [
  ...(["pc", "ios", "android"] as const).flatMap((os) => [
    {
      os,
      kind: "video",
      title: `動画生成・${os === "pc" ? "PC" : os === "ios" ? "iPhone / iPad" : "Android"}`,
      url: `https://support.google.com/gemini/answer/16126339?hl=ja&co=GENIE.Platform%3D${os === "pc" ? "Desktop" : os === "ios" ? "iOS" : "Android"}`,
    },
    {
      os,
      kind: "music",
      title: `音楽生成・${os === "pc" ? "PC" : os === "ios" ? "iPhone / iPad" : "Android"}`,
      url: `https://support.google.com/gemini/answer/16901237?hl=ja&co=GENIE.Platform%3D${os === "pc" ? "Desktop" : os === "ios" ? "iOS" : "Android"}`,
    },
  ]),
  {
    os: "all",
    kind: "music",
    title: "Lyria 3.5・共通の公式紹介（英語）",
    url: "https://blog.google/innovation-and-ai/products/gemini-app/better-tracks-lyria-gemini/",
  },
];
