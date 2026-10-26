import { useId, useLayoutEffect, useRef, useState } from "react";
import { StudySteps, useStudyCopy } from "./StudyShared";
import { VideoPlayer, AudioPlayer } from "./VideoMusicPlayers";
import { VideoScene } from "./VideoScene";
import { duration, frameDescription, judgeRegions } from "./video-music-engine";
import {
  actions,
  cameras,
  speeds,
  backgrounds,
  orders,
  genres,
  tempos,
  instruments,
  moods,
  musicPresets,
  defaultVideo,
  checks,
  faults,
  regions,
  videoPrompt,
  musicPrompt,
  repairPrompt,
  copyId,
  references,
  type VideoSettings,
  type MusicSettings,
  type Device,
} from "./video-music-data";
import {
  freshVideoMusic,
  loadVideoMusic,
  saveVideoMusic,
  removeVideoMusic,
  sanitizeVideoMusic,
  type VideoMusicRecord,
} from "./video-music-storage";
type Update = (p: Partial<VideoMusicRecord>) => void;
function Select({
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
    <div className="vm-select">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {options.map((x, i) => (
          <option key={x} value={i}>
            {x}
          </option>
        ))}
      </select>
    </div>
  );
}
function Prompt({
  kind,
  text,
  copied,
  onCopy,
}: {
  kind: string;
  text: string;
  copied: string[];
  onCopy: (s: string) => void;
}) {
  const copy = useStudyCopy(),
    visible = useRef(text);
  visible.current = text;
  useLayoutEffect(() => {
    copy.invalidate();
  }, [text]);
  const id = copyId(kind, text);
  return (
    <section className="vm-prompt" aria-label={`${kind}の指示文全文`}>
      <h3>
        {kind.includes("music") || kind === "music" ? "音楽" : "動画"}
        の指示文（全文）
      </h3>
      <textarea
        readOnly
        value={text}
        aria-label={`${kind}の指示文全文`}
        rows={6}
      />
      <button
        className="primary"
        disabled={copy.busy}
        onClick={() =>
          void copy.copy(
            text,
            () => onCopy(id),
            () => visible.current === text,
          )
        }
      >
        この指示文を全文コピー
      </button>
      <p role="status">{copy.message}</p>
      {copied.includes(id) && (
        <p className="small">
          この本文のコピー成功履歴があります。生成・再生・理解の成功を示しません。
        </p>
      )}
      <p className="small">
        コピー失敗時は上の全文欄を選択して手動コピーできます。コピー開始後のOS書込み自体は取り消せません。
      </p>
    </section>
  );
}
function Check({
  id,
  r,
  update,
}: {
  id: string;
  r: VideoMusicRecord;
  update: Update;
}) {
  const c = checks.find((c) => c.id === id)!;
  const selected = r.answers[id];
  return (
    <section className="panel">
      <h3>判断チェック</h3>
      <fieldset>
        <legend>{c.question}</legend>
        {c.options.map((s, i) => (
          <label key={s}>
            <input
              type="radio"
              name={id}
              checked={selected === i}
              onChange={() => update({ answers: { ...r.answers, [id]: i } })}
            />
            {s}
          </label>
        ))}
      </fieldset>
      {typeof selected === "number" && (
        <p role="status">
          {selected === c.answer ? "正解です。" : "もう一度考えてみましょう。"}
          {c.reason}
        </p>
      )}
    </section>
  );
}
function useOpenedFocus(opened: boolean) {
  const ref = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    if (opened) ref.current?.focus();
  }, [opened]);
  return ref;
}
function Forecast({
  value,
  onChange,
  locked,
}: {
  value: number | null;
  onChange: (n: number) => void;
  locked: boolean;
}) {
  return (
    <fieldset disabled={locked}>
      <legend>操作前の予想</legend>
      {[
        "条件を変えると、動きや印象も変わる",
        "条件を変えても、見える動きや印象は同じ",
      ].map((x, i) => (
        <label key={x}>
          <input
            type="radio"
            name="vm-forecast"
            checked={value === i}
            onChange={() => onChange(i)}
          />
          {x}
        </label>
      ))}
    </fieldset>
  );
}
function VideoWorkshop({
  r,
  update,
  record,
  prompt,
}: {
  r: VideoMusicRecord;
  update: Update;
  record: (s: string) => void;
  prompt: (kind: string, text: string) => React.ReactNode;
}) {
  const [prediction, setPrediction] = useState<number | null>(null),
    [opened, setOpened] = useState(false),
    [observed, setObserved] = useState(false),
    [retry, setRetry] = useState(0);
  const observationHeading = useOpenedFocus(opened);
  function change(p: Partial<VideoSettings>) {
    const next = { ...r.video, ...p };
    if (JSON.stringify(next) !== JSON.stringify(r.video)) {
      setPrediction(null);
      setOpened(false);
      setObserved(false);
      update({ video: next });
    }
  }
  return (
    <>
      <p>
        第7章の静止画に、時間と動きを加えます。主役・顔・黄色い星エプロンは維持し、何を動かすかを選ぼう。
      </p>
      <Forecast value={prediction} onChange={setPrediction} locked={opened} />
      <div className="vm-builder">
        <Select
          label="主役の動作"
          options={actions}
          value={r.video.action}
          onChange={(n) => change({ action: n })}
        />
        <Select
          label="カメラの動き"
          options={cameras}
          value={r.video.camera}
          onChange={(n) => change({ camera: n })}
        />
        <Select
          label="動作速度・長さ"
          options={speeds}
          value={r.video.speed}
          onChange={(n) => change({ speed: n })}
        />
        <Select
          label="背景の演出"
          options={backgrounds}
          value={r.video.background}
          onChange={(n) => change({ background: n })}
        />
        <Select
          label="時間的な順序"
          options={orders}
          value={r.video.order}
          onChange={(n) => change({ order: n })}
        />
      </div>
      <button
        className="primary"
        disabled={prediction === null || opened}
        onClick={() => setOpened(true)}
      >
        予想を確定して動画を試す
      </button>
      <button
        onClick={() => {
          setPrediction(null);
          setOpened(false);
          setObserved(false);
          setRetry((x) => x + 1);
        }}
      >
        予想を変えて再挑戦
      </button>
      <details>
        <summary>ヒント：動きのどこを見る？</summary>
        <p>
          開始・中盤・終了の順序、手と器具、カメラの拡大や移動を分けて観察します。動く部分以外が維持されるかも見ます。
        </p>
      </details>
      {opened ? (
        <div key={`${JSON.stringify(r.video)}:${retry}`}>
          <h3 ref={observationHeading} tabIndex={-1}>
            動画の観察と再生
          </h3>
          <VideoPlayer
            settings={r.video}
            onPractice={() => {
              setObserved(true);
              record("video:v1");
            }}
          />
          <details>
            <summary>絵コンテ：3場面を並べて観察</summary>
            <div className="vm-storyboard">
              {[0, 1, 2].map((slot) => (
                <figure key={slot}>
                  <VideoScene
                    settings={r.video}
                    time={(duration(r.video) * (slot + 0.5)) / 3}
                    label={`絵コンテ・場面${slot + 1}`}
                  />
                  <figcaption>
                    {frameDescription(
                      r.video,
                      (duration(r.video) * (slot + 0.5)) / 3,
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>
          </details>
        </div>
      ) : (
        <p className="notice">
          予想と条件を選んでから、固定デモを開けます。ほかの体験へはいつでも移動できます。
        </p>
      )}
      {observed && (
        <section className="notice" aria-label="動画の予想と観察">
          <p>
            確定した予想：
            {prediction === 0 ? "動きや印象も変わる" : "動きや印象は同じ"}
            。実際のフライパン・スプーン・窓・画角を見比べよう。
          </p>
          <p>
            条件を変えると関連する動きが変わります。ただし、この教材は決定的なSVG表現です。実AIの生成結果や完全な一貫性を保証しません。完成→調理の順は回想風の指定で、単なる順序の誤りとは限りません。
          </p>
        </section>
      )}
      {prompt("video", videoPrompt(r.video))}
      <Check id="direction-v1" r={r} update={update} />
    </>
  );
}
function FaultChallenge({
  r,
  record,
  update,
  prompt,
}: {
  r: VideoMusicRecord;
  record: (s: string) => void;
  update: Update;
  prompt: (kind: string, text: string) => React.ReactNode;
}) {
  const [frame, setFrame] = useState(0),
    [selected, setSelected] = useState<string[]>([]),
    [keep, setKeep] = useState<string[]>([]),
    [answerFrame, setAnswerFrame] = useState<number | null>(null),
    [submitted, setSubmitted] = useState(false);
  const t = faults[r.task],
    time = (duration(defaultVideo) * (frame + 0.5)) / 3,
    result = judgeRegions(selected, r.task);
  const keepOk =
    keep.includes("face") &&
    keep.includes("window") &&
    !keep.includes(t.region);
  const okay = result.ok && keepOk && answerFrame === 1;
  function toggle(id: string, kind: "change" | "keep") {
    setSubmitted(false);
    const state = kind === "change" ? selected : keep,
      next = state.includes(id)
        ? state.filter((x) => x !== id)
        : [...state, id];
    if (kind === "change") setSelected(next);
    else setKeep(next);
  }
  return (
    <>
      <p>
        同じ料理・同じ時間位置の2本を比較します。途中の変化に気づける？
        左は基準、右は教材用に意図して不整合を入れた例です。Geminiが必ず起こす誤りではありません。
      </p>
      <div className="vm-scenes" aria-label="比較する時間位置">
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            aria-pressed={frame === i}
            onClick={() => setFrame(i)}
          >
            場面{i + 1}を比較
          </button>
        ))}
      </div>
      <p>
        両方とも場面{frame + 1}・{time.toFixed(1)}秒。座標と倍率は共通です。
      </p>
      <div className="vm-compare">
        <figure>
          <VideoScene
            settings={defaultVideo}
            time={time}
            label="正常な動画のフレーム"
          />
          <figcaption>基準・同じ時間位置</figcaption>
        </figure>
        <figure>
          <VideoScene
            settings={defaultVideo}
            time={time}
            fault={t.id}
            label="検証する動画のフレーム"
          />
          <figcaption>検証する例・同じ時間位置</figcaption>
        </figure>
      </div>
      <details>
        <summary>同じフレームを文字で比較する</summary>
        <p>基準：{frameDescription(defaultVideo, time)}</p>
        <p>検証例：{frameDescription(defaultVideo, time, t.id)}</p>
      </details>
      <fieldset>
        <legend>直す必要がある変化はどこ？（複数選択可）</legend>
        {regions.map((x) => (
          <label key={x.id}>
            <input
              type="checkbox"
              checked={selected.includes(x.id)}
              onChange={() => toggle(x.id, "change")}
            />
            {x.label}
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>修正時に維持するものは？（顔・窓も確認）</legend>
        {regions.map((x) => (
          <label key={x.id}>
            <input
              type="checkbox"
              checked={keep.includes(x.id)}
              onChange={() => toggle(x.id, "keep")}
            />
            {x.label}
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>不整合を確認した場面</legend>
        {[0, 1, 2].map((i) => (
          <label key={i}>
            <input
              type="radio"
              name="fault-frame"
              checked={answerFrame === i}
              onChange={() => {
                setAnswerFrame(i);
                setSubmitted(false);
              }}
            />
            場面{i + 1}
          </label>
        ))}
      </fieldset>
      <button
        className="primary"
        onClick={() => {
          setSubmitted(true);
          record(`find:${t.id}`);
          update({ answers: { ...r.answers, [t.id]: selected } });
        }}
      >
        観察した内容で回答を確定
      </button>
      <button
        onClick={() => {
          setSubmitted(false);
          setSelected([]);
          setKeep([]);
          setAnswerFrame(null);
          setFrame(0);
        }}
      >
        観察から再挑戦
      </button>
      {submitted && (
        <section className="notice" aria-label="動画の判定結果">
          <p role="status">
            {okay
              ? "変更対象・維持対象・時間位置を確認できました。"
              : "もう一度、同じ時間位置で見比べよう。"}
          </p>
          <p>
            観察事実：{t.observation}。直す対象：{t.description}。期待：
            {t.expected}。
          </p>
          <p>
            変更の見逃し：
            {result.missing
              .map((id) => regions.find((x) => x.id === id)?.label)
              .join("、") || "なし"}
            。余分な指摘：
            {result.extra
              .map((id) => regions.find((x) => x.id === id)?.label)
              .join("、") || "なし"}
            。
          </p>
          <p>
            維持対象：
            {keepOk
              ? "顔・窓を維持し、修正対象と分けられました。"
              : "顔・窓の維持を選び、直す対象は維持対象から外して確認します。"}
            時間位置：
            {answerFrame === 1
              ? "中盤を確認しました。"
              : "中盤と前後を照合してください。"}
          </p>
          <p>
            一部の成功と動画全体の成功は別です。次は「観察→期待→維持→全場面で再検証」を指示に含めよう。
          </p>
          {okay ? (
            prompt("repair", repairPrompt(r.task, selected, answerFrame!))
          ) : (
            <p>
              修正指示のコピーは、対象・維持対象・時間位置を再観察して正しく照合した後に開けます。上の解説は教材の正本であり、誤った選択を確認済みの事実にはしません。
            </p>
          )}
        </section>
      )}
      <p className="small">
        過去の回答履歴があっても、現在の選択・回答確定は別です。文字比較は同じ観察情報を提供し、正解の分類は回答後に示します。
      </p>
    </>
  );
}
function MusicWorkshop({
  r,
  update,
  record,
  prompt,
}: {
  r: VideoMusicRecord;
  update: Update;
  record: (s: string) => void;
  prompt: (kind: string, text: string) => React.ReactNode;
}) {
  const [prediction, setPrediction] = useState<number | null>(null),
    [opened, setOpened] = useState(false),
    [compared, setCompared] = useState(false);
  const previous = useRef<MusicSettings>({ ...r.music }),
    [before, setBefore] = useState<MusicSettings | null>(null),
    [view, setView] = useState<"before" | "after">("after");
  const observationHeading = useOpenedFocus(opened);
  function change(p: Partial<MusicSettings>) {
    const next = { ...r.music, ...p };
    if (JSON.stringify(next) !== JSON.stringify(r.music)) {
      previous.current = { ...r.music };
      setBefore(previous.current);
      setView("after");
      setPrediction(null);
      setOpened(false);
      setCompared(false);
      update({ music: next });
    }
  }
  const active = view === "before" && before ? before : r.music;
  return (
    <>
      <p>
        同じ8音でも、速さ・音色・音程の組み合わせで印象は変わる？
        端末の音量を小さくして始めよう。音を出せなくても構成を比較できます。
      </p>
      <Forecast value={prediction} onChange={setPrediction} locked={opened} />
      <div className="vm-scenes">
        {musicPresets.map((p) => (
          <button key={p.title} onClick={() => change(p.settings)}>
            {p.title}の条件を選ぶ
          </button>
        ))}
      </div>
      <div className="vm-builder">
        <Select
          label="ジャンル・リズム"
          options={genres}
          value={r.music.genre}
          onChange={(n) => change({ genre: n })}
        />
        <Select
          label="テンポ"
          options={tempos.map((n) => `${n} BPM`)}
          value={r.music.tempo}
          onChange={(n) => change({ tempo: n })}
        />
        <Select
          label="楽器・音色"
          options={instruments}
          value={r.music.instrument}
          onChange={(n) => change({ instrument: n })}
        />
        <Select
          label="雰囲気・音程"
          options={moods}
          value={r.music.mood}
          onChange={(n) => change({ mood: n })}
        />
        <Select
          label="ボーカル（指示文のみ）"
          options={["なし", "あり"]}
          value={r.music.vocal}
          onChange={(n) => change({ vocal: n })}
        />
      </div>
      <button
        className="primary"
        disabled={prediction === null || opened}
        onClick={() => setOpened(true)}
      >
        予想を確定して音の構成を開く
      </button>
      <button
        onClick={() => {
          setPrediction(null);
          setOpened(false);
          setCompared(false);
        }}
      >
        予想を変えて聴き直す
      </button>
      {opened && (
        <>
          <h3 ref={observationHeading} tabIndex={-1}>
            音の観察と再生
          </h3>
          <div className="vm-scenes">
            <button
              disabled={!before}
              aria-pressed={view === "before"}
              onClick={() => setView("before")}
            >
              変更前の音を確認
            </button>
            <button
              aria-pressed={view === "after"}
              onClick={() => setView("after")}
            >
              変更後の音を確認
            </button>
          </div>
          <p>
            確認対象：{view === "before" ? "変更前" : "現在の条件"}。
            {genres[active.genre]}・{moods[active.mood]}・{tempos[active.tempo]}{" "}
            BPM。切替時に旧再生を停止します。
          </p>
          <AudioPlayer
            key={`${view}:${JSON.stringify(active)}`}
            settings={active}
            onPractice={(kind) => {
              setCompared(true);
              record(kind);
            }}
          />
        </>
      )}
      {compared && (
        <p className="notice">
          確定した予想：{prediction === 0 ? "印象も変わる" : "印象は同じ"}
          。テンポは音の間隔、楽器は波形、雰囲気は音程列に反映しています。ジャンルはリズムの簡略表現で、本格的な編曲や歌声の生成ではありません。自分が感じた印象に唯一の正解はありません。
        </p>
      )}
      <label>
        <input
          type="checkbox"
          checked={r.heard}
          onChange={(e) => update({ heard: e.target.checked })}
        />
        音を聴き比べた（自己申告・無音学習では不要）
      </label>
      {prompt("music", musicPrompt(r.music))}
      <Check id="music-v1" r={r} update={update} />
    </>
  );
}
const mixNames = [
  "楽しい料理 × 明るい音楽",
  "楽しい料理 × 緊張する音楽",
  "落ち着いた料理 × 穏やかな音楽",
  "体験1・3の現在の条件",
];
function MixWorkshop({
  r,
  update,
  record,
  prompt,
}: {
  r: VideoMusicRecord;
  update: Update;
  record: (s: string) => void;
  prompt: (kind: string, text: string) => React.ReactNode;
}) {
  const [prediction, setPrediction] = useState<number | null>(null),
    [opened, setOpened] = useState(false),
    [judgment, setJudgment] = useState<number | null>(null),
    [previous, setPrevious] = useState<number | null>(null),
    [view, setView] = useState<"before" | "after">("after");
  const observationHeading = useOpenedFocus(opened);
  const index = view === "before" && previous !== null ? previous : r.mix;
  const video =
    index === 3
      ? r.video
      : {
          ...r.video,
          action: index === 2 ? 1 : 0,
          speed: index === 2 ? 1 : 0,
          order: 0,
        };
  const music =
    index === 3
      ? r.music
      : {
          ...r.music,
          ...musicPresets[index === 0 ? 0 : index === 1 ? 2 : 1].settings,
        };
  function change(n: number) {
    if (n !== r.mix) {
      setPrevious(r.mix);
      setView("after");
      setPrediction(null);
      setOpened(false);
      setJudgment(null);
      update({ mix: n });
    }
  }
  return (
    <>
      <p>
        料理を楽しく見せたいとき、音を変えるとどう感じる？
        体験1の背景・カメラ、体験3の音のルールを使い、演出の組合せを試します。
      </p>
      <Select
        label="映像と音の組合せ"
        options={mixNames}
        value={r.mix}
        onChange={change}
      />
      <fieldset disabled={opened}>
        <legend>どんな印象になると予想する？</legend>
        {["楽しい", "落ち着く", "緊張する"].map((s, i) => (
          <label key={s}>
            <input
              type="radio"
              name="mix-prediction"
              checked={prediction === i}
              onChange={() => setPrediction(i)}
            />
            {s}
          </label>
        ))}
      </fieldset>
      <button
        className="primary"
        disabled={prediction === null || opened}
        onClick={() => setOpened(true)}
      >
        予想を確定して演出を試す
      </button>
      <button
        onClick={() => {
          setOpened(false);
          setPrediction(null);
          setJudgment(null);
        }}
      >
        予想から再挑戦
      </button>
      {opened && (
        <>
          <h3 ref={observationHeading} tabIndex={-1}>
            組合せの観察と再生
          </h3>
          <div className="vm-scenes">
            <button
              disabled={previous === null}
              aria-pressed={view === "before"}
              onClick={() => {
                if (view !== "before") {
                  setView("before");
                  setJudgment(null);
                }
              }}
            >
              修正前の組合せ
            </button>
            <button
              aria-pressed={view === "after"}
              onClick={() => {
                if (view !== "after") {
                  setView("after");
                  setJudgment(null);
                }
              }}
            >
              修正後の組合せ
            </button>
          </div>
          <p>
            今の比較対象：{mixNames[index]}
            。同じ比較対象の映像と音を個別に確認します。精密な同期や動画への書き出しは行いません。
          </p>
          <div
            className="vm-mix"
            key={`${view}:${index}:${JSON.stringify(video)}:${JSON.stringify(music)}`}
          >
            <VideoPlayer settings={video} onPractice={() => record("mix:v1")} />
            <AudioPlayer settings={music} onPractice={record} />
          </div>
          <fieldset>
            <legend>自分の狙いに合う演出だった？</legend>
            {[
              "合った",
              "予想と違ったので条件を変えたい",
              "音声出力は未確認。構成だけ比較した",
            ].map((s, i) => (
              <label key={s}>
                <input
                  type="radio"
                  name="mix-judgment"
                  checked={judgment === i}
                  onChange={() => setJudgment(i)}
                />
                {s}
              </label>
            ))}
          </fieldset>
        </>
      )}
      {judgment !== null && (
        <p role="status">
          予想：{["楽しい", "落ち着く", "緊張する"][prediction ?? 0]}。判断：
          {judgment === 0
            ? "狙いと合った"
            : judgment === 1
              ? "条件を変えて再比較"
              : "音声出力は未確認"}
          。同じ楽しい映像でも緊張する音を重ねると、次に何か起こる印象になることがあります。感じ方は一意ではありません。組合せを変えて再挑戦し、前の条件とも比較しよう。
        </p>
      )}
      {prompt("mix-video", videoPrompt(video))}
      {prompt("mix-music", musicPrompt(music))}
      <details>
        <summary>仕上げの確認リスト</summary>
        <ul>
          <li>開始・中盤・終了の順序、服・器具・位置の連続性。</li>
          <li>音のテンポ・音色・雰囲気が目的に合うか。</li>
          <li>音量、指定外の変化、公開範囲、使用する素材の権利。</li>
          <li>コピー・模擬操作と実Googleでの生成成功は別。</li>
        </ul>
      </details>
    </>
  );
}
export function VideoMusic({
  completed,
  onComplete,
}: {
  completed: boolean;
  onComplete: (b: boolean) => boolean;
}) {
  const [boot] = useState(loadVideoMusic),
    [r, setR] = useState(boot.record),
    [available, setAvailable] = useState(boot.available),
    [resetting, setResetting] = useState(false),
    [epoch, setEpoch] = useState(0),
    [message, setMessage] = useState(""),
    [os, setOs] = useState<Device>("pc");
  const latest = useRef(r),
    heading = useRef<HTMLHeadingElement>(null),
    reset = useRef<HTMLButtonElement>(null),
    focusPending = useRef(false);
  useLayoutEffect(() => {
    if (focusPending.current) {
      focusPending.current = false;
      heading.current?.focus();
    }
  }, [r.step]);
  function update(p: Partial<VideoMusicRecord>) {
    const next = sanitizeVideoMusic({ ...latest.current, ...p });
    latest.current = next;
    setR(next);
    setAvailable(saveVideoMusic(next));
  }
  function record(id: string) {
    if (!latest.current.history.includes(id))
      update({ history: [...latest.current.history, id] });
  }
  const prompt = (kind: string, text: string) => (
    <Prompt
      key={kind}
      kind={kind}
      text={text}
      copied={r.copied}
      onCopy={(id) => update({ copied: [...latest.current.copied, id] })}
    />
  );
  return (
    <div className="vm-chapter">
      <p className="notice">
        教材用の固定ルールによるSVGと電子音です。AI生成・Googleへの送信・アップロードは行いません。ログインや有料機能なしで全体験を学べます。
      </p>
      {!available && (
        <p role="alert">
          ブラウザに保存できません。この画面内では学習できますが永続化されていません。再読み込みで旧記録が復帰する可能性があります。保存拒否・容量不足・不正データを確認してください。
        </p>
      )}
      <StudySteps
        labels={[
          "動画監督になろう",
          "動画の間違い探し",
          "音楽プロデューサー",
          "映像と音を仕上げる",
        ]}
        step={r.step}
        onStep={(step) => {
          if (step !== r.step) {
            focusPending.current = true;
            update({ step });
          } else heading.current?.focus();
        }}
      />
      <h2 className="nano-location" id="vm-step" tabIndex={-1} ref={heading}>
        体験{r.step + 1}の操作
      </h2>
      {r.step === 1 && (
        <Select
          label="比較課題"
          options={faults.map((x) => x.title)}
          value={r.task}
          onChange={(task) => {
            if (task !== r.task) update({ task });
          }}
        />
      )}
      <div key={`${epoch}:${r.step}:${r.step === 1 ? r.task : ""}`}>
        {r.step === 0 ? (
          <VideoWorkshop
            r={r}
            update={update}
            record={record}
            prompt={prompt}
          />
        ) : r.step === 1 ? (
          <FaultChallenge
            r={r}
            update={update}
            record={record}
            prompt={prompt}
          />
        ) : r.step === 2 ? (
          <MusicWorkshop
            r={r}
            update={update}
            record={record}
            prompt={prompt}
          />
        ) : (
          <MixWorkshop r={r} update={update} record={record} prompt={prompt} />
        )}
      </div>
      <section className="panel" aria-label="第8章の種類別学習記録">
        <h2>学習記録と現在の観察は別</h2>
        <label>
          <input
            type="checkbox"
            checked={r.visited.includes(r.step)}
            onChange={(e) =>
              update({
                visited: e.target.checked
                  ? [...r.visited, r.step]
                  : r.visited.filter((x) => x !== r.step),
              })
            }
          />
          この体験を閲覧した（自己記録）
        </label>
        <p>
          閲覧：{r.visited.length} / 4 ・模擬操作履歴：{r.history.length}種類
          ・判断チェック：
          {checks.filter((c) => r.answers[c.id] === c.answer).length} /{" "}
          {checks.length} ・本文コピー：{r.copied.length}種類
        </p>
        <p className="small">
          過去の回答・操作履歴は現在の検証成功の証拠ではありません。音声API開始と実聴の自己申告も別です。
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
          第8章を学習した（完了の自己申告・実生成や音声再生は不要）
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
            <li>自分のアカウントで動画・音楽の利用条件と入口を別々に確認。</li>
            <li>教材の全文指示をコピーし、利用可能な条件で作成。</li>
            <li>途中の服・道具・位置、音の構成を観察し、必要なら再修正。</li>
            <li>公開前に内容・権利・プライバシー・共有範囲を確認。</li>
          </ol>
          <p>
            教材は実Googleの利用権限・生成・ログイン成功を確認できません。個人情報や無断の著作物を使わないでください。
          </p>
          <Select
            label="公式案内の端末"
            options={["PC", "iPhone / iPad", "Android"]}
            value={["pc", "ios", "android"].indexOf(os)}
            onChange={(n) => setOs((["pc", "ios", "android"] as Device[])[n])}
          />
          <p>
            2026-10-26 UTC本文確認。動画はGemini Omni。個人はGoogle
            AIプラン、仕事・学校は対象Workspaceライセンス、18歳以上・ログインが必要と説明されています。動画編集用アップロードには地域制限があります。
          </p>
          <p>
            音楽はLyria。18歳以上・対象アカウントでログイン・アクティビティの保存オン。ヘルプは短い約1分／フル約2〜3分、フルはモデルのProへの切替を案内。これは有料契約必須という意味には置き換えません。回数上限は自分のプランと画面で確認してください。
          </p>
          <p>
            {os === "pc"
              ? "PC：動画はサイドバーの「動画を作成」、音楽は「アップロードとツール」から「音楽を作成」。"
              : os === "ios"
                ? "iOS：動画はWebまたはGeminiモバイルアプリ、音楽はWeb／アプリの「アップロードとツール」から「音楽を作成」。Safariで教材を読むことと実サービスの利用は別です。"
                : "Android：動画はWebまたはGeminiモバイルアプリ、音楽はWeb／アプリの「アップロードとツール」から「音楽を作成」。"}
            画面・段階提供・地域・プラン・上限には差があり、同じ表示を保証しません。
          </p>
          <p>
            公式ブログはLyria 3.5と、Geminiアプリ・Flow Music・AI
            Studio・Vidsへの展開を説明しています。これらは別の入口であり、教材から接続しません。ブログの「全ユーザー」より、ヘルプの年齢・アカウント条件を優先します。動画の正確な長さ・日次回数、個別アカウントの利用可否は未確認です。
          </p>
          {references
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
        映像は本教材のオリジナルSVG、音は独自の音程・リズムと発振器によるデモです。第三者の曲や音源・Google公式画像を使用していません。
      </p>
      <button ref={reset} onClick={() => setResetting(true)}>
        第8章だけを初期化
      </button>
      {resetting && (
        <section className="notice" aria-label="第8章の初期化確認">
          <p>
            第8章の固定条件・回答履歴・コピー・自己申告と章8完了だけを消します。他章・ラボ・探索は残します。再生中の映像・音声も停止します。
          </p>
          <button
            onClick={() => {
              setResetting(false);
              reset.current?.focus();
            }}
          >
            キャンセル
          </button>
          <button
            onClick={() => {
              const ok = removeVideoMusic(),
                progressOk = onComplete(false),
                next = freshVideoMusic();
              latest.current = next;
              setR(next);
              setEpoch((x) => x + 1);
              setAvailable(ok && progressOk);
              setMessage(
                ok && progressOk
                  ? "第8章の記録と完了を初期化しました。"
                  : "画面内では初期化しましたが保存済み記録の削除を確認できません。再読み込みで旧記録が復帰する可能性があります。",
              );
              setResetting(false);
              requestAnimationFrame(() => reset.current?.focus());
            }}
          >
            第8章の記録を消す
          </button>
        </section>
      )}
      <p role="status">{message}</p>
    </div>
  );
}
