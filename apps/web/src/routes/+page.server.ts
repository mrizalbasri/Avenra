import { API_BASE_URL } from '$app/env/private';
import type { PageServerLoad } from './$types';

type Course = {
  code: string;
  name: string;
  credits: number;
  recommended_term: number;
  prerequisites: string[];
};
type Curriculum = {
  name: string;
  version: string;
  status: string;
  disclaimer: string;
  courses: Course[];
};

export const load: PageServerLoad = async ({ fetch }) => {
  const base = API_BASE_URL;
  async function get(path: string) {
    try {
      const response = await fetch(`${base}${path}`, {
        signal: AbortSignal.timeout(4000),
      });
      return response.ok ? response.json() : null;
    } catch {
      return null;
    }
  }
  const [live, ready, curriculum] = await Promise.all([
    get('/health/live'),
    get('/health/ready'),
    get('/api/v1/curricula/demo'),
  ]);
  return {
    apiOnline: live?.status === 'ok',
    databaseOnline: ready?.database === 'connected',
    curriculum: curriculum as Curriculum | null,
  };
};
