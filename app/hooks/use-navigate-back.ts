import { useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate, type NavigateOptions } from "react-router";

export function useNavigateBack() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentLocation = useRef(location);
  const previousPathname = useRef<string | null>(null);

  useEffect(() => {
    if (currentLocation.current.key !== location.key) {
      previousPathname.current = currentLocation.current.pathname;
      currentLocation.current = location;
    }
  }, [location]);

  return useCallback(
    (fallback: string, options?: NavigateOptions) => {
      if (previousPathname.current === fallback) {
        navigate(-1);
      } else {
        navigate(fallback, options);
      }
    },
    [navigate],
  );
}
