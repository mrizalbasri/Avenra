import { requestApi } from '#lib/api.js';
import type { Outlook, Study } from '#lib/types.js';
import type { PageLoad } from './$types';

// The outlook re-solves a few what-if cases. Returning its promise unawaited lets
// the overview render first and fill the outlook in when it arrives.
export const load: PageLoad = async ({ fetch, parent }) => {
  const { workspace, workspaceId } = await parent();
  const plan = workspace?.plans.find((p) => !p.archived);
  if (!workspace?.profile || !plan)
    return { outlook: Promise.resolve(null), study: null };
  const outlook = requestApi<Outlook>(
    fetch,
    `plans/${plan.id}/outlook`,
    workspaceId,
  ).catch(() => null);
  const study = await requestApi<Study>(fetch, 'study', workspaceId).catch(
    () => null,
  );
  return { outlook, study };
};
