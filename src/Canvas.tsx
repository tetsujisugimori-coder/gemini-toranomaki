import { useRef, useState } from "react";
import { CanvasWorkshop } from "./CanvasWorkshop";
import { canvasJudgments, canvasTrialOptions } from "./canvas-workshop";
import { KnowledgeCheck } from "./Lab";
import { StudySteps, useStudyCopy } from "./StudyShared";
import {
  canvasChecks,
  canvasCopyKey,
  canvasPrompt,
  canvasReferences,
  promptLabels,
  quizFor,
  quizTopics,
  repairLabels,
  testCases,
  type CanvasSettings,
  type CanvasTest,
  type PromptKind,
  type QuizVersion,
} from "./canvas-data";
import {
  emptyQuiz,
  emptyRun,
  presetAnswers,
  setQuizAnswers,
  submitQuiz,
  type QuizSession,
} from "./canvas-engine";
import {
  freshCanvas,
  loadCanvas,
  removeCanvas,
  sanitizeCanvas,
  saveCanvas,
  visibleCanvasPrompt,
  type CanvasRecord,
} from "./canvas-storage";
export function Canvas({
  completed,
  onComplete,
}: {
  completed: boolean;
  onComplete: (value: boolean) => boolean;
}) {
  const [boot] = useState(loadCanvas),
    [r, setRecord] = useState(boot.record),
    [available, setAvailable] = useState(boot.available);
  const latest = useRef(r),
    copy = useStudyCopy(),
    workshopVersion = useRef(0);
  const [quiz, setQuiz] = useState(emptyQuiz),
    latestQuiz = useRef(quiz);
  const [prediction, setPrediction] = useState<number | null>(null),
    [trialPrediction, setTrialPrediction] = useState<number | null>(null);
  const [trialSnapshot, setTrialSnapshot] = useState<{
      prediction: number;
      observed: number | null;
    } | null>(null),
    [finding, setFinding] = useState(false),
    [hint, setHint] = useState(false),
    [workshopKey, setWorkshopKey] = useState(0);
  const [test, setTest] = useState<CanvasTest>("missing");
  const [prepared, setPreparedState] = useState<{
      id: CanvasTest;
      context: string;
      prediction: number;
      answers: QuizSession["answers"];
      submitted: boolean;
    } | null>(null),
    preparedRef = useRef(prepared);
  const [quizMessage, setQuizMessage] = useState(""),
    [message, setMessage] = useState(""),
    [resetting, setResetting] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null),
    prototypeHeading = useRef<HTMLHeadingElement>(null),
    gradeHeading = useRef<HTMLHeadingElement>(null),
    predictionHeading = useRef<HTMLLegendElement>(null),
    trialHeading = useRef<HTMLLegendElement>(null),
    resetButton = useRef<HTMLButtonElement>(null),
    questionHeads = useRef<(HTMLLegendElement | null)[]>([]);
  const topic = quizFor(r.topic),
    run = quiz.runs[r.version];
  const requireAll = r.version === "revised" && r.applied === "unanswered";
  const context = JSON.stringify([
    r.topic,
    r.audience,
    r.feedback,
    r.version,
    r.applied,
  ]);
  const caseData = testCases.find((c) => c.id === test)!;
  function session(next: QuizSession) {
    latestQuiz.current = next;
    setQuiz(next);
  }
  function preparedState(next: typeof prepared) {
    preparedRef.current = next;
    setPreparedState(next);
  }
  function forgetTest() {
    preparedState(null);
    setPrediction(null);
  }
  function identity(record: CanvasRecord) {
    const kind = visibleCanvasPrompt(record);
    return kind ? canvasCopyKey(kind, record, record.repair) : null;
  }
  function update(patch: Partial<CanvasRecord>) {
    const next = sanitizeCanvas({ ...latest.current, ...patch });
    if (identity(next) !== identity(latest.current)) copy.invalidate();
    latest.current = next;
    setRecord(next);
    const ok = saveCanvas(next);
    setAvailable(ok);
    return ok;
  }
  function settings<K extends keyof CanvasSettings>(
    key: K,
    value: CanvasSettings[K],
  ) {
    if (latest.current[key] === value) return;
    update({ [key]: value, applied: null, version: "initial" });
    session(emptyQuiz());
    forgetTest();
    setTrialPrediction(null);
    setTrialSnapshot(null);
    setFinding(false);
    setHint(false);
    setQuizMessage(
      "条件が変わったため、試作品の回答・点数・現在の検証を初期化しました。過去の学習履歴は保持しています。",
    );
  }
  function go(step: number) {
    if (step !== latest.current.step) update({ step });
    requestAnimationFrame(() => heading.current?.focus());
  }
  function version(value: QuizVersion) {
    if (value !== latest.current.version) {
      update({ version: value });
      setTrialSnapshot(null);
      forgetTest();
      setQuizMessage("");
    }
    requestAnimationFrame(() => prototypeHeading.current?.focus());
  }
  function answers(values: readonly unknown[]) {
    const old = latestQuiz.current,
      next = setQuizAnswers(old, values);
    if (next === old) return;
    session(next);
    setTrialSnapshot(null);
    forgetTest();
    setQuizMessage(
      Object.values(old.runs).some((v) => v.grade)
        ? "回答を変更したため、両版の旧結果を解除しました。再採点してください。"
        : "回答を更新しました。採点して動作を確かめましょう。",
    );
  }
  function history(event: string) {
    const current = latest.current,
      mode = current.version === "initial" ? "initial" : current.applied!;
    update({
      history: [
        ...new Set([...current.history, `${current.topic}:${mode}:${event}`]),
      ],
    });
  }
  function grade() {
    const current = latest.current,
      guard = current.version === "revised" && current.applied === "unanswered";
    const next = submitQuiz(
      latestQuiz.current,
      current.topic,
      current.version,
      guard,
    );
    session(next);
    if (current.version === "initial" && next.answers.includes(null)) {
      setFinding(true);
      if (
        next.answers.every((a) => a === null) &&
        trialSnapshot &&
        trialSnapshot.observed === null
      )
        setTrialSnapshot({
          ...trialSnapshot,
          observed: next.runs.initial.grade?.kind === "blocked" ? 0 : 1,
        });
    }
    setQuizMessage("");
    if (preparedRef.current) {
      if (
        preparedRef.current.context === context &&
        preparedRef.current.answers.every((a, i) => a === next.answers[i])
      )
        preparedState({ ...preparedRef.current, submitted: true });
      else forgetTest();
    }
    const outcome = next.runs[current.version];
    history(
      outcome.submissions > 1
        ? "repeat"
        : outcome.grade?.kind === "blocked"
          ? "blocked"
          : next.answers.includes(null)
            ? "incomplete-scored"
            : "scored",
    );
    requestAnimationFrame(() => gradeHeading.current?.focus());
  }
  function restart() {
    setTrialSnapshot(null);
    session({ ...emptyQuiz(), event: "restart" });
    setQuizMessage("やり直しました。回答・点数・未回答案内を消しました。");
    history("restart");
    if (preparedRef.current?.id !== "restart" || !preparedRef.current.submitted)
      forgetTest();
    requestAnimationFrame(() => questionHeads.current[0]?.focus());
  }
  function apply() {
    const old = latest.current;
    if (old.applied !== old.repair) {
      session({
        ...latestQuiz.current,
        runs: { ...latestQuiz.current.runs, revised: emptyRun() },
      });
      forgetTest();
    }
    if (old.applied !== old.repair || old.version !== "revised") {
      update({ applied: old.repair, version: "revised" });
      setTrialSnapshot(null);
      forgetTest();
      setQuizMessage(
        "選んだ修正を固定試作品へ反映しました。回答条件は同じまま、修正版の結果は別に確かめます。AIへの送信・生成ではありません。",
      );
    }
    requestAnimationFrame(() => prototypeHeading.current?.focus());
  }
  function prepare() {
    // A prepared verification owns its prediction and evidence until invalidated.
    if (preparedRef.current || prediction === null) return;
    const preset =
      test === "missing" || test === "restart"
        ? "partial"
        : test === "score"
          ? "mixed"
          : "correct";
    const values = presetAnswers(r.topic, preset);
    setTrialSnapshot(null);
    session({ ...emptyQuiz(), answers: values });
    preparedState({
      id: test,
      context,
      prediction,
      answers: values,
      submitted: false,
    });
    setQuizMessage(
      "予想を確定し、確認条件をセットしました。採点ややり直しを自分で操作してください。",
    );
    requestAnimationFrame(() => prototypeHeading.current?.focus());
  }
  function retryVerification() {
    // Clear both versions' results/counts; preserved answers are not evidence.
    session({ ...emptyQuiz(), answers: latestQuiz.current.answers });
    forgetTest();
    setQuizMessage(
      "再挑戦を始めます。以前の検証結果・両版の採点結果・実行回数を解除しました。予想を選び、確認条件をセットしてから実操作してください。",
    );
    requestAnimationFrame(() => predictionHeading.current?.focus());
  }
  function reset() {
    copy.invalidate();
    const next = freshCanvas();
    latest.current = next;
    setRecord(next);
    session(emptyQuiz());
    forgetTest();
    setTrialPrediction(null);
    setTrialSnapshot(null);
    setFinding(false);
    setHint(false);
    workshopVersion.current++;
    setWorkshopKey(workshopVersion.current);
    setTest("missing");
    setQuizMessage("");
    const removed = removeCanvas(),
      completion = onComplete(false);
    setAvailable(removed);
    setResetting(false);
    setMessage(
      removed && completion
        ? "第6章の記録と完了だけを初期化しました。"
        : "画面内の第6章を初期化しましたが、保存領域の更新に失敗しました。再読み込みで旧記録が戻る可能性があります。",
    );
    requestAnimationFrame(() => resetButton.current?.focus());
  }
  function promptView(kind: PromptKind) {
    const text = canvasPrompt(kind, r, r.repair),
      stamp = canvasCopyKey(kind, r, r.repair);
    return (
      <div className="panel">
        <h3>{promptLabels[kind]}の全文（固定の条件を反映）</h3>
        <pre
          className="service-prompt"
          tabIndex={0}
          aria-label={`${promptLabels[kind]}の全文`}
        >
          {text}
        </pre>
        <button
          className="primary"
          disabled={copy.busy}
          onClick={() =>
            void copy.copy(
              text,
              () =>
                update({
                  copied: [...new Set([...latest.current.copied, stamp])],
                }),
              () => identity(latest.current) === stamp,
            )
          }
        >
          {promptLabels[kind]}を全文コピー
        </button>
        <p>
          この本文の過去のコピー成功：
          {r.copied.includes(stamp) ? "あり（実行とは別）" : "なし"}
          。本文が変わる条件では別の記録です。OSクリップボードへの書込み自体は取り消せません。
        </p>
      </div>
    );
  }
  function prototype() {
    return (
      <section
        className={`canvas-prototype ${r.version === "revised" && r.applied === "appearance" ? "canvas-cosmetic" : ""}`}
        aria-label="教材用クイズ試作品"
      >
        <p>
          操作の練習用で、改善点を含む固定試作品です。結果は実際に操作して確かめます。実Googleの生成物や教材全体の不具合ではありません。
        </p>
        <span className="badge">
          教材用に用意した試作品・AI生成ではありません
        </span>
        <h3 ref={prototypeHeading} tabIndex={-1}>
          {!(finding || hint)
            ? r.version === "initial"
              ? "初期版：まず動作を観察しよう"
              : "修正版：同じ条件で動作を比べよう"
            : r.version === "initial"
              ? "初期版：未回答でも採点される改善課題あり"
              : r.applied === "unanswered"
                ? "修正版：未回答なら採点しない"
                : "修正版：見た目だけ（未回答の動作は未修正）"}
        </h3>
        <p>
          {r.audience === "beginner"
            ? "初めての人向け：1問ずつ、答えを一つ選びましょう。"
            : "復習向け：どの根拠で選んだかも考えましょう。"}{" "}
          3問・各3択・1問1点。
        </p>
        {r.version === "initial" && (finding || hint) && (
          <p className="notice">
            この枠内の初期版には、未回答でも点数を出す教材用の改善課題があります。教材本体の採点エラーではありません。
          </p>
        )}
        <div
          className="study-source-buttons"
          role="group"
          aria-label="比較する版"
        >
          <button
            aria-pressed={r.version === "initial"}
            onClick={() => version("initial")}
          >
            修正前：初期版
          </button>
          <button
            aria-pressed={r.version === "revised"}
            disabled={!r.applied}
            onClick={() => version("revised")}
          >
            修正後：修正版
          </button>
        </div>
        <p>
          回答は比較のため両版で共通です。採点結果は版ごとに計算します。回答を変えると両版の旧結果を解除します。
        </p>
        {topic.questions.map((q, i) => (
          <fieldset key={`${r.topic}-${i}`}>
            <legend
              ref={(el) => {
                questionHeads.current[i] = el;
              }}
              tabIndex={-1}
            >
              問題{i + 1}：{q.text}
            </legend>
            {q.options.map((option, j) => (
              <label className="option" key={option}>
                <input
                  type="radio"
                  name={`canvas-question-${i}`}
                  checked={quiz.answers[i] === j}
                  onChange={() =>
                    answers(
                      latestQuiz.current.answers.map((a, k) =>
                        k === i ? j : a,
                      ),
                    )
                  }
                />
                {option}
              </label>
            ))}
          </fieldset>
        ))}
        <div className="lab-actions">
          <button className="primary" onClick={grade}>
            採点する
          </button>
          <button onClick={restart}>やり直す</button>
        </div>
        {run.grade && (
          <div
            className="notice"
            role={run.grade.kind === "blocked" ? "alert" : "status"}
            aria-label="現在の版の採点結果"
          >
            <h4 ref={gradeHeading} tabIndex={-1}>
              {run.grade.kind === "blocked"
                ? "未回答があります。まだ採点していません。"
                : `採点結果：${run.grade.score} / 3点`}
            </h4>
            {run.grade.kind === "blocked" ? (
              <>
                <p>未回答：問題{run.grade.missing.join("、問題")}</p>
                <div className="lab-actions">
                  {run.grade.missing.map((i) => (
                    <button
                      key={i}
                      onClick={() => questionHeads.current[i - 1]?.focus()}
                    >
                      問題{i}へ移動
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p>
                  {quiz.answers.includes(null)
                    ? "未回答を不正解として採点しました。未回答検出はまだ動いていません。"
                    : "全問回答を正答データと照合しました。何度採点しても毎回3問から計算します。"}
                </p>
                <ol>
                  {topic.questions.map((q, i) => (
                    <li key={q.text}>
                      問題{i + 1}：
                      {quiz.answers[i] === q.answer
                        ? "正解"
                        : quiz.answers[i] === null
                          ? "未回答"
                          : "不正解"}
                      {r.feedback === "reason" ? `。${q.reason}` : ""}
                    </li>
                  ))}
                </ol>
              </>
            )}
          </div>
        )}
        <p role="status">{quizMessage}</p>
        <details>
          <summary>境界条件を手早くセットする（正解パターンを含む）</summary>
          <p>
            固定の選択肢を実際に選びます。結果を切り替えるボタンではありません。
          </p>
          <div className="study-source-buttons">
            {(
              [
                ["empty", "全問未回答"],
                ["partial", "一部回答"],
                ["mixed", "全問回答・1問正解"],
                ["correct", "全問正解"],
                ["wrong", "全問不正解"],
              ] as const
            ).map(([preset, label]) => (
              <button
                key={preset}
                onClick={() => answers(presetAnswers(r.topic, preset))}
              >
                {label}をセット
              </button>
            ))}
          </div>
        </details>
        <div className="lab-compare" aria-label="同じ回答条件での版別結果">
          {(["initial", "revised"] as const).map((v) => (
            <p key={v}>
              {v === "initial" ? "初期版" : "修正版"}：
              {!quiz.runs[v].grade
                ? "未採点"
                : quiz.runs[v].grade?.kind === "blocked"
                  ? "未回答のため保留"
                  : `${(quiz.runs[v].grade as { score: number }).score} / 3点`}
            </p>
          ))}
        </div>
      </section>
    );
  }
  let observed: number | null = null;
  if (
    prepared?.context === context &&
    prepared.id === test &&
    prepared.submitted &&
    (prepared.answers.every((a, i) => a === quiz.answers[i]) ||
      (test === "restart" && quiz.event === "restart"))
  ) {
    if (test === "missing" && run.grade)
      observed = run.grade.kind === "blocked" ? 1 : 0;
    if (test === "score" && run.grade?.kind === "scored")
      observed = run.grade.score === 0 ? 0 : run.grade.score === 1 ? 1 : 2;
    if (
      test === "repeat" &&
      run.submissions >= 2 &&
      run.grade?.kind === "scored"
    )
      observed = run.grade.score === 3 ? 0 : 1;
    if (test === "restart" && prepared.submitted && quiz.event === "restart")
      observed =
        quiz.answers.every((a) => a === null) &&
        Object.values(quiz.runs).every((v) => v.grade === null)
          ? 0
          : 1;
  }
  return (
    <div className="canvas-chapter">
      <aside className="notice">
        <strong>教材内の固定体験</strong>
        <p>
          ログイン・AI接続は不要です。自由なコードを入力/実行せず、外部送信もしません。実Gemini
          Canvasとは別の教材用試作品を操作します。
        </p>
      </aside>
      <StudySteps
        labels={[
          "動作を具体化する",
          "試作品を動かす",
          "修正を依頼する",
          "直ったことを確かめる",
        ]}
        step={r.step}
        onStep={go}
      />
      <div className="lab-compare">
        <label className="lab-field">
          クイズのテーマ
          <select
            value={r.topic}
            onChange={(e) =>
              settings("topic", e.target.value as CanvasSettings["topic"])
            }
          >
            {quizTopics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </label>
        <label className="lab-field">
          対象者
          <select
            value={r.audience}
            onChange={(e) =>
              settings("audience", e.target.value as CanvasSettings["audience"])
            }
          >
            <option value="beginner">初めて学ぶ人</option>
            <option value="review">復習する人</option>
          </select>
        </label>
        <label className="lab-field">
          採点後の結果表示
          <select
            value={r.feedback}
            onChange={(e) =>
              settings("feedback", e.target.value as CanvasSettings["feedback"])
            }
          >
            <option value="reason">点数・正誤・理由</option>
            <option value="score">点数・正誤</option>
          </select>
        </label>
      </div>
      <p className="small">
        試作品の回答・点数・現在の検証は一時データです。再読み込み/章離脱で消え、保存する過去の学習履歴とは別です。テーマ/対象者/結果表示の実変更は新しい構成として回答・修正反映・検証を初期化します。
      </p>
      <section aria-labelledby="canvas-step">
        <h2 id="canvas-step" ref={heading} tabIndex={-1}>
          体験{r.step + 1}：
          {
            [
              "作りたいものを具体化する",
              "試作品を動かす",
              "修正を依頼する",
              "直ったことを確かめる",
            ][r.step]
          }
        </h2>
        {canvasJudgments.some((c) => c.step === r.step) && (
          <section className="panel" aria-label="具体的な失敗から判断する">
            <h3>この場面なら、どう判断する？</h3>
            <p>
              まず自分で選んでみましょう。未回答のまま試作品へ進むこともできます。
            </p>
            {canvasJudgments
              .filter((c) => c.step === r.step)
              .map((c) => (
                <KnowledgeCheck
                  key={c.id}
                  check={{ ...c, options: [...c.options] }}
                  value={r.judgments[c.id] ?? null}
                  onAnswer={(v) =>
                    update({ judgments: { ...r.judgments, [c.id]: v } })
                  }
                />
              ))}
          </section>
        )}
        {r.step === 0 && (
          <>
            <p>
              「学習クイズを作って」だけだと、どんな動作が足りないでしょう。まず予想し、上の条件を選んでから指示を比べましょう。
            </p>
            <CanvasWorkshop
              key={workshopKey}
              isCurrent={() =>
                workshopVersion.current === workshopKey &&
                latest.current.step === 0
              }
              settings={r.timer}
              copied={r.timerCopied}
              onSettings={(timer) => update({ timer })}
              onHistory={(id) => {
                if (
                  workshopVersion.current !== workshopKey ||
                  latest.current.step !== 0
                )
                  return;
                if (!latest.current.timerHistory.includes(id))
                  update({
                    timerHistory: [...latest.current.timerHistory, id],
                  });
              }}
              onCopied={(id) =>
                update({
                  timerCopied: [
                    ...new Set([...latest.current.timerCopied, id]),
                  ],
                })
              }
            />
            <KnowledgeCheck
              check={{
                ...canvasChecks[0],
                options: [...canvasChecks[0].options],
              }}
              value={r.understanding.requirements ?? null}
              onAnswer={(v) =>
                update({
                  understanding: { ...r.understanding, requirements: v },
                })
              }
            />
            {r.understanding.requirements !== undefined && (
              <>
                <div className="lab-compare">
                  <div className="study-source">
                    <h3>曖昧な依頼</h3>
                    <p>学習クイズを作って。見やすく、使いやすくして。</p>
                  </div>
                  <div className="study-source">
                    <h3>具体化した動作</h3>
                    <p>
                      対象は
                      {r.audience === "beginner"
                        ? "初めて学ぶ人"
                        : "復習する人"}
                      。3問・各3択、一つずつ選ぶラジオ方式、1問1点/3点満点、
                      {r.feedback === "reason"
                        ? "理由も含む結果"
                        : "点数と正誤"}
                      、やり直しで全回答と表示を消します。
                    </p>
                  </div>
                </div>
                {promptView("create")}
                <p>
                  見た目の言葉だけでは、採点の条件ややり直しの動作は決まりません。第4章で資料から学習ガイドを作った考え方を、問いと動作の仕様へ発展させます。ここでは第4章のデータは転送しません。
                  <a href="#chapter-4">第4章を振り返る</a>
                </p>
              </>
            )}
          </>
        )}
        {r.step === 1 && (
          <>
            <p>
              「プレビュー」は試作品を表示して操作することです。まず、初期版で未回答のまま採点するとどうなるか予想しましょう。修正版を表示中なら、枠内の「修正前」を選んで試せます。
            </p>
            <fieldset disabled={trialSnapshot !== null}>
              <legend ref={trialHeading} tabIndex={-1}>
                初期版で全問未回答のまま採点したら？
              </legend>
              {canvasTrialOptions.map((v, i) => (
                <label className="option" key={v}>
                  <input
                    type="radio"
                    name="trial-prediction"
                    checked={trialPrediction === i}
                    onChange={() => {
                      if (!trialSnapshot) setTrialPrediction(i);
                    }}
                  />
                  {v}
                </label>
              ))}
            </fieldset>
            <button
              disabled={trialPrediction === null || trialSnapshot !== null}
              onClick={() => {
                if (trialPrediction === null || trialSnapshot) return;
                session(emptyQuiz());
                forgetTest();
                update({ version: "initial" });
                setFinding(false);
                setTrialSnapshot({
                  prediction: trialPrediction,
                  observed: null,
                });
                requestAnimationFrame(() => prototypeHeading.current?.focus());
              }}
            >
              予想を確定して試作品を開く
            </button>
            {trialSnapshot && (
              <p role="status">
                確定した事前予想：
                {canvasTrialOptions[trialSnapshot.prediction]}
                。変更するには初回実験をやり直してください。
              </p>
            )}
            {(trialPrediction !== null || trialSnapshot !== null) && (
              <details>
                <summary>ヒント：どの条件を試す？（任意）</summary>
                <p>
                  まず何も選ばず採点し、点数や案内が出るか観察しましょう。一部だけ回答した場合や、すべて回答した場合とも比べられます。
                </p>
              </details>
            )}
            {(trialSnapshot !== null || quiz.event !== "none") && (
              <>
                {prototype()}
                {trialSnapshot?.observed !== null &&
                  trialSnapshot?.observed !== undefined && (
                    <div role="status" aria-label="初回の予想と観察">
                      <h3>
                        {trialSnapshot.prediction === trialSnapshot.observed
                          ? "予想と観察が一致しました"
                          : "予想と観察が違いました"}
                      </h3>
                      <p>
                        全問未回答で0点が表示されました。予想外でも発見です。これは確定した事前予想との比較で、今の回答条件での検証結果とは別です。
                      </p>
                    </div>
                  )}
                <button
                  onClick={() => {
                    session(emptyQuiz());
                    forgetTest();
                    setTrialSnapshot(null);
                    setTrialPrediction(null);
                    setFinding(false);
                    requestAnimationFrame(() => trialHeading.current?.focus());
                  }}
                >
                  初回実験をやり直す
                </button>
                {finding && (
                  <details>
                    <summary>試した動作を依頼と比べる</summary>
                    <p>
                      未回答でも点数が出るのは、初期版に未回答を検出する処理がないためです。「使いやすく」だけで直ったとは判断せず、採点してよい条件を指定しましょう。回答変更では旧結果を消し、やり直しでもう一度試せます。
                    </p>
                  </details>
                )}
              </>
            )}
          </>
        )}
        {r.step === 2 && (
          <>
            {!(finding || hint || r.applied) && (
              <p>
                初期版を操作し、予想と異なった点を探しましょう。先に進みたい場合は任意のヒントから修正を試せます。
              </p>
            )}
            <details onToggle={(e) => setHint(e.currentTarget.open)}>
              <summary>ヒントを開いて修正を先に試す（任意）</summary>
              <p>
                教材用の例：未回答なのに点数が出たら、採点してよい条件と維持する機能を分けて依頼します。これはヒントであり、自分が観察した証拠ではありません。
              </p>
            </details>
            {!(finding || hint || r.applied) && (
              <button onClick={() => go(1)}>初回の実験へ戻る</button>
            )}
            {(finding || hint || r.applied) && (
              <>
                <p>
                  {finding
                    ? "自分で観察した動作"
                    : hint
                      ? "ヒントの架空の観察例"
                      : "復元した修正設定（今回の動作は再操作して確認）"}
                  を踏まえ、「使いづらいから直して」をどう具体化しますか。実際に見た事実と例を区別し、先に修正方針を考えましょう。
                </p>
                <KnowledgeCheck
                  check={{
                    ...canvasChecks[1],
                    options: [...canvasChecks[1].options],
                  }}
                  value={r.understanding.repair ?? null}
                  onAnswer={(v) =>
                    update({ understanding: { ...r.understanding, repair: v } })
                  }
                />
                {r.understanding.repair !== undefined && (
                  <>
                    <label className="lab-field">
                      修正の依頼内容
                      <select
                        value={r.repair}
                        onChange={(e) => {
                          if (e.target.value !== r.repair)
                            update({
                              repair: e.target.value as CanvasRecord["repair"],
                            });
                        }}
                      >
                        {Object.entries(repairLabels).map(([id, label]) => (
                          <option key={id} value={id}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    {promptView("repair")}
                    <button className="primary" onClick={apply}>
                      この修正案を固定試作品に反映
                    </button>
                    <p>
                      選択中の修正案：{repairLabels[r.repair]}。反映済み：
                      {r.applied
                        ? repairLabels[r.applied]
                        : "まだ反映していません"}
                      。選択だけでは試作品を変えません。
                    </p>
                    {prototype()}
                    <p>
                      見た目だけの修正では未回答の採点は止まりません。動作の修正では未回答を検出し、問題番号を案内します。3問・正答・採点基準・やり直しを維持する指示も必要です。
                    </p>
                  </>
                )}
              </>
            )}
          </>
        )}
        {r.step === 3 && (
          <>
            <p>
              見た目：設問・選択肢・ボタンが読めるか。動作：条件ごとに実際に試す。「回帰確認」は、修正していない既存機能ももう一度試すことです。
            </p>
            <label className="lab-field">
              確かめる項目
              <select
                value={test}
                onChange={(e) => {
                  if (e.target.value !== test) {
                    setTest(e.target.value as CanvasTest);
                    forgetTest();
                    setQuizMessage(
                      "確認課題を変更したため、現在の検証を解除しました。予想を選び、確認条件をセットし直してください。",
                    );
                  }
                }}
              >
                {testCases.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </label>
            <p>{caseData.task}</p>
            <fieldset
              disabled={prepared !== null}
              aria-describedby="canvas-prediction-state"
            >
              <legend ref={predictionHeading} tabIndex={-1}>
                この確認条件で起こることを予想する
              </legend>
              {caseData.options.map((v, i) => (
                <label className="option" key={v}>
                  <input
                    name="verification-prediction"
                    type="radio"
                    checked={prediction === i}
                    onChange={() => {
                      if (!preparedRef.current) setPrediction(i);
                    }}
                  />
                  {v}
                </label>
              ))}
            </fieldset>
            <p id="canvas-prediction-state" role="status">
              {prepared
                ? `確定した予想：${caseData.options[prepared.prediction]}。この検証中は変更できません。変更するには「予想を変更して再挑戦」を選び、条件セットと実操作をやり直してください。`
                : "予想を選び、確認条件をセットすると予想が確定します。"}
            </p>
            <button
              disabled={prediction === null || prepared !== null}
              onClick={prepare}
            >
              確認条件を試作品にセット
            </button>
            {prepared && (
              <button onClick={retryVerification}>予想を変更して再挑戦</button>
            )}
            {prototype()}
            {observed !== null && (
              <div
                className="notice"
                role="status"
                aria-label="予想と実操作の比較"
              >
                <h3>
                  {observed === prepared?.prediction
                    ? "予想と観察が一致しました"
                    : "予想と観察が違いました"}
                </h3>
                <p>
                  条件セット時に確定した予想：
                  {caseData.options[prepared!.prediction]}。
                </p>
                <p>操作で観察した結果：{caseData.options[observed]}。</p>
                <p>
                  {test === "missing"
                    ? requireAll
                      ? "未回答番号を検出し、点数を出していません。番号から設問へ移動して確認しましょう。"
                      : "この版は未回答でも採点します。見た目だけでは直らないため、体験3で動作の修正を反映してください。"
                    : test === "score"
                      ? "正答データと3つの回答から毎回計算しています。"
                      : "採点ややり直しを自分で繰り返し、以前からある機能も確かめます。"}
                </p>
              </div>
            )}
            <KnowledgeCheck
              check={{
                ...canvasChecks[2],
                options: [...canvasChecks[2].options],
              }}
              value={r.understanding.proof ?? null}
              onAnswer={(v) =>
                update({ understanding: { ...r.understanding, proof: v } })
              }
            />
            <details>
              <summary>任意：自分のGemini Canvasで作る</summary>
              <p>
                自分のアカウントで任意に行います。使えない/使いたくない場合も、この固定体験だけで完了できます。実生成/保存/共有の成功を教材は認定しません。
              </p>
              <label className="lab-field">
                コピーする内容
                <select
                  value={r.prompt}
                  onChange={(e) =>
                    update({ prompt: e.target.value as PromptKind })
                  }
                >
                  {Object.entries(promptLabels).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              {promptView(r.prompt)}
              <p>
                <a
                  className="primary"
                  href="https://gemini.google.com/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Geminiを開く ↗（別タブ・任意）
                </a>
              </p>
              <p>
                リンクだけでCanvasの起動・提供は保証しません。実Googleの生成や共有は自分で行い、公開範囲・含む情報・データの扱いを確認してください。
              </p>
              <label className="option">
                <input
                  type="checkbox"
                  checked={r.tried}
                  onChange={(e) => update({ tried: e.target.checked })}
                />
                自分のGeminiで試した（過去の自己申告）
              </label>
            </details>
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
      <details>
        <summary>公式Canvasの機能と教材の違い</summary>
        <label className="lab-field">
          公式案内の端末
          <select
            value={r.platform}
            onChange={(e) =>
              update({ platform: e.target.value as CanvasRecord["platform"] })
            }
          >
            <option value="pc">PC</option>
            <option value="ios">iPhone / iPad</option>
            <option value="android">Android</option>
          </select>
        </label>
        <p>
          2026-10-25に公式本文を確認。Canvasは文書・コード・アプリ等を作成/編集でき、チャットで更新を依頼できます。実Canvasの変更は自動保存されると説明されています。この教材の一時試作品とは保存方式が違います。
        </p>
        <p>
          {r.platform === "pc"
            ? "PC：Geminiウェブアプリで入力欄下のCanvasを選び依頼する案内です。コード表示で編集・変更・ログを確認でき、文書の選択箇所や書式を編集できます。"
            : "モバイル：選んだOS向けヘルプは、モバイルアプリの追加→Canvasとウェブ利用を案内し、アプリの上部プレビューで動作やログを確認する説明があります。文書の書式編集はPCのウェブ版のみと案内されています。"}
        </p>
        <p>
          紹介ページは幅広い提供を説明しますが、ログインが必要で、AI機能追加・文書からの生成・共有コンテンツのコピー等には18歳以上の条件も記載されています。機能別の年齢/地域/プラン/アカウント/端末/提供変更は自分の画面と公式説明で確認してください。全員同じボタンや利用条件とは断定しません。
        </p>
        <p>
          共有では公開リンクやアプリ情報の確認を案内しています。リンクを知る人が関連データを閲覧/編集できる場合があるため、公開範囲と含む情報を確認してください。共有Canvasをモバイルアプリで開けないという案内もあり、ブラウザとアプリの違いに注意します。
        </p>
        {canvasReferences
          .filter(
            (ref) => ref.platform === "all" || ref.platform === r.platform,
          )
          .map((ref) => (
            <p key={ref.url}>
              <a href={ref.url} target="_blank" rel="noreferrer">
                {ref.title} ↗（別タブ）
              </a>
            </p>
          ))}
      </details>
      <section className="panel" aria-label="閲覧の自己記録">
        <h2>この体験の閲覧記録</h2>
        {r.step === 1 && (
          <p>
            まず自分の予想と観察を比べましょう。判断問題は体験1・3・4にあります。
          </p>
        )}
        <label className="option">
          <input
            type="checkbox"
            checked={r.viewed.includes(r.step)}
            onChange={(e) =>
              update({
                viewed: e.target.checked
                  ? [...r.viewed, r.step]
                  : r.viewed.filter((n) => n !== r.step),
              })
            }
          />
          体験{r.step + 1}を閲覧した（自己記録）
        </label>
      </section>
      <section className="panel" aria-label="第6章の学習記録">
        <h2>第6章の学習記録</h2>
        <ul aria-label="種類別の学習進捗">
          <li>閲覧の自己記録：{r.viewed.length} / 4体験</li>
          <li>
            模擬実践の過去履歴：クイズ採点{" "}
            {r.history.some((id) => !id.endsWith(":restart")) ? "あり" : "なし"}{" "}
            ／ タイマー開始 {r.timerHistory.includes("start") ? "あり" : "なし"}
          </li>
          <li>
            判断チェックの達成：
            {
              canvasJudgments.filter((c) => r.judgments[c.id] === c.answer)
                .length
            }{" "}
            / {canvasJudgments.length}問（現在版への最終回答）
          </li>
          <li>
            実Gemini演習：{r.tried ? "試した（自己申告）" : "未申告・任意"}
          </li>
          <li>
            章完了：{completed ? "完了の自己申告あり" : "未申告"}
            。理解度の認定ではありません。
          </li>
        </ul>
        <p>
          閲覧・実践・判断・コピー・実操作・章完了は別々です。すべてを埋める必要はなく、有料機能や実アプリは完了条件ではありません。
        </p>
        <p>
          過去の模擬操作履歴：{r.history.length}
          種類。テーマ/版を含む過去の履歴であり、現在の回答の採点結果や修正完了の証拠ではありません。現在の検証は再読み込み・条件変更後にやり直します。
        </p>
        <p>
          従来の基本チェック（旧記録を保持）：
          {canvasChecks
            .map(
              (c) =>
                `${c.id === "requirements" ? "具体化" : c.id === "repair" ? "修正" : "検証"} ${r.understanding[c.id] === undefined ? "未回答" : r.understanding[c.id] === c.answer ? "正解" : "再確認"}`,
            )
            .join(" ／ ")}
          。コピー成功・実操作自己申告・章完了は別の記録です。
        </p>
        <label className="option">
          <input
            type="checkbox"
            checked={completed}
            onChange={(e) => onComplete(e.target.checked)}
          />
          第6章の学習を完了した（自己申告）
        </label>
        <p>全問正解や実Google操作は必須ではありません。</p>
        {resetting ? (
          <>
            <p>
              第6章の固定設定・理解チェック・履歴・コピー・自己申告・一時試作品と、第6章の章完了だけを初期化します。他章/ラボ/探索は消しません。初期化しますか？
            </p>
            <div className="lab-actions">
              <button onClick={reset}>第6章を初期化する</button>
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
            第6章の記録だけを初期化
          </button>
        )}
      </section>
      {!available && (
        <p className="notice" role="status">
          第6章の記録を保存できません。保存拒否・容量不足・破損などでも画面内では続けられますが、移動/再読み込みで失われたり旧記録に戻る場合があります。
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
