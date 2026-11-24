import { PUBLIC_API_BASE_URL } from '$app/env/public';
import { ApiError } from '#lib/errors.js';
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
    throw new ApiError(
      'Cannot reach the API. Your changes have not been saved. Retry when the service is available.',
      'NETWORK',
    );
  }
  const data = await response.json();
  if (!response.ok) throw apiError(data.detail);
  return data as T;
}

// The API sends {code, message, params}. Older and framework errors send a string or a
// list of validation issues; both still produce a readable English message.
function apiError(detail: unknown): ApiError {
  if (typeof detail === 'string') return new ApiError(detail);
  if (Array.isArray(detail))
    return new ApiError(
      detail
        .map(
          (issue: { loc?: (string | number)[]; msg?: string }) =>
            `${issue.loc?.slice(1).join('.') || 'Input'}: ${issue.msg || 'Invalid value'}`,
        )
        .join(' '),
    );
  if (detail && typeof detail === 'object' && 'code' in detail) {
    const { code, message, params } = detail as {
      code: string;
      message?: string;
      params?: Record<string, unknown>;
    };
    return new ApiError(message ?? code, code, params ?? {});
  }
  return new ApiError('Check the input fields and try again.', 'INVALID_INPUT');
}

export async function api<T>(
  path: string,
  method = 'GET',
  body?: unknown,
): Promise<T> {
  const createsWorkspace =
    path === 'workspace/import' || path === 'workspace/restore';
  const workspaceId = createsWorkspace
    ? crypto.randomUUID()
    : currentWorkspaceId();
  const data = await requestApi<T>(fetch, path, workspaceId, method, body);
  if (createsWorkspace) selectWorkspace(workspaceId);
  return data;
}
