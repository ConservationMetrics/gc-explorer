import { g as k, r as P } from "./3er_pQBm.js";
import { a as B, D as V } from "./E3LaZOar.js";
import { D as A } from "./guTIq2KN.js";
import {
  e as w,
  r as n,
  g as S,
  m as $,
  v as N,
  c as m,
  o as s,
  h,
  b as v,
  F as G,
  j as H,
  N as C,
  i as a,
  ao as L,
  u as R,
  f as W,
  M as j,
  w as M,
  t as O,
} from "./CSw5FfBj.js";
import { _ as U, u as z } from "./CRyDprp6.js";
import { u as I } from "./BHTMjfoz.js";
const K = {
    id: "galleryContainer",
    class:
      "gallery p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4",
  },
  Y = { key: 0, class: "sticky top-10 right-10 z-10" },
  q = 100,
  J = w({
    __name: "GalleryView",
    props: {
      allowedFileExtensions: {},
      filterColumn: {},
      galleryData: {},
      mediaBasePath: {},
    },
    setup(y) {
      const t = y,
        r = n(t.galleryData),
        f = n(1),
        i = S(() => {
          const l = f.value * q;
          return r.value.slice(0, l);
        }),
        c = () => {
          window.innerHeight + window.scrollY >= document.body.offsetHeight &&
            f.value++;
        };
      ($(() => {
        window.addEventListener("scroll", c);
      }),
        N(() => {
          window.removeEventListener("scroll", c);
        }));
      const p = (e) => {
          e.includes("null")
            ? (r.value = t.galleryData)
            : (r.value = t.galleryData.filter((l) =>
                e.includes(l[t.filterColumn].toString()),
              ));
        },
        u = (e) => ({
          ...e,
          geocoordinates: e.geocoordinates
            ? B(e.geocoordinates)
            : e.geocoordinates,
        });
      return (e, l) => (
        s(),
        m("div", K, [
          e.filterColumn
            ? (s(),
              m("div", Y, [
                v(
                  A,
                  {
                    data: e.galleryData,
                    "filter-column": e.filterColumn,
                    onFilter: p,
                  },
                  null,
                  8,
                  ["data", "filter-column"],
                ),
              ]))
            : h("", !0),
          (s(!0),
          m(
            G,
            null,
            H(
              a(i),
              (o, g) => (
                s(),
                C(
                  V,
                  {
                    key: g,
                    "allowed-file-extensions": e.allowedFileExtensions,
                    feature: u(o),
                    "file-paths": a(k)(o, e.allowedFileExtensions),
                    "media-base-path": e.mediaBasePath,
                  },
                  null,
                  8,
                  [
                    "allowed-file-extensions",
                    "feature",
                    "file-paths",
                    "media-base-path",
                  ],
                )
              ),
            ),
            128,
          )),
        ])
      );
    },
  }),
  Q = { key: 1 },
  oe = w({
    __name: "[tablename]",
    async setup(y) {
      let t, r;
      const i = L().params.tablename,
        c = Array.isArray(i) ? i.join("/") : i,
        p = n(),
        u = n(!1),
        e = n(),
        l = n(),
        o = n(),
        {
          public: { appApiKey: g },
        } = R(),
        F = { "x-api-key": g },
        { data: d, error: _ } =
          (([t, r] = W(() =>
            z(`/api/${c}/gallery`, { headers: F }, "$3OpiiufVrw"),
          )),
          (t = await t),
          r(),
          t);
      d.value && !_.value
        ? ((p.value = d.value.allowedFileExtensions),
          (u.value = !0),
          (e.value = d.value.filterColumn),
          (l.value = d.value.data),
          (o.value = d.value.mediaBasePath))
        : console.error("Error fetching data:", _.value);
      const { t: D } = j();
      return (
        I({
          title: "GuardianConnector Explorer " + D("gallery") + " - " + P(c),
        }),
        (b, T) => {
          const x = J,
            E = U;
          return (
            s(),
            m("div", null, [
              v(E, null, {
                default: M(() => [
                  a(o) && a(u)
                    ? (s(),
                      C(
                        x,
                        {
                          key: 0,
                          "allowed-file-extensions": a(p),
                          "gallery-data": a(l),
                          "filter-column": a(e),
                          "media-base-path": a(o),
                        },
                        null,
                        8,
                        [
                          "allowed-file-extensions",
                          "gallery-data",
                          "filter-column",
                          "media-base-path",
                        ],
                      ))
                    : h("", !0),
                  !a(o) && a(u)
                    ? (s(),
                      m("h3", Q, O(b.$t("galleryNotAvailable")) + ". ", 1))
                    : h("", !0),
                ]),
                _: 1,
              }),
            ])
          );
        }
      );
    },
  });
export { oe as default };
