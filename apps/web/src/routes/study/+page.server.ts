import { readApi } from '#lib/server/api.js';
import type { Study } from '#lib/types.js';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ fetch, parent, cookies }) => {
  const { workspace } = await parent();
  if (!workspace?.profile)
    return { study: { tasks: [], sessions: [] } as Study, studyError: '' };
  try {
    return {
      study: await readApi<Study>(
        fetch,
        'study',
        cookies.get('avenra-workspace'),
      ),
      studyError: '',
    };
  } catch (e) {
    return {
      study: { tasks: [], sessions: [] } as Study,
      studyError: (e as Error).message,
    };
  }
};
