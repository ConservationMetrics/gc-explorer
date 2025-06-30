var $ = Object.defineProperty;
var G = (a, e, n) =>
  e in a
    ? $(a, e, { enumerable: !0, configurable: !0, writable: !0, value: n })
    : (a[e] = n);
var C = (a, e, n) => G(a, typeof e != "symbol" ? e + "" : e, n);
import {
  aO as W,
  e as Q,
  s as M,
  m as X,
  aP as Y,
  y as x,
  c as J,
  aQ as N,
  aB as Z,
  g as U,
  aR as v,
  l as K,
  aS as w,
  aT as k,
  at as A,
  ay as ee,
  O as F,
  aU as ae,
  r as te,
  ax as se,
  ar as ne,
  aV as re,
  i as ie,
  aW as ce,
  aX as q,
  aY as oe,
} from "./CSw5FfBj.js";
/**
 * @vue/shared v3.5.16
 * (c) 2018-present Yuxi (Evan) You and Vue contributors
 * @license MIT
 **/ const le = Object.prototype.toString,
  ue = (a) => le.call(a),
  fe = (a) => ue(a) === "[object Object]",
  de = [
    1779033703, -1150833019, 1013904242, -1521486534, 1359893119, -1694144372,
    528734635, 1541459225,
  ],
  he = [
    1116352408, 1899447441, -1245643825, -373957723, 961987163, 1508970993,
    -1841331548, -1424204075, -670586216, 310598401, 607225278, 1426881987,
    1925078388, -2132889090, -1680079193, -1046744716, -459576895, -272742522,
    264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986,
    -1740746414, -1473132947, -1341970488, -1084653625, -958395405, -710438585,
    113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291,
    1695183700, 1986661051, -2117940946, -1838011259, -1564481375, -1474664885,
    -1035236496, -949202525, -778901479, -694614492, -200395387, 275423344,
    430227734, 506948616, 659060556, 883997877, 958139571, 1322822218,
    1537002063, 1747873779, 1955562222, 2024104815, -2067236844, -1933114872,
    -1866530822, -1538233109, -1090935817, -965641998,
  ],
  _e = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_",
  O = [];
class ye {
  constructor() {
    C(this, "_data", new E());
    C(this, "_hash", new E([...de]));
    C(this, "_nDataBytes", 0);
    C(this, "_minBufferSize", 0);
  }
  finalize(e) {
    e && this._append(e);
    const n = this._nDataBytes * 8,
      t = this._data.sigBytes * 8;
    return (
      (this._data.words[t >>> 5] |= 128 << (24 - (t % 32))),
      (this._data.words[(((t + 64) >>> 9) << 4) + 14] = Math.floor(
        n / 4294967296,
      )),
      (this._data.words[(((t + 64) >>> 9) << 4) + 15] = n),
      (this._data.sigBytes = this._data.words.length * 4),
      this._process(),
      this._hash
    );
  }
  _doProcessBlock(e, n) {
    const t = this._hash.words;
    let s = t[0],
      r = t[1],
      i = t[2],
      f = t[3],
      u = t[4],
      _ = t[5],
      l = t[6],
      D = t[7];
    for (let c = 0; c < 64; c++) {
      if (c < 16) O[c] = e[n + c] | 0;
      else {
        const h = O[c - 15],
          d = ((h << 25) | (h >>> 7)) ^ ((h << 14) | (h >>> 18)) ^ (h >>> 3),
          b = O[c - 2],
          g = ((b << 15) | (b >>> 17)) ^ ((b << 13) | (b >>> 19)) ^ (b >>> 10);
        O[c] = d + O[c - 7] + g + O[c - 16];
      }
      const m = (u & _) ^ (~u & l),
        o = (s & r) ^ (s & i) ^ (r & i),
        y =
          ((s << 30) | (s >>> 2)) ^
          ((s << 19) | (s >>> 13)) ^
          ((s << 10) | (s >>> 22)),
        B =
          ((u << 26) | (u >>> 6)) ^
          ((u << 21) | (u >>> 11)) ^
          ((u << 7) | (u >>> 25)),
        P = D + B + m + he[c] + O[c],
        p = y + o;
      ((D = l),
        (l = _),
        (_ = u),
        (u = (f + P) | 0),
        (f = i),
        (i = r),
        (r = s),
        (s = (P + p) | 0));
    }
    ((t[0] = (t[0] + s) | 0),
      (t[1] = (t[1] + r) | 0),
      (t[2] = (t[2] + i) | 0),
      (t[3] = (t[3] + f) | 0),
      (t[4] = (t[4] + u) | 0),
      (t[5] = (t[5] + _) | 0),
      (t[6] = (t[6] + l) | 0),
      (t[7] = (t[7] + D) | 0));
  }
  _append(e) {
    (typeof e == "string" && (e = E.fromUtf8(e)),
      this._data.concat(e),
      (this._nDataBytes += e.sigBytes));
  }
  _process(e) {
    let n,
      t = this._data.sigBytes / 64;
    e ? (t = Math.ceil(t)) : (t = Math.max((t | 0) - this._minBufferSize, 0));
    const s = t * 16,
      r = Math.min(s * 4, this._data.sigBytes);
    if (s) {
      for (let i = 0; i < s; i += 16) this._doProcessBlock(this._data.words, i);
      ((n = this._data.words.splice(0, s)), (this._data.sigBytes -= r));
    }
    return new E(n, r);
  }
}
class E {
  constructor(e, n) {
    C(this, "words");
    C(this, "sigBytes");
    ((e = this.words = e || []),
      (this.sigBytes = n === void 0 ? e.length * 4 : n));
  }
  static fromUtf8(e) {
    const n = unescape(encodeURIComponent(e)),
      t = n.length,
      s = [];
    for (let r = 0; r < t; r++)
      s[r >>> 2] |= (n.charCodeAt(r) & 255) << (24 - (r % 4) * 8);
    return new E(s, t);
  }
  toBase64() {
    const e = [];
    for (let n = 0; n < this.sigBytes; n += 3) {
      const t = (this.words[n >>> 2] >>> (24 - (n % 4) * 8)) & 255,
        s = (this.words[(n + 1) >>> 2] >>> (24 - ((n + 1) % 4) * 8)) & 255,
        r = (this.words[(n + 2) >>> 2] >>> (24 - ((n + 2) % 4) * 8)) & 255,
        i = (t << 16) | (s << 8) | r;
      for (let f = 0; f < 4 && n * 8 + f * 6 < this.sigBytes * 8; f++)
        e.push(_e.charAt((i >>> (6 * (3 - f))) & 63));
    }
    return e.join("");
  }
  concat(e) {
    if (
      ((this.words[this.sigBytes >>> 2] &=
        4294967295 << (32 - (this.sigBytes % 4) * 8)),
      (this.words.length = Math.ceil(this.sigBytes / 4)),
      this.sigBytes % 4)
    )
      for (let n = 0; n < e.sigBytes; n++) {
        const t = (e.words[n >>> 2] >>> (24 - (n % 4) * 8)) & 255;
        this.words[(this.sigBytes + n) >>> 2] |=
          t << (24 - ((this.sigBytes + n) % 4) * 8);
      }
    else
      for (let n = 0; n < e.sigBytes; n += 4)
        this.words[(this.sigBytes + n) >>> 2] = e.words[n >>> 2];
    this.sigBytes += e.sigBytes;
  }
}
function me(a) {
  return new ye().finalize(a).toBase64();
}
function T(a) {
  return me(W(a));
}
const De = { trailing: !0 };
function ge(a, e = 25, n = {}) {
  if (((n = { ...De, ...n }), !Number.isFinite(e)))
    throw new TypeError("Expected `wait` to be a finite number");
  let t,
    s,
    r = [],
    i,
    f;
  const u = (_, l) => (
    (i = ve(a, _, l)),
    i.finally(() => {
      if (((i = null), n.trailing && f && !s)) {
        const D = u(_, f);
        return ((f = null), D);
      }
    }),
    i
  );
  return function (..._) {
    return i
      ? (n.trailing && (f = _), i)
      : new Promise((l) => {
          const D = !s && n.leading;
          (clearTimeout(s),
            (s = setTimeout(() => {
              s = null;
              const c = n.leading ? t : u(this, _);
              for (const m of r) m(c);
              r = [];
            }, e)),
            D ? ((t = u(this, _)), l(t)) : r.push(l));
        });
  };
}
async function ve(a, e, n) {
  return await a.apply(e, n);
}
const L = Symbol.for("nuxt:client-only"),
  Ee = Q({
    name: "ClientOnly",
    inheritAttrs: !1,
    props: ["fallback", "placeholder", "placeholderTag", "fallbackTag"],
    setup(a, { slots: e, attrs: n }) {
      const t = M(!1);
      X(() => {
        t.value = !0;
      });
      const s = N();
      return (
        s && (s._nuxtClientOnly = !0),
        Z(L, !0),
        () => {
          var u;
          if (t.value) {
            const _ = (u = e.default) == null ? void 0 : u.call(e);
            return _ && _.length === 1 ? [Y(_[0], n)] : _;
          }
          const r = e.fallback || e.placeholder;
          if (r) return x(r);
          const i = a.fallback || a.placeholder || "",
            f = a.fallbackTag || a.placeholderTag || "span";
          return J(f, n, i);
        }
      );
    },
  }),
  be = (a) => a === "defer" || a === !1;
function we(...a) {
  var m;
  const e = typeof a[a.length - 1] == "string" ? a.pop() : void 0;
  Be(a[0], a[1]) && a.unshift(e);
  let [n, t, s = {}] = a;
  const r = U(() => v(n));
  if (typeof r.value != "string")
    throw new TypeError("[nuxt] [useAsyncData] key must be a string.");
  if (typeof t != "function")
    throw new TypeError("[nuxt] [useAsyncData] handler must be a function.");
  const i = K();
  (s.server ?? (s.server = !0),
    s.default ?? (s.default = Ce),
    s.getCachedData ?? (s.getCachedData = I),
    s.lazy ?? (s.lazy = !1),
    s.immediate ?? (s.immediate = !0),
    s.deep ?? (s.deep = w.deep),
    s.dedupe ?? (s.dedupe = "cancel"),
    s._functionName,
    i._asyncData[r.value]);
  const f = { cause: "initial", dedupe: s.dedupe };
  ((m = i._asyncData[r.value]) != null && m._init) ||
    ((f.cachedData = s.getCachedData(r.value, i, { cause: "initial" })),
    (i._asyncData[r.value] = V(i, r.value, t, s, f.cachedData)));
  const u = i._asyncData[r.value];
  u._deps++;
  const _ = () => i._asyncData[r.value].execute(f),
    l = s.server !== !1 && i.payload.serverRendered;
  {
    let o = function (h) {
      const d = i._asyncData[h];
      d != null &&
        d._deps &&
        (d._deps--, d._deps === 0 && (d == null || d._off()));
    };
    const y = N();
    if (
      (y && l && s.immediate && !y.sp && (y.sp = []),
      y && !y._nuxtOnBeforeMountCbs)
    ) {
      y._nuxtOnBeforeMountCbs = [];
      const h = y._nuxtOnBeforeMountCbs;
      (k(() => {
        (h.forEach((d) => {
          d();
        }),
          h.splice(0, h.length));
      }),
        A(() => h.splice(0, h.length)));
    }
    const B = y && (y._nuxtClientOnly || ee(L, !1));
    l && i.isHydrating && (u.error.value || u.data.value != null)
      ? ((u.pending.value = !1),
        (u.status.value = u.error.value ? "error" : "success"))
      : y &&
          ((!B && i.payload.serverRendered && i.isHydrating) || s.lazy) &&
          s.immediate
        ? y._nuxtOnBeforeMountCbs.push(_)
        : s.immediate && _();
    const P = ce(),
      p = F(
        [r, ...(s.watch || [])],
        ([h], [d]) => {
          var b, g;
          if ((h || d) && h !== d) {
            const S =
              ((b = i._asyncData[d]) == null ? void 0 : b.data.value) !==
              w.value;
            d && o(d);
            const j = { cause: "initial", dedupe: s.dedupe };
            (((g = i._asyncData[h]) != null && g._init) ||
              ((j.cachedData = s.getCachedData(h, i, { cause: "initial" })),
              (i._asyncData[h] = V(i, h, t, s, j.cachedData))),
              i._asyncData[h]._deps++,
              (s.immediate || S) && i._asyncData[h].execute(j));
          } else u._execute({ cause: "watch", dedupe: s.dedupe });
        },
        { flush: "sync" },
      );
    P &&
      ae(() => {
        (p(), o(r.value));
      });
  }
  const D = {
      data: R(() => {
        var o;
        return (o = i._asyncData[r.value]) == null ? void 0 : o.data;
      }),
      pending: R(() => {
        var o;
        return (o = i._asyncData[r.value]) == null ? void 0 : o.pending;
      }),
      status: R(() => {
        var o;
        return (o = i._asyncData[r.value]) == null ? void 0 : o.status;
      }),
      error: R(() => {
        var o;
        return (o = i._asyncData[r.value]) == null ? void 0 : o.error;
      }),
      refresh: (...o) => i._asyncData[r.value].execute(...o),
      execute: (...o) => i._asyncData[r.value].execute(...o),
      clear: () => H(i, r.value),
    },
    c = Promise.resolve(i._asyncDataPromises[r.value]).then(() => D);
  return (Object.assign(c, D), c);
}
function R(a) {
  return U({
    get() {
      var e;
      return (e = a()) == null ? void 0 : e.value;
    },
    set(e) {
      const n = a();
      n && (n.value = e);
    },
  });
}
function Be(a, e) {
  return !(
    typeof a == "string" ||
    (typeof a == "object" && a !== null) ||
    (typeof a == "function" && typeof e == "function")
  );
}
function H(a, e) {
  (e in a.payload.data && (a.payload.data[e] = void 0),
    e in a.payload._errors && (a.payload._errors[e] = w.errorValue),
    a._asyncData[e] &&
      ((a._asyncData[e].data.value = void 0),
      (a._asyncData[e].error.value = w.errorValue),
      (a._asyncData[e].pending.value = !1),
      (a._asyncData[e].status.value = "idle")),
    e in a._asyncDataPromises &&
      (a._asyncDataPromises[e] && (a._asyncDataPromises[e].cancelled = !0),
      (a._asyncDataPromises[e] = void 0)));
}
function pe(a, e) {
  const n = {};
  for (const t of e) n[t] = a[t];
  return n;
}
function V(a, e, n, t, s) {
  var D;
  (D = a.payload._errors)[e] ?? (D[e] = w.errorValue);
  const r = t.getCachedData !== I,
    i = n,
    f = t.deep ? te : M,
    u = s != null,
    _ = a.hook("app:data:refresh", async (c) => {
      (!c || c.includes(e)) && (await l.execute({ cause: "refresh:hook" }));
    }),
    l = {
      data: f(u ? s : t.default()),
      pending: M(!u),
      error: se(a.payload._errors, e),
      status: M("idle"),
      execute: (c = {}) => {
        if (a._asyncDataPromises[e]) {
          if (be(c.dedupe ?? t.dedupe)) return a._asyncDataPromises[e];
          a._asyncDataPromises[e].cancelled = !0;
        }
        if (c.cause === "initial" || a.isHydrating) {
          const o =
            "cachedData" in c
              ? c.cachedData
              : t.getCachedData(e, a, { cause: c.cause ?? "refresh:manual" });
          if (o != null)
            return (
              (a.payload.data[e] = l.data.value = o),
              (l.error.value = w.errorValue),
              (l.status.value = "success"),
              Promise.resolve(o)
            );
        }
        ((l.pending.value = !0), (l.status.value = "pending"));
        const m = new Promise((o, y) => {
          try {
            o(i(a));
          } catch (B) {
            y(B);
          }
        })
          .then(async (o) => {
            if (m.cancelled) return a._asyncDataPromises[e];
            let y = o;
            (t.transform && (y = await t.transform(o)),
              t.pick && (y = pe(y, t.pick)),
              (a.payload.data[e] = y),
              (l.data.value = y),
              (l.error.value = w.errorValue),
              (l.status.value = "success"));
          })
          .catch((o) => {
            if (m.cancelled) return a._asyncDataPromises[e];
            ((l.error.value = re(o)),
              (l.data.value = ie(t.default())),
              (l.status.value = "error"));
          })
          .finally(() => {
            m.cancelled ||
              ((l.pending.value = !1), delete a._asyncDataPromises[e]);
          });
        return ((a._asyncDataPromises[e] = m), a._asyncDataPromises[e]);
      },
      _execute: ge((...c) => l.execute(...c), 0, { leading: !0 }),
      _default: t.default,
      _deps: 0,
      _init: !0,
      _hash: void 0,
      _off: () => {
        var c;
        (_(),
          (c = a._asyncData[e]) != null &&
            c._init &&
            (a._asyncData[e]._init = !1),
          r ||
            ne(() => {
              var m;
              ((m = a._asyncData[e]) != null && m._init) ||
                (H(a, e),
                (l.execute = () => Promise.resolve()),
                (l.data.value = w.value));
            }));
      },
    };
  return l;
}
const Ce = () => w.value,
  I = (a, e, n) => {
    if (e.isHydrating) return e.payload.data[a];
    if (n.cause !== "refresh:manual" && n.cause !== "refresh:hook")
      return e.static.data[a];
  };
function Se(a, e, n) {
  const [t = {}, s] = typeof e == "string" ? [{}, e] : [e, n],
    r = U(() => v(a)),
    i = U(
      () =>
        v(t.key) ||
        "$f" + T([s, typeof r.value == "string" ? r.value : "", ...Oe(t)]),
    );
  if (
    !t.baseURL &&
    typeof r.value == "string" &&
    r.value[0] === "/" &&
    r.value[1] === "/"
  )
    throw new Error(
      '[nuxt] [useFetch] the request URL must not start with "//".',
    );
  const {
      server: f,
      lazy: u,
      default: _,
      transform: l,
      pick: D,
      watch: c,
      immediate: m,
      getCachedData: o,
      deep: y,
      dedupe: B,
      ...P
    } = t,
    p = q({
      ...oe,
      ...P,
      cache: typeof t.cache == "boolean" ? void 0 : t.cache,
    }),
    h = {
      server: f,
      lazy: u,
      default: _,
      transform: l,
      pick: D,
      immediate: m,
      getCachedData: o,
      deep: y,
      dedupe: B,
      watch: c === !1 ? [] : [...(c || []), p],
    };
  if (!m) {
    let g = function () {
      h.immediate = !0;
    };
    (F(i, g, { flush: "sync", once: !0 }),
      F([...(c || []), p], g, { flush: "sync", once: !0 }));
  }
  let d;
  return we(
    c === !1 ? i.value : i,
    () => {
      var z;
      ((z = d == null ? void 0 : d.abort) == null ||
        z.call(
          d,
          new DOMException(
            "Request aborted as another request to the same endpoint was initiated.",
            "AbortError",
          ),
        ),
        (d = typeof AbortController < "u" ? new AbortController() : {}));
      const g = v(t.timeout);
      let S;
      return (
        g &&
          ((S = setTimeout(
            () =>
              d.abort(
                new DOMException(
                  "Request aborted due to timeout.",
                  "AbortError",
                ),
              ),
            g,
          )),
          (d.signal.onabort = () => clearTimeout(S))),
        (t.$fetch || globalThis.$fetch)(r.value, {
          signal: d.signal,
          ...p,
        }).finally(() => {
          clearTimeout(S);
        })
      );
    },
    h,
  );
}
function Oe(a) {
  var n;
  const e = [
    ((n = v(a.method)) == null ? void 0 : n.toUpperCase()) || "GET",
    v(a.baseURL),
  ];
  for (const t of [a.params || a.query]) {
    const s = v(t);
    if (!s) continue;
    const r = {};
    for (const [i, f] of Object.entries(s)) r[v(i)] = v(f);
    e.push(r);
  }
  if (a.body) {
    const t = v(a.body);
    if (!t) e.push(T(t));
    else if (t instanceof ArrayBuffer)
      e.push(
        T(
          Object.fromEntries(
            [...new Uint8Array(t).entries()].map(([s, r]) => [s, r.toString()]),
          ),
        ),
      );
    else if (t instanceof FormData) {
      const s = {};
      for (const r of t.entries()) {
        const [i, f] = r;
        s[i] = f instanceof File ? f.name : f;
      }
      e.push(T(s));
    } else if (fe(t)) e.push(T(q(t)));
    else
      try {
        e.push(T(t));
      } catch {
        console.warn("[useFetch] Failed to hash body", t);
      }
  }
  return e;
}
export { Ee as _, Se as u };
