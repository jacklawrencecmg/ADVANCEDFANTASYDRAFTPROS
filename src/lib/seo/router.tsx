import { createContext, useContext, ReactNode } from 'react';

interface RouterContextValue {
  params: Record<string, string>;
  navigate: (path: string) => void;
}

const defaultNavigate = (path: string) => {
  sessionStorage.setItem('spa_redirect', path);
  window.location.replace('/');
};

const RouterContext = createContext<RouterContextValue>({
  params: {},
  navigate: defaultNavigate,
});

export function useParams<T = Record<string, string>>(): T {
  const { params } = useContext(RouterContext);
  return params as T;
}

export function Link({ to, children, className }: { to: string; children: ReactNode; className?: string }) {
  const { navigate } = useContext(RouterContext);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(to);
  };

  return (
    <a href={to} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}

export function RouterProvider({ params, children }: { params: Record<string, string>; children: ReactNode }) {
  const navigate = (path: string) => {
    // Use the same sessionStorage mechanism as 404.html so App.tsx routing
    // correctly handles all internal navigation without a full-page 404 cycle.
    sessionStorage.setItem('spa_redirect', path);
    window.location.replace('/');
  };

  return (
    <RouterContext.Provider value={{ params, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}
