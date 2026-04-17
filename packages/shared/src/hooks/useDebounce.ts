import { useEffect, useState } from 'react';

/**
 * Debounces a value — only updates after the specified delay has elapsed
 * without the value changing.
 *
 * @example
 * const debouncedSearch = useDebounce(searchText, 300);
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
