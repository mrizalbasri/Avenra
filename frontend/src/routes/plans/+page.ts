import { requireProfile } from '#lib/onboarding.js';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
  requireProfile((await parent()).workspace);
  return {};
};
