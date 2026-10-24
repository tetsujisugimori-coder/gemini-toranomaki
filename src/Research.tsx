import { useRef } from "react";
import { KnowledgeCheck } from "./Lab";
import {
  conditionWarnings,
  correctedReport,
  improvedPlan,
  planLabels,
  reportChecks,
  researchPrompt,
  sourceChoices,
  studySources,
  studyTopics,
  topicFor,
  type ResearchConditions,
  type TopicId,
} from "./study-data";
import { researchReady, type ResearchRecord } from "./study-storage";
import { SourceView, StudySteps, useStudyCopy } from "./StudyShared";
export function Research({
  record: r,
  onUpdate,
  onTopic,
  onTransfer,
}: {
  record: ResearchRecord;
  onUpdate: (patch: Partial<ResearchRecord>, context?: boolean) => void;
  onTopic: (id: TopicId) => void;
  onTransfer: () => void;
}) {
  const copy = useStudyCopy();
  const heading = useRef<HTMLHeadingElement>(null),
    sourceHeading = useRef<HTMLHeadingElement>(null);
  const sources = studySources(r.topic),
    checks = reportChecks(r.topic),
    t = topicFor(r.topic);
  const active = sources.find((s) => s.id === r.activeSource) ?? sources[0];
  function mutate(patch: Partial<ResearchRecord>) {
    copy.invalidate();
    onUpdate(patch, true);
  }
  function go(step: number) {
    copy.invalidate();
    onUpdate({ step });
    requestAnimationFrame(() => heading.current?.focus());
  }
  function inspect(id: string) {
    onUpdate({ activeSource: id });
    requestAnimationFrame(() => sourceHeading.current?.focus());
  }
  function condition<K extends keyof ResearchConditions>(
    key: K,
    value: ResearchConditions[K],
  ) {
    mutate({ conditions: { ...r.conditions, [key]: value } });
  }
  return (
    <div className="study-workspace">
      <label className="lab-field">
        調査テーマ
        <select
          value={r.topic}
          onChange={(e) => {
            copy.invalidate();
            onTopic(e.target.value as TopicId);
          }}
        >
          {studyTopics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </label>
      <StudySteps
        labels={[
          "調査テーマを設定する",
          "調査計画を修正する",
          "出典の信頼性を判定する",
          "レポートを評価する",
        ]}
        step={r.step}
        onStep={go}
      />
      <section aria-labelledby="research-step">
        <h2 id="research-step" ref={heading} tabIndex={-1}>
          体験{r.step + 1}：
          {
            [
              "調査テーマを設定する",
              "調査計画を修正する",
              "出典の信頼性を判定する",
              "レポートを評価する",
            ][r.step]
          }
        </h2>
        {r.step === 0 && (
          <>
            <p>
              調査したいことを具体化します。条件を変えると依頼文も変わります。この教材は調査を実行せず、以降はテーマに対応する固定の架空標本を使います。日本の実際の統計ではありません。
            </p>
            <div className="lab-compare">
              <label className="lab-field">
                調査の目的
                <select
                  value={r.conditions.purpose}
                  onChange={(e) =>
                    condition(
                      "purpose",
                      e.target.value as ResearchConditions["purpose"],
                    )
                  }
                >
                  <option value="learn">初学者の学習</option>
                  <option value="decision">選択肢の比較検討</option>
                </select>
              </label>
              <label className="lab-field">
                対象期間
                <select
                  value={r.conditions.period}
                  onChange={(e) =>
                    condition(
                      "period",
                      e.target.value as ResearchConditions["period"],
                    )
                  }
                >
                  <option value="recent">2024〜2025年</option>
                  <option value="any">対象期間を指定しない</option>
                </select>
              </label>
              <label className="lab-field">
                調査する地域
                <select
                  value={r.conditions.region}
                  onChange={(e) =>
                    condition(
                      "region",
                      e.target.value as ResearchConditions["region"],
                    )
                  }
                >
                  <option value="japan">日本・地域差を区別</option>
                  <option value="world">世界全体</option>
                </select>
              </label>
              <label className="lab-field">
                比較対象と基準
                <select
                  value={r.conditions.comparison}
                  onChange={(e) =>
                    condition(
                      "comparison",
                      e.target.value as ResearchConditions["comparison"],
                    )
                  }
                >
                  <option value="same">同じ定義で過去年と比較</option>
                  <option value="none">比較基準を決めない</option>
                </select>
              </label>
              <label className="lab-field">
                必要な根拠
                <select
                  value={r.conditions.evidence}
                  onChange={(e) =>
                    condition(
                      "evidence",
                      e.target.value as ResearchConditions["evidence"],
                    )
                  }
                >
                  <option value="primary">一次資料・学術資料と方法</option>
                  <option value="any">見つかった情報なら何でも</option>
                </select>
              </label>
            </div>
            <div role="status" className="notice">
              {conditionWarnings(r.conditions).length ? (
                <ul>
                  {conditionWarnings(r.conditions).map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              ) : (
                "目的・期間・地域・比較・資料条件を指定できました。対象範囲に合う資料かも確認しましょう。"
              )}
            </div>
            <h3>条件に応じた依頼文（まだ送信していません）</h3>
            <pre
              className="service-prompt"
              tabIndex={0}
              aria-label="調査依頼文の全文"
            >
              {researchPrompt(r.topic, r.conditions)}
            </pre>
            <button
              className="primary"
              disabled={copy.busy}
              onClick={() =>
                void copy.copy(researchPrompt(r.topic, r.conditions), () =>
                  onUpdate({ copied: true }),
                )
              }
            >
              調査依頼文を全文コピー
            </button>
            <p className="small">
              任意の実操作ではGeminiのDeep
              Researchを自分で選びます。計画を確認し、必要なら修正してから開始してください。コピーは調査実行や内容の検証ではありません。
            </p>
          </>
        )}
        {r.step === 1 && (
          <>
            <p>
              以下は「AIが作った」という設定の、問題を含む模擬計画です。4点を直し、変更前後を比べましょう。
            </p>
            <fieldset>
              <legend>計画をどう改善する？</legend>
              {planLabels.map((label, i) => (
                <label key={label} className="option">
                  <input
                    type="checkbox"
                    checked={r.fixes[i]}
                    onChange={(e) =>
                      mutate({
                        fixes: r.fixes.map((v, n) =>
                          n === i ? e.target.checked : v,
                        ),
                      })
                    }
                  />
                  {label}
                </label>
              ))}
            </fieldset>
            <div className="lab-compare">
              <div className="study-source">
                <h3>変更前の模擬計画</h3>
                <ol>
                  {improvedPlan(
                    r.topic,
                    r.conditions,
                    planLabels.map(() => false),
                  ).map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ol>
              </div>
              <div className="study-source" aria-live="polite">
                <h3>あなたの改善後の計画</h3>
                <ol>
                  {improvedPlan(r.topic, r.conditions, r.fixes).map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ol>
              </div>
            </div>
            <p role="status" className="notice">
              {r.fixes.every(Boolean)
                ? "4点を修正しました。狭い問い・対象年・同条件の比較・追跡可能な資料にすることで、調べすぎや比較の取り違えを防ぎます。"
                : "世界中・いつでも・よい数値・何でも、では判断の軸がありません。各条件を具体化しましょう。"}
            </p>
            <p>
              実際のDeep
              Researchでも、調査開始前の「プランを編集」で修正できます。操作名や利用条件は下の公式情報と自分の画面で確認してください。
            </p>
          </>
        )}
        {r.step === 2 && (
          <>
            <p>
              模擬レポートの主張と原文を照合します。資料の種類だけで点数を付けず、使いたい主張を支えるかで判断してください。
            </p>
            <div
              className="study-source-buttons"
              role="group"
              aria-label="模擬出典を選ぶ"
            >
              {sources.slice(0, 7).map((s) => (
                <button
                  key={s.id}
                  aria-pressed={active.id === s.id}
                  onClick={() => inspect(s.id)}
                >
                  {s.kind}：{s.title}
                  {r.sourceAnswers[s.id] !== undefined
                    ? r.sourceAnswers[s.id] === s.judgment
                      ? "（理由を確認済み）"
                      : "（再確認）"
                    : ""}
                </button>
              ))}
            </div>
            <div className="lab-compare">
              <SourceView source={active} headingRef={sourceHeading} />
              <div className="study-source">
                <h3>確かめる主張</h3>
                <p>{active.claim}</p>
                <KnowledgeCheck
                  check={{
                    question: "この主張に、この資料をどう使う？",
                    options: sourceChoices,
                    answer: active.judgment,
                    reason: active.reason,
                  }}
                  value={r.sourceAnswers[active.id] ?? null}
                  onAnswer={(n) =>
                    mutate({
                      sourceAnswers: { ...r.sourceAnswers, [active.id]: n },
                    })
                  }
                />
              </div>
            </div>
          </>
        )}
        {r.step === 3 && (
          <>
            <p className="notice">
              教材用の模擬レポートです。ここにある数値や文章を実世界の情報として引用しないでください。
            </p>
            <h3>{t.short}のレポートを点検する</h3>
            {checks.map((c) => (
              <div className="study-source" key={c.id}>
                <h4>AIの主張例</h4>
                <blockquote>{c.claim}</blockquote>
                <button onClick={() => inspect(c.source)}>
                  根拠の原文を開く：
                  {sources.find((s) => s.id === c.source)?.title}
                </button>
                <KnowledgeCheck
                  check={c}
                  value={r.reportAnswers[c.id] ?? null}
                  onAnswer={(n) =>
                    mutate({ reportAnswers: { ...r.reportAnswers, [c.id]: n } })
                  }
                />
              </div>
            ))}
            <SourceView source={active} headingRef={sourceHeading} />
            <details>
              <summary>改善後のレポートと比較する</summary>
              <pre>{correctedReport(r.topic)}</pre>
            </details>
            <div className="notice">
              <h3>検証してから次の学習へ</h3>
              <p>
                計画の改善：{r.fixes.filter(Boolean).length} / 4<br />
                理由まで確認した出典：
                {
                  sources
                    .slice(0, 7)
                    .filter((s) => r.sourceAnswers[s.id] === s.judgment).length
                }{" "}
                / 7<br />
                レポートの問題判断：
                {
                  checks.filter((c) => r.reportAnswers[c.id] === c.answer)
                    .length
                }{" "}
                / 5
              </p>
              <p>
                条件の曖昧さを解消し、固定課題で理由まで確認すると、標本集計・観察資料・改善済みレポートを引き継げます。章の完了チェックは前提ではありません。引き継ぐと、第4章の資料と固定課題の選択をこのテーマで置き換えます（章完了は変わりません）。「検証済み」は教材内の課題についての記録です。
              </p>
              {conditionWarnings(r.conditions).length > 0 && (
                <div role="status">
                  <ul>
                    {conditionWarnings(r.conditions).map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                  <button onClick={() => go(0)}>体験1の条件を見直す</button>
                </div>
              )}
              <button
                className="primary"
                disabled={!researchReady(r)}
                onClick={() => {
                  copy.invalidate();
                  onTransfer();
                }}
              >
                この調査をNotebookで学ぶ →
              </button>
              <p>教材内の模擬連携です。Googleサービスへ資料を送信しません。</p>
            </div>
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
      <p className="small">
        現在の条件でのコピー成功記録：
        {r.copied ? "あり（調査実行とは別）" : "なし"}
        。開始済みのOSクリップボードへの書き込み自体は取り消せません。
      </p>
    </div>
  );
}
