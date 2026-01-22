import { useEffect, type ReactNode } from "react";
import { BrowserRouter, useNavigate } from "react-router-dom";

const normalizeBaseUrl = (baseUrl: string) => {
  if (!baseUrl) {
    return undefined;
  }

  if (baseUrl === "/") {
    return undefined;
  }

  return baseUrl.replace(/\/$/, "");
};

function RedirectHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    const redirect = sessionStorage.getItem('redirect');
    if (redirect) {
      sessionStorage.removeItem('redirect');
      navigate(redirect, { replace: true });
    }
  }, [navigate]);

  return null;
}

export const RouterProvider = ({ children }: { children: ReactNode }) => {
  const basename = normalizeBaseUrl(import.meta.env.BASE_URL);
  console.log('🚀 RouterProvider rendered with basename:', basename);

  return (
    <BrowserRouter basename={basename}>
      <RedirectHandler />
      {children}
    </BrowserRouter>
  );
};