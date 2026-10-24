import { useEffect, useRef, useState } from "react";
import { Research } from "./Research";
import { Notebook } from "./Notebook";
import { OfficialStudy } from "./StudyShared";
import type { TopicId } from "./study-data";
import {
  freshNotebook,
  freshResearch,
  loadNotebook,
  loadResearch,
  notebookKey,
  reconcileNotebook,
  removeStudy,
  researchKey,
  saveStudy,
  transferNotebook,
  type NotebookRecord,
  type ResearchRecord,
} from "./study-storage";
export function StudyChapters({
  chapter,
  completed,
  onComplete,
}: {
  chapter: 3 | 4;
  completed: boolean;
  onComplete: (value: boolean) => boolean;
}) {
  const [boot] = useState(() => {
    const r = loadResearch(),
      n = loadNotebook();
    return { r, n, notebook: reconcileNotebook(n.record, r.record) };
  });
  const [research, setResearch] = useState(boot.r.record),
    [notebook, setNotebook] = useState(boot.notebook);
  const latestResearch = useRef(research),
    latestNotebook = useRef(notebook);
  const [researchAvailable, setResearchAvailable] = useState(boot.r.available),
    [notebookAvailable, setNotebookAvailable] = useState(boot.n.available);
  const [resetting, setResetting] = useState(false),
    [researchReset, setResearchReset] = useState(0),
    [notebookReset, setNotebookReset] = useState(0);
  const [message, setMessage] = useState("");
  const resetButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    setResetting(false);
    setMessage("");
  }, [chapter]);
  function commitNotebook(next: NotebookRecord) {
    latestNotebook.current = next;
    setNotebook(next);
    const ok = saveStudy(notebookKey, next);
    setNotebookAvailable(ok);
    return ok;
  }
  function updateResearch(patch: Partial<ResearchRecord>, context = false) {
    const next = {
      ...latestResearch.current,
      ...patch,
      ...(context ? { revision: crypto.randomUUID(), copied: false } : {}),
    };
    latestResearch.current = next;
    setResearch(next);
    setResearchAvailable(saveStudy(researchKey, next));
    const linked = reconcileNotebook(latestNotebook.current, next);
    if (linked !== latestNotebook.current) commitNotebook(linked);
  }
  function updateNotebook(patch: Partial<NotebookRecord>) {
    commitNotebook({ ...latestNotebook.current, ...patch });
  }
  function researchTopic(id: TopicId) {
    updateResearch(freshResearch(id), true);
  }
  function notebookTopic(id: TopicId) {
    commitNotebook(freshNotebook(id));
  }
  function transfer() {
    const next = transferNotebook(latestResearch.current);
    if (!next) {
      setMessage(
        "まだ検証が済んでいません。計画・出典・レポートを見直してください。",
      );
      return;
    }
    commitNotebook(next);
    location.hash = "chapter-4";
  }
  function reset() {
    setMessage("");
    let ok: boolean;
    if (chapter === 3) {
      const next = freshResearch();
      latestResearch.current = next;
      setResearch(next);
      setResearchReset((n) => n + 1);
      ok = removeStudy(researchKey);
      setResearchAvailable(ok);
      const linked = reconcileNotebook(latestNotebook.current, next);
      if (linked !== latestNotebook.current) ok = commitNotebook(linked) && ok;
    } else {
      const next = freshNotebook();
      latestNotebook.current = next;
      setNotebook(next);
      setNotebookReset((n) => n + 1);
      ok = removeStudy(notebookKey);
      setNotebookAvailable(ok);
    }
    const completionSaved = onComplete(false);
    setResetting(false);
    requestAnimationFrame(() => resetButton.current?.focus());
    setMessage(
      ok && completionSaved
        ? `第${chapter}章の記録と章完了を初期化しました。`
        : `画面内の第${chapter}章を初期化しましたが、保存領域の更新に失敗しました。再読み込みで古い記録が復活する可能性があります。`,
    );
  }
  return (
    <div className="study-chapters">
      <aside className="notice">
        <strong>教材内シミュレーション</strong>
        <p>
          資料・統計・論文・レポートはすべて教材用の模擬資料です。実在する情報の証明ではありません。Googleアカウントや実ファイルは変更・送信しません。
        </p>
      </aside>
      <OfficialStudy chapter={chapter} />
      {!researchAvailable && (
        <p role="status" className="notice">
          第3章の記録を保存できません。この画面内では続けられますが、移動・再読み込みで失われる場合があります。
        </p>
      )}
      {!notebookAvailable && (
        <p role="status" className="notice">
          第4章の記録を保存できません。引継ぎもこの画面内の一時状態です。移動・再読み込みで古い記録が復活する場合があります。
        </p>
      )}
      {chapter === 3 ? (
        <Research
          key={researchReset}
          record={research}
          onUpdate={updateResearch}
          onTopic={researchTopic}
          onTransfer={transfer}
        />
      ) : (
        <Notebook
          key={notebookReset}
          record={notebook}
          onUpdate={updateNotebook}
          onTopic={notebookTopic}
        />
      )}
      <section className="panel" aria-label={`第${chapter}章の学習記録`}>
        <h2>第{chapter}章の学習記録</h2>
        <p>
          模擬問題の回答・コピー成功と章完了は別です。実サービスを使わなくても学習できます。
        </p>
        <label className="option">
          <input
            type="checkbox"
            checked={completed}
            onChange={(e) => onComplete(e.target.checked)}
          />
          第{chapter}章の学習を完了した（自己申告）
        </label>
        <p className="small">
          この章の個別初期化は固定選択と章完了を消します。他章の完了やラボ・探索は消しません。第3章の初期化では、そこから引き継いだ第4章の古い資料と回答だけは無効化します。全体の「進捗を初期化」は従来どおり章完了だけが対象です。
        </p>
        {resetting ? (
          <>
            <p>第{chapter}章の記録を初期化しますか？</p>
            <div className="lab-actions">
              <button onClick={reset}>第{chapter}章を初期化する</button>
              <button
                onClick={() => {
                  setResetting(false);
                  requestAnimationFrame(() => resetButton.current?.focus());
                }}
              >
                キャンセル
              </button>
            </div>
          </>
        ) : (
          <button ref={resetButton} onClick={() => setResetting(true)}>
            第{chapter}章の記録だけを初期化
          </button>
        )}
      </section>
      <p className="feedback" role="status">
        {message}
      </p>
      <div className="lab-actions">
        <a href="#chapter-3">第3章：調査と検証へ</a>
        <a href="#chapter-4">第4章：Notebookで学ぶ</a>
      </div>
    </div>
  );
}
