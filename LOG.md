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

### GitHub Actionsの追加診断

- 修正commit 815b972を既存PR #2へpushし、3件への返信とPR本文更新を実施。
- CI run [39681828929](https://github.com/tetsujisugimori-coder/gemini-toranomaki/actions/runs/39681828929) は型・lint・単体・build・ブラウザ準備まで成功したがE2Eが失敗。ローカル18件成功とは分けて記録し、レビュー会話はこの時点では未解決のまま。
- Actionsのログ配布先 results-receiver.actions.githubusercontent.com はForbidden、公開ジョブ画面のログ取得も404で詳細を取得できなかった。失敗をChecksの注釈にも出力するGitHubレポーターをCI時だけ有効化し、再実行で原因を特定する。テストのskipやretryによる成功扱いはしない。

- 診断CI [39682176258](https://github.com/tetsujisugimori-coder/gemini-toranomaki/actions/runs/39682176258) のChecks注釈から原因を特定：Chromiumのホームスキップ試験1件が失敗、他17件は成功。遷移直後に前ページの見出し「全10章・機能一覧」を動的に期待値として取得していたため、再読み込み後の正しい「Gemini活用虎の巻」と一致しなかった。
- 回帰テストを修正：遷移先の既知の見出しを明示し、Reactの描画完了を待ってからURL・フォーカス・再読み込みを検証する。タイムアウト延長、retry、skip、期待条件の緩和は行っていない。GitHubレポーターを残し、今後のCI失敗もChecksで追跡可能にした。

### 最終コード検証

- 修正後のローカル型・lint・単体5件・build・actionlint・両ブラウザE2E18件：再度成功。
- コードHEAD `f6f3b1662f96e9b07090d39513ff02c70f563944` のGitHub Actions [39682476411](https://github.com/tetsujisugimori-coder/gemini-toranomaki/actions/runs/39682476411)：成功。npm ci、型、lint、単体、build、標準ブラウザ依存インストール、Chromium/WebKit E2E **18 passed (12.7s)** を確認。CIではローカル固有の事前検査省略や既設Chromium指定を使用していない。PRのため成果物公開は意図どおりスキップ。
- 新規PRは作成せずPR #2を更新。3件に修正箇所と検証結果を返信済み。CI成功を確認してレビュー会話を解決し、再レビュー待ちにする。マージ・main push・本番公開は実施しない。
- 残課題は実機iPhone Safari、実クリップボード、支援技術、公式情報再確認、mainマージ後のPages本番配信。既存ActionのNode 20ランタイム非推奨通知（GitHub側でNode 24に移行）も次回保守候補であり、今回のチェック失敗ではない。

## 2026-10-22 — v0.2 Gemini体験ラボ

### 着手前確認と設計判断

- 最新mainはローカル・リモートとも `2426b2d4b646886ce14890776fe63b4dcee7b606`。変更なしの既存checkoutから `feat/gemini-lab-v0-2` を作成。README、LOG、仕様、カリキュラム、src、単体/E2E、CI/Pagesを確認。
- GitHub GraphQLは403だったが、github.comの公開HTMLからIssue #1とPR #2の本文・レビュー経緯・マージ済み状態を確認。PR #2のスキップリンク、初期化失敗通知、公開ゲートを維持する。
- 4体験を独立hashルートに追加。10章データ、既存storage、既存テスト、依存定義・lockfile・Actionsは変更しない。
- 各体験は最初の操作・条件変更・比較・解説と注意点・別題材への応用の5段階。各段階の目的、予想、振り返りを設ける。UI部品は共通化し、教材、プロンプト純粋関数、記録を分離。
- コピー成功、Gemini実行自己申告、応用自己申告、固定理解チェックの最終回答を区別。自由入力・回答・比較指示は永続保存も外部送信もしない。章の既存キーには触れない。
- 比較対象は学習者が明示的に保持。条件を一つずつ変更する方法を案内。画像は生成APIを使わず、部分変更指示を作成でき、生成機能が使えなくても教材操作を継続できる。
- 本編への接続は1・6・7・9章。準備中表示を維持し、ラボ完了を移動の条件にしない。共通安全教材は出典、個人情報、提供条件、人による確認と固定3問の即時理由表示を実装。
- 教育目標・内容・UI・理解確認の対応表と他教材への応用候補はdocs/curriculum.mdに記録。

### 環境準備と検証

- Node 24.19.0 / npm 11.9.0。`npm ci --cache /tmp/gemini-npm-cache --no-audit --no-fund` 成功。依存・lockfile変更なし。開発サーバー起動とサブパスHTML取得も成功。
- `npm run typecheck`、`npm run lint`、`npm test`（既存5＋新規8＝13件）、`npm run build` 成功。
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium PLAYWRIGHT_BROWSERS_PATH=/workspace/pw-browsers npm run test:e2e` を実行。最終結果：Chromium **14 passed**、WebKit **14 failed**（配布先403により実行ファイルが存在せず起動不可）。全E2E成功とは扱わない。
- Chromiumでは既存9件と新規5件が成功。4体験開始、生成、編集、全文コピー、コピー失敗後の再試行、比較、設定復帰、理解チェック、記録復元、保存拒否、章互換、戻る、375/390/1280px・両テーマ・キーボードを検証。390/1280pxのラボ画像も生成し、390pxを目視確認。
- 初回追加E2Eは選択欄のアクセシブル名に選択肢まで含まれ、厳密なラベル検索がタイムアウト。select/textareaの名前を明示して修正。調査中の重複E2E実行では先行preview終了による接続拒否も発生。最終検証は重複実行せず実施し、Chromium全件成功。skip・retry・期待値の緩和はしていない。
- Playwrightの標準キャッシュは書込不可だったため `/workspace/pw-browsers` を指定して再試行。cdn.playwright.devおよびplaywright.download.prss.microsoft.comはいずれも403 Domain forbidden。既設Chromiumを使用し、WebKitの取得を迂回していない。
- Google公式ヘルプも403で本文確認不可。現行名称・提供条件は未確認と表示。実機iPhone Safari、OS実クリップボード、スクリーンリーダー、本番Pagesは未検証。CIとPages公開ゲートは変更していない。
- 再現用install_script、起動用start_skill、追加通信先（api.github.com、cdn.playwright.dev、playwright.download.prss.microsoft.com、storage.googleapis.com、support.google.com、gemini.google.com）を環境ドラフトに保存。保存は現環境への適用・公開を意味しない。ユーザーによる環境設定のレビュー・保存・環境公開が必要。WebKit検証とGitHub API操作は許可反映後に再実施が必要。

### 制限解消後の再検証（上記の初期結果を更新）

- GitHub API操作が可能になり、`3de0f50`をpushしてPR #3を作成。CI [39720600766](https://github.com/tetsujisugimori-coder/gemini-toranomaki/actions/runs/39720600766) はsuccess。Checks APIで結論を確認。ログZIPの配布先は依然403で、詳細ログの取得とは区別する。
- API疎通の変化を受けて配布先も再試行し、WebKit v2370とFFmpegのダウンロードに成功。取得失敗の問題は解消。
- Debian trixieの署名検証済み索引とaptのチェックサム照合を使い、不足ライブラリを `/workspace/apt-webkit/root` に展開。ブラウザ起動ラッパーはLD_LIBRARY_PATHを上書きするため、各bundleのsys/libへ不足ライブラリの参照を追加。WPE/GTKのELF依存に未解決がないことをlddで確認し、libGLESv2の実ロードも確認。
- システムldconfigキャッシュへ登録する権限はないため、ローカルのみ `PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1` を使用。実依存を別途検証した後のホスト事前判定の省略であり、テスト、署名、チェックサム、TLS検証は無効化しない。CIは従来どおり標準の `playwright install --with-deps` とホスト検証を使用。
- ローカル最終E2E：Chromium14件＋WebKit14件＝**28件成功**。画像機能を含む実Geminiの操作は学習者側で行うため自動化していない。
- Google公式のプライバシーハブ（answer/13594961）と画像生成・編集ヘルプ（answer/14286560）の本文を2026-10-22に取得・確認。機密情報を入力しない注意、誤回答、具体的な画像指示、アカウント・地域・年齢等による提供条件差を確認し、ラボに参照URLと確認日を追加。固定のモデル名・年齢条件を教材に断定せず、最新の公式ページへの確認を案内する。既存第1章の全公式仕様を再検証したとは扱わない。
- 再現用スクリプトを `/workspace/setup-gemini.sh` として実行し、install_scriptへ全内容を保存する。start_skillは取得済みブラウザとローカル共有ライブラリを使う起動・検証手順へ更新する。プロセスはスナップショット後も維持されるとは仮定しない。
- 残る未検証：実機iPhone Safari、OS実クリップボード権限、スクリーンリーダー、本番Pages。マージ・本番公開は行わない。環境ドラフトの保存と環境の公開は別で、環境公開はユーザー操作が必要。

## 2026-10-22 — PR #3 P2：コピー遅延完了による進捗上書き

### 着手前確認と原因

- 対象レビューcommit、ローカルHEAD、PR #3 HEAD、リモートの既存 `feat/gemini-lab-v0-2` はすべて `8eb52abb24e3a2ad2e41ace3404472e5bf239215`。未コミット変更なし。README、LOG、Lab・保存処理・既存単体/E2E・Playwright設定を確認。対象checkoutと祖先にAGENTS.mdは存在しなかった。
- `Lab.update` がrender時のprogressを閉じ込めていた。Clipboard Promiseを待つ古いcopyからupdateを呼ぶと、待機中の最新記録を古いsnapshotで置き換えて保存してしまう。Lab破棄後も古いcallbackからlocalStorageへ書き込めた。

### 最小修正とライフサイクルの判断

- 最新progressをrefへ同期保持し、すべての明示的な学習操作はその最新値へpatchをmerge。同じnextをref・React state・saveLabへ渡す。render前に連続して更新されても取りこぼさない。
- 保存を状態更新関数の中へ移していない。初期読み込み・mount Effectからの保存も追加していない。保存拒否時は最新refと画面内stateの更新を維持し、従来の保存不可通知を継続する。
- コピーは開始した体験のcallbackを保持する。ExperienceViewだけが破棄されてもLabが存続する体験間移動では、最新記録へコピー元体験のcopiedだけを反映。破棄済みExperienceViewへの成功・失敗通知は行わない。
- ラボ外へ移動しLabが破棄された場合の遅延完了は無視する。進捗の所有者をApp等へ移すリファクタリングを避け、再入場した新しいLabの記録を古いインスタンスから上書きしないため。mounted判定はcleanupで無効化し、StrictModeのEffect再実行では再度有効化する。
- 10章、第1章、章進捗キー、ラボ保存形式、自由入力を保存しない仕様、4体験の内容と固定理解チェック、依存関係、Pages公開ゲートは変更なし。

### 再現と検証

- `tests/lab-copy.spec.ts` に、resolve/rejectをテストが制御するClipboard Promiseを使った6件を追加。固定時間のsleepは使わない。
- 修正前のproduction buildに追加6件を実行：**5 failed / 1 passed**。同一体験の記録巻き戻り、他体験の記録消失、ラボ破棄後と再入場後の余分な保存、保存拒否時の画面内巻き戻りを実際に検出。初期読み込み時に保存しない試験は修正前も成功した。
- 修正後：`npm run typecheck`、`npm run lint`、`npm test`（既存13件）、`npm run build`、`git diff --check` 成功。
- `PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1 PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium PLAYWRIGHT_BROWSERS_PATH=/workspace/pw-browsers npm run test:e2e`：**Chromium20件＋WebKit20件＝40件成功**。既存28件を維持し、新規12件（6件/engine）も成功。ローカルのホスト事前検査例外と検証済み共有ライブラリは前節の環境設定を継続利用。CIでは標準のホスト検証を維持。
- 新規テストで同一体験のtried/applied/check維持、コピー元と別体験の記録併存、localStorageとの一致と再読み込み復元、ラボ破棄直後・再入場後の書き戻し禁止、コピー失敗時の手動コピー案内と再試行、保存拒否中の学習継続、初期表示・再入場での保存不発生を検証。
- Vite開発サーバー（5174、StrictModeが有効）でも同じ回帰6件がすべて成功。検証用設定はcheckout外 `/workspace/scratch/lab-copy-strict.config.mjs` に置き、アプリやCI設定を変更していない。
- 実機iPhone Safari、OS実クリップボード、スクリーンリーダーは今回未検証。コピーは制御可能なブラウザAPIモックによる検証。
- 着手時のGitHub APIではPR #3のインラインレビューコメント、レビュー、通常コメントはいずれも0件。新規PR・マージ・本番公開・レビュー会話の解決は行わない。既存PRへpushし、最終HEADのCIと再レビューを待つ。

## 2026-10-22 — 第1章：画面探検・機能探検マップ

### 事前調査・実装方針・判断理由

- 既存main `82b28954e43dfcb52a5d69a215da0609aaa38f9a` とリモートHEAD一致、変更なしを確認し、専用ブランチ `feat/chapter-1-explorers` を作成。AGENTS.mdなし。README、curriculum、App、Lab、storage、CSS、単体・E2E、CI/Pagesを確認。
- イントロの4体験は面白さの体験、第1章は画面構造と機能の選択、後続章は詳細実践に分担。第2〜10章は既存の概要ページがあるため、「概要・操作教材は準備中」と明記して実在ルートへ接続。連携・調査・資料・Live・Canvasの詳細手順は追加しない。
- 12か所の模擬画面から、名称・用途・場面・実画面での課題・関連章・条件を段階表示。実画面の完全再現ではなく、メニューと入力周辺という位置関係を学習用に整理したもの。実際の送信・添付・課金・予約・外部接続を模擬ボタンから実行しない。外部のGeminiを開くリンクと課題の自己申告を明確に分離。
- 目的別8件と逆方向の機能探索を追加。複数候補は理由と最初の操作を個別に示す。音楽生成が未提供の場合の歌詞相談、写真添付とLive、単独PDFと資料をまとめる方法などを区別。候補表示は利用可能性の保証ではない。
- 機能名・用途・課題・利用条件・関連章・目的の対応をexploration-dataへ分離。モデル選択と自動モードの思考レベルを別概念として説明。3.1 Pro・4 Argon・鍵表示・低／標準／高はユーザーが2026年10月22日に確認した例と明記。公式の現行仕様を検証したとは扱わず、高でも正解・長文が保証されないことを記載。料金・利用枠を推測で断定しない。
- 独立storageキーで探索済みと実画面の課題確認を保存。既存の章・ラボキー、完了条件、手順、理解度チェック、コピーは維持。読み取り・書き込み失敗、不正データ、未知IDに対応。探索専用の確認付き初期化と記録取消を提供。初期表示時は保存せず、操作時だけ保存。
- ネイティブbutton/selectとaria-pressedを使用。選択後は説明見出しへフォーカス。タッチ最小44px、600px以下はメニュー2列＋入力エリア、アニメーションなし。既存の緑系配色・ライト／ダークを使用。

### 検証結果

- `npm run typecheck`、`npm run lint`、`npm test`（既存13件＋新規4件＝17件）、`npm run build`、`git diff --check`：成功。依存定義・lockfile・Actionsの変更なし。
- Chromium：既設 `/usr/bin/chromium` を使用して既存20件＋新規8件＝**28件成功**。Playwright指定Chromiumの配布URLは403だったため、ローカルでは既設版を使用。CIは従来の標準ブラウザ導入を維持。
- WebKit v2370：配布アーカイブ取得成功。既存20件＋新規8件＝**28件成功**。合計E2E **56件成功**。各入口の説明、キーボード起動とフォーカス、保存復元・章未完了維持、8目的の候補と理由、実在章への遷移、逆探索、探索専用初期化とキャンセル、保存拒否後の学習を確認。
- 320・375・600・780・1280pxの両テーマで横はみ出し検査とスクリーンショット生成。既存の375・390・1280px試験も成功。モバイルとデスクトップの画像を目視確認。
- WebKitに必要なOSライブラリはsudoがないため、Debian公式の署名検証済みapt索引とチェックサム照合付きdownload-onlyを利用し `/workspace/apt-exploration/root` へ展開。ブラウザbundleのsys/libに参照を追加。各bundleのELF依存に未解決がないこととlibGLESv2の実ロードを確認。ldconfigのシステムキャッシュに登録できないため、ローカルのみ `PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1` でホスト事前判定を省略。テスト・TLS・署名・チェックサム検証は維持。CIは標準のホスト検証のまま。
- 再現コマンド：`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e -- --project=chromium --workers=2`、`PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1 PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright npm run test:e2e -- --project=webkit --workers=2`。

### 未検証・残課題・拡張候補

- 実機iPhone Safari、スクリーンリーダー、OS実クリップボード、実アカウントのGemini機能・料金・利用枠は未検証。比較実験室は追加せず、今後の候補とする。マージ・本番公開は行わない。
- GitHubのGit読み取りは成功するが、GitHub APIはproxyのCONNECT 403で拒否される。トークン不足とは判断しない。PR照会・作成・CI結果照会に必要な `api.github.com` を既存2ドメインを保持して環境設定案に追加保存。設定案の保存は現在のネットワークへの適用・環境公開ではない。API操作とリモートCIは許可反映後に実施が必要。

### GitHubへの反映（上記の初期アクセス制限を更新）

- 既存の認証設定のまま再試行し、APIアクセスが可能になった。追加トークンの作成やプロキシ迂回は行っていない。コードcommit `a4a8e6222682346fcfee01468580ea392522a08f` を専用ブランチへpushし、[PR #5](https://github.com/tetsujisugimori-coder/gemini-toranomaki/pull/5) を作成。既存のopen PRは他になし。
- CI [39767824698](https://github.com/tetsujisugimori-coder/gemini-toranomaki/actions/runs/39767824698) の依存導入・型・lint・単体・build成功を確認。記録時点では標準ブラウザ導入以降を実行中であり、ローカル56件成功とは区別する。最終HEADのCI結論は完了報告で示す。PR本文に検証方法と制限を記載済み。マージ・mainへのpush・本番公開は行わない。

## 2026-10-23 — PR #5：クラウドブラウザでの操作・目視追加検証

- 開始時のPRはOpen、HEADは前回レビュー対象と同じ `4ac46bda5912da1837a545fa4822fb76ca53bba6`、CI [39767964865](https://github.com/tetsujisugimori-coder/gemini-toranomaki/actions/runs/39767964865) は成功。既存LOG・探索E2E・保存仕様を読み、未確認の同一入口の再選択とフォーカス動線を重点確認。既存56件成功を今回の目視の代わりにはしていない。
- Chromium 154.0.8037.57でproduction previewを操作。1280×900／375×900のライト・ダーク4条件で入口切替・再選択、Tab／Enterによる継続、目的と逆探索、関連2／6章からの帰還、課題確認・復元・取消・初期化キャンセル／実行を確認。検証専用contextの有効な章・ラボ記録は初期化前後で同一。320×812は入口選択・横はみ出しの簡易確認のみ。
- 修正前の375×812で同じモデル選択を再タップすると、説明見出しが画面外（上端939px）に残り、フォーカスは入口のまま。初学者には無反応に見える。selectedが変わらずEffectが再実行されないことが原因。同じ選択でも説明へfocusし、説明から直前の入口へ戻るボタンを追加。保存形式・章完了条件は変更なし。
- 修正後コードの対象SHAは `4a0d1760db6bbb5a78dd78ef453bcdf62b7b8b3c`。両幅で再選択後も見出しが画面内、戻る→Tab→次の入口→説明の循環を確認。フォーカス枠は3px、入口ボタン最小約50.8px。模擬操作／外部の実Gemini、説明探索／課題確認の自己申告が区別できる。横はみ出し・重なり・JavaScript例外なし。実Geminiへの送信や接続はしていない。
- typecheck・lint・build成功。追加回帰2件は修正前Chromiumで2件失敗→修正後2件成功。WebKitの結果は次行に記録。ローカルの全スイートや全幅の大量画像生成は繰り返さず、最終HEADのCIは別途確認する。
- 画像は修正前1枚＋修正後代表2枚だけをcommit。いずれも実際に開いて目視確認。場所・対象SHA・撮影位置・確認の詳細は [検証記録](docs/verification/pr-5/README.md)。375pxダークの説明／戻る／自己申告と、1280pxライトのPDF複数候補を判読できた。長大な全ページ画像、動画、成功traceは保存しない。
- 実装者による追加検証であり独立レビューではない。実機iPhone Safari、スクリーンリーダー、拡大表示、OS実クリップボード、実アカウントのGemini仕様は未検証。元Issue、新規Issue／PR、マージ、本番公開は対象外で実施しない。
- フォーカスのブラウザ差も確認：WebKit v2370で追加回帰2件成功。前節と同じ検証済みの共有ライブラリを使用し、ローカルのみホスト事前判定を省略（テスト自体・TLS等は省略しない）。CIの標準ホスト検証は変更なし。

## 2026-10-23：第2章 Googleサービス連携（Issue #6）

- 最新main `23309a8` から `feat/chapter-2-google-services` を作成。Issue #6本文は変更せず `docs/requests/issue-6.md` に初回依頼の本文を保存。既存10章、第1章、ラボ、探索、保存方式、レスポンシブCSS、単体/E2E、Pagesの公開ゲートを確認した。
- 架空Gmail受信箱3通、初回/訂正の比較、7項目の抽出選択と理由付き判定、接続の理解、2段階の指示文ビルダー、原文→AI抽出例→未登録の候補カード、登録保留と6つのトラブル問題を実装。第3章以降の本文、OAuth、各種API、実メール入力・保存、予定の自動登録は追加していない。
- 模擬は実登録禁止、任意の実アカウント演習は別の表示・指示。模擬登録用指示は正しい比較ケースと7項目の確認後だけ解放し、旧案内・曖昧さ・重複は理由を示して停止。任意演習の確認は自己申告と明記し、未指定の対象カレンダー、不明・矛盾・未発見・重複があればGeminiにも質問させる。登録後はGoogleカレンダーの実在と内容を直接確認する手順を表示。
- 章完了処理のchapter-1固定を除き、既存v1キーと旧chapter-1完了を維持して第1/2章を独立して完了・解除。章2の固定選択、体験位置、模擬確認履歴、種類別コピー成功、任意操作自己申告は独立キーで保存。章完了の初期化はラボ・探索・章2操作履歴に影響しない。確認チェック・指示の解放は保存せず、過去の模擬完了やコピーだけで再解放しない。
- コピー完了時は最新の記録にマージし、条件変更・章離脱後の遅い完了を無視する。確認を変えて保留した場合はコピー待ちを解除し、新しい条件で再試行できる。拒否・容量不足・不正JSONも通知してメモリ内操作を続ける。
- Google公式ヘルプ4件の本文を2026-10-23に再取得。URLと要点は `docs/specification.md` に記録。設定名「カスタマイズ→コネクタ」、アクティビティの保存、Gmailのスマート機能、同じアカウント、管理者制限、Gmail内のGeminiとの違いを反映。
- 初回依頼からの判断：現行ヘルプでは予備/共有カレンダーも対応としているため、一律に非対応とは書かない。招待者追加は現時点の対応をこの参照群で断定せず教材では依頼しない。アカウント固有の提供を保証しない。Issue本文を更新せず、ここおよびPRで理由を記録する。
- ブラウザ取得は今回成功。WebKitの不足ライブラリはDebianの署名検証済みapt索引・チェックサム照合付きdownload-onlyで `/workspace/services-browser-deps` に展開し、bundleのsys/libに参照を追加。ELF 16件に未解決依存なし、libGLESv2の実ロード成功を確認。ldconfigのシステムキャッシュに登録できないため、ローカルのみ `PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1` を指定。テスト・アサーション・TLS・署名・チェックサム検証は維持。CIは標準の `playwright install --with-deps` とホスト検証を変更しない。
- 初回E2Eでは、新規テストの選択欄の検索方法とテーマ初期反映の待機不足を修正。またブラウザ別の同時実行が同じpreviewを再利用していたため、最終検証は単一のランナーで両engineを実行する。テストの要件・アサーションを削除して回避しない。
- 代表画像は `docs/verification/chapter-2/` の2枚だけ。PCライトの受信箱と375pxダークの比較を目視確認。実機iPhone Safari、スクリーンリーダー、実Googleアカウント接続/予定作成、OS実クリップボードは未検証。コピーはAPIモックで渡した全文と成功/失敗を確認する。
- 最終ローカル検証：`npm run typecheck`、`npm run lint`、`npm test`（22件）、`npm run build`、`git diff --check` が成功。`PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1 npm run test:e2e -- --workers=2` は **Chromium42件＋WebKit42件＝84件成功**（既存60件＋新規24件）。スキップ・expected failureなし。全4体験の320/375/390/1280px、両テーマ、キーボード、旧データ、章進捗独立性、保存失敗、コピー成功/失敗/遅延、登録判断を検証した。

## PR #7 レビュー修正：P1 登録対象と最終承認 / P2 保留後のコピー

- 開始時のローカル/リモート/PR HEADはいずれも `06deec6677bab7f79ef89cdcd55219f32aa22417`。既存ブランチ `feat/chapter-2-google-services`、作業ツリーはクリーン。GitHubの通常コメント・レビュー・インラインコメントは存在せず、今回の依頼を基に修正した。新規PRは作成せずIssue #6の本文・保存した初回依頼は変更しない。
- P1の原因：実アカウント用の単一プロンプトが「確認済みの予定」の参照と作成依頼を兼ねており、複数候補の一意な識別と全項目提示後の別メッセージによる最終承認が明確でなかった。
- P1の変更：検索を維持し、第2段階Aは対象1件の確認用ID・イベント名・開催日・開始/終了・時間帯・場所・訂正の出典/内容・対象カレンダー（所有者/アカウント含む）・重複確認の全項目提示だけを依頼する。ここでは作成/変更/削除を禁止。Gemini側で原文と照合した自己申告後、第2段階Bのひな形を表示する。値はGemini側だけで記入し、提示後の別メッセージ・1件の特定・全項目一致・明示承認が成立する場合だけ新規作成を依頼する。未記入・対象不明・複数候補・不足・矛盾・未確認・不一致・重複は停止、内容変更は再提示と新しい承認を要求する。変更/削除は承認しない。登録後のGoogleカレンダー直接確認は維持。
- 自己申告は実データや承認成立を教材が検証したものではない。実メール・個人情報・Gemini回答の入力欄や保存は追加しない。旧real-registration履歴を維持し、real-preflight / real-executionのコピー履歴を追加。保存キー・旧データ・章完了・ラボ・探索の記録方式は維持し、今回の照合チェックも保存しない。模擬の実登録禁止は変更なし。
- P2の原因：ケース/チェック/モード変更にはバージョン更新があったが、「登録せず確認する」では行っておらず、開始済みコピーの成功履歴や失敗通知を反映できてしまった。修正前production buildで保留後の成功・失敗をそれぞれ再現し、回帰2件が期待どおり失敗した。初回LOGにあった保留後の無効化についての記述は、この時点では実装を満たしていなかった。
- P2の変更：既存version/mounted判定を使い、無効化を小さな共通関数へ集約。保留でもversion更新・待機解除・通知消去と確認解除を行う。古い成功/失敗/finallyは履歴・通知・保留判断・新しいコピーの待機を変更しない。再確認後に新たなコピーが可能。これは教材内の扱いで、開始済みOSクリップボード書き込み自体を取り消すものではないとUI/文書に明示。
- UI：任意の実アカウント演習だけに、第1章と同じ文言・primaryデザインの「Geminiを開く ↗（別タブ）」を追加。ログイン・連携成功を保証しないこと、模擬演習には不要であることを明示。375pxダークの最終照合部分を一時画像1枚で目視確認し、画像/traceの追加コミットは行わない。
- 回帰追加：単体3件（確認専用プロンプト、全項目一致と別承認を要する実行ひな形、旧/新コピー履歴と非保存項目）。E2Eは16件/engine追加。保留・ケース・チェック・モード・章離脱×遅い成功/失敗、再確認後の再コピー、最終照合変更後の古い結果と新コピーの並行待機、現在の失敗と再試行、実フローの分離/非入力/旧履歴、320/375/390px・両テーマ・リンク/最終指示のキーボードフォーカスを検証する。既存84件を削除せず、旧実アカウントテストの対象ラベルを新フローへ合わせ、元の停止条件と非自動完了の検証を維持。
- 未検証/限界：実機iPhone Safari、スクリーンリーダー、実Google連携/予定作成、OS実クリップボード。静的教材はGeminiが指示に従うことや実データの一致を強制・検証できず、人による照合とGoogleカレンダーでの直接確認が必要。今回の修正に関する回帰テストの成功は、実サービスでの実行を検証した結果ではない。

- 最終ローカル検証：`npm run typecheck`、`npm run lint`、`npm test`（25件）、`npm run build`、`git diff --check` が成功。`PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1 npm run test:e2e -- --workers=2` は **Chromium58件＋WebKit58件＝116件成功**（既存84件維持＋追加32件、スキップ/expected failureなし）。前回検証済みのローカルWebKit依存を再利用し、CIは引き続き標準のOS依存導入・ホスト検証を使用する。最終HEADのCI結果はPR本文に記録する。
