import { useState, useCallback } from 'react';

/** Read a URL search param, returning `fallback` if absent. */
function readParam(key: string, fallback: string): string {
  const params = new URLSearchParams(window.location.search);
  return params.get(key) ?? fallback;
}

/** Write a URL search param without reloading the page. */
function writeParam(key: string, value: string) {
  const url = new URL(window.location.href);
  url.searchParams.set(key, value);
  window.history.replaceState(null, '', url.toString());
}

/**
 * React state backed by a URL search param.
 * Reads initial value from `?key=...`, writes back on every set.
 */
export function useUrlState(key: string, fallback: string): [string, (v: string) => void] {
  const [value, setValueInternal] = useState(() => readParam(key, fallback));

  const setValue = useCallback(
    (v: string) => {
      setValueInternal(v);
      writeParam(key, v);
    },
    [key],
  );

  return [value, setValue];
}
