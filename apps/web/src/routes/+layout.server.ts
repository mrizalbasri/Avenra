import { readApi } from '#lib/server/api.js';
import type { Workspace } from '#lib/types.js';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({
  fetch,
  depends,
  cookies,
  url,
}) => {
  depends('avenra:workspace');
  let workspaceId = cookies.get('avenra-workspace');
  if (!workspaceId || !/^[a-zA-Z0-9-]{1,40}$/.test(workspaceId)) {
    workspaceId = crypto.randomUUID();
    cookies.set('avenra-workspace', workspaceId, {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: url.protocol === 'https:',
      maxAge: 31536000,
    });
  }
  try {
    return {
      workspace: await readApi<Workspace>(fetch, 'workspace', workspaceId),
      workspaceError: '',
    };
  } catch (error) {
    return {
      workspace: null,
      workspaceError:
        error instanceof Error ? error.message : 'Workspace unavailable.',
    };
  }
};
