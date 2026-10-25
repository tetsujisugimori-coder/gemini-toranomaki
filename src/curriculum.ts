import { studyReferences } from "./study-data";
import { serviceReferences } from "./services-data";
export interface Reference {
  title: string;
  url: string;
}
export interface Step {
  id: string;
  title: string;
  body: string;
}
export interface Lesson {
  id: string;
  number: number;
  title: string;
  task: string;
  goal: string;
  description: string;
  conditions: string;
  cautions: string[];
  references: Reference[];
  checkedAt: string;
  status: "ready" | "planned";
  steps: Step[];
  prompt?: string;
  quiz?: {
    question: string;
    options: string[];
    answer: number;
    explanation: string;
  };
}
const topics = [
  [
    "Geminiの画面とモデル選択",
    "利用可能な機能を探す",
    "画面の入り口を確認し、自分のアカウントで使える機能を見つける。",
    "Geminiの画面からチャットや機能、モデル・モードの選択肢を探す。",
    "https://support.google.com/gemini/answer/13278668?hl=ja",
  ],
  [
    "Googleサービス連携",
    "Gmailから予定を探しカレンダーに登録",
    "Googleサービスとの連携を理解する。",
    "メールや予定などを扱う連携機能。対応サービスとアクセス許可の確認が必要。",
    "https://support.google.com/gemini/?hl=ja",
  ],
  [
    "Deep Research",
    "調査計画を修正し、出典を検証",
    "調査計画と出典を吟味する。",
    "複数の情報源をもとに調査を進める機能。調べ物の整理に使う。",
    "https://gemini.google/overview/deep-research/",
  ],
  [
    "Gemini Notebook・NotebookLM",
    "PDFから音声解説や学習資料を作る",
    "資料をもとに学習する方法を知る。",
    "資料の理解や整理に使う機能・サービス。章題は教材編成上の仮称で、同一製品を意味しない。",
    "https://support.google.com/notebooklm/?hl=ja",
  ],
  [
    "Gemini Live",
    "カメラで物を見せながら質問",
    "会話と視覚情報を使った相談を学ぶ。",
    "音声によるやり取りに使う機能。カメラ等の対応条件は別途確認する。",
    "https://gemini.google/overview/gemini-live/",
  ],
  [
    "Canvas",
    "簡単なWebアプリを作る",
    "成果物を編集する流れを知る。",
    "文章やコードなどの作成・編集を進める機能。",
    "https://gemini.google/overview/canvas/",
  ],
  [
    "Nano Banana",
    "画像生成と部分修正を試す",
    "画像の生成と編集を学ぶ。",
    "画像を作り、修正を試す章。現行のモデル名・利用枠は未確認。",
    "https://gemini.google/overview/image-generation/",
  ],
  [
    "動画・音楽生成",
    "利用可能な生成機能を体験",
    "自分に提供される生成機能を見分ける。",
    "映像や音に関する生成機能を扱う予定。現在の名称と提供範囲は未確認。",
    "https://gemini.google/overview/",
  ],
  [
    "Gems・カスタム機能",
    "自分専用の学習支援AIを作る",
    "繰り返し使う設定を整理する。",
    "用途に合わせたカスタマイズを学ぶ章。",
    "https://gemini.google/overview/gems/",
  ],
  [
    "総合演習",
    "複数機能を連携させて成果物を作る",
    "機能を組み合わせて学習の成果を形にする。",
    "各章で学んだ機能を選び、成果物を作る演習。",
    "https://support.google.com/gemini/?hl=ja",
  ],
];
export const lessons: Lesson[] = topics.map(
  ([title, task, goal, description, url], i) => ({
    id: `chapter-${i + 1}`,
    number: i + 1,
    title,
    task,
    goal,
    description,
    conditions:
      "提供条件は未確認。プラン・年齢・地域・言語・端末・個人／仕事／学校のアカウントにより異なります。画面内の案内と公式ヘルプで確認してください。",
    cautions: [
      "章題はIssue #1に基づく教材上の名称です。最新の公式名称・画面表示を保証しません。",
      "機密情報・個人情報を練習に入力しないでください。",
    ],
    references: [{ title: "Google公式情報（外部サイト）", url }],
    checkedAt:
      "2026-10-22：公式ページ取得がネットワーク制限で拒否されたため、現行仕様は未確認",
    status: i < 4 ? "ready" : "planned",
    steps: [],
  }),
);
lessons[0].steps = [
  {
    id: "prepare",
    title: "1. 別画面でGeminiを開く",
    body: "この教材を残したまま「Geminiを開く」から別タブに移動します。スマートフォンではタブを切り替えて読み進めてください。利用するGoogleアカウントを確認し、必要ならGemini側でログインします。この教材へのログインは不要です。仕事・学校のアカウントでは管理者の制限がある場合があります。",
  },
  {
    id: "screen",
    title: "2. 画面の入り口を見つける",
    body: "メッセージを入力する欄、新しいチャットの入り口、過去のチャットを探します。狭い画面ではメニューの中に隠れている場合があります。プロフィールの入り口で利用中のアカウントを確認します。ボタン名や位置は変更されるため、表示中の説明や公式ヘルプを手がかりにしてください。",
  },
  {
    id: "models",
    title: "3. モデル・モードの選択肢を確認する",
    body: "画面内にモデル名・モード名が表示されているか探します。選択メニューがあれば開き、現在選ばれている項目と他の項目の説明を読みます。表示されない場合は無理に探し続けず「選択肢なし」と記録してください。有料プランの購入はこの演習に不要です。モデル名や利用枠をGeminiの回答だけで判断せず、画面の案内と公式情報で確認します。",
  },
  {
    id: "features",
    title: "4. 利用できる機能を探す",
    body: "入力欄の周辺やツールのメニューを開き、添付、調査、作成など、自分の画面にある機能名を確認します。名前は表示どおりにメモしてください。使えない項目、利用枠やアップグレードの案内がある項目も区別します。この章ではGoogleサービスを接続したり、メール・カメラへのアクセスを許可したりする必要はありません。",
  },
  {
    id: "practice",
    title: "5. 練習プロンプトを送る",
    body: "下の練習プロンプトを全文コピーし、Geminiの入力欄に貼り付けて送信します。コピーできない場合は全文を選択して手動でコピーしてください。回答を読んだら、自分の画面で実際に確認できた機能を1つメモします。AIの回答はアカウントの権限や最新の利用枠の証明にはなりません。",
  },
  {
    id: "review",
    title: "6. 確認して演習を完了する",
    body: "「利用中のアカウント」「表示されたモデル・モード（または選択肢なし）」「使える機能1つ」を自分用に整理します。違いがあれば公式ヘルプを確認し、分からないものは未確認のままで構いません。以下の理解度チェックに答え、実際に画面を確認できたら演習完了にチェックします。",
  },
];
lessons[0].prompt =
  "Geminiを初めて使います。学習の相談相手になってください。\n身近なテーマを1つ選び、Geminiとのやり取りを練習するための短い質問を3つ提案してください。\n個人情報の入力や有料機能の利用は前提にしないでください。\nなお、私の画面や契約プランは見えていないので、利用可能なモデルや機能を断定しないでください。";
lessons[0].quiz = {
  question: "自分が使えるモデルや機能を確認するとき、最も適切なのは？",
  options: [
    "Geminiの回答だけで利用可能だと判断する",
    "自分の画面と公式情報を確認し、プラン・端末などの違いを考慮する",
    "教材と同じ表示になるまで有料プランに変更する",
  ],
  answer: 1,
  explanation:
    "実際の画面と公式情報を確認します。提供範囲には差があり、AIの回答だけでは利用権限を確認できません。",
};

lessons[1].goal =
  "メールの原文・訂正・AIの抽出結果を照合し、Googleサービスの操作前後に人が確認すべきことを判断する。";
lessons[1].description =
  "架空の受信箱で予定を読み解き、検索と登録を分けた指示を組み立てます。実アカウントの利用は任意です。";
lessons[1].references = serviceReferences;
lessons[1].conditions =
  "Google公式ヘルプ本文を2026-10-23に確認。アカウント・管理者設定・プラン・地域・端末による実際の提供範囲は未確認です。模擬演習には接続や契約は不要です。";
lessons[1].checkedAt =
  "2026-10-23：接続・予定管理・アプリ連携・Gemini in Gmailの公式ヘルプ本文を確認。実アカウントでの操作は未検証";

lessons[2].title = "Deep Research：調査計画から出典検証まで";
lessons[2].goal =
  "調査条件と計画を具体化し、出典の方法・対象年・本文を照合してレポートを評価する。";
lessons[2].description =
  "3テーマの架空資料を使い、計画の改善、7種類の出典判断、レポートの5つの問題を検証します。";
lessons[3].title = "Notebook：調査資料を学習教材に変える";
lessons[3].goal =
  "資料の参照範囲を管理し、引用を原文で確かめ、学習ガイド・解説台本・マップへ再利用する。";
lessons[3].description =
  "第3章の検証資料を引き継ぐか、単独で資料を選び、引用の照合と学習への変換を体験します。";
for (const i of [2, 3]) {
  lessons[i].references =
    i === 2 ? studyReferences.slice(0, 1) : studyReferences.slice(1);
  lessons[i].conditions =
    "公式ヘルプ本文を本実装時に確認。年齢・地域・プラン・端末・段階提供と実アカウントでの利用可否は自分の画面でも確認してください。実操作は未確認で、模擬演習にはログイン・契約は不要です。";
  lessons[i].cautions = [
    "表示名は第3・4章の統合実装依頼（Issue #8）に基づきます。模擬画面は実製品の画面再現ではありません。",
    "教材用の架空資料を実世界の統計や論文として引用しないでください。",
  ];
  lessons[i].checkedAt =
    "Issue #8実装時：公式本文を確認。名称・関係と教材の簡略化、確認日・未検証事項は仕様書に記録";
}
