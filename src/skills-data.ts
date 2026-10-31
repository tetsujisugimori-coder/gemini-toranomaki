export const fields = [
  "役割",
  "目的",
  "適用場面",
  "守るルール",
  "避ける行動",
  "回答形式",
  "期待される回答例",
] as const;
export const templates: Record<string, string[]> = {
  学習支援AI: [
    "家庭教師",
    "学習者が自分で考えるのを助ける",
    "学習の質問を受けたとき",
    "一度に一つのヒントを出す",
    "答えをすぐに示す",
    "質問と短いヒント",
    "まず何が分かっていますか？",
  ],
  文章添削AI: [
    "文章添削者",
    "文章の分かりやすさを改善する",
    "文章の添削を依頼されたとき",
    "意図を保って理由を説明する",
    "事実を勝手に追加する",
    "原文・修正案・理由",
    "長い一文を二つに分けます。",
  ],
  プログラミング学習メンター: [
    "プログラミングの先生",
    "コードの考え方を身につける",
    "コードの学習相談を受けたとき",
    "小さな例で説明する",
    "理解の確認を省く",
    "例・説明・確認問題",
    "for文で要素を順に取り出します。",
  ],
  アイデア発想支援AI: [
    "発想の相手",
    "企画の選択肢を広げる",
    "企画の相談を受けたとき",
    "異なる視点を複数示す",
    "根拠のない断定をする",
    "案・利点・課題",
    "地域の人が参加する案を考えます。",
  ],
};
export const tutorOptions = [
  ["数学", "英語", "プログラミング", "一般教養"],
  ["初級", "中級", "上級"],
  ["ヒント中心", "対話中心", "解説中心"],
  ["短い", "標準", "詳しい"],
  ["再挑戦を促す", "原因を説明する"],
  ["文章", "手順", "問題演習"],
] as const;
export const tutorLabels = [
  "学習分野",
  "学習レベル",
  "教え方",
  "回答の長さ",
  "間違いへの対応",
  "回答形式",
];
export const questions = [
  "Pythonのfor文を教えて",
  "二次方程式の解き方を教えて",
  "英文を添削して",
  "企画のアイデアを考えて",
];
const examples = [
  {
    general:
      "for文は要素を順に取り出します。例: for x in [1, 2]: print(x) は1と2を表示します。",
    hint: "[1, 2]から最初に取り出される値は何でしょう？",
    explanation:
      "for x in [1, 2]: print(x) は、xに1、次に2を入れ、それぞれ表示します。",
    advanced: "イテラブルからイテレータを取得し、要素を順に処理します。",
    detail:
      "各反復で変数を更新し、ブロックを実行します。空のリストなら実行されません。",
  },
  {
    general:
      "二次方程式は因数分解や解の公式で解けます。x²−5x+6=0ならx=2, 3です。",
    hint: "積が6、和が−5になる二つの数は何でしょう？",
    explanation: "x²−5x+6=(x−2)(x−3)なので、x=2または3です。",
    advanced: "判別式 b²−4ac の符号で実数解の個数を判定できます。",
    detail: "積がゼロなら少なくとも一方の因子がゼロになる性質を使います。",
  },
  {
    general:
      "例: He go to school. は He goes to school. と直します。三人称単数の現在形です。",
    hint: "主語 He に合わせて、現在形の動詞の語尾を見直せますか？",
    explanation: "He go → He goes。三人称単数の現在形では動詞にsを付けます。",
    advanced: "主語と定形動詞の一致を確認します。",
    detail: "goは語尾がoなのでesを付けます。時制や文脈も確認しましょう。",
  },
  {
    general:
      "地域交流の企画なら、住民が料理を持ち寄る会が考えられます。会場や費用を確認しましょう。",
    hint: "誰に参加してほしいですか？その人が楽しめる活動を一つ考えましょう。",
    explanation:
      "地域の料理交換会を提案します。参加しやすい時間と会場を先に決めます。",
    advanced: "対象者・価値・制約を定義し、複数案を比較します。",
    detail: "参加人数、予算、実施場所を仮定し、小規模な試行で検証します。",
  },
];
function renderExample(
  t: number[],
  e: (typeof examples)[number],
  tutor = false,
) {
  const core =
    t[2] === 0
      ? e.hint
      : t[2] === 1
        ? tutor
          ? `${e.hint} 考えたことを一つ教えてください。返答を確認して次のヒントを出します。`
          : `一緒に考えましょう。${e.hint}`
        : e.explanation;
  const level =
    t[1] === 2
      ? e.advanced
      : t[1] === 0
        ? "まず身近な例から始めます。"
        : "基本を確認して進めます。";
  const detail =
    t[3] === 2
      ? ` ${e.detail}`
      : t[3] === 1
        ? " 必要なら次の一歩も一緒に確認します。"
        : "";
  const format =
    t[5] === 1
      ? `1. ${level}\n2. ${core}`
      : t[5] === 2
        ? `${level} ${core}\n練習: 同じ考え方で別の例を試しましょう。`
        : `${level} ${core}`;
  return format + detail;
}
export function makeComparison(t: number[], question: number) {
  const e = examples[question] ?? examples[0];
  return {
    general: e.general,
    custom: renderExample(t, e),
    reason: `教え方「${tutorOptions[2][t[2]]}」、レベル「${tutorOptions[1][t[1]]}」、長さ「${tutorOptions[3][t[3]]}」、形式「${tutorOptions[5][t[5]]}」に対応する教材文を組み合わせました。`,
  };
}
export const checks = [
  {
    question: "学習者に考えさせたいとき、適切な指示は？",
    options: ["すぐ答えを示す", "段階的なヒントを出す"],
    answer: 1,
    reason: "ヒントは考える余地を残します。",
  },
  {
    question: "適用条件が曖昧だと何が起こり得ますか？",
    options: ["意図しない場面で適用され得る", "必ず適切に使われる"],
    answer: 0,
    reason: "場面を具体化すると意図を伝えやすくなります。",
  },
  {
    question: "この比較結果について正しいのは？",
    options: ["実際のGeminiの回答", "教材の固定ルールによる模擬回答"],
    answer: 1,
    reason: "実際のAIによる解釈や回答ではありません。",
  },
  {
    question: "移行前に参照ファイルで確認することは？",
    options: ["対応形式と合計容量", "名前だけ"],
    answer: 0,
    reason: "非対応形式や100 MB超過分は移行されない場合があります。",
  },
];
export function quality(v: string[]) {
  const all = v.join("\n");
  return [
    v[1].trim().length >= 10 ? "目的: 内容あり" : "目的: 具体化を検討",
    v[2].trim().length >= 8 ? "適用場面: 内容あり" : "適用場面: 具体化を検討",
    /答えをすぐに示す/.test(v[3]) && /答えをすぐに示す/.test(v[4])
      ? "矛盾の可能性: 同じ行動を指示と禁止に指定"
      : "矛盾: この単純規則では検出なし",
    v[6].trim() ? "回答例: あり" : "回答例: 未入力",
    all.length > 2000 ? "長さ: 2000文字超、簡潔化を検討" : "長さ: 2000文字以内",
  ];
}
export const references = [
  {
    title: "Gemからスキルへの移行",
    url: "https://support.google.com/gemini/answer/18560919?hl=ja",
  },
  {
    title: "スキルを作成・管理",
    url: "https://support.google.com/gemini/answer/17094296?hl=ja",
  },
  {
    title: "Gemを使用する",
    url: "https://support.google.com/gemini/answer/15146780?hl=ja",
  },
  {
    title: "Google公式ブログ: Skills",
    url: "https://blog.google/products-and-platforms/products/gemini/automate-tasks-with-skills/",
  },
];

export function tutorExample(t: number[]) {
  const question = [1, 2, 0][t[0]];
  if (question !== undefined)
    return {
      question: questions[question],
      answer: renderExample(t, examples[question], true),
    };
  const geography = {
    general: "地図の縮尺は地図上の長さと実際の長さの比です。",
    hint: "同じ紙に広い範囲を描くと、一つ一つの建物は大きく見えますか？",
    explanation: "同じ紙なら縮尺が小さい地図ほど広い範囲を示します。",
    advanced:
      "縮尺の分母が大きいほど、実際の距離に対する地図上の長さは小さくなります。",
    detail: "例えば1万分の1の地図で1cmは実際の100mです。",
  };
  return {
    question: "地図の縮尺を教えて",
    answer: renderExample(t, geography, true),
  };
}
export const simulationQuestions = [
  "Python初心者にfor文を教えて",
  "初心者に英文を添削して",
  "今日の天気を教えて",
];
export const simulatedSkills = [
  {
    name: "プログラミング家庭教師",
    condition: "Pythonの学習相談",
    matches: [true, false, false],
  },
  {
    name: "やさしい日本語",
    condition: "初心者向けの学習相談",
    matches: [true, true, false],
  },
  {
    name: "段階的ヒント",
    condition: "初心者のPython学習相談",
    matches: [true, false, false],
  },
  {
    name: "すぐ答えを示す",
    condition: "初心者の英文添削",
    matches: [false, true, false],
  },
];
export function simulateSkills(question: number) {
  return simulatedSkills.map((skill) => ({
    ...skill,
    applies: skill.matches[question] === true,
  }));
}
