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
