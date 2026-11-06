# 第10章：設計・検証・独立レビューの証拠

Issue: [#25](https://github.com/tetsujisugimori-coder/gemini-toranomaki/issues/25)。基準main `3d4c7acde88ea1ebf2fff0d3009ad877d5a1bbd3`（PR #23マージ済み）。ブランチ `feat/chapter-10-capstone`。AGENTS.mdと追加ローカルskillsは配置なし。README/LOG/仕様/教材構成、章1〜9の実装・保存・共通copy・既存テスト・CI、PR #23とIssue #24を着手前に確認した。GitHubで章10の重複Issue/PRは見つからず、新Issueから開始。

## 設計と範囲

STEP0 環境、1 課題/完成条件、2 調査計画/予想/出典照合、3 資料比較/支持されない主張、4 制作指示と初版、5 10項目品質、6 問題/修正/退行/再検証、7 6軸の理由付き自己評価。歴史（架空の読書室）、教育（架空の発芽観察）、業務（架空の文具係）を固定データで通し操作する。全10章の完成はプロジェクト終了を意味しない。

PCでは課題と原文を隣接し、初版と修正版を比較。狭幅は縦積みと表示切替。段階ヒント、全文指示コピー、予想/結果、資料追加/除外、選択根拠の全文折返し、版別改善記録、再挑戦を提供。自由記述の目的追加と振り返りは非保存、固定採点の対象外。

固定課題の正答、操作した記録、外部操作の自己申告、自己評価、章完了の自己申告は独立。AIの成功宣言・きれいな表示は証拠にならない。操作可能形式では未回答/正答/誤答を実際に試し、初版→修正版1のボタン退行→再修正版を原文と同条件で検査する。情報不足・対象外は適合数に数えない。

[公式資料と条件・確認できた移動方法](official-sources.md)。[詳細仕様](../../specification.md#第10章総合演習issue-252026-11-06)。既存保存キー・形式を維持し、progress:v1はchapter-10の許可IDだけを追加。専用capstone:v1は固定ID/選択/履歴だけ。条件変更で現在確認を解除し過去履歴は残す。第10章だけの初期化と、全章の完了だけを消す全体初期化の意味を保護する。

## 自己検証

原ログを以下へ保存。最終HEAD・treeと終端CI URLは自己参照を避けDraft PR本文を正本にし、ローカルファイルhashをmanifestへ記録する。

| コマンド/観点 | 結果・証拠 |
| --- | --- |
| npm ci --cache /tmp/gemini-npm-cache | 成功 [npm-ci.txt](npm-ci.txt)、lockfile変更なし |
| npm run typecheck | 成功 [typecheck.txt.gz](typecheck.txt.gz) |
| npm run lint | 成功 [lint.txt.gz](lint.txt.gz) |
| npm test | 165 PASS（既存129＋新36） [unit.txt.gz](unit.txt.gz) |
| npm run build | 成功 [build.txt](build.txt)、既存500kB超bundle警告は継続 |
| 全既存＋新規E2E | 908 PASS（Chromium454＋WebKit454、失敗/skip0） [full-e2e.txt](full-e2e.txt) |
| git diff --check | 提出前に確認し [diff-check.txt](diff-check.txt) へ記録 |

新規E2Eは3テーマの全工程、初版/退行/再修正と3入力、原文/引用、不正根拠、条件変更、資料比較、段階ヒント、全文copy・失敗・古い成功/失敗×8変更、新pending保護、保存復元/拒否/破損/片側初期化失敗、他章キー・完了保全を含む。PC/320/375/390、ライト/ダーク、キーボード・遷移/初期化focus、root文字200%、reduced motion、全8工程のdocument overflowと操作欄の欠けを検査する。

既存824 E2Eは削除/skip/expected failure/期待緩和なし。旧「章10準備中」の6箇所は実装されたSTEP0の厳密な期待へ変更。他章保存破損の未対応IDはchapter-11へ変更し、章10の新しい正当な保存復元も単体とブラウザで追加。新規42ケース/engineで計908 E2Eを予定。

最初の新規Chromiumは36 PASS/1 FAIL [browser-first.txt.gz](browser-first.txt.gz)。自作テストが指示の目的要素を未選択のまま自由追加条件が全文に入ると仮定していた。目的要素の選択を補い、製品を変更せず訂正した。初回の全898 E2Eは896 PASS/2 FAIL [full-e2e-first.txt](full-e2e-first.txt)。両engineでapp.spec.tsの旧「章10準備中」期待が残っており、その1箇所も新STEP0の厳密な期待へ更新した。他の検査を削除・緩和していない。独立レビューの5指摘は後述。追加の自己点検で、選ばれていない完成条件を不足と評価しないこと、すべての版で未完成の指示要素を評価することを修正して反例単体を追加した。

## 実行環境

ホストDebian / Node24.19.0 / npm11.9.0。ローカル最初のChromiumは既設Playwrightブラウザを標準ホスト検証のまま使用。全回帰は公式 `mcr.microsoft.com/playwright:v1.64.1-noble`、digest `sha256:2f05f8a734509a7b3f26a912639488ee08f58a7b292d14d62271bcff9038768f` を非root（ホストと同じUID/GID）で使い、既存lockfile/node_modulesとproduction previewに対し実行。ブラウザwrapper/バイナリやTLS・CSP・XFO・ホスト検証を変更しない。CI・依存・lockfileは変更しない。

```sh
docker run --rm --user "$(id -u):$(id -g)" \
  --mount type=bind,src=/workspace/gemini-toranomaki,dst=/work -w /work \
  mcr.microsoft.com/playwright:v1.64.1-noble npm run test:e2e -- --workers=2
```

コピーは制御可能なPromiseを注入するAPIモック。OS実クリップボードの動作を示さない。追加の整形ツールPrettierは一時npm cache内だけで使用し、プロジェクト依存へ追加しない。

## 独立レビュー

別エージェント `independent_capstone` が製品・テストファイルを編集せず反例から確認。[原報告](independent/review.md)、[通し操作](independent/flow-results.json)、[コピー競合](independent/race-results.json)、[否定例](independent/negative-results.json)。歴史テーマSTEP0〜7、30品質項目、3版の未回答/誤答/正答、復元と再挑戦、コピーの旧結果と新pending、失敗/再試行、resetと他章保全をホストChromium＋開発サーバーで独立操作した。作者の全908 E2Eとは別集計であり、WebKit・全体スイート・CIを独立再実行した意味ではない。

指摘5件（比較後の判断で記録消失、未操作の最終達成、存在しない指示への違反を採点、再挑戦で初版証拠消失、320px選択根拠の全文切れ）は修正後に独立再確認。原スクリプトはbytesを維持し `.cjs.txt` で保存し、lintの製品コードへ混入させない。再実行時は/tmpへ.cjsとしてコピーし、既存Playwright/TypeScriptと4187の開発サーバーで実行する。追加変更後、完成条件8通り×3テーマ、指示要素16通り×3版を含む品質の独立行列1290確認、確認問題だけ/追加条件なしの2ブラウザ経路と既定STEP0〜7を再PASS。[条件行列](independent/condition-matrix-results.json)・[条件ブラウザ](independent/condition-browser-results.json)。最終4ファイルhashは [last-reviewed.sha256](independent/last-reviewed.sha256) と一致。最終HEADで同一性を再照合する。

## 代表画像（2枚）

[初版と修正版の比較・PC](comparison-desktop.png)はproduction previewの固定データを明示的にセットして撮影。テスト達成や実Google出力を示す画像ではない。[320px・200%の根拠全文](quality-mobile-200.png)は独立担当の実操作による撮影。両方を実装担当が開いて目視し、日付と断定の前後、比較カードの文字、狭幅で判定/根拠/改善案の全文折返しを確認した。独立担当も後者を目視確認した。重複する全画面画像はコミットしない。

## 安全課題・NOT_TESTED・次回

[npm audit全依存の原JSON](audit-all.json)はmoderate8/critical2、[productionのみ](audit-production.json)は0。これはIssue #24の追跡資料であり、今回修正していない。dev依存の危険性が残り、prod0から公開全体の安全を認定しない。機能実装のPASSと安全性判断を別にする。

NOT_TESTED: 実Googleログイン/Deep Research/Notebook/Canvas/個別権限/日本語実UI、実機iPhone Safari/Android、OS実クリップボード、実スクリーンリーダー、ブランドブラウザの分割UI、実端末性能、教育効果・長期定着、本番Pages。Playwright WebKitを実機Safariと呼ばない。自由記述条件の自動評価、実資料の取込、生成コード実行、Googleへの自動接続・送信、公開は範囲外。

次回候補: 自由な課題の根拠評価、学習者テスト、より多様な退行例、文字選択やスクリーンリーダーの実測、bundle分割。Googleの名称・条件は継続再確認する。Draft解除・マージ・自動マージ・本番公開は実行しない。


## 別の独立レビューによるP2追補（2026-11-06）

上記の898 E2E成功はP2追補前の候補であり、最終候補へ流用しない。[追補前898 PASS原票](full-e2e-pre-review.txt)。親側の別担当から以下の実行反例を受けた。

- 修正版1のボタン退行で解説が出ないのに、完成条件の品質2と指示遵守の品質6を適合にしていた。
- 有効なJSONでも `{achieved:[2,3,4,5,6,7],topic:"corrupt",created:"true"}` の6達成を残し、ロード成功と表示していた。実際のstageReadyは全false。

旧製品557f12eで新2単体を実行して2 FAIL/30 PASSを確認し、[RED原票](independent-red-unit.txt.gz)と[3判定/6達成/availableの生値](independent-red-counterexamples.json)を保存。同じ入力の[GREEN原票](independent-green-counterexamples.json)では品質2/6/8は全て要改善、達成0、available:false、保護:true、書込み0。再現driverは[counterexamples.mjs.txt](counterexamples.mjs.txt)。

画面と採点の共通正本artifactFeaturesを導入し、解説の利用可否から完成条件・指示・維持・動作の判定をそろえた。解説不足の根拠と改善案は同条件の操作・再検証に対応させる。明示的な旧「適合」回答は拒否し、再修正版では回復する。

sanitizeは固定ID/型だけでなく、現在のachievedをstageReadyで相関検証。未知の課題条件から既定テーマへ達成を移さず、明示的な過去履歴IDだけを保持する。供給値が正規化値と不一致、JSON破損、読出し不可の場合は保護モードへ入り、移動/条件変更/コピー/工程確認で元のrawを上書きしない。画面内の学習は続け、初期化キャンセル・削除拒否でも保護継続。第10章の確認付き初期化が成功してから保存を再開する。ロード時の自動上書きはない。

追加単体6件を含む165 PASS。[GREEN単体](independent-green-unit.txt.gz)。新5ブラウザケース/engineは採点の旧答拒否と回復、型/課題破損と相関破損、読める/書ける権限の非対称を確認する。最終全回帰908件と終端CIは最終提出時に固定する。独立レビューの追補報告とhashはindependent/の最終版を参照する。


P2追補の最終補強：破損した供給フィールドが課題以外（例mode:99）であっても保存済みの現在達成をすべて解除する。STEP0/1だけの達成も残さず、明示的な過去履歴IDとrawを保持する。単体1件・ブラウザ1件/engineを追加。候補9281516のsrc treeは `aad3fde4eabc1c93272be7b132246768bfffe1ce`。前候補075a2baの全回帰はこの補強で置き換えるため途中SIGTERMで中断し、[中断原ログ](full-e2e-p2-partial.txt)を保持する。成功扱いしない。最新srcと新テスト42件/engineに揃えて全908件を実行する。

最初の失敗ログbrowser-firstは末尾空白を含む原文bytesを変更せずgzip保存し、[raw-archive.json](raw-archive.json)に復元hashを記録した。git diff --checkやlintの設定は緩和しない。

最終ローカル検証：最新候補9281516のsrcを使い、全908 E2E（既存824＋新84、Chromium454＋WebKit454）が7.0分で一括PASS、失敗/skip/expected failureなし。型/lint/単体165/build/diff-checkもPASS。最終HEADのsrc tree同一性と終端CI URLはDraft PR本文へ記録する。

証拠をstageした際、npm/Vitestの原出力末尾の空行もgit diff --checkに検出された。[検出原票](evidence-diff-first.txt)。対象ログは末尾を削らずgzipへ保存し、復元hashをraw-archive.jsonへ記録。製品・検査設定は変更せず、再検査する。
