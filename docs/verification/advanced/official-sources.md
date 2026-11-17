# Google公式資料の確認
確認日 2026-11-16 UTC。英語公式本文を取得。日本語の実アカウントUI、実サービス操作はNOT_TESTED。

|対象|一次資料|確認した利用条件・操作|限界|
|---|---|---|---|
|Chromeタブ共有|https://support.google.com/chrome/answer/16283624?hl=en |最新Chrome、ログイン、対応地域/言語、対応年齢。PCのAdd tabs/Update tabs、共有解除。仕事/学校は管理者設定。|段階提供。教材の3ページ共有を実測していない。|
|ファイル|https://support.google.com/gemini/answer/14903178?hl=en |ログインしてファイル追加。文書/表計算。容量/回数上限。WorkspaceのDrive取得は管理者条件。|PDF/CSVをこちらから実Geminiへ送信しない。|
|Skills|https://support.google.com/gemini/answer/17094296?hl=en |18歳以上・ログイン。Customize→Skills→Create manually。/または更新済み@で指定。対象を開きMore→Deactivate/Activate。|実UI・自動適用の内部挙動は未検証。|
|Gems移行|https://support.google.com/gemini/answer/18560919?hl=en |個人は2026年11月から、仕事/学校は2027年へ移行予定。移行時差あり。|各アカウントの可用性を保証しない。|
|チャット定期応答|https://support.google.com/gemini/answer/16316416?hl=en |個人へ段階提供、適格Workspace、Keep Activity必要。Scheduledから編集/停止/削除。|実予約しない。実行と結果正確性は別。|
|Taskスケジュール|https://support.google.com/gemini/answer/17094710?hl=en |18歳以上の個人、Pro/Ultra、Keep Activity、地域制限。仕事/学校は未提供。|チャット定期応答とは別。地域やプランは公式再確認を案内。|

Workspaceアプリ内のGeminiとGeminiアプリの接続機能、Chromeサイドパネル、APIは同一機能ではない。API/OAuth/backendの実装なし。公式ページ内にも更新時期差があり、利用者の現在画面での確認を優先。使えない場合の貼付け練習は実Skills等の成功へ昇格しない。
