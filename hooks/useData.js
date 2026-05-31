'use client';

import { useState, useEffect, useRef } from 'react';

export function useData(fetcher, deps = [], options = {}) {
  const { enabled = true, fallback = null, onError } = options;
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!enabled) {
      setData(fallback);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetcher()
      .then(result => {
        if (!cancelled && mountedRef.current) {
          setData(result);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled && mountedRef.current) {
          setError(err);
          setLoading(false);
          onError?.(err);
        }
      });

    return () => { cancelled = true; };
  }, deps);

  return { data, loading, error, setData };
}
