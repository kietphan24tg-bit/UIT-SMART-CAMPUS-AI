import { useEffect, useState } from 'react';

export function useNowTick(intervalMs: number) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTick((value) => value + 1);
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [intervalMs]);
}
