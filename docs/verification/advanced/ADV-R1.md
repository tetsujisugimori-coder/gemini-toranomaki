# ADV-R1 independent acceptance audit (2026-11-17 UTC)

## A. Decision
Overall PARTIAL; merge recommendation NO. Draft remains. P2-ADV-01 LIMITED CLOSED for the handler correction and existing formal regression only; full browser RED/GREEN closure remains OPEN. P3-ADV-02 CLOSED for wording/code and existing formal copy test, not a new visual observation. Independent visual audit BLOCKED. No new product defect established in this narrow audit.

## B. Fixed versions and independence
Starting/substantive implementation HEAD: 340126205d80255ffbf35068fb134ea381e008b0; tree: 682bad4abf316feb4e4e21a93772742d7f903e74.
Old HEAD: 6ba7b902fa785bcce973fefc6c29979a86319201; tree: 86f00af7f869d1302be3fd11d44b165426268f2f.
New fresh clone and detached old worktree were used. This audit worker did not implement the P2/P3 correction; both workers belong to the same assistant, not an external human auditor. No AGENTS.md or dedicated capacity-policy file exists in the fixed repository tree. Owner restrictions apply.
This documentation commit is a different HEAD: old CI evidence below belongs to its stated source, not automatically this later commit.

## C. Actual environment and scope
Linux cloud workspace, Node and an already-installed Playwright runtime. Before acquisition, writable overlay had 55,709,245,440 bytes free and 4,137,917 free inodes; directories are separation, not physical quotas. Budget: under 100 MB for clone/log/new audit records; no bulk image/trace generation.
A real launch probe at 2026-11-17T18:55:56Z failed before any page or assertion: Chromium socket() Operation not permitted, SIGABRT. WebKit executable absent. This is environment BLOCKED, not product RED/FAIL. Connected-environment inventory showed the Windows desktop offline. No elevation, installation, repair, workflow change or repeated browser launches were attempted.
No new screenshot or trace was obtained. No human visual inspection, AI image inspection, old-version browser RED, or new browser GREEN is claimed.

## D. P2 comparison
Freshly extracted actual step handler executed with mocked setters, identical four inputs in each version:
| Input | Old actual viewed | New actual viewed | Expected |
|---|---|---|---|
| false; step 2 | true (RED) | false (GREEN) | false |
| false; step 7 | true (RED) | false (GREEN) | false |
| true; step 2 | true PASS | true PASS | true |
| true; step 7 | true PASS | true PASS | true |
This is a narrow new nonbrowser execution, not storage, React rendering, reload, navigation or full A1-A7 proof. Existing true records are not invalidated; their historical origin cannot be inferred.
A1/A2 browser observations BLOCKED; A3 roundtrip/reload, A4 recipe switching, A5 explicit read, A6 recipe reset, A7 other recipe/basic records protection were NOT_TESTED in this audit because browser startup failed. Existing tests advanced-records.spec.ts cover these behaviors, but source review and historical CI cannot substitute for this requested old/new browser comparison.

## E. Visual audit selection and limits
Planned representative coverage: A at 320 light and 1280 dark (long material/PDF/copy); B at 375 dark (reset/focus); C at 390 light with computed 200% text (table/overflow); D/E/F at 375/390/1280 across themes (entry, steps, comparison/back). Both engines; Tab/Shift+Tab/Enter/Space; copy rejection, corrupt/refused storage recovery and isolation. Selection concentrates narrow layout and failure boundaries rather than full cartesian screenshots. ALL remained NOT_TESTED/BLOCKED. Font setting alone would not count as measured 200%.
P3 source explicitly says copy and edit in Gemini, without editing/persisting the prompt in this app. Copy receives the same text rendered in the prompt. This does not claim actual Gemini interaction.

## F. Formal CI and evidence path
[Existing CI run 43848921205](https://github.com/tetsujisugimori-coder/gemini-toranomaki/actions/runs/43848921205), job 133236121692 was independently reread: success; typecheck/lint, 185 unit, build and 952 E2E (476 per engine) recorded. Not newly rerun here. Checkout log names PR merge a75a0c1302f5e6a7b6a7bab89c2dfe1df57c1418, not the PR head; do not conflate their SHAs.
Artifact API returned zero. upload-artifact step is SKIPPED because ci.yml requires main ref and non-pull_request event. The only uploaded path is dist, not screenshots/traces. Decoded job logs support test outcomes and checkout, not visual appearance or raw artifact equivalence.
ci.yml pull_request / workflow_call runs existing checks and both engines. pages.yml push is main-only, with manual dispatch unchanged. This documentation update will trigger authorized existing PR CI; no manual dispatch/retry/deployment. Results will be reported on PR after completion, without an extra result-only push.
No workflow/lock/dependency/common checker or product changes. A future evidence-workflow proposal needs separate approval, including failure-time screenshot/trace collection, retention/access/cost and event conditions. No such change was applied.

## G. Evidence and acceptance boundaries
New metadata, decoded log, handler source/results and launch failure observation are distinct from historical screenshots/artifacts and previous evidence bundles. New private evidence preservation and separate-worker readback will be reported on PR after actual completion; this document does not predeclare PASS. Storage future retention/access guarantees UNKNOWN.
Real Gemini, Skills/scheduling, real-device Safari, VoiceOver and physical touch NOT_TESTED and separate future service/device validation; the current blocking acceptance items are requested old/new browser comparison and independent visual audit.
CI PASS is limited to the recorded run. P2 full closure and visual gate remain unmet, so overall PARTIAL and merge NO regardless of new documentation CI success.

## H. Next minimum step
Use an already-authorized environment with working Chromium and WebKit to execute the fixed A1-A7 old/new pair and representative visual plan. Preserve version-bound original images/traces and have a different worker retrieve their stored bytes. No need to repeat historical network/service experiments or change acceptance predicates. If only historical handler/E2E evidence remains available, owner must separately judge a limited acceptance alternative; this audit does not automatically adopt it.

## References
- [Issue 27](https://github.com/tetsujisugimori-coder/gemini-toranomaki/issues/27)
- [Review 5935692707](https://github.com/tetsujisugimori-coder/gemini-toranomaki/pull/28#pullrequestreview-5935692707)
- [Previous correction report](https://github.com/tetsujisugimori-coder/gemini-toranomaki/pull/28#issuecomment-6914257904)
- [Fixed source](https://github.com/tetsujisugimori-coder/gemini-toranomaki/blob/340126205d80255ffbf35068fb134ea381e008b0/src/Advanced.tsx)
