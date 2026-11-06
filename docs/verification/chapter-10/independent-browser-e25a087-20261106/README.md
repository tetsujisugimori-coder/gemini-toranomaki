# 第10章・独立ブラウザレビュー証拠

[最終レビュー全文](REVIEW.md)。修正範囲に限るマージ推奨 **YES**。公開安全性・Issue #24・実サービス／実機の未検証事項は別判定。Draft解除・マージ・本番公開を許可する提出ではない。

## 固定した対象と結果

| 対象 | この担当の実測 |
| --- | --- |
| main `3d4c7acde88ea1ebf2fff0d3009ad877d5a1bbd3` | 129単体・824 E2E成功 |
| RED `557f12e3c408a5735f9f0686f1e16361c6578c22` | 159単体成功、全898 E2Eは896成功・旧期待2失敗。採点と破損復元のP2を両エンジンで再現 |
| 中間 `075a2ba59df6f73a2728c64ebedf87ede5b8b6cc` | 164単体成功。全906は905成功・1 timeout。2回目は対象更新のため中断：243成功、4 interrupted、659未実行 |
| 製品最終 `9281516d56c3babab126114f451b7aa58a089f0b` | 165単体・全906 E2E成功、両エンジンの通し操作と28保存反例成功 |
| PR最終 `e25a08791a8b97036e2abaa11457d88a0a6f9519` | 製品srcは9281516と同一。追加2 E2E成功、165単体成功、独立32表示条件成功。最終CIは165単体・908 E2E成功を原ログで照合 |

独立E2Eの最終カバレッジは906＋追加2の別実行。CIの908件一括成功と同一の実行とは呼ばない。初回失敗・timeout・中断を消さず、成功へ読み替えない。

- src tree：`aad3fde4eabc1c93272be7b132246768bfffe1ce`
- 最終tests tree：`cb3d4ce6b71098586eef02a2251057595526b7b2`
- [PR #26](https://github.com/tetsujisugimori-coder/gemini-toranomaki/pull/26)
- [最終CI 42205160413](https://github.com/tetsujisugimori-coder/gemini-toranomaki/actions/runs/42205160413)、job `127849828521`

## 主要原票

- [初回P2の手順・期待と実測](evidence-557f12e/findings.md)、[両エンジンのRED反例JSON](evidence-557f12e/independent-counterexamples.json)
- [9281516通し操作JSON](evidence-9281516/sequence/independent-sequence.json)、[保存保護28ケース](evidence-9281516/independent-restore-protection.json)
- [最終HEADの追加2 E2E](evidence-e25a087/new-case-e2e.json)、[最終32表示条件](evidence-e25a087/independent-matrix.json)
- [最終CIのSHA・終端](evidence-e25a087/final-ci-details.json)、[原ログの件数・hash照合](evidence-e25a087/final-ci-raw-summary.json)
- [最終ソース同一性](evidence-e25a087/source-identity.json)、[選別・機密確認](content-audit.json)、[省略した重複画像](omitted-images.json)
- `manifest.json` は全収録ファイルのSHA-256とサイズ、`compression-map.json` はgzip復元後の原バイト列hashを記録する。

原ログは改行・末尾空白を削らずgzip保存する。例えば `gzip -cd PATH.log.gz > /tmp/recovered.log` で復元し、`compression-map.json` のoriginal_sha256と照合する。テストのstdout/stderr、初回のハーネス失敗JSON・代表失敗PNGも残した。

ソース本体は上記固定commitの履歴を参照できるため複製しない。必要な検査コードは各 `evidence-*/` の `.mjs` とPlaywright設定にある。snapshot JSONはこの担当がUI操作で作った合成記録で、実データではない。作者のPASSを独立PASSとして採用していない。

## 検査コードの再実行

記録環境はLinux、Node 24.19.0、Playwright 1.64.1、Chromium 156.0.8078.4、WebKit 27.2。`package-lock.json` は対象間で同一。まず別チェックアウトで `npm ci`、`npm run build`、必要なら `npx playwright install --with-deps chromium webkit` を実行する。単体は `npm test`、製品E2Eは `npm run test:e2e`。全体試験は4173番を使い、別のブラウザ検査との並行負荷を避ける。

独立 `.mjs` は原実行版を保持したため、再実行する作業コピーで次を合わせる。

1. 新しい作業ルートへ `candidate-075a2ba`、`candidate-9281516`、`candidate-e25a087` をそれぞれ上記SHAでdetach checkoutし、依存導入・buildする。旧REDを再現する場合は `candidate-557f12e` も用意する。
2. 各 `evidence-HASH` を、そのルートの `candidate-evidence-HASH` としてコピーする。`.mjs` と設定内の `/workspace/chapter10-independent-20261106` だけを新ルートへ置換する。製品ファイルや製品テストは変更しない。
3. ルートの `webkit-launch.sh` を実行環境のWebKitへ向ける。通常の依存導入済み環境では `playwright.webkit.executablePath()` が返す `pw_run.sh` をexecする小さなラッパーでよい。元環境だけのローカル共有ライブラリ展開を、他環境へそのまま流用しない。
4. 075a2baは4275番、9281516は4276番、e25a087は4277番で、それぞれ専用 `npm run preview -- --port PORT` を起動する。別ビルドのサーバーを再利用しない。
5. 9281516の `independent-sequence.mjs` → `independent-restore-protection.mjs` を実行する。e25a087の `independent-matrix.mjs` は `fixtures-from-9281516` にある同一srcでのUI生成記録を読み込む。075a2baの保存・コピー44件と採点12構成は、その版の `independent-storage-copy.mjs` と `independent-rubric-variants.mjs` にある。

`PLAYWRIGHT_BROWSERS_PATH` が必要ならインストール先へ設定する。実Safari、実Google、実アカウント、OS clipboard、スクリーンリーダー、実機、教育効果を検査したとは呼ばない。

## 配布と境界

Library保存は準備前の認証401で未実行。再試行していない。その後の明示指示に基づき、この専用ブランチへ証拠だけを保存する。約19MBの元ZIPと全画像は元環境に残し、ここには27枚の代表PNGと必要な原票を直接保存する。不要な画像重複・ZIPの二重保存・node_modules・ブラウザ本体・キャッシュは含めない。画像は架空教材と合成保存状態のみ。公開HTMLのbootstrap設定は転載せず[公式URL](official-sources.md)へ置換した。

Issue #24は別の安全課題。最終CI原ログにもmoderate 8／critical 2が残る。機能のマージ推奨YESを公開安全性の承認へ転用しない。
