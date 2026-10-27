import { readApi } from '#lib/server/api.js';
import { error } from '@sveltejs/kit';
import type { Plan, Profile, Curriculum } from '#lib/types.js';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ fetch, params, cookies }) => {
  try {
    return {
      ...(await readApi<{
        plan: Plan;
        profile: Profile;
        curriculum: Curriculum;
      }>(
        fetch,
        `plans/${encodeURIComponent(params.id)}`,
        cookies.get('avenra-workspace'),
      )),
      generatedAt: new Date().toISOString(),
    };
  } catch (e) {
    error(503, (e as Error).message);
  }
};
