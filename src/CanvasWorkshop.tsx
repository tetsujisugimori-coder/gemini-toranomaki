import { useEffect, useRef, useState } from "react";
import { useStudyCopy } from "./StudyShared";
import {
  defaultTimer,
  freshTimerRun,
  tickTimer,
  timerCopyId,
  timerIdentity,
  timerPrompt,
  type TimerPrompt,
  type TimerRun,
  type TimerSettings,
} from "./canvas-workshop";
interface Props {
  settings: TimerSettings;
  isCurrent: () => boolean;
  copied: string[];
  onSettings: (s: TimerSettings) => void;
  onHistory: (id: string) => void;
  onCopied: (id: string) => void;
}
export function CanvasWorkshop({
  settings,
  isCurrent,
  copied,
  onSettings,
  onHistory,
  onCopied,
}: Props) {
  const [applied, setApplied] = useState({ ...defaultTimer }),
    [before, setBefore] = useState({ ...defaultTimer });
  const [runs, setRuns] = useState<{ before: TimerRun; after: TimerRun }>(
    () => ({
      before: freshTimerRun(defaultTimer),
      after: freshTimerRun(defaultTimer),
    }),
  );
  const [version, setVersion] = useState<"before" | "after">("after"),
    [kind, setKind] = useState<TimerPrompt>("create"),
    [message, setMessage] = useState("");
  const copy = useStudyCopy(),
    latest = useRef({ settings, kind });
  latest.current = { settings, kind };
  const head = useRef<HTMLHeadingElement>(null),
    active = version === "before" ? before : applied,
    run = runs[version];
  useEffect(() => {
    if (!run.running) return;
    const timer = window.setInterval(
      () =>
        setRuns((old) => ({
          ...old,
          [version]: tickTimer(old[version], active),
        })),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [run.running, version, active]);
  useEffect(() => {
    if (run.laps > 0) onHistory("zero");
  }, [run.laps, onHistory]);
  function change(s: TimerSettings) {
    if (timerIdentity(s) === timerIdentity(settings)) return;
    copy.invalidate();
    latest.current = { settings: s, kind };
    onSettings(s);
  }
  function apply() {
    if (timerIdentity(settings) !== timerIdentity(applied)) {
      setBefore(applied);
      setApplied({ ...settings });
      setRuns({
        before: freshTimerRun(applied),
        after: freshTimerRun(settings),
      });
      setVersion("after");
      setMessage(
        "指示を固定テンプレートへ反映しました。前後とも停止状態から操作して比べられます。AIへの送信・生成ではありません。",
      );
    } else
      setMessage(
        "同じ指示なので現在の動作を保持しました。別の条件を選ぶと変化を比べられます。",
      );
    onHistory("apply");
    requestAnimationFrame(() => head.current?.focus());
  }
  function switchVersion(v: "before" | "after") {
    if (v !== version) {
      setRuns((old) => ({
        before: { ...old.before, running: false },
        after: { ...old.after, running: false },
      }));
      setVersion(v);
      onHistory("compare");
      setMessage(
        "比較する版を切り替え、両版を一時停止しました。開始でこの版を試せます。",
      );
    }
  }
  function operate(action: "start" | "pause" | "reset") {
    if (action === "start" && run.remaining === 0) {
      setMessage("0秒で停止しています。リセットしてから開始してください。");
      return;
    }
    setRuns((old) => ({
      ...old,
      [version]:
        action === "reset"
          ? freshTimerRun(active)
          : {
              ...old[version],
              running: action === "start" && old[version].remaining > 0,
            },
    }));
    onHistory(action);
    setMessage(
      action === "start"
        ? "開始しました。秒数の変化を観察してください。"
        : action === "pause"
          ? "一時停止しました。待っても秒数が変わらないか確かめましょう。"
          : "設定秒数に戻して停止しました。",
    );
  }
  const text = timerPrompt(kind, settings),
    stamp = timerCopyId(kind, settings);
  return (
    <section className="panel" aria-label="指示で変える集中タイマー工房">
      <h3>別のアプリも作ってみる：集中タイマー工房</h3>
      <p>
        教材内の固定テンプレートです。まず「どこを変えたいか」を選び、指示を反映してから操作しましょう。実際のAI生成・送信ではありません。
      </p>
      <div className="lab-compare">
        <label className="lab-field">
          設定時間
          <select
            value={settings.seconds}
            onChange={(e) =>
              change({
                ...settings,
                seconds: Number(e.target.value) as 10 | 20,
              })
            }
          >
            <option value="10">10秒</option>
            <option value="20">20秒</option>
          </select>
        </label>
        <label className="lab-field">
          見た目の指示
          <select
            value={settings.look}
            onChange={(e) =>
              change({
                ...settings,
                look: e.target.value as TimerSettings["look"],
              })
            }
          >
            <option value="plain">標準の数字</option>
            <option value="large">数字を大きく</option>
          </select>
        </label>
        <label className="lab-field">
          動作の指示
          <select
            value={settings.finish}
            onChange={(e) =>
              change({
                ...settings,
                finish: e.target.value as TimerSettings["finish"],
              })
            }
          >
            <option value="stop">0秒で停止</option>
            <option value="loop">0秒で最初に戻り繰り返す</option>
          </select>
        </label>
      </div>
      <p>
        選択だけでは反映しません。見た目の変更で、0秒の動作も変わるでしょうか？
      </p>
      <button className="primary" onClick={apply}>
        指示を固定タイマーに反映
      </button>
      <div role="group" aria-label="タイマーの前後比較" className="lab-actions">
        <button
          aria-pressed={version === "before"}
          onClick={() => switchVersion("before")}
        >
          変更前を操作
        </button>
        <button
          aria-pressed={version === "after"}
          onClick={() => switchVersion("after")}
        >
          変更後を操作
        </button>
      </div>
      <div
        className="canvas-prototype"
        aria-label="教材用タイマー試作品"
        role="region"
      >
        <h4 ref={head} tabIndex={-1}>
          {version === "before" ? "変更前" : "変更後"}のタイマー
        </h4>
        <p>
          反映済み：{active.seconds}秒／
          {active.look === "large" ? "大きな数字" : "標準の数字"}／
          {active.finish === "stop" ? "0秒で停止" : "繰り返す"}
        </p>
        <output
          aria-label="残り秒数"
          role="timer"
          aria-live="off"
          style={{
            fontSize: active.look === "large" ? "2.5rem" : "1.5rem",
            fontWeight: 700,
          }}
        >
          {run.remaining}秒
        </output>
        <p role="status">
          状態：{run.running ? "進行中" : "停止中"}。0秒への到達：{run.laps}
          回（この版の一時状態）
        </p>
        {run.remaining === 0 && (
          <p>0秒で停止しています。リセットしてから開始してください。</p>
        )}
        <div className="lab-actions">
          <button
            disabled={run.remaining === 0}
            onClick={() => operate("start")}
          >
            開始
          </button>
          <button onClick={() => operate("pause")}>一時停止</button>
          <button onClick={() => operate("reset")}>タイマーをリセット</button>
        </div>
      </div>
      <p role="status">{message}</p>
      <details>
        <summary>比べた後に理由を読む</summary>
        <p>
          数字の大きさは表示の変更、0秒で止めるか繰り返すかは動作の変更です。前後をそれぞれ開始し、0秒まで試しましょう。見た目が良くても、一時停止・連打・リセットは別に確認します。版を切り替えると両方停止します。
        </p>
      </details>
      <details>
        <summary>任意：この指示を実Gemini Canvasで試す</summary>
        <p>
          ここは固定ルールによる模擬反映でした。実際のCanvasは結果が異なる場合があり、同じ確認を自分で行います。機密情報は入力せず、利用可否や共有範囲を確認してください。
        </p>
        <label className="lab-field">
          タイマー用の指示
          <select
            value={kind}
            onChange={(e) => {
              const next = e.target.value as TimerPrompt;
              if (next !== kind) {
                copy.invalidate();
                latest.current = { settings, kind: next };
                setKind(next);
              }
            }}
          >
            <option value="create">作成指示</option>
            <option value="repair">修正指示</option>
            <option value="verify">確認手順</option>
          </select>
        </label>
        <pre
          className="service-prompt"
          tabIndex={0}
          aria-label="タイマー指示の全文"
        >
          {text}
        </pre>
        <button
          disabled={copy.busy}
          onClick={() =>
            void copy.copy(
              text,
              () => onCopied(stamp),
              () =>
                isCurrent() &&
                timerCopyId(latest.current.kind, latest.current.settings) ===
                  stamp,
            )
          }
        >
          タイマー指示を全文コピー
        </button>
        <p>
          この本文の過去のコピー成功：{copied.includes(stamp) ? "あり" : "なし"}
          。実アプリの成功とは別です。
        </p>
        <p role="status">{copy.message}</p>
        <a
          className="primary"
          href="https://gemini.google.com/"
          target="_blank"
          rel="noreferrer"
        >
          Geminiを開く ↗（別タブ・任意）
        </a>
      </details>
    </section>
  );
}
