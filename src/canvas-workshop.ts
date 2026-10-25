export interface TimerSettings {
  seconds: 10 | 20;
  look: "plain" | "large";
  finish: "stop" | "loop";
}
export const defaultTimer: TimerSettings = {
  seconds: 10,
  look: "plain",
  finish: "stop",
};
export const sanitizeTimer = (raw: unknown): TimerSettings => {
  const r =
    raw && typeof raw === "object" ? (raw as Partial<TimerSettings>) : {};
  return {
    seconds: r.seconds === 20 ? 20 : 10,
    look: r.look === "large" ? "large" : "plain",
    finish: r.finish === "loop" ? "loop" : "stop",
  };
};
export const timerIdentity = (s: TimerSettings) =>
  `${s.seconds}:${s.look}:${s.finish}`;
export type TimerPrompt = "create" | "repair" | "verify";
export const timerCopyId = (kind: TimerPrompt, s: TimerSettings) =>
  `timer-${kind}-v1:${timerIdentity(s)}`;
export const timerCopyIds = ([10, 20] as const).flatMap((seconds) =>
  (["plain", "large"] as const).flatMap((look) =>
    (["stop", "loop"] as const).flatMap((finish) =>
      (["create", "repair", "verify"] as const).map((kind) =>
        timerCopyId(kind, { seconds, look, finish }),
      ),
    ),
  ),
);
export const timerEvents = [
  "apply",
  "start",
  "pause",
  "zero",
  "reset",
  "compare",
];
export function timerPrompt(kind: TimerPrompt, s: TimerSettings) {
  const spec = `時間：${s.seconds}秒。見た目：${s.look === "large" ? "数字を大きく、操作名も明確に" : "標準の読みやすい数字"}。\n動作：開始・一時停止・リセット。0秒になったら${s.finish === "stop" ? "0秒で停止する" : "設定秒数に戻り、繰り返す"}。開始の連打で速く進まない。リセットは設定秒数に戻して停止する。`;
  const safety =
    "外部通信、ログイン、個人情報入力、通知・音声APIは不要。共有や公開を自動実行しないでください。";
  if (kind === "create")
    return `【任意の実Gemini Canvas用・タイマー作成指示】\n集中タイマーのWebアプリを作ってください。\n${spec}\n${safety}`;
  if (kind === "repair")
    return `【任意の実Gemini Canvas用・タイマー修正指示】\n現在のアプリを操作し、表示・0秒での動作をまず報告してください。観察していない不具合は断定しないでください。\n期待する変更：${spec}\n維持する機能：開始・一時停止・リセット、同時に1つだけ進むカウント。見た目の変更だけで動作も直ったと扱わず、変更箇所を説明してください。\n${safety}`;
  return `【任意の実Gemini Canvas用・タイマー確認手順】\n期待する仕様：${spec}\n1. 開始前の秒数と数字の見やすさを確認する。\n2. 開始して減ること、一時停止して待っても減らないことを確認する。\n3. 再開し、0秒での停止/繰り返しを観察する。\n4. 開始を連打しても二重に進まないか、リセットで設定秒数に戻り停止するか確認する。\n5. 修正前後を同じ条件で試す。共有する場合は公開範囲と含む情報を自分で確認する。\n${safety}`;
}
export interface TimerRun {
  remaining: number;
  running: boolean;
  laps: number;
}
export const freshTimerRun = (s: TimerSettings): TimerRun => ({
  remaining: s.seconds,
  running: false,
  laps: 0,
});
export function tickTimer(run: TimerRun, s: TimerSettings): TimerRun {
  if (!run.running) return run;
  if (run.remaining > 1) return { ...run, remaining: run.remaining - 1 };
  return {
    remaining: s.finish === "loop" ? s.seconds : 0,
    running: s.finish === "loop",
    laps: run.laps + 1,
  };
}
export const canvasJudgments = [
  {
    id: "brief-v1",
    step: 0,
    label: "依頼の判断",
    question:
      "友人用の復習アプリが1問だけ表示され、答えた後も結果が出ません。次の依頼は？",
    options: [
      "文字を大きくし、問題数と結果表示はアプリに任せる",
      "3問・各3択にし、採点時の点数表示とやり直しを指定する",
      "3問に増やし、点数は表示せず見た目だけ整える",
    ],
    answer: 1,
    reason:
      "目的は復習できることです。問題数だけでなく、回答後に何を表示するかと繰り返す方法を指定します。文字の大きさだけでは動作は定まりません。",
  },
  {
    id: "preserve-v1",
    step: 2,
    label: "修正の判断",
    question:
      "あるクイズのボタンを直したら、3択が2択になり正答も変わりました。再依頼に何を含めますか？",
    options: [
      "変わった選択肢と正答を報告し、元の3問・3択・正答・採点を維持してボタンを修正する",
      "ボタンの修正を取り消し、選択肢と正答の変更は新しい仕様として残す",
      "ボタンの色を再指定し、設問や採点は生成し直す",
    ],
    answer: 0,
    reason:
      "観察事実は選択肢と正答が変わったこと。期待はボタンの修正、維持するのは問題構成・正答・採点です。直したい範囲と維持する範囲を分け、修正後も同じ正答で採点できるか試します。",
  },
  {
    id: "evidence-v1",
    step: 3,
    label: "再検証の判断",
    question:
      "『修正済み』と表示され、未回答の案内も出ました。これだけで完成にしますか？",
    options: [
      "案内を確認したので完成とし、全問回答とやり直しは以前の記録で済ませる",
      "全問正解の3点だけ確認し、未回答・連続操作・やり直しは試さない",
      "未回答で採点を止めるほか、全回答の点数・連打・やり直しも同じ版で操作する",
    ],
    answer: 2,
    reason:
      "一つの表示は全動作の証拠ではありません。変更した条件と、維持する採点・やり直しの両方を現在の版で再検証します。過去の履歴やAIの宣言では代用できません。",
  },
] as const;

export const canvasTrialOptions = [
  "採点せず、未回答の案内が出る",
  "未回答を不正解として点数が出る",
] as const;
