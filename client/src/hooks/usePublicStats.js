import { useEffect, useState } from 'react';
import { statsAPI } from '../services/api';
import { LANGUAGES } from '../context/LanguageContext';

const compact = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 });

// Live platform numbers for the public pages. Values are '—' until loaded (or if the API is down),
// never invented placeholders.
export default function usePublicStats() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    let active = true;
    statsAPI.public().then((res) => active && setStats(res.data)).catch(() => {});
    return () => { active = false; };
  }, []);
  const fmt = (n) => (typeof n === 'number' ? compact.format(n) : '—');
  return {
    children: fmt(stats?.children),
    ashaWorkers: fmt(stats?.ashaWorkers),
    districts: fmt(stats?.districts),
    languages: String(LANGUAGES.length),
  };
}
