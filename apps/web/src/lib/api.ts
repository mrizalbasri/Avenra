export async function api<T>(
  path: string,
  method = 'GET',
  body?: unknown,
): Promise<T> {
  const response = await fetch(`/api/${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      typeof data.detail === 'string'
        ? data.detail
        : Array.isArray(data.detail)
          ? data.detail
              .map(
                (issue: { loc?: (string | number)[]; msg?: string }) =>
                  `${issue.loc?.slice(1).join('.') || 'Input'}: ${issue.msg || 'Invalid value'}`,
              )
              .join(' ')
          : 'Check the input fields and try again.',
    );
  return data as T;
}
