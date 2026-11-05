# Independent acceptance plan (prepared before fixes)

Reviewer is separate from implementation. No product/test changes by reviewer.
Baseline b2ddbce8206f7000a88937e19fa1eb288747b5e4, Issue #22 and review 5782027948.

Each engine: actual headless browser launch, rendered production build UI, independent Playwright driver.
- 1280px: all nine named steps, next/back keyboard activation, direct selection, heading focus, external stub popup and reload restored step/state.
- 320/375px × light/dark × text 200%: actual button keyboard activation; subject success, body pending (must not inherit success), body failure/manual selection/retry; ensure feedback near button in viewport, layout no horizontal scroll, 44px target, visible focus. Screenshots inspected separately.
- Independent delayed-result counterexample: begin subject, navigate away/back, complete newer body, then settle old subject success or failure; feedback and history must stay newer.
- 4C: independently fixed list of 12 names, card/approval exact correspondence, purpose required, stop instructions, separate approval and Calendar verification. Checkbox lost on step change/reload.
- Storage: seed v1 practice + old mock + chapter progress + other chapter sentinels; historical record/current pending coexist; retry preserves history; reset only practice. Storage denied/corrupt produce warning and do not persist content/credentials.
- Other chapter copy shared-hook smoke.

No Google login/real integration; popup stub explicitly not real integration. OS clipboard mocked; no OS clipboard, screen reader, real iPhone Safari/Android, learning-effect claim.

Browser preflight: Chromium 156.0.8078.4 standard launch+render PASS via existing /workspace/.cache/ms-playwright. WebKit initially STARTUP_BLOCKED (six missing OS libraries), not product FAIL. Do not bypass host checks.
