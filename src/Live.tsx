import { useRef, useState } from "react";
import { KnowledgeCheck } from "./Lab";
import { StudySteps, useStudyCopy } from "./StudyShared";
import { LivePackage } from "./LivePackage";
import {
  conversations,
  followups,
  frames,
  livePrompt,
  liveReferences,
  packageTruth,
  practiceObjects,
  shareChoices,
  sharingCases,
  type ConversationId,
  type FrameId,
  type PracticeId,
} from "./live-data";
import {
  freshLive,
  loadLive,
  removeLive,
  saveLive,
  type LiveRecord,
} from "./live-storage";
function OfficialLive({ platform }: { platform: LiveRecord["platform"] }) {
  return (
    <div className="service-content">
      <p>
        2026-10-25に公式本文を確認。以下は実Geminiアプリの案内です。この教材をSafariなどで読むこととは別で、Web版GeminiではLiveを利用できないと案内されています。
      </p>
      <p>
        {platform === "ios"
          ? "iPhone / iPad：Geminiモバイルアプリを開き、下部のLiveアイコン、または左スワイプで開始します。初回はアプリの案内に従います。iOSの一般的な音声入力のマイクとLiveは別の入口です。iOSアプリの公式案内ではファミリーリンク管理アカウントは利用不可としています。"
          : "Android：Geminiモバイルアプリ（モバイルアシスタントとしてのGeminiを含む）を利用します。最新のGoogleアプリも必要と案内されています。下部のLiveアイコン、または左スワイプで開始します。"}
      </p>
      <ul>
        <li>
          一時停止：一時停止アイコンでマイクがオフ。Liveアイコンで再開。応答途中に話しかけて中断する機能は設定で変更できます。
        </li>
        <li>
          終了：終了アイコン、または右スワイプ。文字起こしを確認できます。過去のチャットを開きLiveアイコンから再開する案内があります。
        </li>
        <li>
          カメラ：会話中のカメラアイコンで共有・停止。一時停止でオフになり、会話再開時に自動でオンへ戻ると案内されています。アプリを離れる/画面ロックの後は自動で戻りません。
        </li>
        <li>
          画面共有：Live画面の共有アイコンから端末の案内に従います。公式では全画面共有と説明されています。停止はアプリ内の共有オフを確認。一時停止/ロックで共有は止まり、会話再開だけでは共有は再開しません。
        </li>
        {platform === "android" && (
          <li>
            Androidのミュートはマイクを止めても動画や画面共有を継続すると明記されています。ミュートだけで映像が止まったと判断しません。
          </li>
        )}
      </ul>
      <p>
        通知の有効化が画面共有の条件として案内されています。ボタン・OS表示は変化し、全員同じとは限りません。カメラ停止、画面共有停止、会話終了は別々に状態を確認してください。ここでは実際のボタン操作を検証していません。
      </p>
      <details>
        <summary>利用できない場合とデータの確認</summary>
        <p>
          Liveの案内はログイン、13歳（または地域の該当年齢）以上、対応モバイル端末/言語/地域/アカウントを条件とし、段階的提供を明記しています。仕事/学校はアクセス権や管理者設定も確認してください。特定の有料プラン購入をこの教材の条件にはしません。表示がない場合は端末・アプリ更新・アカウント・提供状況を公式ヘルプで確認し、模擬体験へ戻れます。
        </p>
        <p>
          実Liveの録音・文字起こし・共有内容はGoogleのデータ取扱説明の対象です。個人向けの説明ではアクティビティ保存オフでも最長72時間保存されると案内されています。文字起こし/アップロードと、音声/動画/画面共有のサービス改善への利用設定は区別されます。後者は既定で改善に使われないと説明されていますが、保存されない意味ではありません。仕事/学校では別の規約が適用される場合があります。自分の設定とアカウント向けの説明を確認してください。他者の顔・声は許可なく使わず、機密情報を共有しません。
        </p>
      </details>
      {liveReferences
        .filter((ref) => ref.platform === "all" || ref.platform === platform)
        .map((ref) => (
          <p key={ref.url}>
            <a href={ref.url} target="_blank" rel="noreferrer">
              {ref.title} ↗（別タブ）
            </a>
          </p>
        ))}
    </div>
  );
}
export function Live({
  completed,
  onComplete,
}: {
  completed: boolean;
  onComplete: (value: boolean) => boolean;
}) {
  const [boot] = useState(loadLive);
  const [r, setRecord] = useState(boot.record);
  const latest = useRef(r);
  const [available, setAvailable] = useState(boot.available);
  const [truth, setTruth] = useState(false);
  const [textOnly, setTextOnly] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState("");
  const heading = useRef<HTMLHeadingElement>(null),
    result = useRef<HTMLHeadingElement>(null),
    resetButton = useRef<HTMLButtonElement>(null);
  const copy = useStudyCopy();
  const c = conversations.find((c) => c.id === r.conversation)!;
  const frame = frames.find((f) => f.id === r.frame)!;
  const sharing = sharingCases.find((s) => s.id === r.sharing)!;
  const prompt = livePrompt(r.practice);
  function update(patch: Partial<LiveRecord>) {
    const next = { ...latest.current, ...patch };
    latest.current = next;
    setRecord(next);
    const ok = saveLive(next);
    setAvailable(ok);
    return ok;
  }
  function history(id: string) {
    return [...new Set([...latest.current.history, id])];
  }
  function go(step: number) {
    update({ step });
    requestAnimationFrame(() => heading.current?.focus());
  }
  function conversation(id: ConversationId, followup: number | null) {
    if (
      id !== latest.current.conversation ||
      followup !== latest.current.followup
    ) {
      update({
        conversation: id,
        followup,
        conversationAnswer: null,
        ...(followup !== null
          ? { history: history(`conversation:${id}:${followup}`) }
          : {}),
      });
    }
    requestAnimationFrame(() => result.current?.focus());
  }
  function changeFrame(id: FrameId) {
    if (id !== latest.current.frame) {
      setTruth(false);
      update({ frame: id, packageAnswer: null });
    }
    requestAnimationFrame(() => result.current?.focus());
  }
  function practice(id: PracticeId) {
    if (id !== latest.current.practice) copy.invalidate();
    update({ practice: id });
  }
  function reset() {
    copy.invalidate();
    const next = freshLive();
    latest.current = next;
    setRecord(next);
    setTruth(false);
    setTextOnly(false);
    const removed = removeLive();
    const completion = onComplete(false);
    setAvailable(removed);
    setResetting(false);
    setMessage(
      removed && completion
        ? "第5章の記録と章完了だけを初期化しました。"
        : "画面内の第5章を初期化しましたが、保存領域の更新に失敗しました。再読み込みで旧記録へ戻る可能性があります。",
    );
    requestAnimationFrame(() => resetButton.current?.focus());
  }
  return (
    <div className="live-chapter">
      <aside className="notice">
        <strong>教材用の模擬体験</strong>
        <p>
          固定の文字起こし例と静止した図を使います。音声を聞き取らず、マイク・カメラ・画面共有を起動しません。実際の声・画像・画面内容を取得/保存/送信しません。
        </p>
      </aside>
      <StudySteps
        labels={[
          "会話を調整する",
          "パッケージを見せる",
          "画面共有を考える",
          "任意の実アプリ演習",
        ]}
        step={r.step}
        onStep={go}
      />
      <section aria-labelledby="live-step">
        <h2 id="live-step" ref={heading} tabIndex={-1}>
          体験{r.step + 1}：
          {
            [
              "会話の途中で説明を変える",
              "架空の商品パッケージを見せる",
              "画面共有で何を見せるか考える",
              "任意の実アプリ演習",
            ][r.step]
          }
        </h2>
        {r.step === 0 && (
          <>
            <p>
              音声会話の文字起こしを想定した固定例です。追加する条件を選び、説明がどう変わるか見比べましょう。
            </p>
            <label className="lab-field">
              会話の題材
              <select
                value={r.conversation}
                onChange={(e) =>
                  conversation(
                    e.target.value as ConversationId,
                    e.target.value === latest.current.conversation
                      ? latest.current.followup
                      : null,
                  )
                }
              >
                {conversations.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>
            <p>
              <strong>最初の質問：</strong>
              {c.title}
            </p>
            <div
              className="study-source-buttons"
              role="group"
              aria-label="追加する発言"
            >
              {followups.map((f, i) => (
                <button
                  key={f}
                  aria-pressed={r.followup === i}
                  onClick={() => conversation(r.conversation, i)}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="lab-compare">
              <div className="study-source">
                <h3>変更前の回答例</h3>
                <p>{c.initial}</p>
              </div>
              <div className="study-source">
                <h3 ref={result} tabIndex={-1}>
                  追加発言後の回答例
                </h3>
                <p>
                  {r.followup === null
                    ? "追加する発言を選んでください。まだ説明を変えていません。"
                    : c.replies[r.followup][0]}
                </p>
                {r.followup !== null && (
                  <p role="status">
                    <strong>変更の理由：</strong>
                    {c.replies[r.followup][1]}
                  </p>
                )}
              </div>
            </div>
            {r.followup !== null && (
              <KnowledgeCheck
                check={{
                  question: "追加条件で回答が変わったら、どう確かめる？",
                  options: [
                    "短くなれば必ず正しい",
                    "変わった点と元の意味を比べ、不明な部分を聞き直す",
                    "初心者向けなら根拠の確認はいらない",
                  ],
                  answer: 1,
                  reason:
                    "長さや言い方を変えても正しさは保証されません。元の意味や例との対応を確かめ、分からない箇所を指定して聞き直します。",
                }}
                value={r.conversationAnswer}
                onAnswer={(v) => update({ conversationAnswer: v })}
              />
            )}
          </>
        )}
        {r.step === 1 && (
          <>
            <p>
              オリジナルの架空商品です。同じ袋でも映り方で読める範囲が変わります。まず現在の条件だけで判断し、その後に正本を開いて照合します。
            </p>
            <div
              className="study-source-buttons"
              role="group"
              aria-label="映像条件（静止教材）"
            >
              {frames.map((f) => (
                <button
                  key={f.id}
                  aria-pressed={r.frame === f.id}
                  onClick={() => changeFrame(f.id)}
                >
                  {f.title}
                </button>
              ))}
            </div>
            <h3 ref={result} tabIndex={-1}>
              現在の条件：{frame.title}（ライブ映像ではありません）
            </h3>
            <label className="option">
              <input
                type="checkbox"
                checked={textOnly}
                onChange={(e) => setTextOnly(e.target.checked)}
              />
              図の代わりに文字で判断する
            </label>
            {textOnly ? (
              <div
                className="study-source"
                aria-label="現在の表示の文字による代替"
              >
                <p>{frame.visible}</p>
                <p>{frame.unknown}</p>
              </div>
            ) : (
              <LivePackage frame={r.frame} />
            )}
            <KnowledgeCheck
              key={r.frame}
              check={{
                question: frame.question,
                options: [...frame.options],
                answer: frame.answer,
                reason: frame.reason,
              }}
              value={r.packageAnswer}
              onAnswer={(v) =>
                update({
                  packageAnswer: v,
                  history: history(`package:${r.frame}`),
                })
              }
            />
            {r.packageAnswer !== null && (
              <div className="lab-compare">
                <div className="study-source">
                  <h3>不確かなのに断言する誤答例（教材用）</h3>
                  <p>{frame.bad}</p>
                  <p>この例を読み取り成功とは扱いません。</p>
                </div>
                <div className="study-source">
                  <h3>見える範囲を伝え、確認する回答例</h3>
                  <p>{frame.good}</p>
                  <p>
                    <strong>今読める範囲：</strong>
                    {frame.visible}
                  </p>
                  <p>
                    <strong>分からないこと：</strong>
                    {frame.unknown}
                  </p>
                </div>
              </div>
            )}
            <button
              disabled={r.packageAnswer === null}
              aria-expanded={truth}
              aria-controls="live-truth"
              onClick={() => setTruth(!truth)}
            >
              {truth ? "答え合わせの正本を閉じる" : "答え合わせの正本を開く"}
            </button>
            {r.packageAnswer === null && (
              <p className="small">判断を選ぶと正本を開けます。</p>
            )}
            {truth && (
              <div id="live-truth" className="notice">
                <h3>答え合わせ専用の正本データ</h3>
                <dl>
                  {Object.entries({
                    商品名: packageTruth.name,
                    内容量: packageTruth.amount,
                    説明: packageTruth.description,
                    作成元: packageTruth.maker,
                  }).map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
                <p>
                  ここで知った情報は正本による答え合わせです。今の映像条件で読み取った事実にはしません。現物の味・中身・安全性を保証する資料でもありません。
                </p>
              </div>
            )}
          </>
        )}
        {r.step === 2 && (
          <>
            <p>
              共有前の判断練習です。実際の画面共有・範囲指定は行いません。この教材の整理結果と同じ範囲指定が実アプリやOSでできる保証はありません。公式ヘルプは全画面が共有されると説明しています。
            </p>
            <label className="lab-field">
              画面を見せたい目的
              <select
                value={r.sharing}
                onChange={(e) => {
                  if (e.target.value !== latest.current.sharing)
                    update({
                      sharing: e.target.value as LiveRecord["sharing"],
                      sharingAnswer: null,
                      stopAnswer: null,
                    });
                }}
              >
                {sharingCases.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </label>
            <p>
              <strong>目的：</strong>
              {sharing.goal}
            </p>
            <div className="live-screen" aria-label="共有前の架空画面">
              <span className="badge">すべて架空・静止した教材画面</span>
              <h3>質問に関係する表示</h3>
              <p>{sharing.required}</p>
              <h3>無関係な表示も混在</h3>
              <p>{sharing.extra}</p>
            </div>
            <KnowledgeCheck
              key={r.sharing}
              check={{
                question: "この目的では、何をどう見せる？",
                options: shareChoices,
                answer: sharing.answer,
                reason:
                  r.sharingAnswer === null
                    ? ""
                    : sharing.reasons[r.sharingAnswer],
              }}
              value={r.sharingAnswer}
              onAnswer={(v) =>
                update({
                  sharingAnswer: v,
                  history: history(`sharing:${r.sharing}`),
                })
              }
            />
            {r.sharingAnswer !== null && (
              <div
                className="notice"
                role="region"
                aria-label="選択後の共有前判断"
              >
                <h3>共有予定を見直す（模擬・未送信）</h3>
                <p>
                  {r.sharingAnswer === 0
                    ? `${sharing.required} / ${sharing.extra} が見える予定。不要な表示を閉じる余地があります。`
                    : r.sharingAnswer === 1
                      ? `${sharing.required} だけを残す整理案。通知が再表示されないか、共有開始表示と実際の範囲を確認します。実OSでの部分共有を示したものではありません。`
                      : "画面は共有しない案。質問に必要な言葉だけを伝え、不要な画面や通知を送らずに済みます。"}
                </p>
              </div>
            )}
            <KnowledgeCheck
              check={{
                question: "共有を始める前・止めるときに何を確認する？",
                options: [
                  "カメラを止めれば画面共有も会話も必ず終了する",
                  "開始時の共有範囲を確認し、カメラ・画面共有・会話終了を別々に確認する",
                  "アプリを切り替えるだけで必ず全て終了する",
                ],
                answer: 1,
                reason:
                  "開始時には共有表示と通知を含む範囲を確かめます。カメラ停止、画面共有停止、会話終了は同じ操作ではありません。停止したつもりで共有を続けないよう、それぞれの表示を確認します。",
              }}
              value={r.stopAnswer}
              onAnswer={(v) => update({ stopAnswer: v })}
            />
          </>
        )}
        {r.step === 3 && (
          <>
            <aside className="notice">
              <strong>任意の実アプリ演習・自己申告</strong>
              <p>
                ここからは学習者が自分のGeminiアプリで行います。この教材から接続・起動成功・実行結果は確認できません。利用できない、許可しない、声を出せない場合は模擬体験だけで終えられます。
              </p>
            </aside>
            <label className="lab-field">
              案内する端末
              <select
                value={r.platform}
                onChange={(e) =>
                  update({ platform: e.target.value as LiveRecord["platform"] })
                }
              >
                <option value="ios">iPhone / iPad</option>
                <option value="android">Android</option>
              </select>
            </label>
            <details>
              <summary>選んだ端末の公式操作・利用条件</summary>
              <OfficialLive platform={r.platform} />
            </details>
            <ol>
              <li>共有してよい物を選び、周囲の人・通知・機密の表示を外す。</li>
              <li>
                自分でアプリのLiveを開き、必要な許可と提供条件を読む。許可しない選択でも構いません。
              </li>
              <li>物を見せ、見える文字や特徴を尋ねる。</li>
              <li>説明を短くし、追加質問で見えた事実と推測を分ける。</li>
              <li>
                原物と照合し、読めない部分は距離・ピント・隠れを変えて再確認する。
              </li>
              <li>
                カメラ/画面共有の停止と会話終了を、それぞれ実画面で確かめる。
              </li>
            </ol>
            <label className="lab-field">
              実演習で自分が使う物
              <select
                value={r.practice}
                onChange={(e) => practice(e.target.value as PracticeId)}
              >
                {practiceObjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </label>
            <pre
              className="service-prompt"
              tabIndex={0}
              aria-label="実アプリ演習の発言例全文"
            >
              {prompt}
            </pre>
            <button
              className="primary"
              disabled={copy.busy}
              onClick={() => {
                const id = r.practice;
                void copy.copy(
                  prompt,
                  () =>
                    update({
                      copied: [...new Set([...latest.current.copied, id])],
                    }),
                  () => latest.current.practice === id,
                );
              }}
            >
              発言例を全文コピー
            </button>
            <p>
              現在の本文のコピー成功記録：
              {r.copied.includes(r.practice) ? "あり（実行とは別）" : "なし"}
              。本文を変えない端末案内の切替では記録を維持します。OSクリップボードの書き込み自体は取り消せません。
            </p>
            <p>
              <a
                className="primary"
                href="https://gemini.google.com/"
                target="_blank"
                rel="noreferrer"
              >
                Geminiの公式サイトを開く ↗（別タブ・任意）
              </a>
            </p>
            <p>
              このリンクはLiveやアプリの起動を保証しません。Liveは自分の対応モバイルアプリから開いてください。
            </p>
            {(
              [
                ["tried", "自分のアプリで試した（自己申告）"],
                ["compared", "回答を原物と照合した（自己申告）"],
                ["ended", "共有停止と会話終了を実画面で確認した（自己申告）"],
              ] as const
            ).map(([key, label]) => (
              <label className="option" key={key}>
                <input
                  type="checkbox"
                  checked={r[key]}
                  onChange={(e) => update({ [key]: e.target.checked })}
                />
                {label}
              </label>
            ))}
            <p>
              これらは過去の実演習についての自己申告です。現在選んだ物の正解や成功を教材が認定したものではありません。実際の発言や画像を入力する欄はありません。
            </p>
            <button onClick={() => go(1)}>
              実アプリを使わず模擬パッケージへ戻る
            </button>
          </>
        )}
      </section>
      <div className="lab-actions">
        {r.step > 0 && (
          <button onClick={() => go(r.step - 1)}>← 前の体験</button>
        )}
        {r.step < 3 && (
          <button className="primary" onClick={() => go(r.step + 1)}>
            次の体験 →
          </button>
        )}
      </div>
      <p className="feedback" role="status">
        {copy.message}
      </p>
      {r.step !== 3 && (
        <details>
          <summary>実Liveの操作と、この教材の違いを確認</summary>
          <label className="lab-field">
            公式案内の端末
            <select
              value={r.platform}
              onChange={(e) =>
                update({ platform: e.target.value as LiveRecord["platform"] })
              }
            >
              <option value="ios">iPhone / iPad</option>
              <option value="android">Android</option>
            </select>
          </label>
          <OfficialLive platform={r.platform} />
        </details>
      )}
      <section className="panel" aria-label="第5章の学習記録">
        <h2>第5章の学習記録</h2>
        <p>
          模擬操作の履歴：{r.history.length}
          件（過去の選択/回答）。現在の条件で正しく確認した証拠ではありません。
        </p>
        <p>
          現在の固定チェック：会話{" "}
          {r.conversationAnswer === 1
            ? "正解"
            : r.conversationAnswer === null
              ? "未回答"
              : "再確認"}{" "}
          ／ パッケージ{" "}
          {r.packageAnswer === frame.answer
            ? "正解"
            : r.packageAnswer === null
              ? "未回答"
              : "再確認"}{" "}
          ／ 共有判断{" "}
          {r.sharingAnswer === sharing.answer
            ? "正解"
            : r.sharingAnswer === null
              ? "未回答"
              : "再確認"}{" "}
          ／ 開始・停止{" "}
          {r.stopAnswer === 1
            ? "正解"
            : r.stopAnswer === null
              ? "未回答"
              : "再確認"}
        </p>
        <p>
          コピー、任意演習の自己申告、章完了はそれぞれ別です。模擬体験だけでも完了を記録できます。
        </p>
        <label className="option">
          <input
            type="checkbox"
            checked={completed}
            onChange={(e) => onComplete(e.target.checked)}
          />
          第5章の学習を完了した（自己申告）
        </label>
        {resetting ? (
          <>
            <p>
              第5章の固定選択・回答・履歴・コピー・任意演習の自己申告と章完了だけを初期化します。他章・ラボ・探索には影響しません。初期化しますか？
            </p>
            <div className="lab-actions">
              <button onClick={reset}>第5章を初期化する</button>
              <button
                onClick={() => {
                  setResetting(false);
                  requestAnimationFrame(() => resetButton.current?.focus());
                }}
              >
                キャンセル
              </button>
            </div>
          </>
        ) : (
          <button ref={resetButton} onClick={() => setResetting(true)}>
            第5章の記録だけを初期化
          </button>
        )}
      </section>
      {!available && (
        <p role="status" className="notice">
          第5章をブラウザに保存できません。画面内では続けられます。保存拒否・容量不足・不正データなどにより、移動や再読み込みで失われたり旧記録へ戻る場合があります。
        </p>
      )}
      <p className="feedback" role="status">
        {message}
      </p>
      <p>
        <a href="#chapter-1">第1章の機能探検へ戻る</a> ·{" "}
        <a href="#curriculum">全10章へ戻る</a>
      </p>
    </div>
  );
}
