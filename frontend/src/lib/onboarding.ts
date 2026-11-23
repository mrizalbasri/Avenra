import { redirect } from '@sveltejs/kit';
import type { Workspace } from '#lib/types.js';

// A workspace without a profile has nothing to plan yet, so send the student to setup.
// A null workspace means the API is unreachable; the page shows that error instead.
export function requireProfile(workspace: Workspace | null): void {
  if (workspace && !workspace.profile) redirect(307, '/start');
}
