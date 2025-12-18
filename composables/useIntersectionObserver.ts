/**
 * Composable for Intersection Observer API
 * Provides viewport-based lazy loading functionality
 *
 * @param callback - Function called when intersection changes occur
 * @param options - Optional IntersectionObserver configuration options
 * @returns Object containing target ref, intersection state, and observer methods
 */
export const useIntersectionObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit,
) => {
  const target = ref<Element | null>(null);
  const isIntersecting = ref(false);
  const hasIntersected = ref(false);

  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: "50px", // Start loading 50px before entering viewport
    threshold: 0.01,
    ...options,
  };

  let observer: IntersectionObserver | null = null;

  /**
   * Start observing an element for intersection changes
   *
   * @param element - The DOM element to observe
   */
  const observe = (element: Element) => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      // Fallback for browsers without IntersectionObserver support
      isIntersecting.value = true;
      hasIntersected.value = true;
      callback([
        {
          target: element,
          isIntersecting: true,
          intersectionRatio: 1,
          boundingClientRect: element.getBoundingClientRect(),
          rootBounds: null,
          time: Date.now(),
        } as IntersectionObserverEntry,
      ]);
      return;
    }

    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        isIntersecting.value = entry.isIntersecting;
        if (entry.isIntersecting && !hasIntersected.value) {
          hasIntersected.value = true;
        }
        callback(entries);
      });
    }, defaultOptions);

    observer.observe(element);
  };

  /**
   * Stop observing the current target element and disconnect the observer
   */
  const unobserve = () => {
    if (observer && target.value) {
      observer.unobserve(target.value);
      observer.disconnect();
      observer = null;
    }
  };

  onMounted(() => {
    if (target.value) {
      observe(target.value);
    }
  });

  onBeforeUnmount(() => {
    unobserve();
  });

  watch(target, (newTarget, oldTarget) => {
    if (oldTarget && observer) {
      observer.unobserve(oldTarget);
    }
    if (newTarget) {
      observe(newTarget);
    }
  });

  return {
    target,
    isIntersecting,
    hasIntersected,
    observe,
    unobserve,
  };
};
