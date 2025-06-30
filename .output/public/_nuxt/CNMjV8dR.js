import { _ as f } from "./CqDOPDl7.js";
import {
  c as d,
  o as u,
  a,
  b,
  h,
  t as i,
  r as m,
  k as v,
  K as x,
  e as y,
  L as k,
  m as w,
  M,
  N as P,
  i as p,
} from "./CSw5FfBj.js";
import { u as C } from "./BHTMjfoz.js";
const L = { class: "container relative" },
  $ = {
    class: "absolute top-0 right-0 flex justify-end space-x-4 mt-4 mr-4 mb-4",
  },
  A = { class: "flex flex-col items-center justify-center h-screen" },
  B = { class: "italic" },
  I = { key: 0, class: "text-red-500 text-xs italic" },
  R = {
    __name: "Auth0Login",
    props: { errorMessage: { type: String, required: !0 } },
    setup(n) {
      const t = n,
        o = () => {
          window.location.href = "/auth/auth0";
        };
      return (e, c) => {
        const s = f;
        return (
          u(),
          d("div", L, [
            a("div", $, [b(s)]),
            a("div", A, [
              a("p", B, i(e.$t("authMessage")) + ".", 1),
              a(
                "button",
                {
                  class:
                    "px-4 py-2 mt-4 mb-4 bg-blue-500 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50",
                  onClick: o,
                },
                i(e.$t("loginButton")),
                1,
              ),
              t.errorMessage
                ? (u(), d("p", I, i(e.$t("yourAccessIsPending")), 1))
                : h("", !0),
            ]),
          ])
        );
      };
    },
  },
  N = (n) => {
    let t;
    const o = m(""),
      e = v(),
      c = x(),
      s = e.currentRoute.value.query.redirect;
    o.value = s ? decodeURIComponent(s) : c("/");
    const r = new URLSearchParams(window.location.search),
      l = r.get("code");
    l && (window.location.href = `/auth/auth0?code=${l}`);
    const _ = r.get("error"),
      g = r.get("error_description");
    return (
      _ === "access_denied" && (t = decodeURIComponent(g || "")),
      n.value && e.push(o.value),
      t
    );
  },
  j = y({
    __name: "login",
    setup(n) {
      const { loggedIn: t } = k(),
        o = m("");
      w(() => {
        o.value = N(t);
      });
      const { t: e } = M();
      return (
        C({ title: "GuardianConnector Explorer: " + e("login") }),
        (c, s) => {
          const r = R;
          return p(t) === !1
            ? (u(),
              P(r, { key: 0, "error-message": p(o) }, null, 8, [
                "error-message",
              ]))
            : h("", !0);
        }
      );
    },
  });
export { j as default };
