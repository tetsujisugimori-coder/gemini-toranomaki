import { afterEach, expect, it, vi } from "vitest";
import {
  citationReason,
  conditionWarnings,
  defaultConditions,
  defaultGuide,
  improvedPlan,
  learningGuide,
  notebookAnswer,
  reportChecks,
  researchPrompt,
  studySources,
  studyTopics,
  verifiedMaterialIds,
} from "./study-data";
import {
  freshNotebook,
  freshResearch,
  loadNotebook,
  loadResearch,
  notebookKey,
  reconcileNotebook,
  removeStudy,
  researchKey,
  researchReady,
  sanitizeNotebook,
  sanitizeResearch,
  saveStudy,
  transferNotebook,
} from "./study-storage";
import { loadProgress, progressKey, saveProgress } from "./storage";
function ready() {
  const r = freshResearch("education");
  r.fixes = [true, true, true, true];
  r.sourceAnswers = Object.fromEntries(
    studySources(r.topic)
      .slice(0, 7)
      .map((s) => [s.id, s.judgment]),
  );
  r.reportAnswers = Object.fromEntries(
    reportChecks(r.topic).map((c) => [c.id, c.answer]),
  );
  return r;
}
afterEach(() => vi.unstubAllGlobals());
it("changes the research request and diagnoses each ambiguous scope condition", () => {
  const conditions = {
    ...defaultConditions,
    period: "any",
    region: "world",
    comparison: "none",
    evidence: "any",
    purpose: "decision",
  } as const;
  expect(conditionWarnings(conditions)).toHaveLength(4);
  expect(conditionWarnings(defaultConditions)).toEqual([]);
  const text = researchPrompt("mobility", conditions);
  expect(text).toContain("電気自動車");
  expect(text).toContain("比較検討");
  expect(text).toContain("未指定");
  expect(text).toContain("まず調査計画だけ");
  expect(text).toContain("開始を依頼するまで調査を開始しない");
  expect(
    improvedPlan("energy", defaultConditions, [true, true, true, true]).join(
      "\n",
    ),
  ).toContain("同じ分母");
  expect(
    improvedPlan("energy", defaultConditions, [false, false, false, false]),
  ).not.toEqual(
    improvedPlan("energy", defaultConditions, [true, true, true, true]),
  );
});
it("keeps mock evidence and claims consistent while distinguishing source type, date, method and support", () => {
  for (const t of studyTopics) {
    const sources = studySources(t.id);
    expect(sources).toHaveLength(8);
    expect(new Set(sources.map((s) => s.id)).size).toBe(8);
    expect(sources[0].body).toContain(`${t.value}%`);
    expect(sources[1].body).toContain("因果関係は確認できません");
    expect(sources.find((s) => s.id.endsWith("-company"))?.reason).toContain(
      "一次資料として有用",
    );
    expect(sources.find((s) => s.id.endsWith("-old"))?.reason).toContain(
      "現在値",
    );
    expect(sources.find((s) => s.id.endsWith("-mismatch"))?.judgment).toBe(2);
    for (const c of reportChecks(t.id)) {
      expect(sources.some((s) => s.id === c.source)).toBe(true);
      expect(c.reason).toBeTruthy();
      expect(c.options[c.answer]).toBeTruthy();
    }
  }
});
it("requires corrected conditions, all plan fixes, source reasoning and report checks before transfer", () => {
  const r = ready();
  expect(researchReady(r)).toBe(true);
  const n = transferNotebook(r)!;
  expect(n.sources).toEqual(verifiedMaterialIds(r.topic));
  expect(n.origin?.revision).toBe(r.revision);
  expect(
    transferNotebook({ ...r, fixes: [true, true, false, true] }),
  ).toBeNull();
  expect(
    transferNotebook({
      ...r,
      sourceAnswers: { ...r.sourceAnswers, "education-old": 0 },
    }),
  ).toBeNull();
  expect(
    transferNotebook({
      ...r,
      reportAnswers: { ...r.reportAnswers, number: 2 },
    }),
  ).toBeNull();
  expect(
    transferNotebook({ ...r, conditions: { ...r.conditions, period: "any" } }),
  ).toBeNull();
});
it("invalidates stale imports after topic, revision, checks or reset but leaves standalone notebooks independent", () => {
  const r = ready(),
    imported = transferNotebook(r)!;
  expect(reconcileNotebook(imported, r)).toBe(imported);
  const standalone = {
    ...freshNotebook("mobility"),
    sources: ["mobility-public"],
  };
  expect(reconcileNotebook(standalone, r)).toBe(standalone);
  for (const changed of [
    { ...r, revision: crypto.randomUUID() },
    freshResearch(),
    { ...r, reportAnswers: {} },
  ]) {
    const invalid = reconcileNotebook(imported, changed);
    expect(invalid.sources).toEqual([]);
    expect(invalid.origin).toBeNull();
    expect(invalid.asked).toBe(false);
    expect(invalid.invalidated).toBe(true);
  }
  expect(
    reconcileNotebook(
      {
        ...imported,
        origin: { ...imported.origin!, materials: ["education-blog"] },
      },
      r,
    ).sources,
  ).toEqual([]);
});
it("makes citation existence different from support and never answers from excluded sources", () => {
  const ids = ["energy-public", "energy-company"];
  expect(notebookAnswer("energy", "correct", ids).text).toContain("32%");
  expect(notebookAnswer("energy", "wrong", ids).citations).toEqual([
    "energy-company",
  ]);
  expect(citationReason("energy", "wrong")).toContain("取り違え");
  expect(notebookAnswer("energy", "invented", ids).text).toContain("97%");
  expect(citationReason("energy", "invented")).toContain("記していません");
  expect(notebookAnswer("energy", "outside", ids).text).toContain(
    "答えられません",
  );
  expect(
    notebookAnswer("energy", "correct", ["energy-company"]).available,
  ).toBe(false);
  expect(notebookAnswer("energy", "correct", []).citations).toEqual([]);
});
it("changes all twelve guide combinations substantively and cites only selected materials", () => {
  const variants = new Set<string>();
  for (const audience of ["beginner", "intermediate"] as const)
    for (const format of ["summary", "qa", "quiz"] as const)
      for (const detail of ["brief", "detailed"] as const) {
        const guide = learningGuide("mobility", ["mobility-public"], {
          audience,
          format,
          detail,
        });
        variants.add(guide);
        expect(guide).toContain("28件");
        expect(guide).toContain("根拠：[1]");
        expect(guide).not.toContain("24件");
        if (format === "qa") expect(guide).toContain("Q1：");
        if (format === "quiz") expect(guide).toContain("解答例");
        if (audience === "intermediate") expect(guide).toContain("判断の根拠");
        if (detail === "detailed") expect(guide).toContain("原文：");
      }
  expect(variants.size).toBe(12);
  expect(learningGuide("energy", [], defaultGuide)).toContain(
    "参照資料がありません",
  );
});
it("round-trips fixed records without changing legacy keys and supports independent deletion", () => {
  const values = new Map([
    [progressKey, '{"completed":["chapter-1","chapter-2"]}'],
    ["gemini-toranomaki:lab:v1", "lab"],
    ["gemini-toranomaki:exploration:v1", "explore"],
  ]);
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => values.set(k, v),
    removeItem: (k: string) => values.delete(k),
  });
  const r = ready(),
    n = transferNotebook(r)!;
  expect(saveStudy(researchKey, r)).toBe(true);
  expect(saveStudy(notebookKey, n)).toBe(true);
  expect(loadResearch().record).toEqual(r);
  expect(loadNotebook().record).toEqual(n);
  expect(loadProgress().progress.completed).toEqual(["chapter-1", "chapter-2"]);
  saveProgress({
    completed: ["chapter-1", "chapter-2", "chapter-3", "chapter-4"],
  });
  expect(loadProgress().progress.completed).toHaveLength(4);
  expect(removeStudy(researchKey)).toBe(true);
  expect(loadNotebook().record).toEqual(n);
  expect(values.get("gemini-toranomaki:lab:v1")).toBe("lab");
  expect(values.get("gemini-toranomaki:exploration:v1")).toBe("explore");
});
it("drops malformed choices, cross-topic sources and private fields", () => {
  const r = sanitizeResearch({
    topic: "private",
    step: 99,
    fixes: [true, "true"],
    sourceAnswers: { "energy-public": 0, secret: 0, "energy-paper": 9 },
    prompt: "secret",
  });
  expect(r.topic).toBe("energy");
  expect(r.step).toBe(0);
  expect(r.fixes).toEqual([true, false, false, false]);
  expect(r.sourceAnswers).toEqual({ "energy-public": 0 });
  expect(r).not.toHaveProperty("prompt");
  const n = sanitizeNotebook({
    topic: "energy",
    sources: ["energy-public", "energy-public", "education-public", 7],
    question: "private",
    node: "education-public",
    answers: "private",
    citationAnswers: { correct: 0, wrong: 9 },
    guide: null,
  });
  expect(n.sources).toEqual(["energy-public"]);
  expect(n.question).toBe("correct");
  expect(n.node).toBe("root");
  expect(n.citationAnswers).toEqual({ correct: 0 });
  expect(n).not.toHaveProperty("answers");
  expect(n.guide).toEqual(defaultGuide);
});
it("reports corrupt JSON and blocked reads, writes and deletion without claiming success", () => {
  vi.stubGlobal("localStorage", {
    getItem: () => "{bad",
    setItem: () => {
      throw Error("quota");
    },
    removeItem: () => {
      throw Error("blocked");
    },
  });
  expect(loadResearch().available).toBe(false);
  expect(loadNotebook().available).toBe(false);
  expect(saveStudy(researchKey, freshResearch())).toBe(false);
  expect(removeStudy(notebookKey)).toBe(false);
  vi.stubGlobal("localStorage", {
    getItem: () => {
      throw Error("blocked");
    },
  });
  expect(loadNotebook().record.sources).toEqual([]);
});

it("accepts a company announcement for its own reported test without treating it as independent comparative proof", () => {
  const company = studySources("energy").find(
    (s) => s.id === "energy-company",
  )!;
  expect(company.claim).toContain("12件の試験");
  expect(company.body).toContain("12件の試験");
  expect(company.judgment).toBe(0);
  expect(company.reason).toContain("条件付きで採用");
  expect(company.reason).toContain("他製品より優れている");
  expect(company.reason).toContain("別の根拠が必要");
});

it("rejects an old public-style document for a current claim without denying its historical use", () => {
  const old = studySources("energy").find((s) => s.id === "energy-old")!;
  expect(old.claim).toContain("2025年");
  expect(old.body).toContain("2015年");
  expect(old.judgment).toBe(2);
  expect(old.reason).toContain("根拠には採用しません");
  expect(old.reason).toContain("歴史的背景を知る用途には有用");
});

it("keeps only explicit same-topic additions when imports expire, including on reset", () => {
  const r = ready();
  const n = {
    ...transferNotebook(r)!,
    sources: [...verifiedMaterialIds(r.topic), "education-company"],
    localSources: ["education-company"],
    view: "education-public",
    node: "education-company",
    asked: true,
    citationAnswers: { correct: 0 },
    copied: true,
    guide: {
      audience: "intermediate",
      format: "qa",
      detail: "detailed",
    } as const,
    audio: "dialogue" as const,
  };
  for (const changed of [
    { ...r, revision: crypto.randomUUID() },
    freshResearch("education"),
  ]) {
    const result = reconcileNotebook(n, changed);
    expect(result.sources).toEqual(["education-company"]);
    expect(result.localSources).toEqual(["education-company"]);
    expect(result.origin).toBeNull();
    expect(result.guide).toEqual(n.guide);
    expect(result.audio).toBe("dialogue");
    expect(result.asked).toBe(false);
    expect(result.citationAnswers).toEqual({});
    expect(result.view).toBe("");
    expect(result.node).toBe("root");
    expect(result.copied).toBe(false);
  }
  const different = reconcileNotebook(n, freshResearch("mobility"));
  expect(different.topic).toBe("mobility");
  expect(different.sources).toEqual([]);
  expect(different.localSources).toEqual([]);
  const again = transferNotebook(
    r,
    reconcileNotebook(n, freshResearch("education")),
  )!;
  expect(again.sources).toEqual([
    ...verifiedMaterialIds(r.topic),
    "education-company",
  ]);
  expect(again.guide).toEqual(n.guide);
});

it("restores provenance, migrates legacy imports conservatively and filters corrupt ownership", () => {
  const r = ready();
  const n = {
    ...transferNotebook(r)!,
    sources: [...verifiedMaterialIds(r.topic), "education-company"],
    localSources: ["education-company"],
  };
  expect(sanitizeNotebook(JSON.parse(JSON.stringify(n)))).toEqual(n);
  const legacy = { ...n, localSources: undefined };
  const loaded = sanitizeNotebook(legacy);
  expect(loaded.sources).toEqual(n.sources);
  expect(loaded.localSources).toEqual([]);
  expect(reconcileNotebook(loaded, r)).toBe(loaded);
  expect(reconcileNotebook(loaded, freshResearch("education")).sources).toEqual(
    [],
  );
  const corrupt = sanitizeNotebook({
    ...n,
    localSources: [
      "education-public",
      "mobility-company",
      "education-company",
      "private",
    ],
  });
  expect(corrupt.localSources).toEqual(["education-company"]);
  expect(sanitizeNotebook({ ...n, localSources: "bad" }).localSources).toEqual(
    [],
  );
  const malformed = sanitizeNotebook({
    ...n,
    origin: { topic: "energy", revision: "bad" },
  });
  expect(reconcileNotebook(malformed, r).sources).toEqual([
    "education-company",
  ]);
  // Legacy origin:null is the old format's explicit standalone state, not an imported extra.
  for (const origin of [undefined, false, 0, "", { revision: "bad" }]) {
    const damaged = sanitizeNotebook({ ...legacy, origin });
    expect(damaged.localSources).toEqual([]);
    expect(reconcileNotebook(damaged, r).sources).toEqual([]);
  }
  const standalone = sanitizeNotebook({
    topic: "education",
    sources: ["education-public"],
    origin: null,
  });
  expect(standalone.localSources).toEqual(["education-public"]);
  expect(reconcileNotebook(standalone, freshResearch())).toBe(standalone);
});

it("has three distinct evidence decisions and withholds transfer until the uncertain source is reconsidered", () => {
  for (const t of studyTopics) {
    const sources = studySources(t.id).slice(0, 7);
    expect(new Set(sources.map((s) => s.judgment))).toEqual(new Set([0, 1, 2]));
    const unknown = sources.find((s) => s.id.endsWith("-unknown"))!;
    expect(unknown.judgment).toBe(1);
    expect(unknown.reason).toContain("原資料を探し");
    expect(unknown.reason).toContain("確認できるまで97%");
    expect(unknown.reason).toContain("採用を見送ります");
  }
  const r = ready();
  expect(
    transferNotebook({
      ...r,
      sourceAnswers: { ...r.sourceAnswers, "education-unknown": 2 },
    }),
  ).toBeNull();
  expect(transferNotebook(r)).not.toBeNull();
});

it("distinguishes deleted research from an explicit new topic during reset reconciliation", () => {
  const r = ready();
  const n = {
    ...transferNotebook(r)!,
    sources: [...verifiedMaterialIds(r.topic), "education-company"],
    localSources: ["education-company"],
  };
  const reset = reconcileNotebook(n, freshResearch(), true);
  expect(reset.topic).toBe("education");
  expect(reset.sources).toEqual(["education-company"]);
  expect(reconcileNotebook(n, freshResearch()).sources).toEqual([]);
  vi.stubGlobal("localStorage", { getItem: () => null });
  expect(loadResearch().missing).toBe(true);
  vi.stubGlobal("localStorage", { getItem: () => "{bad" });
  expect(loadResearch().missing).toBe(false);
});
