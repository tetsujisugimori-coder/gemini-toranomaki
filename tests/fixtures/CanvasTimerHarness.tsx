// Test-only entry: bundled in memory by Playwright; never a production route.
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { CanvasWorkshop } from "../../src/CanvasWorkshop";
import { defaultTimer } from "../../src/canvas-workshop";

declare global {
  interface Window {
    timerStrict: boolean;
    timerHarness: {
      calls: { id: string; revision: number }[];
      callback?: (id: string) => void;
      previousCallback?: (id: string) => void;
      mounts: number;
      cleanups: number;
    };
  }
}
window.timerHarness = { calls: [], mounts: 0, cleanups: 0 };
function Probe() {
  useEffect(() => {
    window.timerHarness.mounts++;
    return () => {
      window.timerHarness.cleanups++;
    };
  }, []);
  return null;
}
function Harness() {
  const [settings, setSettings] = useState({ ...defaultTimer });
  const [revision, setRevision] = useState(0),
    [visible, setVisible] = useState(true);
  // Deliberately fresh on every parent render, like Canvas.tsx.
  const onHistory = (id: string) => {
    window.timerHarness.calls.push({ id, revision });
  };
  useEffect(() => {
    window.timerHarness.callback = onHistory;
  }, [onHistory]);
  return (
    <>
      <button onClick={() => setRevision((n) => n + 1)}>親だけを再描画</button>
      <p>親の更新：{revision}</p>
      <button onClick={() => setVisible((v) => !v)}>
        {visible ? "教材を閉じる" : "教材を再表示"}
      </button>
      {visible && (
        <>
          <Probe />
          <CanvasWorkshop
            settings={settings}
            copied={[]}
            isCurrent={() => visible}
            onSettings={setSettings}
            onHistory={onHistory}
            onCopied={() => {}}
          />
        </>
      )}
    </>
  );
}
const app = <Harness />;
createRoot(document.getElementById("root")!).render(
  window.timerStrict ? <StrictMode>{app}</StrictMode> : app,
);
