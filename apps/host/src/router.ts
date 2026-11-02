import { useCallback, useEffect, useState } from 'react';

// Router tối giản (react-router chưa được duyệt). Host sở hữu route cấp ứng dụng (Architecture §7).
export function useRoute() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const on = () => setPath(window.location.pathname);
    window.addEventListener('popstate', on);
    return () => window.removeEventListener('popstate', on);
  }, []);
  const navigate = useCallback((to: string, replace = false) => {
    if (replace) window.history.replaceState({}, '', to); else window.history.pushState({}, '', to);
    setPath(to);
  }, []);
  useEffect(() => { if (path === '/') navigate('/chat', true); }, [path, navigate]);
  return { path, navigate };
}
