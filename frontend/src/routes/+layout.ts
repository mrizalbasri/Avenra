import { requestApi } from '#lib/api.js';
import type { Workspace } from '#lib/types.js';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ data, fetch, depends }) => {
  depends('avenra:workspace');
  try {
    return {
      ...data,
      workspace: await requestApi<Workspace>(
        fetch,
        'workspace',
        data.workspaceId,
      ),
      workspaceError: '',
    };
  } catch (error) {
    return {
      ...data,
      workspace: null,
      workspaceError:
        error instanceof Error ? error.message : 'Workspace unavailable.',
    };
  }
};
