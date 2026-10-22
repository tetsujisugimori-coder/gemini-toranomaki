# Gemini活用 虎の巻

Gemini固有の機能とGoogleサービス連携を、操作しながら学ぶ日本語の非公式教材。React / TypeScript / Viteによる静的サイトです。[Issue #1](https://github.com/tetsujisugimori-coder/gemini-toranomaki/issues/1)を仕様の正本とし、v0.1の全10章の目次と第1章に、v0.2で独立イントロ「Gemini体験ラボ」を追加しました。

## セットアップ・開発

Node.js 22以上（Viteの要件：22.12以上）、npmを使用します。

```sh
npm ci --cache /tmp/gemini-npm-cache
npm run dev
```

開発サーバーでは `/gemini-toranomaki/` を開きます。ログイン、APIキー、DB、バックエンドは不要です。Gemini本体は別タブで操作します。

## テスト

```sh
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install --with-deps chromium webkit
npm run test:e2e
```

E2Eはproduction previewを自動起動し、サブパスで遷移・コピー・理解チェック・進捗・保存失敗・375/390/1280px・テーマ・キーボードを検証します。コピー成功はブラウザAPIをモックし、渡した全文を確認します。OSの実クリップボードと実機iPhone Safariは別途確認が必要です。

## 公開

PagesのSourceは **GitHub Actions** に設定済みです。PRではCI検証だけを実行します。mainへのpush（またはmainでの手動実行）ではPagesが同じCIを再利用し、`npm ci`、型チェック、lint、単体テスト、production build、ChromiumとWebKitの全E2E成功を必須にします。検証済みのdistだけをアーティファクトとして渡し、`validate → build → deploy` の依存関係で公開します。いずれかの失敗・スキップ・キャンセル時は公開しません。PRやmain以外から本番公開しません。独立したmain用CIの二重実行やワークフロー間の完了イベント待ちはありません。デプロイjobだけに `pages: write` と `id-token: write` を付与しています。

Viteのbaseは `/gemini-toranomaki/`。画面遷移はhash方式でPagesの404を避けます。想定公開先：`https://tetsujisugimori-coder.github.io/gemini-toranomaki/`（公開確認は未実施）。

## データ・制約

教材は `src/curriculum.ts`、進捗は `src/storage.ts`、画面は `src/main.tsx`。進捗はこのブラウザだけに保存され、保存不可時はメモリ内で動作します。第2〜10章の完了は記録できません。初期化は確認操作後に行います。保存領域の削除に失敗した場合も画面内では初期化し、再読み込みで旧進捗が復活する可能性を通知します。本文スキップは現在の章URLや戻る履歴を変更せずフォーカスだけを移動します。旧 `#main` URLは章情報を持たないため、ホームへ置換して復旧します。

公式情報はネットワーク制限で本文を取得できなかったため、最新名称・プラン条件・UIは未確認と表示しています。リンクも到達性の再確認が必要です。教材内にGoogleの公式ロゴ・画像は含みません。

詳細は [仕様](docs/specification.md)、[教材構成](docs/curriculum.md)、[実装履歴](LOG.md) を参照してください。

## v0.2：Gemini体験ラボ

ホームまたはナビの「Gemini体験ラボ」から、質問・文章・画像・クイズの4体験へ進めます。各体験は予想→操作→条件変更→比較→解説→応用を提供します。全体験の完了は不要で、いつでも既存10章へ進めます。

ラボの教材は `src/lab-data.ts`、生成ロジックは `src/lab-prompts.ts`、UIは `src/Lab.tsx`、記録は `src/lab-storage.ts`。章の既存保存キーは維持し、ラボは別キーにコピー成功・実行自己申告・応用自己申告・固定課題の最終回答のみ保存します。入力文章・生成回答・振り返りは保存も自動送信もせず、体験を離れると消えます。既存の章進捗初期化は章のみを対象とします。ラボの記録はチェックの解除や再回答で訂正できます。

ラボの公式参照（プライバシー・画像生成／編集）は2026-10-22に本文確認済み。既存10章全機能の現行仕様を確認したものではありません。ローカルとCIの検証経緯はLOG.mdを参照してください。

## 第1章：画面探検・機能探検マップ

第1章には、12か所を選べる教材用の模擬画面と、8つの目的から機能を選ぶマップがあります。機能から目的を探すこともできます。実際の送信・添付・予約・連携は行いません。モデル名と思考レベルは2026年10月22日のユーザー確認例で、現在の利用可能性を保証しません。

教材データは `src/exploration-data.ts`、UIは `src/Exploration.tsx`、探索記録は `src/exploration-storage.ts`。探索済み・実画面の課題確認は独立キーに保存し、章完了とラボの記録を維持します。「進捗を初期化」は章完了だけ、「探索記録だけを初期化」は探索だけを対象とします。
