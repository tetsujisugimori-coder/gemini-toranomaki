import { useId, useState, type RefObject } from "react";
import {
  experiences,
  experienceCheck,
  safetyChecks,
  type Check,
  type LabId,
} from "./lab-data";
import {
  buildPrompt,
  buildRevision,
  defaults,
  type Settings,
} from "./lab-prompts";
import { emptyRecord, loadLab, saveLab, type RecordState } from "./lab-storage";
import { lessons } from "./curriculum";
export function KnowledgeCheck({
  check,
  value,
  onAnswer,
}: {
  check: Check;
  value: number | null;
  onAnswer: (n: number) => void;
}) {
  const name = useId();
  return (
    <fieldset>
      <legend>{check.question}</legend>
      {check.options.map((o, i) => (
        <label className="option" key={o}>
          <input
            type="radio"
            name={name}
            checked={value === i}
            onChange={() => onAnswer(i)}
          />
          {o}
        </label>
      ))}
      {value !== null && (
        <p role="status">
          {value === check.answer ? "正解です。" : "もう一度考えてみましょう。"}{" "}
          {check.reason}
        </p>
      )}
    </fieldset>
  );
}
function Safety() {
  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null]);
  return (
    <section className="panel">
      <h2>試した後に：AIと安心して学ぶために</h2>
      <p>
        AIは間違えることがあります。自然で正しそうな回答でも確認が必要です。出典を実際に開き、発行元・更新日・本文を確認し、重要な点は別の信頼できる資料と照合しましょう。
      </p>
      <p>
        個人情報や機密情報は入力せず、架空の題材で練習します。機能の提供条件は人によって異なります。文章・画像・クイズを使う前には、内容の正確さや権利を人が確認してください。
      </p>
      <h3>教材内の固定理解チェック（Gemini生成問題ではありません）</h3>
      {safetyChecks.map((check, i) => (
        <KnowledgeCheck
          key={check.question}
          check={check}
          value={answers[i]}
          onAnswer={(n) =>
            setAnswers((a) => a.map((v, j) => (j === i ? n : v)))
          }
        />
      ))}
      <p className="small">この共通チェックの回答は保存しません。</p>
      <details>
        <summary>公式情報・利用条件を確認する</summary>
        <a
          href="https://support.google.com/gemini/"
          target="_blank"
          rel="noreferrer"
        >
          Gemini アプリ ヘルプ ↗（別タブ）
        </a>
        <p>
          現行の機能名・提供条件は未確認です。ご自身の画面と公式情報を確認してください。
        </p>
      </details>
    </section>
  );
}
export function Lab({
  route,
  heading,
}: {
  route: string;
  heading: RefObject<HTMLHeadingElement | null>;
}) {
  const [initial] = useState(loadLab);
  const [progress, setProgress] = useState(initial.progress);
  const [available, setAvailable] = useState(initial.available);
  const [notice, setNotice] = useState("");
  const id = route.slice(4) as LabId;
  const experience = experiences.find((e) => e.id === id);
  const update = (id: LabId, patch: Partial<RecordState>) => {
    const next = {
      ...progress,
      [id]: { ...(progress[id] || emptyRecord()), ...patch },
    };
    setProgress(next);
    const ok = saveLab(next);
    setAvailable(ok);
    setNotice(
      ok
        ? "ラボの記録を保存しました。"
        : "保存できません。この画面内で学習を続けられます。",
    );
  };
  return (
    <>
      <a href="#lab">Gemini体験ラボに戻る</a>
      {experience ? (
        <ExperienceView
          key={id}
          id={id}
          heading={heading}
          record={progress[id] || emptyRecord()}
          update={(p) => update(id, p)}
        />
      ) : (
        <>
          <h1 ref={heading} tabIndex={-1}>
            Gemini体験ラボ
          </h1>
          <p className="lead">Geminiで、こんなことができる。</p>
          <p>
            説明を読む前に、まず一つ試してみよう。
            <br />
            気になったものから始めてOK。
          </p>
          <p>
            全体験の完了は必須ではありません。いつでも第1章や全10章へ進めます。
          </p>
          <div className="cards">
            {experiences.map((e, i) => {
              const r = progress[e.id];
              return (
                <section className="card" key={e.id}>
                  <span className="number">
                    体験 {String.fromCharCode(65 + i)} · 約{e.minutes}分
                  </span>
                  <h2>{e.title}</h2>
                  <p>{e.intro}</p>
                  <p>学べること：{e.goal}</p>
                  <a className="primary" href={`#lab-${e.id}`}>
                    体験開始 →
                  </a>
                  <p className="small">
                    操作：{r?.copied ? "コピー成功" : "未記録"} ／
                    実行（自己申告）：{r?.tried ? "試した" : "未記録"}
                    <br />
                    応用（自己申告）：{r?.applied ? "取り組んだ" : "未記録"} ／
                    固定チェック：
                    {r?.check === 1
                      ? "正解"
                      : r?.check === 0
                        ? "再確認"
                        : "未回答"}
                  </p>
                </section>
              );
            })}
          </div>
          <Safety />
        </>
      )}
      {!available && (
        <p role="status">
          ブラウザに保存できません。ラボの記録は画面を閉じると失われる場合があります。
        </p>
      )}
      <p role="status" aria-live="polite">
        {notice}
      </p>
      <p>
        <a href="#chapter-1">第1章へ進む →</a> ·{" "}
        <a href="#curriculum">全10章を見る →</a>
      </p>
    </>
  );
}
const selectFields: Partial<Record<LabId, Record<string, string[]>>> = {
  ask: {
    audience: ["小学生", "中学生", "大人"],
    method: ["たとえ話", "具体例", "順序立てた説明"],
  },
  rewrite: { tone: ["丁寧", "親しみやすい", "簡潔"] },
  quiz: {
    difficulty: ["基礎", "標準", "発展"],
    count: ["1", "3", "5", "10"],
    format: ["選択式", "一問一答", "記述式"],
    hint: ["あり", "なし"],
    detail: ["簡潔に", "詳しく"],
  },
};
const labels: Record<string, string> = {
  topic: "学習テーマ・質問する内容",
  audience: "対象者",
  method: "説明方法",
  source: "元の文章",
  tone: "文体",
  subject: "主役",
  background: "背景",
  mood: "雰囲気",
  composition: "色や構図",
  change: "変更したい要素",
  difficulty: "難易度",
  count: "問題数",
  format: "出題形式",
  hint: "ヒントの有無",
  detail: "解説の詳しさ",
};
function ExperienceView({
  id,
  heading,
  record,
  update,
}: {
  id: LabId;
  heading: RefObject<HTMLHeadingElement | null>;
  record: RecordState;
  update: (p: Partial<RecordState>) => void;
}) {
  const e = experiences.find((e) => e.id === id)!;
  const [settings, setSettings] = useState<Settings>({ ...defaults[id] });
  const [before, setBefore] = useState("");
  const [message, setMessage] = useState("");
  const [revisionMode, setRevisionMode] = useState(false);
  const prompt =
    id === "image" && revisionMode
      ? buildRevision(settings)
      : buildPrompt(id, settings);
  const chapter = lessons.find((l) => l.number === e.chapter)!;
  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setMessage(
        "プロンプト全文をコピーしました。Geminiでの実行はまだ記録していません。",
      );
      update({ copied: true });
    } catch {
      setMessage(
        "コピーできませんでした。下の全文を選択して手動でコピーしてください。再度コピーボタンからも試せます。",
      );
    }
  }
  return (
    <article>
      <p className="number">独立イントロ · 約{e.minutes}分</p>
      <h1 ref={heading} tabIndex={-1}>
        {e.title}
      </h1>
      <p className="lead">{e.intro}</p>
      <p>学習目標：{e.goal}</p>
      <p>
        体験 → 発見 → 説明 →
        再挑戦。どの段階にも戻れます。入力文や貼り付けた回答は外部送信・永続保存しません。ページを離れると消えます。
      </p>
      <section className="panel">
        <h2>1. 最初の操作</h2>
        <p>目的：指示を組み立て、結果を予想してから試す。</p>
        <label className="lab-field">
          結果の予想（保存しません）
          <textarea placeholder="どんな回答や画像になりそうですか？" />
        </label>
        <p>
          条件を選び、全文をコピーして別タブのGeminiに貼り付けます。Geminiでの送信は自分で行ってください。
        </p>
        {Object.entries(settings).map(([key, value]) => {
          const options = selectFields[id]?.[key];
          return (
            <label className="lab-field" key={key}>
              {labels[key]}
              {options ? (
                <select
                  aria-label={labels[key]}
                  value={value}
                  onChange={(ev) =>
                    setSettings({ ...settings, [key]: ev.target.value })
                  }
                >
                  {options.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              ) : (
                <textarea
                  aria-label={labels[key]}
                  value={value}
                  onChange={(ev) =>
                    setSettings({ ...settings, [key]: ev.target.value })
                  }
                />
              )}
            </label>
          );
        })}
        {id === "image" && (
          <label className="option">
            <input
              type="checkbox"
              checked={revisionMode}
              onChange={(ev) => setRevisionMode(ev.target.checked)}
            />
            一部だけ変更する追加指示を表示
          </label>
        )}
        <h3>現在のプロンプト全文</h3>
        <pre aria-label="現在のプロンプト全文" tabIndex={0}>
          {prompt}
        </pre>
        <div className="lab-actions">
          <button className="primary" onClick={copy}>
            プロンプト全文をコピー
          </button>
          <a href="https://gemini.google.com/" target="_blank" rel="noreferrer">
            Geminiを開く ↗（別タブ）
          </a>
        </div>
        <p role="status" aria-live="polite">
          {message}
        </p>
        <p>コピーしても、実行済み・理解済みにはなりません。</p>
        <label className="option">
          <input
            type="checkbox"
            checked={record.tried}
            onChange={(ev) => update({ tried: ev.target.checked })}
          />
          Geminiで実際に試した（自己申告）
        </label>
        {id === "image" && (
          <p>
            画像生成が利用できなくても、このビルダーと比較は使えます。試せない場合は実行の記録を付けずに進んでOKです。
          </p>
        )}
      </section>
      <section className="panel">
        <h2>2. 条件の変更</h2>
        <p>目的：一つの条件と結果の関係を発見する。</p>
        <p>{e.change}</p>
        <button
          onClick={() => {
            setBefore(prompt);
            setMessage(
              "変更前のプロンプトを比較用に保持しました。上の条件を一つ変えましょう。",
            );
          }}
        >
          現在の指示を「変更前」に保持
        </button>
        <p>保持してから上の設定を変更し、新しい指示で再び試しましょう。</p>
        <button
          onClick={() => {
            setSettings({ ...defaults[id] });
            setRevisionMode(false);
            setMessage(
              "設定を初期値に戻しました。比較用の指示と学習記録は保持しています。",
            );
          }}
        >
          元の設定に戻す
        </button>
      </section>
      <section className="panel">
        <h2>3. 変更前後の比較</h2>
        <p>目的：違いを言葉にし、意図した条件が反映されたか判断する。</p>
        <div className="lab-compare">
          <div>
            <h3>変更前のプロンプト</h3>
            <pre>
              {before || "手順2のボタンで比較する指示を保持してください。"}
            </pre>
          </div>
          <div>
            <h3>変更後のプロンプト</h3>
            <pre>{prompt}</pre>
          </div>
        </div>
        <p>{e.compare}</p>
        <p>
          以下は学習者がGeminiの回答を手動で貼り付ける欄です。教材の固定サンプルでも、自動取得した回答でもありません。保存しません。
        </p>
        <div className="lab-compare">
          <label className="lab-field">
            変更前の回答・画像の観察メモ
            <textarea />
          </label>
          <label className="lab-field">
            変更後の回答・画像の観察メモ
            <textarea />
          </label>
        </div>
        <label className="lab-field">
          予想と比べて気づいたこと
          <textarea />
        </label>
      </section>
      <section className="panel">
        <h2>4. 解説と注意点</h2>
        <p>目的：発見した違いの理由と、結果を使う前の確認方法を学ぶ。</p>
        <details>
          <summary>解説を読む</summary>
          <p>{e.explanation}</p>
          <p>{e.caution}</p>
        </details>
        <h3>教材内の固定理解チェック（Gemini生成問題ではありません）</h3>
        <KnowledgeCheck
          check={experienceCheck}
          value={record.check}
          onAnswer={(check) => update({ check })}
        />
        <p className="small">
          記録は最後に選んだ回答です。正解だけで理解を保証するものではありません。
        </p>
      </section>
      <section className="panel">
        <h2>5. 別の題材への応用</h2>
        <p>目的：自分で条件を決め、別の場面へ学びを移す。</p>
        <p>{e.application}</p>
        <label className="lab-field">
          再挑戦の計画・振り返り（保存しません）
          <textarea placeholder="誰に、何を、どの条件で伝えますか？確認する資料は？" />
        </label>
        <label className="option">
          <input
            type="checkbox"
            checked={record.applied}
            onChange={(ev) => update({ applied: ev.target.checked })}
          />
          条件を変え、別の題材への応用に取り組んだ（自己申告）
        </label>
        <p>応用の自己申告と、固定理解チェックの結果は別々に記録します。</p>
        <a href={`#${chapter.id}`}>
          第{chapter.number}章 {chapter.title}
          {chapter.status === "planned" ? "（準備中）" : ""} →
        </a>
        <p>
          <a href="#lab">イントロに戻り、別の体験を選ぶ →</a>
        </p>
      </section>
    </article>
  );
}
