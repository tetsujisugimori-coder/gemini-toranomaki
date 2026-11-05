# 第2章実践教材：PR #21レビュー指摘の修正と自己検証

2026-11-02 JST（作業ログはUTC）。実装担当の自己検証であり、独立レビュー・実Google操作・マージ承認ではない。

## 基準と変更

開始時checkoutはwork / afc772aでクリーン。未コミット変更なし。既存の追跡済み証拠とcacheを維持し、今回の証拠ログは別の `/tmp/ch2-review-evidence` に保存。dist/test-resultsは通常のbuild/testで再生成した。開始時のignored生成物の別バックアップは未取得。明示fetch後の最新mainは `3ab4478b275e6d31b81832bc9da11b21db4fd4e9`（PR #21マージ）。親・repoのAGENTS.mdとcheckout `.agents/skills` に適用指示なし。README、仕様、教材、保存、試験、前回記録、Issue一覧・PR一覧、Issue #20、PR #21本文と[レビュー5727522902](https://github.com/tetsujisugimori-coder/gemini-toranomaki/pull/21#pullrequestreview-5727522902)を確認した。既存PRの履歴は変更しない。

[Issue #22](https://github.com/tetsujisugimori-coder/gemini-toranomaki/issues/22)、新規ブランチ `fix/chapter-2-practice-review`。

|指摘|改善|
|---|---|
|P2-A|testMailをsubject/bodyで管理。Gmailの宛先・件名・本文欄を明示し件名／本文だけをコピー。従来の件名・本文・日本語・改行・年・時刻・時間帯を全文一致で保護。失敗時の手動選択と共有busy、既存世代・route・mounted失効を維持。コピーと実送信は別。|
|P2-B|実操作用の確認カードと最終承認を同じ12項目配列から生成。対象メール1件と目的・予定の説明を必須にし、未記入・矛盾・対象不明・重複の可能性で停止。変更で承認を無効、Gmailの原文照合→別メッセージで承認→Calendarで実在と説明・重複を直接確認。後付け目的欄を撤去し、模擬の指示生成は維持。|
|P3|工程と一覧を「これまでの学習記録」「現在の学習状態」に区分し、過去の操作後に利用不可になり得ると説明。再挑戦は現在状態だけを未記録へ戻し、過去履歴を保持。本人のチェック訂正・確認付き実践初期化を維持。|

services-practice:v1のキーと保存形式は不変。copiedの許可IDにmail-subject/mail-bodyを追加するだけ。旧step-1も保持し、旧模擬記録や他章を実操作へ変換しない。実メールや認証情報、回答の入力・保存、OAuth/API、送信・予定登録代行は追加していない。既存9工程と模擬4体験、外部分割／別窓／タブ方式、ナビ・テーマ・他章・依存・CI/Pagesを維持する。

## 修正前の再現

製品コードがmainの状態で新回帰を先に実行した。

- 単体：125成功＋新3失敗（128件）。独立したtestMail.subjectがない、カードの必須項目と承認の項目が一致しない、新しい固定コピーIDが除外される、の3件を確認。
- Chromiumの代表E2E：新3件すべて失敗。件名／本文の独立導線なし、目的・予定の説明の必須表記なし、過去履歴と現在状態の区分なしを確認。WebKitでの修正前REDは未実施。
- REDログSHA-256：unit `9a7c50136dd9aa34342315543226015da0993d1d3518c088cfa43c810be5025b`、E2E `0d70275a0eb708f826d9c2da3fe3872e64bf549b5c372bdc6bf8e1308c7fd3e9`。原ログは[単体RED](review-red-unit.txt)・[E2E RED](review-red-e2e.txt)として同梱。

新3単体と代表E2Eは修正後GREEN。既存試験の削除、skip、retry、timeout延長なし。既存の件名検査は専用欄への全文一致へ厳密化し、再挑戦後の期待は依頼された履歴保持の仕様に合わせ[]から[4]へ変更し、statusが0になる検査も追加。期待値を緩めて失敗を隠す変更ではない。

## 実行環境と依存確認

実測：Debian GNU/Linux 13.6 / Node 24.19.0 / npm 11.9.0 / Playwright 1.64.1。既設ブラウザは `/workspace/.cache/ms-playwright`。Chromium 156.0.8078.4は標準起動成功。WebKitは標準ホスト検査でlibgtk-4、graphene、harfbuzz-icu、manette、hyphen、GLESv2不足として起動前に失敗した（製品テスト失敗とは別）。前作環境設定は無条件に再利用しなかった。

sudoなし。公式deb.debian.orgのtrixie/trixie-updatesを独立した `/tmp/ch2-review-apt` でAPT署名検証し、9パッケージをdownload/extract（gtk-4、graphene、harfbuzz-icu、manette、hyphen、gles2、cairo-script-interpreter、hidapi-hidraw、lzo2）。6主要ライブラリをctypes.CDLLでLOAD_PASS確認。WebKit同梱MiniBrowser wrapperがLD_LIBRARY_PATHを上書きする現物を確認し、不足ライブラリへのsymlinkを作業領域のブラウザsys/libへ追加した。バイナリ・wrapperは変更していない。

PlaywrightのmissingDLOPENLibrariesが `/sbin/ldconfig -p` だけを見る現行コードを確認したため、作業領域ライブラリを見ない検査に限りローカルで `PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1` を設定。WebKit 27.2の起動とHTML表示成功を確認した。TLS・CSP・XFO・Google認証を無効化せず、CIの標準依存導入・ホスト検査・全試験は変更しない。CIは別環境の実ログで確認する。APTのシステムcache清掃hookの権限警告はあったが、署名検証済みメタデータ取得と作業領域へのdownload/extractは成功した。

代表画面を作者が目視：[375pxダーク・件名／本文](review-mail-375.png)、[1280pxライト・登録前確認](review-preflight-1280.png)。pageerrorなし、横超過なし。追加の実機検証を意味しない。

## 最終検証

型検査・ESLint・単体128件（既存125＋新3）・production build・git diff --check成功。第2章重点126件（63/engine）が成功した後、最終build後に全820 E2E（Chromium410＋WebKit410、既存804＋新16）を8.3分で一括成功。失敗・skip・expected failureなし。前作804件の成功を継承した報告ではなく、今回全件を再実行した。

新8ケース/engineは個別コピー全文・共有busy・成功/失敗・手動選択・コピーのみでは操作済みにしないこと、件名/本文×古い成功/失敗の4ケース、目的を含む確認カードと承認の必須項目、過去と現在の並立・再挑戦・reload保持、9工程の前後キーボード移動と外部タブstub復帰。既存の5幅×両テーマ×文字200%検査には個別コピーのキーボード操作と44px以上の操作域確認を追加し、横超過・focus・表示検査を保持した。

既存の保存拒否/破損、工程・端末・モード・チェック・状態・再挑戦・初期化・章離脱のコピー失効、非永続承認、模擬4体験、他章回帰も再実行。旧模擬・章完了・他章キーが実践保存/初期化で変わらず、旧記録が実操作へ昇格しないことを単体/E2Eで確認した。最終HEADのCI URL・SHA・件数はDraft PR本文を正本として読戻し確認する。CI結果はローカルの成功から推定しない。

## NOT_TESTEDと引継ぎ

実Google（メール送信・検索・予定作成・実登録）、実機Safari/iPhone・Android、製品版Chrome/Edgeの分割操作、実OSクリップボード、実スクリーンリーダー、組織設定、学習効果はNOT_TESTED。外部タブ復帰のE2Eはローカルstubを使い、Google操作成功とは扱わない。既存Viteの500kB超バンドル警告は継続し、無関係な分割改修は行わない。

独立再レビューではPCの9工程、320/375pxでの件名／本文コピーと手動代替・タブ復帰、12項目と停止・別承認・Calendar直接確認、旧データと現在状態の意味、再挑戦・初期化の非破壊を再受入してほしい。自己検証は独立レビュー完了を意味しない。マージ推奨NO：独立再レビュー待ち。Draft維持、merge・auto-merge・本番公開なし。
