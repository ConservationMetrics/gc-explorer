import {
  e as ot,
  M as it,
  r as y,
  ap as _t,
  aq as Mt,
  m as xt,
  g as Dt,
  v as Ct,
  c as Oe,
  o as W,
  a as wt,
  h as be,
  b as nt,
  N as Re,
  i as _,
  t as Pt,
  ar as St,
  _ as At,
  ao as Ft,
  u as Ot,
  f as Rt,
  w as kt,
} from "./CSw5FfBj.js";
import { m as $, V as qt, M as Et, B as Bt } from "./R38nlJua.js";
import { a as Tt } from "./Bx2EM-6T.js";
import { p as Nt, a as Kt, c as $t, t as Vt } from "./E3LaZOar.js";
import { _ as It, u as Gt } from "./CRyDprp6.js";
import { r as Yt } from "./3er_pQBm.js";
import { u as zt } from "./BHTMjfoz.js";
var q = 63710088e-1,
  lt = {
    centimeters: q * 100,
    centimetres: q * 100,
    degrees: 360 / (2 * Math.PI),
    feet: q * 3.28084,
    inches: q * 39.37,
    kilometers: q / 1e3,
    kilometres: q / 1e3,
    meters: q,
    metres: q,
    miles: q / 1609.344,
    millimeters: q * 1e3,
    millimetres: q * 1e3,
    nauticalmiles: q / 1852,
    radians: 1,
    yards: q * 1.0936,
  };
function Le(a, s, r = {}) {
  const t = { type: "Feature" };
  return (
    (r.id === 0 || r.id) && (t.id = r.id),
    r.bbox && (t.bbox = r.bbox),
    (t.properties = s || {}),
    (t.geometry = a),
    t
  );
}
function ke(a, s, r = {}) {
  if (!a) throw new Error("coordinates is required");
  if (!Array.isArray(a)) throw new Error("coordinates must be an Array");
  if (a.length < 2)
    throw new Error("coordinates must be at least 2 numbers long");
  if (!Ge(a[0]) || !Ge(a[1]))
    throw new Error("coordinates must contain numbers");
  return Le({ type: "Point", coordinates: a }, s, r);
}
function ut(a, s, r = {}) {
  if (a.length < 2)
    throw new Error("coordinates must be an array of two or more positions");
  return Le({ type: "LineString", coordinates: a }, s, r);
}
function Ut(a, s = "kilometers") {
  const r = lt[s];
  if (!r) throw new Error(s + " units is invalid");
  return a * r;
}
function Wt(a, s = "kilometers") {
  const r = lt[s];
  if (!r) throw new Error(s + " units is invalid");
  return a / r;
}
function qe(a) {
  return ((a % (2 * Math.PI)) * 180) / Math.PI;
}
function T(a) {
  return ((a % 360) * Math.PI) / 180;
}
function Ge(a) {
  return !isNaN(a) && a !== null && !Array.isArray(a);
}
function fe(a) {
  if (!a) throw new Error("coord is required");
  if (!Array.isArray(a)) {
    if (
      a.type === "Feature" &&
      a.geometry !== null &&
      a.geometry.type === "Point"
    )
      return [...a.geometry.coordinates];
    if (a.type === "Point") return [...a.coordinates];
  }
  if (
    Array.isArray(a) &&
    a.length >= 2 &&
    !Array.isArray(a[0]) &&
    !Array.isArray(a[1])
  )
    return [...a];
  throw new Error("coord must be GeoJSON Point or an Array of numbers");
}
function Ht(a) {
  return a.type === "Feature" ? a.geometry : a;
}
function ct(a, s, r = {}) {
  if (r.final === !0) return jt(a, s);
  const t = fe(a),
    i = fe(s),
    c = T(t[0]),
    n = T(i[0]),
    u = T(t[1]),
    e = T(i[1]),
    d = Math.sin(n - c) * Math.cos(e),
    m = Math.cos(u) * Math.sin(e) - Math.sin(u) * Math.cos(e) * Math.cos(n - c);
  return qe(Math.atan2(d, m));
}
function jt(a, s) {
  let r = ct(s, a);
  return ((r = (r + 180) % 360), r);
}
function Xt(a, s, r, t = {}) {
  const i = fe(a),
    c = T(i[0]),
    n = T(i[1]),
    u = T(r),
    e = Wt(s, t.units),
    d = Math.asin(
      Math.sin(n) * Math.cos(e) + Math.cos(n) * Math.sin(e) * Math.cos(u),
    ),
    m =
      c +
      Math.atan2(
        Math.sin(u) * Math.sin(e) * Math.cos(n),
        Math.cos(e) - Math.sin(n) * Math.sin(d),
      ),
    l = qe(m),
    v = qe(d);
  return ke([l, v], t.properties);
}
function dt(a, s, r = {}) {
  var t = fe(a),
    i = fe(s),
    c = T(i[1] - t[1]),
    n = T(i[0] - t[0]),
    u = T(t[1]),
    e = T(i[1]),
    d =
      Math.pow(Math.sin(c / 2), 2) +
      Math.pow(Math.sin(n / 2), 2) * Math.cos(u) * Math.cos(e);
  return Ut(2 * Math.atan2(Math.sqrt(d), Math.sqrt(1 - d)), r.units);
}
function Jt(a, s, r = {}) {
  const i = Ht(a).coordinates;
  let c = 0;
  for (let n = 0; n < i.length && !(s >= c && n === i.length - 1); n++)
    if (c >= s) {
      const u = s - c;
      if (u) {
        const e = ct(i[n], i[n - 1]) - 180;
        return Xt(i[n], u, e, r);
      } else return ke(i[n]);
    } else c += dt(i[n], i[n + 1], r);
  return ke(i[i.length - 1]);
}
function Ee(a, s, r) {
  if (a !== null)
    for (
      var t,
        i,
        c,
        n,
        u,
        e,
        d,
        m = 0,
        l = 0,
        v,
        b = a.type,
        L = b === "FeatureCollection",
        P = b === "Feature",
        N = L ? a.features.length : 1,
        E = 0;
      E < N;
      E++
    ) {
      ((d = L ? a.features[E].geometry : P ? a.geometry : a),
        (v = d ? d.type === "GeometryCollection" : !1),
        (u = v ? d.geometries.length : 1));
      for (var K = 0; K < u; K++) {
        var S = 0,
          R = 0;
        if (((n = v ? d.geometries[K] : d), n !== null)) {
          e = n.coordinates;
          var B = n.type;
          switch (((m = 0), B)) {
            case null:
              break;
            case "Point":
              if (s(e, l, E, S, R) === !1) return !1;
              (l++, S++);
              break;
            case "LineString":
            case "MultiPoint":
              for (t = 0; t < e.length; t++) {
                if (s(e[t], l, E, S, R) === !1) return !1;
                (l++, B === "MultiPoint" && S++);
              }
              B === "LineString" && S++;
              break;
            case "Polygon":
            case "MultiLineString":
              for (t = 0; t < e.length; t++) {
                for (i = 0; i < e[t].length - m; i++) {
                  if (s(e[t][i], l, E, S, R) === !1) return !1;
                  l++;
                }
                (B === "MultiLineString" && S++, B === "Polygon" && R++);
              }
              B === "Polygon" && S++;
              break;
            case "MultiPolygon":
              for (t = 0; t < e.length; t++) {
                for (R = 0, i = 0; i < e[t].length; i++) {
                  for (c = 0; c < e[t][i].length - m; c++) {
                    if (s(e[t][i][c], l, E, S, R) === !1) return !1;
                    l++;
                  }
                  R++;
                }
                S++;
              }
              break;
            case "GeometryCollection":
              for (t = 0; t < n.geometries.length; t++)
                if (Ee(n.geometries[t], s) === !1) return !1;
              break;
            default:
              throw new Error("Unknown Geometry Type");
          }
        }
      }
    }
}
function Zt(a, s) {
  var r,
    t,
    i,
    c,
    n,
    u,
    e,
    d,
    m,
    l,
    v = 0,
    b = a.type === "FeatureCollection",
    L = a.type === "Feature",
    P = b ? a.features.length : 1;
  for (r = 0; r < P; r++) {
    for (
      u = b ? a.features[r].geometry : L ? a.geometry : a,
        d = b ? a.features[r].properties : L ? a.properties : {},
        m = b ? a.features[r].bbox : L ? a.bbox : void 0,
        l = b ? a.features[r].id : L ? a.id : void 0,
        e = u ? u.type === "GeometryCollection" : !1,
        n = e ? u.geometries.length : 1,
        i = 0;
      i < n;
      i++
    ) {
      if (((c = e ? u.geometries[i] : u), c === null)) {
        if (s(null, v, d, m, l) === !1) return !1;
        continue;
      }
      switch (c.type) {
        case "Point":
        case "LineString":
        case "MultiPoint":
        case "Polygon":
        case "MultiLineString":
        case "MultiPolygon": {
          if (s(c, v, d, m, l) === !1) return !1;
          break;
        }
        case "GeometryCollection": {
          for (t = 0; t < c.geometries.length; t++)
            if (s(c.geometries[t], v, d, m, l) === !1) return !1;
          break;
        }
        default:
          throw new Error("Unknown Geometry Type");
      }
    }
    v++;
  }
}
function Qt(a, s) {
  Zt(a, function (r, t, i, c, n) {
    var u = r === null ? null : r.type;
    switch (u) {
      case null:
      case "Point":
      case "LineString":
      case "Polygon":
        return s(Le(r, i, { bbox: c, id: n }), t, 0) === !1 ? !1 : void 0;
    }
    var e;
    switch (u) {
      case "MultiPoint":
        e = "Point";
        break;
      case "MultiLineString":
        e = "LineString";
        break;
      case "MultiPolygon":
        e = "Polygon";
        break;
    }
    for (var d = 0; d < r.coordinates.length; d++) {
      var m = r.coordinates[d],
        l = { type: e, coordinates: m };
      if (s(Le(l, i), t, d) === !1) return !1;
    }
  });
}
function ea(a, s) {
  Qt(a, function (r, t, i) {
    var c = 0;
    if (r.geometry) {
      var n = r.geometry.type;
      if (!(n === "Point" || n === "MultiPoint")) {
        var u,
          e = 0,
          d = 0,
          m = 0;
        if (
          Ee(r, function (l, v, b, L, P) {
            if (u === void 0 || t > e || L > d || P > m) {
              ((u = l), (e = t), (d = L), (m = P), (c = 0));
              return;
            }
            var N = ut([u, l], r.properties);
            if (s(N, t, i, P, c) === !1) return !1;
            (c++, (u = l));
          }) === !1
        )
          return !1;
      }
    }
  });
}
function ta(a, s, r) {
  var t = r,
    i = !1;
  return (
    ea(a, function (c, n, u, e, d) {
      (i === !1 && r === void 0 ? (t = c) : (t = s(t, c, n, u, e, d)),
        (i = !0));
    }),
    t
  );
}
function Se(a, s = {}) {
  if (a.bbox != null && s.recompute !== !0) return a.bbox;
  const r = [1 / 0, 1 / 0, -1 / 0, -1 / 0];
  return (
    Ee(a, (t) => {
      (r[0] > t[0] && (r[0] = t[0]),
        r[1] > t[1] && (r[1] = t[1]),
        r[2] < t[0] && (r[2] = t[0]),
        r[3] < t[1] && (r[3] = t[1]));
    }),
    r
  );
}
function aa(a, s = {}) {
  return ta(
    a,
    (r, t) => {
      const i = t.geometry.coordinates;
      return r + dt(i[0], i[1], s);
    },
    0,
  );
}
var Z = {},
  Q = {},
  C = {},
  Ye;
function V() {
  if (Ye) return C;
  ((Ye = 1),
    Object.defineProperty(C, "__esModule", { value: !0 }),
    (C.areaConversion =
      C.timeConversion =
      C.distanceConversion =
      C.altitudeKeys =
      C.latitudeKeys =
      C.longitudeKeys =
      C.MAXLON =
      C.MINLON =
      C.MAXLAT =
      C.MINLAT =
      C.earthRadius =
      C.sexagesimalPattern =
        void 0));
  var a =
    /^([0-9]{1,3})°\s*([0-9]{1,3}(?:\.(?:[0-9]{1,}))?)['′]\s*(([0-9]{1,3}(\.([0-9]{1,}))?)["″]\s*)?([NEOSW]?)$/;
  C.sexagesimalPattern = a;
  var s = 6378137;
  C.earthRadius = s;
  var r = -90;
  C.MINLAT = r;
  var t = 90;
  C.MAXLAT = t;
  var i = -180;
  C.MINLON = i;
  var c = 180;
  C.MAXLON = c;
  var n = ["lng", "lon", "longitude", 0];
  C.longitudeKeys = n;
  var u = ["lat", "latitude", 1];
  C.latitudeKeys = u;
  var e = ["alt", "altitude", "elevation", "elev", 2];
  C.altitudeKeys = e;
  var d = {
    m: 1,
    km: 0.001,
    cm: 100,
    mm: 1e3,
    mi: 1 / 1609.344,
    sm: 1 / 1852.216,
    ft: 100 / 30.48,
    in: 100 / 2.54,
    yd: 1 / 0.9144,
  };
  C.distanceConversion = d;
  var m = { m: 60, h: 3600, d: 86400 };
  C.timeConversion = m;
  var l = {
    m2: 1,
    km2: 1e-6,
    ha: 1e-4,
    a: 0.01,
    ft2: 10.763911,
    yd2: 1.19599,
    in2: 1550.0031,
  };
  return (
    (C.areaConversion = l),
    (l.sqm = l.m2),
    (l.sqkm = l.km2),
    (l.sqft = l.ft2),
    (l.sqyd = l.yd2),
    (l.sqin = l.in2),
    C
  );
}
var ee = {},
  ze;
function Be() {
  if (ze) return ee;
  ((ze = 1),
    Object.defineProperty(ee, "__esModule", { value: !0 }),
    (ee.default = void 0));
  var a = function (t, i) {
      return i.reduce(
        function (c, n) {
          if (typeof t > "u" || t === null)
            throw new Error("'".concat(t, "' is no valid coordinate."));
          return Object.prototype.hasOwnProperty.call(t, n) &&
            typeof n < "u" &&
            typeof c > "u"
            ? ((c = n), n)
            : c;
        },
        void 0,
      );
    },
    s = a;
  return ((ee.default = s), ee);
}
var te = {},
  ae = {},
  Ue;
function Te() {
  if (Ue) return ae;
  ((Ue = 1),
    Object.defineProperty(ae, "__esModule", { value: !0 }),
    (ae.default = void 0));
  var a = function (t) {
      var i = t.toString().trim();
      return isNaN(parseFloat(i)) ? !1 : parseFloat(i) === Number(i);
    },
    s = a;
  return ((ae.default = s), ae);
}
var re = {},
  We;
function Ne() {
  if (We) return re;
  ((We = 1),
    Object.defineProperty(re, "__esModule", { value: !0 }),
    (re.default = void 0));
  var a = V(),
    s = function (i) {
      return a.sexagesimalPattern.test(i.toString().trim());
    },
    r = s;
  return ((re.default = r), re);
}
var se = {},
  He;
function Ke() {
  if (He) return se;
  ((He = 1),
    Object.defineProperty(se, "__esModule", { value: !0 }),
    (se.default = void 0));
  var a = V(),
    s = function (i) {
      var c = new RegExp(a.sexagesimalPattern).exec(i.toString().trim());
      if (typeof c > "u" || c === null)
        throw new Error("Given value is not in sexagesimal format");
      var n = Number(c[2]) / 60 || 0,
        u = Number(c[4]) / 3600 || 0,
        e = parseFloat(c[1]) + n + u;
      return ["S", "W"].includes(c[7]) ? -e : e;
    },
    r = s;
  return ((se.default = r), se);
}
var oe = {},
  ie = {},
  je;
function ft() {
  if (je) return ie;
  ((je = 1),
    Object.defineProperty(ie, "__esModule", { value: !0 }),
    (ie.default = void 0));
  var a = V(),
    s = r(Be());
  function r(e) {
    return e && e.__esModule ? e : { default: e };
  }
  function t(e, d) {
    var m = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var l = Object.getOwnPropertySymbols(e);
      (d &&
        (l = l.filter(function (v) {
          return Object.getOwnPropertyDescriptor(e, v).enumerable;
        })),
        m.push.apply(m, l));
    }
    return m;
  }
  function i(e) {
    for (var d = 1; d < arguments.length; d++) {
      var m = arguments[d] != null ? arguments[d] : {};
      d % 2
        ? t(Object(m), !0).forEach(function (l) {
            c(e, l, m[l]);
          })
        : Object.getOwnPropertyDescriptors
          ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(m))
          : t(Object(m)).forEach(function (l) {
              Object.defineProperty(
                e,
                l,
                Object.getOwnPropertyDescriptor(m, l),
              );
            });
    }
    return e;
  }
  function c(e, d, m) {
    return (
      d in e
        ? Object.defineProperty(e, d, {
            value: m,
            enumerable: !0,
            configurable: !0,
            writable: !0,
          })
        : (e[d] = m),
      e
    );
  }
  var n = function (d) {
      var m =
          arguments.length > 1 && arguments[1] !== void 0
            ? arguments[1]
            : {
                longitude: a.longitudeKeys,
                latitude: a.latitudeKeys,
                altitude: a.altitudeKeys,
              },
        l = (0, s.default)(d, m.longitude),
        v = (0, s.default)(d, m.latitude),
        b = (0, s.default)(d, m.altitude);
      return i({ latitude: v, longitude: l }, b ? { altitude: b } : {});
    },
    u = n;
  return ((ie.default = u), ie);
}
var ne = {},
  Xe;
function ra() {
  if (Xe) return ne;
  ((Xe = 1),
    Object.defineProperty(ne, "__esModule", { value: !0 }),
    (ne.default = void 0));
  var a = i(Te()),
    s = i(Ne()),
    r = i(Ke()),
    t = V();
  function i(u) {
    return u && u.__esModule ? u : { default: u };
  }
  var c = function u(e) {
      return (0, a.default)(e)
        ? !(parseFloat(e) > t.MAXLAT || e < t.MINLAT)
        : (0, s.default)(e)
          ? u((0, r.default)(e))
          : !1;
    },
    n = c;
  return ((ne.default = n), ne);
}
var le = {},
  Je;
function sa() {
  if (Je) return le;
  ((Je = 1),
    Object.defineProperty(le, "__esModule", { value: !0 }),
    (le.default = void 0));
  var a = i(Te()),
    s = i(Ne()),
    r = i(Ke()),
    t = V();
  function i(u) {
    return u && u.__esModule ? u : { default: u };
  }
  var c = function u(e) {
      return (0, a.default)(e)
        ? !(parseFloat(e) > t.MAXLON || e < t.MINLON)
        : (0, s.default)(e)
          ? u((0, r.default)(e))
          : !1;
    },
    n = c;
  return ((le.default = n), le);
}
var Ze;
function oa() {
  if (Ze) return oe;
  ((Ze = 1),
    Object.defineProperty(oe, "__esModule", { value: !0 }),
    (oe.default = void 0));
  var a = t(ft()),
    s = t(ra()),
    r = t(sa());
  function t(n) {
    return n && n.__esModule ? n : { default: n };
  }
  var i = function (u) {
      var e = (0, a.default)(u),
        d = e.latitude,
        m = e.longitude;
      if (Array.isArray(u) && u.length >= 2)
        return (0, r.default)(u[0]) && (0, s.default)(u[1]);
      if (typeof d > "u" || typeof m > "u") return !1;
      var l = u[m],
        v = u[d];
      return !(
        typeof v > "u" ||
        typeof l > "u" ||
        (0, s.default)(v) === !1 ||
        (0, r.default)(l) === !1
      );
    },
    c = i;
  return ((oe.default = c), oe);
}
var Qe;
function pt() {
  if (Qe) return te;
  ((Qe = 1),
    Object.defineProperty(te, "__esModule", { value: !0 }),
    (te.default = void 0));
  var a = c(Te()),
    s = c(Ne()),
    r = c(Ke()),
    t = c(oa()),
    i = c(ft());
  function c(l) {
    return l && l.__esModule ? l : { default: l };
  }
  function n(l, v) {
    var b = Object.keys(l);
    if (Object.getOwnPropertySymbols) {
      var L = Object.getOwnPropertySymbols(l);
      (v &&
        (L = L.filter(function (P) {
          return Object.getOwnPropertyDescriptor(l, P).enumerable;
        })),
        b.push.apply(b, L));
    }
    return b;
  }
  function u(l) {
    for (var v = 1; v < arguments.length; v++) {
      var b = arguments[v] != null ? arguments[v] : {};
      v % 2
        ? n(Object(b), !0).forEach(function (L) {
            e(l, L, b[L]);
          })
        : Object.getOwnPropertyDescriptors
          ? Object.defineProperties(l, Object.getOwnPropertyDescriptors(b))
          : n(Object(b)).forEach(function (L) {
              Object.defineProperty(
                l,
                L,
                Object.getOwnPropertyDescriptor(b, L),
              );
            });
    }
    return l;
  }
  function e(l, v, b) {
    return (
      v in l
        ? Object.defineProperty(l, v, {
            value: b,
            enumerable: !0,
            configurable: !0,
            writable: !0,
          })
        : (l[v] = b),
      l
    );
  }
  var d = function l(v) {
      if ((0, a.default)(v)) return Number(v);
      if ((0, s.default)(v)) return (0, r.default)(v);
      if ((0, t.default)(v)) {
        var b = (0, i.default)(v);
        return Array.isArray(v)
          ? v.map(function (L, P) {
              return [0, 1].includes(P) ? l(L) : L;
            })
          : u(
              u(u({}, v), b.latitude && e({}, b.latitude, l(v[b.latitude]))),
              b.longitude && e({}, b.longitude, l(v[b.longitude])),
            );
      }
      return Array.isArray(v)
        ? v.map(function (L) {
            return (0, t.default)(L) ? l(L) : L;
          })
        : v;
    },
    m = d;
  return ((te.default = m), te);
}
var et;
function ia() {
  if (et) return Q;
  ((et = 1),
    Object.defineProperty(Q, "__esModule", { value: !0 }),
    (Q.default = void 0));
  var a = V(),
    s = t(Be()),
    r = t(pt());
  function t(n) {
    return n && n.__esModule ? n : { default: n };
  }
  var i = function (u, e) {
      var d = (0, s.default)(u, a.latitudeKeys);
      if (!(typeof d > "u" || d === null)) {
        var m = u[d];
        return e === !0 ? m : (0, r.default)(m);
      }
    },
    c = i;
  return ((Q.default = c), Q);
}
var ue = {},
  tt;
function na() {
  if (tt) return ue;
  ((tt = 1),
    Object.defineProperty(ue, "__esModule", { value: !0 }),
    (ue.default = void 0));
  var a = V(),
    s = t(Be()),
    r = t(pt());
  function t(n) {
    return n && n.__esModule ? n : { default: n };
  }
  var i = function (u, e) {
      var d = (0, s.default)(u, a.longitudeKeys);
      if (!(typeof d > "u" || d === null)) {
        var m = u[d];
        return e === !0 ? m : (0, r.default)(m);
      }
    },
    c = i;
  return ((ue.default = c), ue);
}
var ce = {},
  at;
function la() {
  if (at) return ce;
  ((at = 1),
    Object.defineProperty(ce, "__esModule", { value: !0 }),
    (ce.default = void 0));
  var a = function (t) {
      return (t * Math.PI) / 180;
    },
    s = a;
  return ((ce.default = s), ce);
}
var de = {},
  rt;
function ua() {
  if (rt) return de;
  ((rt = 1),
    Object.defineProperty(de, "__esModule", { value: !0 }),
    (de.default = void 0));
  var a = function (t) {
      return t > 1 ? 1 : t < -1 ? -1 : t;
    },
    s = a;
  return ((de.default = s), de);
}
var st;
function ca() {
  if (st) return Z;
  ((st = 1),
    Object.defineProperty(Z, "__esModule", { value: !0 }),
    (Z.default = void 0));
  var a = c(ia()),
    s = c(na()),
    r = c(la()),
    t = c(ua()),
    i = V();
  function c(e) {
    return e && e.__esModule ? e : { default: e };
  }
  var n = function (d, m) {
      var l =
        arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 1;
      l = typeof l < "u" && !isNaN(l) ? l : 1;
      var v = (0, a.default)(d),
        b = (0, s.default)(d),
        L = (0, a.default)(m),
        P = (0, s.default)(m),
        N =
          Math.acos(
            (0, t.default)(
              Math.sin((0, r.default)(L)) * Math.sin((0, r.default)(v)) +
                Math.cos((0, r.default)(L)) *
                  Math.cos((0, r.default)(v)) *
                  Math.cos((0, r.default)(b) - (0, r.default)(P)),
            ),
          ) * i.earthRadius;
      return Math.round(N / l) * l;
    },
    u = n;
  return ((Z.default = u), Z);
}
var da = ca();
const fa = Tt(da),
  pa =
    "data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20width='22'%20height='12'%20viewBox='0%200%2022%2012'%20fill='%23505050'%3e%3cpath%20fill-rule='evenodd'%20fill='none'%20d='M-1-6h24v24H-1z'/%3e%3cpath%20d='M20%200H2C.9%200%200%20.9%200%202v8c0%201.1.9%202%202%202h18c1.1%200%202-.9%202-2V2c0-1.1-.9-2-2-2zm0%2010H2V2h2v4h2V2h2v4h2V2h2v4h2V2h2v4h2V2h2v8z'/%3e%3c/svg%3e",
  Ae = "controls-layer-line",
  U = "controls-source-line",
  ma = "#263238",
  va = "#fff",
  ga = "#0f0";
function Fe(a = []) {
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "LineString", coordinates: a },
  };
}
function ha(a, s, r) {
  return `+ ${a.toFixed(2)} ${r}<br/>= ${s.toFixed(2)} ${r}`;
}
class ya {
  constructor(s = {}) {
    ((this.isMeasuring = !1),
      (this.enabled = !0),
      (this.markers = []),
      (this.coordinates = []),
      (this.labels = []),
      (this.units = s.units || "km"),
      (this.font = s.font || ["Noto Sans Regular"]),
      (this.fontSize = s.fontSize || 12),
      (this.fontHalo = s.fontHalo || 1),
      (this.labelFormat = s.labelFormat || ha),
      (this.mainColor = s.mainColor || ma),
      (this.secondaryColor = s.secondaryColor || va),
      (this.altColor = s.altColor || ga),
      (this.mapClickListener = this.mapClickListener.bind(this)),
      (this.styleLoadListener = this.styleLoadListener.bind(this)));
  }
  insertControls() {
    ((this.container = document.createElement("div")),
      this.container.classList.add("mapboxgl-ctrl"),
      this.container.classList.add("mapboxgl-ctrl-group"),
      this.container.classList.add("mapboxgl-ctrl-ruler"),
      (this.button = document.createElement("button")),
      this.button.setAttribute("type", "button"));
    const s = document.createElement("img");
    ((s.src = pa),
      this.button.appendChild(s),
      this.container.appendChild(this.button));
  }
  setUnits(s) {
    this.units = s;
  }
  draw() {
    (this.map.addSource(U, { type: "geojson", data: Fe(this.coordinates) }),
      this.map.addLayer({
        id: Ae,
        type: "line",
        source: U,
        paint: { "line-color": this.mainColor, "line-width": 2 },
      }));
  }
  measuringOn() {
    ((this.isMeasuring = !0),
      (this.markers = []),
      (this.coordinates = []),
      (this.labels = []),
      (this.map.getCanvas().style.cursor = "crosshair"),
      this.button.classList.add("active"),
      this.draw(),
      this.map.on("click", this.mapClickListener),
      this.map.on("style.load", this.styleLoadListener),
      this.map.fire("ruler.on"));
  }
  measuringOff() {
    ((this.isMeasuring = !1),
      (this.map.getCanvas().style.cursor = ""),
      this.button.classList.remove("active"),
      this.map.getLayer(Ae) && this.map.removeLayer(Ae),
      this.map.getSource(U) && this.map.removeSource(U),
      this.markers.forEach((s) => s.remove()),
      this.map.off("click", this.mapClickListener),
      this.map.off("style.load", this.styleLoadListener),
      this.map.fire("ruler.off"));
  }
  enable() {
    ((this.enabled = !0), this.button.classList.remove("disabled"));
  }
  disable() {
    ((this.enabled = !1),
      this.measuringOff(),
      this.button.classList.add("disabled"));
  }
  mapClickListener(s) {
    const r = document.createElement("div");
    ((r.style.width = "12px"),
      (r.style.height = "12px"),
      (r.style.borderRadius = "50%"),
      (r.style.background =
        this.markers.length === 0 ? this.altColor : this.secondaryColor),
      (r.style.boxSizing = "border-box"),
      (r.style.border = `2px solid ${this.mainColor}`));
    const t = new $.Marker({ element: r, draggable: !0 })
      .setLngLat(s.lngLat)
      .addTo(this.map);
    (this.coordinates.push([s.lngLat.lng, s.lngLat.lat]),
      this.map.getSource(U).setData(Fe(this.coordinates)),
      this.markers.push(t),
      this.markers.length > 1 &&
        ((this.labels = this.coordinatesToLabels()),
        t.setPopup(new $.Popup({ closeButton: !1, closeOnClick: !1 })),
        t.togglePopup(),
        t.getPopup().setHTML(this.labels[this.markers.length - 1])),
      t.on("drag", () => {
        const i = this.markers.indexOf(t),
          c = t.getLngLat();
        ((this.coordinates[i] = [c.lng, c.lat]),
          (this.labels = this.coordinatesToLabels()),
          this.labels.forEach((n, u) => {
            const e = this.markers[u].getPopup();
            e && e.setHTML(n);
          }),
          this.map.getSource(U).setData(Fe(this.coordinates)));
      }));
  }
  coordinatesToLabels() {
    const { coordinates: s, units: r, labelFormat: t } = this;
    let i = 0;
    return s.map((c, n) => {
      if (n === 0) return t(0, 0, r);
      let u =
        fa(
          { latitude: s[n - 1][1], longitude: s[n - 1][0] },
          { latitude: s[n][1], longitude: s[n][0] },
        ) / 1e3;
      return (
        r === "mi" ? (u = u * 0.621371) : r === "nmi" && (u = u * 0.539957),
        (i += u),
        t(u, i, r)
      );
    });
  }
  styleLoadListener() {
    this.draw();
  }
  onButtonClick() {
    this.enabled &&
      (this.isMeasuring ? this.measuringOff() : this.measuringOn(),
      this.map.fire("ruler.buttonclick", { measuring: this.isMeasuring }));
  }
  onAdd(s) {
    return (
      (this.map = s),
      this.insertControls(),
      this.button.addEventListener("click", this.onButtonClick.bind(this)),
      this.container
    );
  }
  onRemove() {
    (this.isMeasuring && this.measuringOff(),
      this.button.removeEventListener("click", this.onButtonClick.bind(this)),
      this.map.off("click", this.mapClickListener),
      this.container.parentNode.removeChild(this.container),
      (this.map = void 0));
  }
}
const ba = ot({
    __name: "AlertsDashboard",
    props: {
      alertsData: {},
      alertsStatistics: {},
      allowedFileExtensions: {},
      logoUrl: {},
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
      mapeoData: {},
      mediaBasePath: {},
      mediaBasePathAlerts: {},
      planetApiKey: {},
    },
    emits: ["reset-legend-visibility"],
    setup(a, { emit: s }) {
      const { t: r } = it(),
        t = a,
        i = y(t.alertsData),
        c = y(!1),
        n = y(),
        u = y(!1),
        e = y(),
        d = y(!1),
        m = y(!0),
        l = y(!0),
        v = y(!1),
        b = _t(),
        L = Mt(),
        P = y(!1),
        N = (o) => {
          const f = [
            ...t.alertsData.mostRecentAlerts.features,
            ...t.alertsData.previousAlerts.features,
          ].find((M) => {
            var h;
            return ((h = M.properties) == null ? void 0 : h.alertID) === o;
          });
          if (f && f.properties) {
            const M = f.geometry.type.toLowerCase(),
              h = `most-recent-alerts-${M}`,
              x = `previous-alerts-${M}`,
              D = t.alertsData.mostRecentAlerts.features.some((w) => {
                var F, O;
                return (
                  ((F = w.properties) == null ? void 0 : F.alertID) ===
                  ((O = f.properties) == null ? void 0 : O.alertID)
                );
              })
                ? h
                : x;
            if ((J(f, D), f.geometry.type === "Point")) {
              const [w, F] = f.geometry.coordinates;
              e.value.flyTo({ center: [w, F], zoom: 13 });
            } else if (
              f.geometry.type === "Polygon" ||
              f.geometry.type === "MultiPolygon"
            ) {
              const w = Se(f);
              e.value.fitBounds(w, { padding: 50 });
            } else if (f.geometry.type === "LineString") {
              const [w, F] = Pe(f.geometry.coordinates);
              e.value.flyTo({ center: [w, F], zoom: 13 });
            }
            P.value = !1;
          }
        },
        E = (o) => {
          var f;
          const g =
            (f = t.mapeoData) == null ? void 0 : f.find((M) => M.id === o);
          if (g) {
            const M = g.geotype,
              h = {
                type: "Feature",
                id: g.normalizedId || g.id,
                geometry: {
                  type: M,
                  coordinates: JSON.parse(g.geocoordinates),
                },
                properties: { ...g },
              };
            if (
              (J(h, "mapeo-data"), (P.value = !0), h.geometry.type === "Point")
            ) {
              const [x, p] = h.geometry.coordinates;
              e.value.flyTo({ center: [x, p], zoom: 13 });
            } else if (
              h.geometry.type === "Polygon" ||
              h.geometry.type === "MultiPolygon"
            ) {
              const x = Se(h);
              e.value.fitBounds(x, { padding: 50 });
            } else if (h.geometry.type === "LineString") {
              const [x, p] = Pe(h.geometry.coordinates);
              e.value.flyTo({ center: [x, p], zoom: 13 });
            }
          }
        };
      xt(() => {
        (($.accessToken = t.mapboxAccessToken),
          (e.value = new $.Map({
            container: "map",
            style: t.mapboxStyle || "mapbox://styles/mapbox/streets-v12",
            projection: t.mapboxProjection || "mercator",
            center: [t.mapboxLongitude || 0, t.mapboxLatitude || -15],
            zoom: t.mapboxZoom || 2.5,
            pitch: t.mapboxPitch || 0,
            bearing: t.mapboxBearing || 0,
          })),
          e.value.on("load", async () => {
            (t.mapbox3d &&
              (e.value.addSource("mapbox-dem", {
                type: "raster-dem",
                url: "mapbox://mapbox.mapbox-terrain-dem-v1",
                tileSize: 512,
                maxzoom: 14,
              }),
              e.value.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 })),
              await ve());
            const o = new $.NavigationControl();
            e.value.addControl(o, "top-right");
            const g = new $.ScaleControl({ maxWidth: 80, unit: "metric" });
            e.value.addControl(g, "bottom-left");
            const f = new $.FullscreenControl();
            e.value.addControl(f, "top-right");
            const M = new ya();
            (e.value.addControl(M, "top-right"),
              (u.value = !0),
              (d.value = !0),
              (n.value = gt()),
              _e() !== !0 && (c.value = !0),
              (v.value = !0));
            const h = b.query.alertId,
              x = b.query.mapeoDocId;
            h ? N(h) : x && t.mapeoData && E(x);
          }));
      });
      const K = s,
        S = y(0),
        R = y(!1),
        B = y(!1),
        H = y(),
        pe = async () => {
          const o = t.alertsData,
            g = async (p, D, w, F, O) => {
              if (D.some((k) => k.geometry.type === w))
                return (
                  e.value.getSource(p) ||
                    e.value.addSource(p, {
                      type: "geojson",
                      data: {
                        type: "FeatureCollection",
                        features: D.filter((k) => k.geometry.type === w),
                      },
                      minzoom: 10,
                    }),
                  new Promise((k) => {
                    ((w === "Polygon" || w === "MultiPolygon") &&
                      (e.value.getLayer(p) ||
                        e.value.addLayer({
                          id: p,
                          type: "fill",
                          source: p,
                          paint: {
                            "fill-color": [
                              "case",
                              ["boolean", ["feature-state", "selected"], !1],
                              "#FFFF00",
                              F,
                            ],
                            "fill-opacity": 0.5,
                          },
                        }),
                      e.value.getLayer(`${p}-stroke`) ||
                        e.value.addLayer({
                          id: `${p}-stroke`,
                          type: "line",
                          source: p,
                          paint: {
                            "line-color": [
                              "case",
                              ["boolean", ["feature-state", "selected"], !1],
                              "#FFFF00",
                              O,
                            ],
                            "line-width": 2,
                          },
                        })),
                      w === "LineString" &&
                        (e.value.getLayer(p) ||
                          e.value.addLayer({
                            id: p,
                            type: "line",
                            source: p,
                            filter: ["==", "$type", "LineString"],
                            paint: {
                              "line-color": [
                                "case",
                                ["boolean", ["feature-state", "selected"], !1],
                                "#FFFF00",
                                O,
                              ],
                              "line-width": [
                                "case",
                                ["boolean", ["feature-state", "selected"], !1],
                                5,
                                3,
                              ],
                              "line-opacity": 0.8,
                            },
                          })),
                      w === "Point" &&
                        (e.value.getLayer(p) ||
                          e.value.addLayer({
                            id: p,
                            type: "circle",
                            source: p,
                            paint: {
                              "circle-color": [
                                "case",
                                ["boolean", ["feature-state", "selected"], !1],
                                "#FFFF00",
                                F,
                              ],
                              "circle-radius": [
                                "case",
                                ["boolean", ["feature-state", "selected"], !1],
                                10,
                                5,
                              ],
                              "circle-opacity": 0.8,
                            },
                          })),
                      k());
                  })
                );
            },
            f = (p, D) =>
              new Promise((w, F) => {
                e.value.loadImage(D, (O, k) => {
                  if (O) {
                    F(O);
                    return;
                  }
                  (e.value.hasImage(p) || e.value.addImage(p, k), w());
                });
              }),
            M = async (p, D, w, F) => {
              (await f(w, F),
                e.value.getSource(p) ||
                  e.value.addSource(p, {
                    type: "geojson",
                    data: {
                      type: "FeatureCollection",
                      features: D.filter((O) => {
                        var k;
                        return (k = O.properties) == null
                          ? void 0
                          : k.geographicCentroid;
                      }).map((O) => {
                        var k;
                        return {
                          type: "Feature",
                          geometry: {
                            type: "Point",
                            coordinates:
                              (k = O.properties) == null
                                ? void 0
                                : k.geographicCentroid
                                    .split(",")
                                    .map(Number)
                                    .reverse(),
                          },
                          properties: { ...O.properties },
                        };
                      }),
                    },
                  }),
                e.value.getLayer(p) ||
                  e.value.addLayer({
                    id: p,
                    type: "symbol",
                    source: p,
                    layout: {
                      "icon-image": w,
                      "icon-size": 0.75,
                      "icon-allow-overlap": !0,
                    },
                    maxzoom: 10,
                  }));
            },
            h = new URL(
              "" + new URL("warning_orange.CQGH1Rq2.png", import.meta.url).href,
              import.meta.url,
            ).href,
            x = new URL(
              "" + new URL("warning_red.BAJT2R4t.png", import.meta.url).href,
              import.meta.url,
            ).href;
          (await Promise.all([
            g(
              "previous-alerts-polygon",
              o.previousAlerts.features,
              "Polygon",
              "#FD8D3C",
              "#FD8D3C",
            ),
            g(
              "previous-alerts-linestring",
              o.previousAlerts.features,
              "LineString",
              null,
              "#FD8D3C",
            ),
            g(
              "previous-alerts-point",
              o.previousAlerts.features,
              "Point",
              "#FD8D3C",
              "#FD8D3C",
            ),
            M(
              "previous-alerts-symbol",
              o.previousAlerts.features,
              "warning-orange",
              h,
            ),
            g(
              "most-recent-alerts-polygon",
              o.mostRecentAlerts.features,
              "Polygon",
              "#FF0000",
              "#FF0000",
            ),
            g(
              "most-recent-alerts-linestring",
              o.mostRecentAlerts.features,
              "LineString",
              null,
              "#FF0000",
            ),
            g(
              "most-recent-alerts-point",
              o.mostRecentAlerts.features,
              "Point",
              "#FF0000",
              "#FF0000",
            ),
            M(
              "most-recent-alerts-symbol",
              o.mostRecentAlerts.features,
              "warning-red",
              x,
            ),
          ]),
            e.value.getStyle().layers.forEach((p) => {
              ((p.id.startsWith("most-recent-alerts") &&
                !p.id.includes("stroke")) ||
                (p.id.startsWith("previous-alerts") &&
                  !p.id.includes("stroke"))) &&
                (e.value.on(
                  "mouseenter",
                  p.id,
                  () => {
                    (S.value++, (e.value.getCanvas().style.cursor = "pointer"));
                  },
                  { passive: !0 },
                ),
                e.value.on(
                  "mouseleave",
                  p.id,
                  () => {
                    (S.value--,
                      S.value === 0 && (e.value.getCanvas().style.cursor = ""));
                  },
                  { passive: !0 },
                ),
                e.value.on(
                  "click",
                  p.id,
                  (D) => {
                    if (D.features && D.features.length > 0) {
                      const w = D.features[0];
                      if (p.id.endsWith("symbol")) {
                        if (w.geometry.type === "Point") {
                          const [F, O] = w.geometry.coordinates;
                          e.value.flyTo({ center: [F, O], zoom: 13 });
                        }
                      } else J(w, p.id);
                    }
                  },
                  { passive: !0 },
                ));
            }),
            (R.value =
              o.mostRecentAlerts.features.some(
                (p) => p.geometry.type === "LineString",
              ) ||
              o.previousAlerts.features.some(
                (p) => p.geometry.type === "LineString",
              )),
            R.value && (e.value.on("mousemove", ge), e.value.on("click", A)),
            (B.value =
              o.mostRecentAlerts.features.some(
                (p) => p.geometry.type === "Point",
              ) ||
              o.previousAlerts.features.some(
                (p) => p.geometry.type === "Point",
              )));
        },
        me = () => {
          if (!t.mapeoData) return;
          const o = {
            type: "FeatureCollection",
            features: t.mapeoData.map((g) => ({
              id: g.normalizedId || g.id,
              type: "Feature",
              geometry: {
                type: g.geotype,
                coordinates: JSON.parse(g.geocoordinates),
              },
              properties: { ...g },
            })),
          };
          ((H.value = t.mapeoData[0]["filter-color"]),
            e.value.getSource("mapeo-data") ||
              e.value.addSource("mapeo-data", { type: "geojson", data: o }),
            e.value.getLayer("mapeo-data") ||
              e.value.addLayer({
                id: "mapeo-data",
                type: "circle",
                source: "mapeo-data",
                filter: ["==", "$type", "Point"],
                paint: {
                  "circle-radius": 6,
                  "circle-color": [
                    "case",
                    ["boolean", ["feature-state", "selected"], !1],
                    "#FFFF00",
                    ["get", "filter-color"],
                  ],
                  "circle-stroke-width": 2,
                  "circle-stroke-color": "#fff",
                },
              }),
            ["mapeo-data"].forEach((g) => {
              (e.value.on(
                "mouseenter",
                g,
                () => {
                  (S.value++, (e.value.getCanvas().style.cursor = "pointer"));
                },
                { passive: !0 },
              ),
                e.value.on(
                  "mouseleave",
                  g,
                  () => {
                    (S.value--,
                      S.value === 0 && (e.value.getCanvas().style.cursor = ""));
                  },
                  { passive: !0 },
                ),
                e.value.on(
                  "click",
                  g,
                  (f) => {
                    f.features && f.features.length > 0 && J(f.features[0], g);
                  },
                  { passive: !0 },
                ));
            }));
        },
        ve = async () => {
          const o = [];
          (t.alertsData && o.push(pe()),
            t.mapeoData && o.push(me()),
            await Promise.all(o),
            he(),
            mt());
        },
        _e = () =>
          [
            ...t.alertsData.mostRecentAlerts.features,
            ...t.alertsData.previousAlerts.features,
          ].every((g) => g.geometry.type === "LineString"),
        A = (o) => {
          const f = [
              [o.point.x - 10, o.point.y - 10],
              [o.point.x + 10, o.point.y + 10],
            ],
            M = e.value.queryRenderedFeatures(f, {
              layers: [
                "most-recent-alerts-linestring",
                "previous-alerts-linestring",
              ],
            });
          if (M.length > 0) {
            const h = M[0],
              x = h.layer.id;
            J(h, x);
          }
        },
        ge = (o) => {
          const f = [
              [o.point.x - 10, o.point.y - 10],
              [o.point.x + 10, o.point.y + 10],
            ],
            M = [
              "most-recent-alerts-linestring",
              "previous-alerts-linestring",
            ].filter((h) => e.value.getLayer(h));
          M.length > 0 &&
            (e.value.queryRenderedFeatures(f, { layers: M }).length
              ? (e.value.getCanvas().style.cursor = "pointer")
              : S.value === 0 && (e.value.getCanvas().style.cursor = ""));
        },
        j = y(),
        he = () => {
          if (
            j.value ||
            ((j.value = !0), document.querySelector(".pulsing-dot"))
          )
            return;
          X();
          const o = document.createElement("div");
          o.className = "pulsing-dot";
          const g = [
              { interval: "1", opacity: "1" },
              { interval: "0", opacity: "0.35" },
            ],
            f = document.createElement("style");
          ((f.type = "text/css"),
            (f.innerText = g
              .map(
                (h) => `
        @keyframes pulse-${h.interval} {
          0% { transform: scale(1); opacity: ${h.opacity}; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .pulsing-dot-${h.interval} {
          width: 30px;
          height: 30px;
          position: absolute;
          border-radius: 50%;
          pointer-events: none!important;
        }
        .pulsing-dot-${h.interval}::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: 5px solid #FF0000;
          border-radius: inherit;
          box-shadow: 0 0 0 2px #FF0000;
          animation: pulse-${h.interval} 2s infinite;
        }
      `,
              )
              .join("")),
            document.head.appendChild(f));
          const M = (h) => {
            let x, p;
            if (
              h.geometry.type === "Polygon" ||
              h.geometry.type === "MultiPolygon"
            ) {
              const F = Se(h);
              ((x = (F[0] + F[2]) / 2), (p = (F[1] + F[3]) / 2));
            } else if (h.geometry.type === "LineString")
              [x, p] = Pe(h.geometry.coordinates);
            else if (h.geometry.type === "Point")
              [x, p] = h.geometry.coordinates;
            else return;
            let D = "1";
            h.properties && h.properties.confidenceLevel === "0" && (D = "0");
            const w = o.cloneNode();
            (w.classList.add(`pulsing-dot-${D}`),
              new $.Marker(w).setLngLat([x, p]).addTo(e.value));
          };
          t.alertsData.mostRecentAlerts.features.forEach(M);
        },
        X = () => {
          (document.querySelectorAll(".pulsing-dot").forEach((o) => o.remove()),
            (j.value = !1));
        },
        Me = y({ id: "custom", style: t.mapboxStyle }),
        xe = (o) => {
          (X(),
            $t(e.value, o, t.planetApiKey),
            (Me.value = o),
            e.value.once("idle", () => {
              ve();
            }));
        },
        I = y(),
        mt = () => {
          e.value.once("idle", () => {
            let o = t.mapLegendLayerIds;
            (R.value
              ? (o =
                  "most-recent-alerts-linestring," +
                  (t.alertsData.previousAlerts.features.length
                    ? "previous-alerts-linestring,"
                    : "") +
                  o)
              : B.value
                ? (o =
                    "most-recent-alerts-point," +
                    (t.alertsData.previousAlerts.features.length
                      ? "previous-alerts-point,"
                      : "") +
                    o)
                : (o =
                    "most-recent-alerts-polygon," +
                    (t.alertsData.previousAlerts.features.length
                      ? "previous-alerts-polygon,"
                      : "") +
                    o),
              t.mapeoData && (o = "mapeo-data," + o),
              o && (I.value = Nt(e.value, o, H.value)));
          });
        },
        vt = (o) => {
          Vt(e.value, o);
        },
        ye = y(),
        $e = (o, g) => {
          const f = (x) => {
            const [p, D] = x.split("-").map(Number);
            return (D * 100 + p).toString();
          };
          (o === r("earlier") && (o = t.alertsStatistics.earliestAlertsDate),
            g === r("earlier") && (g = t.alertsStatistics.twelveMonthsBefore));
          const M = f(o),
            h = f(g);
          return [M, h];
        },
        gt = () => {
          let o = t.alertsStatistics.allDates;
          if (o.length > 12) {
            const g = o.slice(-12);
            o = [r("earlier"), ...g];
          }
          return o;
        },
        ht = (o) => {
          let [g, f] = o;
          (g === r("earlier") && (g = t.alertsStatistics.earliestAlertsDate),
            f === r("earlier") && (f = t.alertsStatistics.twelveMonthsBefore));
          const [M, h] = $e(g, f);
          St(() => {
            e.value.getStyle().layers.forEach((D) => {
              (D.id.startsWith("most-recent-alerts") ||
                D.id.startsWith("previous-alerts")) &&
                e.value.setFilter(D.id, [
                  "all",
                  [">=", ["get", "YYYYMM"], M],
                  ["<=", ["get", "YYYYMM"], h],
                ]);
            });
            const x = e.value
                .getStyle()
                .layers.filter((D) => D.id.startsWith("most-recent-alerts")),
              p = [];
            (x.forEach((D) => {
              p.push(
                ...e.value.querySourceFeatures(D.source, {
                  sourceLayer: D["source-layer"],
                  filter: [
                    "all",
                    [">=", ["get", "YYYYMM"], M],
                    ["<=", ["get", "YYYYMM"], h],
                  ],
                }),
              );
            }),
              p.length > 0 ? he() : X(),
              (ye.value = o),
              (i.value = Ve.value));
          });
        },
        yt = () => {
          ((l.value = !1), Ie());
        },
        Ve = Dt(() => {
          if (!ye.value) return t.alertsData;
          const [o, g] = ye.value,
            [f, M] = $e(o, g),
            h = (x) =>
              x.filter((p) => {
                const D = p.properties ? p.properties.YYYYMM : null;
                return D >= f && D <= M;
              });
          return {
            mostRecentAlerts: {
              ...t.alertsData.mostRecentAlerts,
              features: h(t.alertsData.mostRecentAlerts.features),
            },
            previousAlerts: {
              ...t.alertsData.previousAlerts,
              features: h(t.alertsData.previousAlerts.features),
            },
          };
        }),
        De = y(!1),
        bt = y(),
        G = y(),
        Ce = y(!1),
        we = y(),
        Y = y(),
        z = y(),
        J = (o, g) => {
          if (!o.properties) return;
          const f = o.properties,
            M = {
              type: o.type,
              geometry: o.geometry,
              properties: o.properties,
            },
            h = o.id,
            x = { ...b.query };
          (delete x.alertId,
            delete x.mapeoDocId,
            f.alertID
              ? ((x.alertId = f.alertID), (P.value = !1))
              : f.id && ((x.mapeoDocId = f.id), (P.value = !0)),
            L.replace({ query: x }),
            Y.value !== null &&
              z.value &&
              e.value.setFeatureState(
                { source: z.value, id: Y.value },
                { selected: !1 },
              ),
            e.value.setFeatureState({ source: g, id: h }, { selected: !0 }),
            delete f.YYYYMM,
            (i.value = M),
            (we.value = f),
            (Y.value = h),
            (z.value = g),
            (l.value = !0),
            (m.value = !1),
            (De.value = !0),
            f.alertID ? (Ce.value = !0) : (Ce.value = !1),
            (G.value = []),
            f.t0_url && G.value.push(f.t0_url),
            f.t1_url && G.value.push(f.t1_url),
            f.photos &&
              f.photos.split(",").forEach((D) => G.value.push(D.trim())),
            delete f.t0_url,
            delete f.t1_url,
            delete f["filter-color"],
            delete f.normalizedId,
            f.geocoordinates && (f.geocoordinates = Kt(f.geocoordinates)),
            X());
        },
        Ie = () => {
          if (Y.value === null || !z.value) return;
          (e.value.setFeatureState(
            { source: z.value, id: Y.value },
            { selected: !1 },
          ),
            (i.value = t.alertsData),
            (we.value = null),
            (Y.value = null),
            (z.value = null));
          const o = { ...b.query };
          (delete o.alertId, delete o.isRecent, L.replace({ query: o }));
        },
        Lt = () => {
          (Ie(),
            (i.value = t.alertsData),
            (l.value = !0),
            (m.value = !0),
            (De.value = !1),
            (G.value = []),
            (bt.value = null),
            (ye.value = null),
            e.value.getStyle().layers.forEach((o) => {
              (o.id.startsWith("most-recent-alerts") ||
                o.id.startsWith("alerts")) &&
                e.value.setFilter(o.id, null);
            }),
            (I.value = I.value.map((o) => ({ ...o, visible: !0 }))),
            I.value.forEach((o) => {
              e.value.setLayoutProperty(o.id, "visibility", "visible");
            }),
            K("reset-legend-visibility"),
            e.value.flyTo({
              center: [t.mapboxLongitude || 0, t.mapboxLatitude || -15],
              zoom: t.mapboxZoom || 2.5,
              pitch: t.mapboxPitch || 0,
              bearing: t.mapboxBearing || 0,
            }),
            e.value.once("idle", () => {
              he();
            }));
        },
        Pe = (o) => {
          const g = ut(o),
            f = aa(g, { units: "kilometers" });
          return Jt(g, f / 2, { units: "kilometers" }).geometry.coordinates;
        };
      return (
        Ct(() => {
          e.value && e.value.remove();
        }),
        (o, g) => (
          W(),
          Oe("div", null, [
            g[0] || (g[0] = wt("div", { id: "map" }, null, -1)),
            _(l)
              ? be("", !0)
              : (W(),
                Oe(
                  "button",
                  {
                    key: 0,
                    class:
                      "reset-button bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mx-2",
                    onClick: Lt,
                  },
                  Pt(o.$t("resetDashboard")),
                  1,
                )),
            nt(
              qt,
              {
                "alerts-statistics": o.alertsStatistics,
                "allowed-file-extensions": o.allowedFileExtensions,
                "calculate-hectares": _(c),
                "date-options": _(n),
                "download-alert": _(De),
                feature: _(we),
                "file-paths": _(G),
                "geojson-selection": _(Ve),
                "is-alert": _(Ce),
                "is-mapeo": _(P),
                "is-alerts-dashboard": !0,
                "local-alerts-data": _(i),
                "logo-url": o.logoUrl,
                "media-base-path": o.mediaBasePath,
                "media-base-path-alerts": o.mediaBasePathAlerts,
                "show-intro-panel": _(m),
                "show-sidebar": _(l),
                "show-slider": _(v),
                onClose: yt,
                onDateRangeChanged: ht,
              },
              null,
              8,
              [
                "alerts-statistics",
                "allowed-file-extensions",
                "calculate-hectares",
                "date-options",
                "download-alert",
                "feature",
                "file-paths",
                "geojson-selection",
                "is-alert",
                "is-mapeo",
                "local-alerts-data",
                "logo-url",
                "media-base-path",
                "media-base-path-alerts",
                "show-intro-panel",
                "show-sidebar",
                "show-slider",
              ],
            ),
            _(I) && o.alertsData
              ? (W(),
                Re(
                  Et,
                  {
                    key: 1,
                    "map-legend-content": _(I),
                    onToggleLayerVisibility: vt,
                  },
                  null,
                  8,
                  ["map-legend-content"],
                ))
              : be("", !0),
            _(d)
              ? (W(),
                Re(
                  Bt,
                  {
                    key: 2,
                    "has-ruler-control": _(u),
                    "mapbox-style": o.mapboxStyle,
                    "planet-api-key": o.planetApiKey,
                    onBasemapSelected: xe,
                  },
                  null,
                  8,
                  ["has-ruler-control", "mapbox-style", "planet-api-key"],
                ))
              : be("", !0),
          ])
        )
      );
    },
  }),
  La = At(ba, [["__scopeId", "data-v-67886191"]]),
  Sa = ot({
    __name: "[tablename]",
    async setup(a) {
      let s, r;
      const i = Ft().params.tablename,
        c = Array.isArray(i) ? i.join("/") : i,
        n = y(),
        u = y(),
        e = y(!1),
        d = y(),
        m = y(),
        l = y(),
        v = y(),
        b = y(0),
        L = y(0),
        P = y(0),
        N = y(0),
        E = y(),
        K = y(),
        S = y(0),
        R = y(!1),
        B = y(),
        H = y(),
        pe = y(),
        me = y(),
        {
          public: { appApiKey: ve },
        } = Ot(),
        _e = { "x-api-key": ve },
        { data: A, error: ge } =
          (([s, r] = Rt(() =>
            Gt(`/api/${c}/alerts`, { headers: _e }, "$6he-z8_BBy"),
          )),
          (s = await s),
          r(),
          s);
      A.value && !ge.value
        ? ((n.value = A.value.alertsData),
          (u.value = A.value.alertsStatistics),
          (d.value = A.value.allowedFileExtensions),
          (e.value = !0),
          (m.value = A.value.logoUrl),
          (l.value = A.value.mapLegendLayerIds),
          (v.value = A.value.mapboxAccessToken),
          (b.value = A.value.mapboxBearing),
          (L.value = A.value.mapboxLatitude),
          (P.value = A.value.mapboxLongitude),
          (N.value = A.value.mapboxPitch),
          (E.value = A.value.mapboxProjection),
          (K.value = A.value.mapboxStyle),
          (S.value = A.value.mapboxZoom),
          (R.value = A.value.mapbox3d),
          (B.value = A.value.mapeoData),
          (H.value = A.value.mediaBasePath),
          (pe.value = A.value.mediaBasePathAlerts),
          (me.value = A.value.planetApiKey))
        : console.error("Error fetching data:", ge.value);
      const { t: j } = it();
      return (
        zt({
          title:
            "GuardianConnector Explorer " +
            j("changeDetectionAlerts") +
            " - " +
            Yt(c),
        }),
        (he, X) => {
          const Me = La,
            xe = It;
          return (
            W(),
            Oe("div", null, [
              nt(xe, null, {
                default: kt(() => [
                  _(e)
                    ? (W(),
                      Re(
                        Me,
                        {
                          key: 0,
                          "alerts-data": _(n),
                          "alerts-statistics": _(u),
                          "allowed-file-extensions": _(d),
                          "logo-url": _(m),
                          "map-legend-layer-ids": _(l),
                          "mapbox-access-token": _(v),
                          "mapbox-bearing": _(b),
                          "mapbox-latitude": _(L),
                          "mapbox-longitude": _(P),
                          "mapbox-pitch": _(N),
                          "mapbox-projection": _(E),
                          "mapbox-style": _(K),
                          "mapbox-zoom": _(S),
                          mapbox3d: _(R),
                          "mapeo-data": _(B),
                          "media-base-path": _(H),
                          "media-base-path-alerts": _(pe),
                          "planet-api-key": _(me),
                        },
                        null,
                        8,
                        [
                          "alerts-data",
                          "alerts-statistics",
                          "allowed-file-extensions",
                          "logo-url",
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
                          "mapeo-data",
                          "media-base-path",
                          "media-base-path-alerts",
                          "planet-api-key",
                        ],
                      ))
                    : be("", !0),
                ]),
                _: 1,
              }),
            ])
          );
        }
      );
    },
  });
export { Sa as default };
