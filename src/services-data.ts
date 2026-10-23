// All people, messages, locations and events below are fictional teaching data.
export const eventFields = [
  {
    id: "title",
    label: "イベント名",
    options: ["まちの学び交流会", "週末のお知らせ"],
    answer: 0,
    reason:
      "同じ件名と本文のイベント名を照合します。無関係なお知らせとは別です。",
  },
  {
    id: "date",
    label: "開催日",
    options: ["2026-10-30", "2026-10-31", "2026-10-22"],
    answer: 1,
    reason:
      "10月22日送信の訂正で、開催日は10月31日に変更されています。送信日と開催日は別です。",
  },
  {
    id: "time",
    label: "開始・終了時刻",
    options: ["14:00–15:00", "15:00–16:30", "午後（終了未定）"],
    answer: 1,
    reason:
      "訂正本文に15:00開始、16:30終了と明記されています。曖昧な時刻を補ってはいけません。",
  },
  {
    id: "zone",
    label: "タイムゾーン",
    options: ["UTC", "Asia/Tokyo（日本標準時・UTC+09:00）"],
    answer: 1,
    reason:
      "本文の日本標準時（UTC+09:00）を使います。端末の表示やUTCの時刻と混同しません。",
  },
  {
    id: "place",
    label: "開催場所",
    options: ["架空ひろば A室", "架空ひろば B室"],
    answer: 1,
    reason: "訂正は日時だけでなく会場もB室に変更しています。",
  },
  {
    id: "changed",
    label: "日時の変更有無",
    options: ["変更なし", "日時と場所が変更された"],
    answer: 1,
    reason:
      "同じ主催者による明示的な訂正です。単に新しいメールだからではなく、対象と変更内容が一致するため優先します。",
  },
  {
    id: "confirmed",
    label: "情報が確定しているか",
    options: ["本文上は確定（重複は別途確認）", "終了時刻が不明"],
    answer: 0,
    reason:
      "訂正本文は確定と明記しています。ただし、このメールだけでカレンダーの重複や登録成功は確認できません。",
  },
] as const;
export type FieldId = (typeof eventFields)[number]["id"];
export const mails = [
  {
    id: "original",
    subject: "まちの学び交流会のご案内",
    sent: "2026-10-18 09:00 JST",
    from: "架空の学び係 <learning@example.invalid>",
    body: "まちの学び交流会を開催します。開催日：2026年10月30日。開始14:00、終了15:00。タイムゾーン：日本標準時（Asia/Tokyo、UTC+09:00）。場所：架空ひろば A室。日時は確定です。変更がある場合はこの件名で訂正を送ります。",
    kind: "初回案内",
  },
  {
    id: "correction",
    subject: "【訂正・確定】まちの学び交流会の日時と場所",
    sent: "2026-10-22 10:00 JST",
    from: "架空の学び係 <learning@example.invalid>",
    body: "10月18日送信の「まちの学び交流会のご案内」を訂正します。開催日：2026年10月31日。開始15:00、終了16:30。タイムゾーン：日本標準時（Asia/Tokyo、UTC+09:00）。場所：架空ひろば B室。変更後の日時と場所は確定です。以前の10月30日14:00〜15:00・A室の案内に代えて、この内容を採用してください。",
    kind: "訂正案内",
  },
  {
    id: "unrelated",
    subject: "週末のお知らせ",
    sent: "2026-10-23 08:00 JST",
    from: "架空のお知らせ係 <news@example.invalid>",
    body: "架空ひろばの図書コーナーに新しい本が入りました。まちの学び交流会の開催案内や訂正ではありません。",
    kind: "無関係なメール",
  },
] as const;
export const canonicalEvent = {
  title: "まちの学び交流会",
  date: "2026-10-31",
  time: "15:00–16:30",
  zone: "Asia/Tokyo（日本標準時・UTC+09:00）",
  place: "架空ひろば B室",
};
export const reviewItems = [
  "イベント名が原文と一致",
  "開催日が原文と一致",
  "開始・終了時刻が原文と一致",
  "タイムゾーンが原文と一致",
  "開催場所が原文と一致",
  "訂正メールを反映",
  "対象カレンダーで重複なしを確認",
];
export const scenarios = [
  {
    id: "old",
    label: "訂正を見落としたAI回答",
    event: {
      ...canonicalEvent,
      date: "2026-10-30",
      time: "14:00–15:00",
      place: "架空ひろば A室",
    },
    reason:
      "AI回答は初回案内のまま。訂正の開催日・時刻・場所と一致しません。登録せず訂正原文を再確認します。",
    safe: false,
    duplicate: "模擬カレンダー：同名の予定なし",
  },
  {
    id: "correct",
    label: "訂正を反映したAI回答",
    event: canonicalEvent,
    reason:
      "原文と全項目が一致し、模擬カレンダーにも重複がありません。これは模擬判断だけで、実登録は行いません。",
    safe: true,
    duplicate: "模擬カレンダー：同名の予定なし",
  },
  {
    id: "ambiguous",
    label: "開催時刻が曖昧な別ケース",
    event: { ...canonicalEvent, time: "午後・終了未定" },
    reason:
      "この別ケースの原文にも具体的な開始・終了時刻がありません。15時などと推測せず、主催者へ確認します。",
    safe: false,
    duplicate: "模擬カレンダー：重複は未確認",
  },
  {
    id: "duplicate",
    label: "同じ予定が登録済みのケース",
    event: canonicalEvent,
    reason:
      "同名・同日時の予定が模擬カレンダーにあります。新規追加を止め、既存予定の内容と変更要否を確認します。",
    safe: false,
    duplicate:
      "模擬カレンダー：まちの学び交流会 / 2026-10-31 / 15:00–16:30 / B室 が登録済み",
  },
] as const;
export const troubles = [
  {
    question: "Gmailとの連携が利用できない。どうする？",
    options: [
      "利用できるまで有料プランを購入する",
      "アカウント・設定・管理者制限を調べ、模擬演習で続ける",
    ],
    answer: 1,
    reason:
      "アクティビティの保存、Gmailの他のGoogleサービスのスマート機能、組織管理者の設定などを確認します。購入や権限の拡大を急ぐ必要はありません。",
  },
  {
    question: "指定したメールが見つからない。どうする？",
    options: [
      "登録を止め、検索期間・送信者・件名・利用アカウントを見直す",
      "AIに日時を推測させる",
    ],
    answer: 0,
    reason:
      "未発見は予定が存在しない証明ではありません。Gmailでも原文を探し、取得できなければ登録しません。",
  },
  {
    question: "日時の変更メールを見落とした。どうする？",
    options: [
      "最初の案内をそのまま使う",
      "同じイベントの訂正を探し、変更箇所を照合する",
    ],
    answer: 1,
    reason:
      "出典・送信日時・訂正対象を照合します。最新というだけで無関係なメールを優先しません。",
  },
  {
    question: "開催時刻が「午後」としか書かれていない。どうする？",
    options: [
      "登録せず主催者に開始・終了時刻と時間帯を確認する",
      "14時開始と補う",
    ],
    answer: 0,
    reason:
      "自然な推測でも事実にはなりません。不明な項目は不明のまま止めます。",
  },
  {
    question: "同じ予定がカレンダーにある。どうする？",
    options: [
      "念のためもう一件追加する",
      "追加を止め、既存予定と訂正の内容を確認する",
    ],
    answer: 1,
    reason:
      "重複登録を避けます。既存予定の更新が必要なら、変更内容を確認してから別に依頼します。",
  },
  {
    question: "AIの回答とメール原文が一致しない。どうする？",
    options: [
      "原文を優先して相違点を調べ、解消するまで登録しない",
      "整ったAI回答の方を信用する",
    ],
    answer: 0,
    reason:
      "AIは古い情報や誤った情報を示すことがあります。出典を開き、日時・タイムゾーン・場所を人が照合します。",
  },
];
export const serviceReferences = [
  {
    title: "Google Workspace アプリを Gemini Apps に接続する",
    url: "https://support.google.com/gemini/answer/15229592?hl=ja",
  },
  {
    title: "Gemini Apps でカレンダーの予定を作成、管理する",
    url: "https://support.google.com/gemini/answer/15305236?co=GENIE.Platform%3DDesktop&hl=ja",
  },
  {
    title: "Gemini でアプリ連携を利用、管理する",
    url: "https://support.google.com/gemini/answer/13695044?co=GENIE.Platform%3DDesktop&hl=ja",
  },
  {
    title: "Gemini in Gmail を活用する（別機能）",
    url: "https://support.google.com/mail/answer/14355636?co=GENIE.Platform%3DDesktop&hl=ja",
  },
];
