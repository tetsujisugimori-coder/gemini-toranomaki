// Test-only entry, bundled in memory. Not imported by the production app.
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { NanoBanana } from "../../src/NanoBanana";
declare global {
  interface Window {
    nanoMounts: number;
  }
}
window.nanoMounts = 0;
function Probe() {
  useEffect(() => {
    window.nanoMounts++;
  }, []);
  return null;
}
function Harness() {
  const [shown, setShown] = useState(true),
    [completed, setCompleted] = useState(false);
  return (
    <>
      <button onClick={() => setShown((v) => !v)}>教材表示を切替</button>
      {shown && (
        <>
          <Probe />
          <NanoBanana
            completed={completed}
            onComplete={(b) => {
              setCompleted(b);
              return true;
            }}
          />
        </>
      )}
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Harness />
  </StrictMode>,
);
