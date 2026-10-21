# v0.1 仕様

正本：[Issue #1](https://github.com/tetsujisugimori-coder/gemini-toranomaki/issues/1)。2026-10-22更新の全10章・第1章先行方針を採用。

## アーキテクチャ

React + TypeScript + Vite。ルーティングはhashでホーム、一覧、各章を切り替える。追加ライブラリによるルーターや状態管理は導入しない。教材型LessonにID、番号、章題、実践課題、学習目標、説明、手順、プロンプト、理解チェック、参考URL、情報確認状況、利用条件、注意事項、公開状態を分離して保持する。

第1章は画面確認、モデル・モード確認、機能探索、練習、理解度チェック、完了チェックを提供。準備中の章は概要と条件・参考リンクだけ表示する。理解チェックは選択直後に説明し、完了記録とは独立する。

## 永続化と障害時

localStorageキー `gemini-toranomaki:progress:v1` に完了教材IDを保存。復元時は公開中のIDだけ受け入れ、重複を除く。JSON破損、ストレージ拒否・容量不足は例外を捕捉し画面内の操作を継続。初期化は確認後にキーを削除。削除成否と画面内のリセットを区別し、削除失敗時は再読み込みで古い進捗が復活する可能性を通知する。画面内の一時的な進捗操作は継続できる。保存できない場合はその旨を表示。端末間同期はない。テーマはOS設定を初期値とし、画面内で切り替え可能（永続化しない）。

Clipboard API失敗時は手動コピーを案内し、成功と区別。全文は折りたたみで表示。キーボード、ネイティブdetails、ラベル付き入力、フォーカス枠、本文スキップ、画面遷移時の見出しフォーカス、aria-live通知を採用。最小44px操作領域を確保。本文スキップはリンクの既定のhash更新を抑止し、main要素へフォーカスを移す。現在のルート・履歴は変更しない。旧 `#main` URLは元の章を復元できないため `history.replaceState` で `#home` に正規化し、初回アクセスとhash変更の両方で処理する。

## 正確性と制約

公式ヘルプ本文の取得は403。現行仕様の検証は未完了で、画面にも未確認を明示する。モデル名・価格・利用枠を固定せず、ユーザーの画面と公式情報で確認する手順を提供。非公式教材でありGoogleの製品ではない。章題はIssueの教材編成上の仮称。

## 非対象

第2〜10章本文、Gemini API、認証、DB、バックエンド、自動操作、Gemini埋め込み、Googleサービスへのアクセス、メール・予定・カメラ情報の取得。実機iPhone Safari確認は別途。第1章ではサービス連携の権限を要求しない。

## 配信

`/gemini-toranomaki/` の静的配信。PagesのSourceはGitHub Actions設定済み。PRでは `.github/workflows/ci.yml` の検証のみ実行する。同ファイルを `workflow_call` でも利用可能にし、main限定のPagesワークフローから `validate` jobとして呼ぶ。`npm ci`、型チェック、lint、単体テスト、production build、ChromiumとWebKitの全E2Eを順に必須とし、全成功後だけ検証したdistを `validated-site` アーティファクトにする。Pagesの `build` は `needs: validate` でその成果物だけをPages形式へ渡し、`deploy` は `needs: build` で公開する。失敗・スキップ・キャンセルからのデプロイ続行条件は設けない。検証内容の重複定義、独立main CI、workflow_runによる循環依存を避ける。contents権限はread、pages/id-tokenのwriteはdeployだけ。PRとmain以外での手動実行は公開しない。mainへのマージと公開は今回実行しない。
