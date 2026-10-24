export const studyTopics = [
  {
    id: "energy",
    title: "日本の再生可能エネルギーの現状",
    short: "再生可能エネルギー",
    metric: "再生可能エネルギーを利用した施設",
    value: 32,
    place: "架空市あおい",
    question: "施設の利用割合をどう読むか",
  },
  {
    id: "education",
    title: "生成AIの教育利用",
    short: "生成AIと教育",
    metric: "AIの回答を原文と照合した課題",
    value: 64,
    place: "架空の学び教室",
    question: "照合した課題の割合をどう読むか",
  },
  {
    id: "mobility",
    title: "電気自動車の普及と課題",
    short: "電気自動車",
    metric: "共同充電設備を利用した世帯",
    value: 28,
    place: "架空市みどり",
    question: "充電設備の利用割合をどう読むか",
  },
] as const;
export type TopicId = (typeof studyTopics)[number]["id"];
export const topicFor = (id: string) =>
  studyTopics.find((t) => t.id === id) ?? studyTopics[0];
export const sourceChoices = [
  "主張の根拠として条件付きで採用",
  "用途を限定し追加確認する",
  "この主張の根拠には採用しない",
];
export interface StudySource {
  id: string;
  title: string;
  format: "PDF" | "Web記事" | "テキスト資料" | "調査レポート";
  kind: string;
  issuer: string;
  date: string;
  summary: string;
  section: string;
  body: string;
  claim: string;
  judgment: number;
  reason: string;
  learning: string;
}
export const materialId = (topic: TopicId, kind: string) => `${topic}-${kind}`;
export function correctedReport(topic: TopicId) {
  const t = topicFor(topic);
  return `【教材用の模擬レポート・実データではありません】\n2025年の${t.place}の架空標本では、${t.metric}は100件中${t.value}件（${t.value}%）でした。[${topic}-public 第1節]\nこれは全国の割合ではありません。別の架空の観察研究は24件の関連を示しただけで、因果関係や全対象の成功を証明していません。[${topic}-paper 結果と限界]\n2015年の資料は過去の記録として扱い、2025年の値には使いません。対象や方法が異なれば、単純な増減比較もできません。[${topic}-old 調査条件]\n将来の値や必ず成功するという結論は、この資料群だけでは判断できません。`;
}
export function studySources(topic: TopicId): StudySource[] {
  const t = topicFor(topic);
  const make = (kind: string, s: Omit<StudySource, "id">): StudySource => ({
    id: materialId(topic, kind),
    ...s,
  });
  return [
    make("public", {
      title: `${t.short}・2025年の架空標本集計`,
      format: "PDF",
      kind: "公的統計に相当する模擬資料",
      issuer: "教材用・架空市データ室",
      date: "2026-02-01",
      summary: "100件の対象を数えた一次集計。全国の調査ではない。",
      section: "第1節：対象と結果",
      body: `2025年、${t.place}の対象100件を集計。${t.metric}は${t.value}件でした（${t.value}%）。全国を代表する標本ではありません。対象の定義が違う集計とはそのまま比較できません。`,
      claim: `${t.place}の架空標本で${t.metric}は${t.value}%だった。`,
      judgment: 0,
      reason:
        "第1節に分母100件と分子、対象年と地域が書かれています。この標本の説明には使えますが、公的資料に似ていても全国の数値にはできません。",
      learning: `架空標本100件中${t.value}件。割合を読むときは分母・対象年・地域を一緒に確認する。`,
    }),
    make("paper", {
      title: `${t.short}・24件の観察と限界`,
      format: "PDF",
      kind: "学術論文に相当する模擬資料",
      issuer: "教材用・架空学習研究班",
      date: "2025-09-10",
      summary: "少数の観察例。関連と原因を区別する。",
      section: "結果と限界",
      body: `2024年の${t.place}で24件を観察しました。取り組みと結果に関連が見られましたが、比較群の無作為割当はありません。他の要因の影響を除けず、因果関係は確認できません。全国のすべての対象には一般化できません。`,
      claim: "24件の観察では関連が見られたが、因果関係は確認できない。",
      judgment: 0,
      reason:
        "『結果と限界』は関連と因果の違いを明記しています。論文の体裁だけで正しいとせず、標本と方法を読みます。",
      learning:
        "24件の観察研究は関連を示す。比較方法と限界を確認し、因果や全国への一般化を避ける。",
    }),
    make("company", {
      title: `${t.short}・自社試験の発表`,
      format: "Web記事",
      kind: "企業発表に相当する模擬資料",
      issuer: "教材用・架空ソリューション社",
      date: "2026-01-20",
      summary: "自社製品を使った12件の試験の報告。",
      section: "自社試験の条件",
      body: "自社製品を使った12件の試験について結果を発表しました。製品の仕様と試験条件は一次情報ですが、他製品との同条件の比較は行っていません。販売を目的とする説明も含みます。",
      claim:
        "この会社が『自社製品を使った12件の試験』と発表したことを確認したい。",
      judgment: 0,
      reason:
        "この会社自身が発表した仕様と試験条件を調べる目的には、一次資料として有用なので条件付きで採用できます。ただし、他製品より優れているという比較や効果の一般化には、独立した別の根拠が必要です。",
      learning:
        "企業発表は仕様や試験条件の一次情報として使い、販促の目的と独立検証の有無を確認する。",
    }),
    make("blog", {
      title: `${t.short}・ある利用者の体験記`,
      format: "Web記事",
      kind: "個人ブログに相当する模擬資料",
      issuer: "教材用・架空の一利用者",
      date: "2026-03-01",
      summary: "一人の経験を記した文章。",
      section: "個人の感想",
      body: "私は使ってよかったと感じました。これは私一人の体験で、人数を集計した調査や比較実験ではありません。",
      claim: "すべての利用者に同じ効果があるという証拠にする。",
      judgment: 2,
      reason:
        "『個人の感想』は一人の体験です。経験や論点を知ることには役立ちますが、全利用者の効果を裏付けません。",
      learning:
        "一人の体験と集団への効果を区別する。体験談を一般的な事実へ広げない。",
    }),
    make("unknown", {
      title: `${t.short}・出所不明の切り抜き`,
      format: "テキスト資料",
      kind: "出典不明の模擬情報",
      issuer: "発行者不明（教材用設定）",
      date: "日付不明",
      summary: "数値だけで調査方法も出所もない。",
      section: "切り抜きの全文",
      body: "『成功率は97%』という文字だけがあります。誰がいつ、何件を、どう調べた数値かは書かれていません。",
      claim: "97%を確かな調査結果として引用する。",
      judgment: 2,
      reason:
        "分母、方法、発行者、年月を追えません。別の資料で確かめられるまでは、この数値を根拠に採用しません。",
      learning: "出所不明の数値は引用を保留する。原資料と調査方法を探す。",
    }),
    make("old", {
      title: `${t.short}・2015年の架空記録`,
      format: "PDF",
      kind: "古い公的資料に相当する模擬資料",
      issuer: "教材用・架空市旧記録室",
      date: "2016-04-01",
      summary: "2015年の記録。現在の値ではない。",
      section: "調査条件",
      body: "対象年は2015年です。当時の別地域の対象100件中10件が該当しました。現在の対象地域とは調査範囲と定義が異なります。",
      claim: "2025年の状況を説明するために使いたい。",
      judgment: 2,
      reason:
        "『調査条件』は2015年・別地域・異なる定義です。この2025年の状況を述べる主張の根拠には採用しません。歴史的背景を知る用途には有用ですが、現在値や単純な時系列比較とは分けて扱います。",
      learning:
        "発行主体だけでなく対象年を確認する。古い資料は歴史的背景に用途を限定する。",
    }),
    make("mismatch", {
      title: `${t.short}・設備数の別集計`,
      format: "テキスト資料",
      kind: "主張を裏付けない模擬資料",
      issuer: "教材用・架空施設台帳係",
      date: "2026-02-15",
      summary: "台数を数えた資料。割合や効果の調査ではない。",
      section: "設備の台数",
      body: "設備は8台でした。利用した人数、対象件数、効果、割合は調べていません。",
      claim: "利用割合は80%だとする根拠にする。",
      judgment: 2,
      reason:
        "『設備の台数』の8台から80%は計算できません。引用があっても、その本文が主張を支えるとは限りません。",
      learning:
        "台数と割合を取り違えない。本文の測定項目が主張と一致するかを調べる。",
    }),
    make("report", {
      title: `${t.short}・教材内の改善済みレポート`,
      format: "調査レポート",
      kind: "教材用の二次資料",
      issuer: "教材用・教材編集係",
      date: "2026-10-23",
      summary: "第3章の修正例。元資料も照合するための二次資料。",
      section: "改善後の本文",
      body: correctedReport(topic),
      claim: "限界と根拠を併記して学習に使う。",
      judgment: 0,
      reason:
        "教材内で修正した文章です。実世界の事実を検証した印ではありません。元の標本集計と観察資料も開いて照合します。",
      learning:
        "改善済みの二次資料でも、元資料と限界を再確認する。引用の連鎖を切らさない。",
    }),
  ];
}
export const verifiedMaterialIds = (topic: TopicId) =>
  ["public", "paper", "report"].map((k) => materialId(topic, k));
export function reportChecks(topic: TopicId) {
  const t = topicFor(topic);
  return [
    {
      id: "number",
      source: `${topic}-public`,
      claim: `対象の96%が該当した。`,
      question: "この数値の問題は？",
      options: ["資料にない数値を使っている", "対象年だけが古い", "問題はない"],
      answer: 0,
      reason: `標本集計の第1節は100件中${t.value}件（${t.value}%）。96%という値はありません。`,
    },
    {
      id: "citation",
      source: `${topic}-mismatch`,
      claim: `利用割合は80%だ。[設備数の別集計]`,
      question: "この引用の問題は？",
      options: [
        "発行日だけの問題",
        "測定項目と主張が違う",
        "引用があるので正しい",
      ],
      answer: 1,
      reason:
        "設備の台数の本文は8台だけを数えています。対象件数や割合は調べておらず、80%の根拠にはなりません。",
    },
    {
      id: "inference",
      source: `${topic}-paper`,
      claim: "取り組みがよい結果を引き起こしたと証明された。",
      question: "事実と推測を区別すると？",
      options: [
        "関連があれば原因も確定する",
        "論文なら断定してよい",
        "観察された関連を因果へ広げている",
      ],
      answer: 2,
      reason:
        "『結果と限界』は比較群の無作為割当がなく因果を確認できないと明記。観察した事実と原因という解釈を分けます。",
    },
    {
      id: "old",
      source: `${topic}-old`,
      claim: "2025年も10%である。[2015年の記録]",
      question: "この資料の使い方は？",
      options: [
        "対象年と定義が違い現在の根拠にならない",
        "公的資料なので今も同じ",
        "日付は関係しない",
      ],
      answer: 0,
      reason:
        "『調査条件』は2015年・別地域・異なる定義。発行主体が公的に見えても2025年の値にはできません。",
    },
    {
      id: "certainty",
      source: `${topic}-paper`,
      claim: "全国のすべての対象で必ず成功する。",
      question: "断定の問題は？",
      options: [
        "強い表現なら分かりやすい",
        "少数の標本から全対象への保証はできない",
        "24件あれば全員の証明になる",
      ],
      answer: 1,
      reason:
        "『結果と限界』は24件で全国に一般化できないとしています。『必ず』『すべて』を支える証拠はありません。",
    },
  ];
}
export interface ResearchConditions {
  purpose: "learn" | "decision";
  period: "recent" | "any";
  region: "japan" | "world";
  comparison: "same" | "none";
  evidence: "primary" | "any";
}
export const defaultConditions: ResearchConditions = {
  purpose: "learn",
  period: "recent",
  region: "japan",
  comparison: "same",
  evidence: "primary",
};
export const planLabels = [
  "範囲を一つの問いに絞る",
  "対象期間を明記する",
  "同じ比較基準を使う",
  "根拠となる資料の条件を決める",
];
export function conditionWarnings(c: ResearchConditions) {
  return [
    c.period === "any"
      ? "対象期間が不明確です。何年の状況かを指定しましょう。"
      : "",
    c.region === "world"
      ? "世界全体では範囲が広すぎます。地域を絞るか分けて調べましょう。"
      : "",
    c.comparison === "none"
      ? "比較基準がありません。同じ指標・定義を使う条件が必要です。"
      : "",
    c.evidence === "any"
      ? "根拠の条件が曖昧です。発行者・方法・出典を追える資料を選びましょう。"
      : "",
  ].filter(Boolean);
}
export function researchPrompt(topic: TopicId, c: ResearchConditions) {
  const t = topicFor(topic);
  return `【任意の実操作用・調査計画の依頼】\nテーマ：${t.title}\n目的：${c.purpose === "learn" ? "初学者の学習" : "選択肢の比較検討"}\n対象期間：${c.period === "recent" ? "2024〜2025年（発行年と対象年を区別）" : "未指定・開始前に確認が必要"}\n地域：${c.region === "japan" ? "日本（地域差も明示）" : "世界全体（範囲の再検討が必要）"}\n比較：${c.comparison === "same" ? "同じ定義と指標で過去年と比較" : "未指定・基準の確認が必要"}\n根拠：${c.evidence === "primary" ? "一次資料・学術資料を優先し、発行者・対象年・方法・限界を示す" : "未指定・資料条件を確認する"}\nまず調査計画だけを提示してください。私が計画を修正・確認し、別に開始を依頼するまで調査を開始しないでください。不明点を推測で埋めず質問してください。回答では事実と推測を分け、各主張の原資料と該当箇所を示してください。この教材の架空標本を実データとして使わないでください。`;
}
export function improvedPlan(
  topic: TopicId,
  c: ResearchConditions,
  fixes: boolean[],
) {
  return [
    fixes[0]
      ? `問い：${topicFor(topic).question}に絞り、${c.region === "japan" ? "日本の地域差を分ける" : "まず地域を絞る相談をする"}。`
      : "世界中のあらゆる影響を調べる。",
    fixes[1]
      ? `対象年：${c.period === "recent" ? "2024〜2025年" : "開始前に対象年を確認"}。発行年と区別する。`
      : "いつの資料でも集める。",
    fixes[2]
      ? "比較：同じ分母・定義・地域条件で比較し、異なる場合は比較を保留する。"
      : "よさそうな数値を並べる。",
    fixes[3]
      ? "根拠：一次集計・学術資料の発行者、対象年、方法、限界、本文の対応を記録する。"
      : "ネットで見つかった資料を使う。",
  ];
}
export const questionCases = [
  {
    id: "correct",
    title: "正しい引用を照合する",
    source: "public",
    question: "架空標本の割合と対象を教えて",
    answer: 0,
  },
  {
    id: "wrong",
    title: "引用先の取り違えを見つける",
    source: "company",
    question: "2025年の架空標本の割合は？",
    answer: 1,
  },
  {
    id: "invented",
    title: "資料にない記述を見つける",
    source: "public",
    question: "全対象の97%が成功したという説明は？",
    answer: 2,
  },
  {
    id: "outside",
    title: "資料外の質問で止まる",
    source: "",
    question: "2035年の全国の割合を正確に予測できる？",
    answer: 3,
  },
] as const;
export const citationChoices = [
  "引用本文が主張を支える",
  "引用先が別の資料",
  "本文にその記述がない",
  "資料だけでは答えられない",
];
export function notebookAnswer(topic: TopicId, caseId: string, ids: string[]) {
  const t = topicFor(topic);
  const q = questionCases.find((q) => q.id === caseId) ?? questionCases[0];
  if (!ids.length)
    return {
      text: "参照資料がありません。体験1で資料を追加してください。",
      citations: [] as string[],
      available: false,
    };
  const source = q.source ? `${topic}-${q.source}` : "";
  if (source && !ids.includes(source))
    return {
      text: "この例に必要な資料は現在の参照対象にありません。体験1で対応資料を追加するか、答えを保留してください。",
      citations: [] as string[],
      available: false,
    };
  return {
    text:
      q.id === "correct"
        ? `2025年の${t.place}の架空標本100件中${t.value}件、${t.value}%です。全国の値ではありません。[1]`
        : q.id === "wrong"
          ? `架空標本の割合は${t.value}%です。[1]`
          : q.id === "invented"
            ? "全対象の97%が成功したことが分かりました。[1]"
            : "2035年の全国の値は、選択資料だけでは答えられません。予測には別の根拠が必要です。",
    citations: source ? [source] : [],
    available: true,
  };
}
export function citationReason(topic: TopicId, caseId: string) {
  const q = questionCases.find((q) => q.id === caseId) ?? questionCases[0];
  return q.id === "correct"
    ? "[1]の標本集計・第1節に分母、対象年、地域、割合が一致します。全国の数値には拡張していません。"
    : q.id === "wrong"
      ? "[1]は企業発表の『自社試験の条件』です。標本集計の割合はそこにありません。数値が別資料に存在しても、この引用は取り違えです。"
      : q.id === "invented"
        ? `標本集計の第1節は${topicFor(topic).value}%で、97%や全対象の成功は記していません。引用番号があっても支持されていません。`
        : "選択した資料に2035年の全国の測定値はありません。答えられないと明示し、推測を事実として出さない対応が適切です。";
}
export interface GuideSettings {
  audience: "beginner" | "intermediate";
  format: "summary" | "qa" | "quiz";
  detail: "brief" | "detailed";
}
export const defaultGuide: GuideSettings = {
  audience: "beginner",
  format: "summary",
  detail: "brief",
};
export function learningGuide(
  topic: TopicId,
  ids: string[],
  settings: GuideSettings,
) {
  const sources = studySources(topic).filter((s) => ids.includes(s.id));
  if (!sources.length)
    return "参照資料がありません。資料を追加してから学習ガイドを作りましょう。";
  return [
    `【教材用の固定回答例・実データではありません】${topicFor(topic).short}の学習ガイド`,
    `対象：${settings.audience === "beginner" ? "初心者・用語を一つずつ説明" : "中級者・方法と推論の限界を検討"} / 形式：${settings.format === "summary" ? "要約" : settings.format === "qa" ? "Q&A" : "復習問題"} / ${settings.detail === "brief" ? "簡潔" : "詳細"}`,
    ...sources.map((s, i) => {
      const point =
        settings.audience === "beginner"
          ? s.learning
          : `方法・標本・一般化の範囲を検討：${s.learning} 判断の根拠：${s.reason}`;
      const body =
        settings.format === "summary"
          ? `要点${i + 1}：${point}`
          : settings.format === "qa"
            ? `Q${i + 1}：${s.title}をどう使う？\nA：${point}`
            : `復習問題${i + 1}：${s.title}の限界を説明しよう。\n解答例：${point}`;
      return `${body}\n根拠：[${i + 1}] ${s.title} / ${s.section}${settings.detail === "detailed" ? `\n原文：${s.body}\n追加確認：${s.reason}` : ""}`;
    }),
  ].join("\n\n");
}
export const studyReferences = [
  {
    title: "Gemini アプリで Deep Research を利用する",
    url: "https://support.google.com/gemini/answer/15719111?hl=ja",
  },
  {
    title: "Gemini アプリのノートブックでプロジェクトを整理する",
    url: "https://support.google.com/gemini/answer/16972047?hl=ja",
  },
  {
    title: "Gemini Notebook の詳細（NotebookLM ヘルプ）",
    url: "https://support.google.com/gemininotebook/answer/16164461?hl=ja",
  },
  {
    title: "Gemini Notebook で音声解説を生成する",
    url: "https://support.google.com/gemininotebook/answer/16212820?hl=ja",
  },
];
