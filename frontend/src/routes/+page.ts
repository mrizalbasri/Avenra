import { requestApi } from '#lib/api.js';
import type { Outlook, Study } from '#lib/types.js';
import type { PageLoad } from './$types';

// The outlook solves a handful of what-if cases, so it loads only for the
// signed-in overview and never blocks the page if the API is slow.
export const load: PageLoad = async ({ fetch, parent }) => {
  const { workspace, workspaceId } = await parent();
  const plan = workspace?.plans.find((p) => !p.archived);
  if (!workspace?.profile || !plan) return { outlook: null, study: null };
  const [outlook, study] = await Promise.allSettled([
    requestApi<Outlook>(fetch, `plans/${plan.id}/outlook`, workspaceId),
    requestApi<Study>(fetch, 'study', workspaceId),
  ]);
  return {
    outlook: outlook.status === 'fulfilled' ? outlook.value : null,
    study: study.status === 'fulfilled' ? study.value : null,
  };
};
