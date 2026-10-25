import { useRef } from "react";
import { KnowledgeCheck } from "./Lab";
import {
  citationChoices,
  citationReason,
  learningGuide,
  notebookAnswer,
  questionCases,
  studySources,
  studyTopics,
  topicFor,
  type GuideSettings,
  type TopicId,
} from "./study-data";
import type { NotebookRecord } from "./study-storage";
import { SourceView, StudySteps, useStudyCopy } from "./StudyShared";
export function Notebook({
  record: n,
  onUpdate,
  onTopic,
}: {
  record: NotebookRecord;
  onUpdate: (patch: Partial<NotebookRecord>) => void;
  onTopic: (id: TopicId) => void;
}) {
  const copy = useStudyCopy();
  const heading = useRef<HTMLHeadingElement>(null),
    sourceHeading = useRef<HTMLHeadingElement>(null),
    nodeHeading = useRef<HTMLHeadingElement>(null);
  const all = studySources(n.topic),
    selected = all.filter((s) => n.sources.includes(s.id)),
    t = topicFor(n.topic);
  const answer = notebookAnswer(n.topic, n.question, n.sources),
    q = questionCases.find((q) => q.id === n.question) ?? questionCases[0];
  const view = all.find((s) => s.id === n.view),
    node = selected.find((s) => s.id === n.node);
  const guideText = learningGuide(n.topic, n.sources, n.guide);
  const latestGuide = useRef(guideText);
  latestGuide.current = guideText;
  function mutate(patch: Partial<NotebookRecord>) {
    const changed =
      learningGuide(
        n.topic,
        patch.sources ?? n.sources,
        patch.guide ?? n.guide,
      ) !== guideText;
    if (changed) copy.invalidate();
    onUpdate({ ...patch, ...(changed ? { copied: false } : {}) });
  }
  function go(step: number) {
    onUpdate({ step });
    requestAnimationFrame(() => heading.current?.focus());
  }
  function inspect(id: string) {
    onUpdate({ view: id });
    requestAnimationFrame(() => sourceHeading.current?.focus());
  }
  function guide<K extends keyof GuideSettings>(
    key: K,
    value: GuideSettings[K],
  ) {
    mutate({ guide: { ...n.guide, [key]: value } });
  }
  return (
    <div className="study-workspace">
      {n.invalidated && (
        <p role="status" className="notice">
          連携元のテーマ・検証内容が変わったか初期化されたため、古い引継ぎ資料を無効にしました。Notebookと同テーマで由来を記録できた独自追加資料と学習条件は保持し、旧形式で由来不明の資料は除外します。テーマを明示変更した場合は旧テーマの資料を保持しません。再連携するか、ここで資料を選び直してください。
        </p>
      )}
      <p className="notice">
        {n.origin
          ? `第3章からの教材内引継ぎ：${t.title}。標本集計・観察資料・改善済みレポートの3件を受け取りました。後から追加した資料は引継ぎ検証の対象外です。同じテーマの再検証では独自追加資料を保持します。`
          : "第4章は単独で利用できます。第3章の完了や実サービスへの接続は不要です。"}
      </p>
      <label className="lab-field">
        Notebookのテーマ
        <select
          value={n.topic}
          onChange={(e) => {
            copy.invalidate();
            onTopic(e.target.value as TopicId);
          }}
        >
          {studyTopics.map((t) => (
            <option value={t.id} key={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </label>
      <StudySteps
        labels={[
          "資料を取り込む",
          "資料に質問する",
          "学習ガイドを作る",
          "音声解説とマインドマップ",
        ]}
        step={n.step}
        onStep={go}
      />
      <p aria-live="polite">
        現在の参照対象：{selected.length}件
        {selected.length
          ? `（${selected.map((s) => s.title).join("、")}）`
          : "・まだ資料がありません"}
      </p>
      <section aria-labelledby="notebook-step">
        <h2 id="notebook-step" ref={heading} tabIndex={-1}>
          体験{n.step + 1}：
          {
            [
              "資料を取り込む",
              "資料に質問する",
              "学習ガイドを作る",
              "音声解説とマインドマップ",
            ][n.step]
          }
        </h2>
        {n.step === 0 && (
          <>
            <p>
              資料を追加・除外して参照対象を決めます。すべて教材用の模擬資料で、実ファイルをアップロードしません。資料形式は分類を体験するための表示で、PDFファイルそのものではありません。
            </p>
            <div className="study-materials">
              {all.map((s) => (
                <div className="study-source" key={s.id}>
                  <span className="badge">教材用の模擬資料 / {s.format}</span>
                  <h3>{s.title}</h3>
                  <p>{s.summary}</p>
                  <p className="small">
                    {s.issuer} / 作成日：{s.date}
                  </p>
                  <p>
                    {n.origin?.materials.includes(s.id)
                      ? "教材内で理由を確認して引き継いだ資料（除外後に再選択しても引継ぎ由来）"
                      : n.localSources.includes(s.id)
                        ? "第4章で独自追加した資料（引継ぎ検証の対象外）"
                        : n.sources.includes(s.id)
                          ? "由来未確定の旧形式資料（連携元の変更時に除外）"
                          : "個別に追加する資料（引継ぎ検証の対象外）"}
                  </p>
                  <label className="option">
                    <input
                      type="checkbox"
                      checked={n.sources.includes(s.id)}
                      onChange={() =>
                        mutate({
                          sources: n.sources.includes(s.id)
                            ? n.sources.filter((id) => id !== s.id)
                            : [...n.sources, s.id],
                          localSources: n.sources.includes(s.id)
                            ? n.localSources.filter((id) => id !== s.id)
                            : n.origin?.materials.includes(s.id)
                              ? n.localSources
                              : [...n.localSources, s.id],
                          view: "",
                          node: "root",
                          asked: false,
                          citationAnswers: {},
                        })
                      }
                    />
                    資料に追加：{s.title}
                  </label>
                  <button onClick={() => inspect(s.id)}>
                    資料を読む：{s.title}
                  </button>
                </div>
              ))}
            </div>
            {view && (
              <>
                <p>
                  {n.sources.includes(view.id)
                    ? "参照対象の本文"
                    : "未追加の資料プレビュー（回答の根拠には使いません）"}
                </p>
                <SourceView source={view} headingRef={sourceHeading} />
              </>
            )}
          </>
        )}
        {n.step === 1 && (
          <>
            <p>
              引用番号があるだけでは正しさは分かりません。質問例を選び、回答と該当箇所を比べましょう。
            </p>
            <label className="lab-field">
              模擬質問を選ぶ
              <select
                value={n.question}
                onChange={(e) =>
                  mutate({ question: e.target.value, asked: false, view: "" })
                }
              >
                {questionCases.map((q) => (
                  <option value={q.id} key={q.id}>
                    {q.title}
                  </option>
                ))}
              </select>
            </label>
            <p>{q.question}</p>
            <button
              className="primary"
              onClick={() => {
                onUpdate({ asked: true, view: "" });
              }}
            >
              選択資料で質問する（模擬）
            </button>
            {n.asked && (
              <>
                <div className="lab-compare">
                  <div className="study-source">
                    <h3>AIの回答例（固定教材）</h3>
                    <p role="status">{answer.text}</p>
                    {answer.citations.map((id, i) => (
                      <button key={id} onClick={() => inspect(id)}>
                        [{i + 1}] 引用元を開く：
                        {all.find((s) => s.id === id)?.title}
                      </button>
                    ))}
                  </div>
                  {view && n.sources.includes(view.id) && (
                    <SourceView source={view} headingRef={sourceHeading} />
                  )}
                </div>
                {answer.available && (
                  <div className="panel">
                    <KnowledgeCheck
                      check={{
                        question: "この回答と引用をどう判断する？",
                        options: citationChoices,
                        answer: q.answer,
                        reason: citationReason(n.topic, n.question),
                      }}
                      value={n.citationAnswers[q.id] ?? null}
                      onAnswer={(v) =>
                        mutate({
                          citationAnswers: { ...n.citationAnswers, [q.id]: v },
                        })
                      }
                    />
                  </div>
                )}
              </>
            )}
          </>
        )}
        {n.step === 2 && (
          <>
            <p>
              固定の回答例を、参照対象と学習条件に合わせて組み立てます。実際のAI生成ではありません。形式や対象を変えて読み比べましょう。
            </p>
            <div className="lab-compare">
              <label className="lab-field">
                学習対象
                <select
                  value={n.guide.audience}
                  onChange={(e) =>
                    guide(
                      "audience",
                      e.target.value as GuideSettings["audience"],
                    )
                  }
                >
                  <option value="beginner">初心者</option>
                  <option value="intermediate">中級者</option>
                </select>
              </label>
              <label className="lab-field">
                ガイドの形式
                <select
                  value={n.guide.format}
                  onChange={(e) =>
                    guide("format", e.target.value as GuideSettings["format"])
                  }
                >
                  <option value="summary">要約</option>
                  <option value="qa">Q&A</option>
                  <option value="quiz">復習問題</option>
                </select>
              </label>
              <label className="lab-field">
                詳しさ
                <select
                  value={n.guide.detail}
                  onChange={(e) =>
                    guide("detail", e.target.value as GuideSettings["detail"])
                  }
                >
                  <option value="brief">簡潔</option>
                  <option value="detailed">詳細</option>
                </select>
              </label>
            </div>
            <pre
              className="service-prompt"
              tabIndex={0}
              aria-label="学習ガイドの全文"
            >
              {guideText}
            </pre>
            <button
              className="primary"
              disabled={copy.busy || !selected.length}
              onClick={() =>
                void copy.copy(
                  guideText,
                  () => onUpdate({ copied: true }),
                  () => latestGuide.current === guideText,
                )
              }
            >
              学習ガイドを全文コピー
            </button>
            <div
              className="study-source-buttons"
              role="group"
              aria-label="ガイドの根拠資料"
            >
              {selected.map((s, i) => (
                <button key={s.id} onClick={() => inspect(s.id)}>
                  [{i + 1}] {s.title}
                </button>
              ))}
            </div>
            {view && n.sources.includes(view.id) && (
              <SourceView source={view} headingRef={sourceHeading} />
            )}
          </>
        )}
        {n.step === 3 && (
          <>
            <h3>音声解説の構成と台本（音声未生成・再生不可）</h3>
            <p>
              音声にすると聞きやすくても、根拠の確認は必要です。再生ボタンはありません。選択資料だけから解説の台本例を組み立てます。
            </p>
            <label className="lab-field">
              音声解説の表示
              <select
                value={n.audio}
                onChange={(e) =>
                  mutate({ audio: e.target.value as NotebookRecord["audio"] })
                }
              >
                <option value="outline">構成例</option>
                <option value="dialogue">2人の会話台本</option>
              </select>
            </label>
            <div className="study-source" aria-live="polite">
              {!selected.length ? (
                <p>
                  参照資料がありません。資料を追加すると台本例が表示されます。
                </p>
              ) : n.audio === "outline" ? (
                <ol>
                  <li>問いの共有：{t.question}</li>
                  {selected.map((s) => (
                    <li key={s.id}>
                      要点と根拠：{s.learning}（{s.title}・{s.section}）
                    </li>
                  ))}
                  <li>結論を急がず、原文と限界を再確認する。</li>
                </ol>
              ) : (
                <>
                  <p>
                    ホストA：今日は「{t.short}
                    」の資料を読むときの確認点を考えます。
                  </p>
                  {selected.map((s) => (
                    <div key={s.id}>
                      <p>ホストA：{s.title}から何が言えますか？</p>
                      <p>
                        ホストB：{s.learning} 根拠は「{s.section}
                        」です。これは教材用の模擬資料です。
                      </p>
                    </div>
                  ))}
                  <p>
                    ホストA：聞いただけで正しいとせず、引用元も直接読みましょう。
                  </p>
                </>
              )}
            </div>
            <h3>選んで読むマインドマップ</h3>
            <p>
              中心テーマから資料と確認点をたどります。資料を除外すると対応する枝もなくなります。
            </p>
            <ul
              className="study-mindmap"
              aria-label="資料と学びのマインドマップ"
            >
              <li>
                <button
                  aria-pressed={n.node === "root"}
                  onClick={() => {
                    onUpdate({ node: "root" });
                    requestAnimationFrame(() => nodeHeading.current?.focus());
                  }}
                >
                  {t.short}：根拠を確かめて学ぶ
                </button>
                <ul>
                  {selected.map((s) => (
                    <li key={s.id}>
                      <button
                        aria-pressed={n.node === s.id}
                        onClick={() => {
                          onUpdate({ node: s.id });
                          requestAnimationFrame(() =>
                            nodeHeading.current?.focus(),
                          );
                        }}
                      >
                        {s.title}
                      </button>
                      <span>{s.kind}</span>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
            <div
              className="study-source"
              role="region"
              aria-label="マップで選んだ項目"
            >
              <h4 ref={nodeHeading} tabIndex={-1}>
                {node ? node.title : t.short}
              </h4>
              <p>
                {node
                  ? node.learning
                  : "根拠・対象範囲・限界を結びつけ、説明や音声を原文へ戻れる学習にします。"}
              </p>
              {node && (
                <>
                  <p>
                    関連資料：{node.id} / {node.section}
                  </p>
                  <button onClick={() => inspect(node.id)}>
                    関連する原文を読む
                  </button>
                </>
              )}
            </div>
            {view && n.sources.includes(view.id) && (
              <SourceView source={view} headingRef={sourceHeading} />
            )}
          </>
        )}
      </section>
      <div className="lab-actions">
        {n.step > 0 && (
          <button onClick={() => go(n.step - 1)}>← 前の体験</button>
        )}
        {n.step < 3 && (
          <button className="primary" onClick={() => go(n.step + 1)}>
            次の体験 →
          </button>
        )}
      </div>
      <p className="feedback" role="status">
        {copy.message}
      </p>
      <p className="small">
        現在のガイドのコピー成功記録：
        {n.copied ? "あり（実操作とは別）" : "なし"}
        。開始済みのOSクリップボードへの書き込み自体は取り消せません。
      </p>
    </div>
  );
}
