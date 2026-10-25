import { quizFor, type QuizTopic, type QuizVersion } from "./canvas-data";
export type QuizAnswers = (number | null)[];
export type Grade =
  | { kind: "blocked"; missing: number[] }
  | { kind: "scored"; score: number };
export interface QuizRun {
  grade: Grade | null;
  submissions: number;
}
export interface QuizSession {
  answers: QuizAnswers;
  runs: Record<QuizVersion, QuizRun>;
  event: "none" | "answer" | "grade" | "restart";
}
export const emptyRun = (): QuizRun => ({ grade: null, submissions: 0 });
export const emptyQuiz = (): QuizSession => ({
  answers: [null, null, null],
  runs: { initial: emptyRun(), revised: emptyRun() },
  event: "none",
});
export function normalizeAnswers(answers: readonly unknown[]): QuizAnswers {
  return [0, 1, 2].map((i) =>
    Number.isInteger(answers[i]) &&
    Number(answers[i]) >= 0 &&
    Number(answers[i]) < 3
      ? (answers[i] as number)
      : null,
  );
}
export function gradeQuiz(
  topic: QuizTopic,
  answers: readonly unknown[],
  requireAll: boolean,
): Grade {
  const normalized = normalizeAnswers(answers);
  const missing = normalized.flatMap((a, i) => (a === null ? [i + 1] : []));
  if (requireAll && missing.length) return { kind: "blocked", missing };
  return {
    kind: "scored",
    score: quizFor(topic).questions.reduce(
      (sum, q, i) => sum + Number(normalized[i] === q.answer),
      0,
    ),
  };
}
export function setQuizAnswers(
  session: QuizSession,
  answers: readonly unknown[],
): QuizSession {
  const next = normalizeAnswers(answers);
  if (next.every((a, i) => a === session.answers[i])) return session;
  return { ...emptyQuiz(), answers: next, event: "answer" };
}
export function submitQuiz(
  session: QuizSession,
  topic: QuizTopic,
  version: QuizVersion,
  requireAll: boolean,
): QuizSession {
  return {
    ...session,
    event: "grade",
    runs: {
      ...session.runs,
      [version]: {
        grade: gradeQuiz(topic, session.answers, requireAll),
        submissions: session.runs[version].submissions + 1,
      },
    },
  };
}
export function presetAnswers(
  topic: QuizTopic,
  preset: "empty" | "partial" | "correct" | "wrong" | "mixed",
): QuizAnswers {
  const correct = quizFor(topic).questions.map((q) => q.answer);
  if (preset === "empty") return [null, null, null];
  if (preset === "partial") return [correct[0], null, null];
  if (preset === "correct") return correct;
  if (preset === "wrong") return correct.map((a) => (a + 1) % 3);
  return correct.map((a, i) => (i === 0 ? a : (a + 1) % 3));
}
