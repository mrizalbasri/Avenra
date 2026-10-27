export const apiPort = process.env.E2E_API_PORT ?? '18080';
export const webPort = process.env.E2E_WEB_PORT ?? '4173';
export const apiOrigin = `http://127.0.0.1:${apiPort}`;
export const webOrigin = `http://127.0.0.1:${webPort}`;
