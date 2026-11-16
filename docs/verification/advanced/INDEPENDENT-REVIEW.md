# Independent review, revision 01
2026-11-16 UTC. Independent reviewer agent; no implementation edits.

Scope: working candidate, not a final commit or formal CI acceptance. File hashes and actual independent calculations are in initial-review.json and revision-review.json. Initial failures retained, not overwritten.

## Findings
- P2-01 CLOSED in revised candidate: records: [] rejected (exact initial input repeated); null rejected. Corrupt raw protection remains in loadAdvanced/update path.
- P2-02 CLOSED as explicit batch design: E option now says all three controls and copied input indeed contains normal, insufficient, and out-of-scope cases. This is a design clarification, not external Skills execution.
- P2-03 CLOSED in data/UI static inspection: initial real/checked are distinct from improvedReal/improvedChecked; initial confirmed entry does not mark improved performed. Decoder rejects improvedChecked without improvedReal=1. Browser interaction confirmation pending.
- P3 editorial: PDFs may start wrapped line with punctuation, but readable and no missing or clipped text. Optional layout refinement.

## Independent checks
CSV raw rows independently parsed; BigInt sum = 17000 JPY including return; missing row 1, numeric 5. Excluding negative return = 17300 JPY, numeric 4. T5 percentage exact fractions 1200000/17000 and 1200000/17300 percent. No AI output used for canonical sums.
PDF old/new rendered images personally inspected: v1/v2 and dates distinguishable; old Dec 5 10-12 North Park / Nov25 / writing tools+lunch; new Dec6 13-15 South Park / Nov28 / writing tools+rain gear; fee remains500. All are marked fictional. Source-data comparison agrees. Download/browser PDF viewer not independently exercised.
Fixed-question correct answer reasoning checked against literal material. No external Gemini answer auto-scoring claim found.
Same-option object identity preserved; changed option clears confirmations. Raw free text and AI response not present in storage whitelist.
Tracked diffs to package.json, package-lock.json, .github/workflows, src/storage.ts, src/StudyShared.tsx empty at review time. Main entry adds advanced route; existing chapter number paths retained.

## Limits
Final HEAD/tree, full E2E Chromium/WebKit, formal CI, actual artifact preservation/readback, final screenshots not yet available for independent acceptance. Real Gemini/Skills/schedules NOT_TESTED. Same candidate source transpiled by independent small driver; not a separate runtime/kernel. No implementation changes, external Gemini operation, scheduling, push, or merge performed by this reviewer.
Overall PARTIAL pending final evidence. No unresolved P2 in the reviewed static revision; cannot convert that statement into full product PASS.
