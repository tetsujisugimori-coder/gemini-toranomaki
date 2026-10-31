import { templates, tutorOptions } from "./skills-data";
export const skillsKey = "gemini-toranomaki:skills:v1";
export interface SkillsRecord {
  step: number;
  tutor: number[];
  template: string;
  drafts: Record<string, string[]>;
  edited: string[];
  migration: string[];
  question: number;
  simulationQuestion: number;
  answers: Record<string, number>;
  completed: number[];
  mode: number;
  selected: boolean[];
}
export const freshSkills = (): SkillsRecord => ({
  step: 0,
  tutor: [0, 0, 0, 1, 0, 0],
  template: "学習支援AI",
  drafts: Object.fromEntries(
    Object.entries(templates).map(([k, v]) => [k, [...v]]),
  ),
  edited: [...templates["学習支援AI"]],
  migration: [
    "python-tutor",
    "Python初心者を支援",
    "Pythonの学習相談",
    "段階的なヒントを出す",
    "質問と短い説明",
    "for文を教えて",
  ],
  question: 0,
  simulationQuestion: 0,
  answers: {},
  completed: [],
  mode: 0,
  selected: [true, true, true, false],
});
export function sanitizeSkills(value: unknown): SkillsRecord {
  const r =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const d = freshSkills();
  const number = (v: unknown, max: number, fallback: number) =>
    typeof v === "number" && Number.isInteger(v) && v >= 0 && v < max
      ? v
      : fallback;
  const strings = (v: unknown, fallback: string[]) =>
    Array.isArray(v) &&
    v.length === fallback.length &&
    v.every((x) => typeof x === "string" && x.length <= 4000)
      ? ([...v] as string[])
      : fallback;
  const answers: Record<string, number> = {};
  if (r.answers && typeof r.answers === "object" && !Array.isArray(r.answers))
    for (let i = 0; i < 4; i++) {
      const n = (r.answers as Record<string, unknown>)[i];
      if (n === 0 || n === 1) answers[i] = n;
    }
  return {
    step: number(r.step, 4, 0),
    tutor: d.tutor.map((x, i) =>
      number(
        Array.isArray(r.tutor) ? r.tutor[i] : null,
        tutorOptions[i].length,
        x,
      ),
    ),
    template:
      typeof r.template === "string" && Object.hasOwn(templates, r.template)
        ? r.template
        : d.template,
    drafts: Object.fromEntries(
      Object.entries(templates).map(([k, v]) => [
        k,
        strings(
          r.drafts && typeof r.drafts === "object"
            ? (r.drafts as Record<string, unknown>)[k]
            : null,
          [...v],
        ),
      ]),
    ),
    edited: strings(r.edited, d.edited),
    migration: strings(r.migration, d.migration),
    question: number(r.question, 4, 0),
    simulationQuestion: number(r.simulationQuestion, 3, 0),
    answers,
    completed: Array.isArray(r.completed)
      ? [
          ...new Set(
            r.completed.filter(
              (x): x is number => Number.isInteger(x) && x >= 0 && x < 4,
            ),
          ),
        ]
      : [],
    mode: number(r.mode, 2, 0),
    selected:
      Array.isArray(r.selected) &&
      r.selected.length === 4 &&
      r.selected.every((x) => typeof x === "boolean")
        ? r.selected
        : d.selected,
  };
}
export function loadSkills() {
  try {
    return {
      record: sanitizeSkills(
        JSON.parse(localStorage.getItem(skillsKey) ?? "null"),
      ),
      available: true,
    };
  } catch {
    return { record: freshSkills(), available: false };
  }
}
export function saveSkills(r: SkillsRecord) {
  try {
    localStorage.setItem(skillsKey, JSON.stringify(sanitizeSkills(r)));
    return true;
  } catch {
    return false;
  }
}
