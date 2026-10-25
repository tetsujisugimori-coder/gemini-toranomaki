import { useEffect, useRef, useState } from "react";
import { studyReferences, type StudySource } from "./study-data";
export function useStudyCopy() {
  const mounted = useRef(false),
    version = useRef(0);
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      version.current++;
    };
  }, []);
  function invalidate() {
    version.current++;
    setBusy(false);
    setMessage("");
  }
  async function copy(
    text: string,
    onSuccess: () => void,
    matches: () => boolean = () => true,
  ) {
    if (busy) return;
    const ticket = version.current;
    const route = location.hash;
    const current = () =>
      mounted.current &&
      version.current === ticket &&
      location.hash === route &&
      matches();
    setBusy(true);
    try {
      await navigator.clipboard.writeText(text);
      if (!current()) return;
      onSuccess();
      setMessage(
        "全文をコピーしました。実サービスへの送信や実行はしていません。",
      );
    } catch {
      if (current())
        setMessage(
          "コピーできませんでした。全文を選択して手動でコピーしてください。成功記録は追加しません。",
        );
    } finally {
      if (current()) setBusy(false);
    }
  }
  return { busy, message, copy, invalidate };
}
export function StudySteps({
  labels,
  step,
  onStep,
}: {
  labels: string[];
  step: number;
  onStep: (n: number) => void;
}) {
  return (
    <>
      <ol className="service-steps" aria-label="学習の4体験">
        {labels.map((label, i) => (
          <li key={label}>
            <button
              aria-current={step === i ? "step" : undefined}
              onClick={() => onStep(i)}
            >
              {i + 1}. {label}
            </button>
          </li>
        ))}
      </ol>
      <p className="small">
        現在位置：体験 {step + 1} / 4 ・いつでも戻って試し直せます。
      </p>
    </>
  );
}
export function SourceView({
  source,
  headingRef,
}: {
  source: StudySource;
  headingRef?: React.RefObject<HTMLHeadingElement | null>;
}) {
  return (
    <aside className="study-source" aria-label="資料の原文">
      <span className="badge">教材用の模擬資料・実在しません</span>
      <h4 ref={headingRef} tabIndex={-1}>
        {source.title}
      </h4>
      <dl>
        <dt>資料ID・形式・性質</dt>
        <dd>
          {source.id} / {source.format} / {source.kind}
        </dd>
        <dt>発行主体・作成日</dt>
        <dd>
          {source.issuer} / {source.date}
        </dd>
        <dt>概要</dt>
        <dd>{source.summary}</dd>
        <dt>該当箇所</dt>
        <dd>{source.section}</dd>
      </dl>
      <blockquote>{source.body}</blockquote>
    </aside>
  );
}
export function OfficialStudy({ chapter }: { chapter: 3 | 4 }) {
  return (
    <details>
      <summary>公式の機能と、この教材の模擬操作の違い</summary>
      <div className="service-content">
        {chapter === 3 ? (
          <>
            <p>
              公式のDeep
              Researchはソースを調べて計画・レポートを作ります。調査前に「プランを編集」で修正できます。公式ヘルプでは18歳以上・ログインが必要で、日ごと・同時実行の上限、プランによる差があります。自分の画面の案内を確認してください。教材内の操作にはこれらの契約・接続は不要です。
            </p>
            <a
              className="primary"
              href="https://gemini.google.com/"
              target="_blank"
              rel="noreferrer"
            >
              Geminiを開く ↗（別タブ・任意）
            </a>
          </>
        ) : (
          <>
            <p>
              確認した公式本文は「Gemini Notebook」、ヘルプ名やDeep
              Researchの説明には「NotebookLM」という表記もあります。GeminiアプリのノートブックはGemini
              Notebookと接続し、ノートブックの変更を同期できると案内されています。名称だけから別製品や同じ画面と決めつけず、以下の公式説明と自分の画面で確認してください。
            </p>
            <p>
              Geminiアプリ側のノートブックは段階提供で、地域・端末で接続や対応が異なります。アクティビティの保存がオフでもチャットはできますが、履歴・メモリー・Drive追加等には制限があります。Notebook側も年齢・アカウント・地域・プラン・上限を確認してください。利用可能性は保証しません。
            </p>
            <p>
              公式の音声解説はソースから生成されますが、不正確な情報や音声の乱れを含む場合があります。この教材は台本を表示するだけで音声を生成・再生しません。
            </p>
            <a
              className="primary"
              href="https://notebook.google/"
              target="_blank"
              rel="noreferrer"
            >
              Notebookを開く ↗（別タブ・任意）
            </a>
          </>
        )}
        <p>
          このサイトはGoogleにログインせず、OAuth・API・ファイルアップロード・実サービス間転送を行いません。実操作は別タブで任意に行い、機密情報や個人情報・無断の著作物を送らないでください。公式本文の確認と実アカウントでの提供・操作確認は別です。
        </p>
        {studyReferences
          .filter((_, i) => chapter === 4 || i === 0)
          .map((r) => (
            <p key={r.url}>
              <a href={r.url} target="_blank" rel="noreferrer">
                {r.title} ↗
              </a>
            </p>
          ))}
      </div>
    </details>
  );
}
