import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Force scroll to top on every route change
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant" // Use instant to avoid smooth scroll conflicts on load
    });

    // Also target the main container if it has its own scroll
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.scrollTop = 0;
    }
  }, [pathname]);

  return null;
};

export default ScrollToTop;
