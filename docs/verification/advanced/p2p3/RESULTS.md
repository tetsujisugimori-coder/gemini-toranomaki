# P2/P3 correction candidate, 2026-11-16

Start HEAD 6ba7b902fa785bcce973fefc6c29979a86319201, tree 86f00af7f869d1302be3fd11d44b165426268f2f. Existing branch feat/advanced-recipes-wave1 / Draft PR28 / Issue27. No AGENTS.md or repository capacity document exists in this tree. Case-specific workspace, no old evidence deletion/move.

## Changes
P2-ADV-01: step navigation only updates step, preserving viewed. Explicit read self-report still sets viewed. No storage schema/key or migration; previously saved true values cannot be distinguished by origin and are not automatically cleared.
P3-ADV-02: instruct copying the displayed improvement prompt and editing it in Gemini. No new editor, persistence, or external action added.
Four new browser tests per engine cover direct steps 2/7, roundtrip/reload/recipe change, explicit read preservation/reset isolation, and improvement copy text. Existing 944 E2E definitions unchanged; expected total 952.

## Verification limits and evidence
Local type/lint/185 unit/build PASS. Existing bundle-size warning retained.
A narrow actual-handler probe extracts the original step body and executes it with mocked setters. At old source: false viewed targets 1/6 fail, true controls pass; P3 text assertion fails. Same five checks on candidate pass. This is NOT browser RED/GREEN. Initial probe had illegal-return fixture error, fixed before valid comparison; initial logs retained outside repo.
Local browser attempt could not reach assertions: default preview uv_interface_addresses failure; explicit loopback server works, but Chromium launch fails socket/ptrace even after approved escalation. WebKit and independent visual audit remain NOT_TESTED/BLOCKED. No false browser PASS. Desktop listed offline.

## CI impact review
Two workflows unchanged. ci.yml pull_request calls npm ci/typecheck/lint/unit/build and Chromium/WebKit E2E in one ubuntu job; no deployment. This is the existing CI explicitly requested by this task. pages.yml only push main or manual dispatch; no main push/dispatch performed. PR artifact upload condition is false on pull_request, so formal screenshots/trace unavailable unless separately provided; no workflow/lock/common checker edits.

## Acceptance
総合PARTIAL / merge NO/HOLD, Draft retained. P2/P3 are candidate fixes pending independent review and formal tests. Required visual audit and browser RED remain open; CI green alone does not close these. Real Gemini/Skills/schedule, iPhone Safari/VoiceOver/physical touch untested. Evidence preservation and independent retrieval reported separately after completion. No deployment/merge/Draft removal.
