import { useEffect, useRef, useState } from "react";
import { MockServices } from "./Services";
import { useStudyCopy } from "./StudyShared";
import { loadServices } from "./services-storage";
import {
  loadPractice,
  savePractice,
  sanitizePractice,
  statusLabels,
  type PracticeRecord,
} from "./services-practice-storage";
import {
  testMail,
  practiceSteps,
  environments,
  environmentGuides,
  practicePrompts,
  executionPractice,
  goals,
  procedures,
  expected,
  troubleHints,
  practiceReferences,
} from "./services-practice-data";
export function Services({
  completed,
  onComplete,
}: {
  completed: boolean;
  onComplete: (v: boolean) => void;
}) {
  const [initial] = useState(loadPractice);
  const [record, setRecord] = useState(initial.record);
  const latest = useRef(record);
  const [available, setAvailable] = useState(initial.available);
  const [approved, setApproved] = useState(false);
  const [reset, setReset] = useState(false);
  const [mockInitial, setMockInitial] = useState(loadServices);
  const copy = useStudyCopy();
  const [mailCopy, setMailCopy] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const focus = useRef(false);
  useEffect(() => {
    if (focus.current) {
      heading.current?.focus();
      heading.current?.scrollIntoView({ block: "start" });
    }
  }, [record.step, record.mode]);
  function update(patch: Partial<PracticeRecord>) {
    const next = { ...latest.current, ...patch };
    latest.current = next;
    setRecord(next);
    setAvailable(savePractice(next));
  }
  function invalidate() {
    copy.invalidate();
    setMailCopy(null);
    setApproved(false);
  }
  function go(step: number) {
    invalidate();
    focus.current = true;
    update({ step });
  }
  function toggle(field: "performed" | "verified") {
    invalidate();
    const list = latest.current[field];
    update({
      [field]: list.includes(record.step)
        ? list.filter((x) => x !== record.step)
        : [...list, record.step],
    });
  }
  function prompt(text: string, id: string, label?: string) {
    const target =
      id === "mail-subject" ? "件名" : id === "mail-body" ? "本文" : null;
    return (
      <div className="practice-prompt">
        <pre
          tabIndex={0}
          aria-label={
            label ??
            (id === "execution"
              ? "実践・最終実行指示の全文"
              : "実践・依頼文の全文")
          }
        >
          {text}
        </pre>
        <button
          disabled={copy.busy}
          onClick={() => {
            setMailCopy(target ? id : null);
            void copy.copy(
              text,
              () =>
                update({
                  copied: [...new Set([...latest.current.copied, id])],
                }),
              () =>
                latest.current.mode === "real" &&
                (id !== "execution" || approved),
              target
                ? {
                    success: `${target}をコピーしました。実サービスへの送信や実行はしていません。`,
                    failure: `${target}をコピーできませんでした。上の${target}の全文を選択して手動でコピーしてください。成功記録は追加しません。`,
                  }
                : undefined,
            );
          }}
        >
          {id === "mail-subject"
            ? "件名をコピー"
            : id === "mail-body"
              ? "本文をコピー"
              : `全文をコピー${id === "execution" ? "（最終実行）" : ""}`}
        </button>
        {target && (
          <p
            role="status"
            aria-atomic="true"
            className={mailCopy === id ? "feedback" : undefined}
          >
            {mailCopy === id ? copy.message : ""}
          </p>
        )}
      </div>
    );
  }
  return (
    <div className="services-practice">
      <div className="lab-actions" aria-label="第2章の学習経路">
        <button
          aria-pressed={record.mode === "real"}
          onClick={() => {
            invalidate();
            setMockInitial(loadServices());
            focus.current = true;
            update({ mode: "real" });
          }}
        >
          実践教材へ
        </button>
        <button
          aria-pressed={record.mode === "mock"}
          onClick={() => {
            invalidate();
            update({ mode: "mock" });
          }}
        >
          模擬で事前練習・代替学習
        </button>
      </div>
      {!available && (
        <p className="notice" role="status">
          第2章の実践記録を保存できません。この画面内では続けられます。移動・再読み込みで失われたり、以前の記録が復活したりする場合があります。iPhoneのプライベートブラウズや保存制約も確認してください。
        </p>
      )}
      {record.mode === "mock" ? (
        <>
          <p className="notice">
            事前練習・連携不可時の代替・理解確認・トラブル対応です。模擬完了と実操作・実結果確認は別の記録です。上の「実践教材へ」で途中から戻れます。
          </p>
          <MockServices completed={completed} onComplete={onComplete} />
        </>
      ) : (
        <>
          <p className="notice">
            外部結果は自己申告です。教材は取得・検証せず、チェックを実連携成功とは判定しません。
          </p>
          <details>
            <summary>実操作とデータの扱い</summary>
            <p>
              自分のGemini・Gmail・Googleカレンダーで操作する教材です。メール本文・回答・認証情報を入力／保存する欄はありません。コピーは外部への送信や実行とは別です。
            </p>
          </details>
          <p className="small" role="status">
            現在：{practiceSteps[record.step]}（{record.step + 1}/
            {practiceSteps.length}工程）・操作 {record.performed.length}
            ／結果確認 {record.verified.length}・このブラウザに途中保存
          </p>
          <label className="lab-field">
            工程を選ぶ
            <select
              value={record.step}
              onChange={(e) => go(Number(e.target.value))}
            >
              {practiceSteps.map((s, i) => (
                <option key={s} value={i}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <section aria-labelledby="practice-heading">
            <h2 id="practice-heading" ref={heading} tabIndex={-1}>
              {practiceSteps[record.step]}
            </h2>
            <p>
              <strong>目標：</strong>
              {goals[record.step]}
            </p>
            <nav className="lab-actions" aria-label="実操作先">
              <a
                href="https://gemini.google.com/"
                target="_blank"
                rel="noreferrer"
              >
                Geminiを開く ↗
              </a>
              <a
                href="https://mail.google.com/"
                target="_blank"
                rel="noreferrer"
              >
                Gmailを開く ↗
              </a>
              <a
                href="https://calendar.google.com/"
                target="_blank"
                rel="noreferrer"
              >
                Calendarを開く ↗
              </a>
            </nav>
            <ol>
              {procedures[record.step].map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            {record.step === 0 && (
              <>
                <label className="lab-field">
                  端末・ブラウザ
                  <select
                    value={record.environment}
                    onChange={(e) => {
                      invalidate();
                      update({ environment: Number(e.target.value) });
                    }}
                  >
                    {environments.map((s, i) => (
                      <option key={s} value={i}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="notice">
                  {environmentGuides[record.environment]}
                </p>
                <details>
                  <summary>PCの2ウィンドウ方式・スマホの復帰ヒント</summary>
                  <p>
                    タブを別ウィンドウに移し、Windowsはタイトルバーの最大化ボタンのスナップ配置やドラッグ、macOSはウィンドウメニューのタイル配置など、自分のOSが提供する配置を使います。提供されなければ手動で幅を縮めて左右へ。左は教材、右はGemini・Gmail・Calendarの複数タブにします。境界やタブを教材は制御しません。
                  </p>
                  <p>
                    スマホは1工程ずつコピーして外部へ移動。教材を閉じず同じタブへ戻ってください。別ブラウザやプライベートブラウズでは記録を共有できません。復元できなくても工程選択から再開でき、実操作や予定は自動再実行されません。
                  </p>
                </details>
              </>
            )}
            {record.step === 3 && (
              <p className="notice">
                権限はサービス内の情報参照や対応操作を可能にするものです。プライバシー
                ハブでデータ利用・保持・解除の説明を読み、同意できなければ模擬へ進んで構いません。接続解除だけで過去の会話や作成済み予定が削除されるとは限りません。個人向けと仕事・学校向けの条件を混同せず、組織の情報を個人アカウントに移さないでください。
              </p>
            )}
            {record.step === 1 && (
              <>
                <h3>架空テストメール</h3>
                <p>
                  宛先：Gmail側で自分のメールアドレスを入力します。教材には入力しません。
                </p>
                <h4>件名 → Gmailの件名欄</h4>
                {prompt(
                  testMail.subject,
                  "mail-subject",
                  "Gmailの件名欄に貼る文字列",
                )}
                <h4>本文 → Gmailの本文欄</h4>
                {prompt(
                  testMail.body,
                  "mail-body",
                  "Gmailの本文欄に貼る文字列",
                )}
                <p className="small">
                  コピーはメール送信ではありません。失敗時は上の文字列を選択して手動でコピーできます。宛先・件名・本文をGmailで確認し、自分で送信します。
                </p>
              </>
            )}
            {practicePrompts[record.step] && (
              <>
                <h3>
                  {record.step === 6
                    ? "登録前確認の依頼文"
                    : "コピーして外部で使う依頼文"}
                </h3>
                {prompt(practicePrompts[record.step], `step-${record.step}`)}
              </>
            )}
            {record.step === 6 && (
              <>
                <p className="notice">
                  確認カードは全12項目（目的・予定の説明も必須）を照合し、別メッセージで最終承認します。未記入・不明・矛盾・対象不明・重複の可能性があれば停止。これらはGeminiへの依頼条件で、教材がGoogle側の動作を強制するものではありません。
                </p>
                <label className="option">
                  <input
                    type="checkbox"
                    checked={approved}
                    onChange={(e) => {
                      copy.invalidate();
                      setApproved(e.target.checked);
                    }}
                  />
                  今回提示された1件の全項目・目的・対象カレンダーと原文・重複なしを照合した（保存しない自己申告）
                </label>
                {approved && (
                  <>
                    <p>
                      このチェックは実データの検証やGoogle側の承認ではありません。ひな形はGemini側で全項目と目的を記入し、未記入のまま送らないでください。
                    </p>
                    {prompt(executionPractice, "execution")}
                  </>
                )}
              </>
            )}
            <p>
              <strong>予想結果・確認点：</strong>
              {expected[record.step]}
            </p>
            <details>
              <summary>困ったとき・確認できないとき</summary>
              <p>{troubleHints[record.step]}</p>
              <p>
                対応する模擬教材：
                {record.step < 2
                  ? "体験1の受信箱と抽出"
                  : record.step === 3
                    ? "体験2の接続理解"
                    : record.step === 4 || record.step === 8
                      ? "体験3の指示ビルダー"
                      : "体験4の原文比較・保留・トラブル問題"}
                。上の模擬切替から進めます。
              </p>
            </details>
            <fieldset>
              <legend>
                これまでの学習記録（自己申告・外部結果は教材未検証）
              </legend>
              <label className="option">
                <input
                  type="checkbox"
                  checked={record.performed.includes(record.step)}
                  onChange={() => toggle("performed")}
                />
                実操作を自分で実施した（自己申告）
              </label>
              <label className="option">
                <input
                  type="checkbox"
                  checked={record.verified.includes(record.step)}
                  onChange={() => toggle("verified")}
                />
                実結果を自分で確認した（自己申告）
              </label>
            </fieldset>
            <fieldset>
              <legend>現在の学習状態</legend>
              <label className="lab-field">
                未実施・保留の状態
                <select
                  value={record.status[record.step] ?? 0}
                  onChange={(e) => {
                    invalidate();
                    update({
                      status: {
                        ...latest.current.status,
                        [record.step]: Number(e.target.value),
                      },
                    });
                  }}
                >
                  {statusLabels.map((s, i) => (
                    <option key={s} value={i}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <p className="small">
                過去に実操作・結果確認をした後、現在は利用できない場合もあります。再挑戦しても過去の記録は残ります。
              </p>
              <button
                onClick={() => {
                  invalidate();
                  update({
                    status: { ...latest.current.status, [record.step]: 0 },
                  });
                }}
              >
                この工程を再挑戦
              </button>
              <p className="small">
                再挑戦は現在の状態だけを「未記録」に戻します。過去の記録は上のチェックで自分で訂正できます。利用不可・保留のままでも次の工程や模擬教材へ進めます。
              </p>
            </fieldset>
          </section>
          <div className="lab-actions">
            <button
              disabled={record.step === 0}
              onClick={() => go(record.step - 1)}
            >
              ← 前の工程
            </button>
            <button
              disabled={record.step === 8}
              onClick={() => go(record.step + 1)}
            >
              次の工程 →
            </button>
          </div>
          {mailCopy === null && (
            <p role="status" aria-atomic="true" className="feedback">
              {copy.message}
            </p>
          )}
          <details>
            <summary>実践・模擬の記録一覧</summary>
            <p>
              実連携成功を自動判定する一覧ではありません。これまでの学習記録と現在の学習状態は別です。過去に操作した後で現在は利用できない場合も、履歴は残ります。旧記録は実践の操作・確認へ変換しません。
            </p>
            <ul>
              {practiceSteps.map((s, i) => (
                <li key={s}>
                  {s}：
                  <div>
                    これまでの学習記録：実操作{" "}
                    {record.performed.includes(i) ? "自己申告あり" : "未記録"}
                    ／結果確認{" "}
                    {record.verified.includes(i) ? "自己申告あり" : "未記録"}
                  </div>
                  <div>
                    現在の学習状態：{statusLabels[record.status[i] ?? 0]}
                  </div>
                </li>
              ))}
            </ul>
            <p>
              模擬教材完了：
              {mockInitial.progress.simulated
                ? "完了記録あり（実操作とは別）"
                : "この実践画面の開始時点では記録なし"}
              。最新状態は模擬教材の学習記録で確認できます。
            </p>
            <p>コピー履歴：{record.copied.length}種類（送信・実施とは別）</p>
          </details>
          <label className="option">
            <input
              type="checkbox"
              checked={completed}
              onChange={(e) => onComplete(e.target.checked)}
            />
            第2章の学習を完了した（自己申告・実登録は不要）
          </label>
          <details>
            <summary>公式の確認日・条件と出典</summary>
            <p>
              確認日：2026-11-01
              JST。以下の公式本文を参照。表示名・位置・提供条件は変わります。アカウント種別・地域・言語・端末・段階提供の違いと、自分の画面の対応操作を確認してください。実アカウントの提供可否は未検証です。
            </p>
            <ul>
              {practiceReferences.map(([title, url]) => (
                <li key={url}>
                  <a href={url} target="_blank" rel="noreferrer">
                    {title} ↗
                  </a>
                </li>
              ))}
            </ul>
          </details>
          <details>
            <summary>実践記録だけを初期化</summary>
            <p>
              実践の工程・端末・操作/確認/保留・コピーだけを初期化します。模擬記録・章完了・他章・実Google上のメールや予定は対象外です。
            </p>
            <label className="option">
              <input
                type="checkbox"
                checked={reset}
                onChange={(e) => setReset(e.target.checked)}
              />
              実践記録の初期化を確認した
            </label>
            <button
              disabled={!reset}
              onClick={() => {
                invalidate();
                update(sanitizePractice(null));
                setReset(false);
              }}
            >
              実践記録を初期化する
            </button>
          </details>
        </>
      )}
    </div>
  );
}
