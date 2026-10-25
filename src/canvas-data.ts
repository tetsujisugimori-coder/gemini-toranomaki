export type CanvasPlatform = "pc" | "ios" | "android";
export const canvasReferences: {
  title: string;
  url: string;
  platform: CanvasPlatform | "all";
}[] = [
  {
    title: "Canvas紹介（公式・共通）",
    url: "https://gemini.google/overview/canvas/",
    platform: "all",
  },
  {
    title: "Canvasヘルプ：PC（公式）",
    url: "https://support.google.com/gemini/answer/16047321?hl=ja&co=GENIE.Platform%3DDesktop",
    platform: "pc",
  },
  {
    title: "Canvasヘルプ：iPhone/iPad（公式）",
    url: "https://support.google.com/gemini/answer/16047321?hl=ja&co=GENIE.Platform%3DiOS",
    platform: "ios",
  },
  {
    title: "Canvasヘルプ：Android（公式）",
    url: "https://support.google.com/gemini/answer/16047321?hl=ja&co=GENIE.Platform%3DAndroid",
    platform: "android",
  },
];
export const quizTopics = [
  {
    id: "science",
    title: "身近な科学",
    questions: [
      {
        text: "標準大気圧で、水が凍り始める温度の目安は？",
        options: ["100℃", "0℃", "50℃"],
        answer: 1,
        reason:
          "純粋な水は標準大気圧では約0℃で凍ります。条件も一緒に確認します。",
      },
      {
        text: "植物の光合成で、エネルギーのもとになるのは？",
        options: ["光", "音", "磁石"],
        answer: 0,
        reason:
          "光合成では光のエネルギーを使います。水や二酸化炭素も必要です。",
      },
      {
        text: "地球で昼と夜が繰り返される主な理由は？",
        options: ["月が光をさえぎる", "太陽が毎日消える", "地球が自転する"],
        answer: 2,
        reason: "地球の自転で、太陽に向く側と向かない側が入れ替わります。",
      },
    ],
  },
  {
    id: "evidence",
    title: "情報の確かめ方",
    questions: [
      {
        text: "AIの回答に引用番号があったら、次に何をする？",
        options: [
          "番号だけで正しいと決める",
          "原文を読まない",
          "引用元の本文と主張を照合する",
        ],
        answer: 2,
        reason:
          "引用番号の存在と、本文が主張を支えることは別です。原文へ戻って確認します。",
      },
      {
        text: "共有する画面に不要な個人情報があったら？",
        options: [
          "そのまま共有する",
          "不要表示を閉じ、共有範囲を確認する",
          "AIなら何でも見せてよい",
        ],
        answer: 1,
        reason:
          "目的に必要な情報だけに絞ります。共有開始後の表示も確認します。",
      },
      {
        text: "2015年の資料を2025年の数値として使える？",
        options: [
          "対象年・定義を調べ、現在値の根拠にはしない",
          "公的な見た目なら使える",
          "年は関係ない",
        ],
        answer: 0,
        reason:
          "古い資料は背景理解には役立ちますが、現在の値の根拠にはできません。",
      },
    ],
  },
] as const;
export type QuizTopic = (typeof quizTopics)[number]["id"];
export const quizFor = (id: QuizTopic) => quizTopics.find((q) => q.id === id)!;
export type QuizVersion = "initial" | "revised";
export type Repair = "appearance" | "unanswered";
export type PromptKind = "create" | "repair" | "verify";
export interface CanvasSettings {
  topic: QuizTopic;
  audience: "beginner" | "review";
  feedback: "score" | "reason";
}
export const defaultCanvasSettings: CanvasSettings = {
  topic: "science",
  audience: "beginner",
  feedback: "reason",
};
export const repairLabels = {
  appearance: "見た目だけ：採点ボタンを目立たせる",
  unanswered: "動作：未回答なら採点せず設問を案内する",
};
export const promptLabels = {
  create: "作成指示",
  repair: "修正指示",
  verify: "確認手順",
};
export function canvasPrompt(
  kind: PromptKind,
  s: CanvasSettings,
  repair: Repair,
) {
  const q = quizFor(s.topic);
  const spec = `テーマ：${q.title}\n対象：${s.audience === "beginner" ? "初めて学ぶ人。短く平易な説明" : "一度学んだ人。復習の観点も添える"}\n問題数：3問。各問3択のラジオボタン（1問につき1つ選ぶ方式）。\n採点基準：1問1点、満点3点。正答と照合して毎回計算し、連続採点で点数を足さない。\n結果表示：${s.feedback === "reason" ? "点数・正誤・各問の理由" : "点数と各問の正誤"}。回答変更時は旧結果を消し再採点を求める。\nやり直し：回答・点数・未回答案内をすべて消し、最初から試せる。`;
  const questions = q.questions
    .map(
      (v, i) =>
        `${i + 1}. ${v.text}\n選択肢：${v.options.join(" / ")}\n正答：${v.options[v.answer]}\n理由：${v.reason}`,
    )
    .join("\n");
  if (kind === "create")
    return `【任意の実Gemini Canvas用・作成指示】\n学習クイズのWebアプリを作ってください。\n${spec}\n以下のオリジナル3問を使用してください。\n${questions}\nまず未回答の扱いも含め、期待する動作を説明してください。外部通信、ログイン、個人情報の入力、AI APIは不要です。共有や公開は自動で行わないでください。`;
  if (kind === "repair")
    return `【任意の実Gemini Canvas用・修正指示】\n観察事実：未回答の問題があっても採点され、0点や部分点の結果が出ます。\n期待する変更：${repair === "unanswered" ? "未回答が1問でもあれば採点を止め、未回答の問題番号をすべて表示し、そこへ移動できるようにしてください。全問回答後にだけ採点してください。" : "採点ボタンを目立つ見た目にしてください。この依頼には未回答時の動作変更は含めません。"}\n維持する機能：3問・各3択、正答、1問1点/3点満点の採点基準、回答変更後の結果解除、やり直し機能。\n${spec}\n正答を勝手に変えず、変更箇所を説明してください。修正済みという説明だけでは完了とせず、以下の確認を人が行います。外部通信や公開は追加しないでください。`;
  return `【任意の実Gemini Canvas用・確認手順】\n${spec}\n1. 見た目：設問・3択・採点・やり直しが読みやすいか。表示だけで合格にしない。\n2. 全問未回答、一部回答を試す。修正版では点数を出さず未回答番号を案内し、その設問へ移動できるか。\n3. 全問回答、全問正解、全問不正解を試し、固定の正答と1問1点で計算が一致するか。\n${questions}\n4. 連続して採点し、点数が増えないか。回答を変えたら旧結果が消え、再採点できるか。\n5. やり直しで回答・点数・案内が消えるか。以前からの採点・やり直しも再確認する。\n6. 修正前後を同じ回答条件で比較する。実アプリの共有は公開範囲・含む情報・データの扱いを確認してから自分で判断する。`;
}
// Increment the fixed-text version when changing prompt wording or the question corpus.
export function canvasCopyKey(
  kind: PromptKind,
  s: CanvasSettings,
  repair: Repair,
) {
  return `${kind}-v1:${s.topic}:${s.audience}:${s.feedback}${kind === "repair" ? `:${repair}` : ""}`;
}
export const canvasChecks = [
  {
    id: "requirements",
    question: "『見やすいクイズを作って』だけでは足りないのは？",
    options: [
      "色を指定すれば採点も決まる",
      "回答方法・採点・結果・やり直しの期待動作が未指定",
      "コードを書けない人は頼めない",
    ],
    answer: 1,
    reason:
      "見た目の形容だけでは、何問・どう答える・いつ何を表示するかは決まりません。動作の条件を言葉にします。",
  },
  {
    id: "repair",
    question: "未回答で採点されたら、どんな修正依頼がよい？",
    options: [
      "使いづらいから直して",
      "ボタンの色だけ変えて",
      "観察した動作・期待する動作・維持する機能を伝える",
    ],
    answer: 2,
    reason:
      "未回答でも点数が出た事実、採点を止め設問を案内する期待、3問/正答/採点/やり直しの維持を分けて伝えます。",
  },
  {
    id: "proof",
    question: "修正が完了した証拠になるのは？",
    options: [
      "条件を変えて操作し、期待どおりの結果を確かめたこと",
      "ボタンが表示されたことだけ",
      "AIが修正済みと言ったことだけ",
    ],
    answer: 0,
    reason:
      "見た目と動作は別です。未回答、全回答、連続採点、やり直しを試し、変更していない機能にも影響がないか確かめます。",
  },
] as const;
export const testCases = [
  {
    id: "missing",
    title: "未回答で止まるか",
    task: "1問だけ回答した状態をセットし、採点してください。点数が出るか、未回答番号が出るか予想しましょう。",
    options: ["点数が出る", "未回答の問題番号が表示され、点数は出ない"],
  },
  {
    id: "score",
    title: "全問回答の採点",
    task: "1問だけ正解する回答をセットし、採点してください。何点になるか予想しましょう。",
    options: ["0点", "1点", "3点"],
  },
  {
    id: "repeat",
    title: "連続採点で増えないか",
    task: "全問正解をセットし、採点を2回押してください。2回目の点数を予想しましょう。",
    options: ["3点のまま", "6点に増える"],
  },
  {
    id: "restart",
    title: "やり直しで消えるか",
    task: "1問だけ回答した状態をセットし、採点してから、やり直してください。最後の状態を予想しましょう。",
    options: ["回答・点数・未回答案内がすべて消える", "どれかが残る"],
  },
] as const;
export type CanvasTest = (typeof testCases)[number]["id"];
