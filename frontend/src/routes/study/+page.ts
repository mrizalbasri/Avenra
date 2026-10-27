import { requestApi } from '#lib/api.js';
import type { Study } from '#lib/types.js';
import type { PageLoad } from './$types';
export const load: PageLoad = async ({ fetch, parent }) => {
  const { workspace, workspaceId } = await parent();
  if (!workspace?.profile)
    return { study: { tasks: [], sessions: [] } as Study, studyError: '' };
  try {
    return {
      study: await requestApi<Study>(fetch, 'study', workspaceId),
      studyError: '',
    };
  } catch (e) {
    return {
      study: { tasks: [], sessions: [] } as Study,
      studyError: (e as Error).message,
    };
  }
};
