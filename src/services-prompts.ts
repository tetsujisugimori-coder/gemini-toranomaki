import { canonicalEvent, mails, reviewItems } from "./services-data";
export interface ServiceSettings {
  mode: "mock" | "real";
  target: "subject" | "sender";
  period: "month" | "recent";
  sources: boolean;
  uncertainty: boolean;
}
export const defaultServiceSettings: ServiceSettings = {
  mode: "mock",
  target: "subject",
  period: "month",
  sources: true,
  uncertainty: true,
};
export function buildSearchPrompt(s: ServiceSettings): string {
  const mock = s.mode === "mock";
  return [
    mock
      ? "【模擬演習・すべて架空】実際のGmailやカレンダーにはアクセスせず、次の架空メールだけを読んでください。"
      : "【任意の実アカウント演習】Gmailで、自分に届いた非機密のイベント案内だけを探してください。機密情報や個人情報を追加で入力しません。",
    "第1段階：検索と整理だけ。予定の作成・変更・削除は行わないでください。",
    `検索対象：${mock ? (s.target === "subject" ? "件名に「まちの学び交流会」を含む案内と訂正" : "架空の学び係（learning@example.invalid）からの案内と訂正") : s.target === "subject" ? "自分が確認したいイベントの件名と訂正（対象が特定できなければ私に聞く）" : "自分が確認したい主催者からの案内と訂正（送信者が特定できなければ私に聞く）"}。`,
    `検索期間（メールの送信日）：${mock ? (s.period === "month" ? "2026年10月1日〜10月23日" : "2026年10月20日〜10月23日（初回案内が範囲外なら期間を広げる必要を知らせる）") : s.period === "month" ? "過去30日間" : "過去7日間"}。開催日とは区別してください。`,
    "イベント名、開催日、開始・終了時刻、タイムゾーン、場所、変更有無、確定・不明を整理してください。見つからない・曖昧・矛盾する場合は止まり、推測で補わないでください。",
    s.sources
      ? "確認項目：各項目の出典メールの件名・送信日時・根拠の本文を示してください。"
      : "確認項目：簡潔に整理し、原文を確認できる出典は必ず示してください。",
    s.uncertainty
      ? "確認項目：初回案内からの変更点と、未確認の項目も別に示してください。"
      : "不明点が残る場合は登録せず確認待ちにしてください。",
    `登録前に人が確認する事項：${reviewItems.join("、")}。確認後、別の明示的な指示を出すまで登録しないでください。`,
    mock
      ? mails
          .map(
            (m) =>
              `\n--- 架空メール：${m.id} ---\n送信者：${m.from}\n送信日時：${m.sent}\n件名：${m.subject}\n本文：${m.body}`,
          )
          .join("\n")
      : "実際のGmailの出典を自分で開いて照合します。未発見なら検索条件を見直し、登録へ進みません。",
  ].join("\n\n");
}
export function buildRegistrationPrompt(mode: "mock" | "real"): string {
  if (mode === "mock")
    return `【模擬演習・実登録禁止】第2段階：以下は架空メールと照合した予定カードです。実際のGoogleカレンダーには登録せず、登録前の確認内容だけを説明してください。\n${Object.values(canonicalEvent).join(" / ")}\n出典：10月22日送信の訂正。模擬カレンダーでは重複なし。実サービスの接続や登録成功を意味しません。`;
  return "【任意の実アカウント演習】第2段階：同じ会話で私が原文と照合し、確認済みと明示した予定だけをGoogleカレンダーに追加してください。イベント名・開催日・開始/終了時刻・タイムゾーン・場所・最新の訂正・対象カレンダー・重複なしがすべて確認できた場合に限ります。対象カレンダーが未指定なら先に聞いてください。曖昧、未確認、未発見、矛盾、重複があれば登録せず質問してください。招待者の追加や通知は依頼しません。作成内容とカレンダーへのリンクを示してください。私は登録後にGoogleカレンダーを直接開き、実在と内容を確認します。";
}
