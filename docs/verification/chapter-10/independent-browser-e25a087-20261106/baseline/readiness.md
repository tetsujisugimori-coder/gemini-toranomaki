# Chapter 10 independent review readiness

Status: prepared; candidate SHA has not been received. No chapter 10 implementation verdict.

Historical preparation status above is superseded by the subsequently received
candidate `557f12e3c408a5735f9f0686f1e16361c6578c22`; see
`candidate-evidence-557f12e/review.md` for that SHA's independent review and findings.

Baseline: `tetsujisugimori-coder/gemini-toranomaki` main,
`3d4c7acde88ea1ebf2fff0d3009ad877d5a1bbd3`, verified with remote `ls-remote`,
cloned independently to `baseline/`. Initial checkout clean. Evidence is outside
the product checkout and does not overwrite existing repository evidence.
No applicable AGENTS.md or local .agents/skills entries were found; workspace
.agents is empty. Cloud environment runtime skill was read and applied.

## Completed preparation

- Read curriculum/specification, chapter 1–9 presentation and boundaries, routing,
  common completion/global reset, shared clipboard hook, chapter persistence and
  provenance contracts, representative asynchronous-copy/storage/reset tests,
  and CI workflow. Saved all tracked baseline file hashes.
- Browser route probe independently opened chapters 1–9 in each engine at 1280px,
  recorded current screen text/headings/focus/width in `baseline-browser.json`,
  and saw no page errors. This does not claim all activities in all chapters reviewed.
- Actual browser launches: Playwright 1.64.1, Chromium 156.0.8078.4 and WebKit 27.2.
- Both engines independently rendered chapter 9 at 320px/dark/root 32px (200%)/
  reduced motion: measured scrollWidth 320px, no page errors. Representative full
  PNG pixels inspected in both engines: text and controls visible without page
  overflow in captured states; select values can use native truncation. These are
  baseline images and are not candidate visual acceptance.
- `npm ci` succeeded using a writable task-local npm cache; the initial attempt
  failed because default `/home/agent/.npm/_cacache` was unavailable. Both logs kept.
- Typecheck, lint, production build, all 129 unit tests and diff-check succeeded.
  Build retains the existing >500kB bundle warning. E2E listing is 824 in 23 files,
  412 cases per engine. Full baseline E2E: 824 passed in 5.5 minutes, no failures/skips; Chromium 412 and WebKit 412. Raw list and JSON: `baseline-e2e.log`, `baseline-e2e.json`.
- Read Issue #25 and separate critical dependency Issue #24 via GitHub read-only CLI.
  No dependency/lockfile changes or security remediation attempted.
- Re-read primary Google Research/notebook/notebooks help. Saved response headers,
  raw HTML and extracted text under `official/`. Documented notebook sync does not
  prove automatic report/citation transfer or eligibility of an actual account.
  Existing official pages mix Gemini Notebook body text and NotebookLM help labels;
  the precise renaming date was not independently established from these pages.
- Detailed independent candidate plan is in `acceptance-plan.md`.

Primary pages read: [Gemini app notebooks](https://support.google.com/gemini/answer/16972047?hl=ja),
[Gemini Notebook](https://support.google.com/gemininotebook/answer/16164461?hl=ja),
[Deep Research](https://support.google.com/gemini/answer/15719111?hl=ja).

## Environment adaptations

WebKit's stock launch failed on missing libraries; packages were downloaded from
the signed Debian trixie archive and extracted under `webkit-deps/`. Extra transitives
were added after runtime checks. No host package installation or product edit.
The packaged WebKit wrapper overwrites LD_LIBRARY_PATH, so `webkit-launch.sh` sets
the same WebKit bundle paths plus the local dependency directory, then executes
the original MiniBrowser binary. `browser-probe-wrapper.log` confirms a real page
and WebKit 27.2. The independent full-suite configuration supplies that executable
path; product test files and product Playwright configuration remain untouched.
No host-validation skip is used in the successful wrapper probe or full E2E run.
Earlier diagnostic launch failures and the unsuccessful skip-validation attempt
remain in the raw probe logs. Chromium uses the installed Playwright browser cache.

## Baseline contracts for later regression review

Global reset removes chapter completion only. Chapter records, lab and exploration
remain. Individual chapter reset affects its own record and completion, with the
documented Research→Notebook provenance invalidation exception. Failed deletion
must not claim persistence success; temporary UI reset and old-record return differ.
Chapter 10 must add a separate fixed-data key and preserve old records, including
chapter 9's existing free-text storage; the new chapter's privacy requirement does
not authorize erasing or migrating older chapter records. Fixed-data achievement,
UI activity, actual-service self-report, self-evaluation and chapter completion
are separate kinds of evidence.

## CI and blockers

Baseline CI metadata: [run 42131153943](https://github.com/tetsujisugimori-coder/gemini-toranomaki/actions/runs/42131153943)
reports success for the exact baseline SHA; validation job steps include unit,
build and E2E success (`main-ci-details.json`). This is metadata, not a raw-log count.

DENIED: read-only download of validation job `127607800694` raw log via GitHub API,
redirecting to `productionresultssa16.blob.core.windows.net` → HTTP `Forbidden`.
No remote mutation could have executed. `main-ci-log-fetch.stderr` preserves the
error with expiring signed-query parameters redacted. Checked room history after
denial; no materially new relevant authorization. No retry or alternate route.
This is a remote log-access denial, not an automatic approval-review rejection.
Baseline raw CI comparison remains blocked. Local independent raw logs are available.

PENDING: supplied fixed candidate branch/full SHA; candidate implementation acceptance,
candidate final CI comparison, P1/P2/P3 findings and any fix verification.

NOT_TESTED: real Google, real Safari/iPhone, Android device, screen reader, physical
clipboard, actual account eligibility/document transfer and educational efficacy.
No merge, publication, Draft changes, external messages, repository commits/pushes,
product code changes or product test changes were performed.
