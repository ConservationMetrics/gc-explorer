import { _ as V } from "./CqDOPDl7.js";
import { _ as w } from "./DiZqGcpG.js";
import {
  p as $,
  e as E,
  r as L,
  u as S,
  f as j,
  g as A,
  c as t,
  o as s,
  a as o,
  h as B,
  b as m,
  t as l,
  i as f,
  F as g,
  j as h,
  d as x,
  w as F,
} from "./CSw5FfBj.js";
import { u as N } from "./CRyDprp6.js";
import { u as D } from "./BHTMjfoz.js";
const G = $("/gcexplorer.png"),
  I = { class: "container flex flex-col items-center mt-8 relative" },
  O = { class: "absolute top-0 right-0 flex justify-end space-x-4 mb-4" },
  R = { class: "text-4xl font-black text-gray-800 mb-4" },
  W = { key: 0, class: "w-1/2" },
  H = { class: "text-gray-800 mb-2" },
  K = { class: "list-none p-0" },
  z = E({
    __name: "index",
    async setup(P) {
      let n, u;
      const a = L({}),
        {
          public: { appApiKey: b },
        } = S(),
        v = { "x-api-key": b },
        { data: d, error: p } =
          (([n, u] = j(() => N("/api/config", { headers: v }, "$77hSeXQoip"))),
          (n = await n),
          u(),
          n);
      if (d.value && !p.value) {
        const e = d.value[0];
        a.value = e;
      } else console.error("Error fetching data:", p.value);
      const y = A(() =>
        Object.keys(a.value)
          .filter((e) => Object.keys(a.value[e]).length > 0)
          .sort()
          .reduce((e, r) => ((e[r] = a.value[r]), e), {}),
      );
      return (
        D({ title: "GuardianConnector Explorer" }),
        (e, r) => {
          const k = V,
            C = w;
          return (
            s(),
            t("div", I, [
              o("div", O, [m(k)]),
              r[0] ||
                (r[0] = o(
                  "img",
                  {
                    src: G,
                    alt: "Guardian Connector Explorer Logo",
                    class: "w-48 h-auto mb-4 mx-auto",
                    loading: "eager",
                  },
                  null,
                  -1,
                )),
              o("h1", R, l(e.$t("availableViews")), 1),
              f(a)
                ? (s(),
                  t("div", W, [
                    (s(!0),
                    t(
                      g,
                      null,
                      h(
                        f(y),
                        (_, i) => (
                          s(),
                          t(
                            "div",
                            {
                              key: i,
                              class: "table-item bg-gray-100 rounded p-4 mb-4",
                            },
                            [
                              o("h2", H, [
                                o("strong", null, l(e.$t("table")) + ":", 1),
                                x(" " + l(i), 1),
                              ]),
                              o("ul", K, [
                                (s(!0),
                                t(
                                  g,
                                  null,
                                  h(
                                    _.VIEWS ? _.VIEWS.split(",") : [],
                                    (c) => (
                                      s(),
                                      t("li", { key: c, class: "mb-2" }, [
                                        m(
                                          C,
                                          {
                                            to: `/${c}/${i}`,
                                            class:
                                              "text-blue-500 no-underline hover:text-blue-700 hover:underline",
                                          },
                                          {
                                            default: F(() => [
                                              x(l(e.$t(c)), 1),
                                            ]),
                                            _: 2,
                                          },
                                          1032,
                                          ["to"],
                                        ),
                                      ])
                                    ),
                                  ),
                                  128,
                                )),
                              ]),
                            ],
                          )
                        ),
                      ),
                      128,
                    )),
                  ]))
                : B("", !0),
            ])
          );
        }
      );
    },
  });
export { z as default };
