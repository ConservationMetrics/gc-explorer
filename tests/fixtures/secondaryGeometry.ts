import type { FeatureCollection } from "geojson";

/** Synthetic mapping overlay; its point also represents a camera deployment. */
export const secondaryGeometry: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: 1,
      properties: { _id: "1", name: "Camera deployment", photo: "camera.jpg" },
      geometry: { type: "Point", coordinates: [-60, 5] },
    },
    {
      type: "Feature",
      id: 2,
      properties: { _id: "line", name: "Observation transect" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-60.01, 5],
          [-60.01, 5.01],
        ],
      },
    },
    {
      type: "Feature",
      id: 3,
      properties: { _id: "multiline", name: "Mapping trails" },
      geometry: {
        type: "MultiLineString",
        coordinates: [
          [
            [-60.02, 5],
            [-60.02, 5.01],
          ],
          [
            [-60.03, 5],
            [-60.03, 5.01],
          ],
        ],
      },
    },
    {
      type: "Feature",
      id: 4,
      properties: { _id: "polygon", name: "Observation area" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-60.04, 5],
            [-60.04, 5.01],
            [-60.05, 5],
            [-60.04, 5],
          ],
        ],
      },
    },
    {
      type: "Feature",
      id: 5,
      properties: { _id: "multipolygon", name: "Mapping areas" },
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          [
            [
              [-60.06, 5],
              [-60.06, 5.01],
              [-60.07, 5],
              [-60.06, 5],
            ],
          ],
          [
            [
              [-60.08, 5],
              [-60.08, 5.01],
              [-60.09, 5],
              [-60.08, 5],
            ],
          ],
        ],
      },
    },
  ],
};
export const secondaryRows = secondaryGeometry.features.map((feature) => ({
  ...feature.properties,
  g__type: feature.geometry.type,
  g__coordinates: JSON.stringify(
    "coordinates" in feature.geometry ? feature.geometry.coordinates : [],
  ),
}));
