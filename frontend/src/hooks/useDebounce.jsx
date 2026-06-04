import { useState, useEffect } from "react";

/**
 * Hook to debounce a value by the given delay.
 * @param {*} value - the value to debounce
 * @param {number} delay - delay in milliseconds
 * @returns {*} the debounced value
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}