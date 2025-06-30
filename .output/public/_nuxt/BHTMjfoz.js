import { aZ as n, a_ as s, a$ as r, ay as o, b0 as i } from "./CSw5FfBj.js";
function u(a) {
  var t;
  const e = a || s();
  return (
    ((t = e == null ? void 0 : e.ssrContext) == null ? void 0 : t.head) ||
    (e == null
      ? void 0
      : e.runWithContext(() => {
          if (r()) return o(i);
        }))
  );
}
function d(a, e = {}) {
  const t = u(e.nuxt);
  if (t) return n(a, { head: t, ...e });
}
export { d as u };
