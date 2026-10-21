# Gemini活用 虎の巻

Gemini固有の機能とGoogleサービス連携を、操作しながら学ぶ日本語の非公式教材。React / TypeScript / Viteによる静的サイトです。[Issue #1](https://github.com/tetsujisugimori-coder/gemini-toranomaki/issues/1)を仕様の正本とし、v0.1は全10章の目次と第1章のみを実装します。

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
