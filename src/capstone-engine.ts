import {
  artifacts,
  audiences,
  improvements,
  planItems,
  promptItems,
  requirements,
  topicFor,
  type Version,
} from "./capstone-data";
import type { CapstoneRecord, QualityAnswer } from "./capstone-storage";
export const interactive = (r: CapstoneRecord) =>
  r.artifact === 0 || r.requirements.includes(2);
// Shared by the rendered artifact and the rubric; a broken button cannot provide its explanation.
export function artifactFeatures(r: CapstoneRecord, version: Version) {
  return {
    references: version !== "initial" && r.requirements.includes(0),
    limits: version !== "initial" && r.requirements.includes(1),
    quiz: interactive(r),
    explanation: interactive(r) && version !== "repair",
  };
}
export function missingRequirements(r: CapstoneRecord, version: Version) {
  const f = artifactFeatures(r, version);
  return r.requirements.filter(
    (n) => ![f.references, f.limits, f.explanation][n],
  );
}
export function notebookText(r: CapstoneRecord) {
  const t = topicFor(r.topic);
  return [
    r.sources.includes(0)
      ? `[S1] ${t.fact}。${t.second}。`
      : "S1がなく、中心となる事実は資料不足で保留。",
    r.sources.includes(1)
      ? `[S2] ${t.supplement}`
      : "S2がなく、観察・記録条件の詳細は保留。",
    r.sources.includes(2)
      ? `[S3・未確認メモ] ${t.unsupported}。原資料の裏付けがなく採用しない。`
      : "未確認メモは参照対象から除外。",
  ].join("\n");
}
export function capstonePrompt(r: CapstoneRecord, custom = "") {
  const t = topicFor(r.topic),
    brief = `テーマ：${t.title}\n目的：${t.purpose}\n対象読者：${audiences[r.audience]}（${t.audience}）\n形式：${artifacts[r.artifact]}\n完成条件：${r.requirements.map((i) => requirements[i]).join("／") || "追加条件なし"}${custom ? `\n今回だけの追加条件：${custom}` : ""}`;
  if (r.step === 2)
    return `調べて。\n\n改善した調査依頼：\n${brief}\n${r.plan.map((i) => `${planItems[i]}：${[t.purpose, "資料の日付と記録対象時期を分け、2資料の範囲に限定", "原文を開き、本文・引用・日付を照合", "比較できない主張は推測と表示し、追加調査を提案"][i]}`).join("\n")}\nまず調査計画を提示し、不足条件を質問してください。承認前に調査を開始しないでください。`;
  if (r.step === 3)
    return `${brief}\n選択資料だけから整理してください。${notebookText(r)}\n同じ質問「何が分かり、何が分からないか」に答え、主張と原文を並べてください。資料にない主張を追加せず、資料追加・除外後は回答と既存の要約を再確認してください。`;
  if (r.step === 6)
    return r.repairStyle === 0
      ? "直して。"
      : `${brief}\n問題：初版の日付はS1と不一致、資料外の断定と条件不足。修正版1では確認ボタンが反応しなくなった。\n期待結果：S1/S2に合う事実に訂正し、限界・出典を表示。確認問題の選択後に判定と解説を表示。\n維持条件：目的・読者・タイトル・正しい事実・出典ID・選択肢を保持。\n同じ入力で初版と修正版を比較し、未回答・正答・誤答の動作と全完成条件を再検証。AIの成功報告だけで完了にしない。`;
  return `作って。\n\n組み立てた制作依頼：\n${r.prompt.includes(0) ? brief : "（目的・読者・形式は未指定）"}\n${r.prompt.includes(1) ? `参照資料：\n${notebookText(r)}\n原文と一致する引用だけを使い、資料外の主張は採用しない。` : "（出典確認が不足）"}\n${r.prompt.includes(2) ? `品質条件：${r.requirements.map((i) => requirements[i]).join("／")}。不明点は断定しない。` : "（完成条件が不足）"}\n${r.prompt.includes(3) ? "制作後に数字・名称・日付・根拠と動作を検証。修正は指定部分だけとし、正常部分と出典を維持。" : "（検証と維持条件が不足）"}`;
}
export interface QualityCase {
  verdict: number;
  improvement: number;
  evidence: string;
  reason: string;
}
export function qualityCase(
  r: CapstoneRecord,
  v: Version,
  i: number,
): QualityCase {
  const t = topicFor(r.topic),
    initial = v === "initial",
    missing = !r.sources.includes(0) || !r.sources.includes(1),
    unmet = missingRequirements(r, v),
    brokenInteraction =
      artifactFeatures(r, v).quiz && !artifactFeatures(r, v).explanation,
    incompletePrompt = r.prompt.length < 4;
  const cases: QualityCase[] = [
    {
      verdict: 0,
      improvement: 0,
      evidence: `タイトルと目的は「${t.title}／${t.purpose}」`,
      reason: "テーマの対象と目的を本文で確認できる。",
    },
    {
      verdict: unmet.length > 0 ? 1 : missing ? 2 : 0,
      improvement:
        unmet.length > 0 ? (brokenInteraction ? 3 : 2) : missing ? 5 : 0,
      evidence:
        unmet.length > 0
          ? `現在の版には完成条件「${unmet.map((n) => requirements[n]).join("／")}」の表示がない${brokenInteraction ? "（確認ボタンが反応せず解説を表示できない）" : ""}`
          : missing
            ? "参照資料が不足し必要な事実を確認できない"
            : "選択した完成条件が本文に揃っている",
      reason:
        "STEP 1の現在の完成条件と、実際に利用できる本文・解説を照合する。",
    },
    {
      verdict: initial ? 1 : missing ? 2 : 0,
      improvement: initial ? 1 : missing ? 5 : 0,
      evidence: initial
        ? `S1「${t.fact}」と初版「${t.wrong}」が不一致`
        : missing
          ? "S1/S2が揃わず原文照合を完了できない"
          : `S1「${t.fact}」と本文が一致`,
      reason: "出典IDがあっても主張と原文が一致するとは限らない。",
    },
    {
      verdict: initial ? 1 : 0,
      improvement: initial ? 1 : 0,
      evidence: initial
        ? `「${t.unsupported}」の根拠はS1/S2にない`
        : "資料外の断定は削除されている",
      reason: "記録の範囲から一般化した結論を加えない。",
    },
    {
      verdict: initial ? 1 : missing ? 2 : 0,
      improvement: initial ? 1 : missing ? 5 : 0,
      evidence: initial
        ? `原文「${t.fact}」の時期と初版が違う`
        : missing
          ? "時期・数値を確認する資料が不足"
          : `原文の時期・数値「${t.fact}／${t.second}」を維持`,
      reason: "発行日と対象時期の両方を確認する。",
    },
    {
      verdict:
        initial || incompletePrompt || brokenInteraction ? 1 : missing ? 2 : 0,
      improvement:
        initial || incompletePrompt
          ? 2
          : brokenInteraction
            ? 3
            : missing
              ? 5
              : 0,
      evidence: incompletePrompt
        ? "制作指示自体に不足する要素があり、指示を改善する必要がある"
        : initial
          ? "制作指示の『資料外の主張は採用しない』に反する断定がある"
          : brokenInteraction
            ? "制作指示の動作確認・解説条件を、反応しない確認ボタンが満たしていない"
            : missing
              ? "制作指示の根拠確認が資料不足で保留"
              : "制作指示の対象・形式・根拠・完成条件を確認できる",
      reason: "よい依頼文でも出力が指示通りかは別に検査する。",
    },
    {
      verdict: initial ? 2 : v === "repair" && interactive(r) ? 1 : 0,
      improvement: initial ? 3 : v === "repair" && interactive(r) ? 4 : 0,
      evidence: initial
        ? "比較前の初版なので修正による維持は未判定"
        : v === "repair" && interactive(r)
          ? "初版の確認ボタンは反応するが修正版1は反応しない"
          : "初版のタイトル・正しい事実・選択肢と正常な動作を維持",
      reason: "修正した箇所以外も同じ条件で確認する。",
    },
    {
      verdict: !interactive(r)
        ? 2
        : !r.trials.includes(v)
          ? 2
          : v === "repair"
            ? 1
            : 0,
      improvement: !interactive(r)
        ? 5
        : !r.trials.includes(v)
          ? 3
          : v === "repair"
            ? 3
            : 0,
      evidence: !interactive(r)
        ? "文書形式で操作対象なし。動作評価の対象外"
        : !r.trials.includes(v)
          ? "この版の確認問題をまだ操作していない"
          : v === "repair"
            ? "選択後にボタンを押しても結果が出ない"
            : "未回答・正答・誤答の3条件で結果と解説が出る",
      reason: "操作の証拠は現在の版で得る。対象外を成功に数えない。",
    },
    {
      verdict: 0,
      improvement: 0,
      evidence: "表示は教材専用の架空資料と固定値だけで個人・機密データはない",
      reason: "これは固定模擬成果物の評価。外部の実成果物の安全を認定しない。",
    },
    {
      verdict: initial && r.requirements.includes(1) ? 1 : missing ? 2 : 0,
      improvement: initial && r.requirements.includes(1) ? 2 : missing ? 5 : 0,
      evidence:
        initial && r.requirements.includes(1)
          ? "初版には対象範囲・未確認事項の説明がない"
          : missing
            ? "参照資料が足りず限界の説明も再確認が必要"
            : `限界「${t.scope}」。${initial ? "本文には説明がないが、原資料から説明できる（完成条件には未指定）" : "本文と原資料から説明できる"}`,
      reason: "追加条件に選ばなくても、説明できる限界を認識する。",
    },
  ];
  return cases[i];
}
export function evidenceOptions(r: CapstoneRecord, v: Version, i: number) {
  const values = [
    "AIが『すべて成功』と報告した",
    "見た目がきれいで使えそう",
    "資料を読んでいないが多分正しい",
  ];
  values[i % 3] = qualityCase(r, v, i).evidence;
  return values;
}
export function answerCorrect(
  r: CapstoneRecord,
  v: Version,
  i: number,
  a: QualityAnswer,
) {
  const c = qualityCase(r, v, i);
  return (
    a.verdict === c.verdict &&
    a.evidence === i % 3 &&
    a.improvement === c.improvement
  );
}
export const qualityReady = (r: CapstoneRecord, v: Version) =>
  r.created &&
  r.quality[v].every((a, i) => a.checked && answerCorrect(r, v, i, a));
export function stageReady(r: CapstoneRecord, n: number): boolean {
  switch (n) {
    case 0:
      return true;
    case 1:
      return true;
    case 2:
      return (
        r.plan.length === 4 &&
        r.prediction >= 0 &&
        r.researched &&
        r.research.every((a, i) => a === [1, 2, 0][i])
      );
    case 3:
      return (
        r.sources.includes(0) &&
        r.sources.includes(1) &&
        !r.sources.includes(2) &&
        r.compared &&
        r.notebook === 2
      );
    case 4:
      return r.created && r.prompt.length === 4 && stageReady(r, 3);
    case 5:
      return (
        stageReady(r, 4) &&
        qualityReady(r, "initial") &&
        (!interactive(r) || r.trials.includes("initial"))
      );
    case 6:
      return (
        stageReady(r, 5) &&
        (!interactive(r) ||
          ["repair", "final"].every((v) => r.trials.includes(v as Version))) &&
        r.applied &&
        r.repairStyle === 1 &&
        qualityReady(r, "repair") &&
        qualityReady(r, "final") &&
        qualityReady(r, "initial")
      );
    case 7:
      return r.ratings.every((n) => n >= 0) && r.reasons.every((n) => n >= 0);
    default:
      return false;
  }
}
export function stageFeedback(r: CapstoneRecord) {
  return stageReady(r, r.step)
    ? "この工程の固定課題を確認できました。実Googleの成功や理解度の認定ではありません。"
    : "未確認の条件があります。予想・原文・選択資料・指示要素・各版の根拠と改善案を確認してください。工程は自由に移動できます。";
}
export const improvementText = (id: number) => improvements[id] ?? "未選択";
export const promptIdentity = (r: CapstoneRecord, custom: string) =>
  JSON.stringify([
    r.step,
    r.mode,
    r.environment,
    r.topic,
    r.artifact,
    r.audience,
    r.requirements,
    r.plan,
    r.sources,
    r.prompt,
    r.version,
    r.repairStyle,
    custom,
  ]);
export const selectedPromptItems = (r: CapstoneRecord) =>
  r.prompt.map((i) => promptItems[i]);
