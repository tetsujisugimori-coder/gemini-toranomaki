# Preliminary independent findings: candidate 557f12e

Exact candidate `557f12e3c408a5735f9f0686f1e16361c6578c22`, verified at remote
`feat/chapter-10-capstone`. Product code/tests unchanged by reviewer. This report
is for this SHA; fixes and final CI have not yet been received or accepted.

## P2 — Repair rubric rewards an unmet completion requirement

Files: `src/capstone-engine.ts:65` and `:107`, contrasted with
`src/Capstone.tsx:219`. Reproduced independently in Chromium and WebKit.

Repro: choose historical topic with all three default completion requirements,
select all four production-prompt elements, create the initial artifact, then in
STEP 6 choose the specific repair instruction and apply it. Select 1924年 in
修正版1（退行あり） and press 回答を確認. The result remains （結果未表示）;
no answer explanation is presented. In quality item 2, choose 適合 +
選択した完成条件が本文に揃っている + 変更不要・根拠を維持, and inspect the
result. In item 6, choose 適合 + 制作指示の対象・形式・根拠・完成条件を確認できる
+ 変更不要・根拠を維持.

Observed: both items return 固定資料との照合OK, even though the selected condition
確認問題と解説を付ける and repair instruction requiring result/explanation are not met.
The ordinary successful sequence also reaches this contradiction; storage tampering
is unnecessary. Correctly detecting the same regression in items 7/8 does not make
items 2/6 true. Expected: the affected completion/instruction requirements return
要改善 with specific evidence and an appropriate fix, consistently across themes,
formats and requirement selections. Proposed fix: derive those rubric cases from
the actual version and selected requirements, including the broken explanation,
then test both a correct defect judgment and rejection of the false 適合 judgment.

Raw independent reproduction: `independent-counterexamples.json`; screenshots
`*-counterexample-repair-no-explanation.png`, `*-counterexample-quality2-false-pass.png`
and `*-counterexample-quality6-false-pass.png`. The starting valid record used by
the focused counterexample came from the reviewer's complete UI sequence, not an
author fixture. Both engines were also operated in that sequence.

## P2 — Corrupt saved data restores false current achievements without a warning

Files: `src/capstone-storage.ts:161` and `:169`, rendered by the current-achievement
toolbar in `src/Capstone.tsx`. Reproduced independently in Chromium and WebKit.

Repro: set only `gemini-toranomaki:capstone:v1` to
`{"achieved":[2,3,4,5,6,7],"topic":"corrupt","created":"true"}` and reload
`#chapter-10`. Then navigate to STEP 6.

Observed: no corruption alert; toolbar says 現在の模擬確認 6/8. STEP 6 simultaneously
says まだ初版がありません. Sanitization defaults the invalid topic and boolean,
but accepts the current-achievement IDs without validating their prerequisites.
Selecting STEP 6 saves that inconsistent state again. Expected: notify about the
corrupt record and do not represent unfulfilled conditions as current achievement;
preserve separately identified historical records where valid. Proposed fix:
validate field shapes and current-achievement consistency during load/sanitize,
report repair/recovery status to the UI, and independently test invalid and partial
records without promoting their historical or asserted IDs into current success.

Raw independent reproduction: `independent-counterexamples.json` and
`*-counterexample-corrupt-achievement.png`. Only synthetic local data was used.

## P2 — Required full regression suite still expects chapter 10 to be planned

File: `tests/app.spec.ts:18`. Baseline was 824/824 passing. The candidate's full
898-case run finished with 896 passed and 2 failed, this failure in both engines: navigate curriculum →
chapter 10, then expect the heading 準備中. Candidate correctly renders STEP 0.

Expected: update this obsolete assertion to the new exact chapter-10 entry
expectation and retain the rest of the navigation/copy/quiz/progress/reset coverage.
Do not remove the test. The required full regression gate cannot be green at this
SHA. Raw output: `full-e2e.log` and `full-e2e.json` (6.9 minutes, no retries/skips).

No P1 has been confirmed. The independent 32-condition matrix and 44 storage/copy
scenarios passed, as documented in `review.md`. Fix HEAD and final CI remain pending.
