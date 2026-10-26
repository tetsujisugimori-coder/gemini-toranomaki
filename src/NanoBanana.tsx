import { useEffect, useRef, useState, useId, useLayoutEffect } from "react";
import { NanoArt, type ArtProps } from "./NanoArt";
import { StudySteps, useStudyCopy } from "./StudyShared";
import {
  backgrounds,
  characterPrompt,
  compositions,
  copyId,
  defaultEdit,
  editPrompt,
  imagePrompt,
  nanoReferences,
  pins,
  regions,
  repairPrompt,
  sameRegions,
  scenes,
  styles,
  subjects,
  tasks,
  type EditChoices,
  type ImageSettings,
  type Region,
} from "./nano-data";
import {
  freshNano,
  loadNano,
  removeNano,
  sanitizeNano,
  saveNano,
  type NanoRecord,
} from "./nano-storage";
type RecordUpdate = (patch: Partial<NanoRecord>) => void;
function Choices({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: number;
  onChange: (n: number) => void;
}) {
  const id = useId();
  return (
    <div className="nano-select">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {options.map((s, i) => (
          <option key={s} value={i}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}
function Prompt({
  kind,
  text,
  r,
  onCopy,
}: {
  kind: string;
  text: string;
  r: NanoRecord;
  onCopy: (id: string) => void;
}) {
  const copy = useStudyCopy(),
    current = useRef(text);
  current.current = text;
  useEffect(() => {
    copy.invalidate();
  }, [text]);
  const id = copyId(kind, text);
  return (
    <section className="nano-prompt" aria-label="指示文全文">
      <h3>Gemini向けの指示文（全文）</h3>
      <textarea readOnly aria-label="指示文全文" value={text} rows={6} />
      <button
        className="primary"
        disabled={copy.busy}
        onClick={() =>
          void copy.copy(
            text,
            () => onCopy(id),
            () => current.current === text,
          )
        }
      >
        指示文を全文コピー
      </button>
      <p role="status">{copy.message}</p>
      {r.copied.includes(id) && (
        <p className="small">
          この本文のコピー成功履歴があります。生成や理解の成功を示しません。
        </p>
      )}
      <p className="small">
        コピーできない場合は上の全文欄を選択し、手動コピーできます。実Geminiでの操作は任意です。
      </p>
    </section>
  );
}
function Prediction({
  value,
  onChange,
  locked = false,
}: {
  value: number | null;
  onChange: (n: number) => void;
  locked?: boolean;
}) {
  return (
    <fieldset disabled={locked}>
      <legend>操作前の予想</legend>
      {[
        "指定した部位だけが変わると思う",
        "指定外の部位も変わるかもしれない",
      ].map((s, i) => (
        <label key={s}>
          <input
            type="radio"
            name="nano-prediction"
            checked={value === i}
            onChange={() => onChange(i)}
          />
          {s}
        </label>
      ))}
    </fieldset>
  );
}
export function NanoCompare({
  before,
  after,
  interactive,
  selected,
  onRegion,
}: {
  before: ArtProps;
  after: ArtProps;
  interactive?: boolean;
  selected?: readonly string[];
  onRegion?: (r: Region) => void;
}) {
  const [position, setPosition] = useState(50),
    [view, setView] = useState("compare");
  return (
    <div className="nano-comparison">
      <div className="lab-actions">
        {[
          ["compare", "境界で比較"],
          ["before", "変更前だけ"],
          ["after", "変更後だけ"],
        ].map(([id, label]) => (
          <button
            key={id}
            aria-pressed={view === id}
            onClick={() => setView(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="nano-stage" data-view={view}>
        <NanoArt {...before} />
        <div
          className="nano-overlay"
          style={{
            clipPath: `inset(0 ${view === "before" ? 100 : view === "after" ? 0 : 100 - position}% 0 0)`,
          }}
        >
          <NanoArt {...after} />
        </div>
        {view === "compare" && (
          <div
            className="nano-boundary"
            style={{ left: `${position}%` }}
            aria-hidden="true"
          />
        )}
      </div>
      <p className="small">
        左：変更後 / 右：変更前（境界比較時）。同じ600×440座標・同じ拡大率です。
      </p>
      {view === "compare" && (
        <label>
          比較位置：{position}%
          <input
            aria-label="比較位置"
            type="range"
            min="0"
            max="100"
            value={position}
            onChange={(e) => setPosition(Number(e.target.value))}
          />
        </label>
      )}
      {interactive && (
        <div className="nano-pointing">
          <h4>変更後で気づいた部位を指摘</h4>
          <p className="small">
            画像内の部位をタップ、または下の同じ部位名で選択。選択は正解判定ではありません。
          </p>
          <NanoArt {...after} selected={selected} onRegion={onRegion} />
        </div>
      )}
    </div>
  );
}
function RegionAnswers({
  selected,
  onChange,
}: {
  selected: readonly string[];
  onChange: (id: Region) => void;
}) {
  return (
    <fieldset>
      <legend>変化したと思う部位（複数選択可・画像操作の代わり）</legend>
      <div className="nano-region-options">
        {regions.map((r) => (
          <label key={r.id}>
            <input
              type="checkbox"
              checked={selected.includes(r.id)}
              onChange={() => onChange(r.id)}
            />
            {r.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
function Workshop({
  r,
  update,
  prompt,
}: {
  r: NanoRecord;
  update: RecordUpdate;
  prompt: (kind: string, text: string) => React.ReactNode;
}) {
  const [prediction, setPrediction] = useState<number | null>(null),
    [snapshot, setSnapshot] = useState<{
      settings: ImageSettings;
      prediction: number;
    } | null>(null),
    [showReason, setShowReason] = useState(false);
  function change(k: keyof ImageSettings, n: number) {
    if (r.image[k] === n) return;
    update({ image: { ...r.image, [k]: n } });
    setSnapshot(null);
    setPrediction(null);
    setShowReason(false);
  }
  return (
    <>
      <h2>画像生成工房</h2>
      <p>
        「かわいい犬を描いて」だけなら、どんな場面になるでしょう？
        主役と用途に必要な条件を選びます。
      </p>
      <div className="nano-controls">
        {(
          [
            ["主役", subjects, "subject"],
            ["背景", backgrounds, "background"],
            ["画風", styles, "style"],
            ["構図", compositions, "composition"],
          ] as const
        ).map(([label, options, key]) => (
          <Choices
            key={key}
            label={label}
            options={options}
            value={r.image[key]}
            onChange={(n) => change(key, n)}
          />
        ))}
      </div>
      <fieldset disabled={!!snapshot}>
        <legend>表示前に予想：曖昧な指示から何が具体化される？</legend>
        {["選んだ主役・背景・画風・構図", "必ず理想どおりの細部すべて"].map(
          (s, i) => (
            <label key={s}>
              <input
                type="radio"
                name="workshop-prediction"
                checked={prediction === i}
                onChange={() => setPrediction(i)}
              />
              {s}
            </label>
          ),
        )}
      </fieldset>
      <button
        className="primary"
        disabled={prediction === null || !!snapshot}
        onClick={() => {
          setSnapshot({ settings: { ...r.image }, prediction: prediction! });
          update({ history: [...r.history, "workshop:v1"] });
        }}
      >
        条件を固定して模擬画像を表示
      </button>
      {snapshot && (
        <>
          <NanoArt
            settings={snapshot.settings}
            label="選択条件を反映した教材用の固定SVGイラスト"
          />
          <p>
            固定SVGの変化：{subjects[r.image.subject]} /{" "}
            {backgrounds[r.image.background]} / {styles[r.image.style]} /{" "}
            {compositions[r.image.composition]}
          </p>
          <p className="small">
            画風は色・陰影・輪郭・紙の質感、構図は同じ絵の拡大範囲で簡略表現しています。AIによる描き直しや本物の水彩画ではありません。
          </p>
          <button onClick={() => setShowReason(true)}>
            観察して理由を確認
          </button>
          {showReason && (
            <p role="status">
              {snapshot.prediction === 0
                ? "予想と対応しています。"
                : "すべての細部を保証することはできません。"}
              目的に必要な主役・場面・見せ方を具体化します。条件の数を増やすほど良いとは限らず、実画像では矛盾や指定外の変化も確認します。
            </p>
          )}
          <button
            onClick={() => {
              setSnapshot(null);
              setShowReason(false);
            }}
          >
            予想を変えて再挑戦
          </button>
        </>
      )}
      {prompt("workshop", imagePrompt(r.image))}
      <details>
        <summary>ヒント：何を変えて比べる？</summary>
        <p>
          一度に一条件だけ変えると、指示と見え方の対応を観察しやすくなります。
        </p>
      </details>
    </>
  );
}
function Challenge({
  mode,
  r,
  update,
  prompt,
}: {
  mode: "edit" | "find";
  r: NanoRecord;
  update: RecordUpdate;
  prompt: (kind: string, text: string) => React.ReactNode;
}) {
  const taskIndex = mode === "edit" ? r.editTask : r.findTask,
    t = tasks[taskIndex],
    id = `${mode}:${t.id}`;
  const [choices, setChoices] = useState<EditChoices>({
      ...defaultEdit,
      target: regions.findIndex((x) => x.id === t.target),
      result: taskIndex,
    }),
    [prediction, setPrediction] = useState<number | null>(null),
    [snapshot, setSnapshot] = useState<{
      prediction: number;
      choices: EditChoices;
    } | null>(null),
    [selected, setSelected] = useState<Region[]>([]),
    [submitted, setSubmitted] = useState(false),
    [include, setInclude] = useState([true, true, true, true]);
  const feedback = useRef<HTMLHeadingElement>(null),
    predictionHead = useRef<HTMLDivElement>(null);
  const before: ArtProps = {
    label: "変更前：教材用オリジナル画像",
    apple: taskIndex !== 2,
  };
  const after: ArtProps = {
    ...before,
    label: "変更後：教材用の固定修正画像",
    hatRed: taskIndex === 0,
    sunset: taskIndex === 1,
    apple: true,
    ...(mode === "find"
      ? {
          narrowEyes: taskIndex === 0,
          apple: taskIndex === 1 ? false : true,
          stripes: taskIndex === 2,
        }
      : {}),
  };
  const expected: Region[] =
    mode === "edit" ? [t.target] : [t.target, t.unexpected];
  function select(region: Region) {
    setSelected((v) =>
      v.includes(region) ? v.filter((x) => x !== region) : [...v, region],
    );
    setSubmitted(false);
  }
  function retry() {
    setSnapshot(null);
    setSelected([]);
    setSubmitted(false);
    setPrediction(null);
    requestAnimationFrame(() => predictionHead.current?.focus());
  }
  function changeChoices(p: Partial<EditChoices>) {
    if (
      Object.entries(p).every(([k, v]) => choices[k as keyof EditChoices] === v)
    )
      return;
    setChoices({ ...choices, ...p });
    setSnapshot(null);
    setSelected([]);
    setSubmitted(false);
    setPrediction(null);
  }
  const canRun =
    mode === "find" ||
    (choices.target === regions.findIndex((x) => x.id === t.target) &&
      choices.result === taskIndex &&
      choices.preserve &&
      choices.inspect);
  return (
    <>
      <h2>{mode === "edit" ? "部分修正チャレンジ" : "画像の間違い探し"}</h2>
      <Choices
        label="比較課題"
        options={tasks.map((x) => x.title)}
        value={taskIndex}
        onChange={(n) =>
          update(mode === "edit" ? { editTask: n } : { findTask: n })
        }
      />
      <p>
        {mode === "find"
          ? "指定した部分以外も同じでしょうか？ 変更前をよく見てから、変化した部位をすべて探します。"
          : "変更対象と維持するものを分けて、修正指示を準備しましょう。"}
      </p>
      <NanoArt {...before} />
      {mode === "edit" && (
        <div className="nano-controls">
          <Choices
            label="変更対象"
            options={regions.map((x) => x.label)}
            value={choices.target}
            onChange={(n) => changeChoices({ target: n })}
          />
          <Choices
            label="期待する結果"
            options={tasks.map((x) => x.result)}
            value={choices.result}
            onChange={(n) => changeChoices({ result: n })}
          />
          <label>
            <input
              type="checkbox"
              checked={choices.preserve}
              onChange={(e) => changeChoices({ preserve: e.target.checked })}
            />
            維持する対象：{t.keep}
          </label>
          <label>
            <input
              type="checkbox"
              checked={choices.inspect}
              onChange={(e) => changeChoices({ inspect: e.target.checked })}
            />
            確認すべき箇所：{t.inspection}
          </label>
        </div>
      )}
      <div ref={predictionHead} tabIndex={-1}>
        <Prediction
          value={prediction}
          onChange={setPrediction}
          locked={!!snapshot}
        />
      </div>
      <button
        className="primary"
        disabled={prediction === null || !!snapshot}
        onClick={() =>
          setSnapshot({ prediction: prediction!, choices: { ...choices } })
        }
      >
        予想を固定して比較を開く
      </button>
      {snapshot && (
        <>
          {!canRun ? (
            <p role="status">
              課題と指示の対象・期待・維持条件・確認方法がそろっていません。生成したように表示せず保留します。条件を見直して再挑戦してください。
            </p>
          ) : (
            <>
              <NanoCompare
                before={before}
                after={after}
                interactive={mode === "find"}
                selected={selected}
                onRegion={select}
              />
              <details>
                <summary>文字で観察する（画像の代替）</summary>
                <p>
                  変更前：帽子は白、目は丸、服は星模様、リンゴは
                  {taskIndex === 2 ? "なし" : "1個"}、窓の外は宇宙。
                </p>
                <p>
                  変更後：帽子は{taskIndex === 0 ? "赤" : "白"}、目は
                  {mode === "find" && taskIndex === 0 ? "細い線" : "丸"}、服は
                  {mode === "find" && taskIndex === 2 ? "横縞" : "星模様"}
                  、リンゴは
                  {mode === "find" && taskIndex === 1 ? "なし" : "1個"}
                  、窓の外は{taskIndex === 1 ? "夕焼け" : "宇宙"}。
                </p>
                <p>
                  これは見えている情報の文字表現です。意図に合っているかは自分で判断します。
                </p>
              </details>
              <RegionAnswers selected={selected} onChange={select} />
              <button
                onClick={() => {
                  setSubmitted(true);
                  update({
                    history: [...r.history, id],
                    answers: { ...r.answers, [id]: selected },
                  });
                  requestAnimationFrame(() => feedback.current?.focus());
                }}
              >
                観察結果を確定
              </button>
              {submitted && (
                <section className="notice">
                  <h3 ref={feedback} tabIndex={-1}>
                    観察の答え合わせ
                  </h3>
                  <p role="status">
                    {sameRegions(selected, expected)
                      ? "観察は一致しています。"
                      : "もう一度、変更前後を比べましょう。"}
                  </p>
                  <p>
                    意図した変更：{t.result}。
                    {mode === "find"
                      ? `意図していない変更：${t.evidence}`
                      : "教材のこの修正例では、指定外の部位は維持しています。実画像でも同じ結果を保証しません。"}
                  </p>
                  <p>
                    見逃した箇所：
                    {expected
                      .filter((x) => !selected.includes(x))
                      .map((x) => regions.find((r) => r.id === x)!.label)
                      .join("、") || "なし"}
                    。変化していない部位の指摘：
                    {selected
                      .filter((x) => !expected.includes(x))
                      .map((x) => regions.find((r) => r.id === x)!.label)
                      .join("、") || "なし"}
                    。
                  </p>
                  <p>
                    確定した予想：
                    {snapshot.prediction === 0
                      ? "指定した部位だけが変わる"
                      : "指定外の部位も変わるかもしれない"}
                    。部分的な成功と画像全体の一致は別です。変更対象だけでなく維持対象も元画像と照合します。
                  </p>
                  {mode === "find" && (
                    <>
                      <h4>再修正の指示を組み立てる</h4>
                      {[
                        "観察できた不具合",
                        "本来期待する状態",
                        "維持したい要素",
                        "修正後の確認方法",
                      ].map((s, i) => (
                        <label key={s}>
                          <input
                            type="checkbox"
                            checked={include[i]}
                            onChange={(e) =>
                              setInclude((v) =>
                                v.map((b, j) =>
                                  j === i ? e.target.checked : b,
                                ),
                              )
                            }
                          />
                          {s}
                        </label>
                      ))}
                      {prompt("repair", repairPrompt(taskIndex, include))}
                    </>
                  )}
                </section>
              )}
            </>
          )}
          <button onClick={retry}>予想から再挑戦</button>
          <p className="small">
            予想は固定済みです。変更には再挑戦が必要です。前の答え合わせは解除し、新しい観察を行います。
          </p>
        </>
      )}
      {r.answers[id] && (
        <p className="small">
          前回の回答履歴：
          {r.answers[id]
            .map((x) => regions.find((r) => r.id === x)?.label)
            .join("、") || "選択なし"}
          。過去の回答であり、今回の正答の証拠ではありません。
        </p>
      )}
      {mode === "edit" && prompt("edit", editPrompt(taskIndex, choices))}
      <details>
        <summary>観察のヒント（必要なときだけ）</summary>
        <p>
          変更対象を確認したら、顔、服、背景、小物へと順に視線を動かします。再挑戦では同じ順番で見て、見落としを減らしましょう。
        </p>
      </details>
    </>
  );
}
function Character({
  r,
  update,
  prompt,
}: {
  r: NanoRecord;
  update: RecordUpdate;
  prompt: (kind: string, text: string) => React.ReactNode;
}) {
  const [scene, setScene] = useState(0),
    [prediction, setPrediction] = useState<number | null>(null),
    [open, setOpen] = useState(false),
    [answer, setAnswer] = useState<Record<string, string>>({}),
    [judged, setJudged] = useState(false);
  const drift = scene === 2;
  return (
    <>
      <h2>キャラクターを育てる</h2>
      <p>
        工房の基本キャラクター「柴犬の料理人」を3場面で比べます。ロボット・猫を選んだ工房とは独立した固定教材です。
      </p>
      <fieldset>
        <legend>キャラクター設定：固定したい特徴</legend>
        {pins.map((s, i) => (
          <label key={s}>
            <input
              type="checkbox"
              checked={r.pins.includes(i)}
              onChange={() => {
                update({
                  pins: r.pins.includes(i)
                    ? r.pins.filter((x) => x !== i)
                    : [...r.pins, i],
                });
              }}
            />
            {s}
          </label>
        ))}
      </fieldset>
      <p className="small">
        特徴の選択は指示文に反映します。下の固定比較画像を書き換える操作ではありません。
      </p>
      <Choices
        label="比較する場面"
        options={scenes}
        value={scene}
        onChange={(n) => {
          if (n === scene) return;
          setScene(n);
          setOpen(false);
          setPrediction(null);
          setAnswer({});
          setJudged(false);
        }}
      />
      <fieldset disabled={open}>
        <legend>見る前の予想：場面が変わっても同じ特徴を保てる？</legend>
        {["必ず同じになる", "参照と固定条件を伝えても照合が必要"].map(
          (s, i) => (
            <label key={s}>
              <input
                type="radio"
                name="character-prediction"
                checked={prediction === i}
                onChange={() => setPrediction(i)}
              />
              {s}
            </label>
          ),
        )}
      </fieldset>
      <button
        disabled={prediction === null || open}
        onClick={() => setOpen(true)}
      >
        予想を固定して場面を比較
      </button>
      {open && (
        <>
          <div className="nano-pair">
            <figure>
              <NanoArt label="基本キャラクター：宇宙船の厨房" />
              <figcaption>基本キャラクター</figcaption>
            </figure>
            <figure>
              <NanoArt
                scene={scene}
                drift={drift}
                settings={{
                  subject: 0,
                  background: scene === 1 ? 1 : 0,
                  style: 0,
                  composition: 0,
                }}
                label={`比較画像：${scenes[scene]}。特徴の違いを観察してください`}
              />
              <figcaption>{scenes[scene]}</figcaption>
            </figure>
          </div>
          <details>
            <summary>文字で特徴を観察する</summary>
            <p>
              基本：黄茶色の毛、丸い顔、三角の耳、黄色い星模様のエプロン、標準的な体格。
            </p>
            <p>
              比較：{drift ? "濃い茶色" : "黄茶色"}
              の毛、丸い顔、三角の耳、黄色い星模様のエプロン、同じ体格。
            </p>
          </details>
          {pins.map((pin, i) => (
            <fieldset key={pin}>
              <legend>{pin}は一致していますか？</legend>
              {[
                ["same", "一致している"],
                ["different", "一致していない"],
              ].map(([id, label]) => (
                <label key={id}>
                  <input
                    type="radio"
                    name={`character-answer-${i}`}
                    checked={answer[i] === id}
                    onChange={() => {
                      setAnswer((v) => ({ ...v, [i]: id }));
                      setJudged(false);
                    }}
                  />
                  {label}
                </label>
              ))}
            </fieldset>
          ))}
          <button
            disabled={Object.keys(answer).length !== 5}
            onClick={() => {
              setJudged(true);
              update({
                history: [...r.history, "character:v1"],
                answers: {
                  ...r.answers,
                  "character:v1": pins.map((_, i) => `${i}:${answer[i]}`),
                },
              });
            }}
          >
            特徴の判断を確定
          </button>
          {judged && (
            <p role="status">
              {pins.every(
                (_, i) =>
                  answer[i] === (drift && i === 0 ? "different" : "same"),
              )
                ? "判断は一致しています。"
                : `もう一度比べる特徴：${pins.filter((_, i) => answer[i] !== (drift && i === 0 ? "different" : "same")).join("、")}。`}
              {drift
                ? "記念撮影の例では茶色が濃く変わっています。"
                : "この例の毛色は同じです。"}
              参照画像と毛色・顔・耳・服・体格を場面ごとに照合します。参照画像や詳細な設定でも完全な同一性は保証できません。
            </p>
          )}
          <button
            onClick={() => {
              setOpen(false);
              setPrediction(null);
              setAnswer({});
              setJudged(false);
            }}
          >
            場面をもう一度観察する
          </button>
        </>
      )}
      {prompt("character", characterPrompt(r.pins))}
    </>
  );
}
export function NanoBanana({
  completed,
  onComplete,
}: {
  completed: boolean;
  onComplete: (b: boolean) => boolean;
}) {
  const [boot] = useState(loadNano),
    [r, setR] = useState(boot.record),
    [available, setAvailable] = useState(boot.available),
    [resetting, setResetting] = useState(false),
    [epoch, setEpoch] = useState(0),
    [os, setOs] = useState("pc"),
    [message, setMessage] = useState("");
  const latest = useRef(r),
    heading = useRef<HTMLHeadingElement>(null),
    resetButton = useRef<HTMLButtonElement>(null);
  const pendingStepFocus = useRef(false);
  useLayoutEffect(() => {
    if (pendingStepFocus.current) {
      pendingStepFocus.current = false;
      heading.current?.focus();
    }
  }, [r.step]);
  function update(p: Partial<NanoRecord>) {
    const next = sanitizeNano({ ...latest.current, ...p });
    latest.current = next;
    setR(next);
    setAvailable(saveNano(next));
  }
  function prompt(kind: string, text: string) {
    return (
      <Prompt
        kind={kind}
        text={text}
        r={r}
        onCopy={(id) => update({ copied: [...latest.current.copied, id] })}
      />
    );
  }
  return (
    <div className="nano-chapter">
      <p className="notice">
        教材用の固定模擬画像です。AI生成・画像アップロード・Googleへの送信は行いません。すべての体験はログインや有料機能なしで学べます。
      </p>
      {!available && (
        <p role="alert">
          ブラウザに保存できません。この画面内では学習できますが、永続化されていません。再読み込みで旧記録が復帰する可能性があります。保存拒否・容量不足・不正データを確認してください。
        </p>
      )}
      <StudySteps
        labels={[
          "画像生成工房",
          "部分修正チャレンジ",
          "画像の間違い探し",
          "キャラクターを育てる",
        ]}
        step={r.step}
        onStep={(step) => {
          if (step !== r.step) {
            pendingStepFocus.current = true;
            update({ step });
          } else heading.current?.focus();
        }}
      />
      <h2 className="nano-location" ref={heading} tabIndex={-1}>
        体験{r.step + 1}の操作
      </h2>
      <div
        key={`${epoch}:${r.step}:${r.step === 1 ? r.editTask : r.step === 2 ? r.findTask : ""}`}
      >
        {r.step === 0 ? (
          <Workshop r={r} update={update} prompt={prompt} />
        ) : r.step === 1 || r.step === 2 ? (
          <Challenge
            mode={r.step === 1 ? "edit" : "find"}
            r={r}
            update={update}
            prompt={prompt}
          />
        ) : (
          <Character r={r} update={update} prompt={prompt} />
        )}
      </div>
      <section className="panel">
        <h2>学習記録（現在の正答とは別）</h2>
        <p>
          模擬操作・回答の履歴：{r.history.length}種類 / 本文コピー履歴：
          {r.copied.length}種類
        </p>
        <label>
          <input
            type="checkbox"
            checked={r.tried}
            onChange={(e) => update({ tried: e.target.checked })}
          />
          任意の実Gemini演習を試した（自己申告）
        </label>
        <label>
          <input
            type="checkbox"
            checked={completed}
            onChange={(e) => onComplete(e.target.checked)}
          />
          第7章を学習した（完了の自己申告・実操作や全問正解は不要）
        </label>
      </section>
      <details>
        <summary>任意：自分のGeminiで試す・公式情報</summary>
        <div className="service-content">
          <a
            className="primary"
            href="https://gemini.google.com/"
            target="_blank"
            rel="noreferrer"
          >
            Geminiを開く ↗（別タブ・任意）
          </a>
          <ol>
            <li>
              自分の画面で利用できる画像生成・編集機能とモデルを確認する。
            </li>
            <li>教材の全文指示をコピーし、Geminiで生成する。</li>
            <li>期待した箇所と維持したい箇所を元画像と照合する。</li>
            <li>必要なら再修正し、指定外の変化も確認する。</li>
          </ol>
          <p>
            実画像や個人情報を教材へ入力・保存する機能はありません。実在人物の写真は不要です。使用権のある資料だけを使い、公開前に権利・プライバシー・内容を確認してください。外部リンクは機能の提供やログイン成功を保証しません。
          </p>
          <Choices
            label="公式案内の端末"
            options={["PC", "iPhone / iPad", "Android"]}
            value={["pc", "ios", "android"].indexOf(os)}
            onChange={(n) => setOs(["pc", "ios", "android"][n])}
          />
          <p>
            2026-10-26 JST確認。ヘルプは2
            Lite（Flash-Lite、複数参照・複数回編集に非対応）、2（Flash/Pro、複数参照対応）、有料プランのPro再生成を説明。紹介ページは2.1にも言及し、名称・入口に差があります。自分の画面でも確認してください。
          </p>
          <p>
            {os === "pc"
              ? "PCのヘルプ：gemini.google.comのサイドバー「画像」から作成し、ライブラリの画像から「チャット」で編集。"
              : os === "ios"
                ? "iOSのヘルプ：GeminiアプリまたはWebのメニュー「画像」から作成し、ライブラリの画像からチャットで編集。"
                : "Androidのヘルプ：GeminiアプリまたはWebのメニュー「画像」から作成し、ライブラリの画像からチャットで編集。"}
            画面や提供条件は変わります。
          </p>
          <p>
            年齢の本文には生成13歳以上（地域条件あり）と生成・編集18歳以上の記載が併存し、編集は18歳未満不可と明記されています。学校アカウントや国・言語・プラン・上限にも差があり、この教材では利用可否を保証しません。詳細は各公式本文で確認してください。
          </p>
          {nanoReferences
            .filter((x) => x.os === os || x.os === "all")
            .map((x) => (
              <p key={x.url}>
                <a href={x.url} target="_blank" rel="noreferrer">
                  {x.title} ↗
                </a>
              </p>
            ))}
        </div>
      </details>
      <p className="small">
        画像は本教材用オリジナルSVG。外部画像・Google公式画像は使用していません。素材と利用条件は検証文書に記録しています。
      </p>
      <button ref={resetButton} onClick={() => setResetting(true)}>
        第7章だけを初期化
      </button>
      {resetting && (
        <section className="notice" aria-label="第7章の初期化確認">
          <p>
            第7章の固定条件・回答履歴・コピー履歴・自己申告と章7完了を消します。他章・ラボ・探索は残します。
          </p>
          <button
            onClick={() => {
              setResetting(false);
              resetButton.current?.focus();
            }}
          >
            キャンセル
          </button>
          <button
            onClick={() => {
              const ok = removeNano(),
                progressOk = onComplete(false),
                next = freshNano();
              latest.current = next;
              setR(next);
              setEpoch((x) => x + 1);
              setAvailable(ok && progressOk);
              setMessage(
                ok && progressOk
                  ? "第7章の記録と完了を初期化しました。"
                  : "画面内では初期化しましたが、保存済み記録の削除を確認できません。再読み込みで旧記録が復帰する可能性があります。",
              );
              setResetting(false);
              requestAnimationFrame(() => resetButton.current?.focus());
            }}
          >
            第7章の記録を消す
          </button>
        </section>
      )}
      <p role="status">{message}</p>
    </div>
  );
}
