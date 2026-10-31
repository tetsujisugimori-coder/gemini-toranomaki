import { useLayoutEffect, useRef, useState } from "react";
import { StudySteps, useStudyCopy } from "./StudyShared";
import {
  checks,
  fields,
  makeComparison,
  quality,
  questions,
  templates,
  tutorLabels,
  tutorOptions,
} from "./skills-data";
import {
  freshSkills,
  loadSkills,
  sanitizeSkills,
  saveSkills,
  type SkillsRecord,
} from "./skills-storage";

function Copy({ text }: { text: string }) {
  const copy = useStudyCopy(),
    current = useRef(text);
  current.current = text;
  useLayoutEffect(() => {
    copy.invalidate();
  }, [text]);
  return (
    <section>
      <label>
        指示文全文
        <textarea rows={7} readOnly value={text} />
      </label>
      <button
        disabled={copy.busy}
        onClick={() =>
          void copy.copy(
            text,
            () => {},
            () => current.current === text,
          )
        }
      >
        全文をコピー
      </button>
      <p role="status">{copy.message}</p>
      <p className="small">失敗した場合は全文を選択してコピーできます。</p>
    </section>
  );
}
const migrationLabels = [
  "スキル名",
  "説明",
  "適用条件",
  "行動ルール",
  "出力形式",
  "使用例",
];
const skillNames = [
  "プログラミング家庭教師",
  "やさしい日本語",
  "段階的ヒント",
  "すぐ答えを示す",
];
const comparisons = [
  [
    "基本用途",
    "特定の役割を持つGemで回答を調整",
    "再利用可能な指示をチャットやタスクに適用",
  ],
  ["指示の再利用", "Gemを選び会話", "複数の会話で同じ指示を使用"],
  ["利用開始", "Gemを開く", "チャットで /（順次 @）から指定"],
  ["自動適用", "Gemを選ぶ", "有効な関連スキルをGeminiが適用する場合がある"],
  ["複数の組合せ", "個別のGem", "一つのタスクに複数スキルを併用可能"],
  [
    "対応機能",
    "Gem固有の対応範囲",
    "Canvas、Deep Research、動画・音楽作成、ガイド付き学習は未対応",
  ],
  [
    "参照ファイル",
    "知識ファイルを追加",
    "合計100 MBまで。非対応形式・超過分は移行されない",
  ],
  [
    "移行予定",
    "18歳以上の個人: 2026年11月17日から読取専用、12月17日削除",
    "Workspace Business等は2027年3月、教育機関は6月。18歳未満は後日",
  ],
];
export function Skills({
  completed,
  onComplete,
}: {
  completed: boolean;
  onComplete: (v: boolean) => boolean;
}) {
  const [boot] = useState(loadSkills),
    [r, setR] = useState(boot.record),
    [available, setAvailable] = useState(boot.available),
    [confirm, setConfirm] = useState(false);
  const latest = useRef(r);
  function update(p: Partial<SkillsRecord>) {
    const n = sanitizeSkills({ ...latest.current, ...p });
    latest.current = n;
    setR(n);
    setAvailable(saveSkills(n));
  }
  const tutor = r.tutor,
    comparison = makeComparison(tutor, r.question),
    c = checks[r.step];
  const tutorText = `あなたは${tutorOptions[0][tutor[0]]}の家庭教師です。${tutorOptions[1][tutor[1]]}の学習者に${tutorOptions[2][tutor[2]]}で教え、${tutorOptions[3][tutor[3]]}回答します。間違いには${tutorOptions[4][tutor[4]]}。回答形式は${tutorOptions[5][tutor[5]]}。`;
  const editedText = fields.map((f, i) => `${f}: ${r.edited[i]}`).join("\n");
  const migrationText = migrationLabels
    .map((f, i) => `${f}: ${r.migration[i]}`)
    .join("\n");
  const simulation = r.mode === 0 ? r.selected : [true, true, true, false];
  return (
    <div className="skills-chapter">
      <p className="notice">
        固定教材の模擬回答とローカル規則です。実GeminiやAPIには接続せず、実際のAIの判断を再現・保証しません。
      </p>
      {!available && (
        <p role="alert">
          保存できません。画面内の変更は再読み込み後に失われる場合があります。
        </p>
      )}
      <StudySteps
        labels={[
          "AI家庭教師を設計",
          "カスタム指示工房",
          "回答を比較",
          "GemsからSkillsへ",
        ]}
        step={r.step}
        onStep={(step) => update({ step })}
      />
      {r.step === 0 && (
        <section className="panel">
          <h2>AI家庭教師を設計する</h2>
          <p>条件を変えると、指示と回答例がすぐ変化します。</p>
          <div className="skills-grid">
            <div>
              {tutorLabels.map((label, i) => (
                <label key={label}>
                  {label}
                  <select
                    value={tutor[i]}
                    onChange={(e) =>
                      update({
                        tutor: tutor.map((v, j) =>
                          j === i ? Number(e.target.value) : v,
                        ),
                      })
                    }
                  >
                    {tutorOptions[i].map((o, j) => (
                      <option value={j} key={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
              <button onClick={() => update({ tutor: freshSkills().tutor })}>
                家庭教師の設定を初期化
              </button>
            </div>
            <div>
              <h3>設計プレビュー</h3>
              <p>
                <strong>名前:</strong> {tutorOptions[0][tutor[0]]}の伴走先生
              </p>
              <p>
                <strong>役割と方針:</strong> {tutorText}
              </p>
              <p>
                <strong>回答例（for文）:</strong>{" "}
                {makeComparison(tutor, 0).custom}
              </p>
              <Copy text={tutorText} />
            </div>
          </div>
        </section>
      )}
      {r.step === 1 && (
        <section className="panel">
          <h2>カスタム指示工房</h2>
          <label>
            テンプレート
            <select
              value={r.template}
              onChange={(e) => {
                if (e.target.value !== r.template)
                  update({
                    template: e.target.value,
                    drafts: { ...r.drafts, [r.template]: r.edited },
                    edited: [...r.drafts[e.target.value]],
                  });
              }}
            >
              {Object.keys(templates).map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <div className="skills-grid">
            <div>
              {fields.map((f, i) => (
                <label key={f}>
                  {f}
                  <textarea
                    rows={2}
                    maxLength={4000}
                    value={r.edited[i]}
                    onChange={(e) =>
                      update({
                        edited: r.edited.map((x, j) =>
                          i === j ? e.target.value : x,
                        ),
                      })
                    }
                  />
                </label>
              ))}
            </div>
            <div>
              <h3>品質の手がかり</h3>
              <p>
                文字数と特定の語句を使う教材独自の簡易規則です。AIの理解や矛盾の不存在を保証しません。
              </p>
              <ul>
                {quality(r.edited).map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <Copy text={editedText} />
            </div>
          </div>
        </section>
      )}
      {r.step === 2 && (
        <section className="panel">
          <h2>同じ質問で回答を比較</h2>
          <p>
            家庭教師の設定が右側に反映されます。表示は教材データであり、Geminiの回答ではありません。
          </p>
          <label>
            質問
            <select
              value={r.question}
              onChange={(e) => update({ question: Number(e.target.value) })}
            >
              {questions.map((q, i) => (
                <option key={q} value={i}>
                  {q}
                </option>
              ))}
            </select>
          </label>
          <div className="skills-grid">
            <section className="notice">
              <h3>一般的なAIの模擬回答</h3>
              <p>{comparison.general}</p>
            </section>
            <section className="notice">
              <h3>専用AIの模擬回答</h3>
              <p className="skills-result">{comparison.custom}</p>
            </section>
          </div>
          <h3>何が、なぜ変わった？</h3>
          <p>
            {comparison.reason}{" "}
            体験1に戻って教え方や形式を変え、再比較してください。
          </p>
        </section>
      )}
      {r.step === 3 && (
        <section className="panel">
          <h2>GemsからSkillsへの進化</h2>
          <h3>Stage A：比較する</h3>
          <p>
            項目を開いて違いを確認します。公式情報は2026年10月31日確認、提供状況は変わる場合があります。
          </p>
          {comparisons.map(([title, gem, skill]) => (
            <details key={title}>
              <summary>{title}</summary>
              <p>Gem: {gem}</p>
              <p>Skill: {skill}</p>
            </details>
          ))}
          <p>
            Skillsは18歳以上、ログインとアクティビティ保存が必要です。個人以外の利用時期や契約は公式情報を確認してください。SKILL.mdをルートに置き、小文字・ハイフンの名前を使います。ファイルのアップロードはウェブで確認してください。Macでの提供は公式資料間に差があり、要再確認です。スクリプトの外部リクエストは不可です。
          </p>
          <p>
            非対応例:
            GitHub、音声、動画、旧Office形式、圧縮された参照ファイル。移行で100
            MBを超えると大きいファイルから除外されます。事前に保存と移行結果を確認してください。
          </p>
          <h3>Stage B：旧指示を整理</h3>
          <p>
            旧Gem例「Pythonを教える先生として、初心者に優しく説明する」。これは学習用の再構成で、自動変換を保証しません。
          </p>
          {migrationLabels.map((f, i) => (
            <label key={f}>
              {f}
              <textarea
                rows={2}
                maxLength={4000}
                value={r.migration[i]}
                onChange={(e) =>
                  update({
                    migration: r.migration.map((x, j) =>
                      i === j ? e.target.value : x,
                    ),
                  })
                }
              />
            </label>
          ))}
          <Copy text={migrationText} />
          <h3>Stage C：適用シミュレーション</h3>
          <p>
            質問「Python初心者にfor文を教えて」。自動判定は教材の固定規則であり、Gemini内部の判定ではありません。
          </p>
          <label>
            選び方
            <select
              value={r.mode}
              onChange={(e) => update({ mode: Number(e.target.value) })}
            >
              <option value={0}>手動で選択</option>
              <option value={1}>教材ルールで自動選択</option>
            </select>
          </label>
          {r.mode === 0 &&
            skillNames.map((s, i) => (
              <label key={s}>
                <input
                  type="checkbox"
                  checked={r.selected[i]}
                  onChange={(e) =>
                    update({
                      selected: r.selected.map((x, j) =>
                        i === j ? e.target.checked : x,
                      ),
                    })
                  }
                />
                {s}
              </label>
            ))}
          <p>
            適用候補:{" "}
            {skillNames.filter((_, i) => simulation[i]).join("、") || "なし"}
          </p>
          <p>
            {simulation[2] && simulation[3]
              ? "衝突: ヒントを出す指示と答えをすぐ示す指示が競合します。優先順位や適用場面を見直しましょう。"
              : "教材内では指示の衝突を検出していません。実際の併用結果の保証ではありません。"}
          </p>
        </section>
      )}
      <section className="panel">
        <h3>確認問題</h3>
        <fieldset>
          <legend>{c.question}</legend>
          {c.options.map((o, i) => (
            <label key={o}>
              <input
                type="radio"
                name={`skills-check-${r.step}`}
                checked={r.answers[r.step] === i}
                onChange={() =>
                  update({ answers: { ...r.answers, [r.step]: i } })
                }
              />
              {o}
            </label>
          ))}
        </fieldset>
        {r.answers[r.step] !== undefined && (
          <p role="status">
            {r.answers[r.step] === c.answer
              ? "正解です。"
              : "不正解です。再挑戦できます。"}
            {c.reason}
          </p>
        )}
        <button
          onClick={() => {
            const answers = { ...r.answers };
            delete answers[r.step];
            update({ answers });
          }}
        >
          この問題を再挑戦
        </button>
        <label>
          <input
            type="checkbox"
            checked={r.completed.includes(r.step)}
            onChange={(e) =>
              update({
                completed: e.target.checked
                  ? [...r.completed, r.step]
                  : r.completed.filter((x) => x !== r.step),
              })
            }
          />
          この体験を完了した
        </label>
      </section>
      <section className="panel">
        <p>完了した体験: {r.completed.length} / 4</p>
        <label>
          <input
            type="checkbox"
            checked={completed}
            onChange={(e) => onComplete(e.target.checked)}
          />
          第9章を完了した
        </label>
        <button onClick={() => setConfirm(true)}>第9章の記録を初期化</button>
        {confirm && (
          <div>
            <p>第9章の設定と回答を初期化します。</p>
            <button
              onClick={() => {
                update(freshSkills());
                onComplete(false);
                setConfirm(false);
              }}
            >
              初期化する
            </button>
            <button onClick={() => setConfirm(false)}>キャンセル</button>
          </div>
        )}
      </section>
    </div>
  );
}
