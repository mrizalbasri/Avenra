import { validWorkspaceId, workspaceCookie } from '#lib/workspace.js';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ depends, cookies, url }) => {
  depends('avenra:workspace');
  let workspaceId = cookies.get(workspaceCookie);
  if (!validWorkspaceId(workspaceId)) {
    workspaceId = crypto.randomUUID();
  }
  // Also upgrades existing HttpOnly demo cookies for direct browser API requests.
  cookies.set(workspaceCookie, workspaceId, {
    path: '/',
    httpOnly: false,
    sameSite: 'strict',
    secure: url.protocol === 'https:',
    maxAge: 31536000,
  });
  return { workspaceId };
};
