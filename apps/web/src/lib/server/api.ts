import { API_BASE_URL } from '$app/env/private';

export async function readApi<T>(
  fetcher: typeof fetch,
  path: string,
  workspaceId = 'local-demo',
): Promise<T> {
  const response = await fetcher(`${API_BASE_URL}/api/v1/${path}`, {
    signal: AbortSignal.timeout(8000),
    headers: { 'X-Workspace-ID': workspaceId },
  });
  if (!response.ok)
    throw new Error(
      response.status === 404
        ? 'Not found. Open the demo workspace first.'
        : 'The workspace is unavailable. Check the API, database, and migrations.',
    );
  return response.json();
}
