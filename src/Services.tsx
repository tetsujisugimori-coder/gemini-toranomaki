import { useEffect, useRef, useState } from "react";
import { KnowledgeCheck } from "./Lab";
import {
  canonicalEvent,
  eventFields,
  mails,
  reviewItems,
  scenarios,
  troubles,
} from "./services-data";
import {
  buildFinalExecutionPrompt,
  buildRegistrationPrompt,
  buildSearchPrompt,
  defaultServiceSettings,
  type ServiceSettings,
} from "./services-prompts";
import {
  loadServices,
  saveServices,
  type ServicesProgress,
} from "./services-storage";

const steps = [
  "メールから予定を探す",
  "接続を理解する",
  "指示を組み立てる",
  "登録前後を確認する",
];
function EventCard({
  event,
  title,
}: {
  event: (typeof scenarios)[number]["event"];
  title: string;
}) {
  return (
    <div className="service-event">
      <h4>{title}</h4>
      <dl>
        {Object.entries(canonicalEvent).map(([id]) => (
          <div key={id}>
            <dt>{eventFields.find((f) => f.id === id)?.label}</dt>
            <dd>{event[id as keyof typeof canonicalEvent]}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
export function MockServices({
  completed,
  onComplete,
}: {
  completed: boolean;
  onComplete: (value: boolean) => void;
}) {
  const [initial] = useState(loadServices);
  const [record, setRecord] = useState(initial.progress);
  const latest = useRef(record);
  const [available, setAvailable] = useState(initial.available);
  const [message, setMessage] = useState("");
  const [settings, setSettings] = useState(defaultServiceSettings);
  const [checks, setChecks] = useState<string[]>([]);
  const [realChecks, setRealChecks] = useState<string[]>([]);
  const [decision, setDecision] = useState<"hold" | "proceed" | null>(null);
  const [approved, setApproved] = useState(false);
  const [copying, setCopying] = useState(false);
  const [finalReviewed, setFinalReviewed] = useState(false);
  const version = useRef(0);
  const mounted = useRef(false);
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const focusStep = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (focusStep.current) stepHeading.current?.focus();
  }, [record.step]);
  function update(patch: Partial<ServicesProgress>) {
    const next = { ...latest.current, ...patch };
    latest.current = next;
    setRecord(next);
    setAvailable(saveServices(next));
  }
  function go(step: number) {
    focusStep.current = true;
    update({ step });
    setMessage("");
  }
  function invalidateCopy() {
    version.current++;
    setCopying(false);
    setMessage("");
  }
  function configure(patch: Partial<ServiceSettings>) {
    invalidateCopy();
    setSettings((s) => ({ ...s, ...patch }));
    setRealChecks([]);
    setFinalReviewed(false);
  }
  function toggle(value: string, values: string[], set: (v: string[]) => void) {
    set(
      values.includes(value)
        ? values.filter((v) => v !== value)
        : [...values, value],
    );
  }
  const scenario =
    scenarios.find((s) => s.id === record.scenario) ?? scenarios[0];
  const selectedMail = mails.find((m) => m.id === record.mail) ?? mails[0];
  const extractionCorrect =
    eventFields.every((f) => record.extraction[f.id] === f.answer) &&
    record.adoption === 1;
  const registrationReady =
    settings.mode === "mock"
      ? approved
      : realChecks.length === reviewItems.length;
  const searchPrompt = buildSearchPrompt(settings);
  const registrationPrompt = buildRegistrationPrompt(settings.mode);
  const executionReady =
    settings.mode === "real" && registrationReady && finalReviewed;
  async function copy(stage: "search" | "registration" | "execution") {
    if (
      copying ||
      (stage === "registration" && !registrationReady) ||
      (stage === "execution" && !executionReady)
    )
      return;
    const copyVersion = version.current;
    const mode = settings.mode;
    setCopying(true);
    try {
      await navigator.clipboard.writeText(
        stage === "search"
          ? searchPrompt
          : stage === "execution"
            ? buildFinalExecutionPrompt()
            : registrationPrompt,
      );
      if (!mounted.current || copyVersion !== version.current) return;
      update({
        copied: [
          ...new Set([
            ...latest.current.copied,
            mode === "real" && stage === "registration"
              ? "real-preflight"
              : `${mode}-${stage}`,
          ]),
        ],
      });
      setMessage(
        `${mode === "mock" ? "模擬" : "任意の実アカウント"}演習の第${stage === "search" ? "1" : mode === "mock" ? "2" : stage === "registration" ? "2A（登録前確認）" : "2B（最終実行）"}段階を全文コピーしました。送信や登録はしていません。`,
      );
    } catch {
      if (mounted.current && copyVersion === version.current)
        setMessage(
          "コピーできませんでした。表示中の全文を選択して手動でコピーしてください。コピー成功の記録は追加しません。",
        );
    } finally {
      if (mounted.current && copyVersion === version.current) setCopying(false);
    }
  }
  function changeScenario(id: string) {
    update({ scenario: id });
    setChecks([]);
    setDecision(null);
    setApproved(false);
    setFinalReviewed(false);
    invalidateCopy();
  }
  return (
    <div className="services">
      <aside className="notice">
        <strong>教材内の模擬演習</strong>
        <p>
          メール・人物・予定はすべて架空です。Googleへの接続、メール取得、予定登録は行いません。実アカウント演習は任意。機密情報・個人情報をこの教材に入力しないでください。
        </p>
      </aside>
      <ol className="service-steps" aria-label="第2章の体験">
        {steps.map((s, i) => (
          <li key={s}>
            <button
              aria-current={record.step === i ? "step" : undefined}
              onClick={() => go(i)}
            >
              {i + 1}. {s}
            </button>
          </li>
        ))}
      </ol>
      <p className="small">
        現在位置：体験 {record.step + 1} / 4
        ・好きな体験へ戻れます。確認チェックと登録用指示の解放は安全のため再読み込みで解除します。
      </p>
      {!available && (
        <p role="status" className="notice">
          このブラウザに第2章の記録を保存できません。この画面内では続けられます。ページ移動や再読み込みで失われる場合があります。
        </p>
      )}
      <section aria-labelledby="service-step-heading">
        <h2 id="service-step-heading" ref={stepHeading} tabIndex={-1}>
          体験{record.step + 1}：{steps[record.step]}
        </h2>
        {record.step === 0 && (
          <>
            <KnowledgeCheck
              check={{
                question: "予想：AIが見つけた最初の案内だけで登録してよい？",
                options: [
                  "よい。整った回答なら正しい",
                  "訂正や原文を照合してから判断する",
                ],
                answer: 1,
                reason:
                  "AIは変更メールを見落とすことがあります。出典を開いて確認する人の判断が必要です。",
              }}
              value={record.prediction}
              onAnswer={(n) => update({ prediction: n })}
            />
            <h3>模擬Gmail受信箱</h3>
            <p>
              3通を開き、同じイベントの案内と訂正を探しましょう。送信日時は開催日時ではありません。
            </p>
            <div className="service-inbox">
              <div
                className="service-mail-list"
                role="group"
                aria-label="架空メールを選ぶ"
              >
                {mails.map((m) => (
                  <button
                    key={m.id}
                    aria-pressed={m.id === record.mail}
                    onClick={() => update({ mail: m.id })}
                  >
                    <strong>{m.subject}</strong>
                    <span>{m.sent}</span>
                  </button>
                ))}
              </div>
              <div
                className="service-mail"
                role="region"
                aria-label="選択した架空メール"
                aria-live="polite"
              >
                <span className="badge">架空メール</span>
                <h4>{selectedMail.subject}</h4>
                <p className="small">
                  送信者：{selectedMail.from}
                  <br />
                  送信日時：{selectedMail.sent}
                </p>
                <p>{selectedMail.body}</p>
              </div>
            </div>
            <details>
              <summary>初回案内と訂正を並べて比べる</summary>
              <div className="lab-compare service-content">
                {mails.slice(0, 2).map((m) => (
                  <div key={m.id}>
                    <h4>
                      {m.kind}（{m.sent}）
                    </h4>
                    <p>{m.body}</p>
                  </div>
                ))}
              </div>
            </details>
            <div className="panel">
              <KnowledgeCheck
                check={{
                  question: "どの情報を採用する？",
                  options: [
                    "10月18日の初回案内",
                    "10月22日の訂正案内",
                    "一番新しい10月23日のお知らせ",
                  ],
                  answer: 1,
                  reason:
                    "同じ主催者が同じイベントの日時と場所を明示的に訂正しています。10月23日は新しくても無関係です。",
                }}
                value={record.adoption}
                onAnswer={(n) => update({ adoption: n })}
              />
            </div>
            <h3>自分で予定カードを組み立てる</h3>
            <p>
              訂正本文を根拠に選んでください。選択すると判断理由が表示されます。
            </p>
            <div className="service-extraction">
              {eventFields.map((f) => (
                <div className="service-field" key={f.id}>
                  <label className="lab-field">
                    {f.label}
                    <select
                      value={record.extraction[f.id] ?? ""}
                      onChange={(e) =>
                        update({
                          extraction: {
                            ...record.extraction,
                            [f.id]: Number(e.target.value),
                          },
                        })
                      }
                    >
                      <option value="" disabled>
                        原文を読んで選ぶ
                      </option>
                      {f.options.map((o, i) => (
                        <option key={o} value={i}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </label>
                  {record.extraction[f.id] !== undefined && (
                    <p role="status">
                      {record.extraction[f.id] === f.answer
                        ? "一致しています。"
                        : "原文を見直しましょう。"}{" "}
                      {f.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <div className="notice" aria-label="抽出した予定カード">
              <h3>あなたが抽出した情報</h3>
              <dl className="service-extracted">
                {eventFields.map((f) => (
                  <div key={f.id}>
                    <dt>{f.label}</dt>
                    <dd>{f.options[record.extraction[f.id]] ?? "未選択"}</dd>
                  </div>
                ))}
              </dl>
              <p role="status">
                {extractionCorrect
                  ? "全項目が訂正本文と一致しました。次は接続と確認の意味を学びましょう。"
                  : "原文と比べて、一つずつ埋めていきましょう。"}
              </p>
            </div>
          </>
        )}
        {record.step === 1 && (
          <>
            <p>
              この教材の本線は{" "}
              <strong>
                gemini.google.com のGeminiアプリ → Google Workspaceアプリ連携 →
                Gmail / Googleカレンダー
              </strong>
              です。接続せず模擬演習だけで学べます。
            </p>
            <details open>
              <summary>利用アカウントと接続状態を確認する</summary>
              <div className="service-content">
                <ol>
                  <li>
                    GeminiアプリとGmail・Googleカレンダーで同じGoogleアカウントを使っているか、プロフィールから確認します。
                  </li>
                  <li>
                    パソコン版の公式ヘルプでは「カスタマイズ」→「コネクタ」から「アプリ連携」を確認する導線が案内されています。「カスタマイズ」がなければ「その他」を探します。
                  </li>
                  <li>
                    Google
                    Workspaceの詳細で接続状態、対応・未対応の操作、表示された許可内容を読みます。画面名や位置は変わるため、下の公式ヘルプと自分の画面を照合します。
                  </li>
                </ol>
              </div>
            </details>
            <details>
              <summary>アクセス許可と必要な設定の意味</summary>
              <p>
                接続は、Geminiがサービス内の情報を検索し、対応する作成・変更操作を行えるようにする許可です。接続しただけで全情報が正しく読めるわけでも、すべての操作に同意したことになるわけでもありません。必要な範囲だけを使い、内容を確認してから個別に指示します。
              </p>
              <p>
                公式ヘルプではGoogle
                Workspace連携に「アクティビティの保存」がオンであること、Gmailの「他のGoogleサービスのスマート機能」が必要とされています。設定のデータ利用の説明を読み、納得できなければ変更せず模擬演習で続けてください。
              </p>
            </details>
            <details>
              <summary>個人アカウントと仕事・学校アカウントの違い</summary>
              <p>
                仕事・学校では管理者がアプリ連携を有効にする必要があります。個人向けヘルプの設定がそのまま適用されるとは限りません。管理者と所属組織の方針を確認し、仕事のメールを個人アカウントへ移さないでください。端末・国・言語・プランなどでも表示や対応範囲が異なります。自分の「アプリ連携」の詳細とアカウント種別に合う公式案内で確認します。
              </p>
            </details>
            <details>
              <summary>利用できないとき・連携を解除したいとき</summary>
              <p>
                アカウントの不一致、アクティビティの保存、Gmailのスマート機能、管理者制限、端末・地域などの対応状況を順に調べます。Gmailなどのサービス名を検索指示に含めることも必要です。設定変更後はGeminiを再読み込みします。利用できなくてもこの章を学べます。
              </p>
              <p>
                連携の解除はGeminiの「カスタマイズ」→「コネクタ」→対象アプリの「その他」→「接続を解除」から、表示中の案内に沿って行います。公式ヘルプには「接続済みのアプリ」という呼び方もあります。解除を、作成済みの予定や過去の会話の削除と混同しないでください。それぞれのサービスや履歴で確認します。
              </p>
            </details>
            <details>
              <summary>補足：Gmail内のGeminiは別の入口</summary>
              <p>
                Gmail右上の「Geminiに相談」から使うサイドパネルは、Geminiアプリのアプリ連携とは別機能です。公式ヘルプでは対象のGoogle
                Workspace / Google AIプランやWorkspace
                Experiments、対応言語などが案内されています。両者の利用条件を同一と考えず、自分のGmailの表示と公式の提供条件を確認してください。
              </p>
            </details>
            <div className="notice">
              <h3>「できる」と「確認できた」を分ける</h3>
              <p>
                2026-10-23に確認したカレンダー公式ヘルプでは、予備・共有カレンダーへの作成・管理も案内され、指定しなければデフォルトのカレンダーが使われます。対象を明示して確認しましょう。招待者追加など、この教材で確認していない操作は対応を保証しません。変更による通知など一部の操作は取り消せない場合があります。
              </p>
              <p>
                接続済みでもAIは古いメールや誤った内容を示すことがあります。回答の出典を開き、操作前後に確認します。
              </p>
            </div>
          </>
        )}
        {record.step === 2 && (
          <>
            <p>
              まず検索・整理だけを頼みます。原文と比較する前に登録用指示へ進めない構成です。入力内容・実メール本文・AI回答をこの教材に保存する欄はありません。
            </p>
            <fieldset>
              <legend>演習の種類</legend>
              {(
                [
                  ["mock", "模擬演習（架空メールを指示文に含める）"],
                  ["real", "任意の実アカウント演習（自分の非機密メール）"],
                ] as const
              ).map(([mode, label]) => (
                <label className="option" key={mode}>
                  <input
                    type="radio"
                    name="service-mode"
                    checked={settings.mode === mode}
                    onChange={() => configure({ mode })}
                  />
                  {label}
                </label>
              ))}
            </fieldset>
            <p className="notice">
              {settings.mode === "mock"
                ? "模擬：実際のGmailには検索しません。第2段階も実登録禁止の練習です。"
                : "任意の実操作：このサイトは接続・送信しません。Gemini側でアカウントと権限を確認し、機密情報や個人情報を使わずに行ってください。実施しなくても章を完了できます。"}
            </p>
            {settings.mode === "real" && (
              <div className="notice">
                <p>
                  任意の実アカウント演習だけの外部操作です。模擬演習には不要です。ログイン・実連携の成功を教材は保証しません。利用アカウントと権限をGemini側で確認してください。
                </p>
                <a
                  className="primary"
                  href="https://gemini.google.com/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Geminiを開く ↗（別タブ）
                </a>
              </div>
            )}
            <div className="lab-compare">
              <label className="lab-field">
                検索対象
                <select
                  value={settings.target}
                  onChange={(e) =>
                    configure({
                      target: e.target.value as ServiceSettings["target"],
                    })
                  }
                >
                  <option value="subject">イベントの件名と訂正</option>
                  <option value="sender">主催者からの案内と訂正</option>
                </select>
              </label>
              <label className="lab-field">
                検索期間（メール送信日）
                <select
                  value={settings.period}
                  onChange={(e) =>
                    configure({
                      period: e.target.value as ServiceSettings["period"],
                    })
                  }
                >
                  <option value="month">
                    {settings.mode === "mock"
                      ? "2026年10月1日〜23日"
                      : "過去30日間"}
                  </option>
                  <option value="recent">
                    {settings.mode === "mock"
                      ? "2026年10月20日〜23日"
                      : "過去7日間"}
                  </option>
                </select>
              </label>
            </div>
            <fieldset>
              <legend>確認したい項目（基本の予定情報は常に含みます）</legend>
              <label className="option">
                <input
                  type="checkbox"
                  checked={settings.sources}
                  onChange={(e) => configure({ sources: e.target.checked })}
                />
                項目ごとの出典・送信日時・根拠の本文
              </label>
              <label className="option">
                <input
                  type="checkbox"
                  checked={settings.uncertainty}
                  onChange={(e) => configure({ uncertainty: e.target.checked })}
                />
                変更点と未確認事項を別に表示
              </label>
            </fieldset>
            <h3>第1段階：探す・整理する</h3>
            <pre
              className="service-prompt"
              tabIndex={0}
              aria-label="検索指示の全文"
            >
              {searchPrompt}
            </pre>
            <button
              className="primary"
              disabled={copying}
              onClick={() => void copy("search")}
            >
              検索指示を全文コピー
            </button>
            <h3>
              {settings.mode === "mock"
                ? "第2段階：実登録禁止の練習"
                : "第2段階A：登録前の全項目提示を依頼する"}
            </h3>
            {settings.mode === "mock" ? (
              <p>
                {approved
                  ? "今回の模擬確認を終えました。実登録禁止の練習指示を使えます。"
                  : "体験4で、正しい予定と模擬カレンダーを全項目照合し、「確認済みの模擬内容で次へ」を選ぶと表示します。過去の完了記録だけでは解放しません。"}{" "}
                <button onClick={() => go(3)}>比較と確認へ</button>
              </p>
            ) : (
              <fieldset>
                <legend>
                  任意演習：実際の出典と対象カレンダーを自分で確認した項目
                </legend>
                <p>
                  このチェックは自己申告です。教材は正しさを検証できません。未発見・不明点があればチェックせず登録を止めてください。
                </p>
                {reviewItems.map((item) => (
                  <label key={item} className="option">
                    <input
                      type="checkbox"
                      checked={realChecks.includes(item)}
                      onChange={() => {
                        invalidateCopy();
                        setFinalReviewed(false);
                        toggle(item, realChecks, setRealChecks);
                      }}
                    />
                    {item}
                  </label>
                ))}
              </fieldset>
            )}
            {registrationReady ? (
              <>
                <pre
                  className="service-prompt"
                  tabIndex={0}
                  aria-label={
                    settings.mode === "mock"
                      ? "登録依頼の全文"
                      : "登録前確認の全文"
                  }
                >
                  {registrationPrompt}
                </pre>
                <button
                  className="primary"
                  disabled={copying}
                  onClick={() => void copy("registration")}
                >
                  {settings.mode === "mock"
                    ? "登録依頼を全文コピー"
                    : "登録前確認を全文コピー"}
                </button>
              </>
            ) : (
              <p role="status">
                登録用の指示は確認待ちです。登録せず確認する判断を優先できます。
              </p>
            )}
            {settings.mode === "real" && registrationReady && (
              <>
                <h3>第2段階B：Gemini側で照合し、別メッセージで最終承認する</h3>
                <p>
                  第2段階AをGeminiへ送り、対象を1件に絞って全項目の提示を受けます。原文と自分が確認した情報を照合してください。複数候補・不明点・矛盾・重複が残るなら保留します。
                </p>
                <p>
                  下のチェックも自己申告です。教材は実データとの一致や承認成立を検証できません。チェックやコピーだけで登録は行いません。
                </p>
                <label className="option">
                  <input
                    type="checkbox"
                    checked={finalReviewed}
                    onChange={(e) => {
                      invalidateCopy();
                      setFinalReviewed(e.target.checked);
                    }}
                  />
                  Geminiが提示した1件の全項目と、原文で確認した情報が一致した（自己申告）
                </label>
                {executionReady ? (
                  <>
                    <p>
                      次のひな形の【記入欄】はGemini側だけで埋めてください。この教材へ実メール・個人情報・Geminiの回答を入力しないでください。全項目が一致して承認できるときだけ、提示を受けた後の別メッセージとして送ります。未記入のままでは実行を依頼しません。対象や内容が変わったら再提示と新たな承認が必要です。
                    </p>
                    <pre
                      className="service-prompt"
                      tabIndex={0}
                      aria-label="最終実行指示の全文"
                    >
                      {buildFinalExecutionPrompt()}
                    </pre>
                    <button
                      className="primary"
                      disabled={copying}
                      onClick={() => void copy("execution")}
                    >
                      最終実行指示を全文コピー
                    </button>
                  </>
                ) : (
                  <p role="status">
                    Gemini側で1件の全項目提示を受けて照合するまで、最終実行指示は確認待ちです。
                  </p>
                )}
              </>
            )}
            <p className="small">
              コピー成功は送信・実行・予定作成の成功を意味しません。失敗時は表示中の全文を選択してコピーできます。
              保留・条件変更で古いコピーの記録と通知は無効になりますが、OSクリップボードへの書き込み自体は取り消せません。
            </p>
          </>
        )}
        {record.step === 3 && (
          <>
            <p>
              原文 → AIの抽出例 →
              登録候補を照合し、「進む」か「登録せず確認する」かを判断します。AIの例は教材の固定データです。
            </p>
            <label className="lab-field">
              比較するケース
              <select
                value={record.scenario}
                onChange={(e) => changeScenario(e.target.value)}
              >
                {scenarios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="service-source">
              <h3>メールの原文（架空）</h3>
              <p>
                {scenario.id === "ambiguous"
                  ? "別ケース：まちの学び交流会、2026年10月31日、午後から（終了未定）、日本標準時、架空ひろば B室。時刻は追って連絡します。"
                  : mails[1].body}
              </p>
              <p className="small">
                {scenario.id === "ambiguous"
                  ? "この別ケースでは終了時刻の確定メールはありません。"
                  : `出典：${mails[1].subject} / ${mails[1].sent}`}
              </p>
            </div>
            <div className="lab-compare">
              <EventCard
                event={scenario.event}
                title="AIが抽出した予定（固定例）"
              />
              <EventCard
                event={scenario.event}
                title="カレンダーへ登録する候補（未登録）"
              />
            </div>
            <p className="notice">{scenario.duplicate}</p>
            <fieldset>
              <legend>
                登録前の確認（単にチェックせず、上の3つを見比べる）
              </legend>
              {reviewItems.map((item) => (
                <label key={item} className="option">
                  <input
                    type="checkbox"
                    checked={checks.includes(item)}
                    onChange={() => {
                      toggle(item, checks, setChecks);
                      setApproved(false);
                      setDecision(null);
                      setFinalReviewed(false);
                      invalidateCopy();
                    }}
                  />
                  {item}
                </label>
              ))}
            </fieldset>
            <div className="lab-actions">
              <button
                onClick={() => {
                  invalidateCopy();
                  setDecision("hold");
                  setApproved(false);
                  setRealChecks([]);
                  setFinalReviewed(false);
                }}
              >
                登録せず確認する
              </button>
              <button
                onClick={() => {
                  setDecision("proceed");
                  const ok =
                    scenario.safe && checks.length === reviewItems.length;
                  setApproved(ok);
                  if (ok) update({ simulated: true });
                }}
              >
                確認済みの模擬内容で次へ
              </button>
            </div>
            {decision && (
              <div role="status" className="notice">
                {decision === "hold"
                  ? `保留しました。${scenario.safe ? "このケースの情報は一致していますが、確信がなければ原文を再確認して構いません。" : scenario.reason}`
                  : !scenario.safe
                    ? `まだ進めません。${scenario.reason}`
                    : checks.length !== reviewItems.length
                      ? "全項目を確認してから進みましょう。チェック数だけでは正しさの証明にはなりません。"
                      : scenario.reason}
              </div>
            )}
            {approved && (
              <button className="primary" onClick={() => go(2)}>
                確認後の指示文へ戻る
              </button>
            )}
            <details>
              <summary>
                任意の実操作：登録後にGoogleカレンダーを直接開く
              </summary>
              <div className="service-content">
                <ol>
                  <li>
                    Geminiの「作成した」という回答だけで成功と判断せず、Googleカレンダーを別タブで開きます。
                  </li>
                  <li>
                    利用アカウントと対象カレンダーが正しく、予定が実在することを確認します。
                  </li>
                  <li>
                    イベント名・日付・開始/終了時刻・タイムゾーン・場所・訂正の反映を確認します。
                  </li>
                  <li>
                    同じ予定が二重に入っていないか確認します。相違があれば追加登録を止め、既存予定を確認して修正します。
                  </li>
                </ol>
                <a
                  href="https://calendar.google.com/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Googleカレンダーを開く ↗（別タブ・任意）
                </a>
              </div>
            </details>
            <h3>理解チェック：困ったときの判断を試す</h3>
            <p>原因を考え、対応を選びます。何度でも回答し直せます。</p>
            {troubles.map((t, i) => (
              <details key={t.question}>
                <summary>
                  {i + 1}. {t.question}
                  {record.troubles[i] !== undefined
                    ? record.troubles[i] === t.answer
                      ? "（正答）"
                      : "（再確認）"
                    : ""}
                </summary>
                <div className="service-content">
                  <KnowledgeCheck
                    check={t}
                    value={record.troubles[i] ?? null}
                    onAnswer={(n) =>
                      update({ troubles: { ...record.troubles, [i]: n } })
                    }
                  />
                </div>
              </details>
            ))}
          </>
        )}
      </section>
      <div className="lab-actions">
        {record.step > 0 && (
          <button onClick={() => go(record.step - 1)}>← 前の体験</button>
        )}
        {record.step < 3 && (
          <button className="primary" onClick={() => go(record.step + 1)}>
            次の体験 →
          </button>
        )}
      </div>
      <p role="status" className="feedback">
        {message}
      </p>
      <section className="panel" aria-label="第2章の学習記録">
        <h2>第2章の学習記録</h2>
        <p>
          模擬確認：
          {record.simulated
            ? "完了した記録あり（実登録ではありません）"
            : "未完了"}
        </p>
        <p>
          コピー成功の記録（現在の条件での実行保証ではありません）：
          {record.copied.length
            ? record.copied
                .map(
                  (id) =>
                    ({
                      "mock-search": "模擬・検索",
                      "mock-registration": "模擬・登録禁止の練習",
                      "real-search": "任意・検索",
                      "real-registration": "任意・旧登録依頼（履歴）",
                      "real-preflight": "任意・登録前確認",
                      "real-execution": "任意・最終実行指示",
                    })[id],
                )
                .join("、")
            : "なし"}
        </p>
        <label className="option">
          <input
            type="checkbox"
            checked={record.tried}
            onChange={(e) => update({ tried: e.target.checked })}
          />
          任意：実際のGeminiで検索を試した（自己申告）
        </label>
        <label className="option">
          <input
            type="checkbox"
            checked={record.calendarChecked}
            onChange={(e) => update({ calendarChecked: e.target.checked })}
          />
          任意：実際のGoogleカレンダーを開き、予定の実在と内容を確認した（自己申告）
        </label>
        <p className="small">
          実際の操作や登録成功を教材は検証できません。自己申告はいつでも解除できます。
        </p>
        <label className="option">
          <input
            type="checkbox"
            checked={completed}
            onChange={(e) => onComplete(e.target.checked)}
          />
          第2章の学習を完了した（自己申告・実登録は不要）
        </label>
        <p className="small">
          模擬演習で「人が確認すべき内容」を理解したら記録してください。章完了は自動認定しません。章の進捗を初期化しても、模擬操作・コピー・自己申告の学習記録は維持します。
        </p>
      </section>
    </div>
  );
}
