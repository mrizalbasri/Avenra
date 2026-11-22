import { requestApi } from '#lib/api.js';
import type { Study } from '#lib/types.js';
import type { PageLoad } from './$types';

type LoadError = {
  message: string;
  code?: string;
  params?: Record<string, unknown>;
} | null;

export const load: PageLoad = async ({ fetch, parent }) => {
  const { workspace, workspaceId } = await parent();
  if (!workspace?.profile)
    return {
      study: { tasks: [], sessions: [] } as Study,
      studyError: null as LoadError,
    };
  try {
    return {
      study: await requestApi<Study>(fetch, 'study', workspaceId),
      studyError: null as LoadError,
    };
  } catch (e) {
    const error = e as Error & {
      code?: string;
      params?: Record<string, unknown>;
    };
    return {
      study: { tasks: [], sessions: [] } as Study,
      // Plain data, so it survives serialization from the server render.
      studyError: {
        message: error.message,
        code: error.code,
        params: error.params,
      } as LoadError,
    };
  }
};
