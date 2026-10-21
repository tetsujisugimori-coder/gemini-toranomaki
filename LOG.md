# 実装履歴

## 2026-10-22 — v0.1 / Issue #1

- GitHubのIssue本文を取得し、更新後の章番号・章題・実践課題を確認。既存main（e6b1ca7）から `feat/gemini-guide-v0-1` を作成。既存はREADMEのみで、破棄する実装はなかった。
- 変更理由：当初の10章構成を保持するため、Deep Research先行方針を撤回し、第1章「Geminiの画面とモデル選択」だけを完成。Deep Researchは第3章、準備中。
- React / TypeScript / Vite、全10章、機能概要、公式リンク、第1章の6手順、プロンプト全文表示・コピー、理解チェック、完了チェック、進捗保存・復元・初期化、保存拒否時の画面内継続、ライト／ダークを実装。
- 教材データとUIを分離。hash遷移でPagesのサブパス・再読み込みに対応。PR CIとmainのみのデプロイを分離。Googleロゴ・公式画像を使用しない。
- 初回npm実行はホームのキャッシュ作成に失敗。キャッシュを `/tmp/gemini-npm-cache` に変更して解消。npm ciによるlockfile再インストールも成功。
- VitestがE2Eを収集する初期設定を修正し、単体テストの対象をsrcに限定。
- キーボード検証で初期フォーカスによるスキップリンクの飛び越しを修正。ブラウザ描画を待ってからTab操作するようテストも修正。

## 検証結果

- TypeScript型検査、ESLint、単体テスト4件、production build：成功。
- Chromium E2E 5件：成功。Pagesサブパス上で10章の遷移、準備中、第1章手順、全文表示、コピーAPIに渡る全文と成功／失敗通知、理解チェック、進捗保存・再読み込み復元・初期化とキャンセル、ストレージ拒否時の継続を検証。
- 375px / 390px / 1280px、ライト／ダークのスクリーンショット生成と横はみ出し検査、キーボードによるスキップリンクへのフォーカスを検証。
- Pages用production buildをE2Eのpreviewで配信して検証。実際のGitHub Pages公開・Actions実行は未実施。
- コピー成功はClipboard APIをモック。実OSクリップボード権限、全操作のキーボード走査、スクリーンリーダー、コントラストの自動監査、実機iPhone Safariは未検証。
- WebKit：ブラウザ取得先cdn.playwright.devが403 Domain forbiddenで未実施。既設Chromiumを代用して同エンジンの全テストを完了。
- Google公式ヘルプ：support.google.comへの取得が403のため、最新モデル名・UI・プラン・提供条件は未確認と明示。公式参考リンクの到達性も再確認が必要。

## 未解決事項・次の候補

- 環境設定に公式確認・API・ブラウザ配布先の通信許可と再現用install_script / start_skillをドラフト保存。レビュー・保存・環境公開はユーザー側の操作で、現環境への適用と新規タスクでの復元は未確認。
- PagesのSourceをGitHub Actionsへ設定し、PRレビュー・mainマージ後に公開結果を確認する。今回mainへのマージは行わない。
- 公式一次資料で第1章の現行条件と全参考URLを再確認し、確認日・条件を更新する。
- WebKit・実機iPhone Safari・実クリップボード・支援技術を追加検証する。
- 次の教材候補は第2章Googleサービス連携。権限と個人情報の扱いを先に整理する。第3章Deep Researchはその後の候補。

## GitHub操作の結果

- 作業ブランチへのcommitとリモートpushは成功。
- `gh pr create --base main --head feat/gemini-guide-v0-1` は `https://api.github.com/graphql` への通信がForbiddenとなり失敗。利用可能な専用PR作成ツールはないため、PRは未作成。
- PR本文を `docs/pull-request.md` に保存。GitHubの比較・PR作成画面からmain向けに本文を貼り付けて作成するか、環境設定でGitHub API通信許可を適用後に同コマンドを再実行する。既存Git HTTPSプロキシでpushはできているため、新しいトークンは要求していない。
- mainの変更、force push、マージ、本番公開は行っていない。

## 2026-10-22 — PR #2 独立レビュー3件への対応

### 着手前確認

- PR #2のレビュー本文（review 5606572532）とインライン3件（4342254925 / 4342254940 / 4342254947）、Issue #1、README、仕様を再取得・確認。
- ローカルとリモートの `feat/gemini-guide-v0-1`、PR HEADはすべて指定の `0eb1a9593d57a3e114790a9e5cc9dd21568c81e6`。差分・作業ツリー変更なし。修正済み内容の重複実装はない。
- 教材データ・10章構成・実践課題と第1章のみ完成の範囲は維持。新規PR、mainへのcommit、マージ、本番公開は行わない。

### 原因・修正・設計判断

1. 本文スキップがルート用hashを上書きし、初回ルート決定では `#main` を未知のページとしていた。リンクの既定動作を抑止し、main参照へのフォーカスだけを行う。現在のURLと履歴は維持する。既存 `#main` は元の章情報を含まないため、初回・hash変更とも履歴を追加せず `#home` へ置換して復旧する。リンクとmainのtabIndex、キーボード操作を維持。
2. `resetProgress()` の戻り値に関係なく成功通知していた。画面内の初期化は続け、削除失敗時は「保存領域の削除に失敗」「再読み込みすると古い進捗が復活する可能性」を通知。成功時の通知と区別。ストレージ関数のfalseの契約もコメントで明記。確認・キャンセルを維持。
3. mainのCIとPagesが独立し、PagesがE2E結果を待っていなかった。CIをPR実行とworkflow_callの共通検証にし、Pagesからvalidateとして呼ぶ。`npm ci → 型 → lint → 単体 → build → Chromium/WebKit E2E` の成功後にだけ検証済みdistをアップロードし、`validate → build → deploy` のneedsで接続。再ビルドせず同じ成果物を公開する。独立main CIの二重実行とworkflow_runの循環を避ける。main限定・PR公開禁止を維持し、write権限はdeployのpages/id-tokenだけ。

### 検証結果

- `npm ci --cache /tmp/gemini-npm-cache --no-audit --no-fund`：成功（依存追加・lockfile変更なし）。
- `npm run typecheck`、`npm run lint`、`npm test`（5件）、`npm run build`、`git diff --check`：成功。
- `npm run test:e2e`：Chromium 9件 + WebKit 9件 = 18件成功。既存5件／エンジンに回帰4件／エンジンを追加。
- スキップリンク：ホーム・第1章でキーボード起動、mainへのフォーカス、URL維持、再読み込み、戻る履歴。旧 `#main` 直接アクセス・遷移・再読み込みの復旧を検証。
- 初期化：読み取り可能でremoveItemだけ失敗する単体テストを追加。E2Eでは実localStorageに保存し、削除失敗の通知、画面内リセット、再読み込みでの旧進捗復活、書込み不可時の一時操作、確認・キャンセルを検証。
- `/gemini-toranomaki/` のproduction preview上で、375px・390px・1280px、ライト／ダークの横はみ出し検査、スクリーンショット生成・表示確認。コピー、理解チェック、保存・復元・成功時初期化の既存試験も通過。
- actionlint v1.7.12で両workflowを検証：成功。公式リリースのSHA-256照合後に使用。公開ゲートの依存関係と成果物の受け渡しを確認。本番デプロイの実行・故意の失敗投入は未実施。

### Cloud環境の診断と未検証事項

- 今回はGitHub APIとWebKit配布先へのアクセスが利用可能。以前のAPI拒否・WebKit未検証は当時の記録であり、今回の結果を上記に追記した。
- WebKitの共有ライブラリ不足は、Debian trixieの署名検証付きapt索引とチェックサム検証付きダウンロードで必要なパッケージを `/workspace/apt-webkit` に展開して解消。ブラウザのsys/libへ参照を追加した。システムやアプリの依存定義は変更していない。
- WebKitのホスト事前検査はldconfigのシステムキャッシュだけを参照し、作業領域のlibGLESv2を認識しない。ctypesで不足ライブラリの実ロード、各ブラウザ実行ファイル・共有ライブラリのlddで未解決依存がないことを確認後、ローカル実行だけ `PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1` を指定。テスト・アサーション・TLS・署名検証は無効化していない。CIでは標準の `playwright install --with-deps` を使い、事前検査を省略しない。
- ローカルE2E実行：`PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1 PLAYWRIGHT_BROWSERS_PATH=/workspace/pw-browsers PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e`。Chromium配布ZIPは403のため既設Chromiumを使用。WebKitはPlaywright指定のv2370。
- 実機iPhone Safari、OS実クリップボード権限、スクリーンリーダー、Google公式仕様の再確認、本番Pages配信は引き続き未検証。公式未確認表示を変更していない。
