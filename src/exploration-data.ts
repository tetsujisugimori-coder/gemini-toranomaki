export interface Feature {
  id: string;
  name: string;
  area: "side" | "input" | "tools";
  description: string;
  scene: string;
  task: string;
  chapter: number;
  conditions: string;
}
const common =
  "表示されても利用できるとは限りません。無料枠・有料プラン・回数制限・地域・年齢・端末・管理者設定による差や提供変更があります。料金と残り回数は自分の画面と公式ヘルプで確認してください。";
export const features: Feature[] = [
  {
    id: "new",
    name: "新しいチャット",
    area: "side",
    description: "別の話題を新しい会話として始める入口です。",
    scene: "旅行の相談から数学の質問へ切り替えたいとき。",
    task: "実際のGeminiで入口を探し、架空の話題で新しい会話を始めてみよう。",
    chapter: 1,
    conditions: common,
  },
  {
    id: "history",
    name: "チャット履歴",
    area: "side",
    description: "過去の会話を探して続きを相談する入口です。",
    scene: "昨日相談した内容を読み返したいとき。",
    task: "履歴の入口を探そう。履歴がなければ、その状態を確認するだけでOK。",
    chapter: 1,
    conditions: "保存設定やアカウントによって履歴の扱いが異なります。" + common,
  },
  {
    id: "library",
    name: "ライブラリ",
    area: "side",
    description:
      "作成したものなどを探すための入口として画面に表示される例です。保存される対象は実画面で確認します。",
    scene: "以前作ったものを再び見たいとき。",
    task: "自分の画面に同じ入口があるか探し、何が表示されるか確認しよう。なければ未提供でOK。",
    chapter: 1,
    conditions: common,
  },
  {
    id: "images",
    name: "画像",
    area: "side",
    description: "画像の作成・編集などに進む入口です。",
    scene: "説明用のイラストを作りたいとき。",
    task: "画像の入口と利用条件を探そう。生成はせず、案内を読むだけでもOK。",
    chapter: 7,
    conditions: "画像の生成・編集の可否と利用枠は別途確認が必要です。" + common,
  },
  {
    id: "notebook",
    name: "ノートブック",
    area: "side",
    description:
      "資料をまとめて扱う入口の画面例です。NotebookLMと同一の製品・操作とは限りません。",
    scene: "複数の資料をもとに学習を進めたいとき。",
    task: "入口の説明を読んで、資料をどこへ追加するのか確認しよう。機密資料は追加しません。",
    chapter: 4,
    conditions: common,
  },
  {
    id: "schedule",
    name: "スケジュール",
    area: "side",
    description:
      "指定した日時のタスクなどを扱う入口の例です。カレンダー連携とは区別します。",
    scene: "定期的に繰り返したい作業があるとき。",
    task: "入口があれば実行条件と停止方法を読もう。今回は実際の予約を作らなくてOK。",
    chapter: 1,
    conditions: "対応プランや自動実行の条件は未確認です。" + common,
  },
  {
    id: "custom",
    name: "カスタマイズ",
    area: "side",
    description:
      "用途に合わせた指示や設定を探す入口です。Gemsなどの案内を確認します。",
    scene: "学習の相談で毎回同じ指示を使いたいとき。",
    task: "設定の入口で保存される内容を確認しよう。個人情報は入力しません。",
    chapter: 9,
    conditions: common,
  },
  {
    id: "prompt",
    name: "入力欄",
    area: "input",
    description: "質問や依頼を文章で伝える場所です。",
    scene: "短い質問、学習相談、文章作成を始めたいとき。",
    task: "「分数を身近な例で説明して」と入力してみよう。送信前に個人情報がないか確認。",
    chapter: 1,
    conditions: common,
  },
  {
    id: "attach",
    name: "ファイル添付",
    area: "input",
    description: "PDFや写真などを質問に添える入口です。",
    scene: "資料の要約や写真について質問したいとき。",
    task: "添付メニューで対応形式を確認しよう。公開してよい練習資料だけを使います。",
    chapter: 4,
    conditions:
      "ファイル形式・容量・個数に制限があります。添付できても正しく読み取れるとは限りません。" +
      common,
  },
  {
    id: "model",
    name: "モデル選択",
    area: "input",
    description:
      "回答を作るモデルや自動選択モードを選ぶ入口です。思考にかける度合いとは別の選択です。",
    scene: "自分に提供されている選択肢を調べたいとき。",
    task: "実画面で現在の選択と鍵・利用枠の説明を読もう。購入や変更は不要です。",
    chapter: 1,
    conditions:
      "画面例：自動モード（Gemini 3モデル）、3.1 Pro（鍵表示）、4 Argon（鍵表示）。ユーザーが2026年10月22日に確認した例で、公式の現行仕様を検証したものではありません。鍵だけで契約条件を断定しません。" +
      common,
  },
  {
    id: "thinking",
    name: "思考レベル選択",
    area: "input",
    description:
      "自動モードで思考にかける度合いを選ぶ画面例です。モデルそのものの選択とは異なります。",
    scene: "速さを重視するか、じっくり検討してほしいかを考えるとき。",
    task: "簡単な言い換えと複雑な計画で、どのレベルを選びたいか理由を考えよう。",
    chapter: 1,
    conditions:
      "2026年10月22日のユーザー確認例：低「時間をかけず効率的に」、標準「バランスを取って詳しく」、高「徹底的に詳しく」。高でも必ず正解するわけではなく、回答が必ず長くなるわけでもありません。表示・条件は変化します。" +
      common,
  },
  {
    id: "tools",
    name: "その他のツール",
    area: "tools",
    description:
      "Deep Research・Canvas・学習支援・音楽生成などの入口を探します。全員に同じツールが表示されるとは限りません。",
    scene: "調査、成果物づくり、学習などに合う方法を探したいとき。",
    task: "実画面のツール名を1つ確認して、下のマップで用途を探そう。利用できなくても探索を続けられます。",
    chapter: 1,
    conditions: common,
  },
];
export interface Recommendation {
  feature: string;
  name: string;
  reason: string;
  first: string;
  chapter: number;
}
export interface Goal {
  id: string;
  title: string;
  recommendations: Recommendation[];
}
export const goals: Goal[] = [
  {
    id: "pdf",
    title: "PDFを要約したい",
    recommendations: [
      {
        feature: "attach",
        name: "ファイル添付",
        reason:
          "単独のPDFを会話に添えて要点を尋ねる入口です。引用元と原文を照合します。",
        first: "添付の対応形式を確認し、公開してよいPDFを選ぶ。",
        chapter: 4,
      },
      {
        feature: "notebook",
        name: "ノートブック・NotebookLMなど",
        reason:
          "複数資料をまとめて繰り返し参照したい場合の候補です。同じ機能とは限りません。",
        first: "資料をまとめる入口の説明と出典表示の方法を確認する。",
        chapter: 4,
      },
    ],
  },
  {
    id: "photo",
    title: "写真について質問したい",
    recommendations: [
      {
        feature: "attach",
        name: "写真の添付",
        reason:
          "静止画の気になる箇所を指定して質問できます。写った人や場所の特定は任せません。",
        first: "個人情報のない写真の対応形式を確認する。",
        chapter: 4,
      },
      {
        feature: "tools",
        name: "Gemini Live",
        reason:
          "その場で会話しながら見せたいときの候補です。カメラ対応・権限の確認が必要です。",
        first:
          "対応端末でLiveとカメラの案内を読む。許可は今すぐ必要ありません。",
        chapter: 5,
      },
    ],
  },
  {
    id: "illustration",
    title: "イラストを作りたい",
    recommendations: [
      {
        feature: "images",
        name: "画像生成・編集",
        reason:
          "文章で構図や雰囲気を指定します。既存画像を変えたい場合は編集が候補です。",
        first: "画像の入口で利用条件を確認し、題材・構図・用途を考える。",
        chapter: 7,
      },
    ],
  },
  {
    id: "music",
    title: "音楽を作りたい",
    recommendations: [
      {
        feature: "tools",
        name: "音楽生成のツール（提供されている場合）",
        reason:
          "音を生成できる機能が自分の画面にある場合の候補です。文章で歌詞を考えることとは区別します。",
        first: "ツール一覧に音楽生成があるか、利用条件と権利の案内を確認する。",
        chapter: 8,
      },
      {
        feature: "prompt",
        name: "入力欄で歌詞・構成を相談",
        reason:
          "音楽生成がなくてもアイデアづくりの相談はできます。音声ファイルの生成を保証するものではありません。",
        first: "架空のテーマで短い歌詞の構成を頼む。",
        chapter: 8,
      },
    ],
  },
  {
    id: "research",
    title: "複雑なテーマを調査したい",
    recommendations: [
      {
        feature: "tools",
        name: "Deep Research",
        reason:
          "調査計画と複数の情報源を検討したい場合の候補です。出典の本文確認が必要です。",
        first: "ツール一覧で入口と利用枠を確認し、調査の目的を一文にする。",
        chapter: 3,
      },
    ],
  },
  {
    id: "math",
    title: "数学を学びたい",
    recommendations: [
      {
        feature: "prompt",
        name: "入力欄・学習支援",
        reason:
          "答えだけでなくヒントや途中式を求めます。学習支援が表示されれば併用できます。",
        first:
          "「分数の足し算を、答えをすぐ出さずヒントで教えて」と頼む。計算は自分でも確かめる。",
        chapter: 1,
      },
      {
        feature: "thinking",
        name: "思考レベルの調整",
        reason:
          "複雑な問題では検討の度合いを選ぶ候補です。高を選んでも正しさは保証されません。",
        first: "自動モードにレベルがあるか確認する。式・条件・途中式も見直す。",
        chapter: 1,
      },
    ],
  },
  {
    id: "app",
    title: "簡単なアプリを作りたい",
    recommendations: [
      {
        feature: "tools",
        name: "Canvas",
        reason: "コードや成果物を作り、修正しながら確認する方法の候補です。",
        first: "ツール一覧でCanvasの入口を探し、作りたいものを一文で決める。",
        chapter: 6,
      },
    ],
  },
  {
    id: "google",
    title: "GmailやGoogleサービスを活用したい",
    recommendations: [
      {
        feature: "tools",
        name: "Googleサービス連携",
        reason:
          "メールや予定を扱うには、対応サービス・アカウント・アクセス許可の確認が必要です。",
        first:
          "連携設定で対応サービスと許可範囲を読む。この章では接続しません。",
        chapter: 2,
      },
    ],
  },
];
