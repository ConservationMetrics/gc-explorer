import { m as C, V as N, M as z, B as K } from "./R38nlJua.js";
import { g as I, r as O } from "./3er_pQBm.js";
import { p as W, a as Z, c as J, t as R } from "./E3LaZOar.js";
import { D as U } from "./guTIq2KN.js";
import {
  e as D,
  r as o,
  m as G,
  v as H,
  c as E,
  o as f,
  F as q,
  a as Q,
  N as B,
  h as P,
  b as V,
  i as t,
  _ as X,
  ao as Y,
  u as ee,
  f as ae,
  M as oe,
  w as te,
} from "./CSw5FfBj.js";
import { _ as le, u as ne } from "./CRyDprp6.js";
import { u as re } from "./BHTMjfoz.js";
import "./Bx2EM-6T.js";
const se = D({
    __name: "MapView",
    props: {
      allowedFileExtensions: {},
      filterColumn: {},
      mapLegendLayerIds: {},
      mapboxAccessToken: {},
      mapboxBearing: {},
      mapboxLatitude: {},
      mapboxLongitude: {},
      mapboxPitch: {},
      mapboxProjection: {},
      mapboxStyle: {},
      mapboxZoom: {},
      mapbox3d: { type: Boolean },
      mapData: {},
      mediaBasePath: {},
      planetApiKey: {},
    },
    setup(A) {
      const l = A,
        c = o([...l.mapData]),
        e = o(),
        p = o(),
        d = o(!1),
        b = o(!1);
      G(() => {
        ((C.accessToken = l.mapboxAccessToken),
          (e.value = new C.Map({
            container: "map",
            style: l.mapboxStyle || "mapbox://styles/mapbox/streets-v12",
            projection: l.mapboxProjection || "mercator",
            center: [l.mapboxLongitude || 0, l.mapboxLatitude || -15],
            zoom: l.mapboxZoom || 2.5,
            pitch: l.mapboxPitch || 0,
            bearing: l.mapboxBearing || 0,
          })),
          e.value.on("load", () => {
            (l.mapbox3d &&
              (e.value.addSource("mapbox-dem", {
                type: "raster-dem",
                url: "mapbox://mapbox.mapbox-terrain-dem-v1",
                tileSize: 512,
                maxzoom: 14,
              }),
              e.value.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 })),
              x());
            const a = new C.NavigationControl();
            e.value.addControl(a, "top-right");
            const s = new C.ScaleControl({ maxWidth: 80, unit: "metric" });
            e.value.addControl(s, "bottom-left");
            const i = new C.FullscreenControl();
            (e.value.addControl(i, "top-right"), (b.value = !0));
          }));
      });
      const g = () => {
          e.value &&
            (e.value.getStyle().layers.forEach((n) => {
              n.id.startsWith("data-layer") &&
                e.value.getLayer(n.id) &&
                e.value.removeLayer(n.id);
            }),
            e.value.getSource("data-source") &&
              e.value.removeSource("data-source"));
          const a = {
            type: "FeatureCollection",
            features: c.value.map((n) => ({
              type: "Feature",
              geometry: {
                type: n.geotype,
                coordinates: JSON.parse(n.geocoordinates),
              },
              properties: { feature: n },
            })),
          };
          e.value.getSource("data-source") ||
            e.value.addSource("data-source", { type: "geojson", data: a });
          const s = a.features.some((n) => n.geometry.type === "Point"),
            i = a.features.some((n) => n.geometry.type === "LineString"),
            L = a.features.some((n) => n.geometry.type === "Polygon");
          (s &&
            !e.value.getLayer("data-layer-point") &&
            e.value.addLayer({
              id: "data-layer-point",
              type: "circle",
              source: "data-source",
              filter: ["==", "$type", "Point"],
              paint: {
                "circle-radius": 8,
                "circle-color": ["get", "filter-color", ["get", "feature"]],
                "circle-stroke-width": 3,
                "circle-stroke-color": "#fff",
              },
            }),
            i &&
              !e.value.getLayer("data-layer-linestring") &&
              e.value.addLayer({
                id: "data-layer-linestring",
                type: "line",
                source: "data-source",
                filter: ["==", "$type", "LineString"],
                paint: {
                  "line-color": ["get", "filter-color", ["get", "feature"]],
                  "line-width": 2,
                },
              }),
            L &&
              !e.value.getLayer("data-layer-polygon") &&
              e.value.addLayer({
                id: "data-layer-polygon",
                type: "fill",
                source: "data-source",
                filter: ["==", "$type", "Polygon"],
                paint: {
                  "fill-color": ["get", "filter-color", ["get", "feature"]],
                  "fill-opacity": 0.5,
                },
              }));
          const u = [];
          (s && u.push("data-layer-point"),
            i && u.push("data-layer-linestring"),
            L && u.push("data-layer-polygon"),
            u.forEach((n) => {
              (e.value.on(
                "mouseenter",
                n,
                () => {
                  e.value.getCanvas().style.cursor = "pointer";
                },
                { passive: !0 },
              ),
                e.value.on(
                  "mouseleave",
                  n,
                  () => {
                    e.value.getCanvas().style.cursor = "";
                  },
                  { passive: !0 },
                ),
                e.value.on(
                  "click",
                  n,
                  (y) => {
                    if (
                      y.features &&
                      y.features.length > 0 &&
                      y.features[0].properties
                    ) {
                      const m = JSON.parse(y.features[0].properties.feature);
                      (delete m["filter-color"],
                        m.geocoordinates &&
                          (m.geocoordinates = Z(m.geocoordinates)),
                        (p.value = m),
                        (d.value = !0));
                    }
                  },
                  { passive: !0 },
                ));
            }));
        },
        x = () => {
          (g(), k());
        },
        h = o([...l.mapData]),
        S = (a) => {
          (a.includes("null")
            ? (c.value = [...h.value])
            : (c.value = h.value.filter((s) => a.includes(s[l.filterColumn]))),
            g());
        },
        w = o({ id: "custom", style: l.mapboxStyle }),
        _ = (a) => {
          (J(e.value, a, l.planetApiKey),
            (w.value = a),
            e.value.once("idle", () => {
              x();
            }));
        },
        v = o(),
        k = () => {
          l.mapLegendLayerIds &&
            e.value.once("idle", () => {
              v.value = W(e.value, l.mapLegendLayerIds ?? null);
            });
        },
        F = (a) => {
          R(e.value, a);
        };
      return (
        H(() => {
          e.value && e.value.remove();
        }),
        (a, s) => (
          f(),
          E(
            q,
            null,
            [
              s[1] || (s[1] = Q("div", { id: "map" }, null, -1)),
              a.filterColumn
                ? (f(),
                  B(
                    U,
                    {
                      key: 0,
                      data: a.mapData,
                      "filter-column": a.filterColumn,
                      "show-colored-dot": !0,
                      onFilter: S,
                    },
                    null,
                    8,
                    ["data", "filter-column"],
                  ))
                : P("", !0),
              V(
                N,
                {
                  "allowed-file-extensions": a.allowedFileExtensions,
                  feature: t(p),
                  "file-paths": t(I)(t(p), a.allowedFileExtensions),
                  "media-base-path": a.mediaBasePath,
                  "show-sidebar": t(d),
                  onClose: s[0] || (s[0] = (i) => (d.value = !1)),
                },
                null,
                8,
                [
                  "allowed-file-extensions",
                  "feature",
                  "file-paths",
                  "media-base-path",
                  "show-sidebar",
                ],
              ),
              t(v) && a.mapData
                ? (f(),
                  B(
                    z,
                    {
                      key: 1,
                      "map-legend-content": t(v),
                      onToggleLayerVisibility: F,
                    },
                    null,
                    8,
                    ["map-legend-content"],
                  ))
                : P("", !0),
              t(b)
                ? (f(),
                  B(
                    K,
                    {
                      key: 2,
                      "mapbox-style": a.mapboxStyle,
                      "planet-api-key": a.planetApiKey,
                      onBasemapSelected: _,
                    },
                    null,
                    8,
                    ["mapbox-style", "planet-api-key"],
                  ))
                : P("", !0),
            ],
            64,
          )
        )
      );
    },
  }),
  ie = X(se, [["__scopeId", "data-v-e62f1e0b"]]),
  xe = D({
    __name: "[tablename]",
    async setup(A) {
      let l, c;
      const p = Y().params.tablename,
        d = Array.isArray(p) ? p.join("/") : p,
        b = o(),
        g = o(!1),
        x = o(),
        h = o(),
        S = o(),
        w = o(0),
        _ = o(0),
        v = o(0),
        k = o(0),
        F = o(),
        a = o(),
        s = o(0),
        i = o(!1),
        L = o(),
        u = o(),
        n = o(),
        {
          public: { appApiKey: y },
        } = ee(),
        m = { "x-api-key": y },
        { data: r, error: M } =
          (([l, c] = ae(() =>
            ne(`/api/${d}/map`, { headers: m }, "$Lzy6_p8lkk"),
          )),
          (l = await l),
          c(),
          l);
      r.value && !M.value
        ? ((b.value = r.value.allowedFileExtensions),
          (g.value = !0),
          (x.value = r.value.filterColumn),
          (h.value = r.value.mapLegendLayerIds),
          (S.value = r.value.mapboxAccessToken),
          (w.value = r.value.mapboxBearing),
          (_.value = r.value.mapboxLatitude),
          (v.value = r.value.mapboxLongitude),
          (k.value = r.value.mapboxPitch),
          (F.value = r.value.mapboxProjection),
          (a.value = r.value.mapboxStyle),
          (s.value = r.value.mapboxZoom),
          (i.value = r.value.mapbox3d),
          (L.value = r.value.data),
          (u.value = r.value.mediaBasePath),
          (n.value = r.value.planetApiKey))
        : console.error("Error fetching data:", M.value);
      const { t: j } = oe();
      return (
        re({ title: "GuardianConnector Explorer " + j("map") + " - " + O(d) }),
        (pe, ue) => {
          const T = ie,
            $ = le;
          return (
            f(),
            E("div", null, [
              V($, null, {
                default: te(() => [
                  t(g)
                    ? (f(),
                      B(
                        T,
                        {
                          key: 0,
                          "allowed-file-extensions": t(b),
                          "filter-column": t(x),
                          "map-legend-layer-ids": t(h),
                          "mapbox-access-token": t(S),
                          "mapbox-bearing": t(w),
                          "mapbox-latitude": t(_),
                          "mapbox-longitude": t(v),
                          "mapbox-pitch": t(k),
                          "mapbox-projection": t(F),
                          "mapbox-style": t(a),
                          "mapbox-zoom": t(s),
                          mapbox3d: t(i),
                          "map-data": t(L),
                          "media-base-path": t(u),
                          "planet-api-key": t(n),
                        },
                        null,
                        8,
                        [
                          "allowed-file-extensions",
                          "filter-column",
                          "map-legend-layer-ids",
                          "mapbox-access-token",
                          "mapbox-bearing",
                          "mapbox-latitude",
                          "mapbox-longitude",
                          "mapbox-pitch",
                          "mapbox-projection",
                          "mapbox-style",
                          "mapbox-zoom",
                          "mapbox3d",
                          "map-data",
                          "media-base-path",
                          "planet-api-key",
                        ],
                      ))
                    : P("", !0),
                ]),
                _: 1,
              }),
            ])
          );
        }
      );
    },
  });
export { xe as default };
