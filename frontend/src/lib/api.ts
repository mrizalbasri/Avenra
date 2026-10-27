import { PUBLIC_API_BASE_URL } from '$app/env/public';
import { currentWorkspaceId, selectWorkspace } from '#lib/workspace.js';

export async function requestApi<T>(
  fetcher: typeof fetch,
  path: string,
  workspaceId: string,
  method = 'GET',
  body?: unknown,
): Promise<T> {
  let response: Response;
  try {
    response = await fetcher(`${PUBLIC_API_BASE_URL}/api/v1/${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Workspace-ID': workspaceId,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new Error(
      'Cannot reach the API. Your changes have not been saved. Retry when the service is available.',
    );
  }
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      typeof data.detail === 'string'
        ? data.detail
        : Array.isArray(data.detail)
          ? data.detail
              .map(
                (issue: { loc?: (string | number)[]; msg?: string }) =>
                  `${issue.loc?.slice(1).join('.') || 'Input'}: ${issue.msg || 'Invalid value'}`,
              )
              .join(' ')
          : 'Check the input fields and try again.',
    );
  return data as T;
}

export async function api<T>(
  path: string,
  method = 'GET',
  body?: unknown,
): Promise<T> {
  const workspaceId =
    path === 'workspace/import' ? crypto.randomUUID() : currentWorkspaceId();
  const data = await requestApi<T>(fetch, path, workspaceId, method, body);
  if (path === 'workspace/import') selectWorkspace(workspaceId);
  return data;
}
