export const capstoneSteps = [
  "環境を準備",
  "課題と完成条件",
  "調査と出典照合",
  "資料を整理",
  "制作指示と初版",
  "品質を検証",
  "改善と再検証",
  "評価と振り返り",
];
export const topics = [
  {
    id: "history",
    name: "歴史研究",
    title: "架空の青葉町・読書室の歩み",
    purpose: "史料が示す範囲で町の読書室を紹介する",
    audience: "地域史を初めて読む人",
    fact: "読書室は1924年4月に開室した",
    wrong: "読書室は1923年4月に開室した",
    second: "開室時の蔵書は120冊",
    unsupported: "全国初の読書室だった",
    scope: "この町の2史料だけでは全国初かは分からない",
    question: "開室した年は？",
    answer: "1924年",
    options: ["1923年", "1924年"],
    correct: 1,
    sourceDate: "1924-04-05",
    otherDate: "1924-04-06",
    primary: "青葉町読書室 開室記録（架空）",
    appendix: "受入帳の抜粋（架空）",
    original:
      "1924年4月、町の読書室を開く。開室時の蔵書は120冊。全国の施設との比較は行っていない。",
    supplement:
      "1924年4月6日現在、蔵書120冊。貸出人数やその後の増加率は記録していない。",
  },
  {
    id: "education",
    name: "学習教材",
    title: "架空の教室・発芽観察を読む",
    purpose: "観察の結果と一般化できる範囲を初心者に説明する",
    audience: "観察実験を学ぶ中学生",
    fact: "観察は2026年5月に行った",
    wrong: "観察は2025年5月に行った",
    second: "10粒中8粒が発芽した",
    unsupported: "どんな植物も必ず80%発芽する",
    scope: "1教室の10粒の観察から植物全体へ一般化できない",
    question: "観察で発芽した数は？",
    answer: "8粒",
    options: ["10粒", "8粒"],
    correct: 1,
    sourceDate: "2026-05-10",
    otherDate: "2026-05-11",
    primary: "教室の観察記録（架空）",
    appendix: "観察条件メモ（架空）",
    original:
      "2026年5月、同じ袋の種10粒を観察し8粒が発芽。1教室の観察であり、他の植物や条件は比較していない。",
    supplement:
      "同じ場所で水を与えた。温度は測定していない。別の袋や温度条件での再現性は未確認。",
  },
  {
    id: "business",
    name: "業務改善",
    title: "架空の文具係・在庫確認を改善",
    purpose: "小さな試行の根拠と限界を示して改善案を提案する",
    audience: "架空の文具係の担当者",
    fact: "試行は2026年6月に行った",
    wrong: "試行は2025年6月に行った",
    second: "5回の平均確認時間は12分から8分になった",
    unsupported: "全社で必ず50%の費用削減になる",
    scope: "5回の試行だけでは全社の費用削減は判断できない",
    question: "試行後の平均確認時間は？",
    answer: "8分",
    options: ["6分", "8分"],
    correct: 1,
    sourceDate: "2026-06-10",
    otherDate: "2026-06-11",
    primary: "文具係の試行集計（架空）",
    appendix: "試行条件のメモ（架空）",
    original:
      "2026年6月、架空の文具係で5回試行。平均確認時間は12分から8分になった。全社の費用や他部署の効果は調べていない。",
    supplement:
      "1人の担当者が同じ種類の文具を確認した。人件費や導入費は集計していない。",
  },
] as const;
export type Topic = (typeof topics)[number]["id"];
export const topicFor = (id: Topic) => topics.find((t) => t.id === id)!;
export const artifacts = [
  "小さなWeb展示・確認問題",
  "初心者向け学習ガイド",
  "改善提案書",
];
export const audiences = ["テーマの初学者", "同じ課題に取り組む仲間"];
export const requirements = [
  "原文と出典IDを示す",
  "不明点と対象範囲を明示",
  "確認問題と解説を付ける",
];
export const planItems = [
  "目的と対象読者",
  "対象時期・調査範囲",
  "一次資料と原文の確認",
  "不明点・反証の確認",
];
export const promptItems = [
  "目的・読者・形式",
  "選択資料と引用・原文照合",
  "完成条件と未確認事項",
  "変更箇所・維持条件・動作確認",
];
export const versions = ["initial", "repair", "final"] as const;
export type Version = (typeof versions)[number];
export const versionNames = {
  initial: "初版",
  repair: "修正版1（退行あり）",
  final: "再修正版",
};
export const verdicts = ["適合", "要改善", "情報不足・保留"];
export const qualityLabels = [
  "目的に合っている",
  "必要な情報が揃う",
  "出典と記述が一致",
  "資料にない主張がない",
  "数字・日付・名称が正しい",
  "制作指示に従う",
  "修正で正常部分を維持",
  "実際に操作できる",
  "個人情報・機密情報がない",
  "未確認事項・制約を説明",
];
export const axes = [
  "課題設定の明確さ",
  "調査と根拠の正確性",
  "資料整理の適切さ",
  "成果物の完成度",
  "問題発見・修正能力",
  "自分で説明できる理解度",
];
export const improvements = [
  "変更不要・根拠を維持",
  "原文に合わせて訂正",
  "不足条件を追加",
  "同条件で操作し再検証",
  "元の正常部分を復元",
  "追加資料を確認するまで保留",
];
export const hints = [
  [
    "教材の現在位置は上部に表示します。",
    "スマホはコピー→外部操作→教材タブへ戻る→現在位置を確認。",
  ],
  [
    "テーマ・目的・読者・形式をひとまとめに。",
    "完成条件はSTEP 5と7でも同じ内容を使います。",
  ],
  [
    "日付と断定を原文に戻って読みましょう。",
    "主張1は年が違い、主張2は比較資料なし。主張3は支持されます。",
  ],
  [
    "資料を外す前後で同じ質問を比べましょう。",
    "S1の記述があっても、S2の未測定項目を推測で補えません。",
  ],
  [
    "『作って』だけでは根拠と完成条件が不足します。",
    "4つの指示要素を揃えてもAI出力の検証は必要です。",
  ],
  [
    "AIの『成功』でなく、原文と動作を見ます。",
    "初版には日付・過大な主張・条件不足。初版の維持確認は比較前なので保留です。",
  ],
  [
    "『直して』に問題・期待結果・維持条件を加える。",
    "修正版1は出典に合わせても確認ボタンが反応しません。再修正版で同じ入力を試します。",
  ],
  [
    "点数より、なぜそう評価したかを説明しましょう。",
    "不足した軸の工程へ戻れます。全10章後も教材の改善は続きます。",
  ],
];
export const capstoneReferences = [
  {
    title: "Deep Researchの計画・上限・コピー",
    url: "https://support.google.com/gemini/answer/15719111?co=GENIE.Platform%3DDesktop&hl=ja",
  },
  {
    title: "Gemini内ノートブック・接続と同期条件",
    url: "https://support.google.com/gemini/answer/16972047?co=GENIE.Platform%3DDesktop&hl=ja",
  },
  {
    title: "Notebook系の資料追加・コピーしたテキスト",
    url: "https://support.google.com/gemininotebook/answer/16215270?hl=ja",
  },
  {
    title: "Canvasの制作・修正・版の確認",
    url: "https://support.google.com/gemini/answer/16047321?co=GENIE.Platform%3DDesktop&hl=ja",
  },
];
