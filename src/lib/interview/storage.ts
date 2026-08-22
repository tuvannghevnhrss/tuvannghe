import type { InterviewHistoryItem, InterviewResultPayload } from "./types";

const RESULT_KEY_PREFIX = "interview-local-result:";
const DRAFT_KEY_PREFIX = "interview-local-draft:";

function getStorages() {
  if (typeof window === "undefined") return [] as Storage[];
  return [window.localStorage, window.sessionStorage];
}

export function getLocalInterviewResultKey(id: string) {
  return `${RESULT_KEY_PREFIX}${id}`;
}

export function getLocalInterviewDraftKey(id: string) {
  return `${DRAFT_KEY_PREFIX}${id}`;
}

export function saveLocalInterviewResult(result: InterviewResultPayload) {
  if (typeof window === "undefined") return;
  const normalizedResult = {
    ...result,
    createdAt: result.createdAt ?? new Date().toISOString(),
  };
  const serialized = JSON.stringify(normalizedResult);
  window.localStorage.setItem(getLocalInterviewResultKey(result.id), serialized);
  window.sessionStorage.setItem(getLocalInterviewResultKey(result.id), serialized);
}

export function saveLocalInterviewDraft(item: InterviewHistoryItem) {
  if (typeof window === "undefined") return;
  const serialized = JSON.stringify(item);
  window.localStorage.setItem(getLocalInterviewDraftKey(item.id), serialized);
  window.sessionStorage.setItem(getLocalInterviewDraftKey(item.id), serialized);
}

export function removeLocalInterviewDraft(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(getLocalInterviewDraftKey(id));
  window.sessionStorage.removeItem(getLocalInterviewDraftKey(id));
}

export function readLocalInterviewResult(id: string): InterviewResultPayload | null {
  if (typeof window === "undefined") return null;

  for (const storage of getStorages()) {
    const raw = storage.getItem(getLocalInterviewResultKey(id));
    if (!raw) continue;

    try {
      return JSON.parse(raw) as InterviewResultPayload;
    } catch {
      // Continue checking other storage.
    }
  }

  return null;
}

export function listLocalInterviewResults() {
  if (typeof window === "undefined") return [] as InterviewResultPayload[];

  const items = new Map<string, InterviewResultPayload>();

  for (const storage of getStorages()) {
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (!key?.startsWith(RESULT_KEY_PREFIX)) continue;

      const raw = storage.getItem(key);
      if (!raw) continue;

      try {
        const parsed = JSON.parse(raw) as InterviewResultPayload;
        items.set(parsed.id, parsed);
      } catch {
        // Ignore malformed local results.
      }
    }
  }

  return [...items.values()].sort((left, right) => {
    const leftTime = new Date(left.createdAt ?? 0).getTime();
    const rightTime = new Date(right.createdAt ?? 0).getTime();
    return rightTime - leftTime;
  });
}

export function listLocalInterviewDrafts() {
  if (typeof window === "undefined") return [] as InterviewHistoryItem[];

  const items = new Map<string, InterviewHistoryItem>();

  for (const storage of getStorages()) {
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (!key?.startsWith(DRAFT_KEY_PREFIX)) continue;

      const raw = storage.getItem(key);
      if (!raw) continue;

      try {
        const parsed = JSON.parse(raw) as InterviewHistoryItem;
        items.set(parsed.id, parsed);
      } catch {
        // Ignore malformed local drafts.
      }
    }
  }

  return [...items.values()].sort((left, right) => {
    const leftTime = new Date(left.createdAt ?? 0).getTime();
    const rightTime = new Date(right.createdAt ?? 0).getTime();
    return rightTime - leftTime;
  });
}
