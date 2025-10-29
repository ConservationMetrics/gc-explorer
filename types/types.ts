import type pg from "pg";

import type { FeatureCollection } from "geojson";

export type DatabaseConnection = pg.Client | null;

export interface Database {
  query: <T = unknown>(
    _sql: string,
    _values?: unknown[],
    _callback?: (_err: Error, _result: { rows: T[] }) => void,
  ) => void;

  host?: string;
  user?: string;
  password?: string;
  port?: number;
  ssl?: boolean;

  close?: () => Promise<void>;
}

export type RouteLevelPermission = "anyone" | "guest" | "member" | "admin";

export interface ViewConfig {
  ALERT_RESOURCES?: string;
  EMBED_MEDIA?: string;
  FILTER_BY_COLUMN?: string;
  FILTER_OUT_VALUES_FROM_COLUMN?: string;
  FRONT_END_FILTERING?: string;
  FRONT_END_FILTER_COLUMN?: string;
  FRONT_END_FILTER_FIELD?: string;
  LOGO_URL?: string;
  MAPBOX_3D?: boolean;
  MAPBOX_3D_TERRAIN_EXAGGERATION?: number;
  MAPBOX_ACCESS_TOKEN?: string;
  MAPBOX_BEARING?: number;
  MAPBOX_CENTER_LATITUDE?: string;
  MAPBOX_CENTER_LONGITUDE?: string;
  MAPBOX_PITCH?: number;
  MAPBOX_PROJECTION?: string;
  MAPBOX_STYLE?: string; // Deprecated: use MAPBOX_BASEMAPS instead
  MAPBOX_BASEMAPS?: string; // JSON string of BasemapConfig[]
  MAPBOX_ZOOM?: number;
  MAPEO_CATEGORY_IDS?: string;
  MAPEO_TABLE?: string;
  MAP_LEGEND_LAYER_IDS?: string;
  MEDIA_BASE_PATH?: string;
  MEDIA_BASE_PATH_ALERTS?: string;
  PLANET_API_KEY?: string;
  UNWANTED_COLUMNS?: string;
  UNWANTED_SUBSTRINGS?: string;
  VIEWS?: string;
  ROUTE_LEVEL_PERMISSION?: RouteLevelPermission; // Who can access this view: anyone, signed-in, member, or admin
}

export interface Views {
  [key: string]: ViewConfig;
}

export type AllowedFileExtensions = {
  audio: string[];
  image: string[];
  video: string[];
};

export type ConfigRow = {
  table_name: string;
  views_config: string;
};

export type ColumnEntry = {
  original_column: string;
  sql_column: string;
};

export type DataEntry = Record<string, string> & {
  normalizedId?: number;
};

export type Dataset = Array<DataEntry>;

export type FilterValues = Array<string>;
export interface Basemap {
  id: string;
  style?: string;
  url?: string;
  monthYear?: string;
}

export interface BasemapConfig {
  name: string;
  style: string;
  isDefault?: boolean;
}

export interface BasemapOption {
  id: string;
  name: string;
  style?: string;
  monthYear?: string;
}

export interface MapStyle {
  name: string;
  style?: {
    version: number;
    sources: unknown;
    layers: unknown[];
  };
  url?: string;
}

export type MapLegendItem = {
  id: string;
  color: string;
  name: string;
  type: string;
  visible: boolean;
  iconUrl?: string;
};

export type AlertsMetadata = {
  data_source: string;
  type_alert: string;
  month: number;
  year: number;
  total_alerts: string;
  description_alerts: string;
  territory: string;
};

export type AlertsData = {
  mostRecentAlerts: FeatureCollection;
  previousAlerts: FeatureCollection;
};

export type AlertsPerMonth = Record<string, number>;

export type AlertsStatistics = {
  territory: string;
  typeOfAlerts: string[];
  dataProviders: string[];
  alertDetectionRange: string;
  allDates: string[];
  earliestAlertsDate: string;
  recentAlertsDate: string;
  recentAlertsNumber: number;
  alertsTotal: number;
  alertsPerMonth: AlertsPerMonth;
  hectaresTotal: string | null;
  hectaresPerMonth: AlertsPerMonth | null;
  twelveMonthsBefore: string;
};

export type MapStatistics = {
  totalFeatures: number;
  dateRange?: string;
};

export const Role = {
  SignedIn: 0, // Signed in but no elevated access
  Guest: 1, // Signed in with guest permissions (old "unrestricted")
  Member: 2, // Signed in with member permissions
  Admin: 3, // Signed in with admin permissions
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export type SupportedLocale = "en" | "es" | "pt" | "nl";

export interface User {
  auth0: string;
  roles?: Array<{ id: string; name: string; description: string }>;
  userRole?: Role;
}
export interface ToastEmits {
  (e: "close"): void;
}
export interface ToastOptions {
  type?: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
  visible?: boolean;
  position?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
}
