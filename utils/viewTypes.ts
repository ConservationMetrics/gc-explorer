import type { ViewType } from "@/types";

export const toViewType = (view: string): ViewType =>
  (view === "alerts" ? "alert" : view) as ViewType;

export const toConfigView = (viewType: ViewType): string =>
  viewType === "alert" ? "alerts" : viewType;
