import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { VideoScene } from "./VideoScene";
import { MusicDemo, type AudioStatus } from "./video-music-audio";
import {
  duration,
  frameAt,
  frameDescription,
  musicNotes,
  musicDuration,
} from "./video-music-engine";
import {
  scenes,
  tempos,
  instruments,
  type VideoSettings,
  type MusicSettings,
} from "./video-music-data";
export function VideoPlayer({
  settings,
  onPractice,
}: {
  settings: VideoSettings;
  onPractice: () => void;
}) {
  const [run, setRun] = useState({ time: 0, status: "idle" }),
    [reduced, setReduced] = useState(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  useEffect(() => {
    const m = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => {
      setReduced(m.matches);
      if (m.matches)
        setRun((r) =>
          r.status === "playing" ? { ...r, status: "paused" } : r,
        );
    };
    m.addEventListener("change", change);
    return () => m.removeEventListener("change", change);
  }, []);
  const seconds = duration(settings);
  useLayoutEffect(() => {
    if (run.status !== "playing") return;
    const timer = setInterval(
      () =>
        setRun((r) => {
          if (r.status !== "playing") return r;
          const time = Math.min(seconds, Number((r.time + 0.1).toFixed(2)));
          return {
            time,
            status: time >= seconds ? "ended" : "playing",
          };
        }),
      100,
    );
    return () => clearInterval(timer);
  }, [run.status, seconds]);
  useEffect(() => {
    const hide = () => {
      if (document.hidden)
        setRun((r) => ({
          ...r,
          status: r.status === "playing" ? "paused" : r.status,
        }));
    };
    const leave = () => setRun({ time: 0, status: "idle" });
    document.addEventListener("visibilitychange", hide);
    addEventListener("hashchange", leave);
    return () => {
      document.removeEventListener("visibilitychange", hide);
      removeEventListener("hashchange", leave);
    };
  }, []);
  const f = frameAt(settings, run.time);
  return (
    <section className="vm-player" aria-label="動画デモの操作">
      <VideoScene settings={settings} time={run.time} />
      <div className="vm-transport">
        <button
          disabled={
            reduced || run.status === "playing" || run.status === "ended"
          }
          onClick={() => {
            setRun((r) => ({ ...r, status: "playing" }));
            onPractice();
          }}
        >
          動画を{run.status === "paused" ? "再開" : "再生"}
        </button>
        <button
          disabled={run.status !== "playing"}
          onClick={() => setRun((r) => ({ ...r, status: "paused" }))}
        >
          動画を一時停止
        </button>
        <button
          onClick={() => {
            setRun({ time: 0, status: reduced ? "idle" : "playing" });
            onPractice();
          }}
        >
          最初から{reduced ? "表示" : "再生"}
        </button>
        <button onClick={() => setRun({ time: 0, status: "idle" })}>
          動画を停止
        </button>
      </div>
      <p role="status">
        動画：
        {
          (
            {
              idle: "停止中",
              playing: "再生中",
              paused: "一時停止",
              ended: "再生終了",
            } as Record<string, string>
          )[run.status]
        }{" "}
        ・場面{f.slot + 1} / 3
      </p>
      <p role="timer" aria-live="off">
        再生位置：{run.time.toFixed(1)} / {duration(settings)}秒
      </p>
      <div className="vm-scenes" aria-label="動画の場面選択">
        {[0, 1, 2].map((slot) => (
          <button
            key={slot}
            aria-pressed={f.slot === slot}
            onClick={() => {
              setRun({
                time: (duration(settings) * (slot + 0.5)) / 3,
                status: "paused",
              });
              onPractice();
            }}
          >
            場面{slot + 1}：
            {scenes[settings.order === 1 ? [0, 2, 1][slot] : slot]}
          </button>
        ))}
      </div>
      <label className="vm-range">
        動画の時間位置
        <input
          aria-label="動画の時間位置"
          type="range"
          min="0"
          max={duration(settings)}
          step="0.1"
          value={run.time}
          onChange={(e) => {
            setRun({ time: Number(e.target.value), status: "paused" });
            onPractice();
          }}
        />
      </label>
      <p className="small">
        {reduced
          ? "動きを減らす設定です。連続再生せず、場面ボタン・時間位置で同じ内容を静止観察できます。"
          : "自動再生しません。場面選択やシークは一時停止し、同じ時間位置を確かめられます。"}
      </p>
      <details>
        <summary>現在のフレームを文字で観察</summary>
        <p>{frameDescription(settings, run.time)}</p>
      </details>
    </section>
  );
}
export function AudioPlayer({
  settings,
  onPractice,
}: {
  settings: MusicSettings;
  onPractice: (kind: string) => void;
}) {
  const [state, setState] = useState<AudioStatus>("idle"),
    [muted, setMuted] = useState(false),
    [beat, setBeat] = useState(0);
  const player = useRef<MusicDemo | null>(null),
    alive = useRef(false),
    route = useRef(location.hash);
  const callback = useRef(onPractice);
  callback.current = onPractice;
  useLayoutEffect(() => {
    alive.current = true;
    route.current = location.hash;
    const p = new MusicDemo();
    player.current = p;
    const stop = () => {
      p.stop();
      if (alive.current) {
        setState("idle");
        setBeat(0);
      }
    };
    const hide = () => {
      if (document.hidden) stop();
    };
    document.addEventListener("visibilitychange", hide);
    addEventListener("hashchange", stop);
    return () => {
      alive.current = false;
      p.dispose();
      document.removeEventListener("visibilitychange", hide);
      removeEventListener("hashchange", stop);
    };
  }, []);
  useEffect(() => {
    if (state !== "playing") return;
    const t = setInterval(
      () => setBeat((x) => Math.min(8, x + 1)),
      (musicDuration(settings) * 1000) / 8,
    );
    return () => clearInterval(t);
  }, [state, settings]);
  const notes = musicNotes(settings);
  return (
    <section className="vm-audio" aria-label="音声デモの操作">
      <p className="vm-sound-title">
        ♪ {tempos[settings.tempo]} BPM ・ {instruments[settings.instrument]}
      </p>
      <div className="vm-notes" aria-label="8音の構成・音声成功とは別">
        {notes.map((n, i) => (
          <button
            key={i}
            aria-label={`音${i + 1}・${n.frequency.toFixed(0)}Hz・${n.duration.toFixed(2)}秒`}
            aria-pressed={beat === i + 1}
            onClick={() => setBeat(i + 1)}
            style={{ flexGrow: n.duration }}
          >
            {i + 1}
            <span>{n.duration.toFixed(2)}秒</span>
          </button>
        ))}
      </div>
      <div className="vm-transport">
        <button
          disabled={muted}
          onClick={() => {
            setBeat(0);
            void player.current?.play(
              settings,
              (s) => {
                if (!alive.current || location.hash !== route.current) return;
                setState(s);
                if (s === "playing") callback.current("audio-api:v1");
                if (s === "ended") setBeat(8);
              },
              muted,
              () => alive.current && location.hash === route.current,
            );
          }}
        >
          音声デモを再生・最初から
        </button>
        <button
          onClick={() => {
            player.current?.stop();
            setState("idle");
            setBeat(0);
          }}
        >
          音声デモを停止
        </button>
      </div>
      <label>
        <input
          type="checkbox"
          checked={muted}
          onChange={(e) => {
            player.current?.stop();
            setState("idle");
            setBeat(0);
            setMuted(e.target.checked);
          }}
        />
        無音で学ぶ（音声をミュート）
      </label>
      <p role="status">
        {
          (
            {
              idle: "音声：停止中",
              starting: "音声：再生の準備中",
              playing: "音声：再生処理中",
              ended: "音声：再生処理が終了",
              error:
                "音声を開始できません。端末の設定・出力先を確認するか、無音の構成説明で学習を続けてください。",
            } as Record<AudioStatus, string>
          )[state]
        }
      </p>
      <button
        onClick={() => {
          setBeat(1);
          onPractice("rhythm:v1");
        }}
      >
        無音の構成を確認する
      </button>
      <p className="small">
        {notes.length}音・約{musicDuration(settings).toFixed(1)}
        秒。点の表示は等間隔の進行目安で、音の実際の開始時刻とは異なります。音番号を選ぶと長さと音程を確認できます。ボーカルは合成しません。音量は低く制限していますが、端末側でも調整してください。
      </p>
      <p className="small">
        音声APIの開始・視覚表示・自分に聞こえたことは別です。音声条件の変更は旧音声を停止し、新しい再生操作が必要です。
      </p>
    </section>
  );
}
