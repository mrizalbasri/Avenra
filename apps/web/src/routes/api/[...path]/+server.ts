import { API_BASE_URL } from '$app/env/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const proxy: RequestHandler = async ({
  params,
  request,
  url,
  fetch,
  cookies,
}) => {
  if (
    !/^(workspace(?:\/(?:bootstrap|import|switch))?|profile|plans(?:\/[a-zA-Z0-9-]+(?:\/solve)?)?|study(?:\/(?:tasks(?:\/[a-zA-Z0-9-]+)?|sessions))?)$/.test(
      params.path,
    )
  )
    return json({ detail: 'Endpoint not found.' }, { status: 404 });
  if (
    request.method !== 'GET' &&
    request.headers.get('origin') &&
    request.headers.get('origin') !== url.origin
  )
    return json(
      { detail: 'Cross-origin writes are not allowed.' },
      { status: 403 },
    );
  const body = request.method === 'GET' ? undefined : await request.text();
  if (body && body.length > 65536)
    return json({ detail: 'Request is too large.' }, { status: 413 });
  try {
    let workspaceId = cookies.get('avenra-workspace') ?? crypto.randomUUID();
    if (params.path === 'workspace/import') workspaceId = crypto.randomUUID();
    if (params.path === 'workspace/switch') {
      const candidate = JSON.parse(body ?? '{}').workspace_id;
      if (
        typeof candidate !== 'string' ||
        !/^[a-zA-Z0-9-]{1,40}$/.test(candidate)
      )
        return json({ detail: 'Invalid workspace.' }, { status: 422 });
      const check = await fetch(`${API_BASE_URL}/api/v1/workspace`, {
        headers: { 'X-Workspace-ID': candidate },
        signal: AbortSignal.timeout(8000),
      });
      if (!check.ok || !(await check.json()).profile)
        return json({ detail: 'Workspace not found.' }, { status: 404 });
      cookies.set('avenra-workspace', candidate, {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: url.protocol === 'https:',
        maxAge: 31536000,
      });
      return json({ status: 'ok' });
    }
    const response = await fetch(`${API_BASE_URL}/api/v1/${params.path}`, {
      method: request.method,
      body,
      headers: {
        'Content-Type': 'application/json',
        'X-Workspace-ID': workspaceId,
      },
      signal: AbortSignal.timeout(15000),
    });
    if (response.ok)
      cookies.set('avenra-workspace', workspaceId, {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: url.protocol === 'https:',
        maxAge: 31536000,
      });
    return new Response(await response.text(), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return json(
      {
        detail:
          'Cannot reach the API. Your changes have not been saved. Retry when the service is available.',
      },
      { status: 503 },
    );
  }
};
export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
