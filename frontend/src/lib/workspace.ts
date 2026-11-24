// Workspace identifiers scope this local demo; they are not authentication tokens.
export const workspaceCookie = 'avenra-workspace';
export const rememberedWorkspacesKey = 'avenra-workspaces';

export function validWorkspaceId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-zA-Z0-9-]{1,40}$/.test(value);
}

export function currentWorkspaceId(): string {
  const value = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${workspaceCookie}=`))
    ?.slice(workspaceCookie.length + 1);
  if (!validWorkspaceId(value))
    throw new Error('Workspace unavailable. Reload the page before saving.');
  return value;
}

export function selectWorkspace(id: string): void {
  if (!validWorkspaceId(id)) throw new Error('Invalid workspace.');
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${workspaceCookie}=${id}; Path=/; SameSite=Strict; Max-Age=31536000${secure}`;
}

export function clearWorkspaceCookie(): void {
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${workspaceCookie}=; Path=/; SameSite=Strict; Max-Age=0${secure}`;
}

export function removeRememberedWorkspace(id: string): void {
  try {
    const stored = JSON.parse(
      localStorage.getItem(rememberedWorkspacesKey) ?? '[]',
    );
    if (!Array.isArray(stored)) return;
    const next = stored.filter(
      (entry: unknown) =>
        entry &&
        typeof entry === 'object' &&
        (entry as { id?: unknown }).id !== id,
    );
    localStorage.setItem(rememberedWorkspacesKey, JSON.stringify(next));
  } catch {
    /* Storage access is optional. */
  }
}

export function clearLocalBrowserData(): void {
  try {
    const prefixes = [
      rememberedWorkspacesKey,
      'avenra-plan-draft:',
      'avenra-focus-session-v1:',
      'avenra-start-draft-v1',
    ];
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && prefixes.some((prefix) => key.startsWith(prefix))) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    /* Storage access is optional. */
  }
}
