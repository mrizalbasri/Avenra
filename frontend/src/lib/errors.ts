// An API failure. `message` is the server's English text; `code` and `params` let the
// UI show it in the chosen language.
export class ApiError extends Error {
  readonly code?: string;
  readonly params: Record<string, unknown>;

  constructor(
    message: string,
    code?: string,
    params: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.params = params;
  }
}
