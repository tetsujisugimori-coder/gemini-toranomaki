export const progressKey = "gemini-toranomaki:progress:v1";
export interface Progress {
  completed: string[];
}
export function loadProgress(): { progress: Progress; available: boolean } {
  try {
    const raw = localStorage.getItem(progressKey);
    const data: unknown = raw ? JSON.parse(raw) : null;
    const completed =
      data &&
      typeof data === "object" &&
      "completed" in data &&
      Array.isArray(data.completed)
        ? data.completed.filter(
            (id: unknown): id is string =>
              id === "chapter-1" ||
              id === "chapter-2" ||
              id === "chapter-3" ||
              id === "chapter-4" ||
              id === "chapter-5",
          )
        : [];
    return {
      progress: { completed: [...new Set(completed)] },
      available: true,
    };
  } catch {
    return { progress: { completed: [] }, available: false };
  }
}
export function saveProgress(progress: Progress): boolean {
  try {
    localStorage.setItem(progressKey, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}
// false means persisted data may remain; callers must not report deletion success.
export function resetProgress(): boolean {
  try {
    localStorage.removeItem(progressKey);
    return true;
  } catch {
    return false;
  }
}
