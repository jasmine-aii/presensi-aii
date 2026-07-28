import { useEffect, useState } from 'react';
import { fetchHolidayMap } from './holidays';

const pad = (n: number) => String(n).padStart(2, '0');

/** Today's holiday name if it's a national holiday / day off, else null. */
export function useTodayHoliday(): string | null {
  const [name, setName] = useState<string | null>(null);
  useEffect(() => {
    const d = new Date();
    const iso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    let alive = true;
    fetchHolidayMap().then((m) => {
      if (alive) setName(m[iso] ?? null);
    });
    return () => {
      alive = false;
    };
  }, []);
  return name;
}
