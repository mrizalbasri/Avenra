// Workspace identifiers scope this local demo; they are not authentication tokens.
export const workspaceCookie = 'avenra-workspace';

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
