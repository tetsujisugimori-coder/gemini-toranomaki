import { describe, expect, it } from "vitest";
import {
  makeComparison,
  quality,
  templates,
  simulateSkills,
  tutorExample,
} from "./skills-data";
import { sanitizeSkills } from "./skills-storage";
describe("第9章", () => {
  it("条件ごとに模擬回答と説明が変わる", () => {
    const hint = makeComparison([0, 0, 0, 0, 0, 0], 0);
    const answer = makeComparison([0, 2, 2, 2, 0, 1], 0);
    expect(hint.custom).toContain("最初に取り出される");
    expect(answer.custom).toContain("イテラブル");
    expect(answer.custom).toContain("1.");
    expect(answer.reason).toContain("解説中心");
    expect(answer.general).toBe(hint.general);
  });
  it("ローカル評価は入力変更に追従する", () => {
    const v = [...templates["学習支援AI"]];
    v[3] = "答えをすぐに示す";
    expect(quality(v).join()).toContain("矛盾の可能性");
  });
  it("不正な保存値を制限する", () => {
    const r = sanitizeSkills({
      step: 999,
      tutor: [-1],
      answers: { 0: 99 },
      edited: [123],
    });
    expect(r.step).toBe(0);
    expect(r.tutor).toHaveLength(6);
    expect(r.answers).toEqual({});
    expect(r.edited).toEqual(templates["学習支援AI"]);
  });
});

describe("決定的な比較と記録の保護", () => {
  it("4つの質問それぞれに説明とヒントを用意する", () => {
    for (let i = 0; i < 4; i++) {
      const hint = makeComparison([0, 0, 0, 0, 0, 0], i);
      const explanation = makeComparison([0, 0, 2, 2, 0, 1], i);
      expect(hint.custom).not.toEqual(explanation.custom);
      expect(explanation.general).toBe(hint.general);
      expect(explanation.reason).toContain("解説中心");
      expect(explanation.custom).toContain("1.");
    }
  });
  it("無関係な条件の変更でも回答と下書きを残す", () => {
    const initial = sanitizeSkills({
      template: "学習支援AI",
      edited: [...templates["学習支援AI"]],
      answers: { 1: 0 },
      completed: [1],
    });
    const changed = sanitizeSkills({ ...initial, question: 2 });
    expect(changed.answers).toEqual({ 1: 0 });
    expect(changed.completed).toEqual([1]);
    expect(changed.edited).toEqual(initial.edited);
  });
});

it("分野の回答例と自動適用条件は質問ごとに変わる", () => {
  expect(tutorExample([0, 0, 0, 1, 0, 0]).question).toContain("二次方程式");
  expect(tutorExample([1, 0, 0, 1, 0, 0]).question).toContain("英文");
  expect(tutorExample([2, 0, 0, 1, 0, 0]).question).toContain("Python");
  expect(tutorExample([3, 0, 0, 1, 0, 0]).question).toContain("地図");
  expect(simulateSkills(0).map((s) => s.applies)).toEqual([
    true,
    true,
    true,
    false,
  ]);
  expect(simulateSkills(1).map((s) => s.applies)).toEqual([
    false,
    true,
    false,
    true,
  ]);
  expect(simulateSkills(2).some((s) => s.applies)).toBe(false);
});
