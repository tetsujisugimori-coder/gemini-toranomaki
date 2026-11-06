# Independent review of chapter 10, first candidate

**CHANGES_REQUIRED** at `557f12e3c408a5735f9f0686f1e16361c6578c22`.
Exact SHA verified on remote `feat/chapter-10-capstone`; reviewer checkout is
`/workspace/chapter10-independent-20261106/candidate-557f12e`. No product code,
tests, branch, external state or existing repository evidence changed by reviewer.
No applicable repository AGENTS.md/.agents/skills was present. Baseline preparation
and environment details are in `../readiness.md`.

## Confirmed findings

| Severity | Finding | Location |
| --- | --- | --- |
| P2 | Broken repair omits explanation, but completeness and instruction-compliance rubric accept 適合 | capstone-engine.ts:65, :107; Capstone.tsx:219 |
| P2 | Corrupt record restores six current achievements without warning, while no initial artifact exists | capstone-storage.ts:161, :169 |
| P2 | Required full suite still expects chapter 10 準備中; both engines fail | tests/app.spec.ts:18 |

Exact reproduction, observed/expected behavior, impact, proposed fixes and evidence
are in [findings.md](findings.md). The first two were also reported to this thread
by another independent code reviewer; this browser reviewer then reproduced each
in both engines and saved separate raw observations and PNGs. No P1 confirmed.
No fix SHA has been received, so none of these is marked resolved.

## Independent operation and evidence

Chromium 156.0.8078.4 and WebKit 27.2 actually launched on Linux with Playwright
1.64.1. WebKit uses the locally extracted dependencies and launcher described in
`../readiness.md`; it is not a real Safari/iPhone test. Production build and separate
controlled preview ports were used. No existing author PASS statement was treated
as independent evidence.

- Complete historical topic through STEP 0–7 in both engines: environment and
  unavailable-service self-report; purpose/reader/requirements; prediction and
  improved plan; wrong-year/unsupported/supported source claims; removing S1 gives
  UNKNOWN; adding it back changes the answer; wrong citation judgment rejected;
  four-element full prompt; initial artifact; ten quality checks in all three
  versions; actual unanswered/correct/wrong inputs; unresponsive repair; final
  response recovery; six-axis reasons and reflection; independent chapter-completion
  checkbox; reload; source change invalidating current downstream evidence while
  retaining history. UI-generated saved records are in `sequence-run2/*-ui-achieved-record.json`.
- The mechanical sequence completed in both engines (`sequence-run2/independent-sequence.json`).
  **This is not a semantic quality PASS:** the path accepts the two false rubric
  judgments described above. The focused counterexample checks the artifact against
  selected requirements instead of trusting those acceptance messages.
- `independent-matrix-run2.json`: 32 combinations = both engines × 1280/320/375/390px
  × light/dark × root font 100%/200%. All eight steps operated with source context,
  quality/final comparison and optional real-service instructions; reduced motion
  enabled. No measured page overflow or out-of-viewport controls; no page errors.
  Step heading focus, keyboard Tab between quality inputs, Enter on panel controls
  and reset/cancel focus were checked.
- Representative PNG pixels inspected: Chromium desktop false quality PASS;
  Chromium 320px dark root200 quality and visible focus; WebKit 320px dark root200
  quality and focus; WebKit 375px light root200 final artifact; and the Chromium
  repair with selected correct answer and no result. The captured text is readable,
  controls visible and wrapping; Chromium native select text can truncate, with the
  full selected value repeated below. This is representative inspection, not every
  pixel of all 32 combinations.
- `independent-storage-copy.json`: 44 scenarios passed across both engines. Synthetic
  records under all eleven other chapter/lab/exploration keys stayed byte-identical.
  Chapter-10 completion preserved chapter 1/9; cancel and scoped reset respected
  scope; whole-app reset deleted only progress and retained the capstone record;
  reload retained fixed choices. Both free-text fields were filled with distinctive
  synthetic sentinels and no sentinel appeared in localStorage.
- Storage read denial, invalid JSON, QuotaExceededError, chapter-remove denial and
  progress-write denial were injected separately. Warning and continued operation
  verified; other keys protected. Invalid-but-parseable inconsistent records are the
  separate confirmed P2, not included in the storage PASS claim.
- Mocked clipboard: exact visible full text, old success/failure after step/topic/
  A→B→A prompt changes/mode/retry/scoped reset/unmount/same-event-turn change; an
  old completion did not clear newer busy/feedback. Current rejection added no success
  history; explicit retry succeeded. These verify UI state and browser API mocks,
  not physical clipboard contents or cancellation of already-started OS writes.

## Verification totals and raw evidence

| Check | Baseline main 3d4c7ac | Candidate 557f12e |
| --- | --- | --- |
| Typecheck/lint/build/diff-check | pass | pass |
| Unit | 129 passed | 159 passed |
| Full E2E | 824 passed, 0 failed | 896 passed, 2 failed (898 total) |
| Independent sequence | baseline route probe only | both engines completed; semantic P2s remain |
| Independent matrix | preparation probe only | 32/32 |
| Independent storage/copy | existing suite baseline | 44/44 scoped scenarios |

Full suites were independently executed without changing product tests. Candidate
adds 30 unit tests and 74 E2E cases; existing test changes mostly update chapter-10
availability and the formerly invalid chapter-10 ID to chapter-11. The unupdated
app expectation is retained as a finding. Build's >500kB warning remains.
Raw test list, unit/build/typecheck/lint logs, `full-e2e.log`, `full-e2e.json`,
`source-sha256.json`, independent scripts/JSON and representative PNGs are retained
in this evidence directory. `manifest.json` gives the pinned identity and totals.

Harness mistakes are preserved: first sequence run read WebKit focus before the
scheduled animation-frame focus; the second adds a focus wait and completes both.
First matrix run read html theme before React effect in three WebKit cases; the
second waits for application/theme readiness and completes all 32. No product change
between these runs. Initial raw scripts/logs/JSON and failure PNGs remain untouched.

## Official sources, external checks and remaining work

Read current primary [Deep Research](https://support.google.com/gemini/answer/15719111?hl=ja),
[Gemini app notebooks](https://support.google.com/gemini/answer/16972047?hl=ja),
[Gemini Notebook](https://support.google.com/gemininotebook/answer/16164461?hl=ja),
[source addition](https://support.google.com/gemininotebook/answer/16215270?hl=ja)
and [Canvas](https://support.google.com/gemini/answer/16047321?co=GENIE.Platform%3DDesktop&hl=ja).
Current naming and documented notebook synchronization do not establish automatic
Research-report/citation transfer or actual account eligibility. The candidate's
manual copy/Docs/source-addition instructions explicitly retain those limitations.
No real account operation or transfer was tested. Raw official HTML/headers are
under `../official/` and this directory's `official/`.

PENDING: fix candidate/full SHA, retest of the P2s, final clean full suite and final
CI SHA/raw evidence comparison. At the recorded query, no open PR or CI run existed
for the candidate branch (`candidate-pr-state.json`, `candidate-ci-state.json` both
empty); implementation/evidence work was still in progress. Missing final evidence
is not silently treated as a pass.

DENIED: baseline validation job 127607800694 raw-log download redirected to
productionresultssa16.blob.core.windows.net and returned HTTP Forbidden. No remote
mutation occurred; signed query redacted in `../main-ci-log-fetch.stderr`. Room
history checked and no materially new authorization found; no retry or alternate
route. Baseline CI metadata confirms SHA/status success, but raw-log comparison is
blocked. This was not an automatic approval-review rejection.

NOT_TESTED: real Google, real Safari/iPhone, Android hardware, screen reader,
physical clipboard, real account eligibility/documents/transfers, educational efficacy.
Issue #24's dependency critical risk remains separate. No merge, publication, Draft
change, formal review submission, unsolicited message or external repository write performed.
