import type { Feature } from "geojson";

export type AlertPeriod = "mostRecent" | "previous";
export type AlertRenderKind = "point" | "polygon" | "linestring" | "centroids";

type AlertDataKey = "mostRecentAlerts" | "previousAlerts";

export type AlertMapLayer = {
  period: AlertPeriod;
  alertsKey: AlertDataKey;
  kind: AlertRenderKind;
  sourceId: string;
  layerId: string;
};

export const alertMapLayers: readonly AlertMapLayer[] = [
  {
    period: "mostRecent",
    alertsKey: "mostRecentAlerts",
    kind: "point",
    sourceId: "most-recent-alerts-point",
    layerId: "most-recent-alerts-point",
  },
  {
    period: "mostRecent",
    alertsKey: "mostRecentAlerts",
    kind: "polygon",
    sourceId: "most-recent-alerts-polygon",
    layerId: "most-recent-alerts-polygon",
  },
  {
    period: "mostRecent",
    alertsKey: "mostRecentAlerts",
    kind: "linestring",
    sourceId: "most-recent-alerts-linestring",
    layerId: "most-recent-alerts-linestring",
  },
  {
    period: "mostRecent",
    alertsKey: "mostRecentAlerts",
    kind: "centroids",
    sourceId: "most-recent-alerts-centroids",
    layerId: "most-recent-alerts-centroids",
  },
  {
    period: "previous",
    alertsKey: "previousAlerts",
    kind: "point",
    sourceId: "previous-alerts-point",
    layerId: "previous-alerts-point",
  },
  {
    period: "previous",
    alertsKey: "previousAlerts",
    kind: "polygon",
    sourceId: "previous-alerts-polygon",
    layerId: "previous-alerts-polygon",
  },
  {
    period: "previous",
    alertsKey: "previousAlerts",
    kind: "linestring",
    sourceId: "previous-alerts-linestring",
    layerId: "previous-alerts-linestring",
  },
  {
    period: "previous",
    alertsKey: "previousAlerts",
    kind: "centroids",
    sourceId: "previous-alerts-centroids",
    layerId: "previous-alerts-centroids",
  },
];

export const isPolygonal = (feature: Feature) =>
  feature.geometry.type === "Polygon" ||
  feature.geometry.type === "MultiPolygon";

const hasCentroid = (feature: Feature) =>
  feature.geometry.type !== "Point" &&
  typeof feature.properties?.geographicCentroid === "string";

export const alertRenderKinds = [
  {
    kind: "point",
    matches: (feature: Feature) => feature.geometry.type === "Point",
  },
  { kind: "polygon", matches: isPolygonal },
  {
    kind: "linestring",
    matches: (feature: Feature) => feature.geometry.type === "LineString",
  },
  { kind: "centroids", matches: hasCentroid },
] as const;

export const getAlertGeometryRenderKind = (
  feature: Feature,
): Exclude<AlertRenderKind, "centroids"> | null => {
  const alertRenderKind = alertRenderKinds.find(
    (renderKind) =>
      renderKind.kind !== "centroids" && renderKind.matches(feature),
  );
  if (!alertRenderKind || alertRenderKind.kind === "centroids") return null;
  return alertRenderKind.kind;
};

export const getAlertSourceFeatures = (
  features: Feature[],
  kind: AlertRenderKind,
): Feature[] => {
  const alertRenderKind = alertRenderKinds.find(
    (renderKind) => renderKind.kind === kind,
  );
  if (!alertRenderKind) return [];

  const matchingFeatures = features.filter(alertRenderKind.matches);
  if (kind === "centroids") {
    return matchingFeatures.map((feature) => {
      const geographicCentroid = feature.properties!
        .geographicCentroid as string;
      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: geographicCentroid.split(",").map(Number).reverse(),
        },
        properties: { ...feature.properties },
      };
    });
  }

  return matchingFeatures;
};

export const getAlertMapLayer = (layerId: string) =>
  alertMapLayers.find(
    (alertMapLayer) =>
      alertMapLayer.layerId === layerId || alertMapLayer.sourceId === layerId,
  );

export const getAlertMapLayersForPeriod = (period: AlertPeriod) =>
  alertMapLayers.filter((alertMapLayer) => alertMapLayer.period === period);

export const clusteredAlertMapLayers = alertMapLayers.filter(
  (alertMapLayer) =>
    alertMapLayer.kind === "point" || alertMapLayer.kind === "centroids",
);
