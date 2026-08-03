export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly kind: 'network' | 'http' | 'invalid-response',
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function requestJson(url: URL, signal: AbortSignal): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError('Falha de conexão com a fonte de dados.', null, 'network');
  }

  if (!response.ok) {
    const message =
      response.status === 429
        ? 'A fonte de dados atingiu o limite temporário de consultas.'
        : 'A fonte de dados está temporariamente indisponível.';
    throw new ApiError(message, response.status, 'http');
  }

  try {
    return (await response.json()) as unknown;
  } catch {
    throw new ApiError(
      'A fonte de dados retornou uma resposta inválida.',
      response.status,
      'invalid-response',
    );
  }
}
