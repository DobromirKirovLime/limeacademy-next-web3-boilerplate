import { useEffect } from "react";

export const useDebouncer = (
  callback: () => any,
  input: string,
  delay: number
) => {
  useEffect(() => {
    if (input.length) {
      const timeoutId = setTimeout(() => {
        callback();
      }, delay);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [input]);
};
