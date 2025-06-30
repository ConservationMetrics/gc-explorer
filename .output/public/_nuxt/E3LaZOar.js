import {
  y as B,
  aG as G,
  aH as ee,
  D as O,
  E as M,
  aI as te,
  aJ as W,
  aK as se,
  l as Z,
  u as re,
  g as m,
  e as N,
  aL as ie,
  r as j,
  m as oe,
  c as f,
  ae,
  o as u,
  af as E,
  i as p,
  aM as ne,
  h as x,
  a as w,
  b as le,
  w as ce,
  t as $,
  d as F,
  F as I,
  j as z,
  ah as D,
  N as U,
  aN as de,
  _ as ue,
} from "./CSw5FfBj.js";
const T = {
    planet: {
      style: {
        version: 8,
        sources: {
          planet: {
            type: "raster",
            tiles: [
              "https://tiles.planet.com/basemaps/v1/planet-tiles/global_monthly_monthYear_mosaic/gmap/{z}/{x}/{y}?api_key=",
            ],
            tileSize: 256,
          },
        },
        layers: [
          {
            id: "background",
            type: "background",
            paint: { "background-color": "#f9f9f9" },
          },
          { id: "planet", type: "raster", source: "planet", paint: {} },
        ],
      },
    },
  },
  yt = (e, t, r) => {
    if (t.style) e.setStyle(t.style);
    else if (t.id === "planet" && T.planet.style && r) {
      const s = JSON.parse(JSON.stringify(T.planet.style));
      ((s.sources.planet.tiles[0] = s.sources.planet.tiles[0].replace(
        "monthYear",
        t.monthYear || "2024-01",
      )),
        (s.sources.planet.tiles[0] += r),
        e.setStyle(s));
    } else console.warn("Basemap style not found, or API key not provided");
  },
  fe = (e, t) => {
    const r = t.split(","),
      s = [];
    return (
      r.forEach((i) => {
        i = i.trim();
        const n = e.getLayer(i);
        n && n.type !== "custom" && s.push(n);
      }),
      s
    );
  },
  wt = (e, t, r) => {
    if (!t || !e.isStyleLoaded()) return;
    const i = fe(e, t)
      .map((n) => {
        const a = n.id,
          c = n.type;
        let l = e.getPaintProperty(a, `${c}-color`);
        if (!l) return;
        const o = l[3];
        Array.isArray(o) && r && (l = r);
        let h = a.replace(/-/g, " ").replace(/^\w/, (g) => g.toUpperCase());
        return (
          (h = h.replace(/ polygon| linestring| point$/i, "")),
          { id: a, name: h, type: c, color: l }
        );
      })
      .filter(Boolean);
    if (i.length !== 0) return i;
  },
  vt = (e) => (
    typeof e == "object" && (e = JSON.stringify(e)),
    e.replace("[", "").replace("]", "").split(",").reverse().join(",")
  ),
  bt = (e, t) => {
    const r = t.id,
      s = t.visible ? "visible" : "none";
    e.setLayoutProperty(r, "visibility", s);
    const i = `${r}-stroke`;
    e.getLayer(i) && e.setLayoutProperty(i, "visibility", s);
  };
/**
 * @license lucide-vue-next v0.516.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const V = (e) => e.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(),
  he = (e) =>
    e.replace(/^([A-Z])|[\s-_]+(\w)/g, (t, r, s) =>
      s ? s.toUpperCase() : r.toLowerCase(),
    ),
  pe = (e) => {
    const t = he(e);
    return t.charAt(0).toUpperCase() + t.slice(1);
  },
  ge = (...e) =>
    e
      .filter((t, r, s) => !!t && t.trim() !== "" && s.indexOf(t) === r)
      .join(" ")
      .trim();
/**
 * @license lucide-vue-next v0.516.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var q = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": 2,
  "stroke-linecap": "round",
  "stroke-linejoin": "round",
};
/**
 * @license lucide-vue-next v0.516.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const me = (
  {
    size: e,
    strokeWidth: t = 2,
    absoluteStrokeWidth: r,
    color: s,
    iconNode: i,
    name: n,
    class: a,
    ...c
  },
  { slots: l },
) =>
  B(
    "svg",
    {
      ...q,
      width: e || q.width,
      height: e || q.height,
      stroke: s || q.stroke,
      "stroke-width": r ? (Number(t) * 24) / Number(e) : t,
      class: ge(
        "lucide",
        ...(n
          ? [`lucide-${V(pe(n))}-icon`, `lucide-${V(n)}`]
          : ["lucide-icon"]),
      ),
      ...c,
    },
    [...i.map((o) => B(...o)), ...(l.default ? [l.default()] : [])],
  );
/**
 * @license lucide-vue-next v0.516.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Y =
  (e, t) =>
  (r, { slots: s }) =>
    B(me, { ...r, iconNode: t, name: e }, s);
/**
 * @license lucide-vue-next v0.516.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const ye = Y("check", [["path", { d: "M20 6 9 17l-5-5", key: "1gmf2c" }]]);
/**
 * @license lucide-vue-next v0.516.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const we = Y("copy", [
  [
    "rect",
    {
      width: "14",
      height: "14",
      x: "8",
      y: "8",
      rx: "2",
      ry: "2",
      key: "17jyea",
    },
  ],
  [
    "path",
    {
      d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",
      key: "zix9uf",
    },
  ],
]);
async function ve(e, t) {
  return await be(t).catch(
    (s) => (
      console.error("Failed to get image meta for " + t, s + ""),
      { width: 0, height: 0, ratio: 0 }
    ),
  );
}
async function be(e) {
  if (typeof Image > "u") throw new TypeError("Image not supported");
  return new Promise((t, r) => {
    const s = new Image();
    ((s.onload = () => {
      const i = { width: s.width, height: s.height, ratio: s.width / s.height };
      t(i);
    }),
      (s.onerror = (i) => r(i)),
      (s.src = e));
  });
}
function H(e) {
  return (t) => (t ? e[t] || t : e.missingValue);
}
function _e({ formatter: e, keyMap: t, joinWith: r = "/", valueMap: s } = {}) {
  (e || (e = (n, a) => `${n}=${a}`), t && typeof t != "function" && (t = H(t)));
  const i = s || {};
  return (
    Object.keys(i).forEach((n) => {
      typeof i[n] != "function" && (i[n] = H(i[n]));
    }),
    (n = {}) =>
      Object.entries(n)
        .filter(([c, l]) => typeof l < "u")
        .map(([c, l]) => {
          const o = i[c];
          return (
            typeof o == "function" && (l = o(n[c])),
            (c = typeof t == "function" ? t(c) : c),
            e(c, l)
          );
        })
        .join(r)
  );
}
function S(e = "") {
  if (typeof e == "number") return e;
  if (typeof e == "string" && e.replace("px", "").match(/^\d+$/g))
    return Number.parseInt(e, 10);
}
function $e(e = "") {
  if (e === void 0 || !e.length) return [];
  const t = new Set();
  for (const r of e.split(" ")) {
    const s = Number.parseInt(r.replace("x", ""));
    s && t.add(s);
  }
  return Array.from(t);
}
function Se(e) {
  if (e.length === 0)
    throw new Error(
      "`densities` must not be empty, configure to `1` to render regular size only (DPR 1.0)",
    );
}
function xe(e) {
  const t = {};
  if (typeof e == "string")
    for (const r of e.split(/[\s,]+/).filter((s) => s)) {
      const s = r.split(":");
      s.length !== 2
        ? (t["1px"] = s[0].trim())
        : (t[s[0].trim()] = s[1].trim());
    }
  else Object.assign(t, e);
  return t;
}
function Pe(e) {
  const t = { options: e },
    r = (i, n = {}) => Q(t, i, n),
    s = (i, n = {}, a = {}) =>
      r(i, { ...a, modifiers: G(n, a.modifiers || {}) }).url;
  for (const i in e.presets)
    s[i] = (n, a, c) => s(n, a, { ...e.presets[i], ...c });
  return (
    (s.options = e),
    (s.getImage = r),
    (s.getMeta = (i, n) => ke(t, i, n)),
    (s.getSizes = (i, n) => qe(t, i, n)),
    (t.$img = s),
    s
  );
}
async function ke(e, t, r) {
  const s = Q(e, t, { ...r });
  return typeof s.getMeta == "function"
    ? await s.getMeta()
    : await ve(e, s.url);
}
function Q(e, t, r) {
  var o, h;
  if (t && typeof t != "string")
    throw new TypeError(
      `input must be a string (received ${typeof t}: ${JSON.stringify(t)})`,
    );
  if (!t || t.startsWith("data:")) return { url: t };
  const { provider: s, defaults: i } = Ae(e, r.provider || e.options.provider),
    n = Ce(e, r.preset);
  if (((t = O(t) ? t : ee(t)), !s.supportsAlias)) {
    for (const g in e.options.alias)
      if (t.startsWith(g)) {
        const y = e.options.alias[g];
        y && (t = M(y, t.slice(g.length)));
      }
  }
  if (s.validateDomains && O(t)) {
    const g = te(t).host;
    if (!e.options.domains.find((y) => y === g)) return { url: t };
  }
  const a = G(r, n, i);
  a.modifiers = { ...a.modifiers };
  const c = a.modifiers.format;
  ((o = a.modifiers) != null &&
    o.width &&
    (a.modifiers.width = S(a.modifiers.width)),
    (h = a.modifiers) != null &&
      h.height &&
      (a.modifiers.height = S(a.modifiers.height)));
  const l = s.getImage(t, a, e);
  return ((l.format = l.format || c || ""), l);
}
function Ae(e, t) {
  const r = e.options.providers[t];
  if (!r) throw new Error("Unknown provider: " + t);
  return r;
}
function Ce(e, t) {
  if (!t) return {};
  if (!e.options.presets[t]) throw new Error("Unknown preset: " + t);
  return e.options.presets[t];
}
function qe(e, t, r) {
  var k, L, C, d, v;
  const s = S((k = r.modifiers) == null ? void 0 : k.width),
    i = S((L = r.modifiers) == null ? void 0 : L.height),
    n = xe(r.sizes),
    a =
      (C = r.densities) != null && C.trim()
        ? $e(r.densities.trim())
        : e.options.densities;
  Se(a);
  const c = s && i ? i / s : 0,
    l = [],
    o = [];
  if (Object.keys(n).length >= 1) {
    for (const b in n) {
      const _ = R(b, String(n[b]), i, c, e);
      if (_ !== void 0) {
        l.push({
          size: _.size,
          screenMaxWidth: _.screenMaxWidth,
          media: `(max-width: ${_.screenMaxWidth}px)`,
        });
        for (const A of a)
          o.push({ width: _._cWidth * A, src: J(e, t, r, _, A) });
      }
    }
    Le(l);
  } else
    for (const b of a) {
      const _ = Object.keys(n)[0];
      let A = _ ? R(_, String(n[_]), i, c, e) : void 0;
      (A === void 0 &&
        (A = {
          size: "",
          screenMaxWidth: 0,
          _cWidth: (d = r.modifiers) == null ? void 0 : d.width,
          _cHeight: (v = r.modifiers) == null ? void 0 : v.height,
        }),
        o.push({ width: b, src: J(e, t, r, A, b) }));
    }
  Ie(o);
  const h = o[o.length - 1],
    g = l.length
      ? l.map((b) => `${b.media ? b.media + " " : ""}${b.size}`).join(", ")
      : void 0,
    y = g ? "w" : "x",
    P = o.map((b) => `${b.src} ${b.width}${y}`).join(", ");
  return { sizes: g, srcset: P, src: h == null ? void 0 : h.src };
}
function R(e, t, r, s, i) {
  const n = (i.options.screens && i.options.screens[e]) || Number.parseInt(e),
    a = t.endsWith("vw");
  if ((!a && /^\d+$/.test(t) && (t = t + "px"), !a && !t.endsWith("px")))
    return;
  let c = Number.parseInt(t);
  if (!n || !c) return;
  a && (c = Math.round((c / 100) * n));
  const l = s ? Math.round(c * s) : r;
  return { size: t, screenMaxWidth: n, _cWidth: c, _cHeight: l };
}
function J(e, t, r, s, i) {
  return e.$img(
    t,
    {
      ...r.modifiers,
      width: s._cWidth ? s._cWidth * i : void 0,
      height: s._cHeight ? s._cHeight * i : void 0,
    },
    r,
  );
}
function Le(e) {
  var r;
  e.sort((s, i) => s.screenMaxWidth - i.screenMaxWidth);
  let t = null;
  for (let s = e.length - 1; s >= 0; s--) {
    const i = e[s];
    (i.media === t && e.splice(s, 1), (t = i.media));
  }
  for (let s = 0; s < e.length; s++)
    e[s].media = ((r = e[s + 1]) == null ? void 0 : r.media) || "";
}
function Ie(e) {
  e.sort((r, s) => r.width - s.width);
  let t = null;
  for (let r = e.length - 1; r >= 0; r--) {
    const s = e[r];
    (s.width === t && e.splice(r, 1), (t = s.width));
  }
}
const ze = _e({
    keyMap: {
      format: "f",
      fit: "fit",
      width: "w",
      height: "h",
      resize: "s",
      quality: "q",
      background: "b",
    },
    joinWith: "&",
    formatter: (e, t) => W(e) + "_" + W(t),
  }),
  Be = (e, { modifiers: t = {}, baseURL: r } = {}, s) => {
    t.width &&
      t.height &&
      ((t.resize = `${t.width}x${t.height}`), delete t.width, delete t.height);
    const i = ze(t) || "_";
    return (
      r || (r = M(s.options.nuxt.baseURL, "/_ipx")),
      { url: M(r, i, se(e)) }
    );
  },
  Me = !0,
  je = !0,
  Ee = Object.freeze(
    Object.defineProperty(
      { __proto__: null, getImage: Be, supportsAlias: je, validateDomains: Me },
      Symbol.toStringTag,
      { value: "Module" },
    ),
  ),
  X = {
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
      "2xl": 1536,
    },
    presets: {
      gallery: { modifiers: { format: "webp", quality: 80, fit: "cover" } },
      logo: { modifiers: { format: "webp", quality: 85, fit: "contain" } },
      icon: { modifiers: { format: "webp", quality: 90, fit: "contain" } },
      thumbnail: {
        modifiers: {
          format: "webp",
          quality: 75,
          width: 300,
          height: 200,
          fit: "cover",
        },
      },
    },
    provider: "ipx",
    domains: [],
    alias: {},
    densities: [1, 2],
    format: ["webp", "avif", "jpeg", "webp"],
    quality: 80,
  };
X.providers = { ipx: { provider: Ee, defaults: {} } };
const K = () => {
  const e = re(),
    t = Z();
  return (
    t.$img ||
    t._img ||
    (t._img = Pe({ ...X, nuxt: { baseURL: e.app.baseURL }, runtimeConfig: e }))
  );
};
function Fe(e) {
  var t;
  (t = performance == null ? void 0 : performance.mark) == null ||
    t.call(performance, "mark_feature_usage", { detail: { feature: e } });
}
const Ne = {
    src: { type: String, required: !1 },
    format: { type: String, required: !1 },
    quality: { type: [Number, String], required: !1 },
    background: { type: String, required: !1 },
    fit: { type: String, required: !1 },
    modifiers: { type: Object, required: !1 },
    preset: { type: String, required: !1 },
    provider: { type: String, required: !1 },
    sizes: { type: [Object, String], required: !1 },
    densities: { type: String, required: !1 },
    preload: { type: [Boolean, Object], required: !1 },
    width: { type: [String, Number], required: !1 },
    height: { type: [String, Number], required: !1 },
    alt: { type: String, required: !1 },
    referrerpolicy: { type: String, required: !1 },
    usemap: { type: String, required: !1 },
    longdesc: { type: String, required: !1 },
    ismap: { type: Boolean, required: !1 },
    loading: {
      type: String,
      required: !1,
      validator: (e) => ["lazy", "eager"].includes(e),
    },
    crossorigin: {
      type: [Boolean, String],
      required: !1,
      validator: (e) =>
        ["anonymous", "use-credentials", "", !0, !1].includes(e),
    },
    decoding: {
      type: String,
      required: !1,
      validator: (e) => ["async", "auto", "sync"].includes(e),
    },
    nonce: { type: [String], required: !1 },
  },
  Oe = (e) => {
    const t = m(() => ({ provider: e.provider, preset: e.preset })),
      r = m(() => ({
        width: S(e.width),
        height: S(e.height),
        alt: e.alt,
        referrerpolicy: e.referrerpolicy,
        usemap: e.usemap,
        longdesc: e.longdesc,
        ismap: e.ismap,
        crossorigin:
          e.crossorigin === !0 ? "anonymous" : e.crossorigin || void 0,
        loading: e.loading,
        decoding: e.decoding,
        nonce: e.nonce,
      })),
      s = K(),
      i = m(() => ({
        ...e.modifiers,
        width: S(e.width),
        height: S(e.height),
        format: e.format,
        quality: e.quality || s.options.quality,
        background: e.background,
        fit: e.fit,
      }));
    return { options: t, attrs: r, modifiers: i };
  },
  We = {
    ...Ne,
    placeholder: { type: [Boolean, String, Number, Array], required: !1 },
    placeholderClass: { type: String, required: !1 },
    custom: { type: Boolean, required: !1 },
  },
  De = ["src"],
  Ue = N({
    __name: "NuxtImg",
    props: We,
    emits: ["load", "error"],
    setup(e, { emit: t }) {
      const r = e,
        s = ie(),
        i = t,
        n = !1,
        a = K(),
        c = Oe(r),
        l = j(!1),
        o = j(),
        h = m(() =>
          a.getSizes(r.src, {
            ...c.options.value,
            sizes: r.sizes,
            densities: r.densities,
            modifiers: {
              ...c.modifiers.value,
              width: S(r.width),
              height: S(r.height),
            },
          }),
        ),
        g = m(() => {
          const d = { ...c.attrs.value, "data-nuxt-img": "" };
          return (
            (!r.placeholder || l.value) &&
              ((d.sizes = h.value.sizes), (d.srcset = h.value.srcset)),
            d
          );
        }),
        y = m(() => {
          let d = r.placeholder;
          if ((d === "" && (d = !0), !d || l.value)) return !1;
          if (typeof d == "string") return d;
          const v = Array.isArray(d)
            ? d
            : typeof d == "number"
              ? [d, d]
              : [10, 10];
          return a(
            r.src,
            {
              ...c.modifiers.value,
              width: v[0],
              height: v[1],
              quality: v[2] || 50,
              blur: v[3] || 3,
            },
            c.options.value,
          );
        }),
        P = m(() =>
          r.sizes ? h.value.src : a(r.src, c.modifiers.value, c.options.value),
        ),
        k = m(() => (y.value ? y.value : P.value)),
        C = Z().isHydrating;
      return (
        oe(() => {
          if (y.value || r.custom) {
            const d = new Image();
            (P.value && (d.src = P.value),
              r.sizes &&
                ((d.sizes = h.value.sizes || ""), (d.srcset = h.value.srcset)),
              (d.onload = (v) => {
                ((l.value = !0), i("load", v));
              }),
              (d.onerror = (v) => {
                i("error", v);
              }),
              Fe("nuxt-image"));
            return;
          }
          o.value &&
            (o.value.complete &&
              C &&
              (o.value.getAttribute("data-error")
                ? i("error", new Event("error"))
                : i("load", new Event("load"))),
            (o.value.onload = (d) => {
              i("load", d);
            }),
            (o.value.onerror = (d) => {
              i("error", d);
            }));
        }),
        (d, v) =>
          d.custom
            ? ae(
                d.$slots,
                "default",
                ne(
                  E(
                    { key: 1 },
                    {
                      ...(p(n)
                        ? { onerror: "this.setAttribute('data-error', 1)" }
                        : {}),
                      imgAttrs: { ...g.value, ...p(s) },
                      isLoaded: l.value,
                      src: k.value,
                    },
                  ),
                ),
              )
            : (u(),
              f(
                "img",
                E(
                  {
                    key: 0,
                    ref_key: "imgEl",
                    ref: o,
                    class: y.value && !l.value ? d.placeholderClass : void 0,
                  },
                  {
                    ...(p(n)
                      ? { onerror: "this.setAttribute('data-error', 1)" }
                      : {}),
                    ...g.value,
                    ...p(s),
                  },
                  { src: k.value },
                ),
                null,
                16,
                De,
              ))
      );
    },
  }),
  Te = { key: 0, class: "mb-4" },
  Ve = ["href", "data-lightbox", "data-title"],
  He = ["src"],
  Re = ["src"],
  Je = { key: 0, class: "text-center flex items-center justify-center" },
  Ge = { key: 0, class: "italic" },
  Ze = { key: 1, class: "italic" },
  Ye = { key: 1, class: "mb-4" },
  Qe = { controls: "", class: "w-full", preload: "none" },
  Xe = ["src", "type"],
  Ke = { key: 2, class: "mb-4" },
  et = { controls: "", class: "w-full h-auto rounded-lg", preload: "none" },
  tt = ["src", "type"],
  st = N({
    __name: "MediaFile",
    props: { allowedFileExtensions: {}, filePath: {}, mediaBasePath: {} },
    setup(e) {
      const t = e,
        r = m(() => a(t.allowedFileExtensions.audio)),
        s = m(() => a(t.allowedFileExtensions.image)),
        i = m(() => a(t.allowedFileExtensions.video)),
        n = (o) => (o.split(".").pop() || "").toLowerCase(),
        a = (o) => {
          if (!o) return !1;
          const h = n(t.filePath);
          return o.includes(h);
        },
        c = m(() => t.mediaBasePath + "/" + t.filePath),
        l = m(
          () => "https://placehold.co/400x300/cccccc/666666?text=Loading...",
        );
      return (o, h) => {
        const g = Ue;
        return (
          u(),
          f("div", null, [
            p(s)
              ? (u(),
                f("div", Te, [
                  w(
                    "a",
                    {
                      href: p(c),
                      target: "_blank",
                      "data-lightbox": o.filePath,
                      "data-title": o.filePath,
                    },
                    [
                      le(
                        g,
                        {
                          src: p(c),
                          alt: "Image",
                          class: "w-full h-auto rounded-lg",
                          loading: "lazy",
                          preset: "gallery",
                          sizes: "sm:100vw md:50vw lg:33vw xl:25vw",
                          custom: !0,
                        },
                        {
                          default: ce(
                            ({ src: y, isLoaded: P, imgAttrs: k }) => [
                              P
                                ? (u(),
                                  f(
                                    "img",
                                    E({ key: 0 }, k, {
                                      src: y,
                                      class: "w-full h-auto rounded-lg",
                                    }),
                                    null,
                                    16,
                                    He,
                                  ))
                                : (u(),
                                  f(
                                    "img",
                                    {
                                      key: 1,
                                      src: p(l),
                                      alt: "Loading placeholder",
                                      class:
                                        "w-full h-auto rounded-lg blur-sm scale-105",
                                    },
                                    null,
                                    8,
                                    Re,
                                  )),
                            ],
                          ),
                          _: 1,
                        },
                        8,
                        ["src"],
                      ),
                    ],
                    8,
                    Ve,
                  ),
                  o.filePath
                    ? (u(),
                      f("div", Je, [
                        o.filePath.includes("t0.jpg")
                          ? (u(), f("span", Ge, $(o.$t("before")), 1))
                          : o.filePath.includes("t1.jpg")
                            ? (u(), f("span", Ze, $(o.$t("after")), 1))
                            : x("", !0),
                      ]))
                    : x("", !0),
                ]))
              : x("", !0),
            p(r)
              ? (u(),
                f("div", Ye, [
                  w("audio", Qe, [
                    w(
                      "source",
                      {
                        src: o.mediaBasePath + "/" + o.filePath,
                        type:
                          n(o.filePath) === "m4a"
                            ? "audio/x-m4a"
                            : "audio/" + n(o.filePath),
                      },
                      null,
                      8,
                      Xe,
                    ),
                    F(" " + $(o.$t("browserDoesntSupportAudio")) + ". ", 1),
                  ]),
                ]))
              : x("", !0),
            p(i)
              ? (u(),
                f("div", Ke, [
                  w("video", et, [
                    w(
                      "source",
                      {
                        src: o.mediaBasePath + "/" + o.filePath,
                        type: "video/" + n(o.filePath),
                      },
                      null,
                      8,
                      tt,
                    ),
                    F(" " + $(o.$t("browserDoesntSupportVideo")) + ". ", 1),
                  ]),
                ]))
              : x("", !0),
          ])
        );
      };
    },
  }),
  rt = { class: "rounded-lg border bg-card text-card-foreground shadow-sm" },
  it = { class: "p-6 space-y-6" },
  ot = { key: 0, class: "mb-4" },
  at = { class: "text-2xl font-semibold tracking-tight" },
  nt = { class: "space-y-3" },
  lt = { key: 0, class: "flex flex-col gap-1" },
  ct = { class: "text-sm font-medium" },
  dt = { class: "text-sm text-muted-foreground" },
  ut = { key: 0, class: "break-words" },
  ft = { key: 1, class: "flex items-center gap-2" },
  ht = ["href"],
  pt = { key: 0, class: "mt-6 pt-4 border-t border-gray-200" },
  gt = N({
    __name: "DataFeature",
    props: {
      allowedFileExtensions: {},
      feature: {},
      filePaths: {},
      isAlert: { type: Boolean },
      isMapeo: { type: Boolean },
      isAlertsDashboard: { type: Boolean },
      mediaBasePath: {},
      mediaBasePathAlerts: {},
    },
    setup(e) {
      const t = e,
        r = j(!1),
        s = () => {
          (navigator.clipboard.writeText(window.location.href),
            (r.value = !0),
            setTimeout(() => {
              r.value = !1;
            }, 2e3));
        },
        i = m(() =>
          Object.keys(t.feature)
            .sort()
            .reduce((a, c) => (t.feature && (a[c] = t.feature[c]), a), {}),
        ),
        n = () =>
          t.isAlert && t.mediaBasePathAlerts
            ? t.mediaBasePathAlerts
            : !t.isAlert && t.mediaBasePath
              ? t.mediaBasePath
              : "";
      return (a, c) => (
        u(),
        f("div", rt, [
          w("div", it, [
            (u(!0),
            f(
              I,
              null,
              z(
                p(i),
                (l, o) => (
                  u(),
                  f("div", { key: o }, [
                    o.toLowerCase().includes("data source")
                      ? (u(), f("div", ot, [w("h1", at, $(l) + " data ", 1)]))
                      : x("", !0),
                  ])
                ),
              ),
              128,
            )),
            a.allowedFileExtensions && n()
              ? (u(),
                f(
                  "div",
                  { key: 0, class: D({ "grid grid-cols-2 gap-6": a.isAlert }) },
                  [
                    (u(!0),
                    f(
                      I,
                      null,
                      z(
                        a.filePaths,
                        (l) => (
                          u(),
                          U(
                            st,
                            {
                              key: l,
                              "allowed-file-extensions":
                                a.allowedFileExtensions,
                              "file-path": l,
                              "media-base-path": n(),
                            },
                            null,
                            8,
                            [
                              "allowed-file-extensions",
                              "file-path",
                              "media-base-path",
                            ],
                          )
                        ),
                      ),
                      128,
                    )),
                  ],
                  2,
                ))
              : x("", !0),
            w("div", nt, [
              (u(!0),
              f(
                I,
                null,
                z(
                  p(i),
                  (l, o) => (
                    u(),
                    f("div", { key: o }, [
                      l !== null &&
                      l !== "" &&
                      o.toLowerCase() !== "uuid" &&
                      !o.toLowerCase().includes("photo") &&
                      o.toLowerCase() !== "audio" &&
                      !o.toLowerCase().includes("data source")
                        ? (u(),
                          f("div", lt, [
                            w(
                              "span",
                              ct,
                              $(
                                a.isAlert
                                  ? a.$t(o).charAt(0).toUpperCase() +
                                      a.$t(o).slice(1)
                                  : o === "dataCollectedOn"
                                    ? a.$t(o)
                                    : o.charAt(0).toUpperCase() + o.slice(1),
                              ),
                              1,
                            ),
                            w("div", dt, [
                              o !== "geographicCentroid" &&
                              o !== "geocoordinates"
                                ? (u(), f("span", ut, $(l), 1))
                                : (u(),
                                  f("span", ft, [
                                    F($(l) + " ", 1),
                                    w(
                                      "a",
                                      {
                                        href:
                                          "https://www.google.com/maps/search/?api=1&query=" +
                                          l,
                                        target: "_blank",
                                        class:
                                          "text-primary hover:text-primary/90 underline-offset-4 hover:underline",
                                      },
                                      "(" + $(a.$t("viewOnGoogleMaps")) + ")",
                                      9,
                                      ht,
                                    ),
                                  ])),
                            ]),
                          ]))
                        : x("", !0),
                    ])
                  ),
                ),
                128,
              )),
            ]),
          ]),
          a.isAlertsDashboard
            ? (u(),
              f("div", pt, [
                w(
                  "button",
                  {
                    class:
                      "flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200",
                    onClick: s,
                  },
                  [
                    (u(),
                    U(
                      de(p(r) ? p(ye) : p(we)),
                      { class: D(["w-4 h-4", { "text-green-500": p(r) }]) },
                      null,
                      8,
                      ["class"],
                    )),
                    w(
                      "span",
                      null,
                      $(
                        p(r)
                          ? a.$t("copied")
                          : a.isMapeo
                            ? a.$t("copyMapeoLink")
                            : a.$t("copyLink"),
                      ),
                      1,
                    ),
                  ],
                ),
              ]))
            : x("", !0),
        ])
      );
    },
  }),
  _t = ue(gt, [["__scopeId", "data-v-a6fbe7e1"]]);
export { _t as D, Ue as _, vt as a, Y as b, yt as c, wt as p, bt as t };
