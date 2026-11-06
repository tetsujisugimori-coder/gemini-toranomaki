# Independent chapter 10 review (2026-11-06)

Reviewer: independent_capstone child; implementation and product/test files were not edited by this reviewer. The implementation was changing during review. This report describes a bounded review, not final-HEAD acceptance or a second execution of the full existing suite.

## Scope and independent checks

- Read Capstone.tsx, capstone-engine.ts, capstone-storage.ts, capstone-data.ts, shared useStudyCopy and integration changes.
- Independent model scripts transpile read-only source snapshots with the existing TypeScript dependency to /tmp. No dependency changes.
- Browser: host /usr/bin/chromium headless, Vite development server at port 4187, private test browser contexts, synthetic fixed data. Not official branded Chrome, WebKit, real Google, OS clipboard or real device/assistive technology testing.
- Historical theme end-to-end: all STEP0–7, all 30 per-version quality decisions using independent expected arrays, actual unanswered/wrong/correct operations for each version, initial/revised regression/final behavior, all eight current confirmations, reload restoration and retry6 retaining prior checks. PASS (flow-results.json).
- Deferred clipboard counterexamples: old successful request cannot settle a new pending request; current rejection never records success; retry succeeds with full prompt; condition edit invalidates old rejection; chapter reset while copy pending cannot resurrect data and preserves other chapter key/completion. PASS (race-results.json).
- Semantic negative checks with otherwise complete prerequisites: no operations => stage5 and6 false; only initial operated => stage5 true,6 false; all three operated and correctly grounded => stage6 true; 30 alternative non-evidence choices rejected; retry6 preserves initial verification. PASS (negative-results.json).
- Mobile page-width measurements: 375px and 320px with root text200% => document.scrollWidth equals viewport. PASS for measured pages, not every state.

## Findings and rechecks

1. P2: Notebook judgment cleared the already-recorded source comparison. Author changed the judgment handler to preserve compared. Rechecked with actual browser operations comparison→judgment→confirm: PASS.
2. P2: Operational quality could be accepted as information-insufficient without actual input trials while the capstone stage could be treated as complete. Author added actual per-version three-input trial prerequisites to stage5/6. Independent negative models and actual browser trials rechecked: PASS.
3. P2: Initial output was graded against a source-verification instruction that might never have been selected. Author made evidence wording depend on prompt selection. Browser and model rechecked with empty prompt: PASS.
4. P2: retry6 cleared initial trials while preserving initial quality, invalidating the previous stage. Author preserved initial trials. Independent model and actual browser retry rechecked: PASS.
5. P2: at 320px, selected quality evidence appeared only inside a single-line native select and was visibly truncated. Author added .cap-selection wrapping text paragraphs outside each label. Rechecked at 320px/root text200%: full selected verdict, evidence and improvement are visible by scrolling; each paragraph scrollWidth equals clientWidth (224px). The corrected image evidence-row-320-200.png was opened and visually inspected. PASS.

## Evidence caveats

The first browser driver used getByLabel(...exact:true) for wrapping labels, which did not match because the label DOM text includes option text. ariaSnapshot confirmed the combobox name is correct. The independent driver was corrected to getByRole('combobox', {name,exact:true}); this is a driver-selector failure, not a product failure. The model probe directly calling invalidateFrom(3) still returns compared:false by design; the fixed UI passes the preserved flag, which actual browser testing confirmed.

Screenshots mobile-initial.png/mobile-320-200.png/evidence-320.png were opened and visually inspected by this reviewer. Large full-page snapshots are temporary review evidence, not a request to commit duplicates.

No GitHub mutation, merge, publish, dependency update or product edit was performed by this reviewer. Raw cjs scripts should be archived as .cjs.txt if committed to avoid being treated as production lint inputs.

## Current verdict

PASS within the independent scope above, with no remaining P1/P2/P3 finding identified in the reviewed paths. This is conditional on product-source equivalence and successful final-HEAD CI/full regression results supplied by the implementer. It is not approval to merge/publish and does not resolve dependency security Issue #24.

All five findings were rechecked after their respective fixes. The complete flow/race browser runs preceded the final presentation-only selected-text paragraph change; the targeted selected-text/negative-model checks followed that change. No claim is made that the reviewer reran the full flow after the presentation-only change. Source fingerprints in last-reviewed.sha256 identify the final read/recheck candidate.

## Follow-up: completion-condition and prompt counterexamples

The author adjusted three condition-sensitive judgments after self-review. The independent reviewer re-read the changed engine and ran a separate expectation matrix:

- Quality2: all eight completion-condition subsets across all three themes (24 checks). Only source/limit conditions missing from the initial output count as deficiencies. Quiz-only/no-extra-condition no longer claims absent explanation when the initial quiz actually supplies it.
- Quality6: all16 prompt-element subsets ×3 versions ×3 themes ×8 completion-condition subsets (1152 checks). Any incomplete creation instruction remains needs-improvement for initial/repair/final. With full instructions, the initial deliberate violation remains needs-improvement and later versions fit.
- Quality10: all eight condition subsets across three themes (24 checks). When the limit condition is unselected, the initial evidence explicitly says the explanation is absent from the artifact but can be given from original sources.
- Default verdict/improvement arrays independently hard-coded for3 versions ×10 criteria ×3 themes remain unchanged (90 checks).
- Additional real Chromium interaction, quiz-only and no-extra-condition paths: initial correct-answer explanation actually displays; Quality2 fit, Quality10 original-source wording and incomplete-instruction Quality6 on all3 versions each accept the intended grounded decisions. PASS.
- Re-ran the independent default history STEP0–7 full flow after these semantic changes: all8 confirmations, actual per-version trial inputs,30 judgments, reload restoration and retry6 passed again.

Raw scripts/results: condition-matrix.cjs / condition-matrix-results.json, condition-browser.cjs / condition-browser-results.json, flow.cjs / flow-results.json. Matrix counts are individual assertions, not Vitest or E2E test counts; do not add them to the repository's automated-suite counts.

## Final source fingerprint after formatting

After the author completed formatting of new files, the independent reviewer reran the condition matrix, negative models, two condition-sensitive browser paths, and the default8-step browser flow. All passed again. Final browser logs: condition-browser-final.log and flow-final.log. The4 product files were then checked with sha256sum -c last-reviewed.sha256, all OK. package.json/package-lock.json have no working-tree changes.

Final independent-reviewed SHA256:

- Capstone.tsx: a3a0827f4810844e43557c120c37f5ae6c8e718c53d485a4f853dba6289e9505
- capstone-data.ts: 26463d467827e8e297683036790874a9d36fd2bdd3925e36c02d54f6220c2c9c
- capstone-engine.ts: 20c4f9b8cd1365b32cfe4ca7b4d50f696a9a3ea21cbacbf10f356d0343fd3265
- capstone-storage.ts: 3ff45e3fdc3876824aa46fc032ef85303e7f99618c3da98944e81f0f64cd4ace

This final section supersedes the earlier chronological scope note saying the full flow had not been rerun after the selected-text presentation change. It has now been rerun after both the semantic correction and formatting. The independent clipboard race run remains the earlier run; the later changes touched condition-sensitive grading and formatting, not clipboard lifecycle. Final Git commit/remote equivalence and final-HEAD CI still require implementer verification.

## Final follow-up: broken explanations and protected recovery

A separate reviewer found two further P2 cases after the preceding review. This section supersedes the earlier fixed-rubric expectations and final source fingerprints. The product author corrected the renderer/rubric feature model and added correlated restoration with preservation of invalid persisted bytes.

The independent reviewer re-read the changed implementation and independently confirmed:

1. Broken repair explanation: the default repair version now requires improvement and operational retest (improvement3) for Quality2,6,8. Prior fit answers for Quality2/6 are rejected. A new independent expectation array—not the implementation's rubric generator—was used for the full default browser flow: initial verdicts [0,1,1,1,1,1,2,0,0,1], repair [0,1,0,0,0,1,1,1,0,0], final all0; repair improvements [0,3,0,0,0,3,4,3,0,0]. All8 stages,30 decisions,actual per-version three-input behavior, reload restoration and retry6 passed (flow-rubric-v2.cjs / flow-rubric-v2-results.json).
2. Corrupt restoration: unknown topic, string created, contradictory achieved, and stale formerly accepted rubric choices now yield available:false/protected:true; current achieved is correlated against actual readiness and historical IDs remain historical. Raw persisted bytes are unchanged by load. A legitimate complete record restores with available:true/protected:false and retry6 preserves initial trials and prior confirmations (followup-storage-rubric.cjs / followup-storage-rubric-results.json).
3. Actual Chromium protected-recovery UI: navigation, environment/mode changes, copy success, attempted stage confirmation and reload all preserve the exact corrupt raw string. Reset cancellation and an injected removeItem rejection keep preservation active, including subsequent copy success. Successful explicit scoped reset removes the raw value; only then do further UI choices save valid records again. Other chapter key and chapter1/9 completions remain intact (protected-browser.cjs / protected-browser-results.json). The clipboard is synthetic and storage deletion denial is injected.
4. Independent feature/condition matrix:3 topics ×8 requirement subsets ×3 artifact formats ×16 instruction subsets ×3 versions =3456 combinations, checking Quality2,6,7,8,10 against independently derived expected behavior. All passed (final-feature-matrix.cjs / final-feature-matrix-results.json). These are matrix combinations, not repository E2E/unit counts.

Current independent scope remains PASS with no remaining P1/P2/P3 finding identified in the paths reviewed. Product source was not edited by the reviewer. Final commit/remote identity and final-HEAD CI are still implementer responsibilities; Issue24 and NOT_TESTED limitations remain unchanged.

Current reviewed SHA256 (also last-reviewed.sha256):

- Capstone.tsx: 1242ad6fd60dc07ac70c3df676ea8be971c0ebb781cd42aa38945e57c03d6c13
- capstone-data.ts: 26463d467827e8e297683036790874a9d36fd2bdd3925e36c02d54f6220c2c9c
- capstone-engine.ts: f7cdd01a2f6a9f00992440e87734ee0188e76efa13df17312581902a2d578565
- capstone-storage.ts: 5df862d48d178875d7412c73d7404dd3aa8c4118e5253694f14efeb782d180fd

## Final small restoration correction: 9281516

Candidate9281516d56c3babab126114f451b7aa58a089f0b adds only load-time clearing of all current confirmations when any supplied field is invalid. The independent reviewer confirmed the exact counterexample `{...freshCapstone(), mode:99, achieved:[0,1], history:['history:0']}` now restores with available:false/protected:true, no current achievements, historical history:0 retained, and persisted raw bytes unchanged. A mode:1 control restores the legitimate STEP0/1 achievements with available:true/protected:false. PASS (invalid-mode.cjs / invalid-mode-results.json).

The independent reviewer also repeated the protected Chromium UI checks using that exact invalid-mode fixture: alert/current0, navigation/mode/environment edits, copy success, attempted confirmation and reload do not overwrite it; reset cancellation and injected deletion refusal keep protection; successful explicit scoped reset permits new valid saves and keeps other chapter data/completions. PASS (protected-mode-browser.cjs / protected-mode-browser-results.json). The legitimate complete-record restore/retry model and broken-explanation rubric checks were rerun and passed again.

The renderer, data and engine fingerprints are unchanged from the preceding section. The current storage SHA256 supersedes the preceding fingerprint:

- capstone-storage.ts: f774b434e17f7d904373312ef69184cc6a151ce798004ea03c6350548c767310

last-reviewed.sha256 now contains all4 current fingerprints. Current reviewed Git HEAD:9281516d56c3babab126114f451b7aa58a089f0b. Independent scope remains PASS; final full regression/CI and remote identity remain outside this review's executed scope.
