# 第10章のGoogle公式資料確認（2026-11-06 UTC）

ヘルプ本文は更新日を表示していないため確認日を記録する。個別アカウントでの実操作、日本語の現在のUIラベル、地域・組織・プラン別の提供可否はNOT_TESTED。ブラウズと別途HTTP取得の結果・リダイレクト・原文bytesのSHA256は [official-fetch.json](official-fetch.json)。本文HTMLは作業環境の `/tmp/capstone-google-*.html` に置き、第三者の全文をリポジトリへ転載しない。

| 公式資料 | 確認した範囲・教材への採用 |
| --- | --- |
| [名称変更のGoogle発表（2026-07-16）](https://blog.google/innovation-and-ai/products/gemini-notebook/notebooklm-gemini-notebook/) | NotebookLMはGemini Notebookへ名称変更、独立サービスとして継続。Gemini内の入口と独立サービスを混同せず、無関係な製品とも扱わない。旧名が残る公式文書もある。 |
| [Gemini内ノートブック](https://support.google.com/gemini/answer/16972047?co=GENIE.Platform%3DDesktop&hl=en) | 接続時の変更同期が公式に案内される。EEAは手動接続、段階提供・端末差がある。アクティビティ保存オフでは会話できても自動履歴・過去文脈・既存チャット追加・Drive資料等に制限。Gemini内の会話はWebやツールも利用でき、常に資料限定とはしない。 |
| [Deep Research](https://support.google.com/gemini/answer/15719111?co=GENIE.Platform%3DDesktop&hl=en) | 18歳以上・ログイン、日次と同時実行の上限・プラン差。ソース選択→計画編集→開始→報告。Google Searchが既定のソースで、他の資料だけに限定する場合は検索を外す必要がある。報告のCanvasパネルからDocsへ出力、内容コピーが可能。具体的な上限回数を固定しない。 |
| [資料追加と制限](https://support.google.com/gemininotebook/answer/16215270?co=GENIE.Platform%3DDesktop&hl=en) | コピーしたテキスト／Docs／URL／PDF等の資料追加。Drive資料は数分ごとの同期と手動同期の案内がある。Googleファイルの脚注・コメントは対象外。URLは当該ページの本文中心で画像・埋込み動画・リンク先は取り込まれない。資料の更新・削除で既存Studio成果物は更新されない。 |
| [Canvas](https://support.google.com/gemini/answer/16047321?co=GENIE.Platform%3DDesktop&hl=en) | ログインして文書・アプリ・コード等を制作・修正できる。形式を依頼に指定、本文やコードの選択修正、版・ログの確認、コピー等。派生生成には年齢条件がある。教材では個人情報を使わない非公開の文書・固定試作を目標にする。 |
| [Canvasの安全](https://support.google.com/gemini/answer/16419134?hl=en) | 共有リンクのアプリは公開され、共有データを他の利用者が表示・編集できる場合がある。永続保存がFirestoreを作る場合もあるため、本演習は公開・保存サービス作成を操作対象にしない。 |
| [Notebook系の利用条件](https://support.google.com/gemininotebook/answer/16213268?hl=en) | 利用枠・対象アカウント・データの扱いはそのサービスの条件で確認する。独立Notebookの説明をGemini内の会話一般に拡張しない。 |

## 案内する資料移動

確認した各機能の個別手順を組み合わせた教材上の方法であり、実アカウントでの一連操作を検証したものではない。

1. 調査報告と重要な原資料を照合する。
2. 報告をDocsへ出力、または内容コピーする。
3. ノートブックの資料追加でDocsまたはコピーしたテキストを本人が選ぶ。
4. 重要な原文URLは本人が別途追加し、取り込み範囲と引用を再確認する。
5. 確認したメモをCanvasへの依頼に本人が貼り付ける。

ノートブックの公式同期案内から、あらゆる調査報告・引用・Canvas・Docsの自動転送や双方向同期を推定しない。引用の完全保持も保証しない。本サイトから接続・送信・アップロードはしない。

## UI部品・素材の選択

既存章のHTMLフォーム・比較パネル・copy通知を使い、新しいMuseum部品や第三者画像は不要と判断した。Loading Museum／Intelligence UI Museumのコードを取得・採用しておらず、ライセンス未確認のコード・アセットを転載しない。第三者のロゴ・画像・史料・実業務データも使わず、3テーマの固定データを新規作成した。
