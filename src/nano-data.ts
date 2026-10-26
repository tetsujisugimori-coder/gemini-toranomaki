export const subjects = [
  "柴犬の料理人",
  "ロボットの料理人",
  "猫の料理人",
] as const;
export const backgrounds = [
  "宇宙船の厨房",
  "森のレストラン",
  "未来都市のカフェ",
] as const;
export const styles = ["3Dイラスト", "水彩画", "アニメ調"] as const;
export const compositions = ["全身", "上半身", "クローズアップ"] as const;
export interface ImageSettings {
  subject: number;
  background: number;
  style: number;
  composition: number;
}
export const defaultImage: ImageSettings = {
  subject: 0,
  background: 0,
  style: 0,
  composition: 0,
};
export const regions = [
  { id: "hat", label: "料理帽", x: 250, y: 80, w: 100, h: 66 },
  { id: "eyes", label: "目", x: 250, y: 159, w: 100, h: 44 },
  { id: "window", label: "窓の外", x: 400, y: 44, w: 150, h: 155 },
  { id: "apple", label: "料理台の上", x: 432, y: 270, w: 78, h: 72 },
  { id: "shirt", label: "服の模様", x: 244, y: 241, w: 112, h: 62 },
  { id: "ears", label: "耳", x: 213, y: 128, w: 39, h: 60 },
] as const;
export type Region = (typeof regions)[number]["id"];
export const tasks = [
  {
    id: "hat-v1",
    title: "A：料理帽だけを赤くする",
    target: "hat",
    result: "赤い料理帽",
    keep: "柴犬の顔・目・服装・ポーズ・厨房の配置",
    unexpected: "eyes",
    fix: "目を元画像の丸い形へ戻す",
    evidence: "帽子は白から赤へ変化。一方、丸い目が細い線に変わっています。",
    maintain: "赤い帽子、服、ポーズ、背景",
    inspection: "料理帽と両目を元画像と同じ大きさで比べる",
  },
  {
    id: "window-v1",
    title: "B：窓の外を夕焼けにする",
    target: "window",
    result: "窓の外が夕焼け",
    keep: "柴犬・服装・窓枠・料理台・リンゴ",
    unexpected: "apple",
    fix: "料理台のリンゴを元の位置へ戻す",
    evidence:
      "窓の外は宇宙から夕焼けへ変化。一方、料理台のリンゴが消えています。",
    maintain: "夕焼け、窓枠、柴犬、服、ポーズ",
    inspection: "窓の外と料理台の上を元画像と比較する",
  },
  {
    id: "apple-v1",
    title: "C：料理台にリンゴを追加する",
    target: "apple",
    result: "料理台にリンゴが1個ある",
    keep: "柴犬の顔・服の星模様・帽子・背景",
    unexpected: "shirt",
    fix: "服の模様を元の星へ戻す",
    evidence:
      "リンゴは追加されています。一方、服の星模様が横縞に変わっています。",
    maintain: "追加したリンゴ、顔、帽子、背景",
    inspection: "リンゴの数と服の模様を元画像と照合する",
  },
] as const;
export const pins = [
  "毛色",
  "顔の形",
  "耳の特徴",
  "服の基本デザイン",
  "体格",
] as const;
export const scenes = [
  "宇宙船の厨房",
  "レストランで接客",
  "宇宙ステーションで記念撮影",
] as const;
export function imagePrompt(s: ImageSettings) {
  return `${backgrounds[s.background]}で料理している${subjects[s.subject]}を、${styles[s.style]}風、${compositions[s.composition]}が見える構図で描いてください。料理する様子が伝わることを優先し、不要な小物は増やさないでください。`;
}
export interface EditChoices {
  target: number;
  result: number;
  preserve: boolean;
  inspect: boolean;
}
export const defaultEdit: EditChoices = {
  target: 0,
  result: 0,
  preserve: true,
  inspect: true,
};
export function editPrompt(task: number, c: EditChoices) {
  const t = tasks[task];
  return `元の柴犬の料理人の画像を編集してください。\n変更対象：${regions[c.target].label}。期待する結果：${tasks[c.result].result}。\n${c.preserve ? `維持するもの：${t.keep}。変更対象以外は変更しないでください。` : "維持するものは未指定です。実行前に維持条件を確認してください。"}\n${c.inspect ? `修正後の確認：${t.inspection}。指定外の変化がないか画像全体も比べます。` : "確認箇所は未指定です。実行前に確認方法を決めてください。"}`;
}
export function repairPrompt(task: number, include: readonly boolean[]) {
  const t = tasks[task];
  return [
    include[0]
      ? `観察した不具合：${t.evidence}`
      : "観察した不具合：未指定。元画像と修正画像を照合してから依頼します。",
    include[1] ? `期待：${t.fix}。` : "期待する状態：未指定。",
    include[2]
      ? `維持：${t.maintain}。それ以外は変更しないでください。`
      : "維持する要素：未指定。",
    include[3]
      ? `検証：${t.inspection}。指定外の変化も再確認します。`
      : "検証方法：未指定。",
  ].join("\n");
}
export function characterPrompt(selected: readonly number[]) {
  return `同じ柴犬の料理人を「${scenes.join("」「")}」の3場面に描いてください。\nキャラクター設定：${selected.length ? selected.map((i) => `${pins[i]}（参照画像の特徴）`).join("、") : "固定する特徴は未指定。生成前に特徴を確認してください。"}。\n場面に合わせてポーズ・表情・背景・道具だけを変えてください。自分が使用する権利を持つ参照画像を、利用可能なら添付し、場面ごとに特徴を照合してください。同一性を保証するものではありません。`;
}
export function copyId(kind: string, text: string) {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return `${kind}:v1:${(h >>> 0).toString(16).padStart(8, "0")}`;
}
export function sameRegions(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((x) => b.includes(x));
}
export const nanoReferences = [
  {
    title: "画像の生成と編集：PC",
    os: "pc",
    url: "https://support.google.com/gemini/answer/14286560?hl=ja&co=GENIE.Platform%3DDesktop",
  },
  {
    title: "画像の生成と編集：iPhone / iPad",
    os: "ios",
    url: "https://support.google.com/gemini/answer/14286560?hl=ja&co=GENIE.Platform%3DiOS",
  },
  {
    title: "画像の生成と編集：Android",
    os: "android",
    url: "https://support.google.com/gemini/answer/14286560?hl=ja&co=GENIE.Platform%3DAndroid",
  },
  {
    title: "Nano Banana公式紹介（共通・英語）",
    os: "all",
    url: "https://gemini.google/overview/image-generation/",
  },
] as const;
