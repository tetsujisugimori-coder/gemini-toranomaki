import { useRef, useState } from "react";
import { useStudyCopy } from "./StudyShared";
import {
  artifacts,
  audiences,
  axes,
  capstoneReferences,
  capstoneSteps,
  hints,
  improvements,
  planItems,
  promptItems,
  qualityLabels,
  requirements,
  topicFor,
  topics,
  verdicts,
  versionNames,
  type Topic,
  type Version,
} from "./capstone-data";
import {
  answerCorrect,
  artifactFeatures,
  capstonePrompt,
  evidenceOptions,
  notebookText,
  promptIdentity,
  qualityCase,
  qualityReady,
  stageFeedback,
  stageReady,
} from "./capstone-engine";
import {
  changeAssignment,
  freshCapstone,
  invalidateFrom,
  loadCapstone,
  removeCapstone,
  sanitizeCapstone,
  saveCapstone,
  type CapstoneRecord,
  type QualityAnswer,
} from "./capstone-storage";
function Choice({
  label,
  value,
  options,
  onChange,
  empty = false,
}: {
  label: string;
  value: number;
  options: readonly string[];
  onChange: (n: number) => void;
  empty?: boolean;
}) {
  return (
    <div className="cap-field">
      <label>
        {label}
        <select
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        >
          {empty && <option value={-1}>選んでください</option>}
          {options.map((o, i) => (
            <option key={i} value={i}>
              {o}
            </option>
          ))}
        </select>
      </label>
      {value >= 0 && (
        <p className="cap-selection">選択内容：{options[value]}</p>
      )}
    </div>
  );
}
function Checks({
  legend,
  values,
  options,
  onChange,
}: {
  legend: string;
  values: number[];
  options: string[];
  onChange: (values: number[]) => void;
}) {
  return (
    <fieldset>
      <legend>{legend}</legend>
      {options.map((o, i) => (
        <label className="cap-check" key={o}>
          <input
            type="checkbox"
            checked={values.includes(i)}
            onChange={(e) =>
              onChange(
                e.target.checked
                  ? [...values, i]
                  : values.filter((n) => n !== i),
              )
            }
          />
          {o}
        </label>
      ))}
    </fieldset>
  );
}
function Sources({ r }: { r: CapstoneRecord }) {
  const t = topicFor(r.topic);
  return (
    <div className="cap-sources">
      <p className="badge">全資料は教材用の架空資料・実在しません</p>
      {[t.primary, t.appendix, "出所不明のメモ（架空）"].map((name, i) => (
        <details key={name} open={i < 2}>
          <summary>
            S{i + 1} {name}
          </summary>
          <p>
            作成者：教材内の架空記録者／作成日：
            {i === 0 ? t.sourceDate : i === 1 ? t.otherDate : "不明"}
            ／対象：このテーマの記録のみ
          </p>
          <blockquote>
            {i === 0
              ? t.original
              : i === 1
                ? t.supplement
                : t.unsupported + "。出典・比較方法は記載なし。"}
          </blockquote>
        </details>
      ))}
    </div>
  );
}
function Artifact({
  r,
  version,
  onTrial,
}: {
  r: CapstoneRecord;
  version: Version;
  onTrial: (v: Version) => void;
}) {
  const t = topicFor(r.topic),
    [answer, setAnswer] = useState(-1),
    [result, setResult] = useState(""),
    [attempted, setAttempted] = useState<number[]>([]);
  const initial = version === "initial",
    features = artifactFeatures(r, version);
  return (
    <section
      className="cap-artifact"
      aria-label={`${versionNames[version]}の成果物`}
    >
      <p className="badge">固定模擬成果物 · {versionNames[version]}</p>
      <p>
        {artifacts[r.artifact]}／{audiences[r.audience]}
      </p>
      <h4>{t.title}</h4>
      <p>{t.purpose}</p>
      <p>
        {initial
          ? t.wrong
          : r.sources.includes(0)
            ? t.fact
            : "S1未選択：事実は保留"}
        。
      </p>
      <p>{r.sources.includes(0) ? t.second : "S1未選択：数値は保留"}。</p>
      {initial ? <p>{t.unsupported}。</p> : <p>断定を避ける：{t.scope}。</p>}
      {features.references && (
        <p>
          出典：S1「{t.primary}」、S2「{t.appendix}」。原文は資料パネルで確認。
        </p>
      )}
      {features.limits && (
        <p>対象範囲・制約：{t.scope}。追加の比較調査は未実施。</p>
      )}
      {r.artifact === 2 && (
        <p>
          提案：この記録の範囲で小さく試し、別条件の資料を集めてから拡張する。
        </p>
      )}
      {features.quiz && (
        <fieldset>
          <legend>{t.question}</legend>
          {t.options.map((o, i) => (
            <label className="cap-check" key={o}>
              <input
                type="radio"
                name={`cap-quiz-${version}`}
                checked={answer === i}
                onChange={() => {
                  setAnswer(i);
                  setResult("");
                }}
              />
              {o}
            </label>
          ))}
          <button
            onClick={() => {
              setAnswer(-1);
              setResult("");
            }}
          >
            回答を未選択に戻す
          </button>{" "}
          <button
            onClick={() => {
              const next = [...new Set([...attempted, answer])];
              setAttempted(next);
              if (next.includes(-1) && next.includes(0) && next.includes(1))
                onTrial(version);
              if (features.explanation)
                setResult(
                  answer < 0
                    ? "回答を選んでください。"
                    : answer === t.correct
                      ? `正解。S1では${t.answer}と確認できます。`
                      : `不正解。S1では${t.answer}。原文を読み直しましょう。`,
                );
            }}
          >
            回答を確認
          </button>
          <p role="status" aria-atomic="true">
            {result || "（結果未表示）"}
          </p>
          <p className="small">
            検査した入力：
            {attempted
              .map((n) => (n < 0 ? "未回答" : t.options[n]))
              .join("／") || "まだありません"}
            。未回答・正答・誤答を同じ条件で試してください。操作履歴は正しく動いた証明ではありません。
          </p>
        </fieldset>
      )}
    </section>
  );
}
export function Capstone({
  completed,
  onComplete,
}: {
  completed: boolean;
  onComplete: (v: boolean) => boolean;
}) {
  const [boot] = useState(loadCapstone),
    [r, setR] = useState(boot.record),
    [available, setAvailable] = useState(boot.available),
    [message, setMessage] = useState(""),
    [hint, setHint] = useState(0),
    [custom, setCustom] = useState(""),
    [reflection, setReflection] = useState(""),
    [confirm, setConfirm] = useState(false),
    [epoch, setEpoch] = useState(0),
    [compareView, setCompareView] = useState(0),
    [snapshot, setSnapshot] = useState<{
      sources: number[];
      text: string;
    } | null>(null);
  const preserveStored = useRef(boot.protected);
  const latest = useRef(r),
    copy = useStudyCopy(),
    customRef = useRef(custom),
    heading = useRef<HTMLHeadingElement>(null),
    resetButton = useRef<HTMLButtonElement>(null);
  function update(next: CapstoneRecord) {
    const n = sanitizeCapstone(next);
    if (
      promptIdentity(n, customRef.current) !==
      promptIdentity(latest.current, customRef.current)
    )
      copy.invalidate();
    latest.current = n;
    setR(n);
    setAvailable(preserveStored.current ? false : saveCapstone(n));
  }
  function patch(p: Partial<CapstoneRecord>) {
    update({ ...latest.current, ...p });
  }
  function edit(from: number, p: Partial<CapstoneRecord>) {
    update(invalidateFrom(latest.current, from, p));
    setMessage(
      "条件が変わったため、この工程以降の現在の確認を解除しました。過去の達成・コピー履歴は保持しています。",
    );
  }
  function assignment(p: Partial<CapstoneRecord>) {
    update(changeAssignment(latest.current, p));
    setSnapshot(null);
    setCustom("");
    customRef.current = "";
    setReflection("");
    setEpoch((n) => n + 1);
    setMessage(
      "課題条件を変更しました。過去の学習履歴を残し、現在の検証・外部操作の状態を解除しました。",
    );
  }
  function go(step: number) {
    patch({ step, visited: [...latest.current.visited, step] });
    setHint(0);
    setMessage("");
    setConfirm(false);
    requestAnimationFrame(() => heading.current?.focus());
  }
  function trial(v: Version) {
    patch({ trials: [...latest.current.trials, v] });
  }
  const t = topicFor(r.topic),
    text = capstonePrompt(r, custom),
    identity = promptIdentity(r, custom),
    showPrompt = [2, 3, 4, 6].includes(r.step);
  function quality(i: number, p: Partial<QualityAnswer>) {
    const old = latest.current,
      v = old.version;
    patch({
      quality: {
        ...old.quality,
        [v]: old.quality[v].map((a, n) => (n === i ? { ...a, ...p } : a)),
      },
      achieved: old.achieved.filter((n) => n < (v === "initial" ? 5 : 6)),
      ratings: Array(6).fill(-1),
      reasons: Array(6).fill(-1),
    });
  }
  function artifactsView() {
    return (
      <>
        <Choice
          label="検査する版"
          value={["initial", "repair", "final"].indexOf(r.version)}
          options={[
            versionNames.initial,
            versionNames.repair,
            versionNames.final,
          ]}
          onChange={(n) => {
            if (n > 0 && !latest.current.applied) {
              setMessage(
                "STEP 6で修正指示を適用してから、修正版を検査してください。",
              );
              return;
            }
            patch({
              version: (["initial", "repair", "final"] as Version[])[n],
            });
            setEpoch((e) => e + 1);
          }}
        />
        <p>
          各版は固定の誤り事例です。よい指示を出しても自動で正しい成果物になるとは限りません。
        </p>
        <div
          className="cap-panel-switch"
          role="group"
          aria-label="比較パネルの表示"
        >
          {["両方を比較", "初版を見る", "検査する版を見る"].map((s, i) => (
            <button
              key={s}
              aria-pressed={compareView === i}
              onClick={() => setCompareView(i)}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="cap-comparison">
          {r.version !== "initial" && compareView !== 2 && (
            <Artifact
              key={`${epoch}-original`}
              r={r}
              version="initial"
              onTrial={trial}
            />
          )}
          {(r.version === "initial" || compareView !== 1) && (
            <Artifact
              key={`${epoch}-${r.version}`}
              r={r}
              version={r.version}
              onTrial={trial}
            />
          )}
        </div>
      </>
    );
  }
  return (
    <div className="capstone">
      <p className="notice">
        課題設定 → 調査 → 資料整理 → 制作 → 検証 → 改善 →
        振り返り。固定データの模擬演習です。実サービスは任意で、外部の結果は教材から検証できません。全10章の区切りの後も、新しい演習・機能変更への対応を続けます。
      </p>
      {!available && (
        <p role="alert">
          保存できないか、保存データが破損しています。画面内では続けられますが、再読み込みで変更が失われたり古い記録が復活する場合があります。
          {preserveStored.current &&
            " 元の保存データは保持し、現在の達成へ転用せず、自動で上書きしません。記録保存を再開する場合は第10章の記録だけを確認付きで初期化してください。"}
        </p>
      )}
      <section className="cap-toolbar panel" aria-label="総合演習の現在位置">
        <Choice
          label="総合演習の工程"
          value={r.step}
          options={capstoneSteps.map((s, i) => `STEP ${i} ${s}`)}
          onChange={go}
        />
        <Choice
          label="演習方法"
          value={r.mode}
          options={["模擬演習だけで進める", "模擬＋任意の実サービス演習"]}
          onChange={(n) => patch({ mode: n })}
        />
        <p>
          現在位置 STEP {r.step} / 7 · 閲覧記録 {r.visited.length}/8 ·
          現在の模擬確認 {r.achieved.length}/8
        </p>
        <progress
          max={8}
          value={r.achieved.length}
          aria-label="現在の模擬課題の確認数"
        />
        <p className="small">
          工程への移動は達成や外部操作の成功を意味しません。どの工程からでも再挑戦できます。
        </p>
      </section>
      <h2 id="capstone-heading" tabIndex={-1} ref={heading}>
        STEP {r.step} {capstoneSteps[r.step]}
      </h2>
      <div className="cap-workspace">
        <div className="cap-main">
          {r.step === 0 && (
            <>
              <Choice
                label="教材とサービスの配置"
                value={r.environment}
                options={[
                  "PC：ブラウザの分割表示",
                  "PC：別ウィンドウ",
                  "PC：別タブ",
                  "スマートフォン：タブ・アプリ切替",
                ]}
                onChange={(n) => patch({ environment: n })}
              />
              <p>
                {
                  [
                    "ブラウザの標準分割機能で左に教材、右にGeminiを置きます。分割機能がない場合は別ウィンドウを選べます。",
                    "教材とGeminiを別ウィンドウで開き、左右に並べます。",
                    "教材のタブを残し、Geminiを別タブで開きます。",
                    "指示文をコピー→外部アプリ・タブへ移動→教材のタブに戻る→上部のSTEPと現在の確認数を確認します。再読み込みしても固定条件は復元します。自由記述は消えます。",
                  ][r.environment]
                }
              </p>
              <ol>
                <li>教材の現在位置を確認する。</li>
                <li>
                  実操作する場合だけ、別タブの利用条件とアカウントを確認する。
                </li>
                <li>
                  機能が利用できなければ模擬演習を続ける。契約・アップロードは不要。
                </li>
              </ol>
              <p>
                教材はブラウザを分割・埋込みせず、Googleへのログイン、OAuth、メール送信、API実行、ファイルアップロードも行いません。
              </p>
            </>
          )}
          {r.step === 1 && (
            <>
              <label className="cap-field">
                演習テーマ
                <select
                  value={r.topic}
                  onChange={(e) =>
                    assignment({ topic: e.target.value as Topic })
                  }
                >
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
              <p>
                <strong>目的：</strong>
                {t.purpose}
              </p>
              <p>
                <strong>対象：</strong>
                {t.audience}
              </p>
              <Choice
                label="対象読者の調整"
                value={r.audience}
                options={audiences}
                onChange={(n) => assignment({ audience: n })}
              />
              <Choice
                label="成果物の形式"
                value={r.artifact}
                options={artifacts}
                onChange={(n) => assignment({ artifact: n })}
              />
              <Checks
                legend="完成条件（最後に再利用します）"
                values={r.requirements}
                options={requirements}
                onChange={(values) => assignment({ requirements: values })}
              />
              <label className="cap-field">
                追加の目的・完成条件（この画面だけ）
                <textarea
                  value={custom}
                  maxLength={1000}
                  onChange={(e) => {
                    copy.invalidate();
                    customRef.current = e.target.value;
                    setCustom(e.target.value);
                    update(invalidateFrom(latest.current, 4));
                  }}
                />
              </label>
              <p className="small">
                自由記述は保存しません。固定模擬の採点対象外なので、独自の条件は最後に自分で評価してください。
              </p>
            </>
          )}
          {r.step === 2 && (
            <>
              <p>
                曖昧な依頼「このテーマを調べて」では、対象時期・資料条件・事実と推測の区別が不足します。
              </p>
              <Choice
                label="計画を見る前の予想"
                value={r.prediction}
                empty
                options={[
                  "範囲と根拠が不足しそう",
                  "日付の確認が必要そう",
                  "比較・反証が足りなそう",
                ]}
                onChange={(n) => edit(2, { prediction: n })}
              />
              <div className="cap-comparison">
                <section>
                  <h3>計画原案</h3>
                  <p>
                    ネットで評判を集め、良い話を選び、紹介する。時期・対象・原資料は指定しない。
                  </p>
                </section>
                <section>
                  <h3>改善した計画</h3>
                  <Checks
                    legend="追加する調査条件"
                    values={r.plan}
                    options={planItems}
                    onChange={(v) =>
                      edit(2, {
                        plan: v,
                        prediction: latest.current.prediction,
                      })
                    }
                  />
                  <ol>
                    {r.plan.map((i) => (
                      <li key={i}>{planItems[i]}</li>
                    ))}
                  </ol>
                </section>
              </div>
              <button
                onClick={() => {
                  if (r.prediction < 0) {
                    setMessage("予想を選んでから模擬調査を実行してください。");
                    return;
                  }
                  patch({ researched: true });
                  setMessage(
                    "予想を残して固定の調査結果を表示しました。実Deep Researchは実行していません。",
                  );
                }}
              >
                模擬調査を実行
              </button>
              {r.researched && (
                <section>
                  <h3>予想と結果を比較</h3>
                  <p>
                    予想：
                    {
                      [
                        "範囲と根拠が不足しそう",
                        "日付の確認が必要そう",
                        "比較・反証が足りなそう",
                      ][r.prediction]
                    }
                    。計画を改善しても、以下の結果に誤りが残っています。
                  </p>
                  {[t.wrong, t.unsupported, t.second].map((claim, i) => (
                    <fieldset key={claim}>
                      <legend>調査結果の主張{i + 1}</legend>
                      <p>
                        {claim}。引用：{i === 1 ? "出典なし" : "S1"}
                      </p>
                      <Choice
                        label={`主張${i + 1}と原文の関係`}
                        value={r.research[i]}
                        empty
                        options={[
                          "原文が支持する",
                          "原文と不一致",
                          "情報不足・断定できない",
                        ]}
                        onChange={(n) =>
                          edit(2, {
                            prediction: latest.current.prediction,
                            researched: true,
                            research: latest.current.research.map((a, j) =>
                              j === i ? n : a,
                            ),
                          })
                        }
                      />
                      {r.research[i] >= 0 && (
                        <p role="status">
                          {r.research[i] === [1, 2, 0][i]
                            ? "照合できました。"
                            : "原文に戻って確認してください。"}{" "}
                          {i === 0
                            ? `S1は「${t.fact}」。`
                            : i === 1
                              ? "比較対象と原資料がなく、その結論は出せません。"
                              : `S1は「${t.second}」。`}
                        </p>
                      )}
                    </fieldset>
                  ))}
                </section>
              )}
            </>
          )}
          {r.step === 3 && (
            <>
              <p>
                同じ質問「何が分かり、何が分からないか」を、資料を変える前後で比べます。
              </p>
              <Checks
                legend="参照する資料"
                values={r.sources}
                options={[
                  `S1 ${t.primary}`,
                  `S2 ${t.appendix}`,
                  "S3 出所不明のメモ",
                ]}
                onChange={(v) => edit(3, { sources: v })}
              />
              <button
                onClick={() => {
                  setSnapshot({
                    sources: [...r.sources],
                    text: notebookText(r),
                  });
                  setMessage(
                    "変更前の回答を画面内に記録しました。資料を追加・除外して比較してください。",
                  );
                }}
              >
                変更前の回答を残す
              </button>
              <div className="cap-comparison">
                <section>
                  <h3>変更前</h3>
                  <pre>
                    {snapshot?.text ?? "変更前の回答をまだ残していません。"}
                  </pre>
                </section>
                <section>
                  <h3>現在の資料からの回答</h3>
                  <pre>{notebookText(r)}</pre>
                </section>
              </div>
              <button
                onClick={() => {
                  if (
                    !snapshot ||
                    JSON.stringify(snapshot.sources) ===
                      JSON.stringify(r.sources)
                  ) {
                    setMessage(
                      "変更前の回答を残し、参照資料を1つ変えてください。",
                    );
                    return;
                  }
                  patch({ compared: true });
                  setMessage(
                    "資料の追加・除外で根拠と保留が変わることを確認しました。必要なS1/S2を揃え、未確認メモを除外して整理してください。",
                  );
                }}
              >
                資料変更の比較を記録
              </button>
              <p>
                学習ガイド：{t.title}の要点→根拠S1/S2→{t.scope}
                →確認問題、の順に整理します。
              </p>
              <p>誤回答例：「{t.unsupported}」とS1を引用しました。</p>
              <Choice
                label="Notebookの誤回答への判断"
                value={r.notebook}
                empty
                options={[
                  "引用番号があるので採用",
                  "見栄えのよい要約なら採用",
                  "原文にない主張を除き、追加資料が必要と説明",
                ]}
                onChange={(n) =>
                  edit(3, { notebook: n, compared: latest.current.compared })
                }
              />
              {r.notebook >= 0 && (
                <p role="status">
                  {r.notebook === 2
                    ? "原文にない比較・一般化を発見できました。"
                    : "引用番号の有無と、原文が支持するかを分けてください。"}
                </p>
              )}
            </>
          )}
          {r.step === 4 && (
            <>
              <p>
                最初から完成品を出す前に、制作の依頼を組み立てます。「作って」だけの指示と比較してください。
              </p>
              <Checks
                legend="制作指示に含める要素"
                values={r.prompt}
                options={promptItems}
                onChange={(v) => edit(4, { prompt: v })}
              />
              <ul>
                {r.requirements.map((i) => (
                  <li key={i}>
                    {requirements[i]} →{" "}
                    {r.prompt.includes(i === 0 ? 1 : 2)
                      ? "制作指示に含む"
                      : "制作指示に未反映"}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => {
                  patch({ created: true, version: "initial" });
                  setEpoch((n) => n + 1);
                  setMessage(
                    "組み立てた依頼と照合するため、誤りを含む固定初版を表示しました。AI生成はしていません。",
                  );
                }}
              >
                固定初版を制作して比較する
              </button>
              {r.created && (
                <Artifact key={epoch} r={r} version="initial" onTrial={trial} />
              )}
            </>
          )}
          {[5, 6].includes(r.step) && (
            <>
              {!r.created ? (
                <p className="notice">
                  まだ初版がありません。STEP 4で制作指示を組み立ててください。
                </p>
              ) : (
                <>
                  {r.step === 6 && (
                    <>
                      <p>
                        問題発見 → 修正指示 → 修正版確認 →
                        再検証。回数を増やすためでなく完成条件を満たすために修正します。
                      </p>
                      <Choice
                        label="修正指示の具体性"
                        value={r.repairStyle}
                        options={[
                          "直して（曖昧）",
                          "問題・期待結果・維持条件・再検証を指定",
                        ]}
                        onChange={(n) => edit(6, { repairStyle: n })}
                      />
                      <button
                        onClick={() => {
                          if (r.repairStyle === 0) {
                            setMessage(
                              "曖昧な指示では修正範囲と維持条件を判断できません。依頼を改善してください。",
                            );
                            return;
                          }
                          patch({ applied: true, version: "repair" });
                          setEpoch((n) => n + 1);
                          setMessage(
                            "修正版1を表示しました。直った部分と悪化した部分を同じ条件で調べてください。",
                          );
                        }}
                      >
                        修正指示を適用
                      </button>
                      {r.applied && (
                        <button
                          onClick={() => {
                            patch({ version: "final" });
                            setEpoch((n) => n + 1);
                            setMessage(
                              "再修正版を表示しました。成功報告でなく原文と3つの入力で再検証してください。",
                            );
                          }}
                        >
                          退行も直した再修正版を確認
                        </button>
                      )}
                    </>
                  )}
                  {artifactsView()}
                  {r.step === 6 && (
                    <details>
                      <summary>問題発見・改善の記録</summary>
                      {(["initial", "repair", "final"] as Version[]).map(
                        (v) => (
                          <section key={v}>
                            <h4>{versionNames[v]}</h4>
                            <ul>
                              {r.quality[v].map((a, i) =>
                                a.checked && answerCorrect(r, v, i, a) ? (
                                  <li key={i}>
                                    {qualityLabels[i]}：{verdicts[a.verdict]}
                                    。根拠：
                                    {evidenceOptions(r, v, i)[a.evidence]}
                                    。改善案：{improvements[a.improvement]}
                                  </li>
                                ) : null,
                              )}
                            </ul>
                          </section>
                        ),
                      )}
                    </details>
                  )}
                  <h3>10観点の品質チェック：{versionNames[r.version]}</h3>
                  <p>
                    AIからの報告「すべて成功しました」は検証の証拠にしません。目的と完成条件、資料の原文、実際の操作を根拠に選びます。情報不足・対象外は保留とし、適合数に含めません。
                  </p>
                  {qualityLabels.map((label, i) => {
                    const a = r.quality[r.version][i],
                      correct = answerCorrect(r, r.version, i, a),
                      c = qualityCase(r, r.version, i);
                    return (
                      <fieldset
                        className="cap-quality"
                        key={`${r.version}-${i}`}
                      >
                        <legend>
                          {i + 1}. {label}
                        </legend>
                        <Choice
                          label={`${i + 1} 判定`}
                          value={a.verdict}
                          empty
                          options={verdicts}
                          onChange={(n) =>
                            quality(i, { verdict: n, checked: false })
                          }
                        />
                        <Choice
                          label={`${i + 1} 根拠`}
                          value={a.evidence}
                          empty
                          options={evidenceOptions(r, r.version, i)}
                          onChange={(n) =>
                            quality(i, { evidence: n, checked: false })
                          }
                        />
                        <Choice
                          label={`${i + 1} 改善案`}
                          value={a.improvement}
                          empty
                          options={improvements}
                          onChange={(n) =>
                            quality(i, { improvement: n, checked: false })
                          }
                        />
                        <button onClick={() => quality(i, { checked: true })}>
                          {i + 1} 根拠を照合
                        </button>
                        <p role="status">
                          {a.checked
                            ? correct
                              ? `固定資料との照合OK。${c.reason}`
                              : `再確認：${c.reason} 原文・現在の版・実際の操作を確かめ、根拠と改善案を考え直してください。`
                            : "未照合"}
                        </p>
                      </fieldset>
                    );
                  })}
                  <p>
                    現在の版で根拠を照合できた項目：
                    {
                      r.quality[r.version].filter(
                        (a, i) =>
                          a.checked && answerCorrect(r, r.version, i, a),
                      ).length
                    }
                    /10。適合と保留は別です。
                  </p>
                </>
              )}
            </>
          )}
          {r.step === 7 && (
            <>
              <h3>最初の完成条件を再確認</h3>
              <p>
                {t.purpose}／{audiences[r.audience]}／{artifacts[r.artifact]}
              </p>
              <ul>
                {r.requirements.map((i) => (
                  <li key={i}>{requirements[i]}</li>
                ))}
              </ul>
              <p>
                今回だけの追加条件：
                {custom || "なし（自由記述は再読み込みで消えます）"}
                。固定採点は追加条件を評価しません。
              </p>
              {axes.map((axis, i) => (
                <fieldset key={axis}>
                  <legend>{axis}</legend>
                  <p>
                    固定教材の根拠：STEP {[1, 2, 3, 4, 6, 7][i]}の現在の確認は
                    {r.achieved.includes([1, 2, 3, 4, 6, 7][i])
                      ? "記録あり"
                      : "未記録"}
                    。
                    {i === 3
                      ? `再修正版の全根拠照合：${qualityReady(r, "final") ? "済み" : "未完了"}。`
                      : ""}
                    自己評価は能力の自動認定ではありません。
                  </p>
                  <Choice
                    label={`${axis}の自己評価`}
                    value={r.ratings[i]}
                    empty
                    options={[
                      "説明に助けが必要",
                      "根拠を見ながら説明できる",
                      "根拠と制約を自分で説明できる",
                    ]}
                    onChange={(n) =>
                      patch({
                        ratings: latest.current.ratings.map((a, j) =>
                          j === i ? n : a,
                        ),
                        achieved: latest.current.achieved.filter(
                          (n) => n !== 7,
                        ),
                      })
                    }
                  />
                  <Choice
                    label={`${axis}の評価理由`}
                    value={r.reasons[i]}
                    empty
                    options={[
                      "原文・比較結果を示せる",
                      "一部は情報不足で追加確認が必要",
                      "判断の根拠をまだ説明しにくい",
                    ]}
                    onChange={(n) =>
                      patch({
                        reasons: latest.current.reasons.map((a, j) =>
                          j === i ? n : a,
                        ),
                        achieved: latest.current.achieved.filter(
                          (n) => n !== 7,
                        ),
                      })
                    }
                  />
                  <p>
                    改善余地：
                    {r.reasons[i] === 0
                      ? "別の条件や資料でも同じ判断を説明してみる。"
                      : r.reasons[i] === 1
                        ? "不足資料を特定し、断定を保留する。"
                        : "該当工程に戻り、原文と変更点を説明してみる。"}
                  </p>
                  <button onClick={() => go([1, 2, 3, 4, 6, 3][i])}>
                    この軸の工程へ戻る
                  </button>
                </fieldset>
              ))}
              <label className="cap-field">
                次に試すこと・自分の言葉で振り返る（保存しません）
                <textarea
                  maxLength={2000}
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                />
              </label>
              <p>
                全10章は現在の学習シリーズの区切りです。機能変更に合わせた確認、新しいテーマ・教材改善は今後も続けます。
              </p>
              <label className="cap-check">
                <input
                  type="checkbox"
                  checked={completed}
                  onChange={(e) => onComplete(e.target.checked)}
                />
                第10章の学習完了を自己申告する
              </label>
              <p className="small">
                模擬の達成、外部操作、自己評価とは独立した既存の章完了記録です。
              </p>
            </>
          )}
        </div>
        <aside className="cap-context panel" aria-label="課題と資料">
          <h3>今回の課題</h3>
          <p>{t.title}</p>
          <p>{t.purpose}</p>
          <p>
            {artifacts[r.artifact]}／{audiences[r.audience]}
          </p>
          <h4>完成条件</h4>
          <ul>
            {r.requirements.map((i) => (
              <li key={i}>{requirements[i]}</li>
            ))}
          </ul>
          {r.requirements.length === 0 && (
            <p>追加条件なし。根拠の正確性と個人情報の確認は省略しません。</p>
          )}
          {r.step >= 2 && <Sources r={r} />}
          <p className="small">
            第3・4章：調査と資料整理、第6章：試作と検証、第9章：再利用する指示の考え方を応用。Skillsでこれらの機能が自動実行されるとは案内しません。
          </p>
        </aside>
      </div>
      {showPrompt && (
        <section className="panel" aria-label="組み立てた指示文">
          <h3>指示文を読み、足りない条件を確認</h3>
          <label className="cap-field">
            指示文全文
            <textarea readOnly rows={10} value={text} />
          </label>
          <button
            disabled={copy.busy}
            onClick={() =>
              void copy.copy(
                text,
                () => {
                  const current = latest.current;
                  patch({
                    copied: [
                      ...current.copied,
                      `${current.topic}:${current.step}`,
                    ],
                  });
                },
                () =>
                  promptIdentity(latest.current, customRef.current) ===
                  identity,
              )
            }
          >
            指示文全文をコピー
          </button>
          <p role="status" aria-atomic="true">
            {copy.message}
          </p>
          <p className="small">
            失敗時は全文を選択して手動コピー。表示・条件・工程の変更後は古い通知を引き継ぎません。OSへの書込み自体は取消できません。
          </p>
        </section>
      )}
      <section className="cap-help panel">
        <h3>段階的ヒント（任意）</h3>
        <button
          disabled={hint === 2}
          onClick={() => setHint((n) => Math.min(2, n + 1))}
        >
          ヒントを1段階開く
        </button>
        {hints[r.step].slice(0, hint).map((s) => (
          <p key={s}>{s}</p>
        ))}
      </section>
      {r.mode === 1 && (
        <section className="panel">
          <h3>任意の実サービス演習</h3>
          <p>
            外部操作は自己申告です。模擬確認や教材のボタン操作から実成功へ昇格しません。
          </p>
          <nav aria-label="総合演習の外部サービス">
            <a
              href="https://gemini.google.com/"
              target="_blank"
              rel="noreferrer"
            >
              Geminiを別タブで開く ↗
            </a>
            <a
              href="https://notebook.google.com/"
              target="_blank"
              rel="noreferrer"
            >
              Gemini Notebookを別タブで開く ↗
            </a>
          </nav>
          <p>
            Deep
            Research：18歳以上・ログインが必要。計画を編集してから調査開始。日ごと・同時実行の上限とプラン差は各自の画面で確認します。無料枠で使えなくても模擬演習は続けられます。
          </p>
          <p>
            資料移動の手順：調査報告と原資料を照合→報告の共有・エクスポートからDocsへ出力または内容をコピー→ノートブックの資料追加でDocs／コピーしたテキストを選択→重要な原資料URLは別に追加して原文確認→確認したメモをCanvasの制作指示に手動で貼付。各機能の公式手順を組み合わせた案内で、一括転送や引用の完全保持は保証しません。
          </p>
          <p>
            Geminiアプリ内のノートブックと、独立サービスのGemini
            Notebook（旧NotebookLM）は入口が異なります。公式には接続時のノートブック変更の同期が案内されていますが、地域（EEAは手動接続）・提供状況・アクティビティ設定で差があります。すべてのチャット・調査報告・Canvasが自動で資料になるとは仮定しません。Gemini内のチャットはWebやツールも利用でき、資料だけに限定されるとは限りません。
          </p>
          <p>
            資料を更新・削除しても生成済みのStudio成果物は更新されません。Docsの脚注・コメントやURL先の画像・リンク先ページは取り込まれない場合があります。Canvasでは個人・機密情報を使わず非公開の文書・試作品を目標にします。共有リンクの公開や保存先の作成は本演習の操作対象外です。
          </p>
          <Choice
            label={`STEP ${r.step} 実サービスの現在の自己申告`}
            value={r.real[r.step]}
            options={[
              "未申告・未実施",
              "操作し、結果も自分で原文確認した（教材未検証）",
              "利用できず未実施",
              "確認できず保留",
            ]}
            onChange={(n) =>
              patch({
                real: latest.current.real.map((a, i) => (i === r.step ? n : a)),
              })
            }
          />
          <p className="small">
            公式本文確認：2026-11-06。実アカウント・日本語の実UIラベル・個別権限は未確認。
          </p>
          {capstoneReferences.map((ref) => (
            <p key={ref.url}>
              <a href={ref.url} target="_blank" rel="noreferrer">
                {ref.title} ↗
              </a>
            </p>
          ))}
        </section>
      )}
      <section className="panel">
        <button
          onClick={() => {
            const old = latest.current;
            if (stageReady(old, old.step))
              update({
                ...old,
                achieved: [...old.achieved, old.step],
                history: [...old.history, `${old.topic}:${old.step}`],
              });
            setMessage(stageFeedback(old));
          }}
        >
          この工程の固定課題を確認
        </button>
        <p role="status" aria-atomic="true">
          {message}
        </p>
        <button
          onClick={() => {
            copy.invalidate();
            update(invalidateFrom(latest.current, r.step));
            setEpoch((n) => n + 1);
            setHint(0);
            setMessage(
              "この工程以降の現在の確認を解除しました。過去の履歴・他章・章完了は保持しました。",
            );
          }}
        >
          この工程から再挑戦
        </button>
        <p>
          現在の模擬確認：
          {r.achieved.map((i) => `STEP ${i}`).join("／") || "なし"}
          。過去の達成履歴：{r.history.length}件。過去のコピー履歴：
          {r.copied.length}件。実操作自己申告：
          {r.real.filter((n) => n === 1).length}/8工程。成果物自己評価：
          {r.ratings.filter((n) => n >= 0).length}/6軸。
        </p>
      </section>
      <div className="cap-navigation">
        <button disabled={r.step === 0} onClick={() => go(r.step - 1)}>
          ← 前の工程
        </button>
        <button disabled={r.step === 7} onClick={() => go(r.step + 1)}>
          次の工程 →
        </button>
      </div>
      <section className="panel">
        <p>
          第10章だけの初期化は専用記録と第10章の完了を対象にします。下部の「進捗を初期化」は従来どおり全章の完了だけを対象にし、専用記録を消しません。
        </p>
        <button
          ref={resetButton}
          onClick={() => {
            copy.invalidate();
            setConfirm(true);
          }}
        >
          第10章の記録だけを初期化
        </button>
        {confirm && (
          <div role="group" aria-label="第10章の初期化確認">
            <p>
              第10章の条件・履歴・自己申告と章完了を削除します。他章の記録は保持します。
            </p>
            <button
              onClick={() => {
                copy.invalidate();
                const n = freshCapstone();
                latest.current = n;
                setR(n);
                setCustom("");
                customRef.current = "";
                setReflection("");
                setSnapshot(null);
                setEpoch((e) => e + 1);
                const dataOk = removeCapstone(),
                  progressOk = onComplete(false);
                preserveStored.current = !dataOk;
                setAvailable(dataOk);
                setConfirm(false);
                setMessage(
                  dataOk && progressOk
                    ? "第10章の記録と章完了を初期化しました。"
                    : "画面内は初期化しましたが、専用記録または章完了の保存領域の削除・更新に失敗しました。再読み込みで古い記録が復活する可能性があります。",
                );
                requestAnimationFrame(() => resetButton.current?.focus());
              }}
            >
              第10章だけ削除する
            </button>
            <button
              onClick={() => {
                setConfirm(false);
                resetButton.current?.focus();
              }}
            >
              初期化をキャンセル
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
