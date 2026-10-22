import type { LabId } from "./lab-data";
export type Settings = Record<string, string>;
export const defaults: Record<LabId, Settings> = {
  ask: { topic: "虹が7色に見える理由", audience: "小学生", method: "たとえ話" },
  rewrite: {
    source:
      "明日午後3時より図書室にて読書会を開催いたします。参加を希望される方は筆記用具をご持参ください。",
    tone: "丁寧",
  },
  image: {
    subject: "料理する柴犬",
    background: "宇宙船の厨房",
    mood: "楽しい",
    composition: "暖かい色、主役を中央に",
    change: "エプロンの色だけを青にする",
  },
  quiz: {
    topic: "日本史",
    difficulty: "基礎",
    count: "3",
    format: "選択式",
    hint: "あり",
    detail: "詳しく",
  },
};
export function buildPrompt(id: LabId, s: Settings): string {
  switch (id) {
    case "ask":
      return `質問：${s.topic}\n${s.audience}に向けて、${s.method}を使って説明してください。事実とたとえを区別し、不確かな点は明示してください。`;
    case "rewrite":
      return `次の文章を「${s.tone}」な文体に書き換えてください。元の意味、日時、場所、依頼内容を維持し、情報を追加しないでください。\n--- 原文 ---\n${s.source}`;
    case "image":
      return `画像を生成してください。\n主役：${s.subject}\n背景：${s.background}\n雰囲気：${s.mood}\n色や構図：${s.composition}`;
    case "quiz":
      return `${s.topic}の確認問題を${s.count}問作ってください。\n難易度：${s.difficulty}\n出題形式：${s.format}\nヒント：${s.hint}\n解説：${s.detail}\nまず問題だけを提示し、私の回答を待ってから正解と解説を示してください。不確かな事実は明示し、確認に役立つ資料も案内してください。`;
  }
}
export function buildRevision(s: Settings): string {
  return `先ほどの画像について、${s.change}。指定した変更以外の主役・背景・雰囲気・構図はできるだけ維持してください。`;
}
