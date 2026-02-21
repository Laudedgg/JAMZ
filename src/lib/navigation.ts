/**
 * Navigation utility functions for the application
 */

/**
 * Navigates to a section on the homepage
 * If already on the homepage, scrolls to the section
 * If on another page, navigates to the homepage with the section hash
 * 
 * @param sectionId The ID of the section to navigate to
 * @param navigate Optional navigate function from useNavigate hook
 * @returns A function that can be used as an onClick handler
 */
export const navigateToSection = (sectionId: string, navigate?: (path: string) => void) => {
  return (e: React.MouseEvent) => {
    // If we're already on the homepage, prevent default and scroll to the section
    if (window.location.pathname === '/') {
      e.preventDefault();
      scrollToSection(sectionId);
    } else if (navigate) {
      // If we have a navigate function, use it to navigate to the homepage with the section hash
      e.preventDefault();
      navigate(`/#${sectionId}`);
    }
    // If we're not on the homepage and don't have a navigate function,
    // let the default link behavior handle it (via href attribute)
  };
};

/**
 * Scrolls to a section on the page
 *
 * @param sectionId The ID of the section to scroll to
 */
export const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId);
  if (element) {
    // Get the element's position
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;

    // Account for fixed header on mobile (if any)
    const isMobile = window.innerWidth < 768;
    const offset = isMobile ? 80 : 0; // Adjust offset for mobile header

    // Use a more controlled scroll approach to prevent jumping
    const targetPosition = elementPosition - offset;

    // Check if browser supports smooth scrolling
    const supportsNativeSmoothScroll = 'scrollBehavior' in document.documentElement.style;

    if (supportsNativeSmoothScroll && !isMobile) {
      // Use native smooth scroll on desktop
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    } else {
      // Use instant scroll on mobile to prevent jumping/shaking
      // Mobile browsers often have issues with smooth scroll due to address bar

      // Temporarily disable scroll events to prevent conflicts
      document.body.style.pointerEvents = 'none';

      window.scrollTo({
        top: targetPosition,
        behavior: 'auto'
      });

      // Re-enable pointer events after a short delay
      setTimeout(() => {
        document.body.style.pointerEvents = '';
      }, 100);
    }
  }
};

/**
 * Handles navigation when the page loads with a hash in the URL
 */
export const handleInitialNavigation = () => {
  // Check if there's a hash in the URL
  if (window.location.hash) {
    // Remove the # character
    const sectionId = window.location.hash.substring(1);
    // Wait a bit for the page to fully load before scrolling
    setTimeout(() => {
      scrollToSection(sectionId);
    }, 100);
  }
};
