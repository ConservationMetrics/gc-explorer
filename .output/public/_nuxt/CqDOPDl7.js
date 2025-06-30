import {
  M as f,
  g as i,
  r as h,
  c as s,
  o as l,
  a,
  h as w,
  d as x,
  t as d,
  F as y,
  j as _,
} from "./CSw5FfBj.js";
const b = { class: "relative inline-block text-left" },
  k = {
    key: 0,
    class:
      "origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50",
  },
  L = { class: "py-1" },
  C = ["onClick"],
  V = {
    __name: "LanguagePicker",
    setup(B) {
      const { locale: u, locales: n, setLocale: g } = f(),
        m = i(() => n.value),
        p = i(() => {
          const t = n.value.find((e) => e.code === u.value);
          return t ? t.name : "";
        }),
        o = h(!1),
        v = (t) => {
          (g(t.code), (o.value = !1));
        };
      return (t, e) => (
        l(),
        s("div", b, [
          a("div", null, [
            a(
              "button",
              {
                onClick: e[0] || (e[0] = (r) => (o.value = !o.value)),
                class:
                  "inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none",
              },
              [
                x(d(p.value) + " ", 1),
                e[1] ||
                  (e[1] = a(
                    "svg",
                    {
                      class: "-mr-1 ml-2 h-5 w-5",
                      xmlns: "http://www.w3.org/2000/svg",
                      viewBox: "0 0 20 20",
                      fill: "currentColor",
                      "aria-hidden": "true",
                    },
                    [
                      a("path", {
                        "fill-rule": "evenodd",
                        d: "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z",
                        "clip-rule": "evenodd",
                      }),
                    ],
                    -1,
                  )),
              ],
            ),
          ]),
          o.value
            ? (l(),
              s("div", k, [
                a("div", L, [
                  (l(!0),
                  s(
                    y,
                    null,
                    _(
                      m.value,
                      (r) => (
                        l(),
                        s(
                          "a",
                          {
                            href: "#",
                            key: r.code,
                            class:
                              "block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100",
                            onClick: (c) => (
                              c.preventDefault(),
                              c.stopPropagation(),
                              v(r)
                            ),
                          },
                          d(r.name),
                          9,
                          C,
                        )
                      ),
                    ),
                    128,
                  )),
                ]),
              ]))
            : w("", !0),
        ])
      );
    },
  };
export { V as _ };
