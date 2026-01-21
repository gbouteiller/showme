import { useCallback } from "react";

/**
 * Hook to wrap state updates with the View Transitions API
 * Falls back to immediate execution if the API is not supported
 */
export function useViewTransition() {
  return useCallback((callback: () => void) => {
    // Check if View Transitions API is supported
    if (typeof document !== "undefined" && "startViewTransition" in document) {
      // TypeScript doesn't have startViewTransition in DOM types yet
      (document as { startViewTransition?: (callback: () => void) => void }).startViewTransition?.(callback);
    } else {
      // Fallback for browsers that don't support View Transitions
      callback();
    }
  }, []);
}
