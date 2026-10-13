import { useCallback, useEffect, useRef, useState } from 'react';
import { str } from './i18n';

export const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Status used for requests that never reached the backend (offline, wrong URL, server down). */
export const NETWORK_ERROR_STATUS = 0;

const UNAVAILABLE_GATEWAY_STATUSES = new Set([502, 503, 504]);

function unavailableError(status: number): ApiError {
  return new ApiError(str('serverUnavailable', 'en'), status);
}

/**
 * fetch() that turns a network-level failure (the browser's bare "Failed to
 * fetch" TypeError) into an ApiError carrying a readable message.
 */
async function request(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(`${API_URL}${path}`, init);
  } catch (err) {
    if (init?.signal?.aborted) throw err;
    throw unavailableError(NETWORK_ERROR_STATUS);
  }
}

async function parse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (UNAVAILABLE_GATEWAY_STATUSES.has(res.status)) throw unavailableError(res.status);
    throw new ApiError((data as { error?: string }).error || 'Request failed', res.status);
  }
  return data as T;
}

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  return parse<T>(await request(path, { signal }));
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return parse<T>(
    await request(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  );
}

type FetchState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
  reload: () => void;
};

/** Fetches a public endpoint, cancelling in-flight requests on path change. */
export function useApi<T>(path: string | null): FetchState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [nonce, setNonce] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!path) {
      setData(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setNotFound(false);

    apiGet<T>(path, controller.signal)
      .then((result) => {
        if (!mounted.current) return;
        setData(result);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || !mounted.current) return;
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
          setError(null);
        } else {
          setError(err instanceof Error ? err.message : 'Something went wrong');
        }
      })
      .finally(() => {
        if (mounted.current && !controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [path, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return { data, loading, error, notFound, reload };
}
