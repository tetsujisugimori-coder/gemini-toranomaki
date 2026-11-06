# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: capstone.spec.ts >> end-to-end history: plan, sources, production, broken repair, retest and reflection
- Location: tests/capstone.spec.ts:120:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.selectOption: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('combobox', { name: '3 改善案', exact: true })

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - link "本文へ移動" [ref=e3]:
    - /url: "#main"
  - banner [ref=e4]:
    - link "虎の巻 GEMINI GUIDE" [ref=e5]:
      - /url: "#home"
      - text: 虎の巻
      - generic [ref=e6]: GEMINI GUIDE
    - button "ダークテーマに切り替え" [ref=e7] [cursor=pointer]: ☾ ダーク
  - navigation "メインナビゲーション" [ref=e8]:
    - link "ホーム" [ref=e9]:
      - /url: "#home"
    - link "全10章・機能一覧" [ref=e10]:
      - /url: "#curriculum"
    - link "Gemini体験ラボ" [ref=e11]:
      - /url: "#lab"
    - link "第1章を学ぶ" [ref=e12]:
      - /url: "#chapter-1"
    - link "第2章を学ぶ" [ref=e13]:
      - /url: "#chapter-2"
    - link "第3章を学ぶ" [ref=e14]:
      - /url: "#chapter-3"
    - link "第4章を学ぶ" [ref=e15]:
      - /url: "#chapter-4"
    - link "第5章を学ぶ" [ref=e16]:
      - /url: "#chapter-5"
    - link "第6章を学ぶ" [ref=e17]:
      - /url: "#chapter-6"
    - link "第7章を学ぶ" [ref=e18]:
      - /url: "#chapter-7"
    - link "第8章を学ぶ" [ref=e19]:
      - /url: "#chapter-8"
    - link "第9章を学ぶ" [ref=e20]:
      - /url: "#chapter-9"
    - link "第10章を学ぶ" [ref=e21]:
      - /url: "#chapter-10"
  - main [ref=e22]:
    - generic [ref=e23]: 非公式インタラクティブ教材 · v0.2
    - article [ref=e24]:
      - link "← 全10章へ" [ref=e25]:
        - /url: "#curriculum"
      - paragraph [ref=e26]: CHAPTER 10
      - heading "総合演習：複数機能を連携させて成果物を作る" [level=1] [ref=e27]
      - paragraph [ref=e28]: 複数機能を連携させて成果物を作る
      - generic [ref=e29]:
        - heading "学習目標" [level=2] [ref=e30]
        - paragraph [ref=e31]: 課題・根拠・完成条件をつなぎ、AIの誤りと修正による退行を発見して改善する。
        - heading "この機能について" [level=3] [ref=e32]
        - paragraph [ref=e33]: 3つの架空テーマで、調査・資料整理・制作・10観点の検証・再修正・理由付き振り返りを体験します。全10章の区切りの後も教材開発は続けます。
      - generic [ref=e34]:
        - paragraph [ref=e35]: 課題設定 → 調査 → 資料整理 → 制作 → 検証 → 改善 → 振り返り。固定データの模擬演習です。実サービスは任意で、外部の結果は教材から検証できません。全10章の区切りの後も、新しい演習・機能変更への対応を続けます。
        - region "総合演習の現在位置" [ref=e36]:
          - generic [ref=e37]:
            - generic [ref=e38]:
              - text: 総合演習の工程
              - combobox "総合演習の工程" [ref=e39]:
                - option "STEP 0 環境を準備"
                - option "STEP 1 課題と完成条件"
                - option "STEP 2 調査と出典照合"
                - option "STEP 3 資料を整理"
                - option "STEP 4 制作指示と初版"
                - option "STEP 5 品質を検証"
                - option "STEP 6 改善と再検証" [selected]
                - option "STEP 7 評価と振り返り"
            - paragraph [ref=e40]: 選択内容：STEP 6 改善と再検証
          - generic [ref=e41]:
            - generic [ref=e42]:
              - text: 演習方法
              - combobox "演習方法" [ref=e43]:
                - option "模擬演習だけで進める" [selected]
                - option "模擬＋任意の実サービス演習"
            - paragraph [ref=e44]: 選択内容：模擬演習だけで進める
          - paragraph [ref=e45]: 現在位置 STEP 6 / 7 · 閲覧記録 6/8 · 現在の模擬確認 5/8
          - progressbar "現在の模擬課題の確認数" [ref=e46]
          - paragraph [ref=e47]: 工程への移動は達成や外部操作の成功を意味しません。どの工程からでも再挑戦できます。
        - heading "STEP 6 改善と再検証" [level=2] [ref=e48]
        - generic [ref=e49]:
          - generic [ref=e50]:
            - paragraph [ref=e51]: 問題発見 → 修正指示 → 修正版確認 → 再検証。回数を増やすためでなく完成条件を満たすために修正します。
            - generic [ref=e52]:
              - generic [ref=e53]:
                - text: 修正指示の具体性
                - combobox "修正指示の具体性" [ref=e54]:
                  - option "直して（曖昧）"
                  - option "問題・期待結果・維持条件・再検証を指定" [selected]
              - paragraph [ref=e55]: 選択内容：問題・期待結果・維持条件・再検証を指定
            - button "修正指示を適用" [ref=e56] [cursor=pointer]
            - button "退行も直した再修正版を確認" [ref=e57] [cursor=pointer]
            - generic [ref=e58]:
              - generic [ref=e59]:
                - text: 検査する版
                - combobox "検査する版" [ref=e60]:
                  - option "初版"
                  - option "修正版1（退行あり）"
                  - option "再修正版" [selected]
              - paragraph [ref=e61]: 選択内容：再修正版
            - paragraph [ref=e62]: 各版は固定の誤り事例です。よい指示を出しても自動で正しい成果物になるとは限りません。
            - group "比較パネルの表示" [ref=e63]:
              - button "両方を比較" [pressed] [ref=e64] [cursor=pointer]
              - button "初版を見る" [ref=e65] [cursor=pointer]
              - button "検査する版を見る" [ref=e66] [cursor=pointer]
            - generic [ref=e67]:
              - region "初版の成果物" [ref=e68]:
                - paragraph [ref=e69]: 固定模擬成果物 · 初版
                - paragraph [ref=e70]: 小さなWeb展示・確認問題／テーマの初学者
                - heading "架空の青葉町・読書室の歩み" [level=4] [ref=e71]
                - paragraph [ref=e72]: 史料が示す範囲で町の読書室を紹介する
                - paragraph [ref=e73]: 読書室は1923年4月に開室した。
                - paragraph [ref=e74]: 開室時の蔵書は120冊。
                - paragraph [ref=e75]: 全国初の読書室だった。
                - group "開室した年は？" [ref=e76]:
                  - generic [ref=e78]:
                    - radio "1923年" [ref=e79]
                    - text: 1923年
                  - generic [ref=e80]:
                    - radio "1924年" [ref=e81]
                    - text: 1924年
                  - button "回答を未選択に戻す" [ref=e82] [cursor=pointer]
                  - button "回答を確認" [ref=e83] [cursor=pointer]
                  - status [ref=e84]: （結果未表示）
                  - paragraph [ref=e85]: 検査した入力：まだありません。未回答・正答・誤答を同じ条件で試してください。操作履歴は正しく動いた証明ではありません。
              - region "再修正版の成果物" [ref=e86]:
                - paragraph [ref=e87]: 固定模擬成果物 · 再修正版
                - paragraph [ref=e88]: 小さなWeb展示・確認問題／テーマの初学者
                - heading "架空の青葉町・読書室の歩み" [level=4] [ref=e89]
                - paragraph [ref=e90]: 史料が示す範囲で町の読書室を紹介する
                - paragraph [ref=e91]: 読書室は1924年4月に開室した。
                - paragraph [ref=e92]: 開室時の蔵書は120冊。
                - paragraph [ref=e93]: 断定を避ける：この町の2史料だけでは全国初かは分からない。
                - paragraph [ref=e94]: 出典：S1「青葉町読書室 開室記録（架空）」、S2「受入帳の抜粋（架空）」。原文は資料パネルで確認。
                - paragraph [ref=e95]: 対象範囲・制約：この町の2史料だけでは全国初かは分からない。追加の比較調査は未実施。
                - group "開室した年は？" [ref=e96]:
                  - generic [ref=e98]:
                    - radio "1923年" [ref=e99]
                    - text: 1923年
                  - generic [ref=e100]:
                    - radio "1924年" [checked] [ref=e101]
                    - text: 1924年
                  - button "回答を未選択に戻す" [ref=e102] [cursor=pointer]
                  - button "回答を確認" [ref=e103] [cursor=pointer]
                  - status [ref=e104]: 正解。S1では1924年と確認できます。
                  - paragraph [ref=e105]: 検査した入力：未回答／1923年／1924年。未回答・正答・誤答を同じ条件で試してください。操作履歴は正しく動いた証明ではありません。
            - group [ref=e106]:
              - generic "問題発見・改善の記録" [ref=e107] [cursor=pointer]
            - heading "10観点の品質チェック：再修正版" [level=3] [ref=e108]
            - paragraph [ref=e109]: AIからの報告「すべて成功しました」は検証の証拠にしません。目的と完成条件、資料の原文、実際の操作を根拠に選びます。情報不足・対象外は保留とし、適合数に含めません。
            - group "1. 目的に合っている" [ref=e110]:
              - generic [ref=e112]:
                - generic [ref=e113]:
                  - text: 1 判定
                  - combobox "1 判定" [ref=e114]:
                    - option "選んでください"
                    - option "適合" [selected]
                    - option "要改善"
                    - option "情報不足・保留"
                - paragraph [ref=e115]: 選択内容：適合
              - generic [ref=e116]:
                - generic [ref=e117]:
                  - text: 1 根拠
                  - combobox "1 根拠" [ref=e118]:
                    - option "選んでください"
                    - option "タイトルと目的は「架空の青葉町・読書室の歩み／史料が示す範囲で町の読書室を紹介する」" [selected]
                    - option "見た目がきれいで使えそう"
                    - option "資料を読んでいないが多分正しい"
                - paragraph [ref=e119]: 選択内容：タイトルと目的は「架空の青葉町・読書室の歩み／史料が示す範囲で町の読書室を紹介する」
              - generic [ref=e120]:
                - generic [ref=e121]:
                  - text: 1 改善案
                  - combobox "1 改善案" [ref=e122]:
                    - option "選んでください"
                    - option "変更不要・根拠を維持" [selected]
                    - option "原文に合わせて訂正"
                    - option "不足条件を追加"
                    - option "同条件で操作し再検証"
                    - option "元の正常部分を復元"
                    - option "追加資料を確認するまで保留"
                - paragraph [ref=e123]: 選択内容：変更不要・根拠を維持
              - button "1 根拠を照合" [ref=e124] [cursor=pointer]
              - status [ref=e125]: 固定資料との照合OK。テーマの対象と目的を本文で確認できる。
            - group "2. 必要な情報が揃う" [ref=e126]:
              - generic [ref=e128]:
                - generic [ref=e129]:
                  - text: 2 判定
                  - combobox "2 判定" [ref=e130]:
                    - option "選んでください"
                    - option "適合" [selected]
                    - option "要改善"
                    - option "情報不足・保留"
                - paragraph [ref=e131]: 選択内容：適合
              - generic [ref=e132]:
                - generic [ref=e133]:
                  - text: 2 根拠
                  - combobox "2 根拠" [ref=e134]:
                    - option "選んでください"
                    - option "AIが『すべて成功』と報告した"
                    - option "選択した完成条件が本文に揃っている" [selected]
                    - option "資料を読んでいないが多分正しい"
                - paragraph [ref=e135]: 選択内容：選択した完成条件が本文に揃っている
              - generic [ref=e136]:
                - generic [ref=e137]:
                  - text: 2 改善案
                  - combobox "2 改善案" [ref=e138]:
                    - option "選んでください"
                    - option "変更不要・根拠を維持" [selected]
                    - option "原文に合わせて訂正"
                    - option "不足条件を追加"
                    - option "同条件で操作し再検証"
                    - option "元の正常部分を復元"
                    - option "追加資料を確認するまで保留"
                - paragraph [ref=e139]: 選択内容：変更不要・根拠を維持
              - button "2 根拠を照合" [active] [ref=e140] [cursor=pointer]
              - status [ref=e141]: 固定資料との照合OK。STEP 1の現在の完成条件と、実際に利用できる本文・解説を照合する。
            - group "3. 出典と記述が一致" [ref=e142]:
              - generic [ref=e144]:
                - generic [ref=e145]:
                  - text: 3 判定
                  - combobox "3 判定" [ref=e146]:
                    - option "選んでください"
                    - option "適合" [selected]
                    - option "要改善"
                    - option "情報不足・保留"
                - paragraph [ref=e147]: 選択内容：適合
              - generic [ref=e148]:
                - generic [ref=e149]:
                  - text: 3 根拠
                  - combobox "3 根拠" [ref=e150]:
                    - option "選んでください"
                    - option "AIが『すべて成功』と報告した"
                    - option "見た目がきれいで使えそう"
                    - option "S1「読書室は1924年4月に開室した」と本文が一致" [selected]
                - paragraph [ref=e151]: 選択内容：S1「読書室は1924年4月に開室した」と本文が一致
              - generic [ref=e153]:
                - text: 3 改善案
                - combobox "3 改善案" [ref=e154]:
                  - option "選んでください" [selected]
                  - option "変更不要・根拠を維持"
                  - option "原文に合わせて訂正"
                  - option "不足条件を追加"
                  - option "同条件で操作し再検証"
                  - option "元の正常部分を復元"
                  - option "追加資料を確認するまで保留"
              - button "3 根拠を照合" [ref=e155] [cursor=pointer]
              - status [ref=e156]: 未照合
            - group "4. 資料にない主張がない" [ref=e157]:
              - generic [ref=e160]:
                - text: 4 判定
                - combobox "4 判定" [ref=e161]:
                  - option "選んでください" [selected]
                  - option "適合"
                  - option "要改善"
                  - option "情報不足・保留"
              - generic [ref=e163]:
                - text: 4 根拠
                - combobox "4 根拠" [ref=e164]:
                  - option "選んでください" [selected]
                  - option "資料外の断定は削除されている"
                  - option "見た目がきれいで使えそう"
                  - option "資料を読んでいないが多分正しい"
              - generic [ref=e166]:
                - text: 4 改善案
                - combobox "4 改善案" [ref=e167]:
                  - option "選んでください" [selected]
                  - option "変更不要・根拠を維持"
                  - option "原文に合わせて訂正"
                  - option "不足条件を追加"
                  - option "同条件で操作し再検証"
                  - option "元の正常部分を復元"
                  - option "追加資料を確認するまで保留"
              - button "4 根拠を照合" [ref=e168] [cursor=pointer]
              - status [ref=e169]: 未照合
            - group "5. 数字・日付・名称が正しい" [ref=e170]:
              - generic [ref=e173]:
                - text: 5 判定
                - combobox "5 判定" [ref=e174]:
                  - option "選んでください" [selected]
                  - option "適合"
                  - option "要改善"
                  - option "情報不足・保留"
              - generic [ref=e176]:
                - text: 5 根拠
                - combobox "5 根拠" [ref=e177]:
                  - option "選んでください" [selected]
                  - option "AIが『すべて成功』と報告した"
                  - option "原文の時期・数値「読書室は1924年4月に開室した／開室時の蔵書は120冊」を維持"
                  - option "資料を読んでいないが多分正しい"
              - generic [ref=e179]:
                - text: 5 改善案
                - combobox "5 改善案" [ref=e180]:
                  - option "選んでください" [selected]
                  - option "変更不要・根拠を維持"
                  - option "原文に合わせて訂正"
                  - option "不足条件を追加"
                  - option "同条件で操作し再検証"
                  - option "元の正常部分を復元"
                  - option "追加資料を確認するまで保留"
              - button "5 根拠を照合" [ref=e181] [cursor=pointer]
              - status [ref=e182]: 未照合
            - group "6. 制作指示に従う" [ref=e183]:
              - generic [ref=e186]:
                - text: 6 判定
                - combobox "6 判定" [ref=e187]:
                  - option "選んでください" [selected]
                  - option "適合"
                  - option "要改善"
                  - option "情報不足・保留"
              - generic [ref=e189]:
                - text: 6 根拠
                - combobox "6 根拠" [ref=e190]:
                  - option "選んでください" [selected]
                  - option "AIが『すべて成功』と報告した"
                  - option "見た目がきれいで使えそう"
                  - option "制作指示の対象・形式・根拠・完成条件を確認できる"
              - generic [ref=e192]:
                - text: 6 改善案
                - combobox "6 改善案" [ref=e193]:
                  - option "選んでください" [selected]
                  - option "変更不要・根拠を維持"
                  - option "原文に合わせて訂正"
                  - option "不足条件を追加"
                  - option "同条件で操作し再検証"
                  - option "元の正常部分を復元"
                  - option "追加資料を確認するまで保留"
              - button "6 根拠を照合" [ref=e194] [cursor=pointer]
              - status [ref=e195]: 未照合
            - group "7. 修正で正常部分を維持" [ref=e196]:
              - generic [ref=e199]:
                - text: 7 判定
                - combobox "7 判定" [ref=e200]:
                  - option "選んでください" [selected]
                  - option "適合"
                  - option "要改善"
                  - option "情報不足・保留"
              - generic [ref=e202]:
                - text: 7 根拠
                - combobox "7 根拠" [ref=e203]:
                  - option "選んでください" [selected]
                  - option "初版のタイトル・正しい事実・選択肢と正常な動作を維持"
                  - option "見た目がきれいで使えそう"
                  - option "資料を読んでいないが多分正しい"
              - generic [ref=e205]:
                - text: 7 改善案
                - combobox "7 改善案" [ref=e206]:
                  - option "選んでください" [selected]
                  - option "変更不要・根拠を維持"
                  - option "原文に合わせて訂正"
                  - option "不足条件を追加"
                  - option "同条件で操作し再検証"
                  - option "元の正常部分を復元"
                  - option "追加資料を確認するまで保留"
              - button "7 根拠を照合" [ref=e207] [cursor=pointer]
              - status [ref=e208]: 未照合
            - group "8. 実際に操作できる" [ref=e209]:
              - generic [ref=e212]:
                - text: 8 判定
                - combobox "8 判定" [ref=e213]:
                  - option "選んでください" [selected]
                  - option "適合"
                  - option "要改善"
                  - option "情報不足・保留"
              - generic [ref=e215]:
                - text: 8 根拠
                - combobox "8 根拠" [ref=e216]:
                  - option "選んでください" [selected]
                  - option "AIが『すべて成功』と報告した"
                  - option "未回答・正答・誤答の3条件で結果と解説が出る"
                  - option "資料を読んでいないが多分正しい"
              - generic [ref=e218]:
                - text: 8 改善案
                - combobox "8 改善案" [ref=e219]:
                  - option "選んでください" [selected]
                  - option "変更不要・根拠を維持"
                  - option "原文に合わせて訂正"
                  - option "不足条件を追加"
                  - option "同条件で操作し再検証"
                  - option "元の正常部分を復元"
                  - option "追加資料を確認するまで保留"
              - button "8 根拠を照合" [ref=e220] [cursor=pointer]
              - status [ref=e221]: 未照合
            - group "9. 個人情報・機密情報がない" [ref=e222]:
              - generic [ref=e225]:
                - text: 9 判定
                - combobox "9 判定" [ref=e226]:
                  - option "選んでください" [selected]
                  - option "適合"
                  - option "要改善"
                  - option "情報不足・保留"
              - generic [ref=e228]:
                - text: 9 根拠
                - combobox "9 根拠" [ref=e229]:
                  - option "選んでください" [selected]
                  - option "AIが『すべて成功』と報告した"
                  - option "見た目がきれいで使えそう"
                  - option "表示は教材専用の架空資料と固定値だけで個人・機密データはない"
              - generic [ref=e231]:
                - text: 9 改善案
                - combobox "9 改善案" [ref=e232]:
                  - option "選んでください" [selected]
                  - option "変更不要・根拠を維持"
                  - option "原文に合わせて訂正"
                  - option "不足条件を追加"
                  - option "同条件で操作し再検証"
                  - option "元の正常部分を復元"
                  - option "追加資料を確認するまで保留"
              - button "9 根拠を照合" [ref=e233] [cursor=pointer]
              - status [ref=e234]: 未照合
            - group "10. 未確認事項・制約を説明" [ref=e235]:
              - generic [ref=e238]:
                - text: 10 判定
                - combobox "10 判定" [ref=e239]:
                  - option "選んでください" [selected]
                  - option "適合"
                  - option "要改善"
                  - option "情報不足・保留"
              - generic [ref=e241]:
                - text: 10 根拠
                - combobox "10 根拠" [ref=e242]:
                  - option "選んでください" [selected]
                  - option "限界「この町の2史料だけでは全国初かは分からない」。本文と原資料から説明できる"
                  - option "見た目がきれいで使えそう"
                  - option "資料を読んでいないが多分正しい"
              - generic [ref=e244]:
                - text: 10 改善案
                - combobox "10 改善案" [ref=e245]:
                  - option "選んでください" [selected]
                  - option "変更不要・根拠を維持"
                  - option "原文に合わせて訂正"
                  - option "不足条件を追加"
                  - option "同条件で操作し再検証"
                  - option "元の正常部分を復元"
                  - option "追加資料を確認するまで保留"
              - button "10 根拠を照合" [ref=e246] [cursor=pointer]
              - status [ref=e247]: 未照合
            - paragraph [ref=e248]: 現在の版で根拠を照合できた項目：2/10。適合と保留は別です。
          - complementary "課題と資料" [ref=e249]:
            - heading "今回の課題" [level=3] [ref=e250]
            - paragraph [ref=e251]: 架空の青葉町・読書室の歩み
            - paragraph [ref=e252]: 史料が示す範囲で町の読書室を紹介する
            - paragraph [ref=e253]: 小さなWeb展示・確認問題／テーマの初学者
            - heading "完成条件" [level=4] [ref=e254]
            - list [ref=e255]:
              - listitem [ref=e256]: 原文と出典IDを示す
              - listitem [ref=e257]: 不明点と対象範囲を明示
              - listitem [ref=e258]: 確認問題と解説を付ける
            - generic [ref=e259]:
              - paragraph [ref=e260]: 全資料は教材用の架空資料・実在しません
              - group [ref=e261]:
                - generic "S1 青葉町読書室 開室記録（架空）" [ref=e262] [cursor=pointer]
                - paragraph [ref=e263]: 作成者：教材内の架空記録者／作成日：1924-04-05／対象：このテーマの記録のみ
                - blockquote [ref=e264]: 1924年4月、町の読書室を開く。開室時の蔵書は120冊。全国の施設との比較は行っていない。
              - group [ref=e265]:
                - generic "S2 受入帳の抜粋（架空）" [ref=e266] [cursor=pointer]
                - paragraph [ref=e267]: 作成者：教材内の架空記録者／作成日：1924-04-06／対象：このテーマの記録のみ
                - blockquote [ref=e268]: 1924年4月6日現在、蔵書120冊。貸出人数やその後の増加率は記録していない。
              - group [ref=e269]:
                - generic "S3 出所不明のメモ（架空）" [ref=e270] [cursor=pointer]
            - paragraph [ref=e271]: 第3・4章：調査と資料整理、第6章：試作と検証、第9章：再利用する指示の考え方を応用。Skillsでこれらの機能が自動実行されるとは案内しません。
        - region "組み立てた指示文" [ref=e272]:
          - heading "指示文を読み、足りない条件を確認" [level=3] [ref=e273]
          - generic [ref=e274]:
            - text: 指示文全文
            - textbox "指示文全文" [ref=e275]: テーマ：架空の青葉町・読書室の歩み 目的：史料が示す範囲で町の読書室を紹介する 対象読者：テーマの初学者（地域史を初めて読む人） 形式：小さなWeb展示・確認問題 完成条件：原文と出典IDを示す／不明点と対象範囲を明示／確認問題と解説を付ける 問題：初版の日付はS1と不一致、資料外の断定と条件不足。修正版1では確認ボタンが反応しなくなった。 期待結果：S1/S2に合う事実に訂正し、限界・出典を表示。確認問題の選択後に判定と解説を表示。 維持条件：目的・読者・タイトル・正しい事実・出典ID・選択肢を保持。 同じ入力で初版と修正版を比較し、未回答・正答・誤答の動作と全完成条件を再検証。AIの成功報告だけで完了にしない。
          - button "指示文全文をコピー" [ref=e276] [cursor=pointer]
          - status
          - paragraph [ref=e277]: 失敗時は全文を選択して手動コピー。表示・条件・工程の変更後は古い通知を引き継ぎません。OSへの書込み自体は取消できません。
        - generic [ref=e278]:
          - heading "段階的ヒント（任意）" [level=3] [ref=e279]
          - button "ヒントを1段階開く" [ref=e280] [cursor=pointer]
        - generic [ref=e281]:
          - button "この工程の固定課題を確認" [ref=e282] [cursor=pointer]
          - status [ref=e283]: 再修正版を表示しました。成功報告でなく原文と3つの入力で再検証してください。
          - button "この工程から再挑戦" [ref=e284] [cursor=pointer]
          - paragraph [ref=e285]: 現在の模擬確認：STEP 1／STEP 2／STEP 3／STEP 4／STEP 5。過去の達成履歴：6件。過去のコピー履歴：0件。実操作自己申告：0/8工程。成果物自己評価：0/6軸。
        - generic [ref=e286]:
          - button "← 前の工程" [ref=e287] [cursor=pointer]
          - button "次の工程 →" [ref=e288] [cursor=pointer]
        - generic [ref=e289]:
          - paragraph [ref=e290]: 第10章だけの初期化は専用記録と第10章の完了を対象にします。下部の「進捗を初期化」は従来どおり全章の完了だけを対象にし、専用記録を消しません。
          - button "第10章の記録だけを初期化" [ref=e291] [cursor=pointer]
      - generic [ref=e292]:
        - heading "利用条件・公式参考情報" [level=2] [ref=e293]
        - paragraph [ref=e294]: 固定模擬だけで学習可能。実Deep Researchは18歳以上・ログインが必要。Notebook系の接続・アクティビティ設定・段階提供やプラン・地域・組織で条件が異なります。個別アカウントでの利用可否は未確認です。
        - list [ref=e295]:
          - listitem [ref=e296]: "章題はIssue #1に基づく教材上の名称です。最新の公式名称・画面表示を保証しません。"
          - listitem [ref=e297]: 機密情報・個人情報を練習に入力しないでください。
        - paragraph [ref=e298]:
          - link "Deep Researchの計画・上限・コピー ↗（別タブ）" [ref=e299]:
            - /url: https://support.google.com/gemini/answer/15719111?co=GENIE.Platform%3DDesktop&hl=ja
        - paragraph [ref=e300]:
          - link "Gemini内ノートブック・接続と同期条件 ↗（別タブ）" [ref=e301]:
            - /url: https://support.google.com/gemini/answer/16972047?co=GENIE.Platform%3DDesktop&hl=ja
        - paragraph [ref=e302]:
          - link "Notebook系の資料追加・コピーしたテキスト ↗（別タブ）" [ref=e303]:
            - /url: https://support.google.com/gemininotebook/answer/16215270?hl=ja
        - paragraph [ref=e304]:
          - link "Canvasの制作・修正・版の確認 ↗（別タブ）" [ref=e305]:
            - /url: https://support.google.com/gemini/answer/16047321?co=GENIE.Platform%3DDesktop&hl=ja
        - paragraph [ref=e306]: 情報確認状況：2026-11-06：Google公式本文を確認。実Google操作・日本語の実UI・個別権限は未検証。
    - region "学習進捗" [ref=e307]:
      - generic [ref=e308]:
        - heading "あなたの学習進捗" [level=2] [ref=e309]
        - strong [ref=e310]: 0 / 10章
      - progressbar "全10章の完了数" [ref=e311]
      - paragraph [ref=e312]: 全10章を自分のペースで学びましょう。 学習できる章：10章
      - button "進捗を初期化" [ref=e313] [cursor=pointer]
    - status [ref=e314]
  - contentinfo [ref=e315]:
    - strong [ref=e316]: Gemini活用 虎の巻
    - paragraph [ref=e317]: Googleが提供・監修するものではない、非公式の学習教材です。Googleのロゴ・公式画像は使用していません。
    - 'link "教材の仕様・更新状況（Issue #1）" [ref=e318]':
      - /url: https://github.com/tetsujisugimori-coder/gemini-toranomaki/issues/1
```

# Test source

```ts
  9   |   p.evaluate(
  10  |     (key) => JSON.parse(localStorage.getItem(key) || "{}"),
  11  |     capstoneKey,
  12  |   );
  13  | async function step(p: Page, n: number) {
  14  |   await select(p, "総合演習の工程").selectOption(String(n));
  15  |   await expect(p.locator("#capstone-heading")).toHaveText(
  16  |     new RegExp(`^STEP ${n} `),
  17  |   );
  18  | }
  19  | async function confirm(p: Page) {
  20  |   await button(p, "この工程の固定課題を確認").click();
  21  |   await expect(
  22  |     p
  23  |       .locator(".capstone")
  24  |       .getByRole("status")
  25  |       .filter({ hasText: "この工程の固定課題を確認できました" }),
  26  |   ).toBeVisible();
  27  | }
  28  | async function candidate(p: Page, topic: Topic = "history") {
  29  |   await p.goto("#chapter-10");
  30  |   await step(p, 1);
  31  |   await select(p, "演習テーマ").selectOption(topic);
  32  |   await confirm(p);
  33  |   await step(p, 2);
  34  |   await select(p, "計画を見る前の予想").selectOption("1");
  35  |   for (const name of [
  36  |     "目的と対象読者",
  37  |     "対象時期・調査範囲",
  38  |     "一次資料と原文の確認",
  39  |     "不明点・反証の確認",
  40  |   ])
  41  |     await p.getByLabel(name, { exact: true }).check();
  42  |   await button(p, "模擬調査を実行").click();
  43  |   for (const [i, n] of [1, 2, 0].entries())
  44  |     await select(p, `主張${i + 1}と原文の関係`).selectOption(String(n));
  45  |   await confirm(p);
  46  |   await step(p, 3);
  47  |   await p.getByLabel("S3 出所不明のメモ", { exact: true }).check();
  48  |   await button(p, "変更前の回答を残す").click();
  49  |   await p.getByLabel("S3 出所不明のメモ", { exact: true }).uncheck();
  50  |   await button(p, "資料変更の比較を記録").click();
  51  |   await select(p, "Notebookの誤回答への判断").selectOption("2");
  52  |   await confirm(p);
  53  |   await step(p, 4);
  54  |   for (const name of [
  55  |     "目的・読者・形式",
  56  |     "選択資料と引用・原文照合",
  57  |     "完成条件と未確認事項",
  58  |     "変更箇所・維持条件・動作確認",
  59  |   ])
  60  |     await p.getByLabel(name, { exact: true }).check();
  61  |   await expect(
  62  |     p.getByRole("textbox", { name: "指示文全文", exact: true }),
  63  |   ).toHaveValue(new RegExp(topicFor(topic).purpose));
  64  |   await button(p, "固定初版を制作して比較する").click();
  65  |   await confirm(p);
  66  | }
  67  | async function trial(p: Page, v: Version, topic: Topic = "history") {
  68  |   const region = p.getByRole("region", {
  69  |       name: `${v === "initial" ? "初版" : v === "repair" ? "修正版1（退行あり）" : "再修正版"}の成果物`,
  70  |       exact: true,
  71  |     }),
  72  |     t = topicFor(topic);
  73  |   await region
  74  |     .getByRole("button", { name: "回答を未選択に戻す", exact: true })
  75  |     .click();
  76  |   await region.getByRole("button", { name: "回答を確認", exact: true }).click();
  77  |   if (v !== "repair")
  78  |     await expect(region.getByRole("status")).toHaveText(
  79  |       "回答を選んでください。",
  80  |     );
  81  |   for (const answer of t.options) {
  82  |     await region.getByLabel(answer, { exact: true }).check();
  83  |     await region
  84  |       .getByRole("button", { name: "回答を確認", exact: true })
  85  |       .click();
  86  |   }
  87  |   await expect(region.getByRole("status")).toHaveText(
  88  |     v === "repair"
  89  |       ? "（結果未表示）"
  90  |       : `正解。S1では${t.answer}と確認できます。`,
  91  |   );
  92  | }
  93  | async function quality(p: Page, v: Version) {
  94  |   const verdict =
  95  |       v === "initial"
  96  |         ? [0, 1, 1, 1, 1, 1, 2, 0, 0, 1]
  97  |         : v === "repair"
  98  |           ? [0, 1, 0, 0, 0, 1, 1, 1, 0, 0]
  99  |           : Array(10).fill(0),
  100 |     improvement =
  101 |       v === "initial"
  102 |         ? [0, 2, 1, 1, 1, 2, 3, 0, 0, 2]
  103 |         : v === "repair"
  104 |           ? [0, 3, 0, 0, 0, 3, 4, 3, 0, 0]
  105 |           : Array(10).fill(0);
  106 |   for (let i = 0; i < 10; i++) {
  107 |     await select(p, `${i + 1} 判定`).selectOption(String(verdict[i]));
  108 |     await select(p, `${i + 1} 根拠`).selectOption(String(i % 3));
> 109 |     await select(p, `${i + 1} 改善案`).selectOption(String(improvement[i]));
      |                                     ^ Error: locator.selectOption: Test timeout of 30000ms exceeded.
  110 |     await button(p, `${i + 1} 根拠を照合`).click();
  111 |   }
  112 |   await expect(
  113 |     p
  114 |       .locator(".cap-quality")
  115 |       .getByRole("status")
  116 |       .filter({ hasText: "固定資料との照合OK" }),
  117 |   ).toHaveCount(10);
  118 | }
  119 | for (const topic of ["history", "education", "business"] as const)
  120 |   test(`end-to-end ${topic}: plan, sources, production, broken repair, retest and reflection`, async ({
  121 |     page,
  122 |   }) => {
  123 |     await candidate(page, topic);
  124 |     await step(page, 5);
  125 |     await trial(page, "initial", topic);
  126 |     await quality(page, "initial");
  127 |     await confirm(page);
  128 |     await step(page, 6);
  129 |     await button(page, "修正指示を適用").click();
  130 |     await expect(
  131 |       page
  132 |         .locator(".capstone")
  133 |         .getByRole("status")
  134 |         .filter({ hasText: "曖昧な指示" }),
  135 |     ).toBeVisible();
  136 |     await select(page, "修正指示の具体性").selectOption("1");
  137 |     await expect(
  138 |       page.getByRole("textbox", { name: "指示文全文", exact: true }),
  139 |     ).toHaveValue(/維持条件/);
  140 |     await button(page, "修正指示を適用").click();
  141 |     await trial(page, "repair", topic);
  142 |     await quality(page, "repair");
  143 |     await button(page, "退行も直した再修正版を確認").click();
  144 |     await trial(page, "final", topic);
  145 |     await quality(page, "final");
  146 |     await confirm(page);
  147 |     await button(page, "この工程から再挑戦").click();
  148 |     expect((await saved(page)).trials).toEqual(["initial"]);
  149 |     expect((await saved(page)).achieved).toContain(5);
  150 |     await select(page, "修正指示の具体性").selectOption("1");
  151 |     await button(page, "修正指示を適用").click();
  152 |     await trial(page, "repair", topic);
  153 |     await quality(page, "repair");
  154 |     await button(page, "退行も直した再修正版を確認").click();
  155 |     await trial(page, "final", topic);
  156 |     await quality(page, "final");
  157 |     await confirm(page);
  158 |     await step(page, 7);
  159 |     for (const axis of [
  160 |       "課題設定の明確さ",
  161 |       "調査と根拠の正確性",
  162 |       "資料整理の適切さ",
  163 |       "成果物の完成度",
  164 |       "問題発見・修正能力",
  165 |       "自分で説明できる理解度",
  166 |     ]) {
  167 |       await select(page, `${axis}の自己評価`).selectOption("1");
  168 |       await select(page, `${axis}の評価理由`).selectOption("1");
  169 |     }
  170 |     await page
  171 |       .getByRole("textbox", {
  172 |         name: "次に試すこと・自分の言葉で振り返る（保存しません）",
  173 |       })
  174 |       .fill("保存しない振り返り");
  175 |     await confirm(page);
  176 |     await page.getByLabel("第10章の学習完了を自己申告する").check();
  177 |     expect(JSON.stringify(await saved(page))).not.toContain(
  178 |       "保存しない振り返り",
  179 |     );
  180 |     await page.reload();
  181 |     await expect(page.locator("#capstone-heading")).toContainText("STEP 7");
  182 |     await expect(
  183 |       page.getByLabel("第10章の学習完了を自己申告する"),
  184 |     ).toBeChecked();
  185 |     await expect(
  186 |       page.getByRole("textbox", {
  187 |         name: "次に試すこと・自分の言葉で振り返る（保存しません）",
  188 |       }),
  189 |     ).toHaveValue("");
  190 |   });
  191 | test("all transitions, hints, environment modes, optional external reports and keyboard focus", async ({
  192 |   page,
  193 | }) => {
  194 |   await page.goto("#chapter-10");
  195 |   await expect(button(page, "← 前の工程")).toBeDisabled();
  196 |   for (let i = 0; i < 4; i++) {
  197 |     await select(page, "教材とサービスの配置").selectOption(String(i));
  198 |     await expect(page.locator(".cap-main")).toContainText(
  199 |       ["標準分割", "左右に並べ", "別タブ", "外部アプリ"][i],
  200 |     );
  201 |   }
  202 |   await select(page, "演習方法").selectOption("1");
  203 |   await select(page, "STEP 0 実サービスの現在の自己申告").selectOption("2");
  204 |   expect((await saved(page)).achieved).toEqual([]);
  205 |   for (const link of await page
  206 |     .getByRole("navigation", { name: "総合演習の外部サービス" })
  207 |     .getByRole("link")
  208 |     .all()) {
  209 |     await expect(link).toHaveAttribute("target", "_blank");
```