import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

// The import form became step 2 of the onboarding wizard. Landing links still point here.
export const load: PageLoad = () => {
  redirect(307, '/start');
};
