import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { lessons } from "./curriculum";
import { loadProgress, resetProgress, saveProgress } from "./storage";
import "./style.css";
import { Lab } from "./Lab";
import { Exploration } from "./Exploration";
import { Services } from "./Services";
import { VideoMusic } from "./VideoMusic";
import { NanoBanana } from "./NanoBanana";
import { Canvas } from "./Canvas";
import { Live } from "./Live";
import { StudyChapters } from "./StudyChapters";
function currentRoute() {
  return location.hash === "#main" ? "home" : location.hash.slice(1) || "home";
}
function App() {
  const [initial] = useState(loadProgress);
  const [progress, setProgress] = useState(initial.progress);
  const [storageAvailable, setStorageAvailable] = useState(initial.available);
  const [route, setRoute] = useState(currentRoute);
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
  );
  const [message, setMessage] = useState("");
  const [resetting, setResetting] = useState(false);
  const [answer, setAnswer] = useState<number | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const main = useRef<HTMLElement>(null);
  useEffect(() => {
    const handler = () => {
      if (location.hash === "#main") {
        // Old skip-link URLs did not retain their chapter. Recover to home
        // without adding another history entry or treating "main" as a route.
        history.replaceState(null, "", "#home");
        main.current?.focus();
      }
      setRoute(currentRoute());
      setMessage("");
      setAnswer(null);
    };
    if (location.hash === "#main") handler();
    addEventListener("hashchange", handler);
    return () => removeEventListener("hashchange", handler);
  }, []);
  useEffect(() => {
    if (location.hash) heading.current?.focus();
  }, [route]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  const lesson = lessons.find((l) => l.id === route);
  const completed = progress.completed.includes(lesson?.id ?? "");
  const update = (value: boolean) => {
    if (!lesson || lesson.status !== "ready") return false;
    const other = progress.completed.filter((id) => id !== lesson.id);
    const next = { completed: value ? [...other, lesson.id] : other };
    setProgress(next);
    const ok = saveProgress(next);
    setStorageAvailable(ok);
    setMessage(
      ok
        ? "進捗を保存しました。"
        : "この画面内で進捗を更新しました。保存はできません。",
    );
    return ok;
  };
  async function copy() {
    try {
      if (!lesson?.prompt) return;
      await navigator.clipboard.writeText(lesson.prompt);
      setMessage("プロンプト全文をコピーしました。");
    } catch {
      setMessage(
        "コピーできませんでした。全文を選択して手動でコピーしてください。",
      );
    }
  }
  return (
    <>
      <a
        className="skip"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          main.current?.focus();
        }}
      >
        本文へ移動
      </a>
      <header>
        <a className="brand" href="#home">
          虎の巻 <span>GEMINI GUIDE</span>
        </a>
        <button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          aria-label={
            theme === "light"
              ? "ダークテーマに切り替え"
              : "ライトテーマに切り替え"
          }
        >
          {theme === "light" ? "☾ ダーク" : "☀ ライト"}
        </button>
      </header>
      <nav aria-label="メインナビゲーション">
        <a href="#home" aria-current={route === "home" ? "page" : undefined}>
          ホーム
        </a>
        <a
          href="#curriculum"
          aria-current={route === "curriculum" ? "page" : undefined}
        >
          全10章・機能一覧
        </a>
        <a
          href="#lab"
          aria-current={route.startsWith("lab") ? "page" : undefined}
        >
          Gemini体験ラボ
        </a>
        <a
          href="#chapter-1"
          aria-current={route === "chapter-1" ? "page" : undefined}
        >
          第1章を学ぶ
        </a>
        <a
          href="#chapter-2"
          aria-current={route === "chapter-2" ? "page" : undefined}
        >
          第2章を学ぶ
        </a>
        <a
          href="#chapter-3"
          aria-current={route === "chapter-3" ? "page" : undefined}
        >
          第3章を学ぶ
        </a>
        <a
          href="#chapter-4"
          aria-current={route === "chapter-4" ? "page" : undefined}
        >
          第4章を学ぶ
        </a>
        <a
          href="#chapter-5"
          aria-current={route === "chapter-5" ? "page" : undefined}
        >
          第5章を学ぶ
        </a>
        <a
          href="#chapter-6"
          aria-current={route === "chapter-6" ? "page" : undefined}
        >
          第6章を学ぶ
        </a>
        <a
          href="#chapter-7"
          aria-current={route === "chapter-7" ? "page" : undefined}
        >
          第7章を学ぶ
        </a>
        <a
          href="#chapter-8"
          aria-current={route === "chapter-8" ? "page" : undefined}
        >
          第8章を学ぶ
        </a>
      </nav>
      <main id="main" ref={main} tabIndex={-1}>
        <div className="eyebrow">非公式インタラクティブ教材 · v0.2</div>
        {route === "lab" || route.startsWith("lab-") ? (
          <Lab route={route} heading={heading} />
        ) : route === "home" ? (
          <>
            <section className="hero">
              <p className="kicker">ひとつずつ、使える自分へ。</p>
              <h1 tabIndex={-1} ref={heading}>
                Gemini活用
                <br />
                <em>虎の巻</em>
              </h1>
              <p className="lead">
                読むだけから、触って学ぶへ。
                <br />
                Google Geminiならではの機能を、あなたのペースで。
              </p>
              <a className="primary" href="#chapter-1">
                第1章から始める <span>→</span>
              </a>
              <p className="small">
                無料で読めます。教材へのログインは不要です。
              </p>
            </section>
            <section className="panel">
              <h2>Gemini体験ラボ</h2>
              <p>
                Geminiで、こんなことができる。説明を読む前に、気になる体験を一つ試してみよう。
              </p>
              <a className="primary" href="#lab">
                体験ラボから始める →
              </a>
              <p>全体験を終えなくても本編に進めます。</p>
            </section>
            <section className="panel">
              <h2>学習の始め方</h2>
              <ol>
                <li>この教材で操作手順を読む</li>
                <li>別タブのGeminiで実際に操作する</li>
                <li>理解度を確認して、演習完了を記録する</li>
              </ol>
              <p>
                Geminiへのログインや機能の利用条件は、Gemini側で確認してください。
              </p>
            </section>
            <section>
              <div className="section-heading">
                <h2>機能から広がる、10の学び</h2>
                <a href="#curriculum">全章を見る →</a>
              </div>
              <div className="cards">
                {lessons.slice(0, 3).map((l) => (
                  <a className="card" key={l.id} href={`#${l.id}`}>
                    <span className="number">
                      CHAPTER {String(l.number).padStart(2, "0")}
                    </span>
                    <h3>{l.title}</h3>
                    <p>{l.task}</p>
                    <span className="badge">
                      {l.status === "ready" ? "学習できます →" : "準備中"}
                    </span>
                  </a>
                ))}
              </div>
            </section>
          </>
        ) : route === "curriculum" ? (
          <>
            <h1 tabIndex={-1} ref={heading}>
              全10章・機能一覧
            </h1>
            <p className="lead">第1章で入り口を知り、各機能の実践へ。</p>
            <p>
              章番号・実践課題はIssue
              #1に準拠。第1〜8章を学習できます。第9〜10章は準備中です。第3・4章の表示名は統合実装の依頼に基づきます。各章を開くと概要と参考情報を確認できます。
            </p>
            <div className="chapter-list">
              {lessons.map((l) => (
                <a className="chapter-row" href={`#${l.id}`} key={l.id}>
                  <span className="number">
                    {String(l.number).padStart(2, "0")}
                  </span>
                  <span>
                    <strong>{l.title}</strong>
                    <span className="row-task">{l.task}</span>
                  </span>
                  <span className="badge">
                    {l.status === "ready" ? "学習する" : "準備中"}
                  </span>
                </a>
              ))}
            </div>
          </>
        ) : lesson ? (
          <article>
            <a href="#curriculum">← 全10章へ</a>
            <p className="number">
              CHAPTER {String(lesson.number).padStart(2, "0")}
            </p>
            <h1 tabIndex={-1} ref={heading}>
              {lesson.title}
            </h1>
            <p className="lead">{lesson.task}</p>
            <section className="panel">
              <h2>学習目標</h2>
              <p>{lesson.goal}</p>
              <h3>この機能について</h3>
              <p>{lesson.description}</p>
            </section>
            {lesson.status === "planned" ? (
              <section className="notice">
                <h2>準備中</h2>
                <p>この章の操作教材は、今後追加する予定です。</p>
                <a href="#chapter-1">第1章で画面を確認する →</a>
              </section>
            ) : lesson.id === "chapter-8" ? (
              <VideoMusic completed={completed} onComplete={update} />
            ) : lesson.id === "chapter-7" ? (
              <NanoBanana completed={completed} onComplete={update} />
            ) : lesson.id === "chapter-6" ? (
              <Canvas completed={completed} onComplete={update} />
            ) : lesson.id === "chapter-5" ? (
              <Live completed={completed} onComplete={update} />
            ) : lesson.id === "chapter-2" ? (
              <Services completed={completed} onComplete={update} />
            ) : lesson.id === "chapter-3" || lesson.id === "chapter-4" ? (
              <StudyChapters
                chapter={lesson.id === "chapter-3" ? 3 : 4}
                completed={completed}
                onComplete={update}
              />
            ) : (
              <>
                <a
                  className="primary"
                  href="https://gemini.google.com/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Geminiを開く ↗（別タブ）
                </a>
                <p>
                  体験ラボで面白さを試したら、この章では画面の入口と機能の選び方を探検しましょう。すべての入口を探索しなくても、既存の演習へ進めます。
                </p>
                <Exploration />
                <section>
                  <h2>操作してみよう</h2>
                  <p>
                    手順を開き、Geminiと教材のタブを切り替えながら進めましょう。
                  </p>
                  {lesson.steps.map((s) => (
                    <details key={s.id}>
                      <summary>{s.title}</summary>
                      <p>{s.body}</p>
                    </details>
                  ))}
                </section>
                <section className="panel">
                  <h2>練習プロンプト</h2>
                  <p>個人情報を含まない練習用の文章です。</p>
                  <details>
                    <summary>プロンプト全文を表示</summary>
                    <pre>{lesson.prompt}</pre>
                  </details>
                  <button className="primary" onClick={copy}>
                    プロンプト全文をコピー
                  </button>
                </section>
                {lesson.quiz && (
                  <section className="panel">
                    <h2>理解度チェック</h2>
                    <fieldset>
                      <legend>{lesson.quiz.question}</legend>
                      {lesson.quiz.options.map((option, i) => (
                        <label className="option" key={option}>
                          <input
                            type="radio"
                            name="quiz"
                            checked={answer === i}
                            onChange={() => setAnswer(i)}
                          />
                          {option}
                        </label>
                      ))}
                    </fieldset>
                    {answer !== null && (
                      <p role="status" className="notice">
                        {answer === lesson.quiz.answer
                          ? "正解です。"
                          : "もう一度考えてみましょう。"}{" "}
                        {lesson.quiz.explanation}
                      </p>
                    )}
                  </section>
                )}
                <section className="panel">
                  <h2>演習の記録</h2>
                  <label className="option">
                    <input
                      type="checkbox"
                      checked={completed}
                      onChange={(e) => update(e.target.checked)}
                    />
                    自分の画面で利用可能な機能を探した
                  </label>
                  <p className="small">
                    理解度チェックとは別に、実際に操作した後で記録してください。
                  </p>
                </section>
              </>
            )}
            <section className="references">
              <h2>利用条件・公式参考情報</h2>
              <p>{lesson.conditions}</p>
              <ul>
                {lesson.cautions.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              {lesson.references.map((r) => (
                <p key={r.url}>
                  <a href={r.url} target="_blank" rel="noreferrer">
                    {r.title} ↗（別タブ）
                  </a>
                </p>
              ))}
              <p className="small">情報確認状況：{lesson.checkedAt}</p>
            </section>
          </article>
        ) : (
          <>
            <h1 tabIndex={-1} ref={heading}>
              ページが見つかりません
            </h1>
            <a href="#home">ホームへ戻る</a>
          </>
        )}
        <section className="progress panel" aria-label="学習進捗">
          <div className="section-heading">
            <h2>あなたの学習進捗</h2>
            <strong>{progress.completed.length} / 10章</strong>
          </div>
          <progress
            max={10}
            value={progress.completed.length}
            aria-label="全10章の完了数"
          />
          <p>
            {completed
              ? "この章の学習完了を記録しています。"
              : "第1〜8章を自分のペースで学びましょう。"}{" "}
            公開済み：8章
          </p>
          {!storageAvailable && (
            <p role="status">
              ブラウザに保存できません。進捗はこの画面を閉じると失われる場合があります。
            </p>
          )}
          {resetting ? (
            <div>
              <p>学習進捗を初期化しますか？</p>
              <button
                onClick={() => {
                  setProgress({ completed: [] });
                  const ok = resetProgress();
                  setStorageAvailable(ok);
                  setResetting(false);
                  setMessage(
                    ok
                      ? "進捗を初期化しました。"
                      : "画面内の進捗を初期化しましたが、保存領域の削除に失敗しました。再読み込みすると古い進捗が復活する可能性があります。",
                  );
                }}
              >
                初期化する
              </button>{" "}
              <button onClick={() => setResetting(false)}>キャンセル</button>
            </div>
          ) : (
            <button onClick={() => setResetting(true)}>進捗を初期化</button>
          )}
        </section>
        <p className="feedback" role="status" aria-live="polite">
          {message}
        </p>
      </main>
      <footer>
        <strong>Gemini活用 虎の巻</strong>
        <p>
          Googleが提供・監修するものではない、非公式の学習教材です。Googleのロゴ・公式画像は使用していません。
        </p>
        <a href="https://github.com/tetsujisugimori-coder/gemini-toranomaki/issues/1">
          教材の仕様・更新状況（Issue #1）
        </a>
      </footer>
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
