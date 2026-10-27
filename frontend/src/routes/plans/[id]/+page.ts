import { error } from '@sveltejs/kit';
import { requestApi } from '#lib/api.js';
import type { Plan, Profile, Curriculum } from '#lib/types.js';
import type { PageLoad } from './$types';
export const load: PageLoad = async ({ fetch, params, depends, parent }) => {
  depends(`avenra:plan:${params.id}`);
  const { workspaceId } = await parent();
  try {
    return await requestApi<{
      plan: Plan;
      profile: Profile;
      curriculum: Curriculum;
    }>(fetch, `plans/${encodeURIComponent(params.id)}`, workspaceId);
  } catch (e) {
    error(503, (e as Error).message);
  }
};
