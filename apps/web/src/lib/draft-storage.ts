/**
 * Draft storage utility for offline/resume filling.
 * Persists form data to localStorage with key pattern `draft:{projectId}:{moduleCode}`.
 */

const DRAFT_PREFIX = "draft:";

export interface DraftMetadata {
  projectId: string;
  moduleCode: string;
  savedAt: number; // unix timestamp ms
}

export interface DraftEntry<T = unknown> {
  data: T;
  metadata: DraftMetadata;
}

function buildKey(projectId: string, moduleCode: string): string {
  return `${DRAFT_PREFIX}${projectId}:${moduleCode}`;
}

/**
 * Save form data as a draft to localStorage.
 */
export function saveDraft<T = unknown>(
  projectId: string,
  moduleCode: string,
  data: T,
): void {
  if (typeof window === "undefined") return;

  const entry: DraftEntry<T> = {
    data,
    metadata: {
      projectId,
      moduleCode,
      savedAt: Date.now(),
    },
  };

  try {
    localStorage.setItem(buildKey(projectId, moduleCode), JSON.stringify(entry));
  } catch {
    // localStorage might be full — silently ignore
  }
}

/**
 * Load a saved draft from localStorage.
 * Returns null if no draft exists.
 */
export function loadDraft<T = unknown>(
  projectId: string,
  moduleCode: string,
): DraftEntry<T> | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(buildKey(projectId, moduleCode));
    if (!raw) return null;
    return JSON.parse(raw) as DraftEntry<T>;
  } catch {
    return null;
  }
}

/**
 * Clear a saved draft after successful save to server.
 */
export function clearDraft(projectId: string, moduleCode: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(buildKey(projectId, moduleCode));
  } catch {
    // ignore
  }
}

/**
 * Check if a draft exists for the given project and module.
 */
export function hasDraft(projectId: string, moduleCode: string): boolean {
  if (typeof window === "undefined") return false;

  try {
    return localStorage.getItem(buildKey(projectId, moduleCode)) !== null;
  } catch {
    return false;
  }
}

/**
 * List all saved drafts with metadata.
 */
export function getAllDrafts(): DraftEntry[] {
  if (typeof window === "undefined") return [];

  const drafts: DraftEntry[] = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(DRAFT_PREFIX)) continue;

      const raw = localStorage.getItem(key);
      if (!raw) continue;

      try {
        const entry = JSON.parse(raw) as DraftEntry;
        drafts.push(entry);
      } catch {
        // skip malformed entries
      }
    }
  } catch {
    // ignore
  }

  return drafts.sort((a, b) => b.metadata.savedAt - a.metadata.savedAt);
}
