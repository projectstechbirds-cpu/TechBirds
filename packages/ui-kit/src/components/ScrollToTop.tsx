import * as React from "react";
import { useLocation } from "react-router-dom";

/** Scrolls `window` to top whenever the route `pathname` changes. */
export function ScrollToTop() {
  const { pathname } = useLocation();
  React.useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
