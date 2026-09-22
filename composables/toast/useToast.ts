import type { ToastOptions } from "@/types";
import { useRouter } from "#imports";
import { readonly, ref } from "vue";

export interface Toast extends ToastOptions {
  id: string;
}

// Global toast state - shared across all components (layouts keep ToastContainer mounted)
const globalToasts = ref<Toast[]>([]);
let isRouteHookBound = false;

// Vue watch() stops when the caller unmounts (layout swap). Router hooks do not.
const bindClearOnRouteChange = () => {
  if (import.meta.server || isRouteHookBound) return;
  isRouteHookBound = true;
  const router = useRouter();
  router.beforeEach((to, from) => {
    if (to.path !== from.path) {
      globalToasts.value = [];
    }
  });
};

export const useToast = () => {
  const toasts = globalToasts;
  bindClearOnRouteChange();

  const addToast = (options: ToastOptions) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toast: Toast = {
      id,
      type: "info",
      duration: 0, // No auto-close, user must manually close
      ...options,
    };

    toasts.value.push(toast);
    return id;
  };

  const removeToast = (id: string) => {
    const index = toasts.value.findIndex((toast) => toast.id === id);
    if (index > -1) {
      toasts.value.splice(index, 1);
    }
  };

  const clearAllToasts = () => {
    toasts.value = [];
  };

  // Convenience methods
  const success = (
    title: string,
    message?: string,
    duration?: number,
    position?: ToastOptions["position"],
  ) => {
    return addToast({ type: "success", title, message, duration, position });
  };

  const error = (
    title: string,
    message?: string,
    duration?: number,
    position?: ToastOptions["position"],
  ) => {
    return addToast({ type: "error", title, message, duration, position });
  };

  const warning = (
    title: string,
    message?: string,
    duration?: number,
    position?: ToastOptions["position"],
  ) => {
    return addToast({ type: "warning", title, message, duration, position });
  };

  const info = (
    title: string,
    message?: string,
    duration?: number,
    position?: ToastOptions["position"],
  ) => {
    return addToast({ type: "info", title, message, duration, position });
  };

  return {
    toasts: readonly(toasts),
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info,
  };
};
