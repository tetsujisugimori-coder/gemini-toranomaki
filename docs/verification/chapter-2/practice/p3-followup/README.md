# PR #23 P3追補・独立ブラウザ再受入

対象: Issue #22 / Draft PR #23。修正前HEAD `b2ddbce8206f7000a88937e19fa1eb288747b5e4`。製品修正HEAD `7320881a1de8591986f6377e5653deafad34fb83`。

開始時のremote HEAD・PR本文・レビュー5782027948・差分・既存試験・旧CI run41385286997(success)を再取得。既存Issue/PR/ブランチを更新し、Draftを維持する。merge/auto-merge/本番公開はしない。

## 修正契約

- P3-01: STEP1件名/本文の各ボタン直下に、あらかじめ空でマウントした `role=status` / `aria-atomic=true`。対象別の成功/失敗、手動コピー案内、コピーは送信/実行ではない旨を表示。新しい要求を開始すると古い通知を消す。pending中を成功としない。旧結果はmounted/version/hash/matches条件を満たさなければ状態/履歴/通知/busyを変更しない。
- `useStudyCopy.copy` の第4引数は省略可能な成功/失敗文言。既存呼出しと文言は互換。新要求開始時の通知クリア以外、排他/失効の仕組みは維持。OS書込み自体を取り消せる保証は追加しない。
- P3-02: 実践用の登録前指示だけを訂正。12必須項目の確認カード、原文との照合、一時的な自己申告、Gemini側の別メッセージ最終承認、Calendarでの独立確認を区別。模擬指示・12項目の定義・目的必須・停止条件は維持。Googleが必ず従うとは説明しない。
- services-practice:v1、旧模擬・章完了・他章のキー/形式/初期化範囲は変更しない。旧記録を実操作完了へ昇格しない。個人情報/認証情報の入力・保存は追加しない。

## RED→GREEN（実装者の自己検証）

|工程|結果|原ログ|
|---|---|---|
|旧製品＋新単体|128 PASS / 新1 FAIL（旧7項目の混在）|[red-unit.txt](red-unit.txt)|
|旧build＋新Chromium320/375px|新2 FAIL（ボタン直下の対象別statusなし）|[red-browser.txt](red-browser.txt)|
|修正後単体|129 PASS|[green-unit.txt](green-unit.txt)|
|修正後重点両engine|4 PASS|[green-targeted.txt](green-targeted.txt)|

新規E2Eは対象別成功/失敗、pendingで前の成功を消去、再試行、工程失効、古い失敗が新しい成功へ遅延到着する反例を含む。従来の古い成功/失敗4経路も保持。既存試験削除・skip・retry・timeout延長なし。既存1単体の旧文言期待は新仕様の厳密な文言期待へ置換し、件数を減らしていない。

検索したREADME・仕様・製品画面には旧7項目説明なし。古いRED原証拠は改変せず維持し、負の単体期待にも旧語句を残す。過去の模擬教材の仕様を実践仕様へ書き換えない。

## 環境と再実行

ホストDebian13.6 / Node24.19.0 / npm11.9.0、既設lockfile依存。ホストChromium起動成功、WebKitは6ライブラリ不足でSTARTUP_BLOCKED（製品試験FAILと区別）。通常の公式Playwrightコンテナ `mcr.microsoft.com/playwright:v1.64.1-noble` digest `sha256:2f05f8a734509a7b3f26a912639488ee08f58a7b292d14d62271bcff9038768f` を非root(1000:1000)で使用。Node26.13.0 / Chromium156.0.8078.80 / WebKit27.2。標準ホスト検査を有効のまま起動。TLS/CSP/XFO/認証・ブラウザwrapper・バイナリは変更しない。依存とCIの定義は変更しない。

```sh
npm ci --cache /tmp/gemini-npm-cache
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install --with-deps chromium webkit
npm run test:e2e
git diff --check
```

全E2Eはproduction preview4173、独立担当は別preview4185と独立driverを使用。UIへ実際にクリック/キー入力し、clipboard APIは制御可能なfakeを注入。外部タブは安全なHTML stubであり、Google連携の成功とはしない。

## 結果・独立レビュー

型検査・ESLint・単体129件・production build・git diff --check成功。全824 E2Eが5.2分で一括成功（Chromium412＋WebKit412、既存820＋新4、失敗/skip/expected failureなし）。[全E2E原ログ](full-e2e.txt)と[buildログ](green-build.txt)を保持。全章の既存回帰を再実行し、旧P2-A/P2-B/P3の退行は検出しなかった。既存の失効、保存拒否/破損、旧記録非昇格・他章非破壊を含む。

別子エージェントによる[独立原報告](independent/independent-review.md)はPASS、限定推奨YES（最終製品同一性と終端CI成功を条件）。[独立操作結果](independent/output/results.json)は24/24 grouped PASS、追加10組PASS、実pointer手動選択は両engine PASS。これは824 E2Eと別集計。独立担当が独自固定12項目期待と遅延コピー反例を使い、PC全9工程・320/375px両テーマ200%・外部stub復帰/reload・承認失効・保存互換を操作し、代表10画像を自分で目視。実装者も代表2画像を別途目視した。

独立ドライバ初回は20組中10PASS/10FAIL。初期同値選択、native disabled buttonのfocus、React初期化前hash操作という検査側の誤仮定を診断し、製品を変更せず正しい実操作へ訂正した。初回の[原ログ](independent/run-1.log)と画像/結果は保持。製品REDや製品FAILとして混同しない。訂正後driver/追加pointer操作の原コードも保存した。未解決の新P1/P2/P3なし。

製品修正HEADのsrc subtreeは `8bb4bb1a14ba98d80a20f0ee9d819071cc2f30d3`、testsは `884d4ebeaaebf131a509e1d28289aed0a6aa7db7`。以後の追補は証拠/文書のみ。最終HEADで独立担当がこれらの同一性を再評価する。証拠hashは[自己検証manifest](manifest.json)・[独立担当manifest](independent/manifest.json)。最終HEAD/tree/終端CI URLはコミット自己参照を避け、PR #23の最終本文と結果投稿を正本にする。旧HEADのCI成功を最終HEADへ流用しない。

代表画像: [320px dark 本文失敗](independent/output/chromium-320-dark-200-body-failure.png)、[375px light 件名成功](independent/output/webkit-375-light-200-subject-success.png)、[12項目カード](independent/output/chromium-1280-twelve-fields-card.png)、[12項目別承認](independent/output/webkit-1280-twelve-fields-approval.png)。長い失敗文末は縦スクロールで読み、横欠けはない。

## NOT_TESTED / 保証外

実Googleのメール送信・検索・予定作成・実登録、実機iPhone Safari/Android、製品Chrome/Edge分割UI、実OSクリップボード、実スクリーンリーダー、組織設定、学習効果。role=statusのDOM/視覚確認は読み上げ実測ではない。Google側のプロンプト遵守は教材から保証しない。Playwright WebKitは実機Safariではない。既存の500kB超Vite bundle警告は継続。
