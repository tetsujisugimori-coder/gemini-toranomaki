import { useId } from "react";
import { frameAt, frameDescription } from "./video-music-engine";
import type { VideoSettings, Fault } from "./video-music-data";
export function VideoScene({
  settings,
  time,
  fault = "none",
  label = "教材の動画フレーム",
}: {
  settings: VideoSettings;
  time: number;
  fault?: Fault;
  label?: string;
}) {
  const id = useId().replaceAll(":", ""),
    f = frameAt(settings, time, fault);
  return (
    <svg
      viewBox="0 0 600 420"
      className="vm-scene"
      role="img"
      aria-label={label}
      aria-describedby={`${id}-desc`}
      data-scene={f.scene}
      data-slot={f.slot}
      data-pan={f.panVisible}
      data-shirt={f.shirtChanged ? "blue-stripes" : "yellow-star"}
      data-x={f.x}
    >
      <desc id={`${id}-desc`}>{frameDescription(settings, time, fault)}</desc>
      <defs>
        <linearGradient id={`${id}-room`} x2="1" y2="1">
          <stop stopColor="#142d50" />
          <stop offset="1" stopColor="#46767e" />
        </linearGradient>
        <linearGradient id={`${id}-fur`} x2="0.7" y2="1">
          <stop stopColor="#f8b663" />
          <stop offset="1" stopColor="#b66c37" />
        </linearGradient>
        <linearGradient id={`${id}-sky`} x2="0" y2="1">
          <stop stopColor={settings.background === 0 ? "#10192f" : "#bd5c85"} />
          <stop
            offset="1"
            stopColor={settings.background === 0 ? "#344576" : "#ffc67b"}
          />
        </linearGradient>
        <clipPath id={`${id}-window`}>
          <rect x="415" y="45" width="140" height="154" rx="36" />
        </clipPath>
      </defs>
      <rect width="600" height="420" rx="20" fill={`url(#${id}-room)`} />
      <g
        transform={`translate(${f.cameraX} 0) translate(300 210) scale(${f.zoom}) translate(-300 -210)`}
      >
        <path d="M0 320h600v100H0z" fill="#557a85" />
        <path
          d="M0 360h600m-500-40-20 100m160-100v100m160-100 30 100"
          stroke="#8bb2b8"
          opacity=".35"
        />
        <rect x="412" y="42" width="146" height="160" rx="38" fill="#99c2c9" />
        <g clipPath={`url(#${id}-window)`}>
          <rect
            x="415"
            y="45"
            width="140"
            height="154"
            fill={`url(#${id}-sky)`}
          />
          {settings.background === 0 ? (
            <g fill="#fff0a7" transform={`translate(0 ${f.backgroundY})`}>
              <circle cx="494" cy="103" r="26" fill="#b0c6da" />
              <path
                d="M447 59h10m-5-5v10m75 75h10m-5-5v10m-94 36h10m-5-5v10"
                stroke="#fff0a7"
                strokeWidth="3"
              />
            </g>
          ) : (
            <circle cx="485" cy={105 + f.backgroundY} r="30" fill="#ffe6a2" />
          )}
        </g>
        <rect x="38" y="74" width="136" height="12" rx="4" fill="#a7c5c7" />
        <path d="M56 74v-25h28v25m25 0v-32h21v32" fill="#e9bc79" />
        <path
          d="M54 132v65m26-65v65m26-65v65"
          stroke="#b5d1d2"
          strokeWidth="5"
        />
        <ellipse cx="80" cy="201" rx="12" ry="18" fill="#8eaeb5" />
        <g transform={`translate(${f.x} 0)`}>
          <path
            d="M267 319v57h26v-51m39-6v57h26v-52"
            fill="#b87a43"
            stroke="#4e392b"
            strokeWidth="3"
          />
          <ellipse cx="288" cy="379" rx="24" ry="9" fill="#f6e5c7" />
          <ellipse cx="349" cy="379" rx="24" ry="9" fill="#f6e5c7" />
          <path
            d="M253 231q58-30 112 0l9 107H242z"
            fill={f.shirtChanged ? "#698dc7" : "#f0c353"}
            stroke="#6c512b"
            strokeWidth="3"
          />
          {f.shirtChanged ? (
            <g stroke="#d4e8ff" strokeWidth="6">
              <path d="M252 263h114m-116 17h119m-120 17h122" />
            </g>
          ) : (
            <path
              d="m309 262 7 13 15 2-11 11 3 16-14-8-14 8 3-16-11-11 15-2z"
              fill="#fff4cc"
              stroke="#b17e35"
            />
          )}
          <path
            d="m260 171-23-55 48 15m56 0 42-15-14 56"
            fill={`url(#${id}-fur)`}
            stroke="#69472f"
            strokeWidth="3"
          />
          <path d="m249 143-7-19 22 9m87 0 20-9-5 20" fill="#eeb9a1" />
          <ellipse
            cx="311"
            cy="181"
            rx="70"
            ry="60"
            fill={`url(#${id}-fur)`}
            stroke="#69472f"
            strokeWidth="3"
          />
          <path
            d="M249 184q26 5 34 27 28-12 56 0 11-25 40-27-3 53-65 55-59 0-65-55"
            fill="#fff0d6"
          />
          <ellipse cx="285" cy="178" rx="7" ry="9" fill="#27313c" />
          <ellipse cx="337" cy="178" rx="7" ry="9" fill="#27313c" />
          <circle cx="287" cy="175" r="2" fill="white" />
          <circle cx="339" cy="175" r="2" fill="white" />
          <path d="m302 198 10 8 10-8q-10-9-20 0" fill="#27313c" />
          <path
            d={f.smile ? "M295 216q17 22 34 0" : "M301 216q11 8 22 0"}
            fill={f.smile ? "#d56f65" : "none"}
            stroke="#563d38"
            strokeWidth="3"
          />
          <path
            d="M263 132v-26q-30-29 2-47 20-13 35 4 14-29 34-9 28-12 37 15 20 23-11 37v26z"
            fill="#fff5dd"
            stroke="#9fb7bb"
            strokeWidth="3"
          />
          <path d="M263 119h97" stroke="#a9c0be" strokeWidth="3" />
          <path
            d="m250 246-37 36 21 20 31-32m96-21 31 35-22 15-29-28"
            fill="#dfa264"
            stroke="#704d34"
            strokeWidth="3"
          />
          {f.panVisible && (
            <g
              transform={`rotate(${f.panAngle} 249 293)`}
              data-testid="vm-utensil"
            >
              <path d="M222 295h90" stroke="#283d4a" strokeWidth="12" />
              <ellipse
                cx="185"
                cy="294"
                rx="54"
                ry="17"
                fill="#a5c5c9"
                stroke="#243e4b"
                strokeWidth="7"
              />
              <ellipse cx="185" cy="290" rx="42" ry="9" fill="#efb66b" />
              {settings.action === 1 && (
                <path
                  d="M178 286l-12-60"
                  stroke="#e4ba7b"
                  strokeWidth="7"
                  transform={`rotate(${f.spoonAngle} 178 286)`}
                />
              )}
            </g>
          )}
          {f.steam > 0 && (
            <g
              fill="none"
              stroke="#eef6e8"
              strokeWidth="5"
              opacity=".65"
              transform={`translate(0 ${f.steamY})`}
            >
              <path d="M166 262q-16-12 0-24t0-20m24 44q-15-12 0-24m24 24q-14-12 0-24t0-20" />
            </g>
          )}
        </g>
        <path
          d="M35 331h530v24H35z"
          fill="#bdc7ba"
          stroke="#4d6571"
          strokeWidth="3"
        />
        <path d="M46 355v38m509-38v38" stroke="#9ab4b6" strokeWidth="8" />
        <ellipse cx="469" cy="323" rx="43" ry="12" fill="#f8ecce" />
        <path d="M447 317q20-30 45 0" fill={f.smile ? "#e79f55" : "#b9cc9b"} />
      </g>
      <rect x="16" y="15" width="173" height="27" rx="13" fill="#152f48" />
      <text x="30" y="34" fill="#fff4d6" fontSize="15">
        教材用・固定SVGデモ
      </text>
    </svg>
  );
}
