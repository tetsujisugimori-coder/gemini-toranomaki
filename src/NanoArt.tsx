import { useId } from "react";
import {
  backgrounds,
  compositions,
  defaultImage,
  regions,
  styles,
  subjects,
  type ImageSettings,
  type Region,
} from "./nano-data";
export interface ArtProps {
  settings?: ImageSettings;
  hatRed?: boolean;
  sunset?: boolean;
  apple?: boolean;
  narrowEyes?: boolean;
  stripes?: boolean;
  scene?: number;
  drift?: boolean;
  label: string;
  selected?: readonly string[];
  onRegion?: (id: Region) => void;
}
export function NanoArt({
  settings = defaultImage,
  hatRed = false,
  sunset = false,
  apple = true,
  narrowEyes = false,
  stripes = false,
  scene = 0,
  drift = false,
  label,
  selected = [],
  onRegion,
}: ArtProps) {
  const id = useId().replaceAll(":", ""),
    water = settings.style === 1,
    anime = settings.style === 2,
    robot = settings.subject === 1,
    cat = settings.subject === 2;
  const fur = robot
    ? "#91cfd4"
    : cat
      ? "#bca7db"
      : drift
        ? "#9c6048"
        : "#df934c";
  const transform =
    settings.composition === 1
      ? "translate(-90,-54) scale(1.3)"
      : settings.composition === 2
        ? "translate(-300,-176) scale(2)"
        : "";
  return (
    <svg
      viewBox="0 0 600 440"
      role={onRegion ? "group" : "img"}
      aria-label={label}
      aria-describedby={`${id}description`}
      className={`nano-art ${water ? "nano-water" : ""}`}
      data-subject={subjects[settings.subject]}
      data-background={backgrounds[settings.background]}
      data-style={styles[settings.style]}
      data-composition={compositions[settings.composition]}
    >
      <desc
        id={`${id}description`}
      >{`${subjects[settings.subject]}。${robot ? "青緑の金属の四角い顔" : cat ? "紫系の毛、丸い顔、三角の耳" : `毛色は${drift ? "濃い茶色" : "黄茶色"}、丸い顔、三角の耳`}。目は${narrowEyes ? "細い線" : "丸い形"}。服は黄色いエプロン、模様は${stripes ? "横縞" : "星"}。${settings.composition === 2 ? "顔の拡大です。帽子の上・リンゴ全体・体格は画面外で確認できません。" : `帽子は${hatRed ? "赤" : "白"}。${scene === 2 ? "宇宙ステーションの撮影場所。厨房の棚と料理台はなく、手を振るポーズ。" : `料理台にリンゴは${apple ? "1個ある" : "ない"}。窓の外は${sunset ? "夕焼け" : settings.background === 0 ? "宇宙" : settings.background === 1 ? "木々" : "未来都市"}。`}${settings.composition === 1 ? "足元は画面外です。" : "足元まで見えます。"}`}表示範囲は${compositions[settings.composition]}。`}</desc>
      <defs>
        <linearGradient id={`${id}room`} x2="1" y2="1">
          <stop stopColor={settings.background === 1 ? "#174d47" : "#132d55"} />
          <stop
            offset="1"
            stopColor={settings.background === 2 ? "#786198" : "#366c78"}
          />
        </linearGradient>
        <linearGradient id={`${id}fur`} x2=".8" y2="1">
          <stop stopColor={fur} />
          <stop offset="1" stopColor={anime ? fur : "#a86431"} />
        </linearGradient>
        <linearGradient id={`${id}metal`} x2="0" y2="1">
          <stop stopColor="#e2eeeb" />
          <stop offset="1" stopColor="#8da8ae" />
        </linearGradient>
        <linearGradient id={`${id}sky`} x2="0" y2="1">
          <stop stopColor={sunset ? "#e2807a" : "#0d173a"} />
          <stop offset="1" stopColor={sunset ? "#ffc874" : "#344d79"} />
        </linearGradient>
        <pattern
          id={`${id}paper`}
          width="9"
          height="9"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M0 2h9M2 0v9"
            stroke="#f8edd5"
            strokeWidth="1"
            opacity=".2"
          />
        </pattern>
        <radialGradient id={`${id}light`}>
          <stop stopColor="#fff6c6" stopOpacity=".22" />
          <stop offset="1" stopColor="#fff6c6" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="600" height="440" rx="22" fill={`url(#${id}room)`} />
      <g
        transform={transform}
        stroke={anime ? "#262d42" : "#244452"}
        strokeWidth={anime ? 3 : 2}
        strokeLinejoin="round"
      >
        <path
          d="M0 312H600V440H0Z"
          fill={settings.background === 1 ? "#517063" : "#527584"}
        />
        <path
          d="M0 366H600M90 312L40 440M225 312L200 440M380 312L410 440M515 312L580 440"
          opacity=".3"
        />
        <rect
          x="400"
          y="44"
          width="150"
          height="155"
          rx="38"
          fill={`url(#${id}sky)`}
          stroke="#9cbec5"
          strokeWidth="12"
        />
        {settings.background === 0 && !sunset && (
          <g fill="#f6e4a7" stroke="none">
            <circle cx="470" cy="116" r="28" fill="#abbdca" />
            <ellipse
              cx="470"
              cy="116"
              rx="45"
              ry="8"
              fill="none"
              stroke="#f5cb8c"
              strokeWidth="4"
            />
            {[
              [421, 74],
              [515, 82],
              [430, 153],
              [524, 167],
              [493, 55],
            ].map(([x, y]) => (
              <path key={x} d={`M${x - 4} ${y}h8m-4-4v8`} stroke="#fff2c1" />
            ))}
          </g>
        )}
        {sunset && (
          <>
            <circle cx="477" cy="133" r="28" fill="#fff0aa" stroke="none" />
            <path
              d="M406 164Q430 144 453 163T544 155"
              fill="none"
              stroke="#e09889"
              strokeWidth="9"
            />
          </>
        )}
        {settings.background === 1 && (
          <g fill="#80af7c">
            <path d="M415 155l18-78 24 78zM475 164l24-96 33 96z" />
            <path d="M35 62Q95 25 112 93Q90 127 35 62" />
            <path d="M22 159Q53 94 83 167Q54 197 22 159" />
          </g>
        )}
        {settings.background === 2 && (
          <g fill="#aa8ed3" stroke="#dccef4">
            <path d="M417 178V104h18v74M450 178V82h22v96M490 178V119h17v59M520 178V94h18v84" />
            <path d="M29 51h124v28H29z" fill="#edbb78" />
          </g>
        )}
        {scene === 2 ? (
          <g data-photo-backdrop="station">
            <rect
              x="35"
              y="72"
              width="128"
              height="227"
              rx="28"
              fill="#456887"
              stroke="#b6d0d2"
              strokeWidth="7"
            />
            <path
              d="M52 270V100h94v170M62 192h72"
              fill="none"
              stroke="#9fc3d1"
              strokeWidth="4"
            />
            <circle cx="113" cy="217" r="6" fill="#e6c574" />
            <text x="60" y="133" fill="#f8e6bd" stroke="none" fontSize="17">
              ORBIT
            </text>
            <text x="60" y="160" fill="#f8e6bd" stroke="none" fontSize="17">
              PHOTO
            </text>
          </g>
        ) : (
          <>
            {" "}
            <g fill={`url(#${id}metal)`}>
              <rect x="30" y="112" width="140" height="18" rx="6" />
              <rect x="30" y="218" width="140" height="15" rx="6" />
            </g>
            <g fill="#e9cc9a">
              <path d="M54 90v22h25V90zM96 82v30h29V82z" />
              <path d="M49 186q-5-23 17-24q24 4 18 24v32H49z" fill="#d0b0a5" />
              <rect
                x="100"
                y="184"
                width="40"
                height="34"
                rx="7"
                fill="#8fb2a7"
              />
            </g>
            <path
              d="M110 44v25m-10 0h20m-4 0v25m-8 0V69"
              stroke="#f1d299"
              strokeWidth="5"
            />
          </>
        )}
        <ellipse
          cx="300"
          cy="394"
          rx="100"
          ry="20"
          fill="#172e40"
          opacity=".35"
          stroke="none"
        />
        <path
          d="M248 296l-7 82q19 19 42 2l8-67M311 313l9 67q22 17 41-2l-9-82"
          fill={`url(#${id}fur)`}
        />
        <path
          d="M243 374q-28 23 6 26h33v-23M320 377v23h38q25-11-8-26"
          fill="#f6e5c4"
        />
        <path
          d={
            scene === 2
              ? "M246 237q-38-5-57 29q-18 26-4 40q15 10 31-17l37-15M350 238q19-13 29-38l9-27q17-12 27 4q-1 42-30 76l-29 21"
              : "M246 237q-38-5-57 29q-18 26-4 40q15 10 31-17l37-15M350 238q29-1 40 24l34 8q21 18 3 31l-38-14-35-10"
          }
          fill={`url(#${id}fur)`}
        />
        <path d="M247 223q48-13 106 0l15 103q-64 27-136 0z" fill="#f8ebd4" />
        <path
          d="M259 224l14 36h58l12-36M263 262v62q34 17 71 0v-62"
          fill="#e7b35b"
        />
        {stripes ? (
          <g stroke="#627b98" strokeWidth="6">
            <path d="M265 277h65M265 289h65M265 301h65" />
          </g>
        ) : (
          <path
            d="M299 272l6 12 13 2-9 9 2 13-12-6-12 6 3-13-10-9 13-2z"
            fill="#fff6cf"
          />
        )}
        <path
          d={
            cat
              ? "M235 176l-12-57 47 27M331 146l48-27-13 57"
              : "M234 177l-11-49q-1-14 14-8l40 32M325 152l41-32q13-6 13 8l-12 49"
          }
          fill={`url(#${id}fur)`}
        />
        <path
          d="M237 154l-1-18 18 14M347 150l18-14-2 20"
          fill="#dba18b"
          stroke="none"
        />
        <path
          d={
            robot
              ? "M242 148h116v75H242z"
              : "M232 177q0-37 68-39q67 1 68 39q12 53-68 62q-77-8-68-62"
          }
          fill={`url(#${id}fur)`}
        />
        <path
          d="M238 194q22 5 37-1q24 20 49 0q18 7 38 1q-12 44-62 44q-53-1-62-44"
          fill="#fff0d3"
          stroke="none"
        />
        {narrowEyes ? (
          <path
            d="M260 180l17 5M324 185l17-5"
            fill="none"
            stroke="#302a29"
            strokeWidth="5"
          />
        ) : (
          <g fill={robot ? "#7df9e8" : "#302a29"} stroke="none">
            <ellipse cx="269" cy="181" rx="6" ry="8" />
            <ellipse cx="332" cy="181" rx="6" ry="8" />
            <circle cx="271" cy="178" r="2" fill="white" />
            <circle cx="334" cy="178" r="2" fill="white" />
          </g>
        )}
        <path d="M291 199q10-8 19 0l-9 8z" fill="#302a29" />
        <path
          d="M301 207v8m-13 0q13 10 26 0"
          fill="none"
          strokeLinecap="round"
        />
        {cat && <path d="M251 203l-28-4m28 11l-31 4m131-11l28-4m-28 11l31 4" />}
        {robot && (
          <g fill="#edd684">
            <circle cx="235" cy="192" r="8" />
            <circle cx="366" cy="192" r="8" />
          </g>
        )}
        <path
          d="M252 133v-22q-25-19-3-33q15-9 26 2q-2-27 25-28q27 1 25 28q15-11 29 1q18 16-7 31v21z"
          fill={hatRed ? "#df615c" : "#fff6df"}
        />
        <path d="M252 119h95v23h-95z" fill={hatRed ? "#ab3d46" : "#dce2d7"} />
        {scene !== 2 && (
          <>
            {" "}
            <path d="M0 321h154v22H0M409 321h191v22H409" fill="#dbb27f" />
            <path
              d="M27 344v96M138 344v96M423 344v96M574 344v96"
              stroke="#8e7763"
              strokeWidth="12"
            />
            <path d="M80 298q3-28 38-22q24 2 29 22z" fill="#d09363" />
            <path d="M94 286l7 8m12-13l8 11" stroke="#f4dab0" strokeWidth="4" />
            {apple && (
              <g>
                <path
                  d="M472 290q-25-15-29 10q0 25 27 24q25 1 26-24q-4-21-24-10"
                  fill="#db6053"
                />
                <path
                  d="M470 290q-3-17 6-20"
                  fill="none"
                  stroke="#735544"
                  strokeWidth="4"
                />
                <path d="M475 278q14-16 21 0q-10 7-21 0" fill="#91b873" />
                <path
                  d="M452 300q0-6 7-8"
                  fill="none"
                  stroke="#ffb89a"
                  strokeWidth="3"
                />
              </g>
            )}
          </>
        )}
        {scene === 1 && (
          <>
            <ellipse cx="405" cy="263" rx="33" ry="6" fill="#e9dcbd" />
            <path d="M404 244v15m-11-15h23" stroke="#f6efd9" strokeWidth="4" />
          </>
        )}
        {scene === 2 && (
          <g fill="#f2cd6c">
            <path d="M152 251l14-39 14 39-14-9z" />
            <path d="M389 254l26-31 6 43-17-12z" />
          </g>
        )}
        {water && (
          <rect
            width="600"
            height="440"
            fill={`url(#${id}paper)`}
            stroke="none"
            pointerEvents="none"
          />
        )}
        <circle
          cx="300"
          cy="180"
          r="215"
          fill={`url(#${id}light)`}
          stroke="none"
          pointerEvents="none"
        />
        {onRegion &&
          regions.map((r) => (
            <g
              key={r.id}
              role="button"
              aria-label={`${r.label}を指摘`}
              aria-pressed={selected.includes(r.id)}
              tabIndex={0}
              onClick={() => onRegion(r.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onRegion(r.id);
                }
              }}
              className="nano-hotspot"
            >
              <rect
                x={r.x}
                y={r.y}
                width={r.w}
                height={r.h}
                rx="12"
                fill={selected.includes(r.id) ? "#e9bd6244" : "transparent"}
                stroke={selected.includes(r.id) ? "#fff2ac" : "#f8e7b699"}
                strokeDasharray={selected.includes(r.id) ? undefined : "5 5"}
                strokeWidth="4"
              />
              {selected.includes(r.id) && (
                <text
                  x={r.x + 5}
                  y={r.y + 18}
                  fill="white"
                  stroke="#132d55"
                  strokeWidth=".5"
                  fontSize="20"
                >
                  ✓
                </text>
              )}
            </g>
          ))}
      </g>
    </svg>
  );
}
