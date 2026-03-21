import { useEffect, useMemo, useState } from 'react';
import { childAPI } from '../services/api';

const STORAGE_KEY = 'sa_selected_child_id';

export default function useSelectedChild() {
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(() => localStorage.getItem(STORAGE_KEY) || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    childAPI.list()
      .then((res) => {
        if (!active) return;
        const list = res.data || [];
        setChildren(list);

        const storedId = localStorage.getItem(STORAGE_KEY);
        const validStored = storedId && list.some((child) => child._id === storedId);
        const nextId = validStored ? storedId : (list[0]?._id || '');

        setSelectedChildId(nextId);
        if (nextId) localStorage.setItem(STORAGE_KEY, nextId);
        else localStorage.removeItem(STORAGE_KEY);
      })
      .catch(console.error)
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const setSelectedChild = (childOrId) => {
    const nextId = typeof childOrId === 'string' ? childOrId : childOrId?._id || '';
    setSelectedChildId(nextId);
    if (nextId) localStorage.setItem(STORAGE_KEY, nextId);
    else localStorage.removeItem(STORAGE_KEY);
  };

  const selectedChild = useMemo(
    () => children.find((child) => child._id === selectedChildId) || children[0] || null,
    [children, selectedChildId]
  );

  return {
    children,
    selectedChild,
    selectedChildId: selectedChild?._id || selectedChildId,
    setChildren,
    setSelectedChild,
    loading,
  };
}
