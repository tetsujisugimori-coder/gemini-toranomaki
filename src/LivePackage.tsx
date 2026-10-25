import { useId } from "react";
import { frames, packageTruth, type FrameId } from "./live-data";
export function LivePackage({ frame }: { frame: FrameId }) {
  const id = useId();
  const f = frames.find((f) => f.id === frame)!;
  return (
    <svg
      className="live-package"
      viewBox="0 0 300 280"
      role="img"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-desc`}
    >
      <title id={`${id}-title`}>
        架空のお菓子パッケージ：{f.title}（静止教材）
      </title>
      <desc id={`${id}-desc`}>
        {f.visible} {f.unknown}
      </desc>
      <defs>
        <filter id={`${id}-blur`}>
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>
      {frame === "zoom" ? (
        <g>
          <rect
            x="15"
            y="25"
            width="270"
            height="225"
            rx="12"
            fill="#fff4cd"
            stroke="#36564b"
          />
          <text x="150" y="80" textAnchor="middle" fontSize="17" fill="#25332d">
            ラベルの拡大範囲
          </text>
          <text
            x="150"
            y="145"
            textAnchor="middle"
            fontSize="38"
            fill="#25332d"
          >
            {packageTruth.amount}
          </text>
          <text
            x="150"
            y="200"
            textAnchor="middle"
            fontSize="24"
            fill="#25332d"
          >
            {packageTruth.description}
          </text>
        </g>
      ) : (
        <g filter={frame === "blur" ? `url(#${id}-blur)` : undefined}>
          <path
            d="M45 15 H255 L270 260 H30 Z"
            fill="#b5d8ec"
            stroke="#36564b"
            strokeWidth="3"
          />
          <path d="M45 15 H255 M30 260 H270" stroke="#36564b" strokeWidth="9" />
          {frame !== "blur" && (
            <text
              x="150"
              y="66"
              textAnchor="middle"
              fontSize="22"
              fontWeight="bold"
              fill="#25332d"
            >
              {packageTruth.name}
            </text>
          )}
          <path
            d="M150 85 L165 120 L204 122 L175 147 L184 184 L150 164 L116 184 L125 147 L96 122 L135 120 Z"
            fill="#ffe09c"
            stroke="#725d30"
            strokeWidth="2"
          />
          {frame === "whole" && (
            <g stroke="#36564b" strokeWidth="3">
              <path d="M95 213 H205 M105 225 H195 M115 237 H185" />
            </g>
          )}
          {frame === "covered" && (
            <g>
              <rect
                x="50"
                y="100"
                width="200"
                height="140"
                fill="#ece6d8"
                stroke="#36564b"
                strokeWidth="2"
              />
              <text
                x="150"
                y="173"
                textAnchor="middle"
                fontSize="20"
                fill="#25332d"
              >
                不透明な紙
              </text>
            </g>
          )}
        </g>
      )}
    </svg>
  );
}
