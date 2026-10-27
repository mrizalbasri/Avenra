import { error } from '@sveltejs/kit';
import { readApi } from '#lib/server/api.js';
import type { Plan, Profile, Curriculum } from '#lib/types.js';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async ({
  fetch,
  params,
  depends,
  cookies,
}) => {
  depends(`avenra:plan:${params.id}`);
  try {
    return await readApi<{
      plan: Plan;
      profile: Profile;
      curriculum: Curriculum;
    }>(
      fetch,
      `plans/${encodeURIComponent(params.id)}`,
      cookies.get('avenra-workspace'),
    );
  } catch (e) {
    error(503, (e as Error).message);
  }
};
