export interface ToastOptions {
  type?: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
  position?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
}

export interface Toast extends ToastOptions {
  id: string;
}

export const useToast = () => {
  const toasts = ref<Toast[]>([]);

  const addToast = (options: ToastOptions) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toast: Toast = {
      id,
      type: "info",
      duration: 5000,
      ...options,
    };

    toasts.value.push(toast);

    // Auto-remove after duration
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration);
    }

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
