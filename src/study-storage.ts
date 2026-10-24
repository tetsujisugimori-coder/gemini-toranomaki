import {
  citationChoices,
  conditionWarnings,
  defaultConditions,
  defaultGuide,
  planLabels,
  questionCases,
  reportChecks,
  studySources,
  studyTopics,
  verifiedMaterialIds,
  type GuideSettings,
  type ResearchConditions,
  type TopicId,
} from "./study-data";
export const researchKey = "gemini-toranomaki:research:v1";
export const notebookKey = "gemini-toranomaki:notebook:v1";
export interface ResearchRecord {
  topic: TopicId;
  revision: string;
  step: number;
  conditions: ResearchConditions;
  fixes: boolean[];
  activeSource: string;
  sourceAnswers: Record<string, number>;
  reportAnswers: Record<string, number>;
  copied: boolean;
}
export interface NotebookRecord {
  topic: TopicId;
  step: number;
  sources: string[];
  view: string;
  question: string;
  asked: boolean;
  citationAnswers: Record<string, number>;
  guide: GuideSettings;
  audio: "outline" | "dialogue";
  node: string;
  copied: boolean;
  origin: { revision: string; topic: TopicId; materials: string[] } | null;
  invalidated: boolean;
}
const object = (raw: unknown): Record<string, unknown> =>
  raw && typeof raw === "object" && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {};
const select = <T extends string>(
  raw: unknown,
  options: readonly T[],
  fallback: T,
): T => (options.includes(raw as T) ? (raw as T) : fallback);
const topic = (raw: unknown) =>
  select(
    raw,
    studyTopics.map((t) => t.id),
    "energy",
  );
const step = (raw: unknown) =>
  typeof raw === "number" && Number.isInteger(raw) && raw >= 0 && raw < 4
    ? raw
    : 0;
const unique = (raw: unknown, ids: string[]) =>
  Array.isArray(raw)
    ? [
        ...new Set(
          raw.filter(
            (id): id is string => typeof id === "string" && ids.includes(id),
          ),
        ),
      ]
    : [];
const answers = (raw: unknown, limits: Record<string, number>) =>
  Object.fromEntries(
    Object.entries(object(raw)).filter(
      ([id, n]) =>
        Object.hasOwn(limits, id) &&
        typeof n === "number" &&
        Number.isInteger(n) &&
        n >= 0 &&
        n < limits[id],
    ),
  );
const revision = (raw: unknown) =>
  typeof raw === "string" && /^[a-f0-9-]{36}$/.test(raw)
    ? raw
    : crypto.randomUUID();
export function freshResearch(id: TopicId = "energy"): ResearchRecord {
  return {
    topic: id,
    revision: crypto.randomUUID(),
    step: 0,
    conditions: { ...defaultConditions },
    fixes: planLabels.map(() => false),
    activeSource: `${id}-public`,
    sourceAnswers: {},
    reportAnswers: {},
    copied: false,
  };
}
export function sanitizeResearch(raw: unknown): ResearchRecord {
  const r = object(raw),
    id = topic(r.topic),
    c = object(r.conditions);
  return {
    topic: id,
    revision: revision(r.revision),
    step: step(r.step),
    conditions: {
      purpose: select(c.purpose, ["learn", "decision"], "learn"),
      period: select(c.period, ["recent", "any"], "recent"),
      region: select(c.region, ["japan", "world"], "japan"),
      comparison: select(c.comparison, ["same", "none"], "same"),
      evidence: select(c.evidence, ["primary", "any"], "primary"),
    },
    fixes: planLabels.map(
      (_, i) => Array.isArray(r.fixes) && r.fixes[i] === true,
    ),
    activeSource: select(
      r.activeSource,
      studySources(id)
        .slice(0, 7)
        .map((s) => s.id),
      `${id}-public`,
    ),
    sourceAnswers: answers(
      r.sourceAnswers,
      Object.fromEntries(
        studySources(id)
          .slice(0, 7)
          .map((s) => [s.id, 3]),
      ),
    ) as Record<string, number>,
    reportAnswers: answers(
      r.reportAnswers,
      Object.fromEntries(reportChecks(id).map((c) => [c.id, c.options.length])),
    ) as Record<string, number>,
    copied: r.copied === true,
  };
}
export function freshNotebook(id: TopicId = "energy"): NotebookRecord {
  return {
    topic: id,
    step: 0,
    sources: [],
    view: "",
    question: "correct",
    asked: false,
    citationAnswers: {},
    guide: { ...defaultGuide },
    audio: "outline",
    node: "root",
    copied: false,
    origin: null,
    invalidated: false,
  };
}
export function sanitizeNotebook(raw: unknown): NotebookRecord {
  const r = object(raw),
    id = topic(r.topic),
    allowed = studySources(id).map((s) => s.id),
    g = object(r.guide),
    o = object(r.origin);
  const selected = unique(r.sources, allowed);
  const originValid =
    o.topic === id &&
    typeof o.revision === "string" &&
    /^[a-f0-9-]{36}$/.test(o.revision);
  return {
    topic: id,
    step: step(r.step),
    sources: selected,
    view: select(r.view, ["", ...allowed], ""),
    question: select(
      r.question,
      questionCases.map((q) => q.id),
      "correct",
    ),
    asked: r.asked === true,
    citationAnswers: answers(
      r.citationAnswers,
      Object.fromEntries(
        questionCases.map((q) => [q.id, citationChoices.length]),
      ),
    ) as Record<string, number>,
    guide: {
      audience: select(g.audience, ["beginner", "intermediate"], "beginner"),
      format: select(g.format, ["summary", "qa", "quiz"], "summary"),
      detail: select(g.detail, ["brief", "detailed"], "brief"),
    },
    audio: select(r.audio, ["outline", "dialogue"], "outline"),
    node: select(r.node, ["root", ...selected], "root"),
    copied: r.copied === true,
    origin: originValid
      ? {
          topic: id,
          revision: o.revision as string,
          materials: unique(o.materials, allowed),
        }
      : r.origin
        ? { topic: id, revision: "invalid", materials: [] }
        : null,
    invalidated: r.invalidated === true,
  };
}
export function researchReady(r: ResearchRecord) {
  return (
    !conditionWarnings(r.conditions).length &&
    r.fixes.every(Boolean) &&
    studySources(r.topic)
      .slice(0, 7)
      .every((s) => r.sourceAnswers[s.id] === s.judgment) &&
    reportChecks(r.topic).every((c) => r.reportAnswers[c.id] === c.answer)
  );
}
export function transferNotebook(r: ResearchRecord): NotebookRecord | null {
  if (!researchReady(r)) return null;
  const materials = verifiedMaterialIds(r.topic);
  return {
    ...freshNotebook(r.topic),
    sources: materials,
    origin: { revision: r.revision, topic: r.topic, materials },
  };
}
export function reconcileNotebook(
  n: NotebookRecord,
  r: ResearchRecord,
): NotebookRecord {
  if (!n.origin) return n;
  const expected = verifiedMaterialIds(r.topic);
  if (
    n.origin.revision === r.revision &&
    n.origin.topic === r.topic &&
    n.topic === r.topic &&
    researchReady(r) &&
    expected.length === n.origin.materials.length &&
    expected.every((id) => n.origin!.materials.includes(id))
  )
    return n;
  return {
    ...freshNotebook(r.topic),
    guide: n.guide,
    audio: n.audio,
    invalidated: true,
  };
}
function load<T>(key: string, sanitize: (raw: unknown) => T) {
  try {
    return {
      record: sanitize(JSON.parse(localStorage.getItem(key) || "null")),
      available: true,
    };
  } catch {
    return { record: sanitize(null), available: false };
  }
}
export const loadResearch = () => load(researchKey, sanitizeResearch);
export const loadNotebook = () => load(notebookKey, sanitizeNotebook);
export function saveStudy(
  key: typeof researchKey | typeof notebookKey,
  record: ResearchRecord | NotebookRecord,
) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify(
        key === researchKey
          ? sanitizeResearch(record)
          : sanitizeNotebook(record),
      ),
    );
    return true;
  } catch {
    return false;
  }
}
export function removeStudy(key: typeof researchKey | typeof notebookKey) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
