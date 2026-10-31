// In-memory test entry only. Never referenced from the production app.
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { VideoMusic } from "../../src/VideoMusic";
declare global {
  interface Window {
    videoMusicMounts: number;
  }
}
window.videoMusicMounts = 0;
function Probe() {
  useEffect(() => {
    window.videoMusicMounts++;
  }, []);
  return null;
}
function Harness() {
  const [shown, setShown] = useState(true),
    [complete, setComplete] = useState(false);
  return (
    <>
      <button onClick={() => setShown((x) => !x)}>教材表示を切替</button>
      {shown && (
        <>
          <Probe />
          <VideoMusic
            completed={complete}
            onComplete={(b) => {
              setComplete(b);
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
