import { useEffect, useRef, useState } from "react";
import { features, goals } from "./exploration-data";
import { lessons } from "./curriculum";
import {
  emptyExploration,
  loadExploration,
  saveExploration,
  type ExplorationProgress,
} from "./exploration-storage";
function ChapterLink({ number }: { number: number }) {
  const lesson = lessons.find((l) => l.number === number);
  return lesson ? (
    <a href={`#${lesson.id}`}>
      第{number}章：{lesson.title}
      {lesson.status === "planned"
        ? "（概要・操作教材は準備中）"
        : "（この章）"}
    </a>
  ) : null;
}
export function Exploration() {
  const [initial] = useState(loadExploration);
  const [progress, setProgress] = useState(initial.progress);
  const latest = useRef(progress);
  const [available, setAvailable] = useState(initial.available);
  const [selected, setSelected] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const entryButton = useRef<HTMLButtonElement | null>(null);
  const feature = features.find((f) => f.id === selected);
  useEffect(() => {
    if (selected) detailHeading.current?.focus();
  }, [selected]);
  function update(next: ExplorationProgress) {
    latest.current = next;
    setProgress(next);
    setAvailable(saveExploration(next));
  }
  function choose(id: string, button: HTMLButtonElement) {
    entryButton.current = button;
    // Re-selecting the same state does not rerun the selection effect.
    if (selected === id) detailHeading.current?.focus();
    setSelected(id);
    if (!latest.current.visited.includes(id))
      update({ ...latest.current, visited: [...latest.current.visited, id] });
  }
  const hotspot = (id: string) => {
    const f = features.find((f) => f.id === id)!;
    return (
      <button
        key={id}
        type="button"
        aria-pressed={selected === id}
        aria-controls="feature-detail"
        onClick={(event) => choose(id, event.currentTarget)}
      >
        {f.name}
        <span className="explore-mark">
          {progress.visited.includes(id) ? " ✓" : " ＋"}
        </span>
      </button>
    );
  };
  return (
    <>
      <section
        className="exploration"
        aria-labelledby="screen-exploration-title"
      >
        <p className="number">EXPLORE 01 · 入口を見つける</p>
        <h2 id="screen-exploration-title">画面探検</h2>
        <p>
          気になる場所を押してみよう。説明を見たら、実際のGeminiで小さな課題に挑戦できます。
        </p>
        <p className="notice">
          <strong>教材用の模擬画面です。</strong>{" "}
          ボタンは説明を開きます。送信・添付・予約・課金・外部接続は行いません。配置と機能の組み合わせは学習用に整理しており、実画面と異なります。
        </p>
        <div className="mock-screen" role="group" aria-label="Geminiの模擬画面">
          <div className="mock-side">
            <p className="small">メニュー・過去の活動</p>
            {features
              .filter((f) => f.area === "side")
              .map((f) => hotspot(f.id))}
          </div>
          <div className="mock-main">
            <div className="section-heading">
              <strong>
                Gemini <span className="badge">模擬</span>
              </strong>
              {hotspot("model")}
            </div>
            <div className="mock-welcome">
              <p className="kicker">今日は、何を見つけよう？</p>
              <p>質問の入口と、目的に合うツールを探そう。</p>
            </div>
            <div className="mock-composer">
              {hotspot("prompt")}
              <div className="explore-buttons">
                {hotspot("attach")}
                {hotspot("tools")}
                {hotspot("thinking")}
              </div>
            </div>
          </div>
        </div>
        <div id="feature-detail" className="panel explore-detail">
          {feature ? (
            <>
              <p className="number">選んだ入口</p>
              <h3 tabIndex={-1} ref={detailHeading}>
                {feature.name}
              </h3>
              <button onClick={() => entryButton.current?.focus()}>
                入口の選択へ戻る
              </button>
              <dl>
                <dt>何ができる？</dt>
                <dd>{feature.description}</dd>
                <dt>こんな場面で</dt>
                <dd>{feature.scene}</dd>
                <dt>実際に試す小さな課題</dt>
                <dd>{feature.task}</dd>
              </dl>
              <p className="small">
                ここからは別タブの実際のGeminiで行う課題です。表示がない・利用できない場合も失敗ではありません。
              </p>
              <a
                href="https://gemini.google.com/"
                target="_blank"
                rel="noreferrer"
              >
                実際のGeminiを開く ↗（外部・別タブ）
              </a>
              <p>
                <button
                  aria-pressed={progress.tried.includes(feature.id)}
                  onClick={() =>
                    update({
                      ...latest.current,
                      tried: latest.current.tried.includes(feature.id)
                        ? latest.current.tried.filter((id) => id !== feature.id)
                        : [...latest.current.tried, feature.id],
                    })
                  }
                >
                  {progress.tried.includes(feature.id)
                    ? "課題の確認済みを取り消す"
                    : "実画面で課題を確認したと記録"}
                </button>
              </p>
              <p className="small">
                自己申告の記録です。模擬ボタンの選択だけでは課題完了や章完了になりません。
              </p>
              <details>
                <summary>表示・利用条件を確認</summary>
                <p>{feature.conditions}</p>
              </details>
              <ChapterLink number={feature.chapter} />
            </>
          ) : (
            <p>
              ＋の付いたボタンを1つ選ぶと、使い道と小さな課題が開きます。✓は説明を探索した印です。
            </p>
          )}
        </div>
        <details>
          <summary>モデル選択と思考レベルはどう違う？</summary>
          <p>
            モデル選択は回答を作るモデルや自動選択モードを選ぶこと。思考レベルは、自動モードで思考にかける度合いを選ぶ画面例です。
          </p>
          <p>
            ユーザーが2026年10月22日に確認したモデル選択の例：自動モード（Gemini
            3モデル）、3.1 Pro（鍵表示）、4
            Argon（鍵表示）。鍵の表示だけで有料プランの種類や利用権限は判断できません。
          </p>
          <p>
            同日の自動モードの例：低「時間をかけず効率的に」、標準「バランスを取って詳しく」、高「徹底的に詳しく」。高でも必ず正解するわけではなく、回答が必ず長くなるわけでもありません。
          </p>
          <p>
            恒久的な仕様ではありません。名称・選択肢・条件は変わります。教材と違う場合は自分の画面と公式ヘルプを確認し、選択肢がなくても学習を続けられます。
          </p>
        </details>
        <p role="status">
          探索済み {progress.visited.length} / {features.length} ·
          実画面の課題確認 {progress.tried.length} 件
          {!available &&
            "。保存できません。この画面内では操作できますが、移動・再読み込みで記録が失われる場合があります。"}
        </p>
        <p className="small">
          探索記録はこのブラウザだけに保存します。章の完了・ラボ記録とは独立し、既存の「進捗を初期化」では消えません。自由入力・Geminiへの送信内容は記録しません。
        </p>
        {resetting ? (
          <div>
            <p>探索記録だけを初期化しますか？章の完了・ラボ記録は残ります。</p>
            <button
              onClick={() => {
                update(emptyExploration());
                setResetting(false);
              }}
            >
              探索記録の初期化を実行
            </button>{" "}
            <button onClick={() => setResetting(false)}>
              探索の初期化をキャンセル
            </button>
          </div>
        ) : (
          <button onClick={() => setResetting(true)}>
            探索記録だけを初期化
          </button>
        )}
      </section>
      <FeatureMap />
    </>
  );
}
function FeatureMap() {
  const [direction, setDirection] = useState<"goal" | "feature">("goal");
  const [goalId, setGoalId] = useState("");
  const [featureId, setFeatureId] = useState("");
  const goal = goals.find((g) => g.id === goalId);
  const matching = goals.filter((g) =>
    g.recommendations.some((r) => r.feature === featureId),
  );
  return (
    <section className="panel" aria-labelledby="feature-map-title">
      <p className="number">EXPLORE 02 · 目的から選ぶ</p>
      <h2 id="feature-map-title">機能探検マップ</h2>
      <p>
        やりたいことから入口を探そう。複数の候補があるときは、理由を比べて選べます。詳細な操作は各章で学びます。
      </p>
      <div
        className="explore-buttons"
        role="group"
        aria-label="マップの探索方向"
      >
        <button
          aria-pressed={direction === "goal"}
          onClick={() => setDirection("goal")}
        >
          目的から探す
        </button>
        <button
          aria-pressed={direction === "feature"}
          onClick={() => setDirection("feature")}
        >
          機能から探す
        </button>
      </div>
      {direction === "goal" ? (
        <label className="lab-field">
          やりたいこと
          <select value={goalId} onChange={(e) => setGoalId(e.target.value)}>
            <option value="">目的を選んでください</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <label className="lab-field">
          入口の機能
          <select
            value={featureId}
            onChange={(e) => setFeatureId(e.target.value)}
          >
            <option value="">機能を選んでください</option>
            {features.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <p role="status">
        {direction === "goal"
          ? goal
            ? `${goal.title}：候補は${goal.recommendations.length}件です。`
            : "目的を選ぶと、推奨機能と最初の操作が表示されます。"
          : featureId
            ? `この入口を使う目的は${matching.length}件です。`
            : "機能を選ぶと、関連する目的が表示されます。"}
      </p>
      <div className="map-results">
        {(direction === "goal"
          ? goal
            ? [goal]
            : []
          : featureId
            ? matching
            : []
        ).map((g) => (
          <div key={g.id}>
            <h3>{g.title}</h3>
            {g.recommendations
              .filter((r) => direction === "goal" || r.feature === featureId)
              .map((r) => (
                <div className="map-recommendation" key={r.name}>
                  <h4>{r.name}</h4>
                  <p>
                    <strong>選ぶ理由：</strong>
                    {r.reason}
                  </p>
                  <p>
                    <strong>最初の操作：</strong>
                    {r.first}
                  </p>
                  <ChapterLink number={r.chapter} />
                </div>
              ))}
          </div>
        ))}
      </div>
      {direction === "feature" && featureId && matching.length === 0 && (
        <p>
          このマップの8つの目的には直接対応する候補がありません。上の画面探検で基本的な使い道を確認できます。
        </p>
      )}
      <p className="small">
        候補の表示は利用可能性の保証ではありません。無料枠、有料プラン、利用回数、提供状況は機能ごとに異なり変化します。未確認の条件は断定せず、実画面と公式情報で確認しましょう。
      </p>
    </section>
  );
}
