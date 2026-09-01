import { useCallback, useEffect, useRef, useState } from 'react';

export const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { signal });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError((data as { error?: string }).error || 'Request failed', res.status);
  }
  return data as T;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError((data as { error?: string }).error || 'Request failed', res.status);
  }
  return data as T;
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
