import { requestApi } from '#lib/api.js';
import { error } from '@sveltejs/kit';
import type { Plan, Profile, Curriculum } from '#lib/types.js';
import type { PageLoad } from './$types';
export const load: PageLoad = async ({ fetch, params, parent }) => {
  const { workspaceId } = await parent();
  try {
    return {
      ...(await requestApi<{
        plan: Plan;
        profile: Profile;
        curriculum: Curriculum;
      }>(fetch, `plans/${encodeURIComponent(params.id)}`, workspaceId)),
      generatedAt: new Date().toISOString(),
    };
  } catch (e) {
    error(503, (e as Error).message);
  }
};
