# PR #23 独立コード・ブラウザ再受入

独立担当: `/root/independent_acceptance`（製品実装担当とは別）。2026-11-05 UTC。
固定製品HEAD: `7320881a1de8591986f6377e5653deafad34fb83`。
Issue #22 とレビュー5782027948をGitHubから直接読取り、製品コードと差分を確認した。実装担当の試験成功報告だけを根拠にしていない。製品・既存テスト・依存・gitへの変更は行っていない。

## 判定

**今回のP3-01/P3-02と指定ブラウザ再受入: PASS。新規P1/P2/P3の確定指摘なし。限定マージ推奨: YES条件付き（最終提出HEADが本製品コードと同一で、最終CI全成功を別途確認すること）。**
実装全体やGoogle側遵守、実機・支援技術への包括的保証ではない。Draft解除・マージ・公開は実施していない。最終HEADの書換えがあれば適用確認が必要。

## 独立した操作・反例

既存E2Eファイルを呼び出さず、独自ドライバ `acceptance-2.cjs` と `supplement.cjs` / `pointer-selection.cjs` を作成し、production preview4185を実際に操作した。Playwright公式image `mcr.microsoft.com/playwright:v1.64.1-noble`（親提示digest `sha256:2f05f8a734509a7b3f26a912639488ee08f58a7b292d14d62271bcff9038768f`）、非root1000:1000。Chromium156.0.8078.80 / WebKit27.2の通常起動・描画を独立確認。ホスト検査/TLS/CSP等の回避なし。共有production distのパス＋内容連結SHA256は `b2f1191e57edd0944f99d3ddd9ad978449871d35056b61fa0293748df715e06c`（アルゴリズム: 相対パス順にpath UTF8 + bytesを連結）。

- 両engineでPC1280pxの全9工程を直接選択、前後移動をEnter/Spaceで実行し、工程変更後の見出しfocus/viewportを確認。
- 外部Geminiリンクを別タブのローカル応答stubへ開き、戻り・reload後の工程4Aと自己申告状態保持を確認。Google連携成功とは扱わない。
- 320/375px × light/dark × root文字200%（body32px）で、件名成功、本文pending、本文失敗/手動代替/再試行、件名失敗（成功履歴0）、共有busy、44px以上の操作域、横超過0、ボタンの可視focusを確認。dataset.themeおよび実computed前景/背景を照合し、テーマ想定だけで判定していない。
- **独立反例:** 件名成功後の本文pendingを本文成功と表示しない。未完了の旧件名要求中に工程変更→復帰→新本文成功→旧件名の成功/失敗到着、の両分岐で新しい本文通知を上書きしない。工程変更後の旧通知なし。
- 件名/本文の成功・失敗通知を各ボタン直下のstatusで実確認。通知の主要文言は狭幅でも表示され、長い失敗文末は縦スクロールで読める。横方向の切欠けなし。aria-atomic付きの既存live status構造をコードで確認（実読み上げは未検証）。
- 手動代替はpreの全内容選択を検証したほか、追加で**実pointer triple-click**により本文内の架空メール第一段落が選択できることを両engineで確認。OSクリップボードは未使用。
- 4Cのカードと別承認ひな形の項目を製品の配列をimportせず独立した固定12項目期待値と照合。目的・予定の説明必須、未記入・対象不明・矛盾・重複停止、一時チェック≠承認、別メッセージ、変更/reloadでチェック失効、Calendar実在確認が4Dの別工程、を確認。
- v1実践記録で過去performed/verified/copiedと現在status=利用不可の並存、再挑戦で過去保持、確認付き初期化で旧模擬・章完了・他章sentinelをbyte不変、を操作確認。別contextで**旧模擬＋章完了だけ**をseedし、実操作/実結果チェックに昇格せず実践キーへ自動書込みしないことも確認。
- 破損保存の通知とload時原文不変、保存拒否通知と画面内継続を確認。表示欄に個人メール本文/認証情報の入力・保存を新設していない。
- 他章（第3章）の共通copy成功と汎用通知を独立操作確認。

`output/results.json`: **24/24 grouped checks PASS**。`output/supplement.json`: 10追加組（8狭幅theme/failure＋2旧記録/画面）PASS。`output/pointer-selection.json`: 両engine PASS。これは既存正式E2E件数とは別集計。

## 実際に目視した代表PNG

独立担当がview_imageで開いて目視した:
- chromium-320-dark-200-body-failure.png: ボタン直下に本文失敗・手動選択案内。幅320内で改行。長い文末は画面下へ続くが遮蔽/横欠けなし。
- webkit-375-light-200-body-success.png: 本文成功と非送信説明を近接表示。
- chromium-320-light-200-button-focus.png: 44px超のボタンとオレンジfocus outline。
- webkit-375-dark-200-subject-success.png: 件名成功と非送信説明、ダーク配色。
- webkit-320-dark-200-subject-failure.png: 件名を特定した失敗と手動選択案内。
- chromium-375-light-200-manual-selection.png / webkit-375-pointer-manual-selection.png: 本文を選択可能、長い日本語の折返し。
- chromium-1280-twelve-fields-card.png / webkit-1280-twelve-fields-approval.png: 両方同じ12項目、目的必須・別承認・停止・実登録確認の文言。
- webkit-1280-heading-focus.png: 4C見出しfocus枠と工程説明。

## 初回ドライバ失敗を隠さない

`run-1.log` と `first-run-output/results.json` / 初回PNGを保持。初回は20 grouped records中PASS10/FAIL10だった。原因は独立ドライバの次の誤った前提:
1. 初期表示で既に選ばれているSTEP0を再選択してもonChangeされないのに、工程変更後の見出しfocusを期待した。修正版は実際に1→0へ移動してから検証する。
2. 非同期copy中にbuttonがdisabledとなるためnative focusがblurするのに、完了後も同じbuttonへ自動復帰すると仮定した。この挙動は既存実装から同じ。独立の追加操作で、完了後Tabが次の本文preへ進み、ページ先頭へ戻らないことを確認した。修正版は有効buttonをfocusし可視outline→keyboard起動→通知→Tab継続を操作する。
3. 初回WebKitの他章smokeはReact初期effectを待たず同一文書hashをprogrammatically変更し、章更新イベントを取りこぼした。修正版は章2のrenderを確認してから実際の第3章ナビリンクをclickする。
いずれも製品の変更・期待条件緩和・試験skipでは解決していない。これらを製品のRED→GREENや製品失敗として計上しない。製品P3のRED→GREEN証拠は実装担当の別原ログであり、本独立担当の再現と混同しない。

## コード所見と境界

useStudyCopyのmessages引数は省略可能で、既存呼出しに汎用文言を保持。開始時messageクリアが旧successのpending混入を防ぎ、mounted/version/hash/matchesのガードとbusyを保つ。章2は件名/本文の各pre/button直下に空statusを先に設置し、active targetにのみ結果を描画する。外部送信しない文言を保持。実践promptの旧7項目文言は修正され、模擬生成/12項目定義/保存形式は不変。README・現行仕様・srcを検索し、旧方式の現行説明は検出しなかった（不在を検査するテストの文字列は除外）。

今回の差分は保存形式・旧記録・他章を壊す処理を追加していない。新規P1/P2なし。通知/承認の旧問題の回帰なしをこの操作範囲で支持する。全自動試験と最終CIは実装担当が別途原ログ・HEAD対応を確認する必要がある。

NOT_TESTED: 実Googleメール送信/検索/予定作成/実登録、Geminiの遵守、実機iPhone Safari/Android、実OSクリップボード、実スクリーンリーダー、組織設定、学習効果。WebKit自動ブラウザを実機Safariとは扱わない。
