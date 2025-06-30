const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "./Fpapo52S.js",
      "./CqDOPDl7.js",
      "./DiZqGcpG.js",
      "./CRyDprp6.js",
      "./BHTMjfoz.js",
      "./CNMjV8dR.js",
      "./BJ4Ll5Hi.js",
      "./Bx2EM-6T.js",
      "./3er_pQBm.js",
      "./config.D5t3FP1J.css",
      "./CaSQyyHN.js",
      "./R38nlJua.js",
      "./E3LaZOar.js",
      "./BasemapSelector.CPa6GAUw.css",
      "./guTIq2KN.js",
      "./DataFilter._4R-Cra7.css",
      "./_tablename_.B2UUTPg5.css",
      "./BRFWsHZY.js",
      "./_tablename_.DroRi38K.css",
      "./D1ifAnvd.js",
      "./Bd4KbR7V.js",
      "./error-404.CrGAR3sO.css",
      "./J-2b4M8h.js",
      "./error-500.BsVnn5i6.css",
    ]),
) => i.map((i) => d[i]);
var fh = Object.defineProperty;
var vl = (e) => {
  throw TypeError(e);
};
var dh = (e, t, n) =>
  t in e
    ? fh(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n })
    : (e[t] = n);
var un = (e, t, n) => dh(e, typeof t != "symbol" ? t + "" : t, n),
  ph = (e, t, n) => t.has(e) || vl("Cannot " + n);
var Lr = (e, t, n) => (
    ph(e, t, "read from private field"),
    n ? n.call(e) : t.get(e)
  ),
  El = (e, t, n) =>
    t.has(e)
      ? vl("Cannot add the same private member more than once")
      : t instanceof WeakSet
        ? t.add(e)
        : t.set(e, n);
(function () {
  const t = document.createElement("link").relList;
  if (t && t.supports && t.supports("modulepreload")) return;
  for (const s of document.querySelectorAll('link[rel="modulepreload"]')) r(s);
  new MutationObserver((s) => {
    for (const o of s)
      if (o.type === "childList")
        for (const i of o.addedNodes)
          i.tagName === "LINK" && i.rel === "modulepreload" && r(i);
  }).observe(document, { childList: !0, subtree: !0 });
  function n(s) {
    const o = {};
    return (
      s.integrity && (o.integrity = s.integrity),
      s.referrerPolicy && (o.referrerPolicy = s.referrerPolicy),
      s.crossOrigin === "use-credentials"
        ? (o.credentials = "include")
        : s.crossOrigin === "anonymous"
          ? (o.credentials = "omit")
          : (o.credentials = "same-origin"),
      o
    );
  }
  function r(s) {
    if (s.ep) return;
    s.ep = !0;
    const o = n(s);
    fetch(s.href, o);
  }
})();
/**
 * @vue/shared v3.5.17
 * (c) 2018-present Yuxi (Evan) You and Vue contributors
 * @license MIT
 **/ /*! #__NO_SIDE_EFFECTS__ */ function st(e) {
  const t = Object.create(null);
  for (const n of e.split(",")) t[n] = 1;
  return (n) => n in t;
}
const re = {},
  Dn = [],
  ut = () => {},
  Iu = () => !1,
  vr = (e) =>
    e.charCodeAt(0) === 111 &&
    e.charCodeAt(1) === 110 &&
    (e.charCodeAt(2) > 122 || e.charCodeAt(2) < 97),
  bo = (e) => e.startsWith("onUpdate:"),
  ve = Object.assign,
  _o = (e, t) => {
    const n = e.indexOf(t);
    n > -1 && e.splice(n, 1);
  },
  hh = Object.prototype.hasOwnProperty,
  de = (e, t) => hh.call(e, t),
  Y = Array.isArray,
  Fn = (e) => Yn(e) === "[object Map]",
  An = (e) => Yn(e) === "[object Set]",
  Ei = (e) => Yn(e) === "[object Date]",
  Mu = (e) => Yn(e) === "[object RegExp]",
  Z = (e) => typeof e == "function",
  me = (e) => typeof e == "string",
  yt = (e) => typeof e == "symbol",
  ge = (e) => e !== null && typeof e == "object",
  yo = (e) => (ge(e) || Z(e)) && Z(e.then) && Z(e.catch),
  ga = Object.prototype.toString,
  Yn = (e) => ga.call(e),
  xu = (e) => Yn(e).slice(8, -1),
  us = (e) => Yn(e) === "[object Object]",
  vo = (e) =>
    me(e) && e !== "NaN" && e[0] !== "-" && "" + parseInt(e, 10) === e,
  $n = st(
    ",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted",
  ),
  mh = st(
    "bind,cloak,else-if,else,for,html,if,model,on,once,pre,show,slot,text,memo",
  ),
  Eo = (e) => {
    const t = Object.create(null);
    return (n) => t[n] || (t[n] = e(n));
  },
  gh = /-(\w)/g,
  He = Eo((e) => e.replace(gh, (t, n) => (n ? n.toUpperCase() : ""))),
  bh = /\B([A-Z])/g,
  qe = Eo((e) => e.replace(bh, "-$1").toLowerCase()),
  Er = Eo((e) => e.charAt(0).toUpperCase() + e.slice(1)),
  sr = Eo((e) => (e ? `on${Er(e)}` : "")),
  Ke = (e, t) => !Object.is(e, t),
  Un = (e, ...t) => {
    for (let n = 0; n < e.length; n++) e[n](...t);
  },
  Ws = (e, t, n, r = !1) => {
    Object.defineProperty(e, t, {
      configurable: !0,
      enumerable: !1,
      writable: r,
      value: n,
    });
  },
  Yr = (e) => {
    const t = parseFloat(e);
    return isNaN(t) ? e : t;
  },
  zr = (e) => {
    const t = me(e) ? Number(e) : NaN;
    return isNaN(t) ? e : t;
  };
let wl;
const fs = () =>
    wl ||
    (wl =
      typeof globalThis < "u"
        ? globalThis
        : typeof self < "u"
          ? self
          : typeof window < "u"
            ? window
            : typeof global < "u"
              ? global
              : {}),
  _h = /^[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*$/;
function yh(e) {
  return _h.test(e) ? `__props.${e}` : `__props[${JSON.stringify(e)}]`;
}
function vh(e, t) {
  return (
    e + JSON.stringify(t, (n, r) => (typeof r == "function" ? r.toString() : r))
  );
}
const Eh = {
    TEXT: 1,
    1: "TEXT",
    CLASS: 2,
    2: "CLASS",
    STYLE: 4,
    4: "STYLE",
    PROPS: 8,
    8: "PROPS",
    FULL_PROPS: 16,
    16: "FULL_PROPS",
    NEED_HYDRATION: 32,
    32: "NEED_HYDRATION",
    STABLE_FRAGMENT: 64,
    64: "STABLE_FRAGMENT",
    KEYED_FRAGMENT: 128,
    128: "KEYED_FRAGMENT",
    UNKEYED_FRAGMENT: 256,
    256: "UNKEYED_FRAGMENT",
    NEED_PATCH: 512,
    512: "NEED_PATCH",
    DYNAMIC_SLOTS: 1024,
    1024: "DYNAMIC_SLOTS",
    DEV_ROOT_FRAGMENT: 2048,
    2048: "DEV_ROOT_FRAGMENT",
    CACHED: -1,
    "-1": "CACHED",
    BAIL: -2,
    "-2": "BAIL",
  },
  wh = {
    1: "TEXT",
    2: "CLASS",
    4: "STYLE",
    8: "PROPS",
    16: "FULL_PROPS",
    32: "NEED_HYDRATION",
    64: "STABLE_FRAGMENT",
    128: "KEYED_FRAGMENT",
    256: "UNKEYED_FRAGMENT",
    512: "NEED_PATCH",
    1024: "DYNAMIC_SLOTS",
    2048: "DEV_ROOT_FRAGMENT",
    [-1]: "CACHED",
    [-2]: "BAIL",
  },
  Th = {
    ELEMENT: 1,
    1: "ELEMENT",
    FUNCTIONAL_COMPONENT: 2,
    2: "FUNCTIONAL_COMPONENT",
    STATEFUL_COMPONENT: 4,
    4: "STATEFUL_COMPONENT",
    TEXT_CHILDREN: 8,
    8: "TEXT_CHILDREN",
    ARRAY_CHILDREN: 16,
    16: "ARRAY_CHILDREN",
    SLOTS_CHILDREN: 32,
    32: "SLOTS_CHILDREN",
    TELEPORT: 64,
    64: "TELEPORT",
    SUSPENSE: 128,
    128: "SUSPENSE",
    COMPONENT_SHOULD_KEEP_ALIVE: 256,
    256: "COMPONENT_SHOULD_KEEP_ALIVE",
    COMPONENT_KEPT_ALIVE: 512,
    512: "COMPONENT_KEPT_ALIVE",
    COMPONENT: 6,
    6: "COMPONENT",
  },
  Ch = {
    STABLE: 1,
    1: "STABLE",
    DYNAMIC: 2,
    2: "DYNAMIC",
    FORWARDED: 3,
    3: "FORWARDED",
  },
  Sh = { 1: "STABLE", 2: "DYNAMIC", 3: "FORWARDED" },
  Ah =
    "Infinity,undefined,NaN,isFinite,isNaN,parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl,BigInt,console,Error,Symbol",
  ba = st(Ah),
  Rh = ba,
  Tl = 2;
function Lh(e, t = 0, n = e.length) {
  if (
    ((t = Math.max(0, Math.min(t, e.length))),
    (n = Math.max(0, Math.min(n, e.length))),
    t > n)
  )
    return "";
  let r = e.split(/(\r?\n)/);
  const s = r.filter((a, l) => l % 2 === 1);
  r = r.filter((a, l) => l % 2 === 0);
  let o = 0;
  const i = [];
  for (let a = 0; a < r.length; a++)
    if (((o += r[a].length + ((s[a] && s[a].length) || 0)), o >= t)) {
      for (let l = a - Tl; l <= a + Tl || n > o; l++) {
        if (l < 0 || l >= r.length) continue;
        const u = l + 1;
        i.push(
          `${u}${" ".repeat(Math.max(3 - String(u).length, 0))}|  ${r[l]}`,
        );
        const c = r[l].length,
          f = (s[l] && s[l].length) || 0;
        if (l === a) {
          const d = t - (o - (c + f)),
            p = Math.max(1, n > o ? c - d : n - t);
          i.push("   |  " + " ".repeat(d) + "^".repeat(p));
        } else if (l > a) {
          if (n > o) {
            const d = Math.max(Math.min(n - o, c), 1);
            i.push("   |  " + "^".repeat(d));
          }
          o += c + f;
        }
      }
      break;
    }
  return i.join(`
`);
}
function wr(e) {
  if (Y(e)) {
    const t = {};
    for (let n = 0; n < e.length; n++) {
      const r = e[n],
        s = me(r) ? Du(r) : wr(r);
      if (s) for (const o in s) t[o] = s[o];
    }
    return t;
  } else if (me(e) || ge(e)) return e;
}
const Ph = /;(?![^(]*\))/g,
  kh = /:([^]+)/,
  Oh = /\/\*[^]*?\*\//g;
function Du(e) {
  const t = {};
  return (
    e
      .replace(Oh, "")
      .split(Ph)
      .forEach((n) => {
        if (n) {
          const r = n.split(kh);
          r.length > 1 && (t[r[0].trim()] = r[1].trim());
        }
      }),
    t
  );
}
function Nh(e) {
  if (!e) return "";
  if (me(e)) return e;
  let t = "";
  for (const n in e) {
    const r = e[n];
    if (me(r) || typeof r == "number") {
      const s = n.startsWith("--") ? n : qe(n);
      t += `${s}:${r};`;
    }
  }
  return t;
}
function Tr(e) {
  let t = "";
  if (me(e)) t = e;
  else if (Y(e))
    for (let n = 0; n < e.length; n++) {
      const r = Tr(e[n]);
      r && (t += r + " ");
    }
  else if (ge(e)) for (const n in e) e[n] && (t += n + " ");
  return t.trim();
}
function _a(e) {
  if (!e) return null;
  let { class: t, style: n } = e;
  return (t && !me(t) && (e.class = Tr(t)), n && (e.style = wr(n)), e);
}
const Ih =
    "html,body,base,head,link,meta,style,title,address,article,aside,footer,header,hgroup,h1,h2,h3,h4,h5,h6,nav,section,div,dd,dl,dt,figcaption,figure,picture,hr,img,li,main,ol,p,pre,ul,a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,ruby,s,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,embed,object,param,source,canvas,script,noscript,del,ins,caption,col,colgroup,table,thead,tbody,td,th,tr,button,datalist,fieldset,form,input,label,legend,meter,optgroup,option,output,progress,select,textarea,details,dialog,menu,summary,template,blockquote,iframe,tfoot",
  Mh =
    "svg,animate,animateMotion,animateTransform,circle,clipPath,color-profile,defs,desc,discard,ellipse,feBlend,feColorMatrix,feComponentTransfer,feComposite,feConvolveMatrix,feDiffuseLighting,feDisplacementMap,feDistantLight,feDropShadow,feFlood,feFuncA,feFuncB,feFuncG,feFuncR,feGaussianBlur,feImage,feMerge,feMergeNode,feMorphology,feOffset,fePointLight,feSpecularLighting,feSpotLight,feTile,feTurbulence,filter,foreignObject,g,hatch,hatchpath,image,line,linearGradient,marker,mask,mesh,meshgradient,meshpatch,meshrow,metadata,mpath,path,pattern,polygon,polyline,radialGradient,rect,set,solidcolor,stop,switch,symbol,text,textPath,title,tspan,unknown,use,view",
  xh =
    "annotation,annotation-xml,maction,maligngroup,malignmark,math,menclose,merror,mfenced,mfrac,mfraction,mglyph,mi,mlabeledtr,mlongdiv,mmultiscripts,mn,mo,mover,mpadded,mphantom,mprescripts,mroot,mrow,ms,mscarries,mscarry,msgroup,msline,mspace,msqrt,msrow,mstack,mstyle,msub,msubsup,msup,mtable,mtd,mtext,mtr,munder,munderover,none,semantics",
  Dh = "area,base,br,col,embed,hr,img,input,link,meta,param,source,track,wbr",
  Fh = st(Ih),
  $h = st(Mh),
  Uh = st(xh),
  Hh = st(Dh),
  Fu =
    "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly",
  $u = st(Fu),
  jh = st(
    Fu +
      ",async,autofocus,autoplay,controls,default,defer,disabled,hidden,inert,loop,open,required,reversed,scoped,seamless,checked,muted,multiple,selected",
  );
function ya(e) {
  return !!e || e === "";
}
const Vh = /[>/="'\u0009\u000a\u000c\u0020]/,
  Qo = {};
function Bh(e) {
  if (Qo.hasOwnProperty(e)) return Qo[e];
  const t = Vh.test(e);
  return (t && console.error(`unsafe attribute name: ${e}`), (Qo[e] = !t));
}
const Wh = {
    acceptCharset: "accept-charset",
    className: "class",
    htmlFor: "for",
    httpEquiv: "http-equiv",
  },
  Kh = st(
    "accept,accept-charset,accesskey,action,align,allow,alt,async,autocapitalize,autocomplete,autofocus,autoplay,background,bgcolor,border,buffered,capture,challenge,charset,checked,cite,class,code,codebase,color,cols,colspan,content,contenteditable,contextmenu,controls,coords,crossorigin,csp,data,datetime,decoding,default,defer,dir,dirname,disabled,download,draggable,dropzone,enctype,enterkeyhint,for,form,formaction,formenctype,formmethod,formnovalidate,formtarget,headers,height,hidden,high,href,hreflang,http-equiv,icon,id,importance,inert,integrity,ismap,itemprop,keytype,kind,label,lang,language,loading,list,loop,low,manifest,max,maxlength,minlength,media,min,multiple,muted,name,novalidate,open,optimum,pattern,ping,placeholder,poster,preload,radiogroup,readonly,referrerpolicy,rel,required,reversed,rows,rowspan,sandbox,scope,scoped,selected,shape,size,sizes,slot,span,spellcheck,src,srcdoc,srclang,srcset,start,step,style,summary,tabindex,target,title,translate,type,usemap,value,width,wrap",
  ),
  Gh = st(
    "xmlns,accent-height,accumulate,additive,alignment-baseline,alphabetic,amplitude,arabic-form,ascent,attributeName,attributeType,azimuth,baseFrequency,baseline-shift,baseProfile,bbox,begin,bias,by,calcMode,cap-height,class,clip,clipPathUnits,clip-path,clip-rule,color,color-interpolation,color-interpolation-filters,color-profile,color-rendering,contentScriptType,contentStyleType,crossorigin,cursor,cx,cy,d,decelerate,descent,diffuseConstant,direction,display,divisor,dominant-baseline,dur,dx,dy,edgeMode,elevation,enable-background,end,exponent,fill,fill-opacity,fill-rule,filter,filterRes,filterUnits,flood-color,flood-opacity,font-family,font-size,font-size-adjust,font-stretch,font-style,font-variant,font-weight,format,from,fr,fx,fy,g1,g2,glyph-name,glyph-orientation-horizontal,glyph-orientation-vertical,glyphRef,gradientTransform,gradientUnits,hanging,height,href,hreflang,horiz-adv-x,horiz-origin-x,id,ideographic,image-rendering,in,in2,intercept,k,k1,k2,k3,k4,kernelMatrix,kernelUnitLength,kerning,keyPoints,keySplines,keyTimes,lang,lengthAdjust,letter-spacing,lighting-color,limitingConeAngle,local,marker-end,marker-mid,marker-start,markerHeight,markerUnits,markerWidth,mask,maskContentUnits,maskUnits,mathematical,max,media,method,min,mode,name,numOctaves,offset,opacity,operator,order,orient,orientation,origin,overflow,overline-position,overline-thickness,panose-1,paint-order,path,pathLength,patternContentUnits,patternTransform,patternUnits,ping,pointer-events,points,pointsAtX,pointsAtY,pointsAtZ,preserveAlpha,preserveAspectRatio,primitiveUnits,r,radius,referrerPolicy,refX,refY,rel,rendering-intent,repeatCount,repeatDur,requiredExtensions,requiredFeatures,restart,result,rotate,rx,ry,scale,seed,shape-rendering,slope,spacing,specularConstant,specularExponent,speed,spreadMethod,startOffset,stdDeviation,stemh,stemv,stitchTiles,stop-color,stop-opacity,strikethrough-position,strikethrough-thickness,string,stroke,stroke-dasharray,stroke-dashoffset,stroke-linecap,stroke-linejoin,stroke-miterlimit,stroke-opacity,stroke-width,style,surfaceScale,systemLanguage,tabindex,tableValues,target,targetX,targetY,text-anchor,text-decoration,text-rendering,textLength,to,transform,transform-origin,type,u1,u2,underline-position,underline-thickness,unicode,unicode-bidi,unicode-range,units-per-em,v-alphabetic,v-hanging,v-ideographic,v-mathematical,values,vector-effect,version,vert-adv-y,vert-origin-x,vert-origin-y,viewBox,viewTarget,visibility,width,widths,word-spacing,writing-mode,x,x-height,x1,x2,xChannelSelector,xlink:actuate,xlink:arcrole,xlink:href,xlink:role,xlink:show,xlink:title,xlink:type,xmlns:xlink,xml:base,xml:lang,xml:space,y,y1,y2,yChannelSelector,z,zoomAndPan",
  ),
  qh = st(
    "accent,accentunder,actiontype,align,alignmentscope,altimg,altimg-height,altimg-valign,altimg-width,alttext,bevelled,close,columnsalign,columnlines,columnspan,denomalign,depth,dir,display,displaystyle,encoding,equalcolumns,equalrows,fence,fontstyle,fontweight,form,frame,framespacing,groupalign,height,href,id,indentalign,indentalignfirst,indentalignlast,indentshift,indentshiftfirst,indentshiftlast,indextype,justify,largetop,largeop,lquote,lspace,mathbackground,mathcolor,mathsize,mathvariant,maxsize,minlabelspacing,mode,other,overflow,position,rowalign,rowlines,rowspan,rquote,rspace,scriptlevel,scriptminsize,scriptsizemultiplier,selection,separator,separators,shift,side,src,stackalign,stretchy,subscriptshift,superscriptshift,symmetric,voffset,width,widths,xlink:href,xlink:show,xlink:type,xmlns",
  );
function Yh(e) {
  if (e == null) return !1;
  const t = typeof e;
  return t === "string" || t === "number" || t === "boolean";
}
const zh = /["'&<>]/;
function Xh(e) {
  const t = "" + e,
    n = zh.exec(t);
  if (!n) return t;
  let r = "",
    s,
    o,
    i = 0;
  for (o = n.index; o < t.length; o++) {
    switch (t.charCodeAt(o)) {
      case 34:
        s = "&quot;";
        break;
      case 38:
        s = "&amp;";
        break;
      case 39:
        s = "&#39;";
        break;
      case 60:
        s = "&lt;";
        break;
      case 62:
        s = "&gt;";
        break;
      default:
        continue;
    }
    (i !== o && (r += t.slice(i, o)), (i = o + 1), (r += s));
  }
  return i !== o ? r + t.slice(i, o) : r;
}
const Jh = /^-?>|<!--|-->|--!>|<!-$/g;
function Qh(e) {
  return e.replace(Jh, "");
}
const Uu = /[ !"#$%&'()*+,./:;<=>?@[\\\]^`{|}~]/g;
function Zh(e, t) {
  return e.replace(Uu, (n) =>
    t ? (n === '"' ? '\\\\\\"' : `\\\\${n}`) : `\\${n}`,
  );
}
function em(e, t) {
  if (e.length !== t.length) return !1;
  let n = !0;
  for (let r = 0; n && r < e.length; r++) n = en(e[r], t[r]);
  return n;
}
function en(e, t) {
  if (e === t) return !0;
  let n = Ei(e),
    r = Ei(t);
  if (n || r) return n && r ? e.getTime() === t.getTime() : !1;
  if (((n = yt(e)), (r = yt(t)), n || r)) return e === t;
  if (((n = Y(e)), (r = Y(t)), n || r)) return n && r ? em(e, t) : !1;
  if (((n = ge(e)), (r = ge(t)), n || r)) {
    if (!n || !r) return !1;
    const s = Object.keys(e).length,
      o = Object.keys(t).length;
    if (s !== o) return !1;
    for (const i in e) {
      const a = e.hasOwnProperty(i),
        l = t.hasOwnProperty(i);
      if ((a && !l) || (!a && l) || !en(e[i], t[i])) return !1;
    }
  }
  return String(e) === String(t);
}
function ds(e, t) {
  return e.findIndex((n) => en(n, t));
}
const Hu = (e) => !!(e && e.__v_isRef === !0),
  va = (e) =>
    me(e)
      ? e
      : e == null
        ? ""
        : Y(e) || (ge(e) && (e.toString === ga || !Z(e.toString)))
          ? Hu(e)
            ? va(e.value)
            : JSON.stringify(e, ju, 2)
          : String(e),
  ju = (e, t) =>
    Hu(t)
      ? ju(e, t.value)
      : Fn(t)
        ? {
            [`Map(${t.size})`]: [...t.entries()].reduce(
              (n, [r, s], o) => ((n[Zo(r, o) + " =>"] = s), n),
              {},
            ),
          }
        : An(t)
          ? { [`Set(${t.size})`]: [...t.values()].map((n) => Zo(n)) }
          : yt(t)
            ? Zo(t)
            : ge(t) && !Y(t) && !us(t)
              ? String(t)
              : t,
  Zo = (e, t = "") => {
    var n;
    return yt(e) ? `Symbol(${(n = e.description) != null ? n : t})` : e;
  },
  KC = Object.freeze(
    Object.defineProperty(
      {
        __proto__: null,
        EMPTY_ARR: Dn,
        EMPTY_OBJ: re,
        NO: Iu,
        NOOP: ut,
        PatchFlagNames: wh,
        PatchFlags: Eh,
        ShapeFlags: Th,
        SlotFlags: Ch,
        camelize: He,
        capitalize: Er,
        cssVarNameEscapeSymbolsRE: Uu,
        def: Ws,
        escapeHtml: Xh,
        escapeHtmlComment: Qh,
        extend: ve,
        genCacheKey: vh,
        genPropsAccessExp: yh,
        generateCodeFrame: Lh,
        getEscapedCssVarName: Zh,
        getGlobalThis: fs,
        hasChanged: Ke,
        hasOwn: de,
        hyphenate: qe,
        includeBooleanAttr: ya,
        invokeArrayFns: Un,
        isArray: Y,
        isBooleanAttr: jh,
        isBuiltInDirective: mh,
        isDate: Ei,
        isFunction: Z,
        isGloballyAllowed: ba,
        isGloballyWhitelisted: Rh,
        isHTMLTag: Fh,
        isIntegerKey: vo,
        isKnownHtmlAttr: Kh,
        isKnownMathMLAttr: qh,
        isKnownSvgAttr: Gh,
        isMap: Fn,
        isMathMLTag: Uh,
        isModelListener: bo,
        isObject: ge,
        isOn: vr,
        isPlainObject: us,
        isPromise: yo,
        isRegExp: Mu,
        isRenderableAttrValue: Yh,
        isReservedProp: $n,
        isSSRSafeAttrName: Bh,
        isSVGTag: $h,
        isSet: An,
        isSpecialBooleanAttr: $u,
        isString: me,
        isSymbol: yt,
        isVoidTag: Hh,
        looseEqual: en,
        looseIndexOf: ds,
        looseToNumber: Yr,
        makeMap: st,
        normalizeClass: Tr,
        normalizeProps: _a,
        normalizeStyle: wr,
        objectToString: ga,
        parseStringStyle: Du,
        propsToAttrMap: Wh,
        remove: _o,
        slotFlagsText: Sh,
        stringifyStyle: Nh,
        toDisplayString: va,
        toHandlerKey: sr,
        toNumber: zr,
        toRawType: xu,
        toTypeString: Yn,
      },
      Symbol.toStringTag,
      { value: "Module" },
    ),
  );
/**
 * @vue/reactivity v3.5.17
 * (c) 2018-present Yuxi (Evan) You and Vue contributors
 * @license MIT
 **/ let We;
class Ea {
  constructor(t = !1) {
    ((this.detached = t),
      (this._active = !0),
      (this._on = 0),
      (this.effects = []),
      (this.cleanups = []),
      (this._isPaused = !1),
      (this.parent = We),
      !t &&
        We &&
        (this.index = (We.scopes || (We.scopes = [])).push(this) - 1));
  }
  get active() {
    return this._active;
  }
  pause() {
    if (this._active) {
      this._isPaused = !0;
      let t, n;
      if (this.scopes)
        for (t = 0, n = this.scopes.length; t < n; t++) this.scopes[t].pause();
      for (t = 0, n = this.effects.length; t < n; t++) this.effects[t].pause();
    }
  }
  resume() {
    if (this._active && this._isPaused) {
      this._isPaused = !1;
      let t, n;
      if (this.scopes)
        for (t = 0, n = this.scopes.length; t < n; t++) this.scopes[t].resume();
      for (t = 0, n = this.effects.length; t < n; t++) this.effects[t].resume();
    }
  }
  run(t) {
    if (this._active) {
      const n = We;
      try {
        return ((We = this), t());
      } finally {
        We = n;
      }
    }
  }
  on() {
    ++this._on === 1 && ((this.prevScope = We), (We = this));
  }
  off() {
    this._on > 0 &&
      --this._on === 0 &&
      ((We = this.prevScope), (this.prevScope = void 0));
  }
  stop(t) {
    if (this._active) {
      this._active = !1;
      let n, r;
      for (n = 0, r = this.effects.length; n < r; n++) this.effects[n].stop();
      for (this.effects.length = 0, n = 0, r = this.cleanups.length; n < r; n++)
        this.cleanups[n]();
      if (((this.cleanups.length = 0), this.scopes)) {
        for (n = 0, r = this.scopes.length; n < r; n++) this.scopes[n].stop(!0);
        this.scopes.length = 0;
      }
      if (!this.detached && this.parent && !t) {
        const s = this.parent.scopes.pop();
        s &&
          s !== this &&
          ((this.parent.scopes[this.index] = s), (s.index = this.index));
      }
      this.parent = void 0;
    }
  }
}
function wo(e) {
  return new Ea(e);
}
function ps() {
  return We;
}
function Ks(e, t = !1) {
  We && We.cleanups.push(e);
}
let Te;
const ei = new WeakSet();
class Xr {
  constructor(t) {
    ((this.fn = t),
      (this.deps = void 0),
      (this.depsTail = void 0),
      (this.flags = 5),
      (this.next = void 0),
      (this.cleanup = void 0),
      (this.scheduler = void 0),
      We && We.active && We.effects.push(this));
  }
  pause() {
    this.flags |= 64;
  }
  resume() {
    this.flags & 64 &&
      ((this.flags &= -65), ei.has(this) && (ei.delete(this), this.trigger()));
  }
  notify() {
    (this.flags & 2 && !(this.flags & 32)) || this.flags & 8 || Bu(this);
  }
  run() {
    if (!(this.flags & 1)) return this.fn();
    ((this.flags |= 2), Cl(this), Wu(this));
    const t = Te,
      n = Rt;
    ((Te = this), (Rt = !0));
    try {
      return this.fn();
    } finally {
      (Ku(this), (Te = t), (Rt = n), (this.flags &= -3));
    }
  }
  stop() {
    if (this.flags & 1) {
      for (let t = this.deps; t; t = t.nextDep) Ca(t);
      ((this.deps = this.depsTail = void 0),
        Cl(this),
        this.onStop && this.onStop(),
        (this.flags &= -2));
    }
  }
  trigger() {
    this.flags & 64
      ? ei.add(this)
      : this.scheduler
        ? this.scheduler()
        : this.runIfDirty();
  }
  runIfDirty() {
    wi(this) && this.run();
  }
  get dirty() {
    return wi(this);
  }
}
let Vu = 0,
  $r,
  Ur;
function Bu(e, t = !1) {
  if (((e.flags |= 8), t)) {
    ((e.next = Ur), (Ur = e));
    return;
  }
  ((e.next = $r), ($r = e));
}
function wa() {
  Vu++;
}
function Ta() {
  if (--Vu > 0) return;
  if (Ur) {
    let t = Ur;
    for (Ur = void 0; t; ) {
      const n = t.next;
      ((t.next = void 0), (t.flags &= -9), (t = n));
    }
  }
  let e;
  for (; $r; ) {
    let t = $r;
    for ($r = void 0; t; ) {
      const n = t.next;
      if (((t.next = void 0), (t.flags &= -9), t.flags & 1))
        try {
          t.trigger();
        } catch (r) {
          e || (e = r);
        }
      t = n;
    }
  }
  if (e) throw e;
}
function Wu(e) {
  for (let t = e.deps; t; t = t.nextDep)
    ((t.version = -1),
      (t.prevActiveLink = t.dep.activeLink),
      (t.dep.activeLink = t));
}
function Ku(e) {
  let t,
    n = e.depsTail,
    r = n;
  for (; r; ) {
    const s = r.prevDep;
    (r.version === -1 ? (r === n && (n = s), Ca(r), tm(r)) : (t = r),
      (r.dep.activeLink = r.prevActiveLink),
      (r.prevActiveLink = void 0),
      (r = s));
  }
  ((e.deps = t), (e.depsTail = n));
}
function wi(e) {
  for (let t = e.deps; t; t = t.nextDep)
    if (
      t.dep.version !== t.version ||
      (t.dep.computed && (Gu(t.dep.computed) || t.dep.version !== t.version))
    )
      return !0;
  return !!e._dirty;
}
function Gu(e) {
  if (
    (e.flags & 4 && !(e.flags & 16)) ||
    ((e.flags &= -17), e.globalVersion === Jr) ||
    ((e.globalVersion = Jr),
    !e.isSSR && e.flags & 128 && ((!e.deps && !e._dirty) || !wi(e)))
  )
    return;
  e.flags |= 2;
  const t = e.dep,
    n = Te,
    r = Rt;
  ((Te = e), (Rt = !0));
  try {
    Wu(e);
    const s = e.fn(e._value);
    (t.version === 0 || Ke(s, e._value)) &&
      ((e.flags |= 128), (e._value = s), t.version++);
  } catch (s) {
    throw (t.version++, s);
  } finally {
    ((Te = n), (Rt = r), Ku(e), (e.flags &= -3));
  }
}
function Ca(e, t = !1) {
  const { dep: n, prevSub: r, nextSub: s } = e;
  if (
    (r && ((r.nextSub = s), (e.prevSub = void 0)),
    s && ((s.prevSub = r), (e.nextSub = void 0)),
    n.subs === e && ((n.subs = r), !r && n.computed))
  ) {
    n.computed.flags &= -5;
    for (let o = n.computed.deps; o; o = o.nextDep) Ca(o, !0);
  }
  !t && !--n.sc && n.map && n.map.delete(n.key);
}
function tm(e) {
  const { prevDep: t, nextDep: n } = e;
  (t && ((t.nextDep = n), (e.prevDep = void 0)),
    n && ((n.prevDep = t), (e.nextDep = void 0)));
}
function nm(e, t) {
  e.effect instanceof Xr && (e = e.effect.fn);
  const n = new Xr(e);
  t && ve(n, t);
  try {
    n.run();
  } catch (s) {
    throw (n.stop(), s);
  }
  const r = n.run.bind(n);
  return ((r.effect = n), r);
}
function rm(e) {
  e.effect.stop();
}
let Rt = !0;
const qu = [];
function tn() {
  (qu.push(Rt), (Rt = !1));
}
function nn() {
  const e = qu.pop();
  Rt = e === void 0 ? !0 : e;
}
function Cl(e) {
  const { cleanup: t } = e;
  if (((e.cleanup = void 0), t)) {
    const n = Te;
    Te = void 0;
    try {
      t();
    } finally {
      Te = n;
    }
  }
}
let Jr = 0;
class sm {
  constructor(t, n) {
    ((this.sub = t),
      (this.dep = n),
      (this.version = n.version),
      (this.nextDep =
        this.prevDep =
        this.nextSub =
        this.prevSub =
        this.prevActiveLink =
          void 0));
  }
}
class To {
  constructor(t) {
    ((this.computed = t),
      (this.version = 0),
      (this.activeLink = void 0),
      (this.subs = void 0),
      (this.map = void 0),
      (this.key = void 0),
      (this.sc = 0),
      (this.__v_skip = !0));
  }
  track(t) {
    if (!Te || !Rt || Te === this.computed) return;
    let n = this.activeLink;
    if (n === void 0 || n.sub !== Te)
      ((n = this.activeLink = new sm(Te, this)),
        Te.deps
          ? ((n.prevDep = Te.depsTail),
            (Te.depsTail.nextDep = n),
            (Te.depsTail = n))
          : (Te.deps = Te.depsTail = n),
        Yu(n));
    else if (n.version === -1 && ((n.version = this.version), n.nextDep)) {
      const r = n.nextDep;
      ((r.prevDep = n.prevDep),
        n.prevDep && (n.prevDep.nextDep = r),
        (n.prevDep = Te.depsTail),
        (n.nextDep = void 0),
        (Te.depsTail.nextDep = n),
        (Te.depsTail = n),
        Te.deps === n && (Te.deps = r));
    }
    return n;
  }
  trigger(t) {
    (this.version++, Jr++, this.notify(t));
  }
  notify(t) {
    wa();
    try {
      for (let n = this.subs; n; n = n.prevSub)
        n.sub.notify() && n.sub.dep.notify();
    } finally {
      Ta();
    }
  }
}
function Yu(e) {
  if ((e.dep.sc++, e.sub.flags & 4)) {
    const t = e.dep.computed;
    if (t && !e.dep.subs) {
      t.flags |= 20;
      for (let r = t.deps; r; r = r.nextDep) Yu(r);
    }
    const n = e.dep.subs;
    (n !== e && ((e.prevSub = n), n && (n.nextSub = e)), (e.dep.subs = e));
  }
}
const Gs = new WeakMap(),
  Hn = Symbol(""),
  Ti = Symbol(""),
  Qr = Symbol("");
function Ge(e, t, n) {
  if (Rt && Te) {
    let r = Gs.get(e);
    r || Gs.set(e, (r = new Map()));
    let s = r.get(n);
    (s || (r.set(n, (s = new To())), (s.map = r), (s.key = n)), s.track());
  }
}
function qt(e, t, n, r, s, o) {
  const i = Gs.get(e);
  if (!i) {
    Jr++;
    return;
  }
  const a = (l) => {
    l && l.trigger();
  };
  if ((wa(), t === "clear")) i.forEach(a);
  else {
    const l = Y(e),
      u = l && vo(n);
    if (l && n === "length") {
      const c = Number(r);
      i.forEach((f, d) => {
        (d === "length" || d === Qr || (!yt(d) && d >= c)) && a(f);
      });
    } else
      switch (
        ((n !== void 0 || i.has(void 0)) && a(i.get(n)), u && a(i.get(Qr)), t)
      ) {
        case "add":
          l ? u && a(i.get("length")) : (a(i.get(Hn)), Fn(e) && a(i.get(Ti)));
          break;
        case "delete":
          l || (a(i.get(Hn)), Fn(e) && a(i.get(Ti)));
          break;
        case "set":
          Fn(e) && a(i.get(Hn));
          break;
      }
  }
  Ta();
}
function om(e, t) {
  const n = Gs.get(e);
  return n && n.get(t);
}
function Jn(e) {
  const t = le(e);
  return t === e ? t : (Ge(t, "iterate", Qr), ft(e) ? t : t.map(je));
}
function Co(e) {
  return (Ge((e = le(e)), "iterate", Qr), e);
}
const im = {
  __proto__: null,
  [Symbol.iterator]() {
    return ti(this, Symbol.iterator, je);
  },
  concat(...e) {
    return Jn(this).concat(...e.map((t) => (Y(t) ? Jn(t) : t)));
  },
  entries() {
    return ti(this, "entries", (e) => ((e[1] = je(e[1])), e));
  },
  every(e, t) {
    return Wt(this, "every", e, t, void 0, arguments);
  },
  filter(e, t) {
    return Wt(this, "filter", e, t, (n) => n.map(je), arguments);
  },
  find(e, t) {
    return Wt(this, "find", e, t, je, arguments);
  },
  findIndex(e, t) {
    return Wt(this, "findIndex", e, t, void 0, arguments);
  },
  findLast(e, t) {
    return Wt(this, "findLast", e, t, je, arguments);
  },
  findLastIndex(e, t) {
    return Wt(this, "findLastIndex", e, t, void 0, arguments);
  },
  forEach(e, t) {
    return Wt(this, "forEach", e, t, void 0, arguments);
  },
  includes(...e) {
    return ni(this, "includes", e);
  },
  indexOf(...e) {
    return ni(this, "indexOf", e);
  },
  join(e) {
    return Jn(this).join(e);
  },
  lastIndexOf(...e) {
    return ni(this, "lastIndexOf", e);
  },
  map(e, t) {
    return Wt(this, "map", e, t, void 0, arguments);
  },
  pop() {
    return Pr(this, "pop");
  },
  push(...e) {
    return Pr(this, "push", e);
  },
  reduce(e, ...t) {
    return Sl(this, "reduce", e, t);
  },
  reduceRight(e, ...t) {
    return Sl(this, "reduceRight", e, t);
  },
  shift() {
    return Pr(this, "shift");
  },
  some(e, t) {
    return Wt(this, "some", e, t, void 0, arguments);
  },
  splice(...e) {
    return Pr(this, "splice", e);
  },
  toReversed() {
    return Jn(this).toReversed();
  },
  toSorted(e) {
    return Jn(this).toSorted(e);
  },
  toSpliced(...e) {
    return Jn(this).toSpliced(...e);
  },
  unshift(...e) {
    return Pr(this, "unshift", e);
  },
  values() {
    return ti(this, "values", je);
  },
};
function ti(e, t, n) {
  const r = Co(e),
    s = r[t]();
  return (
    r !== e &&
      !ft(e) &&
      ((s._next = s.next),
      (s.next = () => {
        const o = s._next();
        return (o.value && (o.value = n(o.value)), o);
      })),
    s
  );
}
const am = Array.prototype;
function Wt(e, t, n, r, s, o) {
  const i = Co(e),
    a = i !== e && !ft(e),
    l = i[t];
  if (l !== am[t]) {
    const f = l.apply(e, o);
    return a ? je(f) : f;
  }
  let u = n;
  i !== e &&
    (a
      ? (u = function (f, d) {
          return n.call(this, je(f), d, e);
        })
      : n.length > 2 &&
        (u = function (f, d) {
          return n.call(this, f, d, e);
        }));
  const c = l.call(i, u, r);
  return a && s ? s(c) : c;
}
function Sl(e, t, n, r) {
  const s = Co(e);
  let o = n;
  return (
    s !== e &&
      (ft(e)
        ? n.length > 3 &&
          (o = function (i, a, l) {
            return n.call(this, i, a, l, e);
          })
        : (o = function (i, a, l) {
            return n.call(this, i, je(a), l, e);
          })),
    s[t](o, ...r)
  );
}
function ni(e, t, n) {
  const r = le(e);
  Ge(r, "iterate", Qr);
  const s = r[t](...n);
  return (s === -1 || s === !1) && Ro(n[0])
    ? ((n[0] = le(n[0])), r[t](...n))
    : s;
}
function Pr(e, t, n = []) {
  (tn(), wa());
  const r = le(e)[t].apply(e, n);
  return (Ta(), nn(), r);
}
const lm = st("__proto__,__v_isRef,__isVue"),
  zu = new Set(
    Object.getOwnPropertyNames(Symbol)
      .filter((e) => e !== "arguments" && e !== "caller")
      .map((e) => Symbol[e])
      .filter(yt),
  );
function cm(e) {
  yt(e) || (e = String(e));
  const t = le(this);
  return (Ge(t, "has", e), t.hasOwnProperty(e));
}
class Xu {
  constructor(t = !1, n = !1) {
    ((this._isReadonly = t), (this._isShallow = n));
  }
  get(t, n, r) {
    if (n === "__v_skip") return t.__v_skip;
    const s = this._isReadonly,
      o = this._isShallow;
    if (n === "__v_isReactive") return !s;
    if (n === "__v_isReadonly") return s;
    if (n === "__v_isShallow") return o;
    if (n === "__v_raw")
      return r === (s ? (o ? nf : tf) : o ? ef : Zu).get(t) ||
        Object.getPrototypeOf(t) === Object.getPrototypeOf(r)
        ? t
        : void 0;
    const i = Y(t);
    if (!s) {
      let l;
      if (i && (l = im[n])) return l;
      if (n === "hasOwnProperty") return cm;
    }
    const a = Reflect.get(t, n, Se(t) ? t : r);
    return (yt(n) ? zu.has(n) : lm(n)) || (s || Ge(t, "get", n), o)
      ? a
      : Se(a)
        ? i && vo(n)
          ? a
          : a.value
        : ge(a)
          ? s
            ? Sa(a)
            : an(a)
          : a;
  }
}
class Ju extends Xu {
  constructor(t = !1) {
    super(!1, t);
  }
  set(t, n, r, s) {
    let o = t[n];
    if (!this._isShallow) {
      const l = Ht(o);
      if (
        (!ft(r) && !Ht(r) && ((o = le(o)), (r = le(r))),
        !Y(t) && Se(o) && !Se(r))
      )
        return l ? !1 : ((o.value = r), !0);
    }
    const i = Y(t) && vo(n) ? Number(n) < t.length : de(t, n),
      a = Reflect.set(t, n, r, Se(t) ? t : s);
    return (
      t === le(s) && (i ? Ke(r, o) && qt(t, "set", n, r) : qt(t, "add", n, r)),
      a
    );
  }
  deleteProperty(t, n) {
    const r = de(t, n);
    t[n];
    const s = Reflect.deleteProperty(t, n);
    return (s && r && qt(t, "delete", n, void 0), s);
  }
  has(t, n) {
    const r = Reflect.has(t, n);
    return ((!yt(n) || !zu.has(n)) && Ge(t, "has", n), r);
  }
  ownKeys(t) {
    return (Ge(t, "iterate", Y(t) ? "length" : Hn), Reflect.ownKeys(t));
  }
}
class Qu extends Xu {
  constructor(t = !1) {
    super(!0, t);
  }
  set(t, n) {
    return !0;
  }
  deleteProperty(t, n) {
    return !0;
  }
}
const um = new Ju(),
  fm = new Qu(),
  dm = new Ju(!0),
  pm = new Qu(!0),
  Ci = (e) => e,
  vs = (e) => Reflect.getPrototypeOf(e);
function hm(e, t, n) {
  return function (...r) {
    const s = this.__v_raw,
      o = le(s),
      i = Fn(o),
      a = e === "entries" || (e === Symbol.iterator && i),
      l = e === "keys" && i,
      u = s[e](...r),
      c = n ? Ci : t ? qs : je;
    return (
      !t && Ge(o, "iterate", l ? Ti : Hn),
      {
        next() {
          const { value: f, done: d } = u.next();
          return d
            ? { value: f, done: d }
            : { value: a ? [c(f[0]), c(f[1])] : c(f), done: d };
        },
        [Symbol.iterator]() {
          return this;
        },
      }
    );
  };
}
function Es(e) {
  return function (...t) {
    return e === "delete" ? !1 : e === "clear" ? void 0 : this;
  };
}
function mm(e, t) {
  const n = {
    get(s) {
      const o = this.__v_raw,
        i = le(o),
        a = le(s);
      e || (Ke(s, a) && Ge(i, "get", s), Ge(i, "get", a));
      const { has: l } = vs(i),
        u = t ? Ci : e ? qs : je;
      if (l.call(i, s)) return u(o.get(s));
      if (l.call(i, a)) return u(o.get(a));
      o !== i && o.get(s);
    },
    get size() {
      const s = this.__v_raw;
      return (!e && Ge(le(s), "iterate", Hn), Reflect.get(s, "size", s));
    },
    has(s) {
      const o = this.__v_raw,
        i = le(o),
        a = le(s);
      return (
        e || (Ke(s, a) && Ge(i, "has", s), Ge(i, "has", a)),
        s === a ? o.has(s) : o.has(s) || o.has(a)
      );
    },
    forEach(s, o) {
      const i = this,
        a = i.__v_raw,
        l = le(a),
        u = t ? Ci : e ? qs : je;
      return (
        !e && Ge(l, "iterate", Hn),
        a.forEach((c, f) => s.call(o, u(c), u(f), i))
      );
    },
  };
  return (
    ve(
      n,
      e
        ? {
            add: Es("add"),
            set: Es("set"),
            delete: Es("delete"),
            clear: Es("clear"),
          }
        : {
            add(s) {
              !t && !ft(s) && !Ht(s) && (s = le(s));
              const o = le(this);
              return (
                vs(o).has.call(o, s) || (o.add(s), qt(o, "add", s, s)),
                this
              );
            },
            set(s, o) {
              !t && !ft(o) && !Ht(o) && (o = le(o));
              const i = le(this),
                { has: a, get: l } = vs(i);
              let u = a.call(i, s);
              u || ((s = le(s)), (u = a.call(i, s)));
              const c = l.call(i, s);
              return (
                i.set(s, o),
                u ? Ke(o, c) && qt(i, "set", s, o) : qt(i, "add", s, o),
                this
              );
            },
            delete(s) {
              const o = le(this),
                { has: i, get: a } = vs(o);
              let l = i.call(o, s);
              (l || ((s = le(s)), (l = i.call(o, s))), a && a.call(o, s));
              const u = o.delete(s);
              return (l && qt(o, "delete", s, void 0), u);
            },
            clear() {
              const s = le(this),
                o = s.size !== 0,
                i = s.clear();
              return (o && qt(s, "clear", void 0, void 0), i);
            },
          },
    ),
    ["keys", "values", "entries", Symbol.iterator].forEach((s) => {
      n[s] = hm(s, e, t);
    }),
    n
  );
}
function So(e, t) {
  const n = mm(e, t);
  return (r, s, o) =>
    s === "__v_isReactive"
      ? !e
      : s === "__v_isReadonly"
        ? e
        : s === "__v_raw"
          ? r
          : Reflect.get(de(n, s) && s in r ? n : r, s, o);
}
const gm = { get: So(!1, !1) },
  bm = { get: So(!1, !0) },
  _m = { get: So(!0, !1) },
  ym = { get: So(!0, !0) },
  Zu = new WeakMap(),
  ef = new WeakMap(),
  tf = new WeakMap(),
  nf = new WeakMap();
function vm(e) {
  switch (e) {
    case "Object":
    case "Array":
      return 1;
    case "Map":
    case "Set":
    case "WeakMap":
    case "WeakSet":
      return 2;
    default:
      return 0;
  }
}
function Em(e) {
  return e.__v_skip || !Object.isExtensible(e) ? 0 : vm(xu(e));
}
function an(e) {
  return Ht(e) ? e : Ao(e, !1, um, gm, Zu);
}
function St(e) {
  return Ao(e, !1, dm, bm, ef);
}
function Sa(e) {
  return Ao(e, !0, fm, _m, tf);
}
function wm(e) {
  return Ao(e, !0, pm, ym, nf);
}
function Ao(e, t, n, r, s) {
  if (!ge(e) || (e.__v_raw && !(t && e.__v_isReactive))) return e;
  const o = Em(e);
  if (o === 0) return e;
  const i = s.get(e);
  if (i) return i;
  const a = new Proxy(e, o === 2 ? r : n);
  return (s.set(e, a), a);
}
function wn(e) {
  return Ht(e) ? wn(e.__v_raw) : !!(e && e.__v_isReactive);
}
function Ht(e) {
  return !!(e && e.__v_isReadonly);
}
function ft(e) {
  return !!(e && e.__v_isShallow);
}
function Ro(e) {
  return e ? !!e.__v_raw : !1;
}
function le(e) {
  const t = e && e.__v_raw;
  return t ? le(t) : e;
}
function rf(e) {
  return (
    !de(e, "__v_skip") && Object.isExtensible(e) && Ws(e, "__v_skip", !0),
    e
  );
}
const je = (e) => (ge(e) ? an(e) : e),
  qs = (e) => (ge(e) ? Sa(e) : e);
function Se(e) {
  return e ? e.__v_isRef === !0 : !1;
}
function ze(e) {
  return sf(e, !1);
}
function rn(e) {
  return sf(e, !0);
}
function sf(e, t) {
  return Se(e) ? e : new Tm(e, t);
}
class Tm {
  constructor(t, n) {
    ((this.dep = new To()),
      (this.__v_isRef = !0),
      (this.__v_isShallow = !1),
      (this._rawValue = n ? t : le(t)),
      (this._value = n ? t : je(t)),
      (this.__v_isShallow = n));
  }
  get value() {
    return (this.dep.track(), this._value);
  }
  set value(t) {
    const n = this._rawValue,
      r = this.__v_isShallow || ft(t) || Ht(t);
    ((t = r ? t : le(t)),
      Ke(t, n) &&
        ((this._rawValue = t),
        (this._value = r ? t : je(t)),
        this.dep.trigger()));
  }
}
function Cm(e) {
  e.dep && e.dep.trigger();
}
function te(e) {
  return Se(e) ? e.value : e;
}
function of(e) {
  return Z(e) ? e() : te(e);
}
const Sm = {
  get: (e, t, n) => (t === "__v_raw" ? e : te(Reflect.get(e, t, n))),
  set: (e, t, n, r) => {
    const s = e[t];
    return Se(s) && !Se(n) ? ((s.value = n), !0) : Reflect.set(e, t, n, r);
  },
};
function Aa(e) {
  return wn(e) ? e : new Proxy(e, Sm);
}
class Am {
  constructor(t) {
    ((this.__v_isRef = !0), (this._value = void 0));
    const n = (this.dep = new To()),
      { get: r, set: s } = t(n.track.bind(n), n.trigger.bind(n));
    ((this._get = r), (this._set = s));
  }
  get value() {
    return (this._value = this._get());
  }
  set value(t) {
    this._set(t);
  }
}
function Ra(e) {
  return new Am(e);
}
function Rm(e) {
  const t = Y(e) ? new Array(e.length) : {};
  for (const n in e) t[n] = af(e, n);
  return t;
}
class Lm {
  constructor(t, n, r) {
    ((this._object = t),
      (this._key = n),
      (this._defaultValue = r),
      (this.__v_isRef = !0),
      (this._value = void 0));
  }
  get value() {
    const t = this._object[this._key];
    return (this._value = t === void 0 ? this._defaultValue : t);
  }
  set value(t) {
    this._object[this._key] = t;
  }
  get dep() {
    return om(le(this._object), this._key);
  }
}
class Pm {
  constructor(t) {
    ((this._getter = t),
      (this.__v_isRef = !0),
      (this.__v_isReadonly = !0),
      (this._value = void 0));
  }
  get value() {
    return (this._value = this._getter());
  }
}
function La(e, t, n) {
  return Se(e)
    ? e
    : Z(e)
      ? new Pm(e)
      : ge(e) && arguments.length > 1
        ? af(e, t, n)
        : ze(e);
}
function af(e, t, n) {
  const r = e[t];
  return Se(r) ? r : new Lm(e, t, n);
}
class km {
  constructor(t, n, r) {
    ((this.fn = t),
      (this.setter = n),
      (this._value = void 0),
      (this.dep = new To(this)),
      (this.__v_isRef = !0),
      (this.deps = void 0),
      (this.depsTail = void 0),
      (this.flags = 16),
      (this.globalVersion = Jr - 1),
      (this.next = void 0),
      (this.effect = this),
      (this.__v_isReadonly = !n),
      (this.isSSR = r));
  }
  notify() {
    if (((this.flags |= 16), !(this.flags & 8) && Te !== this))
      return (Bu(this, !0), !0);
  }
  get value() {
    const t = this.dep.track();
    return (Gu(this), t && (t.version = this.dep.version), this._value);
  }
  set value(t) {
    this.setter && this.setter(t);
  }
}
function Om(e, t, n = !1) {
  let r, s;
  return (Z(e) ? (r = e) : ((r = e.get), (s = e.set)), new km(r, s, n));
}
const Nm = { GET: "get", HAS: "has", ITERATE: "iterate" },
  Im = { SET: "set", ADD: "add", DELETE: "delete", CLEAR: "clear" },
  ws = {},
  Ys = new WeakMap();
let hn;
function Mm() {
  return hn;
}
function lf(e, t = !1, n = hn) {
  if (n) {
    let r = Ys.get(n);
    (r || Ys.set(n, (r = [])), r.push(e));
  }
}
function xm(e, t, n = re) {
  const {
      immediate: r,
      deep: s,
      once: o,
      scheduler: i,
      augmentJob: a,
      call: l,
    } = n,
    u = (b) => (s ? b : ft(b) || s === !1 || s === 0 ? Yt(b, 1) : Yt(b));
  let c,
    f,
    d,
    p,
    y = !1,
    h = !1;
  if (
    (Se(e)
      ? ((f = () => e.value), (y = ft(e)))
      : wn(e)
        ? ((f = () => u(e)), (y = !0))
        : Y(e)
          ? ((h = !0),
            (y = e.some((b) => wn(b) || ft(b))),
            (f = () =>
              e.map((b) => {
                if (Se(b)) return b.value;
                if (wn(b)) return u(b);
                if (Z(b)) return l ? l(b, 2) : b();
              })))
          : Z(e)
            ? t
              ? (f = l ? () => l(e, 2) : e)
              : (f = () => {
                  if (d) {
                    tn();
                    try {
                      d();
                    } finally {
                      nn();
                    }
                  }
                  const b = hn;
                  hn = c;
                  try {
                    return l ? l(e, 3, [p]) : e(p);
                  } finally {
                    hn = b;
                  }
                })
            : (f = ut),
    t && s)
  ) {
    const b = f,
      C = s === !0 ? 1 / 0 : s;
    f = () => Yt(b(), C);
  }
  const S = ps(),
    g = () => {
      (c.stop(), S && S.active && _o(S.effects, c));
    };
  if (o && t) {
    const b = t;
    t = (...C) => {
      (b(...C), g());
    };
  }
  let E = h ? new Array(e.length).fill(ws) : ws;
  const m = (b) => {
    if (!(!(c.flags & 1) || (!c.dirty && !b)))
      if (t) {
        const C = c.run();
        if (s || y || (h ? C.some((L, R) => Ke(L, E[R])) : Ke(C, E))) {
          d && d();
          const L = hn;
          hn = c;
          try {
            const R = [C, E === ws ? void 0 : h && E[0] === ws ? [] : E, p];
            ((E = C), l ? l(t, 3, R) : t(...R));
          } finally {
            hn = L;
          }
        }
      } else c.run();
  };
  return (
    a && a(m),
    (c = new Xr(f)),
    (c.scheduler = i ? () => i(m, !1) : m),
    (p = (b) => lf(b, !1, c)),
    (d = c.onStop =
      () => {
        const b = Ys.get(c);
        if (b) {
          if (l) l(b, 4);
          else for (const C of b) C();
          Ys.delete(c);
        }
      }),
    t ? (r ? m(!0) : (E = c.run())) : i ? i(m.bind(null, !0), !0) : c.run(),
    (g.pause = c.pause.bind(c)),
    (g.resume = c.resume.bind(c)),
    (g.stop = g),
    g
  );
}
function Yt(e, t = 1 / 0, n) {
  if (t <= 0 || !ge(e) || e.__v_skip || ((n = n || new Set()), n.has(e)))
    return e;
  if ((n.add(e), t--, Se(e))) Yt(e.value, t, n);
  else if (Y(e)) for (let r = 0; r < e.length; r++) Yt(e[r], t, n);
  else if (An(e) || Fn(e))
    e.forEach((r) => {
      Yt(r, t, n);
    });
  else if (us(e)) {
    for (const r in e) Yt(e[r], t, n);
    for (const r of Object.getOwnPropertySymbols(e))
      Object.prototype.propertyIsEnumerable.call(e, r) && Yt(e[r], t, n);
  }
  return e;
}
/**
 * @vue/runtime-core v3.5.17
 * (c) 2018-present Yuxi (Evan) You and Vue contributors
 * @license MIT
 **/ const cf = [];
function Dm(e) {
  cf.push(e);
}
function Fm() {
  cf.pop();
}
function $m(e, t) {}
const Um = {
    SETUP_FUNCTION: 0,
    0: "SETUP_FUNCTION",
    RENDER_FUNCTION: 1,
    1: "RENDER_FUNCTION",
    NATIVE_EVENT_HANDLER: 5,
    5: "NATIVE_EVENT_HANDLER",
    COMPONENT_EVENT_HANDLER: 6,
    6: "COMPONENT_EVENT_HANDLER",
    VNODE_HOOK: 7,
    7: "VNODE_HOOK",
    DIRECTIVE_HOOK: 8,
    8: "DIRECTIVE_HOOK",
    TRANSITION_HOOK: 9,
    9: "TRANSITION_HOOK",
    APP_ERROR_HANDLER: 10,
    10: "APP_ERROR_HANDLER",
    APP_WARN_HANDLER: 11,
    11: "APP_WARN_HANDLER",
    FUNCTION_REF: 12,
    12: "FUNCTION_REF",
    ASYNC_COMPONENT_LOADER: 13,
    13: "ASYNC_COMPONENT_LOADER",
    SCHEDULER: 14,
    14: "SCHEDULER",
    COMPONENT_UPDATE: 15,
    15: "COMPONENT_UPDATE",
    APP_UNMOUNT_CLEANUP: 16,
    16: "APP_UNMOUNT_CLEANUP",
  },
  Hm = {
    sp: "serverPrefetch hook",
    bc: "beforeCreate hook",
    c: "created hook",
    bm: "beforeMount hook",
    m: "mounted hook",
    bu: "beforeUpdate hook",
    u: "updated",
    bum: "beforeUnmount hook",
    um: "unmounted hook",
    a: "activated hook",
    da: "deactivated hook",
    ec: "errorCaptured hook",
    rtc: "renderTracked hook",
    rtg: "renderTriggered hook",
    0: "setup function",
    1: "render function",
    2: "watcher getter",
    3: "watcher callback",
    4: "watcher cleanup function",
    5: "native event handler",
    6: "component event handler",
    7: "vnode hook",
    8: "directive hook",
    9: "transition hook",
    10: "app errorHandler",
    11: "app warnHandler",
    12: "ref function",
    13: "async component loader",
    14: "scheduler flush",
    15: "component update",
    16: "app unmount cleanup function",
  };
function Cr(e, t, n, r) {
  try {
    return r ? e(...r) : e();
  } catch (s) {
    zn(s, t, n);
  }
}
function vt(e, t, n, r) {
  if (Z(e)) {
    const s = Cr(e, t, n, r);
    return (
      s &&
        yo(s) &&
        s.catch((o) => {
          zn(o, t, n);
        }),
      s
    );
  }
  if (Y(e)) {
    const s = [];
    for (let o = 0; o < e.length; o++) s.push(vt(e[o], t, n, r));
    return s;
  }
}
function zn(e, t, n, r = !0) {
  const s = t ? t.vnode : null,
    { errorHandler: o, throwUnhandledErrorInProduction: i } =
      (t && t.appContext.config) || re;
  if (t) {
    let a = t.parent;
    const l = t.proxy,
      u = `https://vuejs.org/error-reference/#runtime-${n}`;
    for (; a; ) {
      const c = a.ec;
      if (c) {
        for (let f = 0; f < c.length; f++) if (c[f](e, l, u) === !1) return;
      }
      a = a.parent;
    }
    if (o) {
      (tn(), Cr(o, null, 10, [e, l, u]), nn());
      return;
    }
  }
  jm(e, n, s, r, i);
}
function jm(e, t, n, r = !0, s = !1) {
  if (s) throw e;
  console.error(e);
}
const Ze = [];
let Ft = -1;
const or = [];
let mn = null,
  Zn = 0;
const uf = Promise.resolve();
let zs = null;
function jt(e) {
  const t = zs || uf;
  return e ? t.then(this ? e.bind(this) : e) : t;
}
function Vm(e) {
  let t = Ft + 1,
    n = Ze.length;
  for (; t < n; ) {
    const r = (t + n) >>> 1,
      s = Ze[r],
      o = es(s);
    o < e || (o === e && s.flags & 2) ? (t = r + 1) : (n = r);
  }
  return t;
}
function Pa(e) {
  if (!(e.flags & 1)) {
    const t = es(e),
      n = Ze[Ze.length - 1];
    (!n || (!(e.flags & 2) && t >= es(n)) ? Ze.push(e) : Ze.splice(Vm(t), 0, e),
      (e.flags |= 1),
      ff());
  }
}
function ff() {
  zs || (zs = uf.then(df));
}
function Zr(e) {
  (Y(e)
    ? or.push(...e)
    : mn && e.id === -1
      ? mn.splice(Zn + 1, 0, e)
      : e.flags & 1 || (or.push(e), (e.flags |= 1)),
    ff());
}
function Al(e, t, n = Ft + 1) {
  for (; n < Ze.length; n++) {
    const r = Ze[n];
    if (r && r.flags & 2) {
      if (e && r.id !== e.uid) continue;
      (Ze.splice(n, 1),
        n--,
        r.flags & 4 && (r.flags &= -2),
        r(),
        r.flags & 4 || (r.flags &= -2));
    }
  }
}
function Xs(e) {
  if (or.length) {
    const t = [...new Set(or)].sort((n, r) => es(n) - es(r));
    if (((or.length = 0), mn)) {
      mn.push(...t);
      return;
    }
    for (mn = t, Zn = 0; Zn < mn.length; Zn++) {
      const n = mn[Zn];
      (n.flags & 4 && (n.flags &= -2), n.flags & 8 || n(), (n.flags &= -2));
    }
    ((mn = null), (Zn = 0));
  }
}
const es = (e) => (e.id == null ? (e.flags & 2 ? -1 : 1 / 0) : e.id);
function df(e) {
  try {
    for (Ft = 0; Ft < Ze.length; Ft++) {
      const t = Ze[Ft];
      t &&
        !(t.flags & 8) &&
        (t.flags & 4 && (t.flags &= -2),
        Cr(t, t.i, t.i ? 15 : 14),
        t.flags & 4 || (t.flags &= -2));
    }
  } finally {
    for (; Ft < Ze.length; Ft++) {
      const t = Ze[Ft];
      t && (t.flags &= -2);
    }
    ((Ft = -1),
      (Ze.length = 0),
      Xs(),
      (zs = null),
      (Ze.length || or.length) && df());
  }
}
let er,
  Ts = [];
function pf(e, t) {
  var n, r;
  ((er = e),
    er
      ? ((er.enabled = !0),
        Ts.forEach(({ event: s, args: o }) => er.emit(s, ...o)),
        (Ts = []))
      : typeof window < "u" &&
          window.HTMLElement &&
          !(
            (r = (n = window.navigator) == null ? void 0 : n.userAgent) !=
              null && r.includes("jsdom")
          )
        ? ((t.__VUE_DEVTOOLS_HOOK_REPLAY__ =
            t.__VUE_DEVTOOLS_HOOK_REPLAY__ || []).push((o) => {
            pf(o, t);
          }),
          setTimeout(() => {
            er || ((t.__VUE_DEVTOOLS_HOOK_REPLAY__ = null), (Ts = []));
          }, 3e3))
        : (Ts = []));
}
let xe = null,
  Lo = null;
function ts(e) {
  const t = xe;
  return ((xe = e), (Lo = (e && e.type.__scopeId) || null), t);
}
function Bm(e) {
  Lo = e;
}
function Wm() {
  Lo = null;
}
const Km = (e) => hs;
function hs(e, t = xe, n) {
  if (!t || e._n) return e;
  const r = (...s) => {
    r._d && Ii(-1);
    const o = ts(t);
    let i;
    try {
      i = e(...s);
    } finally {
      (ts(o), r._d && Ii(1));
    }
    return i;
  };
  return ((r._n = !0), (r._c = !0), (r._d = !0), r);
}
function Gm(e, t) {
  if (xe === null) return e;
  const n = _s(xe),
    r = e.dirs || (e.dirs = []);
  for (let s = 0; s < t.length; s++) {
    let [o, i, a, l = re] = t[s];
    o &&
      (Z(o) && (o = { mounted: o, updated: o }),
      o.deep && Yt(i),
      r.push({
        dir: o,
        instance: n,
        value: i,
        oldValue: void 0,
        arg: a,
        modifiers: l,
      }));
  }
  return e;
}
function $t(e, t, n, r) {
  const s = e.dirs,
    o = t && t.dirs;
  for (let i = 0; i < s.length; i++) {
    const a = s[i];
    o && (a.oldValue = o[i].value);
    let l = a.dir[r];
    l && (tn(), vt(l, n, 8, [e.el, a, e, t]), nn());
  }
}
const hf = Symbol("_vte"),
  mf = (e) => e.__isTeleport,
  Hr = (e) => e && (e.disabled || e.disabled === ""),
  Rl = (e) => e && (e.defer || e.defer === ""),
  Ll = (e) => typeof SVGElement < "u" && e instanceof SVGElement,
  Pl = (e) => typeof MathMLElement == "function" && e instanceof MathMLElement,
  Si = (e, t) => {
    const n = e && e.to;
    return me(n) ? (t ? t(n) : null) : n;
  },
  gf = {
    name: "Teleport",
    __isTeleport: !0,
    process(e, t, n, r, s, o, i, a, l, u) {
      const {
          mc: c,
          pc: f,
          pbc: d,
          o: { insert: p, querySelector: y, createText: h, createComment: S },
        } = u,
        g = Hr(t.props);
      let { shapeFlag: E, children: m, dynamicChildren: b } = t;
      if (e == null) {
        const C = (t.el = h("")),
          L = (t.anchor = h(""));
        (p(C, n, r), p(L, n, r));
        const R = (M, $) => {
            E & 16 &&
              (s && s.isCE && (s.ce._teleportTarget = M),
              c(m, M, $, s, o, i, a, l));
          },
          j = () => {
            const M = (t.target = Si(t.props, y)),
              $ = bf(M, t, h, p);
            M &&
              (i !== "svg" && Ll(M)
                ? (i = "svg")
                : i !== "mathml" && Pl(M) && (i = "mathml"),
              g || (R(M, $), $s(t, !1)));
          };
        (g && (R(n, L), $s(t, !0)),
          Rl(t.props)
            ? ((t.el.__isMounted = !1),
              Ie(() => {
                (j(), delete t.el.__isMounted);
              }, o))
            : j());
      } else {
        if (Rl(t.props) && e.el.__isMounted === !1) {
          Ie(() => {
            gf.process(e, t, n, r, s, o, i, a, l, u);
          }, o);
          return;
        }
        ((t.el = e.el), (t.targetStart = e.targetStart));
        const C = (t.anchor = e.anchor),
          L = (t.target = e.target),
          R = (t.targetAnchor = e.targetAnchor),
          j = Hr(e.props),
          M = j ? n : L,
          $ = j ? C : R;
        if (
          (i === "svg" || Ll(L)
            ? (i = "svg")
            : (i === "mathml" || Pl(L)) && (i = "mathml"),
          b
            ? (d(e.dynamicChildren, b, M, s, o, i, a), Ba(e, t, !0))
            : l || f(e, t, M, $, s, o, i, a, !1),
          g)
        )
          j
            ? t.props &&
              e.props &&
              t.props.to !== e.props.to &&
              (t.props.to = e.props.to)
            : Cs(t, n, C, u, 1);
        else if ((t.props && t.props.to) !== (e.props && e.props.to)) {
          const K = (t.target = Si(t.props, y));
          K && Cs(t, K, null, u, 0);
        } else j && Cs(t, L, R, u, 1);
        $s(t, g);
      }
    },
    remove(e, t, n, { um: r, o: { remove: s } }, o) {
      const {
        shapeFlag: i,
        children: a,
        anchor: l,
        targetStart: u,
        targetAnchor: c,
        target: f,
        props: d,
      } = e;
      if ((f && (s(u), s(c)), o && s(l), i & 16)) {
        const p = o || !Hr(d);
        for (let y = 0; y < a.length; y++) {
          const h = a[y];
          r(h, t, n, p, !!h.dynamicChildren);
        }
      }
    },
    move: Cs,
    hydrate: qm,
  };
function Cs(e, t, n, { o: { insert: r }, m: s }, o = 2) {
  o === 0 && r(e.targetAnchor, t, n);
  const { el: i, anchor: a, shapeFlag: l, children: u, props: c } = e,
    f = o === 2;
  if ((f && r(i, t, n), (!f || Hr(c)) && l & 16))
    for (let d = 0; d < u.length; d++) s(u[d], t, n, 2);
  f && r(a, t, n);
}
function qm(
  e,
  t,
  n,
  r,
  s,
  o,
  {
    o: {
      nextSibling: i,
      parentNode: a,
      querySelector: l,
      insert: u,
      createText: c,
    },
  },
  f,
) {
  const d = (t.target = Si(t.props, l));
  if (d) {
    const p = Hr(t.props),
      y = d._lpa || d.firstChild;
    if (t.shapeFlag & 16)
      if (p)
        ((t.anchor = f(i(e), t, a(e), n, r, s, o)),
          (t.targetStart = y),
          (t.targetAnchor = y && i(y)));
      else {
        t.anchor = i(e);
        let h = y;
        for (; h; ) {
          if (h && h.nodeType === 8) {
            if (h.data === "teleport start anchor") t.targetStart = h;
            else if (h.data === "teleport anchor") {
              ((t.targetAnchor = h),
                (d._lpa = t.targetAnchor && i(t.targetAnchor)));
              break;
            }
          }
          h = i(h);
        }
        (t.targetAnchor || bf(d, t, c, u), f(y && i(y), t, d, n, r, s, o));
      }
    $s(t, p);
  }
  return t.anchor && i(t.anchor);
}
const Ym = gf;
function $s(e, t) {
  const n = e.ctx;
  if (n && n.ut) {
    let r, s;
    for (
      t
        ? ((r = e.el), (s = e.anchor))
        : ((r = e.targetStart), (s = e.targetAnchor));
      r && r !== s;

    )
      (r.nodeType === 1 && r.setAttribute("data-v-owner", n.uid),
        (r = r.nextSibling));
    n.ut();
  }
}
function bf(e, t, n, r) {
  const s = (t.targetStart = n("")),
    o = (t.targetAnchor = n(""));
  return ((s[hf] = o), e && (r(s, e), r(o, e)), o);
}
const gn = Symbol("_leaveCb"),
  Ss = Symbol("_enterCb");
function ka() {
  const e = {
    isMounted: !1,
    isLeaving: !1,
    isUnmounting: !1,
    leavingVNodes: new Map(),
  };
  return (
    Sr(() => {
      e.isMounted = !0;
    }),
    Ar(() => {
      e.isUnmounting = !0;
    }),
    e
  );
}
const ht = [Function, Array],
  Oa = {
    mode: String,
    appear: Boolean,
    persisted: Boolean,
    onBeforeEnter: ht,
    onEnter: ht,
    onAfterEnter: ht,
    onEnterCancelled: ht,
    onBeforeLeave: ht,
    onLeave: ht,
    onAfterLeave: ht,
    onLeaveCancelled: ht,
    onBeforeAppear: ht,
    onAppear: ht,
    onAfterAppear: ht,
    onAppearCancelled: ht,
  },
  _f = (e) => {
    const t = e.subTree;
    return t.component ? _f(t.component) : t;
  },
  zm = {
    name: "BaseTransition",
    props: Oa,
    setup(e, { slots: t }) {
      const n = Ve(),
        r = ka();
      return () => {
        const s = t.default && Po(t.default(), !0);
        if (!s || !s.length) return;
        const o = yf(s),
          i = le(e),
          { mode: a } = i;
        if (r.isLeaving) return ri(o);
        const l = kl(o);
        if (!l) return ri(o);
        let u = cr(l, i, r, n, (f) => (u = f));
        l.type !== Oe && sn(l, u);
        let c = n.subTree && kl(n.subTree);
        if (c && c.type !== Oe && !Ct(l, c) && _f(n).type !== Oe) {
          let f = cr(c, i, r, n);
          if ((sn(c, f), a === "out-in" && l.type !== Oe))
            return (
              (r.isLeaving = !0),
              (f.afterLeave = () => {
                ((r.isLeaving = !1),
                  n.job.flags & 8 || n.update(),
                  delete f.afterLeave,
                  (c = void 0));
              }),
              ri(o)
            );
          a === "in-out" && l.type !== Oe
            ? (f.delayLeave = (d, p, y) => {
                const h = Ef(r, c);
                ((h[String(c.key)] = c),
                  (d[gn] = () => {
                    (p(),
                      (d[gn] = void 0),
                      delete u.delayedLeave,
                      (c = void 0));
                  }),
                  (u.delayedLeave = () => {
                    (y(), delete u.delayedLeave, (c = void 0));
                  }));
              })
            : (c = void 0);
        } else c && (c = void 0);
        return o;
      };
    },
  };
function yf(e) {
  let t = e[0];
  if (e.length > 1) {
    for (const n of e)
      if (n.type !== Oe) {
        t = n;
        break;
      }
  }
  return t;
}
const vf = zm;
function Ef(e, t) {
  const { leavingVNodes: n } = e;
  let r = n.get(t.type);
  return (r || ((r = Object.create(null)), n.set(t.type, r)), r);
}
function cr(e, t, n, r, s) {
  const {
      appear: o,
      mode: i,
      persisted: a = !1,
      onBeforeEnter: l,
      onEnter: u,
      onAfterEnter: c,
      onEnterCancelled: f,
      onBeforeLeave: d,
      onLeave: p,
      onAfterLeave: y,
      onLeaveCancelled: h,
      onBeforeAppear: S,
      onAppear: g,
      onAfterAppear: E,
      onAppearCancelled: m,
    } = t,
    b = String(e.key),
    C = Ef(n, e),
    L = (M, $) => {
      M && vt(M, r, 9, $);
    },
    R = (M, $) => {
      const K = $[1];
      (L(M, $),
        Y(M) ? M.every((F) => F.length <= 1) && K() : M.length <= 1 && K());
    },
    j = {
      mode: i,
      persisted: a,
      beforeEnter(M) {
        let $ = l;
        if (!n.isMounted)
          if (o) $ = S || l;
          else return;
        M[gn] && M[gn](!0);
        const K = C[b];
        (K && Ct(e, K) && K.el[gn] && K.el[gn](), L($, [M]));
      },
      enter(M) {
        let $ = u,
          K = c,
          F = f;
        if (!n.isMounted)
          if (o) (($ = g || u), (K = E || c), (F = m || f));
          else return;
        let X = !1;
        const ne = (M[Ss] = (se) => {
          X ||
            ((X = !0),
            se ? L(F, [M]) : L(K, [M]),
            j.delayedLeave && j.delayedLeave(),
            (M[Ss] = void 0));
        });
        $ ? R($, [M, ne]) : ne();
      },
      leave(M, $) {
        const K = String(e.key);
        if ((M[Ss] && M[Ss](!0), n.isUnmounting)) return $();
        L(d, [M]);
        let F = !1;
        const X = (M[gn] = (ne) => {
          F ||
            ((F = !0),
            $(),
            ne ? L(h, [M]) : L(y, [M]),
            (M[gn] = void 0),
            C[K] === e && delete C[K]);
        });
        ((C[K] = e), p ? R(p, [M, X]) : X());
      },
      clone(M) {
        const $ = cr(M, t, n, r, s);
        return (s && s($), $);
      },
    };
  return j;
}
function ri(e) {
  if (ms(e)) return ((e = Vt(e)), (e.children = null), e);
}
function kl(e) {
  if (!ms(e)) return mf(e.type) && e.children ? yf(e.children) : e;
  if (e.component) return e.component.subTree;
  const { shapeFlag: t, children: n } = e;
  if (n) {
    if (t & 16) return n[0];
    if (t & 32 && Z(n.default)) return n.default();
  }
}
function sn(e, t) {
  e.shapeFlag & 6 && e.component
    ? ((e.transition = t), sn(e.component.subTree, t))
    : e.shapeFlag & 128
      ? ((e.ssContent.transition = t.clone(e.ssContent)),
        (e.ssFallback.transition = t.clone(e.ssFallback)))
      : (e.transition = t);
}
function Po(e, t = !1, n) {
  let r = [],
    s = 0;
  for (let o = 0; o < e.length; o++) {
    let i = e[o];
    const a = n == null ? i.key : String(n) + String(i.key != null ? i.key : o);
    i.type === ke
      ? (i.patchFlag & 128 && s++, (r = r.concat(Po(i.children, t, a))))
      : (t || i.type !== Oe) && r.push(a != null ? Vt(i, { key: a }) : i);
  }
  if (s > 1) for (let o = 0; o < r.length; o++) r[o].patchFlag = -2;
  return r;
}
/*! #__NO_SIDE_EFFECTS__ */ function dt(e, t) {
  return Z(e) ? ve({ name: e.name }, t, { setup: e }) : e;
}
function Xm() {
  const e = Ve();
  return e
    ? (e.appContext.config.idPrefix || "v") + "-" + e.ids[0] + e.ids[1]++
    : "";
}
function Na(e) {
  e.ids = [e.ids[0] + e.ids[2]++ + "-", 0, 0];
}
function Jm(e) {
  const t = Ve(),
    n = rn(null);
  if (t) {
    const s = t.refs === re ? (t.refs = {}) : t.refs;
    Object.defineProperty(s, e, {
      enumerable: !0,
      get: () => n.value,
      set: (o) => (n.value = o),
    });
  }
  return n;
}
function ir(e, t, n, r, s = !1) {
  if (Y(e)) {
    e.forEach((y, h) => ir(y, t && (Y(t) ? t[h] : t), n, r, s));
    return;
  }
  if (Tn(r) && !s) {
    r.shapeFlag & 512 &&
      r.type.__asyncResolved &&
      r.component.subTree.component &&
      ir(e, t, n, r.component.subTree);
    return;
  }
  const o = r.shapeFlag & 4 ? _s(r.component) : r.el,
    i = s ? null : o,
    { i: a, r: l } = e,
    u = t && t.r,
    c = a.refs === re ? (a.refs = {}) : a.refs,
    f = a.setupState,
    d = le(f),
    p = f === re ? () => !1 : (y) => de(d, y);
  if (
    (u != null &&
      u !== l &&
      (me(u)
        ? ((c[u] = null), p(u) && (f[u] = null))
        : Se(u) && (u.value = null)),
    Z(l))
  )
    Cr(l, a, 12, [i, c]);
  else {
    const y = me(l),
      h = Se(l);
    if (y || h) {
      const S = () => {
        if (e.f) {
          const g = y ? (p(l) ? f[l] : c[l]) : l.value;
          s
            ? Y(g) && _o(g, o)
            : Y(g)
              ? g.includes(o) || g.push(o)
              : y
                ? ((c[l] = [o]), p(l) && (f[l] = c[l]))
                : ((l.value = [o]), e.k && (c[e.k] = l.value));
        } else
          y
            ? ((c[l] = i), p(l) && (f[l] = i))
            : h && ((l.value = i), e.k && (c[e.k] = i));
      };
      i ? ((S.id = -1), Ie(S, n)) : S();
    }
  }
}
let Ol = !1;
const Qn = () => {
    Ol ||
      (console.error("Hydration completed but contains mismatches."),
      (Ol = !0));
  },
  Qm = (e) => e.namespaceURI.includes("svg") && e.tagName !== "foreignObject",
  Zm = (e) => e.namespaceURI.includes("MathML"),
  As = (e) => {
    if (e.nodeType === 1) {
      if (Qm(e)) return "svg";
      if (Zm(e)) return "mathml";
    }
  },
  rr = (e) => e.nodeType === 8;
function eg(e) {
  const {
      mt: t,
      p: n,
      o: {
        patchProp: r,
        createText: s,
        nextSibling: o,
        parentNode: i,
        remove: a,
        insert: l,
        createComment: u,
      },
    } = e,
    c = (m, b) => {
      if (!b.hasChildNodes()) {
        (n(null, m, b), Xs(), (b._vnode = m));
        return;
      }
      (f(b.firstChild, m, null, null, null), Xs(), (b._vnode = m));
    },
    f = (m, b, C, L, R, j = !1) => {
      j = j || !!b.dynamicChildren;
      const M = rr(m) && m.data === "[",
        $ = () => h(m, b, C, L, R, M),
        { type: K, ref: F, shapeFlag: X, patchFlag: ne } = b;
      let se = m.nodeType;
      ((b.el = m), ne === -2 && ((j = !1), (b.dynamicChildren = null)));
      let q = null;
      switch (K) {
        case Zt:
          se !== 3
            ? b.children === ""
              ? (l((b.el = s("")), i(m), m), (q = m))
              : (q = $())
            : (m.data !== b.children && (Qn(), (m.data = b.children)),
              (q = o(m)));
          break;
        case Oe:
          E(m)
            ? ((q = o(m)), g((b.el = m.content.firstChild), m, C))
            : se !== 8 || M
              ? (q = $())
              : (q = o(m));
          break;
        case Vn:
          if ((M && ((m = o(m)), (se = m.nodeType)), se === 1 || se === 3)) {
            q = m;
            const ee = !b.children.length;
            for (let z = 0; z < b.staticCount; z++)
              (ee && (b.children += q.nodeType === 1 ? q.outerHTML : q.data),
                z === b.staticCount - 1 && (b.anchor = q),
                (q = o(q)));
            return M ? o(q) : q;
          } else $();
          break;
        case ke:
          M ? (q = y(m, b, C, L, R, j)) : (q = $());
          break;
        default:
          if (X & 1)
            (se !== 1 || b.type.toLowerCase() !== m.tagName.toLowerCase()) &&
            !E(m)
              ? (q = $())
              : (q = d(m, b, C, L, R, j));
          else if (X & 6) {
            b.slotScopeIds = R;
            const ee = i(m);
            if (
              (M
                ? (q = S(m))
                : rr(m) && m.data === "teleport start"
                  ? (q = S(m, m.data, "teleport end"))
                  : (q = o(m)),
              t(b, ee, null, C, L, As(ee), j),
              Tn(b) && !b.type.__asyncResolved)
            ) {
              let z;
              (M
                ? ((z = we(ke)),
                  (z.anchor = q ? q.previousSibling : ee.lastChild))
                : (z = m.nodeType === 3 ? Ga("") : we("div")),
                (z.el = m),
                (b.component.subTree = z));
            }
          } else
            X & 64
              ? se !== 8
                ? (q = $())
                : (q = b.type.hydrate(m, b, C, L, R, j, e, p))
              : X & 128 &&
                (q = b.type.hydrate(m, b, C, L, As(i(m)), R, j, e, f));
      }
      return (F != null && ir(F, null, L, b), q);
    },
    d = (m, b, C, L, R, j) => {
      j = j || !!b.dynamicChildren;
      const {
          type: M,
          props: $,
          patchFlag: K,
          shapeFlag: F,
          dirs: X,
          transition: ne,
        } = b,
        se = M === "input" || M === "option";
      if (se || K !== -1) {
        X && $t(b, null, C, "created");
        let q = !1;
        if (E(m)) {
          q = Wf(null, ne) && C && C.vnode.props && C.vnode.props.appear;
          const z = m.content.firstChild;
          if (q) {
            const fe = z.getAttribute("class");
            (fe && (z.$cls = fe), ne.beforeEnter(z));
          }
          (g(z, m, C), (b.el = m = z));
        }
        if (F & 16 && !($ && ($.innerHTML || $.textContent))) {
          let z = p(m.firstChild, b, m, C, L, R, j);
          for (; z; ) {
            Rs(m, 1) || Qn();
            const fe = z;
            ((z = z.nextSibling), a(fe));
          }
        } else if (F & 8) {
          let z = b.children;
          (z[0] ===
            `
` &&
            (m.tagName === "PRE" || m.tagName === "TEXTAREA") &&
            (z = z.slice(1)),
            m.textContent !== z &&
              (Rs(m, 0) || Qn(), (m.textContent = b.children)));
        }
        if ($) {
          if (se || !j || K & 48) {
            const z = m.tagName.includes("-");
            for (const fe in $)
              ((se && (fe.endsWith("value") || fe === "indeterminate")) ||
                (vr(fe) && !$n(fe)) ||
                fe[0] === "." ||
                z) &&
                r(m, fe, null, $[fe], void 0, C);
          } else if ($.onClick) r(m, "onClick", null, $.onClick, void 0, C);
          else if (K & 4 && wn($.style)) for (const z in $.style) $.style[z];
        }
        let ee;
        ((ee = $ && $.onVnodeBeforeMount) && tt(ee, C, b),
          X && $t(b, null, C, "beforeMount"),
          ((ee = $ && $.onVnodeMounted) || X || q) &&
            ed(() => {
              (ee && tt(ee, C, b),
                q && ne.enter(m),
                X && $t(b, null, C, "mounted"));
            }, L));
      }
      return m.nextSibling;
    },
    p = (m, b, C, L, R, j, M) => {
      M = M || !!b.dynamicChildren;
      const $ = b.children,
        K = $.length;
      for (let F = 0; F < K; F++) {
        const X = M ? $[F] : ($[F] = nt($[F])),
          ne = X.type === Zt;
        m
          ? (ne &&
              !M &&
              F + 1 < K &&
              nt($[F + 1]).type === Zt &&
              (l(s(m.data.slice(X.children.length)), C, o(m)),
              (m.data = X.children)),
            (m = f(m, X, L, R, j, M)))
          : ne && !X.children
            ? l((X.el = s("")), C)
            : (Rs(C, 1) || Qn(), n(null, X, C, null, L, R, As(C), j));
      }
      return m;
    },
    y = (m, b, C, L, R, j) => {
      const { slotScopeIds: M } = b;
      M && (R = R ? R.concat(M) : M);
      const $ = i(m),
        K = p(o(m), b, $, C, L, R, j);
      return K && rr(K) && K.data === "]"
        ? o((b.anchor = K))
        : (Qn(), l((b.anchor = u("]")), $, K), K);
    },
    h = (m, b, C, L, R, j) => {
      if ((Rs(m.parentElement, 1) || Qn(), (b.el = null), j)) {
        const K = S(m);
        for (;;) {
          const F = o(m);
          if (F && F !== K) a(F);
          else break;
        }
      }
      const M = o(m),
        $ = i(m);
      return (
        a(m),
        n(null, b, $, M, C, L, As($), R),
        C && ((C.vnode.el = b.el), Mo(C, b.el)),
        M
      );
    },
    S = (m, b = "[", C = "]") => {
      let L = 0;
      for (; m; )
        if (((m = o(m)), m && rr(m) && (m.data === b && L++, m.data === C))) {
          if (L === 0) return o(m);
          L--;
        }
      return m;
    },
    g = (m, b, C) => {
      const L = b.parentNode;
      L && L.replaceChild(m, b);
      let R = C;
      for (; R; )
        (R.vnode.el === b && (R.vnode.el = R.subTree.el = m), (R = R.parent));
    },
    E = (m) => m.nodeType === 1 && m.tagName === "TEMPLATE";
  return [c, f];
}
const Nl = "data-allow-mismatch",
  tg = { 0: "text", 1: "children", 2: "class", 3: "style", 4: "attribute" };
function Rs(e, t) {
  if (t === 0 || t === 1)
    for (; e && !e.hasAttribute(Nl); ) e = e.parentElement;
  const n = e && e.getAttribute(Nl);
  if (n == null) return !1;
  if (n === "") return !0;
  {
    const r = n.split(",");
    return t === 0 && r.includes("children") ? !0 : r.includes(tg[t]);
  }
}
const ng = fs().requestIdleCallback || ((e) => setTimeout(e, 1)),
  rg = fs().cancelIdleCallback || ((e) => clearTimeout(e)),
  sg =
    (e = 1e4) =>
    (t) => {
      const n = ng(t, { timeout: e });
      return () => rg(n);
    };
function og(e) {
  const { top: t, left: n, bottom: r, right: s } = e.getBoundingClientRect(),
    { innerHeight: o, innerWidth: i } = window;
  return (
    ((t > 0 && t < o) || (r > 0 && r < o)) &&
    ((n > 0 && n < i) || (s > 0 && s < i))
  );
}
const ig = (e) => (t, n) => {
    const r = new IntersectionObserver((s) => {
      for (const o of s)
        if (o.isIntersecting) {
          (r.disconnect(), t());
          break;
        }
    }, e);
    return (
      n((s) => {
        if (s instanceof Element) {
          if (og(s)) return (t(), r.disconnect(), !1);
          r.observe(s);
        }
      }),
      () => r.disconnect()
    );
  },
  ag = (e) => (t) => {
    if (e) {
      const n = matchMedia(e);
      if (n.matches) t();
      else
        return (
          n.addEventListener("change", t, { once: !0 }),
          () => n.removeEventListener("change", t)
        );
    }
  },
  lg =
    (e = []) =>
    (t, n) => {
      me(e) && (e = [e]);
      let r = !1;
      const s = (i) => {
          r ||
            ((r = !0),
            o(),
            t(),
            i.target.dispatchEvent(new i.constructor(i.type, i)));
        },
        o = () => {
          n((i) => {
            for (const a of e) i.removeEventListener(a, s);
          });
        };
      return (
        n((i) => {
          for (const a of e) i.addEventListener(a, s, { once: !0 });
        }),
        o
      );
    };
function cg(e, t) {
  if (rr(e) && e.data === "[") {
    let n = 1,
      r = e.nextSibling;
    for (; r; ) {
      if (r.nodeType === 1) {
        if (t(r) === !1) break;
      } else if (rr(r))
        if (r.data === "]") {
          if (--n === 0) break;
        } else r.data === "[" && n++;
      r = r.nextSibling;
    }
  } else t(e);
}
const Tn = (e) => !!e.type.__asyncLoader;
/*! #__NO_SIDE_EFFECTS__ */ function Ai(e) {
  Z(e) && (e = { loader: e });
  const {
    loader: t,
    loadingComponent: n,
    errorComponent: r,
    delay: s = 200,
    hydrate: o,
    timeout: i,
    suspensible: a = !0,
    onError: l,
  } = e;
  let u = null,
    c,
    f = 0;
  const d = () => (f++, (u = null), p()),
    p = () => {
      let y;
      return (
        u ||
        (y = u =
          t()
            .catch((h) => {
              if (((h = h instanceof Error ? h : new Error(String(h))), l))
                return new Promise((S, g) => {
                  l(
                    h,
                    () => S(d()),
                    () => g(h),
                    f + 1,
                  );
                });
              throw h;
            })
            .then((h) =>
              y !== u && u
                ? u
                : (h &&
                    (h.__esModule || h[Symbol.toStringTag] === "Module") &&
                    (h = h.default),
                  (c = h),
                  h),
            ))
      );
    };
  return dt({
    name: "AsyncComponentWrapper",
    __asyncLoader: p,
    __asyncHydrate(y, h, S) {
      const g = o
        ? () => {
            const m = o(
              () => {
                S();
              },
              (b) => cg(y, b),
            );
            (m && (h.bum || (h.bum = [])).push(m),
              (h.u || (h.u = [])).push(() => !0));
          }
        : S;
      c ? g() : p().then(() => !h.isUnmounted && g());
    },
    get __asyncResolved() {
      return c;
    },
    setup() {
      const y = Me;
      if ((Na(y), c)) return () => si(c, y);
      const h = (m) => {
        ((u = null), zn(m, y, 13, !r));
      };
      if ((a && y.suspense) || ur)
        return p()
          .then((m) => () => si(m, y))
          .catch((m) => (h(m), () => (r ? we(r, { error: m }) : null)));
      const S = ze(!1),
        g = ze(),
        E = ze(!!s);
      return (
        s &&
          setTimeout(() => {
            E.value = !1;
          }, s),
        i != null &&
          setTimeout(() => {
            if (!S.value && !g.value) {
              const m = new Error(`Async component timed out after ${i}ms.`);
              (h(m), (g.value = m));
            }
          }, i),
        p()
          .then(() => {
            ((S.value = !0),
              y.parent && ms(y.parent.vnode) && y.parent.update());
          })
          .catch((m) => {
            (h(m), (g.value = m));
          }),
        () => {
          if (S.value && c) return si(c, y);
          if (g.value && r) return we(r, { error: g.value });
          if (n && !E.value) return we(n);
        }
      );
    },
  });
}
function si(e, t) {
  const { ref: n, props: r, children: s, ce: o } = t.vnode,
    i = we(e, r, s);
  return ((i.ref = n), (i.ce = o), delete t.vnode.ce, i);
}
const ms = (e) => e.type.__isKeepAlive,
  ug = {
    name: "KeepAlive",
    __isKeepAlive: !0,
    props: {
      include: [String, RegExp, Array],
      exclude: [String, RegExp, Array],
      max: [String, Number],
    },
    setup(e, { slots: t }) {
      const n = Ve(),
        r = n.ctx;
      if (!r.renderer)
        return () => {
          const E = t.default && t.default();
          return E && E.length === 1 ? E[0] : E;
        };
      const s = new Map(),
        o = new Set();
      let i = null;
      const a = n.suspense,
        {
          renderer: {
            p: l,
            m: u,
            um: c,
            o: { createElement: f },
          },
        } = r,
        d = f("div");
      ((r.activate = (E, m, b, C, L) => {
        const R = E.component;
        (u(E, m, b, 0, a),
          l(R.vnode, E, m, b, R, a, C, E.slotScopeIds, L),
          Ie(() => {
            ((R.isDeactivated = !1), R.a && Un(R.a));
            const j = E.props && E.props.onVnodeMounted;
            j && tt(j, R.parent, E);
          }, a));
      }),
        (r.deactivate = (E) => {
          const m = E.component;
          (Qs(m.m),
            Qs(m.a),
            u(E, d, null, 1, a),
            Ie(() => {
              m.da && Un(m.da);
              const b = E.props && E.props.onVnodeUnmounted;
              (b && tt(b, m.parent, E), (m.isDeactivated = !0));
            }, a));
        }));
      function p(E) {
        (oi(E), c(E, n, a, !0));
      }
      function y(E) {
        s.forEach((m, b) => {
          const C = $i(m.type);
          C && !E(C) && h(b);
        });
      }
      function h(E) {
        const m = s.get(E);
        (m && (!i || !Ct(m, i)) ? p(m) : i && oi(i), s.delete(E), o.delete(E));
      }
      rt(
        () => [e.include, e.exclude],
        ([E, m]) => {
          (E && y((b) => xr(E, b)), m && y((b) => !xr(m, b)));
        },
        { flush: "post", deep: !0 },
      );
      let S = null;
      const g = () => {
        S != null &&
          (Zs(n.subTree.type)
            ? Ie(() => {
                s.set(S, Ls(n.subTree));
              }, n.subTree.suspense)
            : s.set(S, Ls(n.subTree)));
      };
      return (
        Sr(g),
        Oo(g),
        Ar(() => {
          s.forEach((E) => {
            const { subTree: m, suspense: b } = n,
              C = Ls(m);
            if (E.type === C.type && E.key === C.key) {
              oi(C);
              const L = C.component.da;
              L && Ie(L, b);
              return;
            }
            p(E);
          });
        }),
        () => {
          if (((S = null), !t.default)) return (i = null);
          const E = t.default(),
            m = E[0];
          if (E.length > 1) return ((i = null), E);
          if (!on(m) || (!(m.shapeFlag & 4) && !(m.shapeFlag & 128)))
            return ((i = null), m);
          let b = Ls(m);
          if (b.type === Oe) return ((i = null), b);
          const C = b.type,
            L = $i(Tn(b) ? b.type.__asyncResolved || {} : C),
            { include: R, exclude: j, max: M } = e;
          if ((R && (!L || !xr(R, L))) || (j && L && xr(j, L)))
            return ((b.shapeFlag &= -257), (i = b), m);
          const $ = b.key == null ? C : b.key,
            K = s.get($);
          return (
            b.el && ((b = Vt(b)), m.shapeFlag & 128 && (m.ssContent = b)),
            (S = $),
            K
              ? ((b.el = K.el),
                (b.component = K.component),
                b.transition && sn(b, b.transition),
                (b.shapeFlag |= 512),
                o.delete($),
                o.add($))
              : (o.add($),
                M && o.size > parseInt(M, 10) && h(o.values().next().value)),
            (b.shapeFlag |= 256),
            (i = b),
            Zs(m.type) ? m : b
          );
        }
      );
    },
  },
  wf = ug;
function xr(e, t) {
  return Y(e)
    ? e.some((n) => xr(n, t))
    : me(e)
      ? e.split(",").includes(t)
      : Mu(e)
        ? ((e.lastIndex = 0), e.test(t))
        : !1;
}
function Ia(e, t) {
  Tf(e, "a", t);
}
function Ma(e, t) {
  Tf(e, "da", t);
}
function Tf(e, t, n = Me) {
  const r =
    e.__wdc ||
    (e.__wdc = () => {
      let s = n;
      for (; s; ) {
        if (s.isDeactivated) return;
        s = s.parent;
      }
      return e();
    });
  if ((ko(t, r, n), n)) {
    let s = n.parent;
    for (; s && s.parent; )
      (ms(s.parent.vnode) && fg(r, t, n, s), (s = s.parent));
  }
}
function fg(e, t, n, r) {
  const s = ko(t, e, r, !0);
  gs(() => {
    _o(r[t], s);
  }, n);
}
function oi(e) {
  ((e.shapeFlag &= -257), (e.shapeFlag &= -513));
}
function Ls(e) {
  return e.shapeFlag & 128 ? e.ssContent : e;
}
function ko(e, t, n = Me, r = !1) {
  if (n) {
    const s = n[e] || (n[e] = []),
      o =
        t.__weh ||
        (t.__weh = (...i) => {
          tn();
          const a = Kn(n),
            l = vt(t, n, e, i);
          return (a(), nn(), l);
        });
    return (r ? s.unshift(o) : s.push(o), o);
  }
}
const ln =
    (e) =>
    (t, n = Me) => {
      (!ur || e === "sp") && ko(e, (...r) => t(...r), n);
    },
  Cf = ln("bm"),
  Sr = ln("m"),
  xa = ln("bu"),
  Oo = ln("u"),
  Ar = ln("bum"),
  gs = ln("um"),
  Sf = ln("sp"),
  Af = ln("rtg"),
  Rf = ln("rtc");
function Da(e, t = Me) {
  ko("ec", e, t);
}
const Fa = "components",
  dg = "directives";
function pg(e, t) {
  return $a(Fa, e, !0, t) || e;
}
const Lf = Symbol.for("v-ndc");
function Pf(e) {
  return me(e) ? $a(Fa, e, !1) || e : e || Lf;
}
function hg(e) {
  return $a(dg, e);
}
function $a(e, t, n = !0, r = !1) {
  const s = xe || Me;
  if (s) {
    const o = s.type;
    if (e === Fa) {
      const a = $i(o, !1);
      if (a && (a === t || a === He(t) || a === Er(He(t)))) return o;
    }
    const i = Il(s[e] || o[e], t) || Il(s.appContext[e], t);
    return !i && r ? o : i;
  }
}
function Il(e, t) {
  return e && (e[t] || e[He(t)] || e[Er(He(t))]);
}
function mg(e, t, n, r) {
  let s;
  const o = n && n[r],
    i = Y(e);
  if (i || me(e)) {
    const a = i && wn(e);
    let l = !1,
      u = !1;
    (a && ((l = !ft(e)), (u = Ht(e)), (e = Co(e))), (s = new Array(e.length)));
    for (let c = 0, f = e.length; c < f; c++)
      s[c] = t(l ? (u ? qs(je(e[c])) : je(e[c])) : e[c], c, void 0, o && o[c]);
  } else if (typeof e == "number") {
    s = new Array(e);
    for (let a = 0; a < e; a++) s[a] = t(a + 1, a, void 0, o && o[a]);
  } else if (ge(e))
    if (e[Symbol.iterator])
      s = Array.from(e, (a, l) => t(a, l, void 0, o && o[l]));
    else {
      const a = Object.keys(e);
      s = new Array(a.length);
      for (let l = 0, u = a.length; l < u; l++) {
        const c = a[l];
        s[l] = t(e[c], c, l, o && o[l]);
      }
    }
  else s = [];
  return (n && (n[r] = s), s);
}
function gg(e, t) {
  for (let n = 0; n < t.length; n++) {
    const r = t[n];
    if (Y(r)) for (let s = 0; s < r.length; s++) e[r[s].name] = r[s].fn;
    else
      r &&
        (e[r.name] = r.key
          ? (...s) => {
              const o = r.fn(...s);
              return (o && (o.key = r.key), o);
            }
          : r.fn);
  }
  return e;
}
function bg(e, t, n = {}, r, s) {
  if (xe.ce || (xe.parent && Tn(xe.parent) && xe.parent.ce))
    return (
      t !== "default" && (n.name = t),
      ct(),
      Tt(ke, null, [we("slot", n, r && r())], 64)
    );
  let o = e[t];
  (o && o._c && (o._d = !1), ct());
  const i = o && Ua(o(n)),
    a = n.key || (i && i.key),
    l = Tt(
      ke,
      { key: (a && !yt(a) ? a : `_${t}`) + (!i && r ? "_fb" : "") },
      i || (r ? r() : []),
      i && e._ === 1 ? 64 : -2,
    );
  return (
    !s && l.scopeId && (l.slotScopeIds = [l.scopeId + "-s"]),
    o && o._c && (o._d = !0),
    l
  );
}
function Ua(e) {
  return e.some((t) =>
    on(t) ? !(t.type === Oe || (t.type === ke && !Ua(t.children))) : !0,
  )
    ? e
    : null;
}
function _g(e, t) {
  const n = {};
  for (const r in e) n[t && /[A-Z]/.test(r) ? `on:${r}` : sr(r)] = e[r];
  return n;
}
const Ri = (e) => (e ? (id(e) ? _s(e) : Ri(e.parent)) : null),
  jr = ve(Object.create(null), {
    $: (e) => e,
    $el: (e) => e.vnode.el,
    $data: (e) => e.data,
    $props: (e) => e.props,
    $attrs: (e) => e.attrs,
    $slots: (e) => e.slots,
    $refs: (e) => e.refs,
    $parent: (e) => Ri(e.parent),
    $root: (e) => Ri(e.root),
    $host: (e) => e.ce,
    $emit: (e) => e.emit,
    $options: (e) => Ha(e),
    $forceUpdate: (e) =>
      e.f ||
      (e.f = () => {
        Pa(e.update);
      }),
    $nextTick: (e) => e.n || (e.n = jt.bind(e.proxy)),
    $watch: (e) => Yg.bind(e),
  }),
  ii = (e, t) => e !== re && !e.__isScriptSetup && de(e, t),
  Li = {
    get({ _: e }, t) {
      if (t === "__v_skip") return !0;
      const {
        ctx: n,
        setupState: r,
        data: s,
        props: o,
        accessCache: i,
        type: a,
        appContext: l,
      } = e;
      let u;
      if (t[0] !== "$") {
        const p = i[t];
        if (p !== void 0)
          switch (p) {
            case 1:
              return r[t];
            case 2:
              return s[t];
            case 4:
              return n[t];
            case 3:
              return o[t];
          }
        else {
          if (ii(r, t)) return ((i[t] = 1), r[t]);
          if (s !== re && de(s, t)) return ((i[t] = 2), s[t]);
          if ((u = e.propsOptions[0]) && de(u, t)) return ((i[t] = 3), o[t]);
          if (n !== re && de(n, t)) return ((i[t] = 4), n[t]);
          Pi && (i[t] = 0);
        }
      }
      const c = jr[t];
      let f, d;
      if (c) return (t === "$attrs" && Ge(e.attrs, "get", ""), c(e));
      if ((f = a.__cssModules) && (f = f[t])) return f;
      if (n !== re && de(n, t)) return ((i[t] = 4), n[t]);
      if (((d = l.config.globalProperties), de(d, t))) return d[t];
    },
    set({ _: e }, t, n) {
      const { data: r, setupState: s, ctx: o } = e;
      return ii(s, t)
        ? ((s[t] = n), !0)
        : r !== re && de(r, t)
          ? ((r[t] = n), !0)
          : de(e.props, t) || (t[0] === "$" && t.slice(1) in e)
            ? !1
            : ((o[t] = n), !0);
    },
    has(
      {
        _: {
          data: e,
          setupState: t,
          accessCache: n,
          ctx: r,
          appContext: s,
          propsOptions: o,
        },
      },
      i,
    ) {
      let a;
      return (
        !!n[i] ||
        (e !== re && de(e, i)) ||
        ii(t, i) ||
        ((a = o[0]) && de(a, i)) ||
        de(r, i) ||
        de(jr, i) ||
        de(s.config.globalProperties, i)
      );
    },
    defineProperty(e, t, n) {
      return (
        n.get != null
          ? (e._.accessCache[t] = 0)
          : de(n, "value") && this.set(e, t, n.value, null),
        Reflect.defineProperty(e, t, n)
      );
    },
  },
  yg = ve({}, Li, {
    get(e, t) {
      if (t !== Symbol.unscopables) return Li.get(e, t, e);
    },
    has(e, t) {
      return t[0] !== "_" && !ba(t);
    },
  });
function vg() {
  return null;
}
function Eg() {
  return null;
}
function wg(e) {}
function Tg(e) {}
function Cg() {
  return null;
}
function Sg() {}
function Ag(e, t) {
  return null;
}
function Rg() {
  return kf().slots;
}
function Lg() {
  return kf().attrs;
}
function kf() {
  const e = Ve();
  return e.setupContext || (e.setupContext = cd(e));
}
function ns(e) {
  return Y(e) ? e.reduce((t, n) => ((t[n] = null), t), {}) : e;
}
function Pg(e, t) {
  const n = ns(e);
  for (const r in t) {
    if (r.startsWith("__skip")) continue;
    let s = n[r];
    (s
      ? Y(s) || Z(s)
        ? (s = n[r] = { type: s, default: t[r] })
        : (s.default = t[r])
      : s === null && (s = n[r] = { default: t[r] }),
      s && t[`__skip_${r}`] && (s.skipFactory = !0));
  }
  return n;
}
function kg(e, t) {
  return !e || !t ? e || t : Y(e) && Y(t) ? e.concat(t) : ve({}, ns(e), ns(t));
}
function Og(e, t) {
  const n = {};
  for (const r in e)
    t.includes(r) ||
      Object.defineProperty(n, r, { enumerable: !0, get: () => e[r] });
  return n;
}
function Ng(e) {
  const t = Ve();
  let n = e();
  return (
    xi(),
    yo(n) &&
      (n = n.catch((r) => {
        throw (Kn(t), r);
      })),
    [n, () => Kn(t)]
  );
}
let Pi = !0;
function Ig(e) {
  const t = Ha(e),
    n = e.proxy,
    r = e.ctx;
  ((Pi = !1), t.beforeCreate && Ml(t.beforeCreate, e, "bc"));
  const {
    data: s,
    computed: o,
    methods: i,
    watch: a,
    provide: l,
    inject: u,
    created: c,
    beforeMount: f,
    mounted: d,
    beforeUpdate: p,
    updated: y,
    activated: h,
    deactivated: S,
    beforeDestroy: g,
    beforeUnmount: E,
    destroyed: m,
    unmounted: b,
    render: C,
    renderTracked: L,
    renderTriggered: R,
    errorCaptured: j,
    serverPrefetch: M,
    expose: $,
    inheritAttrs: K,
    components: F,
    directives: X,
    filters: ne,
  } = t;
  if ((u && Mg(u, r, null), i))
    for (const ee in i) {
      const z = i[ee];
      Z(z) && (r[ee] = z.bind(n));
    }
  if (s) {
    const ee = s.call(n, n);
    ge(ee) && (e.data = an(ee));
  }
  if (((Pi = !0), o))
    for (const ee in o) {
      const z = o[ee],
        fe = Z(z) ? z.bind(n, n) : Z(z.get) ? z.get.bind(n, n) : ut,
        it = !Z(z) && Z(z.set) ? z.set.bind(n) : ut,
        Xe = Ce({ get: fe, set: it });
      Object.defineProperty(r, ee, {
        enumerable: !0,
        configurable: !0,
        get: () => Xe.value,
        set: ($e) => (Xe.value = $e),
      });
    }
  if (a) for (const ee in a) Of(a[ee], r, n, ee);
  if (l) {
    const ee = Z(l) ? l.call(n) : l;
    Reflect.ownKeys(ee).forEach((z) => {
      Qt(z, ee[z]);
    });
  }
  c && Ml(c, e, "c");
  function q(ee, z) {
    Y(z) ? z.forEach((fe) => ee(fe.bind(n))) : z && ee(z.bind(n));
  }
  if (
    (q(Cf, f),
    q(Sr, d),
    q(xa, p),
    q(Oo, y),
    q(Ia, h),
    q(Ma, S),
    q(Da, j),
    q(Rf, L),
    q(Af, R),
    q(Ar, E),
    q(gs, b),
    q(Sf, M),
    Y($))
  )
    if ($.length) {
      const ee = e.exposed || (e.exposed = {});
      $.forEach((z) => {
        Object.defineProperty(ee, z, {
          get: () => n[z],
          set: (fe) => (n[z] = fe),
        });
      });
    } else e.exposed || (e.exposed = {});
  (C && e.render === ut && (e.render = C),
    K != null && (e.inheritAttrs = K),
    F && (e.components = F),
    X && (e.directives = X),
    M && Na(e));
}
function Mg(e, t, n = ut) {
  Y(e) && (e = ki(e));
  for (const r in e) {
    const s = e[r];
    let o;
    (ge(s)
      ? "default" in s
        ? (o = Fe(s.from || r, s.default, !0))
        : (o = Fe(s.from || r))
      : (o = Fe(s)),
      Se(o)
        ? Object.defineProperty(t, r, {
            enumerable: !0,
            configurable: !0,
            get: () => o.value,
            set: (i) => (o.value = i),
          })
        : (t[r] = o));
  }
}
function Ml(e, t, n) {
  vt(Y(e) ? e.map((r) => r.bind(t.proxy)) : e.bind(t.proxy), t, n);
}
function Of(e, t, n, r) {
  let s = r.includes(".") ? Xf(n, r) : () => n[r];
  if (me(e)) {
    const o = t[e];
    Z(o) && rt(s, o);
  } else if (Z(e)) rt(s, e.bind(n));
  else if (ge(e))
    if (Y(e)) e.forEach((o) => Of(o, t, n, r));
    else {
      const o = Z(e.handler) ? e.handler.bind(n) : t[e.handler];
      Z(o) && rt(s, o, e);
    }
}
function Ha(e) {
  const t = e.type,
    { mixins: n, extends: r } = t,
    {
      mixins: s,
      optionsCache: o,
      config: { optionMergeStrategies: i },
    } = e.appContext,
    a = o.get(t);
  let l;
  return (
    a
      ? (l = a)
      : !s.length && !n && !r
        ? (l = t)
        : ((l = {}),
          s.length && s.forEach((u) => Js(l, u, i, !0)),
          Js(l, t, i)),
    ge(t) && o.set(t, l),
    l
  );
}
function Js(e, t, n, r = !1) {
  const { mixins: s, extends: o } = t;
  (o && Js(e, o, n, !0), s && s.forEach((i) => Js(e, i, n, !0)));
  for (const i in t)
    if (!(r && i === "expose")) {
      const a = xg[i] || (n && n[i]);
      e[i] = a ? a(e[i], t[i]) : t[i];
    }
  return e;
}
const xg = {
  data: xl,
  props: Dl,
  emits: Dl,
  methods: Dr,
  computed: Dr,
  beforeCreate: Je,
  created: Je,
  beforeMount: Je,
  mounted: Je,
  beforeUpdate: Je,
  updated: Je,
  beforeDestroy: Je,
  beforeUnmount: Je,
  destroyed: Je,
  unmounted: Je,
  activated: Je,
  deactivated: Je,
  errorCaptured: Je,
  serverPrefetch: Je,
  components: Dr,
  directives: Dr,
  watch: Fg,
  provide: xl,
  inject: Dg,
};
function xl(e, t) {
  return t
    ? e
      ? function () {
          return ve(
            Z(e) ? e.call(this, this) : e,
            Z(t) ? t.call(this, this) : t,
          );
        }
      : t
    : e;
}
function Dg(e, t) {
  return Dr(ki(e), ki(t));
}
function ki(e) {
  if (Y(e)) {
    const t = {};
    for (let n = 0; n < e.length; n++) t[e[n]] = e[n];
    return t;
  }
  return e;
}
function Je(e, t) {
  return e ? [...new Set([].concat(e, t))] : t;
}
function Dr(e, t) {
  return e ? ve(Object.create(null), e, t) : t;
}
function Dl(e, t) {
  return e
    ? Y(e) && Y(t)
      ? [...new Set([...e, ...t])]
      : ve(Object.create(null), ns(e), ns(t ?? {}))
    : t;
}
function Fg(e, t) {
  if (!e) return t;
  if (!t) return e;
  const n = ve(Object.create(null), e);
  for (const r in t) n[r] = Je(e[r], t[r]);
  return n;
}
function Nf() {
  return {
    app: null,
    config: {
      isNativeTag: Iu,
      performance: !1,
      globalProperties: {},
      optionMergeStrategies: {},
      errorHandler: void 0,
      warnHandler: void 0,
      compilerOptions: {},
    },
    mixins: [],
    components: {},
    directives: {},
    provides: Object.create(null),
    optionsCache: new WeakMap(),
    propsCache: new WeakMap(),
    emitsCache: new WeakMap(),
  };
}
let $g = 0;
function Ug(e, t) {
  return function (r, s = null) {
    (Z(r) || (r = ve({}, r)), s != null && !ge(s) && (s = null));
    const o = Nf(),
      i = new WeakSet(),
      a = [];
    let l = !1;
    const u = (o.app = {
      _uid: $g++,
      _component: r,
      _props: s,
      _container: null,
      _context: o,
      _instance: null,
      version: fd,
      get config() {
        return o.config;
      },
      set config(c) {},
      use(c, ...f) {
        return (
          i.has(c) ||
            (c && Z(c.install)
              ? (i.add(c), c.install(u, ...f))
              : Z(c) && (i.add(c), c(u, ...f))),
          u
        );
      },
      mixin(c) {
        return (o.mixins.includes(c) || o.mixins.push(c), u);
      },
      component(c, f) {
        return f ? ((o.components[c] = f), u) : o.components[c];
      },
      directive(c, f) {
        return f ? ((o.directives[c] = f), u) : o.directives[c];
      },
      mount(c, f, d) {
        if (!l) {
          const p = u._ceVNode || we(r, s);
          return (
            (p.appContext = o),
            d === !0 ? (d = "svg") : d === !1 && (d = void 0),
            f && t ? t(p, c) : e(p, c, d),
            (l = !0),
            (u._container = c),
            (c.__vue_app__ = u),
            _s(p.component)
          );
        }
      },
      onUnmount(c) {
        a.push(c);
      },
      unmount() {
        l &&
          (vt(a, u._instance, 16),
          e(null, u._container),
          delete u._container.__vue_app__);
      },
      provide(c, f) {
        return ((o.provides[c] = f), u);
      },
      runWithContext(c) {
        const f = jn;
        jn = u;
        try {
          return c();
        } finally {
          jn = f;
        }
      },
    });
    return u;
  };
}
let jn = null;
function Qt(e, t) {
  if (Me) {
    let n = Me.provides;
    const r = Me.parent && Me.parent.provides;
    (r === n && (n = Me.provides = Object.create(r)), (n[e] = t));
  }
}
function Fe(e, t, n = !1) {
  const r = Me || xe;
  if (r || jn) {
    let s = jn
      ? jn._context.provides
      : r
        ? r.parent == null || r.ce
          ? r.vnode.appContext && r.vnode.appContext.provides
          : r.parent.provides
        : void 0;
    if (s && e in s) return s[e];
    if (arguments.length > 1) return n && Z(t) ? t.call(r && r.proxy) : t;
  }
}
function No() {
  return !!(Me || xe || jn);
}
const If = {},
  Mf = () => Object.create(If),
  xf = (e) => Object.getPrototypeOf(e) === If;
function Hg(e, t, n, r = !1) {
  const s = {},
    o = Mf();
  ((e.propsDefaults = Object.create(null)), Df(e, t, s, o));
  for (const i in e.propsOptions[0]) i in s || (s[i] = void 0);
  (n ? (e.props = r ? s : St(s)) : e.type.props ? (e.props = s) : (e.props = o),
    (e.attrs = o));
}
function jg(e, t, n, r) {
  const {
      props: s,
      attrs: o,
      vnode: { patchFlag: i },
    } = e,
    a = le(s),
    [l] = e.propsOptions;
  let u = !1;
  if ((r || i > 0) && !(i & 16)) {
    if (i & 8) {
      const c = e.vnode.dynamicProps;
      for (let f = 0; f < c.length; f++) {
        let d = c[f];
        if (Io(e.emitsOptions, d)) continue;
        const p = t[d];
        if (l)
          if (de(o, d)) p !== o[d] && ((o[d] = p), (u = !0));
          else {
            const y = He(d);
            s[y] = Oi(l, a, y, p, e, !1);
          }
        else p !== o[d] && ((o[d] = p), (u = !0));
      }
    }
  } else {
    Df(e, t, s, o) && (u = !0);
    let c;
    for (const f in a)
      (!t || (!de(t, f) && ((c = qe(f)) === f || !de(t, c)))) &&
        (l
          ? n &&
            (n[f] !== void 0 || n[c] !== void 0) &&
            (s[f] = Oi(l, a, f, void 0, e, !0))
          : delete s[f]);
    if (o !== a)
      for (const f in o) (!t || !de(t, f)) && (delete o[f], (u = !0));
  }
  u && qt(e.attrs, "set", "");
}
function Df(e, t, n, r) {
  const [s, o] = e.propsOptions;
  let i = !1,
    a;
  if (t)
    for (let l in t) {
      if ($n(l)) continue;
      const u = t[l];
      let c;
      s && de(s, (c = He(l)))
        ? !o || !o.includes(c)
          ? (n[c] = u)
          : ((a || (a = {}))[c] = u)
        : Io(e.emitsOptions, l) ||
          ((!(l in r) || u !== r[l]) && ((r[l] = u), (i = !0)));
    }
  if (o) {
    const l = le(n),
      u = a || re;
    for (let c = 0; c < o.length; c++) {
      const f = o[c];
      n[f] = Oi(s, l, f, u[f], e, !de(u, f));
    }
  }
  return i;
}
function Oi(e, t, n, r, s, o) {
  const i = e[n];
  if (i != null) {
    const a = de(i, "default");
    if (a && r === void 0) {
      const l = i.default;
      if (i.type !== Function && !i.skipFactory && Z(l)) {
        const { propsDefaults: u } = s;
        if (n in u) r = u[n];
        else {
          const c = Kn(s);
          ((r = u[n] = l.call(null, t)), c());
        }
      } else r = l;
      s.ce && s.ce._setProp(n, r);
    }
    i[0] &&
      (o && !a ? (r = !1) : i[1] && (r === "" || r === qe(n)) && (r = !0));
  }
  return r;
}
const Vg = new WeakMap();
function Ff(e, t, n = !1) {
  const r = n ? Vg : t.propsCache,
    s = r.get(e);
  if (s) return s;
  const o = e.props,
    i = {},
    a = [];
  let l = !1;
  if (!Z(e)) {
    const c = (f) => {
      l = !0;
      const [d, p] = Ff(f, t, !0);
      (ve(i, d), p && a.push(...p));
    };
    (!n && t.mixins.length && t.mixins.forEach(c),
      e.extends && c(e.extends),
      e.mixins && e.mixins.forEach(c));
  }
  if (!o && !l) return (ge(e) && r.set(e, Dn), Dn);
  if (Y(o))
    for (let c = 0; c < o.length; c++) {
      const f = He(o[c]);
      Fl(f) && (i[f] = re);
    }
  else if (o)
    for (const c in o) {
      const f = He(c);
      if (Fl(f)) {
        const d = o[c],
          p = (i[f] = Y(d) || Z(d) ? { type: d } : ve({}, d)),
          y = p.type;
        let h = !1,
          S = !0;
        if (Y(y))
          for (let g = 0; g < y.length; ++g) {
            const E = y[g],
              m = Z(E) && E.name;
            if (m === "Boolean") {
              h = !0;
              break;
            } else m === "String" && (S = !1);
          }
        else h = Z(y) && y.name === "Boolean";
        ((p[0] = h), (p[1] = S), (h || de(p, "default")) && a.push(f));
      }
    }
  const u = [i, a];
  return (ge(e) && r.set(e, u), u);
}
function Fl(e) {
  return e[0] !== "$" && !$n(e);
}
const ja = (e) => e[0] === "_" || e === "$stable",
  Va = (e) => (Y(e) ? e.map(nt) : [nt(e)]),
  Bg = (e, t, n) => {
    if (t._n) return t;
    const r = hs((...s) => Va(t(...s)), n);
    return ((r._c = !1), r);
  },
  $f = (e, t, n) => {
    const r = e._ctx;
    for (const s in e) {
      if (ja(s)) continue;
      const o = e[s];
      if (Z(o)) t[s] = Bg(s, o, r);
      else if (o != null) {
        const i = Va(o);
        t[s] = () => i;
      }
    }
  },
  Uf = (e, t) => {
    const n = Va(t);
    e.slots.default = () => n;
  },
  Hf = (e, t, n) => {
    for (const r in t) (n || !ja(r)) && (e[r] = t[r]);
  },
  Wg = (e, t, n) => {
    const r = (e.slots = Mf());
    if (e.vnode.shapeFlag & 32) {
      const s = t.__;
      s && Ws(r, "__", s, !0);
      const o = t._;
      o ? (Hf(r, t, n), n && Ws(r, "_", o, !0)) : $f(t, r);
    } else t && Uf(e, t);
  },
  Kg = (e, t, n) => {
    const { vnode: r, slots: s } = e;
    let o = !0,
      i = re;
    if (r.shapeFlag & 32) {
      const a = t._;
      (a
        ? n && a === 1
          ? (o = !1)
          : Hf(s, t, n)
        : ((o = !t.$stable), $f(t, s)),
        (i = t));
    } else t && (Uf(e, t), (i = { default: 1 }));
    if (o) for (const a in s) !ja(a) && i[a] == null && delete s[a];
  },
  Ie = ed;
function jf(e) {
  return Bf(e);
}
function Vf(e) {
  return Bf(e, eg);
}
function Bf(e, t) {
  const n = fs();
  n.__VUE__ = !0;
  const {
      insert: r,
      remove: s,
      patchProp: o,
      createElement: i,
      createText: a,
      createComment: l,
      setText: u,
      setElementText: c,
      parentNode: f,
      nextSibling: d,
      setScopeId: p = ut,
      insertStaticContent: y,
    } = e,
    h = (
      v,
      T,
      k,
      U = null,
      I = null,
      _ = null,
      w = void 0,
      P = null,
      N = !!T.dynamicChildren,
    ) => {
      if (v === T) return;
      (v && !Ct(v, T) && ((U = x(v)), $e(v, I, _, !0), (v = null)),
        T.patchFlag === -2 && ((N = !1), (T.dynamicChildren = null)));
      const { type: D, ref: H, shapeFlag: A } = T;
      switch (D) {
        case Zt:
          S(v, T, k, U);
          break;
        case Oe:
          g(v, T, k, U);
          break;
        case Vn:
          v == null && E(T, k, U, w);
          break;
        case ke:
          F(v, T, k, U, I, _, w, P, N);
          break;
        default:
          A & 1
            ? C(v, T, k, U, I, _, w, P, N)
            : A & 6
              ? X(v, T, k, U, I, _, w, P, N)
              : (A & 64 || A & 128) && D.process(v, T, k, U, I, _, w, P, N, J);
      }
      H != null && I
        ? ir(H, v && v.ref, _, T || v, !T)
        : H == null && v && v.ref != null && ir(v.ref, null, _, v, !0);
    },
    S = (v, T, k, U) => {
      if (v == null) r((T.el = a(T.children)), k, U);
      else {
        const I = (T.el = v.el);
        T.children !== v.children && u(I, T.children);
      }
    },
    g = (v, T, k, U) => {
      v == null ? r((T.el = l(T.children || "")), k, U) : (T.el = v.el);
    },
    E = (v, T, k, U) => {
      [v.el, v.anchor] = y(v.children, T, k, U, v.el, v.anchor);
    },
    m = ({ el: v, anchor: T }, k, U) => {
      let I;
      for (; v && v !== T; ) ((I = d(v)), r(v, k, U), (v = I));
      r(T, k, U);
    },
    b = ({ el: v, anchor: T }) => {
      let k;
      for (; v && v !== T; ) ((k = d(v)), s(v), (v = k));
      s(T);
    },
    C = (v, T, k, U, I, _, w, P, N) => {
      (T.type === "svg" ? (w = "svg") : T.type === "math" && (w = "mathml"),
        v == null ? L(T, k, U, I, _, w, P, N) : M(v, T, I, _, w, P, N));
    },
    L = (v, T, k, U, I, _, w, P) => {
      let N, D;
      const { props: H, shapeFlag: A, transition: O, dirs: W } = v;
      if (
        ((N = v.el = i(v.type, _, H && H.is, H)),
        A & 8
          ? c(N, v.children)
          : A & 16 && j(v.children, N, null, U, I, ai(v, _), w, P),
        W && $t(v, null, U, "created"),
        R(N, v, v.scopeId, w, U),
        H)
      ) {
        for (const ie in H)
          ie !== "value" && !$n(ie) && o(N, ie, null, H[ie], _, U);
        ("value" in H && o(N, "value", null, H.value, _),
          (D = H.onVnodeBeforeMount) && tt(D, U, v));
      }
      W && $t(v, null, U, "beforeMount");
      const Q = Wf(I, O);
      (Q && O.beforeEnter(N),
        r(N, T, k),
        ((D = H && H.onVnodeMounted) || Q || W) &&
          Ie(() => {
            (D && tt(D, U, v), Q && O.enter(N), W && $t(v, null, U, "mounted"));
          }, I));
    },
    R = (v, T, k, U, I) => {
      if ((k && p(v, k), U)) for (let _ = 0; _ < U.length; _++) p(v, U[_]);
      if (I) {
        let _ = I.subTree;
        if (
          T === _ ||
          (Zs(_.type) && (_.ssContent === T || _.ssFallback === T))
        ) {
          const w = I.vnode;
          R(v, w, w.scopeId, w.slotScopeIds, I.parent);
        }
      }
    },
    j = (v, T, k, U, I, _, w, P, N = 0) => {
      for (let D = N; D < v.length; D++) {
        const H = (v[D] = P ? bn(v[D]) : nt(v[D]));
        h(null, H, T, k, U, I, _, w, P);
      }
    },
    M = (v, T, k, U, I, _, w) => {
      const P = (T.el = v.el);
      let { patchFlag: N, dynamicChildren: D, dirs: H } = T;
      N |= v.patchFlag & 16;
      const A = v.props || re,
        O = T.props || re;
      let W;
      if (
        (k && On(k, !1),
        (W = O.onVnodeBeforeUpdate) && tt(W, k, T, v),
        H && $t(T, v, k, "beforeUpdate"),
        k && On(k, !0),
        ((A.innerHTML && O.innerHTML == null) ||
          (A.textContent && O.textContent == null)) &&
          c(P, ""),
        D
          ? $(v.dynamicChildren, D, P, k, U, ai(T, I), _)
          : w || z(v, T, P, null, k, U, ai(T, I), _, !1),
        N > 0)
      ) {
        if (N & 16) K(P, A, O, k, I);
        else if (
          (N & 2 && A.class !== O.class && o(P, "class", null, O.class, I),
          N & 4 && o(P, "style", A.style, O.style, I),
          N & 8)
        ) {
          const Q = T.dynamicProps;
          for (let ie = 0; ie < Q.length; ie++) {
            const ae = Q[ie],
              Pe = A[ae],
              Ue = O[ae];
            (Ue !== Pe || ae === "value") && o(P, ae, Pe, Ue, I, k);
          }
        }
        N & 1 && v.children !== T.children && c(P, T.children);
      } else !w && D == null && K(P, A, O, k, I);
      ((W = O.onVnodeUpdated) || H) &&
        Ie(() => {
          (W && tt(W, k, T, v), H && $t(T, v, k, "updated"));
        }, U);
    },
    $ = (v, T, k, U, I, _, w) => {
      for (let P = 0; P < T.length; P++) {
        const N = v[P],
          D = T[P],
          H =
            N.el && (N.type === ke || !Ct(N, D) || N.shapeFlag & 198)
              ? f(N.el)
              : k;
        h(N, D, H, null, U, I, _, w, !0);
      }
    },
    K = (v, T, k, U, I) => {
      if (T !== k) {
        if (T !== re)
          for (const _ in T) !$n(_) && !(_ in k) && o(v, _, T[_], null, I, U);
        for (const _ in k) {
          if ($n(_)) continue;
          const w = k[_],
            P = T[_];
          w !== P && _ !== "value" && o(v, _, P, w, I, U);
        }
        "value" in k && o(v, "value", T.value, k.value, I);
      }
    },
    F = (v, T, k, U, I, _, w, P, N) => {
      const D = (T.el = v ? v.el : a("")),
        H = (T.anchor = v ? v.anchor : a(""));
      let { patchFlag: A, dynamicChildren: O, slotScopeIds: W } = T;
      (W && (P = P ? P.concat(W) : W),
        v == null
          ? (r(D, k, U), r(H, k, U), j(T.children || [], k, H, I, _, w, P, N))
          : A > 0 && A & 64 && O && v.dynamicChildren
            ? ($(v.dynamicChildren, O, k, I, _, w, P),
              (T.key != null || (I && T === I.subTree)) && Ba(v, T, !0))
            : z(v, T, k, H, I, _, w, P, N));
    },
    X = (v, T, k, U, I, _, w, P, N) => {
      ((T.slotScopeIds = P),
        v == null
          ? T.shapeFlag & 512
            ? I.ctx.activate(T, k, U, w, N)
            : ne(T, k, U, I, _, w, N)
          : se(v, T, N));
    },
    ne = (v, T, k, U, I, _, w) => {
      const P = (v.component = od(v, U, I));
      if ((ms(v) && (P.ctx.renderer = J), ad(P, !1, w), P.asyncDep)) {
        if ((I && I.registerDep(P, q, w), !v.el)) {
          const N = (P.subTree = we(Oe));
          g(null, N, T, k);
        }
      } else q(P, v, T, k, I, _, w);
    },
    se = (v, T, k) => {
      const U = (T.component = v.component);
      if (eb(v, T, k))
        if (U.asyncDep && !U.asyncResolved) {
          ee(U, T, k);
          return;
        } else ((U.next = T), U.update());
      else ((T.el = v.el), (U.vnode = T));
    },
    q = (v, T, k, U, I, _, w) => {
      const P = () => {
        if (v.isMounted) {
          let { next: A, bu: O, u: W, parent: Q, vnode: ie } = v;
          {
            const at = Kf(v);
            if (at) {
              (A && ((A.el = ie.el), ee(v, A, w)),
                at.asyncDep.then(() => {
                  v.isUnmounted || P();
                }));
              return;
            }
          }
          let ae = A,
            Pe;
          (On(v, !1),
            A ? ((A.el = ie.el), ee(v, A, w)) : (A = ie),
            O && Un(O),
            (Pe = A.props && A.props.onVnodeBeforeUpdate) && tt(Pe, Q, A, ie),
            On(v, !0));
          const Ue = Us(v),
            pt = v.subTree;
          ((v.subTree = Ue),
            h(pt, Ue, f(pt.el), x(pt), v, I, _),
            (A.el = Ue.el),
            ae === null && Mo(v, Ue.el),
            W && Ie(W, I),
            (Pe = A.props && A.props.onVnodeUpdated) &&
              Ie(() => tt(Pe, Q, A, ie), I));
        } else {
          let A;
          const { el: O, props: W } = T,
            { bm: Q, m: ie, parent: ae, root: Pe, type: Ue } = v,
            pt = Tn(T);
          if (
            (On(v, !1),
            Q && Un(Q),
            !pt && (A = W && W.onVnodeBeforeMount) && tt(A, ae, T),
            On(v, !0),
            O && _e)
          ) {
            const at = () => {
              ((v.subTree = Us(v)), _e(O, v.subTree, v, I, null));
            };
            pt && Ue.__asyncHydrate ? Ue.__asyncHydrate(O, v, at) : at();
          } else {
            Pe.ce &&
              Pe.ce._def.shadowRoot !== !1 &&
              Pe.ce._injectChildStyle(Ue);
            const at = (v.subTree = Us(v));
            (h(null, at, k, U, v, I, _), (T.el = at.el));
          }
          if ((ie && Ie(ie, I), !pt && (A = W && W.onVnodeMounted))) {
            const at = T;
            Ie(() => tt(A, ae, at), I);
          }
          ((T.shapeFlag & 256 ||
            (ae && Tn(ae.vnode) && ae.vnode.shapeFlag & 256)) &&
            v.a &&
            Ie(v.a, I),
            (v.isMounted = !0),
            (T = k = U = null));
        }
      };
      v.scope.on();
      const N = (v.effect = new Xr(P));
      v.scope.off();
      const D = (v.update = N.run.bind(N)),
        H = (v.job = N.runIfDirty.bind(N));
      ((H.i = v), (H.id = v.uid), (N.scheduler = () => Pa(H)), On(v, !0), D());
    },
    ee = (v, T, k) => {
      T.component = v;
      const U = v.vnode.props;
      ((v.vnode = T),
        (v.next = null),
        jg(v, T.props, U, k),
        Kg(v, T.children, k),
        tn(),
        Al(v),
        nn());
    },
    z = (v, T, k, U, I, _, w, P, N = !1) => {
      const D = v && v.children,
        H = v ? v.shapeFlag : 0,
        A = T.children,
        { patchFlag: O, shapeFlag: W } = T;
      if (O > 0) {
        if (O & 128) {
          it(D, A, k, U, I, _, w, P, N);
          return;
        } else if (O & 256) {
          fe(D, A, k, U, I, _, w, P, N);
          return;
        }
      }
      W & 8
        ? (H & 16 && Be(D, I, _), A !== D && c(k, A))
        : H & 16
          ? W & 16
            ? it(D, A, k, U, I, _, w, P, N)
            : Be(D, I, _, !0)
          : (H & 8 && c(k, ""), W & 16 && j(A, k, U, I, _, w, P, N));
    },
    fe = (v, T, k, U, I, _, w, P, N) => {
      ((v = v || Dn), (T = T || Dn));
      const D = v.length,
        H = T.length,
        A = Math.min(D, H);
      let O;
      for (O = 0; O < A; O++) {
        const W = (T[O] = N ? bn(T[O]) : nt(T[O]));
        h(v[O], W, k, null, I, _, w, P, N);
      }
      D > H ? Be(v, I, _, !0, !1, A) : j(T, k, U, I, _, w, P, N, A);
    },
    it = (v, T, k, U, I, _, w, P, N) => {
      let D = 0;
      const H = T.length;
      let A = v.length - 1,
        O = H - 1;
      for (; D <= A && D <= O; ) {
        const W = v[D],
          Q = (T[D] = N ? bn(T[D]) : nt(T[D]));
        if (Ct(W, Q)) h(W, Q, k, null, I, _, w, P, N);
        else break;
        D++;
      }
      for (; D <= A && D <= O; ) {
        const W = v[A],
          Q = (T[O] = N ? bn(T[O]) : nt(T[O]));
        if (Ct(W, Q)) h(W, Q, k, null, I, _, w, P, N);
        else break;
        (A--, O--);
      }
      if (D > A) {
        if (D <= O) {
          const W = O + 1,
            Q = W < H ? T[W].el : U;
          for (; D <= O; )
            (h(null, (T[D] = N ? bn(T[D]) : nt(T[D])), k, Q, I, _, w, P, N),
              D++);
        }
      } else if (D > O) for (; D <= A; ) ($e(v[D], I, _, !0), D++);
      else {
        const W = D,
          Q = D,
          ie = new Map();
        for (D = Q; D <= O; D++) {
          const lt = (T[D] = N ? bn(T[D]) : nt(T[D]));
          lt.key != null && ie.set(lt.key, D);
        }
        let ae,
          Pe = 0;
        const Ue = O - Q + 1;
        let pt = !1,
          at = 0;
        const Rr = new Array(Ue);
        for (D = 0; D < Ue; D++) Rr[D] = 0;
        for (D = W; D <= A; D++) {
          const lt = v[D];
          if (Pe >= Ue) {
            $e(lt, I, _, !0);
            continue;
          }
          let Nt;
          if (lt.key != null) Nt = ie.get(lt.key);
          else
            for (ae = Q; ae <= O; ae++)
              if (Rr[ae - Q] === 0 && Ct(lt, T[ae])) {
                Nt = ae;
                break;
              }
          Nt === void 0
            ? $e(lt, I, _, !0)
            : ((Rr[Nt - Q] = D + 1),
              Nt >= at ? (at = Nt) : (pt = !0),
              h(lt, T[Nt], k, null, I, _, w, P, N),
              Pe++);
        }
        const _l = pt ? Gg(Rr) : Dn;
        for (ae = _l.length - 1, D = Ue - 1; D >= 0; D--) {
          const lt = Q + D,
            Nt = T[lt],
            yl = lt + 1 < H ? T[lt + 1].el : U;
          Rr[D] === 0
            ? h(null, Nt, k, yl, I, _, w, P, N)
            : pt && (ae < 0 || D !== _l[ae] ? Xe(Nt, k, yl, 2) : ae--);
        }
      }
    },
    Xe = (v, T, k, U, I = null) => {
      const { el: _, type: w, transition: P, children: N, shapeFlag: D } = v;
      if (D & 6) {
        Xe(v.component.subTree, T, k, U);
        return;
      }
      if (D & 128) {
        v.suspense.move(T, k, U);
        return;
      }
      if (D & 64) {
        w.move(v, T, k, J);
        return;
      }
      if (w === ke) {
        r(_, T, k);
        for (let A = 0; A < N.length; A++) Xe(N[A], T, k, U);
        r(v.anchor, T, k);
        return;
      }
      if (w === Vn) {
        m(v, T, k);
        return;
      }
      if (U !== 2 && D & 1 && P)
        if (U === 0) (P.beforeEnter(_), r(_, T, k), Ie(() => P.enter(_), I));
        else {
          const { leave: A, delayLeave: O, afterLeave: W } = P,
            Q = () => {
              v.ctx.isUnmounted ? s(_) : r(_, T, k);
            },
            ie = () => {
              A(_, () => {
                (Q(), W && W());
              });
            };
          O ? O(_, Q, ie) : ie();
        }
      else r(_, T, k);
    },
    $e = (v, T, k, U = !1, I = !1) => {
      const {
        type: _,
        props: w,
        ref: P,
        children: N,
        dynamicChildren: D,
        shapeFlag: H,
        patchFlag: A,
        dirs: O,
        cacheIndex: W,
      } = v;
      if (
        (A === -2 && (I = !1),
        P != null && (tn(), ir(P, null, k, v, !0), nn()),
        W != null && (T.renderCache[W] = void 0),
        H & 256)
      ) {
        T.ctx.deactivate(v);
        return;
      }
      const Q = H & 1 && O,
        ie = !Tn(v);
      let ae;
      if ((ie && (ae = w && w.onVnodeBeforeUnmount) && tt(ae, T, v), H & 6))
        kn(v.component, k, U);
      else {
        if (H & 128) {
          v.suspense.unmount(k, U);
          return;
        }
        (Q && $t(v, null, T, "beforeUnmount"),
          H & 64
            ? v.type.remove(v, T, k, J, U)
            : D && !D.hasOnce && (_ !== ke || (A > 0 && A & 64))
              ? Be(D, T, k, !1, !0)
              : ((_ === ke && A & 384) || (!I && H & 16)) && Be(N, T, k),
          U && kt(v));
      }
      ((ie && (ae = w && w.onVnodeUnmounted)) || Q) &&
        Ie(() => {
          (ae && tt(ae, T, v), Q && $t(v, null, T, "unmounted"));
        }, k);
    },
    kt = (v) => {
      const { type: T, el: k, anchor: U, transition: I } = v;
      if (T === ke) {
        Ot(k, U);
        return;
      }
      if (T === Vn) {
        b(v);
        return;
      }
      const _ = () => {
        (s(k), I && !I.persisted && I.afterLeave && I.afterLeave());
      };
      if (v.shapeFlag & 1 && I && !I.persisted) {
        const { leave: w, delayLeave: P } = I,
          N = () => w(k, _);
        P ? P(v.el, _, N) : N();
      } else _();
    },
    Ot = (v, T) => {
      let k;
      for (; v !== T; ) ((k = d(v)), s(v), (v = k));
      s(T);
    },
    kn = (v, T, k) => {
      const {
        bum: U,
        scope: I,
        job: _,
        subTree: w,
        um: P,
        m: N,
        a: D,
        parent: H,
        slots: { __: A },
      } = v;
      (Qs(N),
        Qs(D),
        U && Un(U),
        H &&
          Y(A) &&
          A.forEach((O) => {
            H.renderCache[O] = void 0;
          }),
        I.stop(),
        _ && ((_.flags |= 8), $e(w, v, T, k)),
        P && Ie(P, T),
        Ie(() => {
          v.isUnmounted = !0;
        }, T),
        T &&
          T.pendingBranch &&
          !T.isUnmounted &&
          v.asyncDep &&
          !v.asyncResolved &&
          v.suspenseId === T.pendingId &&
          (T.deps--, T.deps === 0 && T.resolve()));
    },
    Be = (v, T, k, U = !1, I = !1, _ = 0) => {
      for (let w = _; w < v.length; w++) $e(v[w], T, k, U, I);
    },
    x = (v) => {
      if (v.shapeFlag & 6) return x(v.component.subTree);
      if (v.shapeFlag & 128) return v.suspense.next();
      const T = d(v.anchor || v.el),
        k = T && T[hf];
      return k ? d(k) : T;
    };
  let G = !1;
  const B = (v, T, k) => {
      (v == null
        ? T._vnode && $e(T._vnode, null, null, !0)
        : h(T._vnode || null, v, T, null, null, null, k),
        (T._vnode = v),
        G || ((G = !0), Al(), Xs(), (G = !1)));
    },
    J = {
      p: h,
      um: $e,
      m: Xe,
      r: kt,
      mt: ne,
      mc: j,
      pc: z,
      pbc: $,
      n: x,
      o: e,
    };
  let oe, _e;
  return (
    t && ([oe, _e] = t(J)),
    { render: B, hydrate: oe, createApp: Ug(B, oe) }
  );
}
function ai({ type: e, props: t }, n) {
  return (n === "svg" && e === "foreignObject") ||
    (n === "mathml" &&
      e === "annotation-xml" &&
      t &&
      t.encoding &&
      t.encoding.includes("html"))
    ? void 0
    : n;
}
function On({ effect: e, job: t }, n) {
  n ? ((e.flags |= 32), (t.flags |= 4)) : ((e.flags &= -33), (t.flags &= -5));
}
function Wf(e, t) {
  return (!e || (e && !e.pendingBranch)) && t && !t.persisted;
}
function Ba(e, t, n = !1) {
  const r = e.children,
    s = t.children;
  if (Y(r) && Y(s))
    for (let o = 0; o < r.length; o++) {
      const i = r[o];
      let a = s[o];
      (a.shapeFlag & 1 &&
        !a.dynamicChildren &&
        ((a.patchFlag <= 0 || a.patchFlag === 32) &&
          ((a = s[o] = bn(s[o])), (a.el = i.el)),
        !n && a.patchFlag !== -2 && Ba(i, a)),
        a.type === Zt && (a.el = i.el),
        a.type === Oe && !a.el && (a.el = i.el));
    }
}
function Gg(e) {
  const t = e.slice(),
    n = [0];
  let r, s, o, i, a;
  const l = e.length;
  for (r = 0; r < l; r++) {
    const u = e[r];
    if (u !== 0) {
      if (((s = n[n.length - 1]), e[s] < u)) {
        ((t[r] = s), n.push(r));
        continue;
      }
      for (o = 0, i = n.length - 1; o < i; )
        ((a = (o + i) >> 1), e[n[a]] < u ? (o = a + 1) : (i = a));
      u < e[n[o]] && (o > 0 && (t[r] = n[o - 1]), (n[o] = r));
    }
  }
  for (o = n.length, i = n[o - 1]; o-- > 0; ) ((n[o] = i), (i = t[i]));
  return n;
}
function Kf(e) {
  const t = e.subTree.component;
  if (t) return t.asyncDep && !t.asyncResolved ? t : Kf(t);
}
function Qs(e) {
  if (e) for (let t = 0; t < e.length; t++) e[t].flags |= 8;
}
const Gf = Symbol.for("v-scx"),
  qf = () => Fe(Gf);
function Yf(e, t) {
  return bs(e, null, t);
}
function qg(e, t) {
  return bs(e, null, { flush: "post" });
}
function zf(e, t) {
  return bs(e, null, { flush: "sync" });
}
function rt(e, t, n) {
  return bs(e, t, n);
}
function bs(e, t, n = re) {
  const { immediate: r, deep: s, flush: o, once: i } = n,
    a = ve({}, n),
    l = (t && r) || (!t && o !== "post");
  let u;
  if (ur) {
    if (o === "sync") {
      const p = qf();
      u = p.__watcherHandles || (p.__watcherHandles = []);
    } else if (!l) {
      const p = () => {};
      return ((p.stop = ut), (p.resume = ut), (p.pause = ut), p);
    }
  }
  const c = Me;
  a.call = (p, y, h) => vt(p, c, y, h);
  let f = !1;
  (o === "post"
    ? (a.scheduler = (p) => {
        Ie(p, c && c.suspense);
      })
    : o !== "sync" &&
      ((f = !0),
      (a.scheduler = (p, y) => {
        y ? p() : Pa(p);
      })),
    (a.augmentJob = (p) => {
      (t && (p.flags |= 4),
        f && ((p.flags |= 2), c && ((p.id = c.uid), (p.i = c))));
    }));
  const d = xm(e, t, a);
  return (ur && (u ? u.push(d) : l && d()), d);
}
function Yg(e, t, n) {
  const r = this.proxy,
    s = me(e) ? (e.includes(".") ? Xf(r, e) : () => r[e]) : e.bind(r, r);
  let o;
  Z(t) ? (o = t) : ((o = t.handler), (n = t));
  const i = Kn(this),
    a = bs(s, o.bind(r), n);
  return (i(), a);
}
function Xf(e, t) {
  const n = t.split(".");
  return () => {
    let r = e;
    for (let s = 0; s < n.length && r; s++) r = r[n[s]];
    return r;
  };
}
function zg(e, t, n = re) {
  const r = Ve(),
    s = He(t),
    o = qe(t),
    i = Jf(e, s),
    a = Ra((l, u) => {
      let c,
        f = re,
        d;
      return (
        zf(() => {
          const p = e[s];
          Ke(c, p) && ((c = p), u());
        }),
        {
          get() {
            return (l(), n.get ? n.get(c) : c);
          },
          set(p) {
            const y = n.set ? n.set(p) : p;
            if (!Ke(y, c) && !(f !== re && Ke(p, f))) return;
            const h = r.vnode.props;
            ((h &&
              (t in h || s in h || o in h) &&
              (`onUpdate:${t}` in h ||
                `onUpdate:${s}` in h ||
                `onUpdate:${o}` in h)) ||
              ((c = p), u()),
              r.emit(`update:${t}`, y),
              Ke(p, y) && Ke(p, f) && !Ke(y, d) && u(),
              (f = p),
              (d = y));
          },
        }
      );
    });
  return (
    (a[Symbol.iterator] = () => {
      let l = 0;
      return {
        next() {
          return l < 2 ? { value: l++ ? i || re : a, done: !1 } : { done: !0 };
        },
      };
    }),
    a
  );
}
const Jf = (e, t) =>
  t === "modelValue" || t === "model-value"
    ? e.modelModifiers
    : e[`${t}Modifiers`] || e[`${He(t)}Modifiers`] || e[`${qe(t)}Modifiers`];
function Xg(e, t, ...n) {
  if (e.isUnmounted) return;
  const r = e.vnode.props || re;
  let s = n;
  const o = t.startsWith("update:"),
    i = o && Jf(r, t.slice(7));
  i &&
    (i.trim && (s = n.map((c) => (me(c) ? c.trim() : c))),
    i.number && (s = n.map(Yr)));
  let a,
    l = r[(a = sr(t))] || r[(a = sr(He(t)))];
  (!l && o && (l = r[(a = sr(qe(t)))]), l && vt(l, e, 6, s));
  const u = r[a + "Once"];
  if (u) {
    if (!e.emitted) e.emitted = {};
    else if (e.emitted[a]) return;
    ((e.emitted[a] = !0), vt(u, e, 6, s));
  }
}
function Qf(e, t, n = !1) {
  const r = t.emitsCache,
    s = r.get(e);
  if (s !== void 0) return s;
  const o = e.emits;
  let i = {},
    a = !1;
  if (!Z(e)) {
    const l = (u) => {
      const c = Qf(u, t, !0);
      c && ((a = !0), ve(i, c));
    };
    (!n && t.mixins.length && t.mixins.forEach(l),
      e.extends && l(e.extends),
      e.mixins && e.mixins.forEach(l));
  }
  return !o && !a
    ? (ge(e) && r.set(e, null), null)
    : (Y(o) ? o.forEach((l) => (i[l] = null)) : ve(i, o),
      ge(e) && r.set(e, i),
      i);
}
function Io(e, t) {
  return !e || !vr(t)
    ? !1
    : ((t = t.slice(2).replace(/Once$/, "")),
      de(e, t[0].toLowerCase() + t.slice(1)) || de(e, qe(t)) || de(e, t));
}
function Us(e) {
  const {
      type: t,
      vnode: n,
      proxy: r,
      withProxy: s,
      propsOptions: [o],
      slots: i,
      attrs: a,
      emit: l,
      render: u,
      renderCache: c,
      props: f,
      data: d,
      setupState: p,
      ctx: y,
      inheritAttrs: h,
    } = e,
    S = ts(e);
  let g, E;
  try {
    if (n.shapeFlag & 4) {
      const b = s || r,
        C = b;
      ((g = nt(u.call(C, b, c, f, p, d, y))), (E = a));
    } else {
      const b = t;
      ((g = nt(
        b.length > 1 ? b(f, { attrs: a, slots: i, emit: l }) : b(f, null),
      )),
        (E = t.props ? a : Qg(a)));
    }
  } catch (b) {
    ((Vr.length = 0), zn(b, e, 1), (g = we(Oe)));
  }
  let m = g;
  if (E && h !== !1) {
    const b = Object.keys(E),
      { shapeFlag: C } = m;
    b.length &&
      C & 7 &&
      (o && b.some(bo) && (E = Zg(E, o)), (m = Vt(m, E, !1, !0)));
  }
  return (
    n.dirs &&
      ((m = Vt(m, null, !1, !0)),
      (m.dirs = m.dirs ? m.dirs.concat(n.dirs) : n.dirs)),
    n.transition && sn(m, n.transition),
    (g = m),
    ts(S),
    g
  );
}
function Jg(e, t = !0) {
  let n;
  for (let r = 0; r < e.length; r++) {
    const s = e[r];
    if (on(s)) {
      if (s.type !== Oe || s.children === "v-if") {
        if (n) return;
        n = s;
      }
    } else return;
  }
  return n;
}
const Qg = (e) => {
    let t;
    for (const n in e)
      (n === "class" || n === "style" || vr(n)) && ((t || (t = {}))[n] = e[n]);
    return t;
  },
  Zg = (e, t) => {
    const n = {};
    for (const r in e) (!bo(r) || !(r.slice(9) in t)) && (n[r] = e[r]);
    return n;
  };
function eb(e, t, n) {
  const { props: r, children: s, component: o } = e,
    { props: i, children: a, patchFlag: l } = t,
    u = o.emitsOptions;
  if (t.dirs || t.transition) return !0;
  if (n && l >= 0) {
    if (l & 1024) return !0;
    if (l & 16) return r ? $l(r, i, u) : !!i;
    if (l & 8) {
      const c = t.dynamicProps;
      for (let f = 0; f < c.length; f++) {
        const d = c[f];
        if (i[d] !== r[d] && !Io(u, d)) return !0;
      }
    }
  } else
    return (s || a) && (!a || !a.$stable)
      ? !0
      : r === i
        ? !1
        : r
          ? i
            ? $l(r, i, u)
            : !0
          : !!i;
  return !1;
}
function $l(e, t, n) {
  const r = Object.keys(t);
  if (r.length !== Object.keys(e).length) return !0;
  for (let s = 0; s < r.length; s++) {
    const o = r[s];
    if (t[o] !== e[o] && !Io(n, o)) return !0;
  }
  return !1;
}
function Mo({ vnode: e, parent: t }, n) {
  for (; t; ) {
    const r = t.subTree;
    if ((r.suspense && r.suspense.activeBranch === e && (r.el = e.el), r === e))
      (((e = t.vnode).el = n), (t = t.parent));
    else break;
  }
}
const Zs = (e) => e.__isSuspense;
let Ni = 0;
const tb = {
    name: "Suspense",
    __isSuspense: !0,
    process(e, t, n, r, s, o, i, a, l, u) {
      if (e == null) nb(t, n, r, s, o, i, a, l, u);
      else {
        if (o && o.deps > 0 && !e.suspense.isInFallback) {
          ((t.suspense = e.suspense), (t.suspense.vnode = t), (t.el = e.el));
          return;
        }
        rb(e, t, n, r, s, i, a, l, u);
      }
    },
    hydrate: sb,
    normalize: ob,
  },
  xo = tb;
function rs(e, t) {
  const n = e.props && e.props[t];
  Z(n) && n();
}
function nb(e, t, n, r, s, o, i, a, l) {
  const {
      p: u,
      o: { createElement: c },
    } = l,
    f = c("div"),
    d = (e.suspense = Zf(e, s, r, t, f, n, o, i, a, l));
  (u(null, (d.pendingBranch = e.ssContent), f, null, r, d, o, i),
    d.deps > 0
      ? (rs(e, "onPending"),
        rs(e, "onFallback"),
        u(null, e.ssFallback, t, n, r, null, o, i),
        ar(d, e.ssFallback))
      : d.resolve(!1, !0));
}
function rb(e, t, n, r, s, o, i, a, { p: l, um: u, o: { createElement: c } }) {
  const f = (t.suspense = e.suspense);
  ((f.vnode = t), (t.el = e.el));
  const d = t.ssContent,
    p = t.ssFallback,
    { activeBranch: y, pendingBranch: h, isInFallback: S, isHydrating: g } = f;
  if (h)
    ((f.pendingBranch = d),
      Ct(d, h)
        ? (l(h, d, f.hiddenContainer, null, s, f, o, i, a),
          f.deps <= 0
            ? f.resolve()
            : S && (g || (l(y, p, n, r, s, null, o, i, a), ar(f, p))))
        : ((f.pendingId = Ni++),
          g ? ((f.isHydrating = !1), (f.activeBranch = h)) : u(h, s, f),
          (f.deps = 0),
          (f.effects.length = 0),
          (f.hiddenContainer = c("div")),
          S
            ? (l(null, d, f.hiddenContainer, null, s, f, o, i, a),
              f.deps <= 0
                ? f.resolve()
                : (l(y, p, n, r, s, null, o, i, a), ar(f, p)))
            : y && Ct(d, y)
              ? (l(y, d, n, r, s, f, o, i, a), f.resolve(!0))
              : (l(null, d, f.hiddenContainer, null, s, f, o, i, a),
                f.deps <= 0 && f.resolve())));
  else if (y && Ct(d, y)) (l(y, d, n, r, s, f, o, i, a), ar(f, d));
  else if (
    (rs(t, "onPending"),
    (f.pendingBranch = d),
    d.shapeFlag & 512
      ? (f.pendingId = d.component.suspenseId)
      : (f.pendingId = Ni++),
    l(null, d, f.hiddenContainer, null, s, f, o, i, a),
    f.deps <= 0)
  )
    f.resolve();
  else {
    const { timeout: E, pendingId: m } = f;
    E > 0
      ? setTimeout(() => {
          f.pendingId === m && f.fallback(p);
        }, E)
      : E === 0 && f.fallback(p);
  }
}
function Zf(e, t, n, r, s, o, i, a, l, u, c = !1) {
  const {
    p: f,
    m: d,
    um: p,
    n: y,
    o: { parentNode: h, remove: S },
  } = u;
  let g;
  const E = ib(e);
  E && t && t.pendingBranch && ((g = t.pendingId), t.deps++);
  const m = e.props ? zr(e.props.timeout) : void 0,
    b = o,
    C = {
      vnode: e,
      parent: t,
      parentComponent: n,
      namespace: i,
      container: r,
      hiddenContainer: s,
      deps: 0,
      pendingId: Ni++,
      timeout: typeof m == "number" ? m : -1,
      activeBranch: null,
      pendingBranch: null,
      isInFallback: !c,
      isHydrating: c,
      isUnmounted: !1,
      effects: [],
      resolve(L = !1, R = !1) {
        const {
          vnode: j,
          activeBranch: M,
          pendingBranch: $,
          pendingId: K,
          effects: F,
          parentComponent: X,
          container: ne,
        } = C;
        let se = !1;
        (C.isHydrating
          ? (C.isHydrating = !1)
          : L ||
            ((se = M && $.transition && $.transition.mode === "out-in"),
            se &&
              (M.transition.afterLeave = () => {
                K === C.pendingId && (d($, ne, o === b ? y(M) : o, 0), Zr(F));
              }),
            M && (h(M.el) === ne && (o = y(M)), p(M, X, C, !0)),
            se || d($, ne, o, 0)),
          ar(C, $),
          (C.pendingBranch = null),
          (C.isInFallback = !1));
        let q = C.parent,
          ee = !1;
        for (; q; ) {
          if (q.pendingBranch) {
            (q.effects.push(...F), (ee = !0));
            break;
          }
          q = q.parent;
        }
        (!ee && !se && Zr(F),
          (C.effects = []),
          E &&
            t &&
            t.pendingBranch &&
            g === t.pendingId &&
            (t.deps--, t.deps === 0 && !R && t.resolve()),
          rs(j, "onResolve"));
      },
      fallback(L) {
        if (!C.pendingBranch) return;
        const {
          vnode: R,
          activeBranch: j,
          parentComponent: M,
          container: $,
          namespace: K,
        } = C;
        rs(R, "onFallback");
        const F = y(j),
          X = () => {
            C.isInFallback && (f(null, L, $, F, M, null, K, a, l), ar(C, L));
          },
          ne = L.transition && L.transition.mode === "out-in";
        (ne && (j.transition.afterLeave = X),
          (C.isInFallback = !0),
          p(j, M, null, !0),
          ne || X());
      },
      move(L, R, j) {
        (C.activeBranch && d(C.activeBranch, L, R, j), (C.container = L));
      },
      next() {
        return C.activeBranch && y(C.activeBranch);
      },
      registerDep(L, R, j) {
        const M = !!C.pendingBranch;
        M && C.deps++;
        const $ = L.vnode.el;
        L.asyncDep
          .catch((K) => {
            zn(K, L, 0);
          })
          .then((K) => {
            if (L.isUnmounted || C.isUnmounted || C.pendingId !== L.suspenseId)
              return;
            L.asyncResolved = !0;
            const { vnode: F } = L;
            (Di(L, K, !1), $ && (F.el = $));
            const X = !$ && L.subTree.el;
            (R(L, F, h($ || L.subTree.el), $ ? null : y(L.subTree), C, i, j),
              X && S(X),
              Mo(L, F.el),
              M && --C.deps === 0 && C.resolve());
          });
      },
      unmount(L, R) {
        ((C.isUnmounted = !0),
          C.activeBranch && p(C.activeBranch, n, L, R),
          C.pendingBranch && p(C.pendingBranch, n, L, R));
      },
    };
  return C;
}
function sb(e, t, n, r, s, o, i, a, l) {
  const u = (t.suspense = Zf(
      t,
      r,
      n,
      e.parentNode,
      document.createElement("div"),
      null,
      s,
      o,
      i,
      a,
      !0,
    )),
    c = l(e, (u.pendingBranch = t.ssContent), n, u, o, i);
  return (u.deps === 0 && u.resolve(!1, !0), c);
}
function ob(e) {
  const { shapeFlag: t, children: n } = e,
    r = t & 32;
  ((e.ssContent = Ul(r ? n.default : n)),
    (e.ssFallback = r ? Ul(n.fallback) : we(Oe)));
}
function Ul(e) {
  let t;
  if (Z(e)) {
    const n = Wn && e._c;
    (n && ((e._d = !1), ct()), (e = e()), n && ((e._d = !0), (t = Ye), td()));
  }
  return (
    Y(e) && (e = Jg(e)),
    (e = nt(e)),
    t && !e.dynamicChildren && (e.dynamicChildren = t.filter((n) => n !== e)),
    e
  );
}
function ed(e, t) {
  t && t.pendingBranch
    ? Y(e)
      ? t.effects.push(...e)
      : t.effects.push(e)
    : Zr(e);
}
function ar(e, t) {
  e.activeBranch = t;
  const { vnode: n, parentComponent: r } = e;
  let s = t.el;
  for (; !s && t.component; ) ((t = t.component.subTree), (s = t.el));
  ((n.el = s), r && r.subTree === n && ((r.vnode.el = s), Mo(r, s)));
}
function ib(e) {
  const t = e.props && e.props.suspensible;
  return t != null && t !== !1;
}
const ke = Symbol.for("v-fgt"),
  Zt = Symbol.for("v-txt"),
  Oe = Symbol.for("v-cmt"),
  Vn = Symbol.for("v-stc"),
  Vr = [];
let Ye = null;
function ct(e = !1) {
  Vr.push((Ye = e ? null : []));
}
function td() {
  (Vr.pop(), (Ye = Vr[Vr.length - 1] || null));
}
let Wn = 1;
function Ii(e, t = !1) {
  ((Wn += e), e < 0 && Ye && t && (Ye.hasOnce = !0));
}
function nd(e) {
  return (
    (e.dynamicChildren = Wn > 0 ? Ye || Dn : null),
    td(),
    Wn > 0 && Ye && Ye.push(e),
    e
  );
}
function rd(e, t, n, r, s, o) {
  return nd(Wa(e, t, n, r, s, o, !0));
}
function Tt(e, t, n, r, s) {
  return nd(we(e, t, n, r, s, !0));
}
function on(e) {
  return e ? e.__v_isVNode === !0 : !1;
}
function Ct(e, t) {
  return e.type === t.type && e.key === t.key;
}
function ab(e) {}
const sd = ({ key: e }) => e ?? null,
  Hs = ({ ref: e, ref_key: t, ref_for: n }) => (
    typeof e == "number" && (e = "" + e),
    e != null
      ? me(e) || Se(e) || Z(e)
        ? { i: xe, r: e, k: t, f: !!n }
        : e
      : null
  );
function Wa(
  e,
  t = null,
  n = null,
  r = 0,
  s = null,
  o = e === ke ? 0 : 1,
  i = !1,
  a = !1,
) {
  const l = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e,
    props: t,
    key: t && sd(t),
    ref: t && Hs(t),
    scopeId: Lo,
    slotScopeIds: null,
    children: n,
    component: null,
    suspense: null,
    ssContent: null,
    ssFallback: null,
    dirs: null,
    transition: null,
    el: null,
    anchor: null,
    target: null,
    targetStart: null,
    targetAnchor: null,
    staticCount: 0,
    shapeFlag: o,
    patchFlag: r,
    dynamicProps: s,
    dynamicChildren: null,
    appContext: null,
    ctx: xe,
  };
  return (
    a
      ? (qa(l, n), o & 128 && e.normalize(l))
      : n && (l.shapeFlag |= me(n) ? 8 : 16),
    Wn > 0 &&
      !i &&
      Ye &&
      (l.patchFlag > 0 || o & 6) &&
      l.patchFlag !== 32 &&
      Ye.push(l),
    l
  );
}
const we = lb;
function lb(e, t = null, n = null, r = 0, s = null, o = !1) {
  if (((!e || e === Lf) && (e = Oe), on(e))) {
    const a = Vt(e, t, !0);
    return (
      n && qa(a, n),
      Wn > 0 &&
        !o &&
        Ye &&
        (a.shapeFlag & 6 ? (Ye[Ye.indexOf(e)] = a) : Ye.push(a)),
      (a.patchFlag = -2),
      a
    );
  }
  if ((bb(e) && (e = e.__vccOpts), t)) {
    t = Ka(t);
    let { class: a, style: l } = t;
    (a && !me(a) && (t.class = Tr(a)),
      ge(l) && (Ro(l) && !Y(l) && (l = ve({}, l)), (t.style = wr(l))));
  }
  const i = me(e) ? 1 : Zs(e) ? 128 : mf(e) ? 64 : ge(e) ? 4 : Z(e) ? 2 : 0;
  return Wa(e, t, n, r, s, i, o, !0);
}
function Ka(e) {
  return e ? (Ro(e) || xf(e) ? ve({}, e) : e) : null;
}
function Vt(e, t, n = !1, r = !1) {
  const { props: s, ref: o, patchFlag: i, children: a, transition: l } = e,
    u = t ? Ya(s || {}, t) : s,
    c = {
      __v_isVNode: !0,
      __v_skip: !0,
      type: e.type,
      props: u,
      key: u && sd(u),
      ref:
        t && t.ref
          ? n && o
            ? Y(o)
              ? o.concat(Hs(t))
              : [o, Hs(t)]
            : Hs(t)
          : o,
      scopeId: e.scopeId,
      slotScopeIds: e.slotScopeIds,
      children: a,
      target: e.target,
      targetStart: e.targetStart,
      targetAnchor: e.targetAnchor,
      staticCount: e.staticCount,
      shapeFlag: e.shapeFlag,
      patchFlag: t && e.type !== ke ? (i === -1 ? 16 : i | 16) : i,
      dynamicProps: e.dynamicProps,
      dynamicChildren: e.dynamicChildren,
      appContext: e.appContext,
      dirs: e.dirs,
      transition: l,
      component: e.component,
      suspense: e.suspense,
      ssContent: e.ssContent && Vt(e.ssContent),
      ssFallback: e.ssFallback && Vt(e.ssFallback),
      el: e.el,
      anchor: e.anchor,
      ctx: e.ctx,
      ce: e.ce,
    };
  return (l && r && sn(c, l.clone(c)), c);
}
function Ga(e = " ", t = 0) {
  return we(Zt, null, e, t);
}
function cb(e, t) {
  const n = we(Vn, null, e);
  return ((n.staticCount = t), n);
}
function ub(e = "", t = !1) {
  return t ? (ct(), Tt(Oe, null, e)) : we(Oe, null, e);
}
function nt(e) {
  return e == null || typeof e == "boolean"
    ? we(Oe)
    : Y(e)
      ? we(ke, null, e.slice())
      : on(e)
        ? bn(e)
        : we(Zt, null, String(e));
}
function bn(e) {
  return (e.el === null && e.patchFlag !== -1) || e.memo ? e : Vt(e);
}
function qa(e, t) {
  let n = 0;
  const { shapeFlag: r } = e;
  if (t == null) t = null;
  else if (Y(t)) n = 16;
  else if (typeof t == "object")
    if (r & 65) {
      const s = t.default;
      s && (s._c && (s._d = !1), qa(e, s()), s._c && (s._d = !0));
      return;
    } else {
      n = 32;
      const s = t._;
      !s && !xf(t)
        ? (t._ctx = xe)
        : s === 3 &&
          xe &&
          (xe.slots._ === 1 ? (t._ = 1) : ((t._ = 2), (e.patchFlag |= 1024)));
    }
  else
    Z(t)
      ? ((t = { default: t, _ctx: xe }), (n = 32))
      : ((t = String(t)), r & 64 ? ((n = 16), (t = [Ga(t)])) : (n = 8));
  ((e.children = t), (e.shapeFlag |= n));
}
function Ya(...e) {
  const t = {};
  for (let n = 0; n < e.length; n++) {
    const r = e[n];
    for (const s in r)
      if (s === "class")
        t.class !== r.class && (t.class = Tr([t.class, r.class]));
      else if (s === "style") t.style = wr([t.style, r.style]);
      else if (vr(s)) {
        const o = t[s],
          i = r[s];
        i &&
          o !== i &&
          !(Y(o) && o.includes(i)) &&
          (t[s] = o ? [].concat(o, i) : i);
      } else s !== "" && (t[s] = r[s]);
  }
  return t;
}
function tt(e, t, n, r = null) {
  vt(e, t, 7, [n, r]);
}
const fb = Nf();
let db = 0;
function od(e, t, n) {
  const r = e.type,
    s = (t ? t.appContext : e.appContext) || fb,
    o = {
      uid: db++,
      vnode: e,
      type: r,
      parent: t,
      appContext: s,
      root: null,
      next: null,
      subTree: null,
      effect: null,
      update: null,
      job: null,
      scope: new Ea(!0),
      render: null,
      proxy: null,
      exposed: null,
      exposeProxy: null,
      withProxy: null,
      provides: t ? t.provides : Object.create(s.provides),
      ids: t ? t.ids : ["", 0, 0],
      accessCache: null,
      renderCache: [],
      components: null,
      directives: null,
      propsOptions: Ff(r, s),
      emitsOptions: Qf(r, s),
      emit: null,
      emitted: null,
      propsDefaults: re,
      inheritAttrs: r.inheritAttrs,
      ctx: re,
      data: re,
      props: re,
      attrs: re,
      slots: re,
      refs: re,
      setupState: re,
      setupContext: null,
      suspense: n,
      suspenseId: n ? n.pendingId : 0,
      asyncDep: null,
      asyncResolved: !1,
      isMounted: !1,
      isUnmounted: !1,
      isDeactivated: !1,
      bc: null,
      c: null,
      bm: null,
      m: null,
      bu: null,
      u: null,
      um: null,
      bum: null,
      da: null,
      a: null,
      rtg: null,
      rtc: null,
      ec: null,
      sp: null,
    };
  return (
    (o.ctx = { _: o }),
    (o.root = t ? t.root : o),
    (o.emit = Xg.bind(null, o)),
    e.ce && e.ce(o),
    o
  );
}
let Me = null;
const Ve = () => Me || xe;
let eo, Mi;
{
  const e = fs(),
    t = (n, r) => {
      let s;
      return (
        (s = e[n]) || (s = e[n] = []),
        s.push(r),
        (o) => {
          s.length > 1 ? s.forEach((i) => i(o)) : s[0](o);
        }
      );
    };
  ((eo = t("__VUE_INSTANCE_SETTERS__", (n) => (Me = n))),
    (Mi = t("__VUE_SSR_SETTERS__", (n) => (ur = n))));
}
const Kn = (e) => {
    const t = Me;
    return (
      eo(e),
      e.scope.on(),
      () => {
        (e.scope.off(), eo(t));
      }
    );
  },
  xi = () => {
    (Me && Me.scope.off(), eo(null));
  };
function id(e) {
  return e.vnode.shapeFlag & 4;
}
let ur = !1;
function ad(e, t = !1, n = !1) {
  t && Mi(t);
  const { props: r, children: s } = e.vnode,
    o = id(e);
  (Hg(e, r, o, t), Wg(e, s, n || t));
  const i = o ? pb(e, t) : void 0;
  return (t && Mi(!1), i);
}
function pb(e, t) {
  const n = e.type;
  ((e.accessCache = Object.create(null)), (e.proxy = new Proxy(e.ctx, Li)));
  const { setup: r } = n;
  if (r) {
    tn();
    const s = (e.setupContext = r.length > 1 ? cd(e) : null),
      o = Kn(e),
      i = Cr(r, e, 0, [e.props, s]),
      a = yo(i);
    if ((nn(), o(), (a || e.sp) && !Tn(e) && Na(e), a)) {
      if ((i.then(xi, xi), t))
        return i
          .then((l) => {
            Di(e, l, t);
          })
          .catch((l) => {
            zn(l, e, 0);
          });
      e.asyncDep = i;
    } else Di(e, i, t);
  } else ld(e, t);
}
function Di(e, t, n) {
  (Z(t)
    ? e.type.__ssrInlineRender
      ? (e.ssrRender = t)
      : (e.render = t)
    : ge(t) && (e.setupState = Aa(t)),
    ld(e, n));
}
let to, Fi;
function hb(e) {
  ((to = e),
    (Fi = (t) => {
      t.render._rc && (t.withProxy = new Proxy(t.ctx, yg));
    }));
}
const mb = () => !to;
function ld(e, t, n) {
  const r = e.type;
  if (!e.render) {
    if (!t && to && !r.render) {
      const s = r.template || Ha(e).template;
      if (s) {
        const { isCustomElement: o, compilerOptions: i } = e.appContext.config,
          { delimiters: a, compilerOptions: l } = r,
          u = ve(ve({ isCustomElement: o, delimiters: a }, i), l);
        r.render = to(s, u);
      }
    }
    ((e.render = r.render || ut), Fi && Fi(e));
  }
  {
    const s = Kn(e);
    tn();
    try {
      Ig(e);
    } finally {
      (nn(), s());
    }
  }
}
const gb = {
  get(e, t) {
    return (Ge(e, "get", ""), e[t]);
  },
};
function cd(e) {
  const t = (n) => {
    e.exposed = n || {};
  };
  return {
    attrs: new Proxy(e.attrs, gb),
    slots: e.slots,
    emit: e.emit,
    expose: t,
  };
}
function _s(e) {
  return e.exposed
    ? e.exposeProxy ||
        (e.exposeProxy = new Proxy(Aa(rf(e.exposed)), {
          get(t, n) {
            if (n in t) return t[n];
            if (n in jr) return jr[n](e);
          },
          has(t, n) {
            return n in t || n in jr;
          },
        }))
    : e.proxy;
}
function $i(e, t = !0) {
  return Z(e) ? e.displayName || e.name : e.name || (t && e.__name);
}
function bb(e) {
  return Z(e) && "__vccOpts" in e;
}
const Ce = (e, t) => Om(e, t, ur);
function De(e, t, n) {
  const r = arguments.length;
  return r === 2
    ? ge(t) && !Y(t)
      ? on(t)
        ? we(e, null, [t])
        : we(e, t)
      : we(e, null, t)
    : (r > 3
        ? (n = Array.prototype.slice.call(arguments, 2))
        : r === 3 && on(n) && (n = [n]),
      we(e, t, n));
}
function _b() {}
function yb(e, t, n, r) {
  const s = n[r];
  if (s && ud(s, e)) return s;
  const o = t();
  return ((o.memo = e.slice()), (o.cacheIndex = r), (n[r] = o));
}
function ud(e, t) {
  const n = e.memo;
  if (n.length != t.length) return !1;
  for (let r = 0; r < n.length; r++) if (Ke(n[r], t[r])) return !1;
  return (Wn > 0 && Ye && Ye.push(e), !0);
}
const fd = "3.5.17",
  vb = ut,
  Eb = Hm,
  wb = er,
  Tb = pf,
  Cb = {
    createComponentInstance: od,
    setupComponent: ad,
    renderComponentRoot: Us,
    setCurrentRenderingInstance: ts,
    isVNode: on,
    normalizeVNode: nt,
    getComponentPublicInstance: _s,
    ensureValidVNode: Ua,
    pushWarningContext: Dm,
    popWarningContext: Fm,
  },
  Sb = Cb,
  Ab = null,
  Rb = null,
  Lb = null;
/**
 * @vue/runtime-dom v3.5.17
 * (c) 2018-present Yuxi (Evan) You and Vue contributors
 * @license MIT
 **/ let Ui;
const Hl = typeof window < "u" && window.trustedTypes;
if (Hl)
  try {
    Ui = Hl.createPolicy("vue", { createHTML: (e) => e });
  } catch {}
const dd = Ui ? (e) => Ui.createHTML(e) : (e) => e,
  Pb = "http://www.w3.org/2000/svg",
  kb = "http://www.w3.org/1998/Math/MathML",
  Gt = typeof document < "u" ? document : null,
  jl = Gt && Gt.createElement("template"),
  Ob = {
    insert: (e, t, n) => {
      t.insertBefore(e, n || null);
    },
    remove: (e) => {
      const t = e.parentNode;
      t && t.removeChild(e);
    },
    createElement: (e, t, n, r) => {
      const s =
        t === "svg"
          ? Gt.createElementNS(Pb, e)
          : t === "mathml"
            ? Gt.createElementNS(kb, e)
            : n
              ? Gt.createElement(e, { is: n })
              : Gt.createElement(e);
      return (
        e === "select" &&
          r &&
          r.multiple != null &&
          s.setAttribute("multiple", r.multiple),
        s
      );
    },
    createText: (e) => Gt.createTextNode(e),
    createComment: (e) => Gt.createComment(e),
    setText: (e, t) => {
      e.nodeValue = t;
    },
    setElementText: (e, t) => {
      e.textContent = t;
    },
    parentNode: (e) => e.parentNode,
    nextSibling: (e) => e.nextSibling,
    querySelector: (e) => Gt.querySelector(e),
    setScopeId(e, t) {
      e.setAttribute(t, "");
    },
    insertStaticContent(e, t, n, r, s, o) {
      const i = n ? n.previousSibling : t.lastChild;
      if (s && (s === o || s.nextSibling))
        for (
          ;
          t.insertBefore(s.cloneNode(!0), n),
            !(s === o || !(s = s.nextSibling));

        );
      else {
        jl.innerHTML = dd(
          r === "svg"
            ? `<svg>${e}</svg>`
            : r === "mathml"
              ? `<math>${e}</math>`
              : e,
        );
        const a = jl.content;
        if (r === "svg" || r === "mathml") {
          const l = a.firstChild;
          for (; l.firstChild; ) a.appendChild(l.firstChild);
          a.removeChild(l);
        }
        t.insertBefore(a, n);
      }
      return [
        i ? i.nextSibling : t.firstChild,
        n ? n.previousSibling : t.lastChild,
      ];
    },
  },
  fn = "transition",
  kr = "animation",
  fr = Symbol("_vtc"),
  pd = {
    name: String,
    type: String,
    css: { type: Boolean, default: !0 },
    duration: [String, Number, Object],
    enterFromClass: String,
    enterActiveClass: String,
    enterToClass: String,
    appearFromClass: String,
    appearActiveClass: String,
    appearToClass: String,
    leaveFromClass: String,
    leaveActiveClass: String,
    leaveToClass: String,
  },
  hd = ve({}, Oa, pd),
  Nb = (e) => ((e.displayName = "Transition"), (e.props = hd), e),
  md = Nb((e, { slots: t }) => De(vf, gd(e), t)),
  Nn = (e, t = []) => {
    Y(e) ? e.forEach((n) => n(...t)) : e && e(...t);
  },
  Vl = (e) => (e ? (Y(e) ? e.some((t) => t.length > 1) : e.length > 1) : !1);
function gd(e) {
  const t = {};
  for (const F in e) F in pd || (t[F] = e[F]);
  if (e.css === !1) return t;
  const {
      name: n = "v",
      type: r,
      duration: s,
      enterFromClass: o = `${n}-enter-from`,
      enterActiveClass: i = `${n}-enter-active`,
      enterToClass: a = `${n}-enter-to`,
      appearFromClass: l = o,
      appearActiveClass: u = i,
      appearToClass: c = a,
      leaveFromClass: f = `${n}-leave-from`,
      leaveActiveClass: d = `${n}-leave-active`,
      leaveToClass: p = `${n}-leave-to`,
    } = e,
    y = Ib(s),
    h = y && y[0],
    S = y && y[1],
    {
      onBeforeEnter: g,
      onEnter: E,
      onEnterCancelled: m,
      onLeave: b,
      onLeaveCancelled: C,
      onBeforeAppear: L = g,
      onAppear: R = E,
      onAppearCancelled: j = m,
    } = t,
    M = (F, X, ne, se) => {
      ((F._enterCancelled = se),
        pn(F, X ? c : a),
        pn(F, X ? u : i),
        ne && ne());
    },
    $ = (F, X) => {
      ((F._isLeaving = !1), pn(F, f), pn(F, p), pn(F, d), X && X());
    },
    K = (F) => (X, ne) => {
      const se = F ? R : E,
        q = () => M(X, F, ne);
      (Nn(se, [X, q]),
        Bl(() => {
          (pn(X, F ? l : o), xt(X, F ? c : a), Vl(se) || Wl(X, r, h, q));
        }));
    };
  return ve(t, {
    onBeforeEnter(F) {
      (Nn(g, [F]), xt(F, o), xt(F, i));
    },
    onBeforeAppear(F) {
      (Nn(L, [F]), xt(F, l), xt(F, u));
    },
    onEnter: K(!1),
    onAppear: K(!0),
    onLeave(F, X) {
      F._isLeaving = !0;
      const ne = () => $(F, X);
      (xt(F, f),
        F._enterCancelled ? (xt(F, d), Hi()) : (Hi(), xt(F, d)),
        Bl(() => {
          F._isLeaving && (pn(F, f), xt(F, p), Vl(b) || Wl(F, r, S, ne));
        }),
        Nn(b, [F, ne]));
    },
    onEnterCancelled(F) {
      (M(F, !1, void 0, !0), Nn(m, [F]));
    },
    onAppearCancelled(F) {
      (M(F, !0, void 0, !0), Nn(j, [F]));
    },
    onLeaveCancelled(F) {
      ($(F), Nn(C, [F]));
    },
  });
}
function Ib(e) {
  if (e == null) return null;
  if (ge(e)) return [li(e.enter), li(e.leave)];
  {
    const t = li(e);
    return [t, t];
  }
}
function li(e) {
  return zr(e);
}
function xt(e, t) {
  (t.split(/\s+/).forEach((n) => n && e.classList.add(n)),
    (e[fr] || (e[fr] = new Set())).add(t));
}
function pn(e, t) {
  t.split(/\s+/).forEach((r) => r && e.classList.remove(r));
  const n = e[fr];
  n && (n.delete(t), n.size || (e[fr] = void 0));
}
function Bl(e) {
  requestAnimationFrame(() => {
    requestAnimationFrame(e);
  });
}
let Mb = 0;
function Wl(e, t, n, r) {
  const s = (e._endId = ++Mb),
    o = () => {
      s === e._endId && r();
    };
  if (n != null) return setTimeout(o, n);
  const { type: i, timeout: a, propCount: l } = bd(e, t);
  if (!i) return r();
  const u = i + "end";
  let c = 0;
  const f = () => {
      (e.removeEventListener(u, d), o());
    },
    d = (p) => {
      p.target === e && ++c >= l && f();
    };
  (setTimeout(() => {
    c < l && f();
  }, a + 1),
    e.addEventListener(u, d));
}
function bd(e, t) {
  const n = window.getComputedStyle(e),
    r = (y) => (n[y] || "").split(", "),
    s = r(`${fn}Delay`),
    o = r(`${fn}Duration`),
    i = Kl(s, o),
    a = r(`${kr}Delay`),
    l = r(`${kr}Duration`),
    u = Kl(a, l);
  let c = null,
    f = 0,
    d = 0;
  t === fn
    ? i > 0 && ((c = fn), (f = i), (d = o.length))
    : t === kr
      ? u > 0 && ((c = kr), (f = u), (d = l.length))
      : ((f = Math.max(i, u)),
        (c = f > 0 ? (i > u ? fn : kr) : null),
        (d = c ? (c === fn ? o.length : l.length) : 0));
  const p =
    c === fn && /\b(transform|all)(,|$)/.test(r(`${fn}Property`).toString());
  return { type: c, timeout: f, propCount: d, hasTransform: p };
}
function Kl(e, t) {
  for (; e.length < t.length; ) e = e.concat(e);
  return Math.max(...t.map((n, r) => Gl(n) + Gl(e[r])));
}
function Gl(e) {
  return e === "auto" ? 0 : Number(e.slice(0, -1).replace(",", ".")) * 1e3;
}
function Hi() {
  return document.body.offsetHeight;
}
function xb(e, t, n) {
  const r = e[fr];
  (r && (t = (t ? [t, ...r] : [...r]).join(" ")),
    t == null
      ? e.removeAttribute("class")
      : n
        ? e.setAttribute("class", t)
        : (e.className = t));
}
const no = Symbol("_vod"),
  _d = Symbol("_vsh"),
  yd = {
    beforeMount(e, { value: t }, { transition: n }) {
      ((e[no] = e.style.display === "none" ? "" : e.style.display),
        n && t ? n.beforeEnter(e) : Or(e, t));
    },
    mounted(e, { value: t }, { transition: n }) {
      n && t && n.enter(e);
    },
    updated(e, { value: t, oldValue: n }, { transition: r }) {
      !t != !n &&
        (r
          ? t
            ? (r.beforeEnter(e), Or(e, !0), r.enter(e))
            : r.leave(e, () => {
                Or(e, !1);
              })
          : Or(e, t));
    },
    beforeUnmount(e, { value: t }) {
      Or(e, t);
    },
  };
function Or(e, t) {
  ((e.style.display = t ? e[no] : "none"), (e[_d] = !t));
}
function Db() {
  yd.getSSRProps = ({ value: e }) => {
    if (!e) return { style: { display: "none" } };
  };
}
const vd = Symbol("");
function Fb(e) {
  const t = Ve();
  if (!t) return;
  const n = (t.ut = (s = e(t.proxy)) => {
      Array.from(
        document.querySelectorAll(`[data-v-owner="${t.uid}"]`),
      ).forEach((o) => ro(o, s));
    }),
    r = () => {
      const s = e(t.proxy);
      (t.ce ? ro(t.ce, s) : ji(t.subTree, s), n(s));
    };
  (xa(() => {
    Zr(r);
  }),
    Sr(() => {
      rt(r, ut, { flush: "post" });
      const s = new MutationObserver(r);
      (s.observe(t.subTree.el.parentNode, { childList: !0 }),
        gs(() => s.disconnect()));
    }));
}
function ji(e, t) {
  if (e.shapeFlag & 128) {
    const n = e.suspense;
    ((e = n.activeBranch),
      n.pendingBranch &&
        !n.isHydrating &&
        n.effects.push(() => {
          ji(n.activeBranch, t);
        }));
  }
  for (; e.component; ) e = e.component.subTree;
  if (e.shapeFlag & 1 && e.el) ro(e.el, t);
  else if (e.type === ke) e.children.forEach((n) => ji(n, t));
  else if (e.type === Vn) {
    let { el: n, anchor: r } = e;
    for (; n && (ro(n, t), n !== r); ) n = n.nextSibling;
  }
}
function ro(e, t) {
  if (e.nodeType === 1) {
    const n = e.style;
    let r = "";
    for (const s in t)
      (n.setProperty(`--${s}`, t[s]), (r += `--${s}: ${t[s]};`));
    n[vd] = r;
  }
}
const $b = /(^|;)\s*display\s*:/;
function Ub(e, t, n) {
  const r = e.style,
    s = me(n);
  let o = !1;
  if (n && !s) {
    if (t)
      if (me(t))
        for (const i of t.split(";")) {
          const a = i.slice(0, i.indexOf(":")).trim();
          n[a] == null && js(r, a, "");
        }
      else for (const i in t) n[i] == null && js(r, i, "");
    for (const i in n) (i === "display" && (o = !0), js(r, i, n[i]));
  } else if (s) {
    if (t !== n) {
      const i = r[vd];
      (i && (n += ";" + i), (r.cssText = n), (o = $b.test(n)));
    }
  } else t && e.removeAttribute("style");
  no in e && ((e[no] = o ? r.display : ""), e[_d] && (r.display = "none"));
}
const ql = /\s*!important$/;
function js(e, t, n) {
  if (Y(n)) n.forEach((r) => js(e, t, r));
  else if ((n == null && (n = ""), t.startsWith("--"))) e.setProperty(t, n);
  else {
    const r = Hb(e, t);
    ql.test(n)
      ? e.setProperty(qe(r), n.replace(ql, ""), "important")
      : (e[r] = n);
  }
}
const Yl = ["Webkit", "Moz", "ms"],
  ci = {};
function Hb(e, t) {
  const n = ci[t];
  if (n) return n;
  let r = He(t);
  if (r !== "filter" && r in e) return (ci[t] = r);
  r = Er(r);
  for (let s = 0; s < Yl.length; s++) {
    const o = Yl[s] + r;
    if (o in e) return (ci[t] = o);
  }
  return t;
}
const zl = "http://www.w3.org/1999/xlink";
function Xl(e, t, n, r, s, o = $u(t)) {
  r && t.startsWith("xlink:")
    ? n == null
      ? e.removeAttributeNS(zl, t.slice(6, t.length))
      : e.setAttributeNS(zl, t, n)
    : n == null || (o && !ya(n))
      ? e.removeAttribute(t)
      : e.setAttribute(t, o ? "" : yt(n) ? String(n) : n);
}
function Jl(e, t, n, r, s) {
  if (t === "innerHTML" || t === "textContent") {
    n != null && (e[t] = t === "innerHTML" ? dd(n) : n);
    return;
  }
  const o = e.tagName;
  if (t === "value" && o !== "PROGRESS" && !o.includes("-")) {
    const a = o === "OPTION" ? e.getAttribute("value") || "" : e.value,
      l = n == null ? (e.type === "checkbox" ? "on" : "") : String(n);
    ((a !== l || !("_value" in e)) && (e.value = l),
      n == null && e.removeAttribute(t),
      (e._value = n));
    return;
  }
  let i = !1;
  if (n === "" || n == null) {
    const a = typeof e[t];
    a === "boolean"
      ? (n = ya(n))
      : n == null && a === "string"
        ? ((n = ""), (i = !0))
        : a === "number" && ((n = 0), (i = !0));
  }
  try {
    e[t] = n;
  } catch {}
  i && e.removeAttribute(s || t);
}
function zt(e, t, n, r) {
  e.addEventListener(t, n, r);
}
function jb(e, t, n, r) {
  e.removeEventListener(t, n, r);
}
const Ql = Symbol("_vei");
function Vb(e, t, n, r, s = null) {
  const o = e[Ql] || (e[Ql] = {}),
    i = o[t];
  if (r && i) i.value = r;
  else {
    const [a, l] = Bb(t);
    if (r) {
      const u = (o[t] = Gb(r, s));
      zt(e, a, u, l);
    } else i && (jb(e, a, i, l), (o[t] = void 0));
  }
}
const Zl = /(?:Once|Passive|Capture)$/;
function Bb(e) {
  let t;
  if (Zl.test(e)) {
    t = {};
    let r;
    for (; (r = e.match(Zl)); )
      ((e = e.slice(0, e.length - r[0].length)), (t[r[0].toLowerCase()] = !0));
  }
  return [e[2] === ":" ? e.slice(3) : qe(e.slice(2)), t];
}
let ui = 0;
const Wb = Promise.resolve(),
  Kb = () => ui || (Wb.then(() => (ui = 0)), (ui = Date.now()));
function Gb(e, t) {
  const n = (r) => {
    if (!r._vts) r._vts = Date.now();
    else if (r._vts <= n.attached) return;
    vt(qb(r, n.value), t, 5, [r]);
  };
  return ((n.value = e), (n.attached = Kb()), n);
}
function qb(e, t) {
  if (Y(t)) {
    const n = e.stopImmediatePropagation;
    return (
      (e.stopImmediatePropagation = () => {
        (n.call(e), (e._stopped = !0));
      }),
      t.map((r) => (s) => !s._stopped && r && r(s))
    );
  } else return t;
}
const ec = (e) =>
    e.charCodeAt(0) === 111 &&
    e.charCodeAt(1) === 110 &&
    e.charCodeAt(2) > 96 &&
    e.charCodeAt(2) < 123,
  Yb = (e, t, n, r, s, o) => {
    const i = s === "svg";
    t === "class"
      ? xb(e, r, i)
      : t === "style"
        ? Ub(e, n, r)
        : vr(t)
          ? bo(t) || Vb(e, t, n, r, o)
          : (
                t[0] === "."
                  ? ((t = t.slice(1)), !0)
                  : t[0] === "^"
                    ? ((t = t.slice(1)), !1)
                    : zb(e, t, r, i)
              )
            ? (Jl(e, t, r),
              !e.tagName.includes("-") &&
                (t === "value" || t === "checked" || t === "selected") &&
                Xl(e, t, r, i, o, t !== "value"))
            : e._isVueCE && (/[A-Z]/.test(t) || !me(r))
              ? Jl(e, He(t), r, o, t)
              : (t === "true-value"
                  ? (e._trueValue = r)
                  : t === "false-value" && (e._falseValue = r),
                Xl(e, t, r, i));
  };
function zb(e, t, n, r) {
  if (r)
    return !!(
      t === "innerHTML" ||
      t === "textContent" ||
      (t in e && ec(t) && Z(n))
    );
  if (
    t === "spellcheck" ||
    t === "draggable" ||
    t === "translate" ||
    t === "autocorrect" ||
    t === "form" ||
    (t === "list" && e.tagName === "INPUT") ||
    (t === "type" && e.tagName === "TEXTAREA")
  )
    return !1;
  if (t === "width" || t === "height") {
    const s = e.tagName;
    if (s === "IMG" || s === "VIDEO" || s === "CANVAS" || s === "SOURCE")
      return !1;
  }
  return ec(t) && me(n) ? !1 : t in e;
}
const tc = {};
/*! #__NO_SIDE_EFFECTS__ */ function Ed(e, t, n) {
  const r = dt(e, t);
  us(r) && ve(r, t);
  class s extends Do {
    constructor(i) {
      super(r, i, n);
    }
  }
  return ((s.def = r), s);
}
/*! #__NO_SIDE_EFFECTS__ */ const Xb = (e, t) => Ed(e, t, Ja),
  Jb = typeof HTMLElement < "u" ? HTMLElement : class {};
class Do extends Jb {
  constructor(t, n = {}, r = io) {
    (super(),
      (this._def = t),
      (this._props = n),
      (this._createApp = r),
      (this._isVueCE = !0),
      (this._instance = null),
      (this._app = null),
      (this._nonce = this._def.nonce),
      (this._connected = !1),
      (this._resolved = !1),
      (this._numberProps = null),
      (this._styleChildren = new WeakSet()),
      (this._ob = null),
      this.shadowRoot && r !== io
        ? (this._root = this.shadowRoot)
        : t.shadowRoot !== !1
          ? (this.attachShadow({ mode: "open" }),
            (this._root = this.shadowRoot))
          : (this._root = this));
  }
  connectedCallback() {
    if (!this.isConnected) return;
    (!this.shadowRoot && !this._resolved && this._parseSlots(),
      (this._connected = !0));
    let t = this;
    for (; (t = t && (t.parentNode || t.host)); )
      if (t instanceof Do) {
        this._parent = t;
        break;
      }
    this._instance ||
      (this._resolved
        ? this._mount(this._def)
        : t && t._pendingResolve
          ? (this._pendingResolve = t._pendingResolve.then(() => {
              ((this._pendingResolve = void 0), this._resolveDef());
            }))
          : this._resolveDef());
  }
  _setParent(t = this._parent) {
    t && ((this._instance.parent = t._instance), this._inheritParentContext(t));
  }
  _inheritParentContext(t = this._parent) {
    t &&
      this._app &&
      Object.setPrototypeOf(this._app._context.provides, t._instance.provides);
  }
  disconnectedCallback() {
    ((this._connected = !1),
      jt(() => {
        this._connected ||
          (this._ob && (this._ob.disconnect(), (this._ob = null)),
          this._app && this._app.unmount(),
          this._instance && (this._instance.ce = void 0),
          (this._app = this._instance = null));
      }));
  }
  _resolveDef() {
    if (this._pendingResolve) return;
    for (let r = 0; r < this.attributes.length; r++)
      this._setAttr(this.attributes[r].name);
    ((this._ob = new MutationObserver((r) => {
      for (const s of r) this._setAttr(s.attributeName);
    })),
      this._ob.observe(this, { attributes: !0 }));
    const t = (r, s = !1) => {
        ((this._resolved = !0), (this._pendingResolve = void 0));
        const { props: o, styles: i } = r;
        let a;
        if (o && !Y(o))
          for (const l in o) {
            const u = o[l];
            (u === Number || (u && u.type === Number)) &&
              (l in this._props && (this._props[l] = zr(this._props[l])),
              ((a || (a = Object.create(null)))[He(l)] = !0));
          }
        ((this._numberProps = a),
          this._resolveProps(r),
          this.shadowRoot && this._applyStyles(i),
          this._mount(r));
      },
      n = this._def.__asyncLoader;
    n
      ? (this._pendingResolve = n().then((r) => {
          ((r.configureApp = this._def.configureApp), t((this._def = r), !0));
        }))
      : t(this._def);
  }
  _mount(t) {
    ((this._app = this._createApp(t)),
      this._inheritParentContext(),
      t.configureApp && t.configureApp(this._app),
      (this._app._ceVNode = this._createVNode()),
      this._app.mount(this._root));
    const n = this._instance && this._instance.exposed;
    if (n)
      for (const r in n)
        de(this, r) || Object.defineProperty(this, r, { get: () => te(n[r]) });
  }
  _resolveProps(t) {
    const { props: n } = t,
      r = Y(n) ? n : Object.keys(n || {});
    for (const s of Object.keys(this))
      s[0] !== "_" && r.includes(s) && this._setProp(s, this[s]);
    for (const s of r.map(He))
      Object.defineProperty(this, s, {
        get() {
          return this._getProp(s);
        },
        set(o) {
          this._setProp(s, o, !0, !0);
        },
      });
  }
  _setAttr(t) {
    if (t.startsWith("data-v-")) return;
    const n = this.hasAttribute(t);
    let r = n ? this.getAttribute(t) : tc;
    const s = He(t);
    (n && this._numberProps && this._numberProps[s] && (r = zr(r)),
      this._setProp(s, r, !1, !0));
  }
  _getProp(t) {
    return this._props[t];
  }
  _setProp(t, n, r = !0, s = !1) {
    if (
      n !== this._props[t] &&
      (n === tc
        ? delete this._props[t]
        : ((this._props[t] = n),
          t === "key" && this._app && (this._app._ceVNode.key = n)),
      s && this._instance && this._update(),
      r)
    ) {
      const o = this._ob;
      (o && o.disconnect(),
        n === !0
          ? this.setAttribute(qe(t), "")
          : typeof n == "string" || typeof n == "number"
            ? this.setAttribute(qe(t), n + "")
            : n || this.removeAttribute(qe(t)),
        o && o.observe(this, { attributes: !0 }));
    }
  }
  _update() {
    const t = this._createVNode();
    (this._app && (t.appContext = this._app._context), Nd(t, this._root));
  }
  _createVNode() {
    const t = {};
    this.shadowRoot ||
      (t.onVnodeMounted = t.onVnodeUpdated = this._renderSlots.bind(this));
    const n = we(this._def, ve(t, this._props));
    return (
      this._instance ||
        (n.ce = (r) => {
          ((this._instance = r), (r.ce = this), (r.isCE = !0));
          const s = (o, i) => {
            this.dispatchEvent(
              new CustomEvent(
                o,
                us(i[0]) ? ve({ detail: i }, i[0]) : { detail: i },
              ),
            );
          };
          ((r.emit = (o, ...i) => {
            (s(o, i), qe(o) !== o && s(qe(o), i));
          }),
            this._setParent());
        }),
      n
    );
  }
  _applyStyles(t, n) {
    if (!t) return;
    if (n) {
      if (n === this._def || this._styleChildren.has(n)) return;
      this._styleChildren.add(n);
    }
    const r = this._nonce;
    for (let s = t.length - 1; s >= 0; s--) {
      const o = document.createElement("style");
      (r && o.setAttribute("nonce", r),
        (o.textContent = t[s]),
        this.shadowRoot.prepend(o));
    }
  }
  _parseSlots() {
    const t = (this._slots = {});
    let n;
    for (; (n = this.firstChild); ) {
      const r = (n.nodeType === 1 && n.getAttribute("slot")) || "default";
      ((t[r] || (t[r] = [])).push(n), this.removeChild(n));
    }
  }
  _renderSlots() {
    const t = (this._teleportTarget || this).querySelectorAll("slot"),
      n = this._instance.type.__scopeId;
    for (let r = 0; r < t.length; r++) {
      const s = t[r],
        o = s.getAttribute("name") || "default",
        i = this._slots[o],
        a = s.parentNode;
      if (i)
        for (const l of i) {
          if (n && l.nodeType === 1) {
            const u = n + "-s",
              c = document.createTreeWalker(l, 1);
            l.setAttribute(u, "");
            let f;
            for (; (f = c.nextNode()); ) f.setAttribute(u, "");
          }
          a.insertBefore(l, s);
        }
      else for (; s.firstChild; ) a.insertBefore(s.firstChild, s);
      a.removeChild(s);
    }
  }
  _injectChildStyle(t) {
    this._applyStyles(t.styles, t);
  }
  _removeChildStyle(t) {}
}
function wd(e) {
  const t = Ve(),
    n = t && t.ce;
  return n || null;
}
function Qb() {
  const e = wd();
  return e && e.shadowRoot;
}
function Zb(e = "$style") {
  {
    const t = Ve();
    if (!t) return re;
    const n = t.type.__cssModules;
    if (!n) return re;
    const r = n[e];
    return r || re;
  }
}
const Td = new WeakMap(),
  Cd = new WeakMap(),
  so = Symbol("_moveCb"),
  nc = Symbol("_enterCb"),
  e_ = (e) => (delete e.props.mode, e),
  t_ = e_({
    name: "TransitionGroup",
    props: ve({}, hd, { tag: String, moveClass: String }),
    setup(e, { slots: t }) {
      const n = Ve(),
        r = ka();
      let s, o;
      return (
        Oo(() => {
          if (!s.length) return;
          const i = e.moveClass || `${e.name || "v"}-move`;
          if (!i_(s[0].el, n.vnode.el, i)) {
            s = [];
            return;
          }
          (s.forEach(r_), s.forEach(s_));
          const a = s.filter(o_);
          (Hi(),
            a.forEach((l) => {
              const u = l.el,
                c = u.style;
              (xt(u, i),
                (c.transform = c.webkitTransform = c.transitionDuration = ""));
              const f = (u[so] = (d) => {
                (d && d.target !== u) ||
                  ((!d || /transform$/.test(d.propertyName)) &&
                    (u.removeEventListener("transitionend", f),
                    (u[so] = null),
                    pn(u, i)));
              });
              u.addEventListener("transitionend", f);
            }),
            (s = []));
        }),
        () => {
          const i = le(e),
            a = gd(i);
          let l = i.tag || ke;
          if (((s = []), o))
            for (let u = 0; u < o.length; u++) {
              const c = o[u];
              c.el &&
                c.el instanceof Element &&
                (s.push(c),
                sn(c, cr(c, a, r, n)),
                Td.set(c, c.el.getBoundingClientRect()));
            }
          o = t.default ? Po(t.default()) : [];
          for (let u = 0; u < o.length; u++) {
            const c = o[u];
            c.key != null && sn(c, cr(c, a, r, n));
          }
          return we(l, null, o);
        }
      );
    },
  }),
  n_ = t_;
function r_(e) {
  const t = e.el;
  (t[so] && t[so](), t[nc] && t[nc]());
}
function s_(e) {
  Cd.set(e, e.el.getBoundingClientRect());
}
function o_(e) {
  const t = Td.get(e),
    n = Cd.get(e),
    r = t.left - n.left,
    s = t.top - n.top;
  if (r || s) {
    const o = e.el.style;
    return (
      (o.transform = o.webkitTransform = `translate(${r}px,${s}px)`),
      (o.transitionDuration = "0s"),
      e
    );
  }
}
function i_(e, t, n) {
  const r = e.cloneNode(),
    s = e[fr];
  (s &&
    s.forEach((a) => {
      a.split(/\s+/).forEach((l) => l && r.classList.remove(l));
    }),
    n.split(/\s+/).forEach((a) => a && r.classList.add(a)),
    (r.style.display = "none"));
  const o = t.nodeType === 1 ? t : t.parentNode;
  o.appendChild(r);
  const { hasTransform: i } = bd(r);
  return (o.removeChild(r), i);
}
const Sn = (e) => {
  const t = e.props["onUpdate:modelValue"] || !1;
  return Y(t) ? (n) => Un(t, n) : t;
};
function a_(e) {
  e.target.composing = !0;
}
function rc(e) {
  const t = e.target;
  t.composing && ((t.composing = !1), t.dispatchEvent(new Event("input")));
}
const _t = Symbol("_assign"),
  oo = {
    created(e, { modifiers: { lazy: t, trim: n, number: r } }, s) {
      e[_t] = Sn(s);
      const o = r || (s.props && s.props.type === "number");
      (zt(e, t ? "change" : "input", (i) => {
        if (i.target.composing) return;
        let a = e.value;
        (n && (a = a.trim()), o && (a = Yr(a)), e[_t](a));
      }),
        n &&
          zt(e, "change", () => {
            e.value = e.value.trim();
          }),
        t ||
          (zt(e, "compositionstart", a_),
          zt(e, "compositionend", rc),
          zt(e, "change", rc)));
    },
    mounted(e, { value: t }) {
      e.value = t ?? "";
    },
    beforeUpdate(
      e,
      { value: t, oldValue: n, modifiers: { lazy: r, trim: s, number: o } },
      i,
    ) {
      if (((e[_t] = Sn(i)), e.composing)) return;
      const a =
          (o || e.type === "number") && !/^0\d/.test(e.value)
            ? Yr(e.value)
            : e.value,
        l = t ?? "";
      a !== l &&
        ((document.activeElement === e &&
          e.type !== "range" &&
          ((r && t === n) || (s && e.value.trim() === l))) ||
          (e.value = l));
    },
  },
  za = {
    deep: !0,
    created(e, t, n) {
      ((e[_t] = Sn(n)),
        zt(e, "change", () => {
          const r = e._modelValue,
            s = dr(e),
            o = e.checked,
            i = e[_t];
          if (Y(r)) {
            const a = ds(r, s),
              l = a !== -1;
            if (o && !l) i(r.concat(s));
            else if (!o && l) {
              const u = [...r];
              (u.splice(a, 1), i(u));
            }
          } else if (An(r)) {
            const a = new Set(r);
            (o ? a.add(s) : a.delete(s), i(a));
          } else i(Ad(e, o));
        }));
    },
    mounted: sc,
    beforeUpdate(e, t, n) {
      ((e[_t] = Sn(n)), sc(e, t, n));
    },
  };
function sc(e, { value: t, oldValue: n }, r) {
  e._modelValue = t;
  let s;
  if (Y(t)) s = ds(t, r.props.value) > -1;
  else if (An(t)) s = t.has(r.props.value);
  else {
    if (t === n) return;
    s = en(t, Ad(e, !0));
  }
  e.checked !== s && (e.checked = s);
}
const Xa = {
    created(e, { value: t }, n) {
      ((e.checked = en(t, n.props.value)),
        (e[_t] = Sn(n)),
        zt(e, "change", () => {
          e[_t](dr(e));
        }));
    },
    beforeUpdate(e, { value: t, oldValue: n }, r) {
      ((e[_t] = Sn(r)), t !== n && (e.checked = en(t, r.props.value)));
    },
  },
  Sd = {
    deep: !0,
    created(e, { value: t, modifiers: { number: n } }, r) {
      const s = An(t);
      (zt(e, "change", () => {
        const o = Array.prototype.filter
          .call(e.options, (i) => i.selected)
          .map((i) => (n ? Yr(dr(i)) : dr(i)));
        (e[_t](e.multiple ? (s ? new Set(o) : o) : o[0]),
          (e._assigning = !0),
          jt(() => {
            e._assigning = !1;
          }));
      }),
        (e[_t] = Sn(r)));
    },
    mounted(e, { value: t }) {
      oc(e, t);
    },
    beforeUpdate(e, t, n) {
      e[_t] = Sn(n);
    },
    updated(e, { value: t }) {
      e._assigning || oc(e, t);
    },
  };
function oc(e, t) {
  const n = e.multiple,
    r = Y(t);
  if (!(n && !r && !An(t))) {
    for (let s = 0, o = e.options.length; s < o; s++) {
      const i = e.options[s],
        a = dr(i);
      if (n)
        if (r) {
          const l = typeof a;
          l === "string" || l === "number"
            ? (i.selected = t.some((u) => String(u) === String(a)))
            : (i.selected = ds(t, a) > -1);
        } else i.selected = t.has(a);
      else if (en(dr(i), t)) {
        e.selectedIndex !== s && (e.selectedIndex = s);
        return;
      }
    }
    !n && e.selectedIndex !== -1 && (e.selectedIndex = -1);
  }
}
function dr(e) {
  return "_value" in e ? e._value : e.value;
}
function Ad(e, t) {
  const n = t ? "_trueValue" : "_falseValue";
  return n in e ? e[n] : t;
}
const Rd = {
  created(e, t, n) {
    Ps(e, t, n, null, "created");
  },
  mounted(e, t, n) {
    Ps(e, t, n, null, "mounted");
  },
  beforeUpdate(e, t, n, r) {
    Ps(e, t, n, r, "beforeUpdate");
  },
  updated(e, t, n, r) {
    Ps(e, t, n, r, "updated");
  },
};
function Ld(e, t) {
  switch (e) {
    case "SELECT":
      return Sd;
    case "TEXTAREA":
      return oo;
    default:
      switch (t) {
        case "checkbox":
          return za;
        case "radio":
          return Xa;
        default:
          return oo;
      }
  }
}
function Ps(e, t, n, r, s) {
  const i = Ld(e.tagName, n.props && n.props.type)[s];
  i && i(e, t, n, r);
}
function l_() {
  ((oo.getSSRProps = ({ value: e }) => ({ value: e })),
    (Xa.getSSRProps = ({ value: e }, t) => {
      if (t.props && en(t.props.value, e)) return { checked: !0 };
    }),
    (za.getSSRProps = ({ value: e }, t) => {
      if (Y(e)) {
        if (t.props && ds(e, t.props.value) > -1) return { checked: !0 };
      } else if (An(e)) {
        if (t.props && e.has(t.props.value)) return { checked: !0 };
      } else if (e) return { checked: !0 };
    }),
    (Rd.getSSRProps = (e, t) => {
      if (typeof t.type != "string") return;
      const n = Ld(t.type.toUpperCase(), t.props && t.props.type);
      if (n.getSSRProps) return n.getSSRProps(e, t);
    }));
}
const c_ = ["ctrl", "shift", "alt", "meta"],
  u_ = {
    stop: (e) => e.stopPropagation(),
    prevent: (e) => e.preventDefault(),
    self: (e) => e.target !== e.currentTarget,
    ctrl: (e) => !e.ctrlKey,
    shift: (e) => !e.shiftKey,
    alt: (e) => !e.altKey,
    meta: (e) => !e.metaKey,
    left: (e) => "button" in e && e.button !== 0,
    middle: (e) => "button" in e && e.button !== 1,
    right: (e) => "button" in e && e.button !== 2,
    exact: (e, t) => c_.some((n) => e[`${n}Key`] && !t.includes(n)),
  },
  f_ = (e, t) => {
    const n = e._withMods || (e._withMods = {}),
      r = t.join(".");
    return (
      n[r] ||
      (n[r] = (s, ...o) => {
        for (let i = 0; i < t.length; i++) {
          const a = u_[t[i]];
          if (a && a(s, t)) return;
        }
        return e(s, ...o);
      })
    );
  },
  d_ = {
    esc: "escape",
    space: " ",
    up: "arrow-up",
    left: "arrow-left",
    right: "arrow-right",
    down: "arrow-down",
    delete: "backspace",
  },
  p_ = (e, t) => {
    const n = e._withKeys || (e._withKeys = {}),
      r = t.join(".");
    return (
      n[r] ||
      (n[r] = (s) => {
        if (!("key" in s)) return;
        const o = qe(s.key);
        if (t.some((i) => i === o || d_[i] === o)) return e(s);
      })
    );
  },
  Pd = ve({ patchProp: Yb }, Ob);
let Br,
  ic = !1;
function kd() {
  return Br || (Br = jf(Pd));
}
function Od() {
  return ((Br = ic ? Br : Vf(Pd)), (ic = !0), Br);
}
const Nd = (...e) => {
    kd().render(...e);
  },
  h_ = (...e) => {
    Od().hydrate(...e);
  },
  io = (...e) => {
    const t = kd().createApp(...e),
      { mount: n } = t;
    return (
      (t.mount = (r) => {
        const s = Md(r);
        if (!s) return;
        const o = t._component;
        (!Z(o) && !o.render && !o.template && (o.template = s.innerHTML),
          s.nodeType === 1 && (s.textContent = ""));
        const i = n(s, !1, Id(s));
        return (
          s instanceof Element &&
            (s.removeAttribute("v-cloak"), s.setAttribute("data-v-app", "")),
          i
        );
      }),
      t
    );
  },
  Ja = (...e) => {
    const t = Od().createApp(...e),
      { mount: n } = t;
    return (
      (t.mount = (r) => {
        const s = Md(r);
        if (s) return n(s, !0, Id(s));
      }),
      t
    );
  };
function Id(e) {
  if (e instanceof SVGElement) return "svg";
  if (typeof MathMLElement == "function" && e instanceof MathMLElement)
    return "mathml";
}
function Md(e) {
  return me(e) ? document.querySelector(e) : e;
}
let ac = !1;
const m_ = () => {
    ac || ((ac = !0), l_(), Db());
  },
  GC = Object.freeze(
    Object.defineProperty(
      {
        __proto__: null,
        BaseTransition: vf,
        BaseTransitionPropsValidators: Oa,
        Comment: Oe,
        DeprecationTypes: Lb,
        EffectScope: Ea,
        ErrorCodes: Um,
        ErrorTypeStrings: Eb,
        Fragment: ke,
        KeepAlive: wf,
        ReactiveEffect: Xr,
        Static: Vn,
        Suspense: xo,
        Teleport: Ym,
        Text: Zt,
        TrackOpTypes: Nm,
        Transition: md,
        TransitionGroup: n_,
        TriggerOpTypes: Im,
        VueElement: Do,
        assertNumber: $m,
        callWithAsyncErrorHandling: vt,
        callWithErrorHandling: Cr,
        camelize: He,
        capitalize: Er,
        cloneVNode: Vt,
        compatUtils: Rb,
        computed: Ce,
        createApp: io,
        createBlock: Tt,
        createCommentVNode: ub,
        createElementBlock: rd,
        createElementVNode: Wa,
        createHydrationRenderer: Vf,
        createPropsRestProxy: Og,
        createRenderer: jf,
        createSSRApp: Ja,
        createSlots: gg,
        createStaticVNode: cb,
        createTextVNode: Ga,
        createVNode: we,
        customRef: Ra,
        defineAsyncComponent: Ai,
        defineComponent: dt,
        defineCustomElement: Ed,
        defineEmits: Eg,
        defineExpose: wg,
        defineModel: Sg,
        defineOptions: Tg,
        defineProps: vg,
        defineSSRCustomElement: Xb,
        defineSlots: Cg,
        devtools: wb,
        effect: nm,
        effectScope: wo,
        getCurrentInstance: Ve,
        getCurrentScope: ps,
        getCurrentWatcher: Mm,
        getTransitionRawChildren: Po,
        guardReactiveProps: Ka,
        h: De,
        handleError: zn,
        hasInjectionContext: No,
        hydrate: h_,
        hydrateOnIdle: sg,
        hydrateOnInteraction: lg,
        hydrateOnMediaQuery: ag,
        hydrateOnVisible: ig,
        initCustomFormatter: _b,
        initDirectivesForSSR: m_,
        inject: Fe,
        isMemoSame: ud,
        isProxy: Ro,
        isReactive: wn,
        isReadonly: Ht,
        isRef: Se,
        isRuntimeOnly: mb,
        isShallow: ft,
        isVNode: on,
        markRaw: rf,
        mergeDefaults: Pg,
        mergeModels: kg,
        mergeProps: Ya,
        nextTick: jt,
        normalizeClass: Tr,
        normalizeProps: _a,
        normalizeStyle: wr,
        onActivated: Ia,
        onBeforeMount: Cf,
        onBeforeUnmount: Ar,
        onBeforeUpdate: xa,
        onDeactivated: Ma,
        onErrorCaptured: Da,
        onMounted: Sr,
        onRenderTracked: Rf,
        onRenderTriggered: Af,
        onScopeDispose: Ks,
        onServerPrefetch: Sf,
        onUnmounted: gs,
        onUpdated: Oo,
        onWatcherCleanup: lf,
        openBlock: ct,
        popScopeId: Wm,
        provide: Qt,
        proxyRefs: Aa,
        pushScopeId: Bm,
        queuePostFlushCb: Zr,
        reactive: an,
        readonly: Sa,
        ref: ze,
        registerRuntimeCompiler: hb,
        render: Nd,
        renderList: mg,
        renderSlot: bg,
        resolveComponent: pg,
        resolveDirective: hg,
        resolveDynamicComponent: Pf,
        resolveFilter: Ab,
        resolveTransitionHooks: cr,
        setBlockTracking: Ii,
        setDevtoolsHook: Tb,
        setTransitionHooks: sn,
        shallowReactive: St,
        shallowReadonly: wm,
        shallowRef: rn,
        ssrContextKey: Gf,
        ssrUtils: Sb,
        stop: rm,
        toDisplayString: va,
        toHandlerKey: sr,
        toHandlers: _g,
        toRaw: le,
        toRef: La,
        toRefs: Rm,
        toValue: of,
        transformVNodeArgs: ab,
        triggerRef: Cm,
        unref: te,
        useAttrs: Lg,
        useCssModule: Zb,
        useCssVars: Fb,
        useHost: wd,
        useId: Xm,
        useModel: zg,
        useSSRContext: qf,
        useShadowRoot: Qb,
        useSlots: Rg,
        useTemplateRef: Jm,
        useTransitionState: ka,
        vModelCheckbox: za,
        vModelDynamic: Rd,
        vModelRadio: Xa,
        vModelSelect: Sd,
        vModelText: oo,
        vShow: yd,
        version: fd,
        warn: vb,
        watch: rt,
        watchEffect: Yf,
        watchPostEffect: qg,
        watchSyncEffect: zf,
        withAsyncContext: Ng,
        withCtx: hs,
        withDefaults: Ag,
        withDirectives: Gm,
        withKeys: p_,
        withMemo: yb,
        withModifiers: f_,
        withScopeId: Km,
      },
      Symbol.toStringTag,
      { value: "Module" },
    ),
  ),
  g_ =
    /"(?:_|\\u0{2}5[Ff]){2}(?:p|\\u0{2}70)(?:r|\\u0{2}72)(?:o|\\u0{2}6[Ff])(?:t|\\u0{2}74)(?:o|\\u0{2}6[Ff])(?:_|\\u0{2}5[Ff]){2}"\s*:/,
  b_ =
    /"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/,
  __ = /^\s*["[{]|^\s*-?\d{1,16}(\.\d{1,17})?([Ee][+-]?\d+)?\s*$/;
function y_(e, t) {
  if (
    e === "__proto__" ||
    (e === "constructor" && t && typeof t == "object" && "prototype" in t)
  ) {
    v_(e);
    return;
  }
  return t;
}
function v_(e) {
  console.warn(`[destr] Dropping "${e}" key to prevent prototype pollution.`);
}
function ss(e, t = {}) {
  if (typeof e != "string") return e;
  if (e[0] === '"' && e[e.length - 1] === '"' && e.indexOf("\\") === -1)
    return e.slice(1, -1);
  const n = e.trim();
  if (n.length <= 9)
    switch (n.toLowerCase()) {
      case "true":
        return !0;
      case "false":
        return !1;
      case "undefined":
        return;
      case "null":
        return null;
      case "nan":
        return Number.NaN;
      case "infinity":
        return Number.POSITIVE_INFINITY;
      case "-infinity":
        return Number.NEGATIVE_INFINITY;
    }
  if (!__.test(e)) {
    if (t.strict) throw new SyntaxError("[destr] Invalid JSON");
    return e;
  }
  try {
    if (g_.test(e) || b_.test(e)) {
      if (t.strict) throw new Error("[destr] Possible prototype pollution");
      return JSON.parse(e, y_);
    }
    return JSON.parse(e);
  } catch (r) {
    if (t.strict) throw r;
    return e;
  }
}
const xd = /#/g,
  Dd = /&/g,
  Fd = /\//g,
  E_ = /=/g,
  w_ = /\?/g,
  Fo = /\+/g,
  T_ = /%5e/gi,
  C_ = /%60/gi,
  S_ = /%7c/gi,
  A_ = /%20/gi,
  R_ = /%252f/gi;
function $d(e) {
  return encodeURI("" + e).replace(S_, "|");
}
function Vi(e) {
  return $d(typeof e == "string" ? e : JSON.stringify(e))
    .replace(Fo, "%2B")
    .replace(A_, "+")
    .replace(xd, "%23")
    .replace(Dd, "%26")
    .replace(C_, "`")
    .replace(T_, "^")
    .replace(Fd, "%2F");
}
function fi(e) {
  return Vi(e).replace(E_, "%3D");
}
function L_(e) {
  return $d(e)
    .replace(xd, "%23")
    .replace(w_, "%3F")
    .replace(R_, "%2F")
    .replace(Dd, "%26")
    .replace(Fo, "%2B");
}
function qC(e) {
  return L_(e).replace(Fd, "%2F");
}
function pr(e = "") {
  try {
    return decodeURIComponent("" + e);
  } catch {
    return "" + e;
  }
}
function P_(e) {
  return pr(e.replace(Fo, " "));
}
function k_(e) {
  return pr(e.replace(Fo, " "));
}
function Qa(e = "") {
  const t = Object.create(null);
  e[0] === "?" && (e = e.slice(1));
  for (const n of e.split("&")) {
    const r = n.match(/([^=]+)=?(.*)/) || [];
    if (r.length < 2) continue;
    const s = P_(r[1]);
    if (s === "__proto__" || s === "constructor") continue;
    const o = k_(r[2] || "");
    t[s] === void 0
      ? (t[s] = o)
      : Array.isArray(t[s])
        ? t[s].push(o)
        : (t[s] = [t[s], o]);
  }
  return t;
}
function O_(e, t) {
  return (
    (typeof t == "number" || typeof t == "boolean") && (t = String(t)),
    t
      ? Array.isArray(t)
        ? t.map((n) => `${fi(e)}=${Vi(n)}`).join("&")
        : `${fi(e)}=${Vi(t)}`
      : fi(e)
  );
}
function N_(e) {
  return Object.keys(e)
    .filter((t) => e[t] !== void 0)
    .map((t) => O_(t, e[t]))
    .filter(Boolean)
    .join("&");
}
const I_ = /^[\s\w\0+.-]{2,}:([/\\]{1,2})/,
  M_ = /^[\s\w\0+.-]{2,}:([/\\]{2})?/,
  x_ = /^([/\\]\s*){2,}[^/\\]/,
  D_ = /^[\s\0]*(blob|data|javascript|vbscript):$/i,
  F_ = /\/$|\/\?|\/#/,
  $_ = /^\.?\//;
function Bt(e, t = {}) {
  return (
    typeof t == "boolean" && (t = { acceptRelative: t }),
    t.strict ? I_.test(e) : M_.test(e) || (t.acceptRelative ? x_.test(e) : !1)
  );
}
function U_(e) {
  return !!e && D_.test(e);
}
function Bi(e = "", t) {
  return t ? F_.test(e) : e.endsWith("/");
}
function hr(e = "", t) {
  if (!t) return (Bi(e) ? e.slice(0, -1) : e) || "/";
  if (!Bi(e, !0)) return e || "/";
  let n = e,
    r = "";
  const s = e.indexOf("#");
  s !== -1 && ((n = e.slice(0, s)), (r = e.slice(s)));
  const [o, ...i] = n.split("?");
  return (
    ((o.endsWith("/") ? o.slice(0, -1) : o) || "/") +
    (i.length > 0 ? `?${i.join("?")}` : "") +
    r
  );
}
function ao(e = "", t) {
  if (!t) return e.endsWith("/") ? e : e + "/";
  if (Bi(e, !0)) return e || "/";
  let n = e,
    r = "";
  const s = e.indexOf("#");
  if (s !== -1 && ((n = e.slice(0, s)), (r = e.slice(s)), !n)) return r;
  const [o, ...i] = n.split("?");
  return o + "/" + (i.length > 0 ? `?${i.join("?")}` : "") + r;
}
function H_(e = "") {
  return e.startsWith("/");
}
function lc(e = "") {
  return H_(e) ? e : "/" + e;
}
function j_(e, t) {
  if (Ud(t) || Bt(e)) return e;
  const n = hr(t);
  return e.startsWith(n) ? e : Xn(n, e);
}
function cc(e, t) {
  if (Ud(t)) return e;
  const n = hr(t);
  if (!e.startsWith(n)) return e;
  const r = e.slice(n.length);
  return r[0] === "/" ? r : "/" + r;
}
function $o(e, t) {
  const n = Vd(e),
    r = { ...Qa(n.search), ...t };
  return ((n.search = N_(r)), W_(n));
}
function Ud(e) {
  return !e || e === "/";
}
function V_(e) {
  return e && e !== "/";
}
function Xn(e, ...t) {
  let n = e || "";
  for (const r of t.filter((s) => V_(s)))
    if (n) {
      const s = r.replace($_, "");
      n = ao(n) + s;
    } else n = r;
  return n;
}
function Hd(...e) {
  var i, a, l, u;
  const t = /\/(?!\/)/,
    n = e.filter(Boolean),
    r = [];
  let s = 0;
  for (const c of n)
    if (!(!c || c === "/")) {
      for (const [f, d] of c.split(t).entries())
        if (!(!d || d === ".")) {
          if (d === "..") {
            if (r.length === 1 && Bt(r[0])) continue;
            (r.pop(), s--);
            continue;
          }
          if (f === 1 && (i = r[r.length - 1]) != null && i.endsWith(":/")) {
            r[r.length - 1] += "/" + d;
            continue;
          }
          (r.push(d), s++);
        }
    }
  let o = r.join("/");
  return (
    s >= 0
      ? (a = n[0]) != null && a.startsWith("/") && !o.startsWith("/")
        ? (o = "/" + o)
        : (l = n[0]) != null &&
          l.startsWith("./") &&
          !o.startsWith("./") &&
          (o = "./" + o)
      : (o = "../".repeat(-1 * s) + o),
    (u = n[n.length - 1]) != null &&
      u.endsWith("/") &&
      !o.endsWith("/") &&
      (o += "/"),
    o
  );
}
function B_(e, t) {
  return pr(hr(e)) === pr(hr(t));
}
function uc(e, t, n = {}) {
  return (
    n.trailingSlash || ((e = ao(e)), (t = ao(t))),
    n.leadingSlash || ((e = lc(e)), (t = lc(t))),
    n.encoding || ((e = pr(e)), (t = pr(t))),
    e === t
  );
}
const jd = Symbol.for("ufo:protocolRelative");
function Vd(e = "", t) {
  const n = e.match(/^[\s\0]*(blob:|data:|javascript:|vbscript:)(.*)/i);
  if (n) {
    const [, f, d = ""] = n;
    return {
      protocol: f.toLowerCase(),
      pathname: d,
      href: f + d,
      auth: "",
      host: "",
      search: "",
      hash: "",
    };
  }
  if (!Bt(e, { acceptRelative: !0 })) return Wi(e);
  const [, r = "", s, o = ""] =
    e.replace(/\\/g, "/").match(/^[\s\0]*([\w+.-]{2,}:)?\/\/([^/@]+@)?(.*)/) ||
    [];
  let [, i = "", a = ""] = o.match(/([^#/?]*)(.*)?/) || [];
  r === "file:" && (a = a.replace(/\/(?=[A-Za-z]:)/, ""));
  const { pathname: l, search: u, hash: c } = Wi(a);
  return {
    protocol: r.toLowerCase(),
    auth: s ? s.slice(0, Math.max(0, s.length - 1)) : "",
    host: i,
    pathname: l,
    search: u,
    hash: c,
    [jd]: !r,
  };
}
function Wi(e = "") {
  const [t = "", n = "", r = ""] = (
    e.match(/([^#?]*)(\?[^#]*)?(#.*)?/) || []
  ).splice(1);
  return { pathname: t, search: n, hash: r };
}
function W_(e) {
  const t = e.pathname || "",
    n = e.search ? (e.search.startsWith("?") ? "" : "?") + e.search : "",
    r = e.hash || "",
    s = e.auth ? e.auth + "@" : "",
    o = e.host || "";
  return (
    (e.protocol || e[jd] ? (e.protocol || "") + "//" : "") + s + o + t + n + r
  );
}
class K_ extends Error {
  constructor(t, n) {
    (super(t, n),
      (this.name = "FetchError"),
      n != null && n.cause && !this.cause && (this.cause = n.cause));
  }
}
function G_(e) {
  var l, u, c, f, d;
  const t =
      ((l = e.error) == null ? void 0 : l.message) ||
      ((u = e.error) == null ? void 0 : u.toString()) ||
      "",
    n =
      ((c = e.request) == null ? void 0 : c.method) ||
      ((f = e.options) == null ? void 0 : f.method) ||
      "GET",
    r = ((d = e.request) == null ? void 0 : d.url) || String(e.request) || "/",
    s = `[${n}] ${JSON.stringify(r)}`,
    o = e.response
      ? `${e.response.status} ${e.response.statusText}`
      : "<no response>",
    i = `${s}: ${o}${t ? ` ${t}` : ""}`,
    a = new K_(i, e.error ? { cause: e.error } : void 0);
  for (const p of ["request", "options", "response"])
    Object.defineProperty(a, p, {
      get() {
        return e[p];
      },
    });
  for (const [p, y] of [
    ["data", "_data"],
    ["status", "status"],
    ["statusCode", "status"],
    ["statusText", "statusText"],
    ["statusMessage", "statusText"],
  ])
    Object.defineProperty(a, p, {
      get() {
        return e.response && e.response[y];
      },
    });
  return a;
}
const q_ = new Set(Object.freeze(["PATCH", "POST", "PUT", "DELETE"]));
function fc(e = "GET") {
  return q_.has(e.toUpperCase());
}
function Y_(e) {
  if (e === void 0) return !1;
  const t = typeof e;
  return t === "string" || t === "number" || t === "boolean" || t === null
    ? !0
    : t !== "object"
      ? !1
      : Array.isArray(e)
        ? !0
        : e.buffer
          ? !1
          : (e.constructor && e.constructor.name === "Object") ||
            typeof e.toJSON == "function";
}
const z_ = new Set([
    "image/svg",
    "application/xml",
    "application/xhtml",
    "application/html",
  ]),
  X_ = /^application\/(?:[\w!#$%&*.^`~-]*\+)?json(;.+)?$/i;
function J_(e = "") {
  if (!e) return "json";
  const t = e.split(";").shift() || "";
  return X_.test(t)
    ? "json"
    : z_.has(t) || t.startsWith("text/")
      ? "text"
      : "blob";
}
function Q_(e, t, n, r) {
  const s = Z_(
    (t == null ? void 0 : t.headers) ?? (e == null ? void 0 : e.headers),
    n == null ? void 0 : n.headers,
    r,
  );
  let o;
  return (
    ((n != null && n.query) ||
      (n != null && n.params) ||
      (t != null && t.params) ||
      (t != null && t.query)) &&
      (o = {
        ...(n == null ? void 0 : n.params),
        ...(n == null ? void 0 : n.query),
        ...(t == null ? void 0 : t.params),
        ...(t == null ? void 0 : t.query),
      }),
    { ...n, ...t, query: o, params: o, headers: s }
  );
}
function Z_(e, t, n) {
  if (!t) return new n(e);
  const r = new n(t);
  if (e)
    for (const [s, o] of Symbol.iterator in e || Array.isArray(e)
      ? e
      : new n(e))
      r.set(s, o);
  return r;
}
async function ks(e, t) {
  if (t)
    if (Array.isArray(t)) for (const n of t) await n(e);
    else await t(e);
}
const ey = new Set([408, 409, 425, 429, 500, 502, 503, 504]),
  ty = new Set([101, 204, 205, 304]);
function Bd(e = {}) {
  const {
    fetch: t = globalThis.fetch,
    Headers: n = globalThis.Headers,
    AbortController: r = globalThis.AbortController,
  } = e;
  async function s(a) {
    const l =
      (a.error && a.error.name === "AbortError" && !a.options.timeout) || !1;
    if (a.options.retry !== !1 && !l) {
      let c;
      typeof a.options.retry == "number"
        ? (c = a.options.retry)
        : (c = fc(a.options.method) ? 0 : 1);
      const f = (a.response && a.response.status) || 500;
      if (
        c > 0 &&
        (Array.isArray(a.options.retryStatusCodes)
          ? a.options.retryStatusCodes.includes(f)
          : ey.has(f))
      ) {
        const d =
          typeof a.options.retryDelay == "function"
            ? a.options.retryDelay(a)
            : a.options.retryDelay || 0;
        return (
          d > 0 && (await new Promise((p) => setTimeout(p, d))),
          o(a.request, { ...a.options, retry: c - 1 })
        );
      }
    }
    const u = G_(a);
    throw (Error.captureStackTrace && Error.captureStackTrace(u, o), u);
  }
  const o = async function (l, u = {}) {
      const c = {
        request: l,
        options: Q_(l, u, e.defaults, n),
        response: void 0,
        error: void 0,
      };
      (c.options.method && (c.options.method = c.options.method.toUpperCase()),
        c.options.onRequest && (await ks(c, c.options.onRequest)),
        typeof c.request == "string" &&
          (c.options.baseURL && (c.request = j_(c.request, c.options.baseURL)),
          c.options.query &&
            ((c.request = $o(c.request, c.options.query)),
            delete c.options.query),
          "query" in c.options && delete c.options.query,
          "params" in c.options && delete c.options.params),
        c.options.body &&
          fc(c.options.method) &&
          (Y_(c.options.body)
            ? ((c.options.body =
                typeof c.options.body == "string"
                  ? c.options.body
                  : JSON.stringify(c.options.body)),
              (c.options.headers = new n(c.options.headers || {})),
              c.options.headers.has("content-type") ||
                c.options.headers.set("content-type", "application/json"),
              c.options.headers.has("accept") ||
                c.options.headers.set("accept", "application/json"))
            : (("pipeTo" in c.options.body &&
                typeof c.options.body.pipeTo == "function") ||
                typeof c.options.body.pipe == "function") &&
              ("duplex" in c.options || (c.options.duplex = "half"))));
      let f;
      if (!c.options.signal && c.options.timeout) {
        const p = new r();
        ((f = setTimeout(() => {
          const y = new Error(
            "[TimeoutError]: The operation was aborted due to timeout",
          );
          ((y.name = "TimeoutError"), (y.code = 23), p.abort(y));
        }, c.options.timeout)),
          (c.options.signal = p.signal));
      }
      try {
        c.response = await t(c.request, c.options);
      } catch (p) {
        return (
          (c.error = p),
          c.options.onRequestError && (await ks(c, c.options.onRequestError)),
          await s(c)
        );
      } finally {
        f && clearTimeout(f);
      }
      if (
        (c.response.body || c.response._bodyInit) &&
        !ty.has(c.response.status) &&
        c.options.method !== "HEAD"
      ) {
        const p =
          (c.options.parseResponse ? "json" : c.options.responseType) ||
          J_(c.response.headers.get("content-type") || "");
        switch (p) {
          case "json": {
            const y = await c.response.text(),
              h = c.options.parseResponse || ss;
            c.response._data = h(y);
            break;
          }
          case "stream": {
            c.response._data = c.response.body || c.response._bodyInit;
            break;
          }
          default:
            c.response._data = await c.response[p]();
        }
      }
      return (
        c.options.onResponse && (await ks(c, c.options.onResponse)),
        !c.options.ignoreResponseError &&
        c.response.status >= 400 &&
        c.response.status < 600
          ? (c.options.onResponseError &&
              (await ks(c, c.options.onResponseError)),
            await s(c))
          : c.response
      );
    },
    i = async function (l, u) {
      return (await o(l, u))._data;
    };
  return (
    (i.raw = o),
    (i.native = (...a) => t(...a)),
    (i.create = (a = {}, l = {}) =>
      Bd({ ...e, ...l, defaults: { ...e.defaults, ...l.defaults, ...a } })),
    i
  );
}
const lo = (function () {
    if (typeof globalThis < "u") return globalThis;
    if (typeof self < "u") return self;
    if (typeof window < "u") return window;
    if (typeof global < "u") return global;
    throw new Error("unable to locate global object");
  })(),
  ny = lo.fetch
    ? (...e) => lo.fetch(...e)
    : () =>
        Promise.reject(new Error("[ofetch] global.fetch is not supported!")),
  ry = lo.Headers,
  sy = lo.AbortController,
  oy = Bd({ fetch: ny, Headers: ry, AbortController: sy }),
  iy = oy,
  ay = () => {
    var e;
    return (
      ((e = window == null ? void 0 : window.__NUXT__) == null
        ? void 0
        : e.config) || {}
    );
  },
  co = ay().app,
  ly = () => co.baseURL,
  cy = () => co.buildAssetsDir,
  Za = (...e) => Hd(Wd(), cy(), ...e),
  Wd = (...e) => {
    const t = co.cdnURL || co.baseURL;
    return e.length ? Hd(t, ...e) : t;
  };
((globalThis.__buildAssetsURL = Za), (globalThis.__publicAssetsURL = Wd));
globalThis.$fetch || (globalThis.$fetch = iy.create({ baseURL: ly() }));
"global" in globalThis || (globalThis.global = globalThis);
function Ki(e, t = {}, n) {
  for (const r in e) {
    const s = e[r],
      o = n ? `${n}:${r}` : r;
    typeof s == "object" && s !== null
      ? Ki(s, t, o)
      : typeof s == "function" && (t[o] = s);
  }
  return t;
}
const uy = { run: (e) => e() },
  fy = () => uy,
  Kd = typeof console.createTask < "u" ? console.createTask : fy;
function dy(e, t) {
  const n = t.shift(),
    r = Kd(n);
  return e.reduce(
    (s, o) => s.then(() => r.run(() => o(...t))),
    Promise.resolve(),
  );
}
function py(e, t) {
  const n = t.shift(),
    r = Kd(n);
  return Promise.all(e.map((s) => r.run(() => s(...t))));
}
function di(e, t) {
  for (const n of [...e]) n(t);
}
class hy {
  constructor() {
    ((this._hooks = {}),
      (this._before = void 0),
      (this._after = void 0),
      (this._deprecatedMessages = void 0),
      (this._deprecatedHooks = {}),
      (this.hook = this.hook.bind(this)),
      (this.callHook = this.callHook.bind(this)),
      (this.callHookWith = this.callHookWith.bind(this)));
  }
  hook(t, n, r = {}) {
    if (!t || typeof n != "function") return () => {};
    const s = t;
    let o;
    for (; this._deprecatedHooks[t]; )
      ((o = this._deprecatedHooks[t]), (t = o.to));
    if (o && !r.allowDeprecated) {
      let i = o.message;
      (i ||
        (i =
          `${s} hook has been deprecated` +
          (o.to ? `, please use ${o.to}` : "")),
        this._deprecatedMessages || (this._deprecatedMessages = new Set()),
        this._deprecatedMessages.has(i) ||
          (console.warn(i), this._deprecatedMessages.add(i)));
    }
    if (!n.name)
      try {
        Object.defineProperty(n, "name", {
          get: () => "_" + t.replace(/\W+/g, "_") + "_hook_cb",
          configurable: !0,
        });
      } catch {}
    return (
      (this._hooks[t] = this._hooks[t] || []),
      this._hooks[t].push(n),
      () => {
        n && (this.removeHook(t, n), (n = void 0));
      }
    );
  }
  hookOnce(t, n) {
    let r,
      s = (...o) => (
        typeof r == "function" && r(),
        (r = void 0),
        (s = void 0),
        n(...o)
      );
    return ((r = this.hook(t, s)), r);
  }
  removeHook(t, n) {
    if (this._hooks[t]) {
      const r = this._hooks[t].indexOf(n);
      (r !== -1 && this._hooks[t].splice(r, 1),
        this._hooks[t].length === 0 && delete this._hooks[t]);
    }
  }
  deprecateHook(t, n) {
    this._deprecatedHooks[t] = typeof n == "string" ? { to: n } : n;
    const r = this._hooks[t] || [];
    delete this._hooks[t];
    for (const s of r) this.hook(t, s);
  }
  deprecateHooks(t) {
    Object.assign(this._deprecatedHooks, t);
    for (const n in t) this.deprecateHook(n, t[n]);
  }
  addHooks(t) {
    const n = Ki(t),
      r = Object.keys(n).map((s) => this.hook(s, n[s]));
    return () => {
      for (const s of r.splice(0, r.length)) s();
    };
  }
  removeHooks(t) {
    const n = Ki(t);
    for (const r in n) this.removeHook(r, n[r]);
  }
  removeAllHooks() {
    for (const t in this._hooks) delete this._hooks[t];
  }
  callHook(t, ...n) {
    return (n.unshift(t), this.callHookWith(dy, t, ...n));
  }
  callHookParallel(t, ...n) {
    return (n.unshift(t), this.callHookWith(py, t, ...n));
  }
  callHookWith(t, n, ...r) {
    const s =
      this._before || this._after ? { name: n, args: r, context: {} } : void 0;
    this._before && di(this._before, s);
    const o = t(n in this._hooks ? [...this._hooks[n]] : [], r);
    return o instanceof Promise
      ? o.finally(() => {
          this._after && s && di(this._after, s);
        })
      : (this._after && s && di(this._after, s), o);
  }
  beforeEach(t) {
    return (
      (this._before = this._before || []),
      this._before.push(t),
      () => {
        if (this._before !== void 0) {
          const n = this._before.indexOf(t);
          n !== -1 && this._before.splice(n, 1);
        }
      }
    );
  }
  afterEach(t) {
    return (
      (this._after = this._after || []),
      this._after.push(t),
      () => {
        if (this._after !== void 0) {
          const n = this._after.indexOf(t);
          n !== -1 && this._after.splice(n, 1);
        }
      }
    );
  }
}
function Gd() {
  return new hy();
}
function my(e = {}) {
  let t,
    n = !1;
  const r = (i) => {
    if (t && t !== i) throw new Error("Context conflict");
  };
  let s;
  if (e.asyncContext) {
    const i = e.AsyncLocalStorage || globalThis.AsyncLocalStorage;
    i
      ? (s = new i())
      : console.warn("[unctx] `AsyncLocalStorage` is not provided.");
  }
  const o = () => {
    if (s) {
      const i = s.getStore();
      if (i !== void 0) return i;
    }
    return t;
  };
  return {
    use: () => {
      const i = o();
      if (i === void 0) throw new Error("Context is not available");
      return i;
    },
    tryUse: () => o(),
    set: (i, a) => {
      (a || r(i), (t = i), (n = !0));
    },
    unset: () => {
      ((t = void 0), (n = !1));
    },
    call: (i, a) => {
      (r(i), (t = i));
      try {
        return s ? s.run(i, a) : a();
      } finally {
        n || (t = void 0);
      }
    },
    async callAsync(i, a) {
      t = i;
      const l = () => {
          t = i;
        },
        u = () => (t === i ? l : void 0);
      Gi.add(u);
      try {
        const c = s ? s.run(i, a) : a();
        return (n || (t = void 0), await c);
      } finally {
        Gi.delete(u);
      }
    },
  };
}
function gy(e = {}) {
  const t = {};
  return {
    get(n, r = {}) {
      return (t[n] || (t[n] = my({ ...e, ...r })), t[n]);
    },
  };
}
const uo =
    typeof globalThis < "u"
      ? globalThis
      : typeof self < "u"
        ? self
        : typeof global < "u"
          ? global
          : typeof window < "u"
            ? window
            : {},
  dc = "__unctx__",
  by = uo[dc] || (uo[dc] = gy()),
  _y = (e, t = {}) => by.get(e, t),
  pc = "__unctx_async_handlers__",
  Gi = uo[pc] || (uo[pc] = new Set());
function bt(e) {
  const t = [];
  for (const s of Gi) {
    const o = s();
    o && t.push(o);
  }
  const n = () => {
    for (const s of t) s();
  };
  let r = e();
  return (
    r &&
      typeof r == "object" &&
      "catch" in r &&
      (r = r.catch((s) => {
        throw (n(), s);
      })),
    [r, n]
  );
}
const yy = !1,
  hc = !1,
  vy = !1,
  YC = {
    componentName: "NuxtLink",
    prefetch: !0,
    prefetchOn: { visibility: !0 },
  },
  zC = { value: null, errorValue: null, deep: !0 },
  Ey = null,
  XC = {},
  wy = "#__nuxt",
  qd = "nuxt-app",
  mc = 36e5,
  Ty = "vite:preloadError";
function Yd(e = qd) {
  return _y(e, { asyncContext: !1 });
}
const Cy = "__nuxt_plugin";
function Sy(e) {
  var s;
  let t = 0;
  const n = {
    _id: e.id || qd || "nuxt-app",
    _scope: wo(),
    provide: void 0,
    globalName: "nuxt",
    versions: {
      get nuxt() {
        return "3.17.5";
      },
      get vue() {
        return n.vueApp.version;
      },
    },
    payload: St({
      ...(((s = e.ssrContext) == null ? void 0 : s.payload) || {}),
      data: St({}),
      state: an({}),
      once: new Set(),
      _errors: St({}),
    }),
    static: { data: {} },
    runWithContext(o) {
      return n._scope.active && !ps() ? n._scope.run(() => gc(n, o)) : gc(n, o);
    },
    isHydrating: !0,
    deferHydration() {
      if (!n.isHydrating) return () => {};
      t++;
      let o = !1;
      return () => {
        if (!o && ((o = !0), t--, t === 0))
          return ((n.isHydrating = !1), n.callHook("app:suspense:resolve"));
      };
    },
    _asyncDataPromises: {},
    _asyncData: St({}),
    _payloadRevivers: {},
    ...e,
  };
  {
    const o = window.__NUXT__;
    if (o)
      for (const i in o)
        switch (i) {
          case "data":
          case "state":
          case "_errors":
            Object.assign(n.payload[i], o[i]);
            break;
          default:
            n.payload[i] = o[i];
        }
  }
  ((n.hooks = Gd()),
    (n.hook = n.hooks.hook),
    (n.callHook = n.hooks.callHook),
    (n.provide = (o, i) => {
      const a = "$" + o;
      (Os(n, a, i), Os(n.vueApp.config.globalProperties, a, i));
    }),
    Os(n.vueApp, "$nuxt", n),
    Os(n.vueApp.config.globalProperties, "$nuxt", n));
  {
    (window.addEventListener(Ty, (i) => {
      (n.callHook("app:chunkError", { error: i.payload }),
        i.payload.message.includes("Unable to preload CSS") &&
          i.preventDefault());
    }),
      window.useNuxtApp || (window.useNuxtApp = be));
    const o = n.hook("app:error", (...i) => {
      console.error("[nuxt] error caught during app initialization", ...i);
    });
    n.hook("app:mounted", o);
  }
  const r = n.payload.config;
  return (n.provide("config", r), n);
}
function Ay(e, t) {
  t.hooks && e.hooks.addHooks(t.hooks);
}
async function Ry(e, t) {
  if (typeof t == "function") {
    const { provide: n } = (await e.runWithContext(() => t(e))) || {};
    if (n && typeof n == "object") for (const r in n) e.provide(r, n[r]);
  }
}
async function Ly(e, t) {
  const n = new Set(),
    r = [],
    s = [],
    o = [];
  let i = 0;
  async function a(l) {
    var c;
    const u =
      ((c = l.dependsOn) == null
        ? void 0
        : c.filter((f) => t.some((d) => d._name === f) && !n.has(f))) ?? [];
    if (u.length > 0) r.push([new Set(u), l]);
    else {
      const f = Ry(e, l).then(async () => {
        l._name &&
          (n.add(l._name),
          await Promise.all(
            r.map(async ([d, p]) => {
              d.has(l._name) &&
                (d.delete(l._name), d.size === 0 && (i++, await a(p)));
            }),
          ));
      });
      l.parallel ? s.push(f.catch((d) => o.push(d))) : await f;
    }
  }
  for (const l of t) Ay(e, l);
  for (const l of t) await a(l);
  if ((await Promise.all(s), i))
    for (let l = 0; l < i; l++) await Promise.all(s);
  if (o.length) throw o[0];
}
function ot(e) {
  if (typeof e == "function") return e;
  const t = e._name || e.name;
  return (
    delete e.name,
    Object.assign(e.setup || (() => {}), e, { [Cy]: !0, _name: t })
  );
}
function gc(e, t, n) {
  const r = () => t();
  return (Yd(e._id).set(e), e.vueApp.runWithContext(r));
}
function Py(e) {
  var n;
  let t;
  return (
    No() && (t = (n = Ve()) == null ? void 0 : n.appContext.app.$nuxt),
    t || (t = Yd(e).tryUse()),
    t || null
  );
}
function be(e) {
  const t = Py(e);
  if (!t) throw new Error("[nuxt] instance unavailable");
  return t;
}
function cn(e) {
  return be().$config;
}
function Os(e, t, n) {
  Object.defineProperty(e, t, { get: () => n });
}
function ky(e, t) {
  return { ctx: { table: e }, matchAll: (n) => Xd(n, e) };
}
function zd(e) {
  const t = {};
  for (const n in e)
    t[n] =
      n === "dynamic"
        ? new Map(Object.entries(e[n]).map(([r, s]) => [r, zd(s)]))
        : new Map(Object.entries(e[n]));
  return t;
}
function Oy(e) {
  return ky(zd(e));
}
function Xd(e, t, n) {
  e.endsWith("/") && (e = e.slice(0, -1) || "/");
  const r = [];
  for (const [o, i] of bc(t.wildcard))
    (e === o || e.startsWith(o + "/")) && r.push(i);
  for (const [o, i] of bc(t.dynamic))
    if (e.startsWith(o + "/")) {
      const a = "/" + e.slice(o.length).split("/").splice(2).join("/");
      r.push(...Xd(a, i));
    }
  const s = t.static.get(e);
  return (s && r.push(s), r.filter(Boolean));
}
function bc(e) {
  return [...e.entries()].sort((t, n) => t[0].length - n[0].length);
}
function pi(e) {
  if (e === null || typeof e != "object") return !1;
  const t = Object.getPrototypeOf(e);
  return (t !== null &&
    t !== Object.prototype &&
    Object.getPrototypeOf(t) !== null) ||
    Symbol.iterator in e
    ? !1
    : Symbol.toStringTag in e
      ? Object.prototype.toString.call(e) === "[object Module]"
      : !0;
}
function qi(e, t, n = ".", r) {
  if (!pi(t)) return qi(e, {}, n, r);
  const s = Object.assign({}, t);
  for (const o in e) {
    if (o === "__proto__" || o === "constructor") continue;
    const i = e[o];
    i != null &&
      ((r && r(s, o, i, n)) ||
        (Array.isArray(i) && Array.isArray(s[o])
          ? (s[o] = [...i, ...s[o]])
          : pi(i) && pi(s[o])
            ? (s[o] = qi(i, s[o], (n ? `${n}.` : "") + o.toString(), r))
            : (s[o] = i)));
  }
  return s;
}
function Ny(e) {
  return (...t) => t.reduce((n, r) => qi(n, r, "", e), {});
}
const Jd = Ny();
function Iy(e, t) {
  try {
    return t in e;
  } catch {
    return !1;
  }
}
class Yi extends Error {
  constructor(n, r = {}) {
    super(n, r);
    un(this, "statusCode", 500);
    un(this, "fatal", !1);
    un(this, "unhandled", !1);
    un(this, "statusMessage");
    un(this, "data");
    un(this, "cause");
    r.cause && !this.cause && (this.cause = r.cause);
  }
  toJSON() {
    const n = { message: this.message, statusCode: zi(this.statusCode, 500) };
    return (
      this.statusMessage && (n.statusMessage = Qd(this.statusMessage)),
      this.data !== void 0 && (n.data = this.data),
      n
    );
  }
}
un(Yi, "__h3_error__", !0);
function My(e) {
  if (typeof e == "string") return new Yi(e);
  if (xy(e)) return e;
  const t = new Yi(e.message ?? e.statusMessage ?? "", { cause: e.cause || e });
  if (Iy(e, "stack"))
    try {
      Object.defineProperty(t, "stack", {
        get() {
          return e.stack;
        },
      });
    } catch {
      try {
        t.stack = e.stack;
      } catch {}
    }
  if (
    (e.data && (t.data = e.data),
    e.statusCode
      ? (t.statusCode = zi(e.statusCode, t.statusCode))
      : e.status && (t.statusCode = zi(e.status, t.statusCode)),
    e.statusMessage
      ? (t.statusMessage = e.statusMessage)
      : e.statusText && (t.statusMessage = e.statusText),
    t.statusMessage)
  ) {
    const n = t.statusMessage;
    Qd(t.statusMessage) !== n &&
      console.warn(
        "[h3] Please prefer using `message` for longer error messages instead of `statusMessage`. In the future, `statusMessage` will be sanitized by default.",
      );
  }
  return (
    e.fatal !== void 0 && (t.fatal = e.fatal),
    e.unhandled !== void 0 && (t.unhandled = e.unhandled),
    t
  );
}
function xy(e) {
  var t;
  return (
    ((t = e == null ? void 0 : e.constructor) == null
      ? void 0
      : t.__h3_error__) === !0
  );
}
const Dy = /[^\u0009\u0020-\u007E]/g;
function Qd(e = "") {
  return e.replace(Dy, "");
}
function zi(e, t = 200) {
  return !e ||
    (typeof e == "string" && (e = Number.parseInt(e, 10)), e < 100 || e > 999)
    ? t
    : e;
}
const Zd = Symbol("layout-meta"),
  Gn = Symbol("route"),
  et = () => {
    var e;
    return (e = be()) == null ? void 0 : e.$router;
  },
  Uo = () => (No() ? Fe(Gn, be()._route) : be()._route);
const Fy = (e, t, n = {}) => {
    const r = be(),
      s = n.global || typeof e != "string",
      o = t;
    if (!o) {
      console.warn(
        "[nuxt] No route middleware passed to `addRouteMiddleware`.",
        e,
      );
      return;
    }
    s ? r._middleware.global.push(o) : (r._middleware.named[e] = o);
  },
  $y = () => {
    try {
      if (be()._processingMiddleware) return !0;
    } catch {
      return !1;
    }
    return !1;
  },
  Mn = (e, t) => {
    e || (e = "/");
    const n =
      typeof e == "string" ? e : "path" in e ? Uy(e) : et().resolve(e).href;
    if (t != null && t.open) {
      const { target: l = "_blank", windowFeatures: u = {} } = t.open,
        c = Object.entries(u)
          .filter(([f, d]) => d !== void 0)
          .map(([f, d]) => `${f.toLowerCase()}=${d}`)
          .join(", ");
      return (open(n, l, c), Promise.resolve());
    }
    const r = Bt(n, { acceptRelative: !0 }),
      s = (t == null ? void 0 : t.external) || r;
    if (s) {
      if (!(t != null && t.external))
        throw new Error(
          "Navigating to an external URL is not allowed by default. Use `navigateTo(url, { external: true })`.",
        );
      const { protocol: l } = new URL(n, window.location.href);
      if (l && U_(l))
        throw new Error(`Cannot navigate to a URL with '${l}' protocol.`);
    }
    const o = $y();
    if (!s && o) {
      if (t != null && t.replace) {
        if (typeof e == "string") {
          const { pathname: l, search: u, hash: c } = Vd(e);
          return {
            path: l,
            ...(u && { query: Qa(u) }),
            ...(c && { hash: c }),
            replace: !0,
          };
        }
        return { ...e, replace: !0 };
      }
      return e;
    }
    const i = et(),
      a = be();
    return s
      ? (a._scope.stop(),
        t != null && t.replace ? location.replace(n) : (location.href = n),
        o ? (a.isHydrating ? new Promise(() => {}) : !1) : Promise.resolve())
      : t != null && t.replace
        ? i.replace(e)
        : i.push(e);
  };
function Uy(e) {
  return $o(e.path || "", e.query || {}) + (e.hash || "");
}
const ep = "__nuxt_error",
  Ho = () => La(be().payload, "error"),
  xn = (e) => {
    const t = Bn(e);
    try {
      const n = be(),
        r = Ho();
      (n.hooks.callHook("app:error", t), r.value || (r.value = t));
    } catch {
      throw t;
    }
    return t;
  },
  Hy = async (e = {}) => {
    const t = be(),
      n = Ho();
    (t.callHook("app:error:cleared", e),
      e.redirect && (await et().replace(e.redirect)),
      (n.value = Ey));
  },
  tp = (e) => !!e && typeof e == "object" && ep in e,
  Bn = (e) => {
    const t = My(e);
    return (
      Object.defineProperty(t, ep, {
        value: !0,
        configurable: !1,
        writable: !1,
      }),
      t
    );
  };
function _c(e) {
  const t = Vy(e),
    n = new ArrayBuffer(t.length),
    r = new DataView(n);
  for (let s = 0; s < n.byteLength; s++) r.setUint8(s, t.charCodeAt(s));
  return n;
}
const jy = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function Vy(e) {
  e.length % 4 === 0 && (e = e.replace(/==?$/, ""));
  let t = "",
    n = 0,
    r = 0;
  for (let s = 0; s < e.length; s++)
    ((n <<= 6),
      (n |= jy.indexOf(e[s])),
      (r += 6),
      r === 24 &&
        ((t += String.fromCharCode((n & 16711680) >> 16)),
        (t += String.fromCharCode((n & 65280) >> 8)),
        (t += String.fromCharCode(n & 255)),
        (n = r = 0)));
  return (
    r === 12
      ? ((n >>= 4), (t += String.fromCharCode(n)))
      : r === 18 &&
        ((n >>= 2),
        (t += String.fromCharCode((n & 65280) >> 8)),
        (t += String.fromCharCode(n & 255))),
    t
  );
}
const By = -1,
  Wy = -2,
  Ky = -3,
  Gy = -4,
  qy = -5,
  Yy = -6;
function zy(e, t) {
  return Xy(JSON.parse(e), t);
}
function Xy(e, t) {
  if (typeof e == "number") return s(e, !0);
  if (!Array.isArray(e) || e.length === 0) throw new Error("Invalid input");
  const n = e,
    r = Array(n.length);
  function s(o, i = !1) {
    if (o === By) return;
    if (o === Ky) return NaN;
    if (o === Gy) return 1 / 0;
    if (o === qy) return -1 / 0;
    if (o === Yy) return -0;
    if (i) throw new Error("Invalid input");
    if (o in r) return r[o];
    const a = n[o];
    if (!a || typeof a != "object") r[o] = a;
    else if (Array.isArray(a))
      if (typeof a[0] == "string") {
        const l = a[0],
          u = t == null ? void 0 : t[l];
        if (u) return (r[o] = u(s(a[1])));
        switch (l) {
          case "Date":
            r[o] = new Date(a[1]);
            break;
          case "Set":
            const c = new Set();
            r[o] = c;
            for (let p = 1; p < a.length; p += 1) c.add(s(a[p]));
            break;
          case "Map":
            const f = new Map();
            r[o] = f;
            for (let p = 1; p < a.length; p += 2) f.set(s(a[p]), s(a[p + 1]));
            break;
          case "RegExp":
            r[o] = new RegExp(a[1], a[2]);
            break;
          case "Object":
            r[o] = Object(a[1]);
            break;
          case "BigInt":
            r[o] = BigInt(a[1]);
            break;
          case "null":
            const d = Object.create(null);
            r[o] = d;
            for (let p = 1; p < a.length; p += 2) d[a[p]] = s(a[p + 1]);
            break;
          case "Int8Array":
          case "Uint8Array":
          case "Uint8ClampedArray":
          case "Int16Array":
          case "Uint16Array":
          case "Int32Array":
          case "Uint32Array":
          case "Float32Array":
          case "Float64Array":
          case "BigInt64Array":
          case "BigUint64Array": {
            const p = globalThis[l],
              y = a[1],
              h = _c(y),
              S = new p(h);
            r[o] = S;
            break;
          }
          case "ArrayBuffer": {
            const p = a[1],
              y = _c(p);
            r[o] = y;
            break;
          }
          default:
            throw new Error(`Unknown type ${l}`);
        }
      } else {
        const l = new Array(a.length);
        r[o] = l;
        for (let u = 0; u < a.length; u += 1) {
          const c = a[u];
          c !== Wy && (l[u] = s(c));
        }
      }
    else {
      const l = {};
      r[o] = l;
      for (const u in a) {
        const c = a[u];
        l[u] = s(c);
      }
    }
    return r[o];
  }
  return s(0);
}
const Jy = new Set(["link", "style", "script", "noscript"]),
  Qy = new Set(["title", "titleTemplate", "script", "style", "noscript"]),
  yc = new Set(["base", "meta", "link", "style", "script", "noscript"]),
  Zy = new Set([
    "title",
    "base",
    "htmlAttrs",
    "bodyAttrs",
    "meta",
    "link",
    "style",
    "script",
    "noscript",
  ]),
  e0 = new Set([
    "base",
    "title",
    "titleTemplate",
    "bodyAttrs",
    "htmlAttrs",
    "templateParams",
  ]),
  t0 = new Set([
    "key",
    "tagPosition",
    "tagPriority",
    "tagDuplicateStrategy",
    "innerHTML",
    "textContent",
    "processTemplateParams",
  ]),
  n0 = new Set(["templateParams", "htmlAttrs", "bodyAttrs"]),
  r0 = new Set([
    "theme-color",
    "google-site-verification",
    "og",
    "article",
    "book",
    "profile",
    "twitter",
    "author",
  ]);
const s0 = ["name", "property", "http-equiv"],
  o0 = new Set(["viewport", "description", "keywords", "robots"]);
function np(e) {
  const t = e.split(":");
  return t.length ? r0.has(t[1]) : !1;
}
function Xi(e) {
  const { props: t, tag: n } = e;
  if (e0.has(n)) return n;
  if (n === "link" && t.rel === "canonical") return "canonical";
  if (t.charset) return "charset";
  if (e.tag === "meta") {
    for (const r of s0)
      if (t[r] !== void 0) {
        const s = t[r],
          o = s.includes(":"),
          i = o0.has(s),
          l = !(o || i) && e.key ? `:key:${e.key}` : "";
        return `${n}:${s}${l}`;
      }
  }
  if (e.key) return `${n}:key:${e.key}`;
  if (t.id) return `${n}:id:${t.id}`;
  if (Qy.has(n)) {
    const r = e.textContent || e.innerHTML;
    if (r) return `${n}:content:${r}`;
  }
}
function vc(e) {
  const t = e._h || e._d;
  if (t) return t;
  const n = e.textContent || e.innerHTML;
  return (
    n ||
    `${e.tag}:${Object.entries(e.props)
      .map(([r, s]) => `${r}:${String(s)}`)
      .join(",")}`
  );
}
function fo(e, t, n) {
  typeof e === "function" &&
    (!n || (n !== "titleTemplate" && !(n[0] === "o" && n[1] === "n"))) &&
    (e = e());
  let s;
  if ((t && (s = t(n, e)), Array.isArray(s))) return s.map((o) => fo(o, t));
  if ((s == null ? void 0 : s.constructor) === Object) {
    const o = {};
    for (const i of Object.keys(s)) o[i] = fo(s[i], t, i);
    return o;
  }
  return s;
}
function i0(e, t) {
  const n = e === "style" ? new Map() : new Set();
  function r(s) {
    const o = s.trim();
    if (o)
      if (e === "style") {
        const [i, ...a] = o.split(":").map((l) => l.trim());
        i && a.length && n.set(i, a.join(":"));
      } else
        o.split(" ")
          .filter(Boolean)
          .forEach((i) => n.add(i));
  }
  return (
    typeof t == "string"
      ? e === "style"
        ? t.split(";").forEach(r)
        : r(t)
      : Array.isArray(t)
        ? t.forEach((s) => r(s))
        : t &&
          typeof t == "object" &&
          Object.entries(t).forEach(([s, o]) => {
            o && o !== "false" && (e === "style" ? n.set(s.trim(), o) : r(s));
          }),
    n
  );
}
function rp(e, t) {
  return (
    (e.props = e.props || {}),
    t &&
      Object.entries(t).forEach(([n, r]) => {
        if (r === null) {
          e.props[n] = null;
          return;
        }
        if (n === "class" || n === "style") {
          e.props[n] = i0(n, r);
          return;
        }
        if (t0.has(n)) {
          if (
            ["textContent", "innerHTML"].includes(n) &&
            typeof r == "object"
          ) {
            let i = t.type;
            if (
              (t.type || (i = "application/json"),
              !(i != null && i.endsWith("json")) && i !== "speculationrules")
            )
              return;
            ((t.type = i), (e.props.type = i), (e[n] = JSON.stringify(r)));
          } else e[n] = r;
          return;
        }
        const s = String(r),
          o = n.startsWith("data-");
        s === "true" || s === ""
          ? (e.props[n] = o ? s : !0)
          : !r && o && s === "false"
            ? (e.props[n] = "false")
            : r !== void 0 && (e.props[n] = r);
      }),
    e
  );
}
function a0(e, t) {
  const n =
      typeof t == "object" && typeof t != "function"
        ? t
        : {
            [e === "script" || e === "noscript" || e === "style"
              ? "innerHTML"
              : "textContent"]: t,
          },
    r = rp({ tag: e, props: {} }, n);
  return (
    r.key && Jy.has(r.tag) && (r.props["data-hid"] = r._h = r.key),
    r.tag === "script" &&
      typeof r.innerHTML == "object" &&
      ((r.innerHTML = JSON.stringify(r.innerHTML)),
      (r.props.type = r.props.type || "application/json")),
    Array.isArray(r.props.content)
      ? r.props.content.map((s) => ({
          ...r,
          props: { ...r.props, content: s },
        }))
      : r
  );
}
function l0(e, t) {
  if (!e) return [];
  typeof e == "function" && (e = e());
  const n = (s, o) => {
    for (let i = 0; i < t.length; i++) o = t[i](s, o);
    return o;
  };
  e = n(void 0, e);
  const r = [];
  return (
    (e = fo(e, n)),
    Object.entries(e || {}).forEach(([s, o]) => {
      if (o !== void 0)
        for (const i of Array.isArray(o) ? o : [o]) r.push(a0(s, i));
    }),
    r.flat()
  );
}
const Ji = (e, t) => (e._w === t._w ? e._p - t._p : e._w - t._w),
  Ec = { base: -10, title: 10 },
  c0 = { critical: -8, high: -1, low: 2 },
  wc = {
    meta: { "content-security-policy": -30, charset: -20, viewport: -15 },
    link: {
      preconnect: 20,
      stylesheet: 60,
      preload: 70,
      modulepreload: 70,
      prefetch: 90,
      "dns-prefetch": 90,
      prerender: 90,
    },
    script: { async: 30, defer: 80, sync: 50 },
    style: { imported: 40, sync: 60 },
  },
  u0 = /@import/,
  Nr = (e) => e === "" || e === !0;
function f0(e, t) {
  var o;
  if (typeof t.tagPriority == "number") return t.tagPriority;
  let n = 100;
  const r = c0[t.tagPriority] || 0,
    s = e.resolvedOptions.disableCapoSorting
      ? { link: {}, script: {}, style: {} }
      : wc;
  if (t.tag in Ec) n = Ec[t.tag];
  else if (t.tag === "meta") {
    const i =
      t.props["http-equiv"] === "content-security-policy"
        ? "content-security-policy"
        : t.props.charset
          ? "charset"
          : t.props.name === "viewport"
            ? "viewport"
            : null;
    i && (n = wc.meta[i]);
  } else
    t.tag === "link" && t.props.rel
      ? (n = s.link[t.props.rel])
      : t.tag === "script"
        ? Nr(t.props.async)
          ? (n = s.script.async)
          : t.props.src &&
              !Nr(t.props.defer) &&
              !Nr(t.props.async) &&
              t.props.type !== "module" &&
              !((o = t.props.type) != null && o.endsWith("json"))
            ? (n = s.script.sync)
            : Nr(t.props.defer) &&
              t.props.src &&
              !Nr(t.props.async) &&
              (n = s.script.defer)
        : t.tag === "style" &&
          (n =
            t.innerHTML && u0.test(t.innerHTML)
              ? s.style.imported
              : s.style.sync);
  return (n || 100) + r;
}
function Tc(e, t) {
  const n = typeof t == "function" ? t(e) : t,
    r = n.key || String(e.plugins.size + 1);
  e.plugins.get(r) || (e.plugins.set(r, n), e.hooks.addHooks(n.hooks || {}));
}
function d0(e = {}) {
  var a;
  const t = Gd();
  t.addHooks(e.hooks || {});
  const n = !e.document,
    r = new Map(),
    s = new Map(),
    o = [],
    i = {
      _entryCount: 1,
      plugins: s,
      dirty: !1,
      resolvedOptions: e,
      hooks: t,
      ssr: n,
      entries: r,
      headEntries() {
        return [...r.values()];
      },
      use: (l) => Tc(i, l),
      push(l, u) {
        const c = { ...(u || {}) };
        delete c.head;
        const f = c._index ?? i._entryCount++,
          d = { _i: f, input: l, options: c },
          p = {
            _poll(y = !1) {
              ((i.dirty = !0),
                !y && o.push(f),
                t.callHook("entries:updated", i));
            },
            dispose() {
              r.delete(f) && p._poll(!0);
            },
            patch(y) {
              (!c.mode ||
                (c.mode === "server" && n) ||
                (c.mode === "client" && !n)) &&
                ((d.input = y), r.set(f, d), p._poll());
            },
          };
        return (p.patch(l), p);
      },
      async resolveTags() {
        var p;
        const l = {
          tagMap: new Map(),
          tags: [],
          entries: [...i.entries.values()],
        };
        for (await t.callHook("entries:resolve", l); o.length; ) {
          const y = o.shift(),
            h = r.get(y);
          if (h) {
            const S = {
              tags: l0(h.input, e.propResolvers || []).map((g) =>
                Object.assign(g, h.options),
              ),
              entry: h,
            };
            (await t.callHook("entries:normalize", S),
              (h._tags = S.tags.map(
                (g, E) => (
                  (g._w = f0(i, g)),
                  (g._p = (h._i << 10) + E),
                  (g._d = Xi(g)),
                  g
                ),
              )));
          }
        }
        let u = !1;
        l.entries
          .flatMap((y) =>
            (y._tags || []).map((h) => ({ ...h, props: { ...h.props } })),
          )
          .sort(Ji)
          .reduce((y, h) => {
            const S = String(h._d || h._p);
            if (!y.has(S)) return y.set(S, h);
            const g = y.get(S);
            if (
              ((h == null ? void 0 : h.tagDuplicateStrategy) ||
                (n0.has(h.tag) ? "merge" : null) ||
                (h.key && h.key === g.key ? "merge" : null)) === "merge"
            ) {
              const m = { ...g.props };
              (Object.entries(h.props).forEach(
                ([b, C]) =>
                  (m[b] =
                    b === "style"
                      ? new Map([...(g.props.style || new Map()), ...C])
                      : b === "class"
                        ? new Set([...(g.props.class || new Set()), ...C])
                        : C),
              ),
                y.set(S, { ...h, props: m }));
            } else
              h._p >> 10 === g._p >> 10 && h.tag === "meta" && np(S)
                ? (y.set(
                    S,
                    Object.assign([...(Array.isArray(g) ? g : [g]), h], h),
                  ),
                  (u = !0))
                : (h._w === g._w
                    ? h._p > g._p
                    : (h == null ? void 0 : h._w) <
                      (g == null ? void 0 : g._w)) && y.set(S, h);
            return y;
          }, l.tagMap);
        const c = l.tagMap.get("title"),
          f = l.tagMap.get("titleTemplate");
        if (((i._title = c == null ? void 0 : c.textContent), f)) {
          const y = f == null ? void 0 : f.textContent;
          if (((i._titleTemplate = y), y)) {
            let h =
              typeof y == "function"
                ? y(c == null ? void 0 : c.textContent)
                : y;
            (typeof h == "string" &&
              !i.plugins.has("template-params") &&
              (h = h.replace("%s", (c == null ? void 0 : c.textContent) || "")),
              c
                ? h === null
                  ? l.tagMap.delete("title")
                  : l.tagMap.set("title", { ...c, textContent: h })
                : ((f.tag = "title"), (f.textContent = h)));
          }
        }
        ((l.tags = Array.from(l.tagMap.values())),
          u && (l.tags = l.tags.flat().sort(Ji)),
          await t.callHook("tags:beforeResolve", l),
          await t.callHook("tags:resolve", l),
          await t.callHook("tags:afterResolve", l));
        const d = [];
        for (const y of l.tags) {
          const { innerHTML: h, tag: S, props: g } = y;
          if (
            Zy.has(S) &&
            !(Object.keys(g).length === 0 && !y.innerHTML && !y.textContent) &&
            !(S === "meta" && !g.content && !g["http-equiv"] && !g.charset)
          ) {
            if (S === "script" && h) {
              if ((p = g.type) != null && p.endsWith("json")) {
                const E = typeof h == "string" ? h : JSON.stringify(h);
                y.innerHTML = E.replace(/</g, "\\u003C");
              } else
                typeof h == "string" &&
                  (y.innerHTML = h.replace(
                    new RegExp(`</${S}`, "g"),
                    `<\\/${S}`,
                  ));
              y._d = Xi(y);
            }
            d.push(y);
          }
        }
        return d;
      },
    };
  return (
    ((e == null ? void 0 : e.plugins) || []).forEach((l) => Tc(i, l)),
    i.hooks.callHook("init", i),
    (a = e.init) == null || a.forEach((l) => l && i.push(l)),
    i
  );
}
const _n = "%separator",
  p0 = new RegExp(`${_n}(?:\\s*${_n})*`, "g");
function h0(e, t, n = !1) {
  var s;
  let r;
  if (t === "s" || t === "pageTitle") r = e.pageTitle;
  else if (t.includes(".")) {
    const o = t.indexOf(".");
    r = (s = e[t.substring(0, o)]) == null ? void 0 : s[t.substring(o + 1)];
  } else r = e[t];
  if (r !== void 0)
    return n
      ? (r || "")
          .replace(/\\/g, "\\\\")
          .replace(/</g, "\\u003C")
          .replace(/"/g, '\\"')
      : r || "";
}
function Ns(e, t, n, r = !1) {
  if (typeof e != "string" || !e.includes("%")) return e;
  let s = e;
  try {
    s = decodeURI(e);
  } catch {}
  const o = s.match(/%\w+(?:\.\w+)?/g);
  if (!o) return e;
  const i = e.includes(_n);
  return (
    (e = e
      .replace(/%\w+(?:\.\w+)?/g, (a) => {
        if (a === _n || !o.includes(a)) return a;
        const l = h0(t, a.slice(1), r);
        return l !== void 0 ? l : a;
      })
      .trim()),
    i &&
      (e.endsWith(_n) && (e = e.slice(0, -_n.length)),
      e.startsWith(_n) && (e = e.slice(_n.length)),
      (e = e.replace(p0, n || "").trim())),
    e
  );
}
const Cc = (e) => (e.includes(":key") ? e : e.split(":").join(":key:")),
  m0 = {
    key: "aliasSorting",
    hooks: {
      "tags:resolve": (e) => {
        let t = !1;
        for (const n of e.tags) {
          const r = n.tagPriority;
          if (!r) continue;
          const s = String(r);
          if (s.startsWith("before:")) {
            const o = Cc(s.slice(7)),
              i = e.tagMap.get(o);
            i &&
              (typeof i.tagPriority == "number" &&
                (n.tagPriority = i.tagPriority),
              (n._p = i._p - 1),
              (t = !0));
          } else if (s.startsWith("after:")) {
            const o = Cc(s.slice(6)),
              i = e.tagMap.get(o);
            i &&
              (typeof i.tagPriority == "number" &&
                (n.tagPriority = i.tagPriority),
              (n._p = i._p + 1),
              (t = !0));
          }
        }
        t && (e.tags = e.tags.sort(Ji));
      },
    },
  },
  g0 = {
    key: "deprecations",
    hooks: {
      "entries:normalize": ({ tags: e }) => {
        for (const t of e)
          (t.props.children &&
            ((t.innerHTML = t.props.children), delete t.props.children),
            t.props.hid && ((t.key = t.props.hid), delete t.props.hid),
            t.props.vmid && ((t.key = t.props.vmid), delete t.props.vmid),
            t.props.body &&
              ((t.tagPosition = "bodyClose"), delete t.props.body));
      },
    },
  };
async function Qi(e) {
  if (typeof e === "function") return e;
  if (e instanceof Promise) return await e;
  if (Array.isArray(e)) return await Promise.all(e.map((n) => Qi(n)));
  if ((e == null ? void 0 : e.constructor) === Object) {
    const n = {};
    for (const r of Object.keys(e)) n[r] = await Qi(e[r]);
    return n;
  }
  return e;
}
const b0 = {
    key: "promises",
    hooks: {
      "entries:resolve": async (e) => {
        const t = [];
        for (const n in e.entries)
          e.entries[n]._promisesProcessed ||
            t.push(
              Qi(e.entries[n].input).then((r) => {
                ((e.entries[n].input = r),
                  (e.entries[n]._promisesProcessed = !0));
              }),
            );
        await Promise.all(t);
      },
    },
  },
  _0 = { meta: "content", link: "href", htmlAttrs: "lang" },
  y0 = ["innerHTML", "textContent"],
  v0 = (e) => ({
    key: "template-params",
    hooks: {
      "entries:normalize": (t) => {
        var r, s, o;
        const n =
          ((s =
            (r = t.tags.filter(
              (i) => i.tag === "templateParams" && i.mode === "server",
            )) == null
              ? void 0
              : r[0]) == null
            ? void 0
            : s.props) || {};
        Object.keys(n).length &&
          (e._ssrPayload = {
            templateParams: {
              ...(((o = e._ssrPayload) == null ? void 0 : o.templateParams) ||
                {}),
              ...n,
            },
          });
      },
      "tags:resolve": ({ tagMap: t, tags: n }) => {
        var o;
        const r =
            ((o = t.get("templateParams")) == null ? void 0 : o.props) || {},
          s = r.separator || "|";
        (delete r.separator,
          (r.pageTitle = Ns(r.pageTitle || e._title || "", r, s)));
        for (const i of n) {
          if (i.processTemplateParams === !1) continue;
          const a = _0[i.tag];
          if (a && typeof i.props[a] == "string")
            i.props[a] = Ns(i.props[a], r, s);
          else if (
            i.processTemplateParams ||
            i.tag === "titleTemplate" ||
            i.tag === "title"
          )
            for (const l of y0)
              typeof i[l] == "string" &&
                (i[l] = Ns(
                  i[l],
                  r,
                  s,
                  i.tag === "script" && i.props.type.endsWith("json"),
                ));
        }
        ((e._templateParams = r), (e._separator = s));
      },
      "tags:afterResolve": ({ tagMap: t }) => {
        const n = t.get("title");
        n != null &&
          n.textContent &&
          n.processTemplateParams !== !1 &&
          (n.textContent = Ns(n.textContent, e._templateParams, e._separator));
      },
    },
  }),
  E0 = (e, t) => (Se(t) ? of(t) : t),
  sp = "usehead";
function w0(e) {
  return {
    install(n) {
      ((n.config.globalProperties.$unhead = e),
        (n.config.globalProperties.$head = e),
        n.provide(sp, e));
    },
  }.install;
}
function T0() {
  if (No()) {
    const e = Fe(sp);
    if (!e)
      throw new Error(
        "useHead() was called without provide context, ensure you call it through the setup() function.",
      );
    return e;
  }
  throw new Error(
    "useHead() was called without provide context, ensure you call it through the setup() function.",
  );
}
function JC(e, t = {}) {
  const n = t.head || T0();
  return n.ssr ? n.push(e || {}, t) : C0(n, e, t);
}
function C0(e, t, n = {}) {
  const r = ze(!1);
  let s;
  return (
    Yf(() => {
      const i = r.value ? {} : fo(t, E0);
      s ? s.patch(i) : (s = e.push(i, n));
    }),
    Ve() &&
      (Ar(() => {
        s.dispose();
      }),
      Ma(() => {
        r.value = !0;
      }),
      Ia(() => {
        r.value = !1;
      })),
    s
  );
}
const S0 = "modulepreload",
  A0 = function (e, t) {
    return new URL(e, t).href;
  },
  Sc = {},
  yn = function (t, n, r) {
    let s = Promise.resolve();
    if (n && n.length > 0) {
      let i = function (c) {
        return Promise.all(
          c.map((f) =>
            Promise.resolve(f).then(
              (d) => ({ status: "fulfilled", value: d }),
              (d) => ({ status: "rejected", reason: d }),
            ),
          ),
        );
      };
      const a = document.getElementsByTagName("link"),
        l = document.querySelector("meta[property=csp-nonce]"),
        u =
          (l == null ? void 0 : l.nonce) ||
          (l == null ? void 0 : l.getAttribute("nonce"));
      s = i(
        n.map((c) => {
          if (((c = A0(c, r)), c in Sc)) return;
          Sc[c] = !0;
          const f = c.endsWith(".css"),
            d = f ? '[rel="stylesheet"]' : "";
          if (!!r)
            for (let h = a.length - 1; h >= 0; h--) {
              const S = a[h];
              if (S.href === c && (!f || S.rel === "stylesheet")) return;
            }
          else if (document.querySelector(`link[href="${c}"]${d}`)) return;
          const y = document.createElement("link");
          if (
            ((y.rel = f ? "stylesheet" : S0),
            f || (y.as = "script"),
            (y.crossOrigin = ""),
            (y.href = c),
            u && y.setAttribute("nonce", u),
            document.head.appendChild(y),
            f)
          )
            return new Promise((h, S) => {
              (y.addEventListener("load", h),
                y.addEventListener("error", () =>
                  S(new Error(`Unable to preload CSS for ${c}`)),
                ));
            });
        }),
      );
    }
    function o(i) {
      const a = new Event("vite:preloadError", { cancelable: !0 });
      if (((a.payload = i), window.dispatchEvent(a), !a.defaultPrevented))
        throw i;
    }
    return s.then((i) => {
      for (const a of i || []) a.status === "rejected" && o(a.reason);
      return t().catch(o);
    });
  };
let Vs, Bs;
function R0() {
  return (
    (Vs = $fetch(Za(`builds/meta/${cn().app.buildId}.json`), {
      responseType: "json",
    })),
    Vs.then((e) => {
      Bs = Oy(e.matcher);
    }).catch((e) => {
      console.error("[nuxt] Error fetching app manifest.", e);
    }),
    Vs
  );
}
function jo() {
  return Vs || R0();
}
async function el(e) {
  const t = typeof e == "string" ? e : e.path;
  if ((await jo(), !Bs))
    return (
      console.error("[nuxt] Error creating app manifest matcher.", Bs),
      {}
    );
  try {
    return Jd({}, ...Bs.matchAll(t).reverse());
  } catch (n) {
    return (console.error("[nuxt] Error matching route rules.", n), {});
  }
}
async function Ac(e, t = {}) {
  if (!(await ip(e))) return null;
  const r = await P0(e, t);
  return (await op(r)) || null;
}
const L0 = "_payload.json";
async function P0(e, t = {}) {
  const n = new URL(e, "http://localhost");
  if (n.host !== "localhost" || Bt(n.pathname, { acceptRelative: !0 }))
    throw new Error("Payload URL must not include hostname: " + e);
  const r = cn(),
    s = t.hash || (t.fresh ? Date.now() : r.app.buildId),
    o = r.app.cdnURL,
    i = o && (await ip(e)) ? o : r.app.baseURL;
  return Xn(i, n.pathname, L0 + (s ? `?${s}` : ""));
}
async function op(e) {
  const t = fetch(e, { cache: "force-cache" }).then((n) => n.text().then(ap));
  try {
    return await t;
  } catch (n) {
    console.warn("[nuxt] Cannot load payload ", e, n);
  }
  return null;
}
async function ip(e = Uo().path) {
  const t = be();
  return (
    (e = hr(e)),
    (await jo()).prerendered.includes(e)
      ? !0
      : t.runWithContext(async () => {
          const r = await el({ path: e });
          return !!r.prerender && !r.redirect;
        })
  );
}
let In = null;
async function k0() {
  var r;
  if (In) return In;
  const e = document.getElementById("__NUXT_DATA__");
  if (!e) return {};
  const t = await ap(e.textContent || ""),
    n = e.dataset.src ? await op(e.dataset.src) : void 0;
  return (
    (In = { ...t, ...n, ...window.__NUXT__ }),
    (r = In.config) != null &&
      r.public &&
      (In.config.public = an(In.config.public)),
    In
  );
}
async function ap(e) {
  return await zy(e, be()._payloadRevivers);
}
function O0(e, t) {
  be()._payloadRevivers[e] = t;
}
const N0 = [
    ["NuxtError", (e) => Bn(e)],
    [
      "EmptyShallowRef",
      (e) => rn(e === "_" ? void 0 : e === "0n" ? BigInt(0) : ss(e)),
    ],
    [
      "EmptyRef",
      (e) => ze(e === "_" ? void 0 : e === "0n" ? BigInt(0) : ss(e)),
    ],
    ["ShallowRef", (e) => rn(e)],
    ["ShallowReactive", (e) => St(e)],
    ["Ref", (e) => ze(e)],
    ["Reactive", (e) => an(e)],
  ],
  I0 = ot({
    name: "nuxt:revive-payload:client",
    order: -30,
    async setup(e) {
      let t, n;
      for (const [r, s] of N0) O0(r, s);
      (Object.assign(
        e.payload,
        (([t, n] = bt(() => e.runWithContext(k0))), (t = await t), n(), t),
      ),
        (window.__NUXT__ = e.payload));
    },
  });
async function tl(e, t = {}) {
  const n = t.document || e.resolvedOptions.document;
  if (!n || !e.dirty) return;
  const r = { shouldRender: !0, tags: [] };
  if ((await e.hooks.callHook("dom:beforeRender", r), !!r.shouldRender))
    return (
      e._domUpdatePromise ||
        (e._domUpdatePromise = new Promise(async (s) => {
          var p;
          const o = new Map(),
            i = new Promise((y) => {
              e.resolveTags().then((h) => {
                y(
                  h.map((S) => {
                    const g = o.get(S._d) || 0,
                      E = {
                        tag: S,
                        id: (g ? `${S._d}:${g}` : S._d) || vc(S),
                        shouldRender: !0,
                      };
                    return (S._d && np(S._d) && o.set(S._d, g + 1), E);
                  }),
                );
              });
            });
          let a = e._dom;
          if (!a) {
            a = {
              title: n.title,
              elMap: new Map()
                .set("htmlAttrs", n.documentElement)
                .set("bodyAttrs", n.body),
            };
            for (const y of ["body", "head"]) {
              const h = (p = n[y]) == null ? void 0 : p.children;
              for (const S of h) {
                const g = S.tagName.toLowerCase();
                if (!yc.has(g)) continue;
                const E = rp(
                  { tag: g, props: {} },
                  {
                    innerHTML: S.innerHTML,
                    ...(S.getAttributeNames().reduce(
                      (m, b) => ((m[b] = S.getAttribute(b)), m),
                      {},
                    ) || {}),
                  },
                );
                if (
                  ((E.key = S.getAttribute("data-hid") || void 0),
                  (E._d = Xi(E) || vc(E)),
                  a.elMap.has(E._d))
                ) {
                  let m = 1,
                    b = E._d;
                  for (; a.elMap.has(b); ) b = `${E._d}:${m++}`;
                  a.elMap.set(b, S);
                } else a.elMap.set(E._d, S);
              }
            }
          }
          ((a.pendingSideEffects = { ...a.sideEffects }), (a.sideEffects = {}));
          function l(y, h, S) {
            const g = `${y}:${h}`;
            ((a.sideEffects[g] = S), delete a.pendingSideEffects[g]);
          }
          function u({ id: y, $el: h, tag: S }) {
            const g = S.tag.endsWith("Attrs");
            (a.elMap.set(y, h),
              g ||
                (S.textContent &&
                  S.textContent !== h.textContent &&
                  (h.textContent = S.textContent),
                S.innerHTML &&
                  S.innerHTML !== h.innerHTML &&
                  (h.innerHTML = S.innerHTML),
                l(y, "el", () => {
                  (h == null || h.remove(), a.elMap.delete(y));
                })));
            for (const E in S.props) {
              if (!Object.prototype.hasOwnProperty.call(S.props, E)) continue;
              const m = S.props[E];
              if (E.startsWith("on") && typeof m == "function") {
                const C = h == null ? void 0 : h.dataset;
                if (C && C[`${E}fired`]) {
                  const L = E.slice(0, -5);
                  m.call(h, new Event(L.substring(2)));
                }
                h.getAttribute(`data-${E}`) !== "" &&
                  ((S.tag === "bodyAttrs" ? n.defaultView : h).addEventListener(
                    E.substring(2),
                    m.bind(h),
                  ),
                  h.setAttribute(`data-${E}`, ""));
                continue;
              }
              const b = `attr:${E}`;
              if (E === "class") {
                if (!m) continue;
                for (const C of m)
                  (g && l(y, `${b}:${C}`, () => h.classList.remove(C)),
                    !h.classList.contains(C) && h.classList.add(C));
              } else if (E === "style") {
                if (!m) continue;
                for (const [C, L] of m)
                  (l(y, `${b}:${C}`, () => {
                    h.style.removeProperty(C);
                  }),
                    h.style.setProperty(C, L));
              } else
                m !== !1 &&
                  m !== null &&
                  (h.getAttribute(E) !== m &&
                    h.setAttribute(E, m === !0 ? "" : String(m)),
                  g && l(y, b, () => h.removeAttribute(E)));
            }
          }
          const c = [],
            f = { bodyClose: void 0, bodyOpen: void 0, head: void 0 },
            d = await i;
          for (const y of d) {
            const { tag: h, shouldRender: S, id: g } = y;
            if (S) {
              if (h.tag === "title") {
                ((n.title = h.textContent),
                  l("title", "", () => (n.title = a.title)));
                continue;
              }
              ((y.$el = y.$el || a.elMap.get(g)),
                y.$el ? u(y) : yc.has(h.tag) && c.push(y));
            }
          }
          for (const y of c) {
            const h = y.tag.tagPosition || "head";
            ((y.$el = n.createElement(y.tag.tag)),
              u(y),
              (f[h] = f[h] || n.createDocumentFragment()),
              f[h].appendChild(y.$el));
          }
          for (const y of d) await e.hooks.callHook("dom:renderTag", y, n, l);
          (f.head && n.head.appendChild(f.head),
            f.bodyOpen && n.body.insertBefore(f.bodyOpen, n.body.firstChild),
            f.bodyClose && n.body.appendChild(f.bodyClose));
          for (const y in a.pendingSideEffects) a.pendingSideEffects[y]();
          ((e._dom = a),
            await e.hooks.callHook("dom:rendered", { renders: d }),
            s());
        }).finally(() => {
          ((e._domUpdatePromise = void 0), (e.dirty = !1));
        })),
      e._domUpdatePromise
    );
}
function M0(e = {}) {
  var r, s, o;
  const t = ((r = e.domOptions) == null ? void 0 : r.render) || tl;
  e.document = e.document || (typeof window < "u" ? document : void 0);
  const n =
    ((o =
      (s = e.document) == null
        ? void 0
        : s.head.querySelector('script[id="unhead:payload"]')) == null
      ? void 0
      : o.innerHTML) || !1;
  return d0({
    ...e,
    plugins: [
      ...(e.plugins || []),
      { key: "client", hooks: { "entries:updated": t } },
    ],
    init: [n ? JSON.parse(n) : !1, ...(e.init || [])],
  });
}
function x0(e, t) {
  let n = 0;
  return () => {
    const r = ++n;
    t(() => {
      n === r && e();
    });
  };
}
function D0(e = {}) {
  const t = M0({
    domOptions: {
      render: x0(
        () => tl(t),
        (n) => setTimeout(n, 0),
      ),
    },
    ...e,
  });
  return ((t.install = w0(t)), t);
}
const F0 = {
    disableDefaults: !0,
    disableCapoSorting: !1,
    plugins: [g0, b0, v0, m0],
  },
  $0 = ot({
    name: "nuxt:head",
    enforce: "pre",
    setup(e) {
      const t = D0(F0);
      e.vueApp.use(t);
      {
        let n = !0;
        const r = async () => {
          ((n = !1), await tl(t));
        };
        (t.hooks.hook("dom:beforeRender", (s) => {
          s.shouldRender = !n;
        }),
          e.hooks.hook("page:start", () => {
            n = !0;
          }),
          e.hooks.hook("page:finish", () => {
            e.isHydrating || r();
          }),
          e.hooks.hook("app:error", r),
          e.hooks.hook("app:suspense:resolve", r));
      }
    },
  });
/*!
 * vue-router v4.5.1
 * (c) 2025 Eduardo San Martin Morote
 * @license MIT
 */ const tr = typeof document < "u";
function lp(e) {
  return (
    typeof e == "object" ||
    "displayName" in e ||
    "props" in e ||
    "__vccOpts" in e
  );
}
function U0(e) {
  return (
    e.__esModule ||
    e[Symbol.toStringTag] === "Module" ||
    (e.default && lp(e.default))
  );
}
const pe = Object.assign;
function hi(e, t) {
  const n = {};
  for (const r in t) {
    const s = t[r];
    n[r] = Lt(s) ? s.map(e) : e(s);
  }
  return n;
}
const Wr = () => {},
  Lt = Array.isArray,
  cp = /#/g,
  H0 = /&/g,
  j0 = /\//g,
  V0 = /=/g,
  B0 = /\?/g,
  up = /\+/g,
  W0 = /%5B/g,
  K0 = /%5D/g,
  fp = /%5E/g,
  G0 = /%60/g,
  dp = /%7B/g,
  q0 = /%7C/g,
  pp = /%7D/g,
  Y0 = /%20/g;
function nl(e) {
  return encodeURI("" + e)
    .replace(q0, "|")
    .replace(W0, "[")
    .replace(K0, "]");
}
function z0(e) {
  return nl(e).replace(dp, "{").replace(pp, "}").replace(fp, "^");
}
function Zi(e) {
  return nl(e)
    .replace(up, "%2B")
    .replace(Y0, "+")
    .replace(cp, "%23")
    .replace(H0, "%26")
    .replace(G0, "`")
    .replace(dp, "{")
    .replace(pp, "}")
    .replace(fp, "^");
}
function X0(e) {
  return Zi(e).replace(V0, "%3D");
}
function J0(e) {
  return nl(e).replace(cp, "%23").replace(B0, "%3F");
}
function Q0(e) {
  return e == null ? "" : J0(e).replace(j0, "%2F");
}
function os(e) {
  try {
    return decodeURIComponent("" + e);
  } catch {}
  return "" + e;
}
const Z0 = /\/$/,
  ev = (e) => e.replace(Z0, "");
function mi(e, t, n = "/") {
  let r,
    s = {},
    o = "",
    i = "";
  const a = t.indexOf("#");
  let l = t.indexOf("?");
  return (
    a < l && a >= 0 && (l = -1),
    l > -1 &&
      ((r = t.slice(0, l)),
      (o = t.slice(l + 1, a > -1 ? a : t.length)),
      (s = e(o))),
    a > -1 && ((r = r || t.slice(0, a)), (i = t.slice(a, t.length))),
    (r = sv(r ?? t, n)),
    { fullPath: r + (o && "?") + o + i, path: r, query: s, hash: os(i) }
  );
}
function tv(e, t) {
  const n = t.query ? e(t.query) : "";
  return t.path + (n && "?") + n + (t.hash || "");
}
function Rc(e, t) {
  return !t || !e.toLowerCase().startsWith(t.toLowerCase())
    ? e
    : e.slice(t.length) || "/";
}
function nv(e, t, n) {
  const r = t.matched.length - 1,
    s = n.matched.length - 1;
  return (
    r > -1 &&
    r === s &&
    mr(t.matched[r], n.matched[s]) &&
    hp(t.params, n.params) &&
    e(t.query) === e(n.query) &&
    t.hash === n.hash
  );
}
function mr(e, t) {
  return (e.aliasOf || e) === (t.aliasOf || t);
}
function hp(e, t) {
  if (Object.keys(e).length !== Object.keys(t).length) return !1;
  for (const n in e) if (!rv(e[n], t[n])) return !1;
  return !0;
}
function rv(e, t) {
  return Lt(e) ? Lc(e, t) : Lt(t) ? Lc(t, e) : e === t;
}
function Lc(e, t) {
  return Lt(t)
    ? e.length === t.length && e.every((n, r) => n === t[r])
    : e.length === 1 && e[0] === t;
}
function sv(e, t) {
  if (e.startsWith("/")) return e;
  if (!e) return t;
  const n = t.split("/"),
    r = e.split("/"),
    s = r[r.length - 1];
  (s === ".." || s === ".") && r.push("");
  let o = n.length - 1,
    i,
    a;
  for (i = 0; i < r.length; i++)
    if (((a = r[i]), a !== "."))
      if (a === "..") o > 1 && o--;
      else break;
  return n.slice(0, o).join("/") + "/" + r.slice(i).join("/");
}
const mt = {
  path: "/",
  name: void 0,
  params: {},
  query: {},
  hash: "",
  fullPath: "/",
  matched: [],
  meta: {},
  redirectedFrom: void 0,
};
var is;
(function (e) {
  ((e.pop = "pop"), (e.push = "push"));
})(is || (is = {}));
var Kr;
(function (e) {
  ((e.back = "back"), (e.forward = "forward"), (e.unknown = ""));
})(Kr || (Kr = {}));
function ov(e) {
  if (!e)
    if (tr) {
      const t = document.querySelector("base");
      ((e = (t && t.getAttribute("href")) || "/"),
        (e = e.replace(/^\w+:\/\/[^\/]+/, "")));
    } else e = "/";
  return (e[0] !== "/" && e[0] !== "#" && (e = "/" + e), ev(e));
}
const iv = /^[^#]+#/;
function av(e, t) {
  return e.replace(iv, "#") + t;
}
function lv(e, t) {
  const n = document.documentElement.getBoundingClientRect(),
    r = e.getBoundingClientRect();
  return {
    behavior: t.behavior,
    left: r.left - n.left - (t.left || 0),
    top: r.top - n.top - (t.top || 0),
  };
}
const Vo = () => ({ left: window.scrollX, top: window.scrollY });
function cv(e) {
  let t;
  if ("el" in e) {
    const n = e.el,
      r = typeof n == "string" && n.startsWith("#"),
      s =
        typeof n == "string"
          ? r
            ? document.getElementById(n.slice(1))
            : document.querySelector(n)
          : n;
    if (!s) return;
    t = lv(s, e);
  } else t = e;
  "scrollBehavior" in document.documentElement.style
    ? window.scrollTo(t)
    : window.scrollTo(
        t.left != null ? t.left : window.scrollX,
        t.top != null ? t.top : window.scrollY,
      );
}
function Pc(e, t) {
  return (history.state ? history.state.position - t : -1) + e;
}
const ea = new Map();
function uv(e, t) {
  ea.set(e, t);
}
function fv(e) {
  const t = ea.get(e);
  return (ea.delete(e), t);
}
let dv = () => location.protocol + "//" + location.host;
function mp(e, t) {
  const { pathname: n, search: r, hash: s } = t,
    o = e.indexOf("#");
  if (o > -1) {
    let a = s.includes(e.slice(o)) ? e.slice(o).length : 1,
      l = s.slice(a);
    return (l[0] !== "/" && (l = "/" + l), Rc(l, ""));
  }
  return Rc(n, e) + r + s;
}
function pv(e, t, n, r) {
  let s = [],
    o = [],
    i = null;
  const a = ({ state: d }) => {
    const p = mp(e, location),
      y = n.value,
      h = t.value;
    let S = 0;
    if (d) {
      if (((n.value = p), (t.value = d), i && i === y)) {
        i = null;
        return;
      }
      S = h ? d.position - h.position : 0;
    } else r(p);
    s.forEach((g) => {
      g(n.value, y, {
        delta: S,
        type: is.pop,
        direction: S ? (S > 0 ? Kr.forward : Kr.back) : Kr.unknown,
      });
    });
  };
  function l() {
    i = n.value;
  }
  function u(d) {
    s.push(d);
    const p = () => {
      const y = s.indexOf(d);
      y > -1 && s.splice(y, 1);
    };
    return (o.push(p), p);
  }
  function c() {
    const { history: d } = window;
    d.state && d.replaceState(pe({}, d.state, { scroll: Vo() }), "");
  }
  function f() {
    for (const d of o) d();
    ((o = []),
      window.removeEventListener("popstate", a),
      window.removeEventListener("beforeunload", c));
  }
  return (
    window.addEventListener("popstate", a),
    window.addEventListener("beforeunload", c, { passive: !0 }),
    { pauseListeners: l, listen: u, destroy: f }
  );
}
function kc(e, t, n, r = !1, s = !1) {
  return {
    back: e,
    current: t,
    forward: n,
    replaced: r,
    position: window.history.length,
    scroll: s ? Vo() : null,
  };
}
function hv(e) {
  const { history: t, location: n } = window,
    r = { value: mp(e, n) },
    s = { value: t.state };
  s.value ||
    o(
      r.value,
      {
        back: null,
        current: r.value,
        forward: null,
        position: t.length - 1,
        replaced: !0,
        scroll: null,
      },
      !0,
    );
  function o(l, u, c) {
    const f = e.indexOf("#"),
      d =
        f > -1
          ? (n.host && document.querySelector("base") ? e : e.slice(f)) + l
          : dv() + e + l;
    try {
      (t[c ? "replaceState" : "pushState"](u, "", d), (s.value = u));
    } catch (p) {
      (console.error(p), n[c ? "replace" : "assign"](d));
    }
  }
  function i(l, u) {
    const c = pe({}, t.state, kc(s.value.back, l, s.value.forward, !0), u, {
      position: s.value.position,
    });
    (o(l, c, !0), (r.value = l));
  }
  function a(l, u) {
    const c = pe({}, s.value, t.state, { forward: l, scroll: Vo() });
    o(c.current, c, !0);
    const f = pe({}, kc(r.value, l, null), { position: c.position + 1 }, u);
    (o(l, f, !1), (r.value = l));
  }
  return { location: r, state: s, push: a, replace: i };
}
function mv(e) {
  e = ov(e);
  const t = hv(e),
    n = pv(e, t.state, t.location, t.replace);
  function r(o, i = !0) {
    (i || n.pauseListeners(), history.go(o));
  }
  const s = pe(
    { location: "", base: e, go: r, createHref: av.bind(null, e) },
    t,
    n,
  );
  return (
    Object.defineProperty(s, "location", {
      enumerable: !0,
      get: () => t.location.value,
    }),
    Object.defineProperty(s, "state", {
      enumerable: !0,
      get: () => t.state.value,
    }),
    s
  );
}
function gv(e) {
  return typeof e == "string" || (e && typeof e == "object");
}
function gp(e) {
  return typeof e == "string" || typeof e == "symbol";
}
const bp = Symbol("");
var Oc;
(function (e) {
  ((e[(e.aborted = 4)] = "aborted"),
    (e[(e.cancelled = 8)] = "cancelled"),
    (e[(e.duplicated = 16)] = "duplicated"));
})(Oc || (Oc = {}));
function gr(e, t) {
  return pe(new Error(), { type: e, [bp]: !0 }, t);
}
function Dt(e, t) {
  return e instanceof Error && bp in e && (t == null || !!(e.type & t));
}
const Nc = "[^/]+?",
  bv = { sensitive: !1, strict: !1, start: !0, end: !0 },
  _v = /[.+*?^${}()[\]/\\]/g;
function yv(e, t) {
  const n = pe({}, bv, t),
    r = [];
  let s = n.start ? "^" : "";
  const o = [];
  for (const u of e) {
    const c = u.length ? [] : [90];
    n.strict && !u.length && (s += "/");
    for (let f = 0; f < u.length; f++) {
      const d = u[f];
      let p = 40 + (n.sensitive ? 0.25 : 0);
      if (d.type === 0)
        (f || (s += "/"), (s += d.value.replace(_v, "\\$&")), (p += 40));
      else if (d.type === 1) {
        const { value: y, repeatable: h, optional: S, regexp: g } = d;
        o.push({ name: y, repeatable: h, optional: S });
        const E = g || Nc;
        if (E !== Nc) {
          p += 10;
          try {
            new RegExp(`(${E})`);
          } catch (b) {
            throw new Error(
              `Invalid custom RegExp for param "${y}" (${E}): ` + b.message,
            );
          }
        }
        let m = h ? `((?:${E})(?:/(?:${E}))*)` : `(${E})`;
        (f || (m = S && u.length < 2 ? `(?:/${m})` : "/" + m),
          S && (m += "?"),
          (s += m),
          (p += 20),
          S && (p += -8),
          h && (p += -20),
          E === ".*" && (p += -50));
      }
      c.push(p);
    }
    r.push(c);
  }
  if (n.strict && n.end) {
    const u = r.length - 1;
    r[u][r[u].length - 1] += 0.7000000000000001;
  }
  (n.strict || (s += "/?"),
    n.end ? (s += "$") : n.strict && !s.endsWith("/") && (s += "(?:/|$)"));
  const i = new RegExp(s, n.sensitive ? "" : "i");
  function a(u) {
    const c = u.match(i),
      f = {};
    if (!c) return null;
    for (let d = 1; d < c.length; d++) {
      const p = c[d] || "",
        y = o[d - 1];
      f[y.name] = p && y.repeatable ? p.split("/") : p;
    }
    return f;
  }
  function l(u) {
    let c = "",
      f = !1;
    for (const d of e) {
      ((!f || !c.endsWith("/")) && (c += "/"), (f = !1));
      for (const p of d)
        if (p.type === 0) c += p.value;
        else if (p.type === 1) {
          const { value: y, repeatable: h, optional: S } = p,
            g = y in u ? u[y] : "";
          if (Lt(g) && !h)
            throw new Error(
              `Provided param "${y}" is an array but it is not repeatable (* or + modifiers)`,
            );
          const E = Lt(g) ? g.join("/") : g;
          if (!E)
            if (S)
              d.length < 2 &&
                (c.endsWith("/") ? (c = c.slice(0, -1)) : (f = !0));
            else throw new Error(`Missing required param "${y}"`);
          c += E;
        }
    }
    return c || "/";
  }
  return { re: i, score: r, keys: o, parse: a, stringify: l };
}
function vv(e, t) {
  let n = 0;
  for (; n < e.length && n < t.length; ) {
    const r = t[n] - e[n];
    if (r) return r;
    n++;
  }
  return e.length < t.length
    ? e.length === 1 && e[0] === 80
      ? -1
      : 1
    : e.length > t.length
      ? t.length === 1 && t[0] === 80
        ? 1
        : -1
      : 0;
}
function _p(e, t) {
  let n = 0;
  const r = e.score,
    s = t.score;
  for (; n < r.length && n < s.length; ) {
    const o = vv(r[n], s[n]);
    if (o) return o;
    n++;
  }
  if (Math.abs(s.length - r.length) === 1) {
    if (Ic(r)) return 1;
    if (Ic(s)) return -1;
  }
  return s.length - r.length;
}
function Ic(e) {
  const t = e[e.length - 1];
  return e.length > 0 && t[t.length - 1] < 0;
}
const Ev = { type: 0, value: "" },
  wv = /[a-zA-Z0-9_]/;
function Tv(e) {
  if (!e) return [[]];
  if (e === "/") return [[Ev]];
  if (!e.startsWith("/")) throw new Error(`Invalid path "${e}"`);
  function t(p) {
    throw new Error(`ERR (${n})/"${u}": ${p}`);
  }
  let n = 0,
    r = n;
  const s = [];
  let o;
  function i() {
    (o && s.push(o), (o = []));
  }
  let a = 0,
    l,
    u = "",
    c = "";
  function f() {
    u &&
      (n === 0
        ? o.push({ type: 0, value: u })
        : n === 1 || n === 2 || n === 3
          ? (o.length > 1 &&
              (l === "*" || l === "+") &&
              t(
                `A repeatable param (${u}) must be alone in its segment. eg: '/:ids+.`,
              ),
            o.push({
              type: 1,
              value: u,
              regexp: c,
              repeatable: l === "*" || l === "+",
              optional: l === "*" || l === "?",
            }))
          : t("Invalid state to consume buffer"),
      (u = ""));
  }
  function d() {
    u += l;
  }
  for (; a < e.length; ) {
    if (((l = e[a++]), l === "\\" && n !== 2)) {
      ((r = n), (n = 4));
      continue;
    }
    switch (n) {
      case 0:
        l === "/" ? (u && f(), i()) : l === ":" ? (f(), (n = 1)) : d();
        break;
      case 4:
        (d(), (n = r));
        break;
      case 1:
        l === "("
          ? (n = 2)
          : wv.test(l)
            ? d()
            : (f(), (n = 0), l !== "*" && l !== "?" && l !== "+" && a--);
        break;
      case 2:
        l === ")"
          ? c[c.length - 1] == "\\"
            ? (c = c.slice(0, -1) + l)
            : (n = 3)
          : (c += l);
        break;
      case 3:
        (f(), (n = 0), l !== "*" && l !== "?" && l !== "+" && a--, (c = ""));
        break;
      default:
        t("Unknown state");
        break;
    }
  }
  return (
    n === 2 && t(`Unfinished custom RegExp for param "${u}"`),
    f(),
    i(),
    s
  );
}
function Cv(e, t, n) {
  const r = yv(Tv(e.path), n),
    s = pe(r, { record: e, parent: t, children: [], alias: [] });
  return (t && !s.record.aliasOf == !t.record.aliasOf && t.children.push(s), s);
}
function Sv(e, t) {
  const n = [],
    r = new Map();
  t = Fc({ strict: !1, end: !0, sensitive: !1 }, t);
  function s(f) {
    return r.get(f);
  }
  function o(f, d, p) {
    const y = !p,
      h = xc(f);
    h.aliasOf = p && p.record;
    const S = Fc(t, f),
      g = [h];
    if ("alias" in f) {
      const b = typeof f.alias == "string" ? [f.alias] : f.alias;
      for (const C of b)
        g.push(
          xc(
            pe({}, h, {
              components: p ? p.record.components : h.components,
              path: C,
              aliasOf: p ? p.record : h,
            }),
          ),
        );
    }
    let E, m;
    for (const b of g) {
      const { path: C } = b;
      if (d && C[0] !== "/") {
        const L = d.record.path,
          R = L[L.length - 1] === "/" ? "" : "/";
        b.path = d.record.path + (C && R + C);
      }
      if (
        ((E = Cv(b, d, S)),
        p
          ? p.alias.push(E)
          : ((m = m || E),
            m !== E && m.alias.push(E),
            y && f.name && !Dc(E) && i(f.name)),
        yp(E) && l(E),
        h.children)
      ) {
        const L = h.children;
        for (let R = 0; R < L.length; R++) o(L[R], E, p && p.children[R]);
      }
      p = p || E;
    }
    return m
      ? () => {
          i(m);
        }
      : Wr;
  }
  function i(f) {
    if (gp(f)) {
      const d = r.get(f);
      d &&
        (r.delete(f),
        n.splice(n.indexOf(d), 1),
        d.children.forEach(i),
        d.alias.forEach(i));
    } else {
      const d = n.indexOf(f);
      d > -1 &&
        (n.splice(d, 1),
        f.record.name && r.delete(f.record.name),
        f.children.forEach(i),
        f.alias.forEach(i));
    }
  }
  function a() {
    return n;
  }
  function l(f) {
    const d = Lv(f, n);
    (n.splice(d, 0, f), f.record.name && !Dc(f) && r.set(f.record.name, f));
  }
  function u(f, d) {
    let p,
      y = {},
      h,
      S;
    if ("name" in f && f.name) {
      if (((p = r.get(f.name)), !p)) throw gr(1, { location: f });
      ((S = p.record.name),
        (y = pe(
          Mc(
            d.params,
            p.keys
              .filter((m) => !m.optional)
              .concat(p.parent ? p.parent.keys.filter((m) => m.optional) : [])
              .map((m) => m.name),
          ),
          f.params &&
            Mc(
              f.params,
              p.keys.map((m) => m.name),
            ),
        )),
        (h = p.stringify(y)));
    } else if (f.path != null)
      ((h = f.path),
        (p = n.find((m) => m.re.test(h))),
        p && ((y = p.parse(h)), (S = p.record.name)));
    else {
      if (((p = d.name ? r.get(d.name) : n.find((m) => m.re.test(d.path))), !p))
        throw gr(1, { location: f, currentLocation: d });
      ((S = p.record.name),
        (y = pe({}, d.params, f.params)),
        (h = p.stringify(y)));
    }
    const g = [];
    let E = p;
    for (; E; ) (g.unshift(E.record), (E = E.parent));
    return { name: S, path: h, params: y, matched: g, meta: Rv(g) };
  }
  e.forEach((f) => o(f));
  function c() {
    ((n.length = 0), r.clear());
  }
  return {
    addRoute: o,
    resolve: u,
    removeRoute: i,
    clearRoutes: c,
    getRoutes: a,
    getRecordMatcher: s,
  };
}
function Mc(e, t) {
  const n = {};
  for (const r of t) r in e && (n[r] = e[r]);
  return n;
}
function xc(e) {
  const t = {
    path: e.path,
    redirect: e.redirect,
    name: e.name,
    meta: e.meta || {},
    aliasOf: e.aliasOf,
    beforeEnter: e.beforeEnter,
    props: Av(e),
    children: e.children || [],
    instances: {},
    leaveGuards: new Set(),
    updateGuards: new Set(),
    enterCallbacks: {},
    components:
      "components" in e
        ? e.components || null
        : e.component && { default: e.component },
  };
  return (Object.defineProperty(t, "mods", { value: {} }), t);
}
function Av(e) {
  const t = {},
    n = e.props || !1;
  if ("component" in e) t.default = n;
  else for (const r in e.components) t[r] = typeof n == "object" ? n[r] : n;
  return t;
}
function Dc(e) {
  for (; e; ) {
    if (e.record.aliasOf) return !0;
    e = e.parent;
  }
  return !1;
}
function Rv(e) {
  return e.reduce((t, n) => pe(t, n.meta), {});
}
function Fc(e, t) {
  const n = {};
  for (const r in e) n[r] = r in t ? t[r] : e[r];
  return n;
}
function Lv(e, t) {
  let n = 0,
    r = t.length;
  for (; n !== r; ) {
    const o = (n + r) >> 1;
    _p(e, t[o]) < 0 ? (r = o) : (n = o + 1);
  }
  const s = Pv(e);
  return (s && (r = t.lastIndexOf(s, r - 1)), r);
}
function Pv(e) {
  let t = e;
  for (; (t = t.parent); ) if (yp(t) && _p(e, t) === 0) return t;
}
function yp({ record: e }) {
  return !!(
    e.name ||
    (e.components && Object.keys(e.components).length) ||
    e.redirect
  );
}
function kv(e) {
  const t = {};
  if (e === "" || e === "?") return t;
  const r = (e[0] === "?" ? e.slice(1) : e).split("&");
  for (let s = 0; s < r.length; ++s) {
    const o = r[s].replace(up, " "),
      i = o.indexOf("="),
      a = os(i < 0 ? o : o.slice(0, i)),
      l = i < 0 ? null : os(o.slice(i + 1));
    if (a in t) {
      let u = t[a];
      (Lt(u) || (u = t[a] = [u]), u.push(l));
    } else t[a] = l;
  }
  return t;
}
function $c(e) {
  let t = "";
  for (let n in e) {
    const r = e[n];
    if (((n = X0(n)), r == null)) {
      r !== void 0 && (t += (t.length ? "&" : "") + n);
      continue;
    }
    (Lt(r) ? r.map((o) => o && Zi(o)) : [r && Zi(r)]).forEach((o) => {
      o !== void 0 &&
        ((t += (t.length ? "&" : "") + n), o != null && (t += "=" + o));
    });
  }
  return t;
}
function Ov(e) {
  const t = {};
  for (const n in e) {
    const r = e[n];
    r !== void 0 &&
      (t[n] = Lt(r)
        ? r.map((s) => (s == null ? null : "" + s))
        : r == null
          ? r
          : "" + r);
  }
  return t;
}
const Nv = Symbol(""),
  Uc = Symbol(""),
  Bo = Symbol(""),
  rl = Symbol(""),
  ta = Symbol("");
function Ir() {
  let e = [];
  function t(r) {
    return (
      e.push(r),
      () => {
        const s = e.indexOf(r);
        s > -1 && e.splice(s, 1);
      }
    );
  }
  function n() {
    e = [];
  }
  return { add: t, list: () => e.slice(), reset: n };
}
function vn(e, t, n, r, s, o = (i) => i()) {
  const i = r && (r.enterCallbacks[s] = r.enterCallbacks[s] || []);
  return () =>
    new Promise((a, l) => {
      const u = (d) => {
          d === !1
            ? l(gr(4, { from: n, to: t }))
            : d instanceof Error
              ? l(d)
              : gv(d)
                ? l(gr(2, { from: t, to: d }))
                : (i &&
                    r.enterCallbacks[s] === i &&
                    typeof d == "function" &&
                    i.push(d),
                  a());
        },
        c = o(() => e.call(r && r.instances[s], t, n, u));
      let f = Promise.resolve(c);
      (e.length < 3 && (f = f.then(u)), f.catch((d) => l(d)));
    });
}
function gi(e, t, n, r, s = (o) => o()) {
  const o = [];
  for (const i of e)
    for (const a in i.components) {
      let l = i.components[a];
      if (!(t !== "beforeRouteEnter" && !i.instances[a]))
        if (lp(l)) {
          const c = (l.__vccOpts || l)[t];
          c && o.push(vn(c, n, r, i, a, s));
        } else {
          let u = l();
          o.push(() =>
            u.then((c) => {
              if (!c)
                throw new Error(
                  `Couldn't resolve component "${a}" at "${i.path}"`,
                );
              const f = U0(c) ? c.default : c;
              ((i.mods[a] = c), (i.components[a] = f));
              const p = (f.__vccOpts || f)[t];
              return p && vn(p, n, r, i, a, s)();
            }),
          );
        }
    }
  return o;
}
function Hc(e) {
  const t = Fe(Bo),
    n = Fe(rl),
    r = Ce(() => {
      const l = te(e.to);
      return t.resolve(l);
    }),
    s = Ce(() => {
      const { matched: l } = r.value,
        { length: u } = l,
        c = l[u - 1],
        f = n.matched;
      if (!c || !f.length) return -1;
      const d = f.findIndex(mr.bind(null, c));
      if (d > -1) return d;
      const p = jc(l[u - 2]);
      return u > 1 && jc(c) === p && f[f.length - 1].path !== p
        ? f.findIndex(mr.bind(null, l[u - 2]))
        : d;
    }),
    o = Ce(() => s.value > -1 && Fv(n.params, r.value.params)),
    i = Ce(
      () =>
        s.value > -1 &&
        s.value === n.matched.length - 1 &&
        hp(n.params, r.value.params),
    );
  function a(l = {}) {
    if (Dv(l)) {
      const u = t[te(e.replace) ? "replace" : "push"](te(e.to)).catch(Wr);
      return (
        e.viewTransition &&
          typeof document < "u" &&
          "startViewTransition" in document &&
          document.startViewTransition(() => u),
        u
      );
    }
    return Promise.resolve();
  }
  return {
    route: r,
    href: Ce(() => r.value.href),
    isActive: o,
    isExactActive: i,
    navigate: a,
  };
}
function Iv(e) {
  return e.length === 1 ? e[0] : e;
}
const Mv = dt({
    name: "RouterLink",
    compatConfig: { MODE: 3 },
    props: {
      to: { type: [String, Object], required: !0 },
      replace: Boolean,
      activeClass: String,
      exactActiveClass: String,
      custom: Boolean,
      ariaCurrentValue: { type: String, default: "page" },
      viewTransition: Boolean,
    },
    useLink: Hc,
    setup(e, { slots: t }) {
      const n = an(Hc(e)),
        { options: r } = Fe(Bo),
        s = Ce(() => ({
          [Vc(e.activeClass, r.linkActiveClass, "router-link-active")]:
            n.isActive,
          [Vc(
            e.exactActiveClass,
            r.linkExactActiveClass,
            "router-link-exact-active",
          )]: n.isExactActive,
        }));
      return () => {
        const o = t.default && Iv(t.default(n));
        return e.custom
          ? o
          : De(
              "a",
              {
                "aria-current": n.isExactActive ? e.ariaCurrentValue : null,
                href: n.href,
                onClick: n.navigate,
                class: s.value,
              },
              o,
            );
      };
    },
  }),
  xv = Mv;
function Dv(e) {
  if (
    !(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) &&
    !e.defaultPrevented &&
    !(e.button !== void 0 && e.button !== 0)
  ) {
    if (e.currentTarget && e.currentTarget.getAttribute) {
      const t = e.currentTarget.getAttribute("target");
      if (/\b_blank\b/i.test(t)) return;
    }
    return (e.preventDefault && e.preventDefault(), !0);
  }
}
function Fv(e, t) {
  for (const n in t) {
    const r = t[n],
      s = e[n];
    if (typeof r == "string") {
      if (r !== s) return !1;
    } else if (!Lt(s) || s.length !== r.length || r.some((o, i) => o !== s[i]))
      return !1;
  }
  return !0;
}
function jc(e) {
  return e ? (e.aliasOf ? e.aliasOf.path : e.path) : "";
}
const Vc = (e, t, n) => e ?? t ?? n,
  $v = dt({
    name: "RouterView",
    inheritAttrs: !1,
    props: { name: { type: String, default: "default" }, route: Object },
    compatConfig: { MODE: 3 },
    setup(e, { attrs: t, slots: n }) {
      const r = Fe(ta),
        s = Ce(() => e.route || r.value),
        o = Fe(Uc, 0),
        i = Ce(() => {
          let u = te(o);
          const { matched: c } = s.value;
          let f;
          for (; (f = c[u]) && !f.components; ) u++;
          return u;
        }),
        a = Ce(() => s.value.matched[i.value]);
      (Qt(
        Uc,
        Ce(() => i.value + 1),
      ),
        Qt(Nv, a),
        Qt(ta, s));
      const l = ze();
      return (
        rt(
          () => [l.value, a.value, e.name],
          ([u, c, f], [d, p, y]) => {
            (c &&
              ((c.instances[f] = u),
              p &&
                p !== c &&
                u &&
                u === d &&
                (c.leaveGuards.size || (c.leaveGuards = p.leaveGuards),
                c.updateGuards.size || (c.updateGuards = p.updateGuards))),
              u &&
                c &&
                (!p || !mr(c, p) || !d) &&
                (c.enterCallbacks[f] || []).forEach((h) => h(u)));
          },
          { flush: "post" },
        ),
        () => {
          const u = s.value,
            c = e.name,
            f = a.value,
            d = f && f.components[c];
          if (!d) return Bc(n.default, { Component: d, route: u });
          const p = f.props[c],
            y = p
              ? p === !0
                ? u.params
                : typeof p == "function"
                  ? p(u)
                  : p
              : null,
            S = De(
              d,
              pe({}, y, t, {
                onVnodeUnmounted: (g) => {
                  g.component.isUnmounted && (f.instances[c] = null);
                },
                ref: l,
              }),
            );
          return Bc(n.default, { Component: S, route: u }) || S;
        }
      );
    },
  });
function Bc(e, t) {
  if (!e) return null;
  const n = e(t);
  return n.length === 1 ? n[0] : n;
}
const vp = $v;
function Uv(e) {
  const t = Sv(e.routes, e),
    n = e.parseQuery || kv,
    r = e.stringifyQuery || $c,
    s = e.history,
    o = Ir(),
    i = Ir(),
    a = Ir(),
    l = rn(mt);
  let u = mt;
  tr &&
    e.scrollBehavior &&
    "scrollRestoration" in history &&
    (history.scrollRestoration = "manual");
  const c = hi.bind(null, (x) => "" + x),
    f = hi.bind(null, Q0),
    d = hi.bind(null, os);
  function p(x, G) {
    let B, J;
    return (
      gp(x) ? ((B = t.getRecordMatcher(x)), (J = G)) : (J = x),
      t.addRoute(J, B)
    );
  }
  function y(x) {
    const G = t.getRecordMatcher(x);
    G && t.removeRoute(G);
  }
  function h() {
    return t.getRoutes().map((x) => x.record);
  }
  function S(x) {
    return !!t.getRecordMatcher(x);
  }
  function g(x, G) {
    if (((G = pe({}, G || l.value)), typeof x == "string")) {
      const T = mi(n, x, G.path),
        k = t.resolve({ path: T.path }, G),
        U = s.createHref(T.fullPath);
      return pe(T, k, {
        params: d(k.params),
        hash: os(T.hash),
        redirectedFrom: void 0,
        href: U,
      });
    }
    let B;
    if (x.path != null) B = pe({}, x, { path: mi(n, x.path, G.path).path });
    else {
      const T = pe({}, x.params);
      for (const k in T) T[k] == null && delete T[k];
      ((B = pe({}, x, { params: f(T) })), (G.params = f(G.params)));
    }
    const J = t.resolve(B, G),
      oe = x.hash || "";
    J.params = c(d(J.params));
    const _e = tv(r, pe({}, x, { hash: z0(oe), path: J.path })),
      v = s.createHref(_e);
    return pe(
      { fullPath: _e, hash: oe, query: r === $c ? Ov(x.query) : x.query || {} },
      J,
      { redirectedFrom: void 0, href: v },
    );
  }
  function E(x) {
    return typeof x == "string" ? mi(n, x, l.value.path) : pe({}, x);
  }
  function m(x, G) {
    if (u !== x) return gr(8, { from: G, to: x });
  }
  function b(x) {
    return R(x);
  }
  function C(x) {
    return b(pe(E(x), { replace: !0 }));
  }
  function L(x) {
    const G = x.matched[x.matched.length - 1];
    if (G && G.redirect) {
      const { redirect: B } = G;
      let J = typeof B == "function" ? B(x) : B;
      return (
        typeof J == "string" &&
          ((J = J.includes("?") || J.includes("#") ? (J = E(J)) : { path: J }),
          (J.params = {})),
        pe(
          {
            query: x.query,
            hash: x.hash,
            params: J.path != null ? {} : x.params,
          },
          J,
        )
      );
    }
  }
  function R(x, G) {
    const B = (u = g(x)),
      J = l.value,
      oe = x.state,
      _e = x.force,
      v = x.replace === !0,
      T = L(B);
    if (T)
      return R(
        pe(E(T), {
          state: typeof T == "object" ? pe({}, oe, T.state) : oe,
          force: _e,
          replace: v,
        }),
        G || B,
      );
    const k = B;
    k.redirectedFrom = G;
    let U;
    return (
      !_e &&
        nv(r, J, B) &&
        ((U = gr(16, { to: k, from: J })), Xe(J, J, !0, !1)),
      (U ? Promise.resolve(U) : $(k, J))
        .catch((I) => (Dt(I) ? (Dt(I, 2) ? I : it(I)) : z(I, k, J)))
        .then((I) => {
          if (I) {
            if (Dt(I, 2))
              return R(
                pe({ replace: v }, E(I.to), {
                  state: typeof I.to == "object" ? pe({}, oe, I.to.state) : oe,
                  force: _e,
                }),
                G || k,
              );
          } else I = F(k, J, !0, v, oe);
          return (K(k, J, I), I);
        })
    );
  }
  function j(x, G) {
    const B = m(x, G);
    return B ? Promise.reject(B) : Promise.resolve();
  }
  function M(x) {
    const G = Ot.values().next().value;
    return G && typeof G.runWithContext == "function"
      ? G.runWithContext(x)
      : x();
  }
  function $(x, G) {
    let B;
    const [J, oe, _e] = Hv(x, G);
    B = gi(J.reverse(), "beforeRouteLeave", x, G);
    for (const T of J)
      T.leaveGuards.forEach((k) => {
        B.push(vn(k, x, G));
      });
    const v = j.bind(null, x, G);
    return (
      B.push(v),
      Be(B)
        .then(() => {
          B = [];
          for (const T of o.list()) B.push(vn(T, x, G));
          return (B.push(v), Be(B));
        })
        .then(() => {
          B = gi(oe, "beforeRouteUpdate", x, G);
          for (const T of oe)
            T.updateGuards.forEach((k) => {
              B.push(vn(k, x, G));
            });
          return (B.push(v), Be(B));
        })
        .then(() => {
          B = [];
          for (const T of _e)
            if (T.beforeEnter)
              if (Lt(T.beforeEnter))
                for (const k of T.beforeEnter) B.push(vn(k, x, G));
              else B.push(vn(T.beforeEnter, x, G));
          return (B.push(v), Be(B));
        })
        .then(
          () => (
            x.matched.forEach((T) => (T.enterCallbacks = {})),
            (B = gi(_e, "beforeRouteEnter", x, G, M)),
            B.push(v),
            Be(B)
          ),
        )
        .then(() => {
          B = [];
          for (const T of i.list()) B.push(vn(T, x, G));
          return (B.push(v), Be(B));
        })
        .catch((T) => (Dt(T, 8) ? T : Promise.reject(T)))
    );
  }
  function K(x, G, B) {
    a.list().forEach((J) => M(() => J(x, G, B)));
  }
  function F(x, G, B, J, oe) {
    const _e = m(x, G);
    if (_e) return _e;
    const v = G === mt,
      T = tr ? history.state : {};
    (B &&
      (J || v
        ? s.replace(x.fullPath, pe({ scroll: v && T && T.scroll }, oe))
        : s.push(x.fullPath, oe)),
      (l.value = x),
      Xe(x, G, B, v),
      it());
  }
  let X;
  function ne() {
    X ||
      (X = s.listen((x, G, B) => {
        if (!kn.listening) return;
        const J = g(x),
          oe = L(J);
        if (oe) {
          R(pe(oe, { replace: !0, force: !0 }), J).catch(Wr);
          return;
        }
        u = J;
        const _e = l.value;
        (tr && uv(Pc(_e.fullPath, B.delta), Vo()),
          $(J, _e)
            .catch((v) =>
              Dt(v, 12)
                ? v
                : Dt(v, 2)
                  ? (R(pe(E(v.to), { force: !0 }), J)
                      .then((T) => {
                        Dt(T, 20) &&
                          !B.delta &&
                          B.type === is.pop &&
                          s.go(-1, !1);
                      })
                      .catch(Wr),
                    Promise.reject())
                  : (B.delta && s.go(-B.delta, !1), z(v, J, _e)),
            )
            .then((v) => {
              ((v = v || F(J, _e, !1)),
                v &&
                  (B.delta && !Dt(v, 8)
                    ? s.go(-B.delta, !1)
                    : B.type === is.pop && Dt(v, 20) && s.go(-1, !1)),
                K(J, _e, v));
            })
            .catch(Wr));
      }));
  }
  let se = Ir(),
    q = Ir(),
    ee;
  function z(x, G, B) {
    it(x);
    const J = q.list();
    return (
      J.length ? J.forEach((oe) => oe(x, G, B)) : console.error(x),
      Promise.reject(x)
    );
  }
  function fe() {
    return ee && l.value !== mt
      ? Promise.resolve()
      : new Promise((x, G) => {
          se.add([x, G]);
        });
  }
  function it(x) {
    return (
      ee ||
        ((ee = !x),
        ne(),
        se.list().forEach(([G, B]) => (x ? B(x) : G())),
        se.reset()),
      x
    );
  }
  function Xe(x, G, B, J) {
    const { scrollBehavior: oe } = e;
    if (!tr || !oe) return Promise.resolve();
    const _e =
      (!B && fv(Pc(x.fullPath, 0))) ||
      ((J || !B) && history.state && history.state.scroll) ||
      null;
    return jt()
      .then(() => oe(x, G, _e))
      .then((v) => v && cv(v))
      .catch((v) => z(v, x, G));
  }
  const $e = (x) => s.go(x);
  let kt;
  const Ot = new Set(),
    kn = {
      currentRoute: l,
      listening: !0,
      addRoute: p,
      removeRoute: y,
      clearRoutes: t.clearRoutes,
      hasRoute: S,
      getRoutes: h,
      resolve: g,
      options: e,
      push: b,
      replace: C,
      go: $e,
      back: () => $e(-1),
      forward: () => $e(1),
      beforeEach: o.add,
      beforeResolve: i.add,
      afterEach: a.add,
      onError: q.add,
      isReady: fe,
      install(x) {
        const G = this;
        (x.component("RouterLink", xv),
          x.component("RouterView", vp),
          (x.config.globalProperties.$router = G),
          Object.defineProperty(x.config.globalProperties, "$route", {
            enumerable: !0,
            get: () => te(l),
          }),
          tr &&
            !kt &&
            l.value === mt &&
            ((kt = !0), b(s.location).catch((oe) => {})));
        const B = {};
        for (const oe in mt)
          Object.defineProperty(B, oe, {
            get: () => l.value[oe],
            enumerable: !0,
          });
        (x.provide(Bo, G), x.provide(rl, St(B)), x.provide(ta, l));
        const J = x.unmount;
        (Ot.add(x),
          (x.unmount = function () {
            (Ot.delete(x),
              Ot.size < 1 &&
                ((u = mt),
                X && X(),
                (X = null),
                (l.value = mt),
                (kt = !1),
                (ee = !1)),
              J());
          }));
      },
    };
  function Be(x) {
    return x.reduce((G, B) => G.then(() => M(B)), Promise.resolve());
  }
  return kn;
}
function Hv(e, t) {
  const n = [],
    r = [],
    s = [],
    o = Math.max(t.matched.length, e.matched.length);
  for (let i = 0; i < o; i++) {
    const a = t.matched[i];
    a && (e.matched.find((u) => mr(u, a)) ? r.push(a) : n.push(a));
    const l = e.matched[i];
    l && (t.matched.find((u) => mr(u, l)) || s.push(l));
  }
  return [n, r, s];
}
function QC() {
  return Fe(Bo);
}
function Ep(e) {
  return Fe(rl);
}
const jv = /(:\w+)\([^)]+\)/g,
  Vv = /(:\w+)[?+*]/g,
  Bv = /:\w+/g,
  Wv = (e, t) =>
    t.path
      .replace(jv, "$1")
      .replace(Vv, "$1")
      .replace(Bv, (n) => {
        var r;
        return (
          ((r = e.params[n.slice(1)]) == null ? void 0 : r.toString()) || ""
        );
      }),
  na = (e, t) => {
    const n = e.route.matched.find((s) => {
        var o;
        return (
          ((o = s.components) == null ? void 0 : o.default) === e.Component.type
        );
      }),
      r = t ?? (n == null ? void 0 : n.meta.key) ?? (n && Wv(e.route, n));
    return typeof r == "function" ? r(e.route) : r;
  },
  Kv = (e, t) => ({ default: () => (e ? De(wf, e === !0 ? {} : e, t) : t) });
function sl(e) {
  return Array.isArray(e) ? e : [e];
}
const bi = [
    {
      name: "index",
      path: "/",
      component: () =>
        yn(
          () => import("./Fpapo52S.js"),
          __vite__mapDeps([0, 1, 2, 3, 4]),
          import.meta.url,
        ),
    },
    {
      name: "login",
      path: "/login",
      component: () =>
        yn(
          () => import("./CNMjV8dR.js"),
          __vite__mapDeps([5, 1, 4]),
          import.meta.url,
        ),
    },
    {
      name: "config",
      path: "/config",
      component: () =>
        yn(
          () => import("./BJ4Ll5Hi.js"),
          __vite__mapDeps([6, 1, 7, 8, 3, 4, 9]),
          import.meta.url,
        ),
    },
    {
      name: "map-tablename",
      path: "/map/:tablename()",
      component: () =>
        yn(
          () => import("./CaSQyyHN.js"),
          __vite__mapDeps([10, 11, 7, 12, 13, 8, 14, 15, 3, 4, 16]),
          import.meta.url,
        ),
    },
    {
      name: "alerts-tablename",
      path: "/alerts/:tablename()",
      component: () =>
        yn(
          () => import("./BRFWsHZY.js"),
          __vite__mapDeps([17, 11, 7, 12, 13, 3, 8, 4, 18]),
          import.meta.url,
        ),
    },
    {
      name: "gallery-tablename",
      path: "/gallery/:tablename()",
      component: () =>
        yn(
          () => import("./D1ifAnvd.js"),
          __vite__mapDeps([19, 8, 12, 14, 15, 3, 4]),
          import.meta.url,
        ),
    },
  ],
  wp = (e, t) => ({
    default: () => {
      var n;
      return e
        ? De(md, e === !0 ? {} : e, t)
        : (n = t.default) == null
          ? void 0
          : n.call(t);
    },
  }),
  Gv = /(:\w+)\([^)]+\)/g,
  qv = /(:\w+)[?+*]/g,
  Yv = /:\w+/g;
function Wc(e) {
  const t =
    (e == null ? void 0 : e.meta.key) ??
    e.path
      .replace(Gv, "$1")
      .replace(qv, "$1")
      .replace(Yv, (n) => {
        var r;
        return (
          ((r = e.params[n.slice(1)]) == null ? void 0 : r.toString()) || ""
        );
      });
  return typeof t == "function" ? t(e) : t;
}
function zv(e, t) {
  return e === t || t === mt
    ? !1
    : Wc(e) !== Wc(t)
      ? !0
      : !e.matched.every((r, s) => {
          var o, i;
          return (
            r.components &&
            r.components.default ===
              ((i = (o = t.matched[s]) == null ? void 0 : o.components) == null
                ? void 0
                : i.default)
          );
        });
}
const Xv = {
  scrollBehavior(e, t, n) {
    var l;
    const r = be(),
      s =
        ((l = et().options) == null ? void 0 : l.scrollBehaviorType) ?? "auto";
    if (e.path === t.path)
      return t.hash && !e.hash
        ? { left: 0, top: 0 }
        : e.hash
          ? { el: e.hash, top: Tp(e.hash), behavior: s }
          : !1;
    if (
      (typeof e.meta.scrollToTop == "function"
        ? e.meta.scrollToTop(e, t)
        : e.meta.scrollToTop) === !1
    )
      return !1;
    let i = n || void 0;
    !i && zv(e, t) && (i = { left: 0, top: 0 });
    const a = r._runningTransition
      ? "page:transition:finish"
      : "page:loading:end";
    return new Promise((u) => {
      if (t === mt) {
        u(Kc(e, "instant", i));
        return;
      }
      r.hooks.hookOnce(a, () => {
        requestAnimationFrame(() => u(Kc(e, "instant", i)));
      });
    });
  },
};
function Tp(e) {
  try {
    const t = document.querySelector(e);
    if (t)
      return (
        (Number.parseFloat(getComputedStyle(t).scrollMarginTop) || 0) +
        (Number.parseFloat(
          getComputedStyle(document.documentElement).scrollPaddingTop,
        ) || 0)
      );
  } catch {}
  return 0;
}
function Kc(e, t, n) {
  return (
    n ||
    (e.hash
      ? { el: e.hash, top: Tp(e.hash), behavior: t }
      : { left: 0, top: 0, behavior: t })
  );
}
const Jv = { hashMode: !1, scrollBehaviorType: "auto" },
  It = { ...Jv, ...Xv },
  Qv = async (e, t) => {
    var i;
    let n, r;
    if (!((i = e.meta) != null && i.validate)) return;
    const s =
      (([n, r] = bt(() => Promise.resolve(e.meta.validate(e)))),
      (n = await n),
      r(),
      n);
    if (s === !0) return;
    const o = Bn({
      fatal: !0,
      statusCode: (s && s.statusCode) || 404,
      statusMessage: (s && s.statusMessage) || `Page Not Found: ${e.fullPath}`,
      data: { path: e.fullPath },
    });
    return (
      typeof window < "u" && window.history.pushState({}, "", t.fullPath),
      o
    );
  },
  Zv = "$s";
function Wo(...e) {
  const t = typeof e[e.length - 1] == "string" ? e.pop() : void 0;
  typeof e[0] != "string" && e.unshift(t);
  const [n, r] = e;
  if (!n || typeof n != "string")
    throw new TypeError("[nuxt] [useState] key must be a string: " + n);
  if (r !== void 0 && typeof r != "function")
    throw new Error("[nuxt] [useState] init must be a function: " + r);
  const s = Zv + n,
    o = be(),
    i = La(o.payload.state, s);
  if (i.value === void 0 && r) {
    const a = r();
    if (Se(a)) return ((o.payload.state[s] = a), a);
    i.value = a;
  }
  return i;
}
function eE() {
  return globalThis.$fetch;
}
const ol = () => Wo("nuxt-session", () => ({})),
  Cp = () => Wo("nuxt-auth-ready", () => !1);
function ra() {
  const e = ol(),
    t = Cp();
  return {
    ready: Ce(() => t.value),
    loggedIn: Ce(() => !!e.value.user),
    user: Ce(() => e.value.user || null),
    session: e,
    fetch: tE,
    clear: nE,
  };
}
async function tE() {
  const e = Cp();
  ((ol().value = await eE()("/api/_auth/session", {
    headers: { Accept: "text/json" },
    retry: !1,
  }).catch(() => ({}))),
    e.value || (e.value = !0));
}
async function nE() {
  (await $fetch("/api/_auth/session", { method: "DELETE" }), (ol().value = {}));
}
const rE = async (e) => {
    const { loggedIn: t } = ra(),
      {
        public: { authStrategy: n },
      } = cn();
    if (n === "auth0" && !t.value && e.path !== "/login") return Mn("/login");
  },
  sE = async (e) => {
    let t, n;
    const r =
      (([t, n] = bt(() => el({ path: e.path }))), (t = await t), n(), t);
    if (r.redirect)
      return Bt(r.redirect, { acceptRelative: !0 })
        ? ((window.location.href = r.redirect), !1)
        : r.redirect;
  },
  oE = [Qv, rE, sE],
  Gr = {};
function iE(e, t, n) {
  const { pathname: r, search: s, hash: o } = t,
    i = e.indexOf("#");
  if (i > -1) {
    const u = o.includes(e.slice(i)) ? e.slice(i).length : 1;
    let c = o.slice(u);
    return (c[0] !== "/" && (c = "/" + c), cc(c, ""));
  }
  const a = cc(r, e),
    l = !n || B_(a, n) ? a : n;
  return l + (l.includes("?") ? "" : s) + o;
}
const aE = ot({
    name: "nuxt:router",
    enforce: "pre",
    async setup(e) {
      var S;
      let t,
        n,
        r = cn().app.baseURL;
      const s = ((S = It.history) == null ? void 0 : S.call(It, r)) ?? mv(r),
        o = It.routes
          ? (([t, n] = bt(() => It.routes(bi))), (t = await t), n(), t ?? bi)
          : bi;
      let i;
      const a = Uv({
        ...It,
        scrollBehavior: (g, E, m) => {
          if (E === mt) {
            i = m;
            return;
          }
          if (It.scrollBehavior) {
            if (
              ((a.options.scrollBehavior = It.scrollBehavior),
              "scrollRestoration" in window.history)
            ) {
              const b = a.beforeEach(() => {
                (b(), (window.history.scrollRestoration = "manual"));
              });
            }
            return It.scrollBehavior(g, mt, i || m);
          }
        },
        history: s,
        routes: o,
      });
      ("scrollRestoration" in window.history &&
        (window.history.scrollRestoration = "auto"),
        e.vueApp.use(a));
      const l = rn(a.currentRoute.value);
      (a.afterEach((g, E) => {
        l.value = E;
      }),
        Object.defineProperty(
          e.vueApp.config.globalProperties,
          "previousRoute",
          { get: () => l.value },
        ));
      const u = iE(r, window.location, e.payload.path),
        c = rn(a.currentRoute.value),
        f = () => {
          c.value = a.currentRoute.value;
        };
      (e.hook("page:finish", f),
        a.afterEach((g, E) => {
          var m, b, C, L;
          ((b = (m = g.matched[0]) == null ? void 0 : m.components) == null
            ? void 0
            : b.default) ===
            ((L = (C = E.matched[0]) == null ? void 0 : C.components) == null
              ? void 0
              : L.default) && f();
        }));
      const d = {};
      for (const g in c.value)
        Object.defineProperty(d, g, { get: () => c.value[g], enumerable: !0 });
      ((e._route = St(d)),
        e._middleware || (e._middleware = { global: [], named: {} }));
      const p = Ho();
      a.afterEach(async (g, E, m) => {
        (delete e._processingMiddleware,
          !e.isHydrating && p.value && (await e.runWithContext(Hy)),
          m && (await e.callHook("page:loading:end")));
      });
      try {
        (([t, n] = bt(() => a.isReady())), await t, n());
      } catch (g) {
        (([t, n] = bt(() => e.runWithContext(() => xn(g)))), await t, n());
      }
      const y =
        u !== a.currentRoute.value.fullPath
          ? a.resolve(u)
          : a.currentRoute.value;
      f();
      const h = e.payload.state._layout;
      return (
        a.beforeEach(async (g, E) => {
          var m;
          (await e.callHook("page:loading:start"),
            (g.meta = an(g.meta)),
            e.isHydrating && h && !Ht(g.meta.layout) && (g.meta.layout = h),
            (e._processingMiddleware = !0));
          {
            const b = new Set([...oE, ...e._middleware.global]);
            for (const C of g.matched) {
              const L = C.meta.middleware;
              if (L) for (const R of sl(L)) b.add(R);
            }
            {
              const C = await e.runWithContext(() => el({ path: g.path }));
              if (C.appMiddleware)
                for (const L in C.appMiddleware)
                  C.appMiddleware[L] ? b.add(L) : b.delete(L);
            }
            for (const C of b) {
              const L =
                typeof C == "string"
                  ? e._middleware.named[C] ||
                    (await ((m = Gr[C]) == null
                      ? void 0
                      : m.call(Gr).then((R) => R.default || R)))
                  : C;
              if (!L) throw new Error(`Unknown route middleware: '${C}'.`);
              try {
                const R = await e.runWithContext(() => L(g, E));
                if (
                  !e.payload.serverRendered &&
                  e.isHydrating &&
                  (R === !1 || R instanceof Error)
                ) {
                  const j =
                    R ||
                    Bn({
                      statusCode: 404,
                      statusMessage: `Page Not Found: ${u}`,
                    });
                  return (await e.runWithContext(() => xn(j)), !1);
                }
                if (R === !0) continue;
                if (R === !1) return R;
                if (R)
                  return (
                    tp(R) && R.fatal && (await e.runWithContext(() => xn(R))),
                    R
                  );
              } catch (R) {
                const j = Bn(R);
                return (j.fatal && (await e.runWithContext(() => xn(j))), j);
              }
            }
          }
        }),
        a.onError(async () => {
          (delete e._processingMiddleware,
            await e.callHook("page:loading:end"));
        }),
        a.afterEach(async (g, E) => {
          g.matched.length === 0 &&
            (await e.runWithContext(() =>
              xn(
                Bn({
                  statusCode: 404,
                  fatal: !1,
                  statusMessage: `Page not found: ${g.fullPath}`,
                  data: { path: g.fullPath },
                }),
              ),
            ));
        }),
        e.hooks.hookOnce("app:created", async () => {
          try {
            ("name" in y && (y.name = void 0),
              await a.replace({ ...y, force: !0 }),
              (a.options.scrollBehavior = It.scrollBehavior));
          } catch (g) {
            await e.runWithContext(() => xn(g));
          }
        }),
        { provide: { router: a } }
      );
    },
  }),
  Gc =
    globalThis.requestIdleCallback ||
    ((e) => {
      const t = Date.now(),
        n = {
          didTimeout: !1,
          timeRemaining: () => Math.max(0, 50 - (Date.now() - t)),
        };
      return setTimeout(() => {
        e(n);
      }, 1);
    }),
  ZC =
    globalThis.cancelIdleCallback ||
    ((e) => {
      clearTimeout(e);
    }),
  il = (e) => {
    const t = be();
    t.isHydrating
      ? t.hooks.hookOnce("app:suspense:resolve", () => {
          Gc(() => e());
        })
      : Gc(() => e());
  },
  lE = ot({
    name: "nuxt:payload",
    setup(e) {
      const t = new Set();
      (et().beforeResolve(async (n, r) => {
        if (n.path === r.path) return;
        const s = await Ac(n.path);
        if (s) {
          for (const o of t) delete e.static.data[o];
          for (const o in s.data)
            (o in e.static.data || t.add(o), (e.static.data[o] = s.data[o]));
        }
      }),
        il(() => {
          var n;
          (e.hooks.hook("link:prefetch", async (r) => {
            const { hostname: s } = new URL(r, window.location.href);
            s === window.location.hostname &&
              (await Ac(r).catch(() => {
                console.warn("[nuxt] Error preloading payload for", r);
              }));
          }),
            ((n = navigator.connection) == null ? void 0 : n.effectiveType) !==
              "slow-2g" && setTimeout(jo, 1e3));
        }));
    },
  }),
  cE = ot(() => {
    const e = et();
    il(() => {
      e.beforeResolve(async () => {
        await new Promise((t) => {
          (setTimeout(t, 100),
            requestAnimationFrame(() => {
              setTimeout(t, 0);
            }));
        });
      });
    });
  }),
  uE = ot((e) => {
    let t;
    async function n() {
      const r = await jo();
      (t && clearTimeout(t), (t = setTimeout(n, mc)));
      try {
        const s = await $fetch(Za("builds/latest.json") + `?${Date.now()}`);
        s.id !== r.id && e.hooks.callHook("app:manifest:update", s);
      } catch {}
    }
    il(() => {
      t = setTimeout(n, mc);
    });
  });
function fE(e = {}) {
  const t = e.path || window.location.pathname;
  let n = {};
  try {
    n = ss(sessionStorage.getItem("nuxt:reload") || "{}");
  } catch {}
  if (
    e.force ||
    (n == null ? void 0 : n.path) !== t ||
    (n == null ? void 0 : n.expires) < Date.now()
  ) {
    try {
      sessionStorage.setItem(
        "nuxt:reload",
        JSON.stringify({ path: t, expires: Date.now() + (e.ttl ?? 1e4) }),
      );
    } catch {}
    if (e.persistState)
      try {
        sessionStorage.setItem(
          "nuxt:reload:state",
          JSON.stringify({ state: be().payload.state }),
        );
      } catch {}
    window.location.pathname !== t
      ? (window.location.href = t)
      : window.location.reload();
  }
}
const dE = ot({
  name: "nuxt:chunk-reload",
  setup(e) {
    const t = et(),
      n = cn(),
      r = new Set();
    (t.beforeEach(() => {
      r.clear();
    }),
      e.hook("app:chunkError", ({ error: o }) => {
        r.add(o);
      }));
    function s(o) {
      const a =
        "href" in o && o.href[0] === "#"
          ? n.app.baseURL + o.href
          : Xn(n.app.baseURL, o.fullPath);
      fE({ path: a, persistState: !0 });
    }
    (e.hook("app:manifest:update", () => {
      t.beforeResolve(s);
    }),
      t.onError((o, i) => {
        r.has(o) && s(i);
      }));
  },
});
/*!
 * shared v10.0.7
 * (c) 2025 kazuya kawaguchi
 * Released under the MIT License.
 */ const po = typeof window < "u",
  Rn = (e, t = !1) => (t ? Symbol.for(e) : Symbol(e)),
  pE = (e, t, n) => hE({ l: e, k: t, s: n }),
  hE = (e) =>
    JSON.stringify(e)
      .replace(/\u2028/g, "\\u2028")
      .replace(/\u2029/g, "\\u2029")
      .replace(/\u0027/g, "\\u0027"),
  Ne = (e) => typeof e == "number" && isFinite(e),
  mE = (e) => Go(e) === "[object Date]",
  ho = (e) => Go(e) === "[object RegExp]",
  Ko = (e) => ce(e) && Object.keys(e).length === 0,
  Ae = Object.assign,
  gE = Object.create,
  ye = (e = null) => gE(e);
let qc;
const al = () =>
  qc ||
  (qc =
    typeof globalThis < "u"
      ? globalThis
      : typeof self < "u"
        ? self
        : typeof window < "u"
          ? window
          : typeof global < "u"
            ? global
            : ye());
function Yc(e) {
  return e
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
const bE = Object.prototype.hasOwnProperty;
function At(e, t) {
  return bE.call(e, t);
}
const Le = Array.isArray,
  Ee = (e) => typeof e == "function",
  V = (e) => typeof e == "string",
  Re = (e) => typeof e == "boolean",
  ue = (e) => e !== null && typeof e == "object",
  _E = (e) => ue(e) && Ee(e.then) && Ee(e.catch),
  Sp = Object.prototype.toString,
  Go = (e) => Sp.call(e),
  ce = (e) => Go(e) === "[object Object]",
  yE = (e) =>
    e == null
      ? ""
      : Le(e) || (ce(e) && e.toString === Sp)
        ? JSON.stringify(e, null, 2)
        : String(e);
function ll(e, t = "") {
  return e.reduce((n, r, s) => (s === 0 ? n + r : n + t + r), "");
}
function vE(e, t) {
  typeof console < "u" &&
    (console.warn("[intlify] " + e), t && console.warn(t.stack));
}
const Is = (e) => !ue(e) || Le(e);
function lr(e, t) {
  if (Is(e) || Is(t)) throw new Error("Invalid value");
  const n = [{ src: e, des: t }];
  for (; n.length; ) {
    const { src: r, des: s } = n.pop();
    Object.keys(r).forEach((o) => {
      o !== "__proto__" &&
        (ue(r[o]) && !ue(s[o]) && (s[o] = Array.isArray(r[o]) ? [] : ye()),
        Is(s[o]) || Is(r[o])
          ? (s[o] = r[o])
          : n.push({ src: r[o], des: s[o] }));
    });
  }
}
const EE = {
    addNewTable: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Add new table" } },
    after: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "After" } },
    alertAreaHectares: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Alert area (hectares)" },
    },
    alertDetectionRange: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Alert detection range" },
    },
    alertID: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Alert ID" } },
    alertType: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Alert type" } },
    alerts: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Alerts" } },
    alertsLast12Months: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Alerts in the last 12 months" },
    },
    alertsTotal: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Total number of alerts" },
    },
    andPreviousAlertsShownIn: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "and previous alerts shown in" },
    },
    auth0LoginError: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Error logging in with Auth0" },
    },
    authMessage: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "Please sign up or log in to access this application",
      },
    },
    availableViews: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Available Views" } },
    before: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Before" } },
    browserDoesntSupportAudio: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "Sorry, your browser does not support the audio element",
      },
    },
    browserDoesntSupportVideo: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "Sorry, your browser does not support the video element",
      },
    },
    cancel: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Cancel" } },
    category: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Category" } },
    changeDetectionAlerts: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Change Detection Alerts" },
    },
    clickOnAlertsForMoreInfo: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Click on alerts for more information" },
    },
    confidenceLevel: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Confidence level" },
    },
    configuration: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Configuration" } },
    configUpdated: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Configuration updated" },
    },
    confirm: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Confirm" } },
    copied: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Copied!" } },
    copyLink: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Copy link to alert" } },
    copyMapeoLink: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Copy link to Mapeo observation" },
    },
    created: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Created" } },
    dataCollectedOn: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Data collected on" },
    },
    dataProvider: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Data provider" } },
    dataProviders: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Data provider(s)" } },
    downloadCSV: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Download CSV" } },
    downloadGeoJSON: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Download GeoJSON" },
    },
    downloadKML: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Download KML" } },
    earlier: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Earlier" } },
    enable: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Enable" } },
    filtering: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Filtering" } },
    filterDataByColumn: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Filter data by column" },
    },
    filterOutValuesFromColumn: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "Which values to filter out from the column",
      },
    },
    frontEndFilterColumn: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Column to filter values from" },
    },
    gallery: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Gallery" } },
    galleryNotAvailable: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "GuardianConnector Explorer Gallery is not available. Please activate media embedding",
      },
    },
    geocoordinates: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Coordinates" } },
    geographicCentroid: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Geographic centroid" },
    },
    geotype: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Geotype" } },
    hectaresAffected: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Hectares affected" },
    },
    hectaresPerMonth: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Hectares per month" },
    },
    hectaresTotal: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Total number of hectares affected" },
    },
    ifYouAreZoomedOutAlertsWillBeShownAsA: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "If you are zoomed out, alerts will be shown as a",
      },
    },
    login: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Log in" } },
    loginButton: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Sign up or log in" } },
    loginError: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "An error occurred while trying to log in" },
    },
    logoUrl: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Logo URL" } },
    map: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Map" } },
    mapboxAccessToken: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Mapbox Access Token" },
    },
    mapboxBearing: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Map bearing (-180 to 180)" },
    },
    mapboxCenterLatitude: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Center latitude (-90 to 90)" },
    },
    mapboxCenterLongitude: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Center longitude (-180 to 180)" },
    },
    mapboxPitch: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Map pitch (0 to 85)" } },
    mapboxProjection: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Map projection" } },
    mapboxZoom: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Zoom level (0 to 22)" } },
    mapLegend: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Map Legend" } },
    mapLegendLayerIds: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Layer IDs to show in the map legend" },
    },
    mapbox3d: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Do you want to enable 3D terrain?" },
    },
    mapboxSatelliteUpTo2019: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Mapbox Satellite (up to 2019)" },
    },
    mapboxStreets: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Mapbox Streets" } },
    mapboxStyle: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Mapbox Style" } },
    mapeoCategoryIds: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "Mapeo Category IDs to show on the alerts map",
      },
    },
    mapeoData: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Mapeo data" } },
    mapeoTable: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Name of Mapeo data table" },
    },
    media: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Media" } },
    mediaBasePath: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Base path for media" },
    },
    mediaBasePathAlerts: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Base path for alert images" },
    },
    modified: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Modified" } },
    monthDetected: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Month detected" } },
    mostRecentAlerts: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Most recent alerts" },
    },
    mostRecentAlertsShownIn: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Most recent alerts shown on map in" },
    },
    notes: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Notes" } },
    noColumnEntry: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "No column entry" } },
    numberOfAlerts: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Number of alerts" } },
    orange: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "orange" } },
    other: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Other" } },
    password: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Password" } },
    passwordIncorrect: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "The password you entered is incorrect" },
    },
    planetApiKey: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Planet API Key" } },
    pleaseMatchFormat: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Por favor, siga el formato esperado" },
    },
    previewImagerySource: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Preview Imagery Source" },
    },
    previousAlerts: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Previous alerts" } },
    recentAlertsDate: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Date of most recent alerts published" },
    },
    recentAlertsNumber: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Number of most recent alerts" },
    },
    red: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "red" } },
    removeTable: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Remove table" } },
    removeTableAreYouSure: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "Are you sure you want to remove this table",
      },
    },
    resetDashboard: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Reset Dashboard" } },
    satelliteUsedForDetection: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Satellite used for detection" },
    },
    selectAlertDateRange: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Select an alert date range" },
    },
    selectBasemap: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Select basemap" } },
    selectTableToAdd: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Select table to add" },
    },
    submit: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Submit" } },
    table: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Table" } },
    tableAddedToViews: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Table added to views" },
    },
    tableRemovedFromViews: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Table removed from views" },
    },
    tableRemovedNote: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "Note: this does not delete the table from the database. It only removes any views configuration for the table",
      },
    },
    territory: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Territory" } },
    type: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Type" } },
    typeOfAlerts: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Type of alerts" } },
    unwantedColumns: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Unwanted columns" },
    },
    unwantedSubstrings: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Unwanted substrings" },
    },
    version: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Version" } },
    views: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Views" } },
    viewOnGoogleMaps: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "view on Google Maps" },
    },
    yourAccessIsPending: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "Your access is pending. Please contact a Guardian Connector administrator for account approval.",
      },
    },
    yourMapboxStyleDefault: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Mapbox - your style (default)" },
    },
  },
  wE = {
    addNewTable: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Agregar nueva tabela" },
    },
    after: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Después" } },
    alertAreaHectares: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Área de alerta (hectáreas)" },
    },
    alertDetectionRange: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Rango de detección de alertas" },
    },
    alertID: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "ID de alerta" } },
    alertType: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Tipo de alerta" } },
    alerts: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Alertas" } },
    alertsLast12Months: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Alertas en los últimos 12 meses" },
    },
    alertsTotal: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Número total de alertas" },
    },
    andPreviousAlertsShownIn: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "y alertas anteriores mostradas en" },
    },
    auth0LoginError: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Error al iniciar sesión con Auth0" },
    },
    authMessage: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "Por favor, regístrese o inicie sesión para acceder a esta aplicación",
      },
    },
    availableViews: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Vistas disponibles" },
    },
    before: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Antes" } },
    browserDoesntSupportAudio: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "Lo sentimos, su navegador no soporta el elemento de audio",
      },
    },
    browserDoesntSupportVideo: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "Lo sentimos, su navegador no soporta el elemento de video",
      },
    },
    cancel: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Cancelar" } },
    category: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Categoría" } },
    changeDetectionAlerts: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Alertas de detección de cambios" },
    },
    clickOnAlertsForMoreInfo: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "Haga clic en las alertas para obtener más información",
      },
    },
    confidenceLevel: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Nivel de confianza" },
    },
    configuration: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Configuración" } },
    configUpdated: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Configuración actualizada" },
    },
    confirm: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Confirmar" } },
    copied: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "¡Copiado!" } },
    copyLink: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Copiar enlace a la alerta" },
    },
    copyMapeoLink: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Copiar enlace a la observación de Mapeo" },
    },
    created: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Creado" } },
    dataCollectedOn: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Datos recopilados el" },
    },
    dataProvider: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Proveedor de datos" } },
    dataProviders: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Proveedor(es) de datos" },
    },
    downloadCSV: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Descargar CSV" } },
    downloadGeoJSON: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Descargar GeoJSON" },
    },
    downloadKML: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Descargar KML" } },
    earlier: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Anterior" } },
    enable: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Activar" } },
    filtering: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Filtrado" } },
    filterDataByColumn: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Filtrar datos por columna" },
    },
    filterOutValuesFromColumn: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Qué valores filtrar de la columna" },
    },
    frontEndFilterColumn: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Columna para filtrar valores" },
    },
    gallery: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Galería" } },
    galleryNotAvailable: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "La galería de GuardianConnector Explorer no está disponible. Por favor, active la incrustación de medios",
      },
    },
    geocoordinates: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Coordenadas" } },
    geographicCentroid: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Centroide geográfico" },
    },
    geotype: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Tipo de geometria" } },
    hectaresAffected: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Hectáreas afectadas" },
    },
    hectaresPerMonth: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Hectáreas por mes" },
    },
    hectaresTotal: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Número total de hectáreas afectadas" },
    },
    ifYouAreZoomedOutAlertsWillBeShownAsA: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "Si está alejado, las alertas se mostrarán como un",
      },
    },
    login: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Iniciar sesión" } },
    loginButton: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Regístrese o inicie sesión" },
    },
    loginError: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "Ocurrió un error al intentar iniciar sesión",
      },
    },
    logoUrl: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "URL del logo" } },
    map: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Mapa" } },
    mapboxAccessToken: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Token de acceso de Mapbox (pk.ey...)" },
    },
    mapboxBearing: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Orientación del mapa (-180 a 180)" },
    },
    mapboxCenterLatitude: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Latitud del centro (-90 a 90)" },
    },
    mapboxCenterLongitude: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Longitud del centro (-180 a 180)" },
    },
    mapboxPitch: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Inclinación del mapa (0 a 85)" },
    },
    mapboxProjection: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Proyección del mapa" },
    },
    mapboxZoom: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Nivel de zoom (0 a 22)" },
    },
    mapLegend: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Leyenda del mapa" } },
    mapLegendLayerIds: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "IDs de capas para mostrar en la leyenda del mapa",
      },
    },
    mapbox3d: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "¿Desea habilitar el terreno 3D?" },
    },
    mapboxSatelliteUpTo2019: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Mapbox Satellite (hasta 2019)" },
    },
    mapboxStreets: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Mapbox Streets" } },
    mapboxStyle: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Estilo de Mapbox" } },
    mapeoCategoryIds: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "IDs de categorías de Mapeo para mostrar en el mapa de alertas",
      },
    },
    mapeoData: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Datos de Mapeo" } },
    mapeoTable: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Nombre de la tabla de datos de Mapeo" },
    },
    media: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Medios" } },
    mediaBasePath: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Ruta base para medios" },
    },
    mediaBasePathAlerts: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Ruta base para imágenes de alertas" },
    },
    modified: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Modificado" } },
    monthDetected: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Mes detectado" } },
    mostRecentAlerts: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Alertas más recientes" },
    },
    mostRecentAlertsShownIn: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "Las alertas más recientes se muestran en el mapa en",
      },
    },
    notes: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Notas" } },
    noColumnEntry: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Sin entrada de columna" },
    },
    numberOfAlerts: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Número de alertas" },
    },
    orange: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "naranja" } },
    other: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Otro" } },
    password: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Contraseña" } },
    passwordIncorrect: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "La contraseña que ingresó es incorrecta" },
    },
    planetApiKey: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Clave API de Planet" },
    },
    pleaseMatchFormat: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Por favor, siga el formato esperado" },
    },
    previewImagerySource: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Vista previa de las fuentes de imágenes" },
    },
    previousAlerts: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Alertas anteriores" },
    },
    recentAlertsDate: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "Fecha de las alertas más recientes publicadas",
      },
    },
    recentAlertsNumber: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Número de alertas más recientes" },
    },
    red: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "rojo" } },
    removeTable: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Eliminar tabla" } },
    removeTableAreYouSure: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "¿Está seguro de que desea eliminar esta tabla?",
      },
    },
    resetDashboard: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Restablecer el tablero" },
    },
    satelliteUsedForDetection: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Satélite utilizado para la detección" },
    },
    selectAlertDateRange: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Seleccione un rango de fechas de alerta" },
    },
    selectBasemap: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Seleccione el mapa base" },
    },
    selectTableToAdd: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Seleccione la tabla para agregar" },
    },
    submit: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Enviar" } },
    table: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Tabla" } },
    tableAddedToViews: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Tabla agregada a las vistas" },
    },
    tableRemovedFromViews: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Tabla eliminada de las vistas" },
    },
    tableRemovedNote: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "Nota: esto no elimina la tabla de la base de datos. Solo elimina cualquier configuración de vistas para la tabla",
      },
    },
    territory: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Territorio" } },
    type: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Tipo" } },
    typeOfAlerts: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Tipo de alertas" } },
    unwantedColumns: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Columnas no deseadas" },
    },
    unwantedSubstrings: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Subcadenas no deseadas" },
    },
    version: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Versión" } },
    views: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Vistas" } },
    viewOnGoogleMaps: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "ver en Google Maps" },
    },
    yourAccessIsPending: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "Su acceso está pendiente. Ponte en contacto con un administrador de Guardian Connector para la aprobación de su cuenta.",
      },
    },
    yourMapboxStyleDefault: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Mapbox - su estilo (predeterminado)" },
    },
  },
  TE = {
    addNewTable: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Adicionar nova tabela" },
    },
    after: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Depois" } },
    alertAreaHectares: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Área de alerta (hectares)" },
    },
    alertDetectionRange: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Faixa de detecção de alerta" },
    },
    alertID: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "ID do alerta" } },
    alertType: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Tipo de alerta" } },
    alerts: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Alertas" } },
    alertsLast12Months: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Alertas nos últimos 12 meses" },
    },
    alertsTotal: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Número total de alertas" },
    },
    andPreviousAlertsShownIn: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "e alertas anteriores mostrados em" },
    },
    auth0LoginError: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Erro ao fazer login com Auth0" },
    },
    authMessage: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "Por favor, inscreva-se ou faça login para acessar este aplicativo",
      },
    },
    availableViews: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Visualizações disponíveis" },
    },
    before: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Antes" } },
    browserDoesntSupportAudio: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "Desculpe, seu navegador não suporta o elemento de áudio",
      },
    },
    browserDoesntSupportVideo: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "Desculpe, seu navegador não suporta o elemento de vídeo",
      },
    },
    cancel: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Cancelar" } },
    category: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Categoria" } },
    changeDetectionAlerts: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Alertas de detecção de mudança" },
    },
    clickOnAlertsForMoreInfo: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "Clique nos alertas para obter mais informações",
      },
    },
    confidenceLevel: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Nível de confiança" },
    },
    configuration: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Configuração" } },
    configUpdated: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Configuração atualizada" },
    },
    confirm: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Confirmar" } },
    copied: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Copiado!" } },
    copyLink: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Copiar link para alerta" },
    },
    copyMapeoLink: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Copiar link para observação do Mapeo" },
    },
    created: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Criado" } },
    dataCollectedOn: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Dados coletados em" },
    },
    dataProvider: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Provedor de dados" } },
    dataProviders: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Provedor(es) de dados" },
    },
    downloadCSV: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Baixar CSV" } },
    downloadGeoJSON: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Baixar GeoJSON" } },
    downloadKML: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Baixar KML" } },
    earlier: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Anterior" } },
    enable: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Ativar" } },
    filtering: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Filtragem" } },
    filterDataByColumn: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Filtrar dados por coluna" },
    },
    filterOutValuesFromColumn: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Quais valores filtrar da coluna" },
    },
    frontEndFilterColumn: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Coluna para filtrar valores" },
    },
    gallery: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Galeria" } },
    galleryNotAvailable: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "A galeria do GuardianConnector Explorer não está disponível. Por favor, ative a incorporação de mídia",
      },
    },
    geocoordinates: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Coordenadas" } },
    geographicCentroid: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Centróide geográfico" },
    },
    geotype: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Tipo de geometria" } },
    hectaresAffected: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Hectares afetados" },
    },
    hectaresPerMonth: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Hectares por mês" },
    },
    hectaresTotal: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Número total de hectares afetados" },
    },
    ifYouAreZoomedOutAlertsWillBeShownAsA: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "Se você estiver afastado, os alertas serão mostrados como um",
      },
    },
    login: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Faça login" } },
    loginButton: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Inscreva-se ou faça login" },
    },
    loginError: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Ocorreu um erro ao tentar fazer login" },
    },
    logoUrl: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "URL do logotipo" } },
    map: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Mapa" } },
    mapboxAccessToken: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Token de acesso do Mapbox" },
    },
    mapboxBearing: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Orientação do mapa (-180 a 180)" },
    },
    mapboxCenterLatitude: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Latitude do centro (-90 a 90)" },
    },
    mapboxCenterLongitude: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Longitude do centro (-180 a 180)" },
    },
    mapboxPitch: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Inclinação do mapa (0 a 85)" },
    },
    mapboxProjection: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Projeção do mapa" },
    },
    mapboxZoom: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Nível de zoom (0 a 22)" },
    },
    mapLegend: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Legenda do mapa" } },
    mapLegendLayerIds: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "IDs das camadas para mostrar na legenda do mapa",
      },
    },
    mapbox3d: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Deseja habilitar o terreno 3D?" },
    },
    mapboxSatelliteUpTo2019: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Mapbox Satellite (até 2019)" },
    },
    mapboxStreets: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Mapbox Streets" } },
    mapboxStyle: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Estilo do Mapbox" } },
    mapeoCategoryIds: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "IDs de categorias do Mapeo para mostrar no mapa de alertas",
      },
    },
    mapeoData: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Dados do Mapeo" } },
    mapeoTable: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Nome da tabela de dados do Mapeo" },
    },
    media: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Mídia" } },
    mediaBasePath: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Caminho base para mídia" },
    },
    mediaBasePathAlerts: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Caminho base para imagens de alertas" },
    },
    modified: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Modificado" } },
    monthDetected: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Mês detectado" } },
    mostRecentAlerts: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Alertas mais recentes" },
    },
    mostRecentAlertsShownIn: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "Alertas mais recentes mostrados no mapa em",
      },
    },
    notes: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Notas" } },
    noColumnEntry: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Sem entrada de coluna" },
    },
    numberOfAlerts: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Número de alertas" },
    },
    orange: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "laranja" } },
    other: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Outro" } },
    password: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Senha" } },
    passwordIncorrect: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "A senha que você inseriu está incorreta" },
    },
    planetApiKey: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Chave API do Planet" },
    },
    pleaseMatchFormat: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Por favor, siga o formato esperado" },
    },
    previewImagerySource: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Visualizar fonte de imagens" },
    },
    previousAlerts: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Alertas anteriores" },
    },
    recentAlertsDate: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "Data das alertas mais recentes publicadas",
      },
    },
    recentAlertsNumber: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Número de alertas mais recentes" },
    },
    red: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "vermelho" } },
    removeTable: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Remover tabela" } },
    removeTableAreYouSure: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "Tem certeza de que deseja remover esta tabela",
      },
    },
    resetDashboard: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Redefinir painel" } },
    satelliteUsedForDetection: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Satélite usado para detecção" },
    },
    selectAlertDateRange: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "Selecione um intervalo de datas de alerta",
      },
    },
    selectBasemap: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Selecione o mapa base" },
    },
    selectTableToAdd: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Selecione a tabela para adicionar" },
    },
    submit: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Enviar" } },
    table: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Tabela" } },
    tableAddedToViews: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Tabela adicionada às visualizações" },
    },
    tableRemovedFromViews: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Tabela removida das visualizações" },
    },
    tableRemovedNote: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "Observe: isso não exclui a tabela do banco de dados. Ele apenas remove qualquer configuração de visualizações para a tabela",
      },
    },
    territory: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Território" } },
    type: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Tipo" } },
    typeOfAlerts: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Tipo de alertas" } },
    unwantedColumns: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Colunas indesejadas" },
    },
    unwantedSubstrings: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Substrings indesejadas" },
    },
    version: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Versão" } },
    views: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Visualizações" } },
    viewOnGoogleMaps: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "ver no Google Maps" },
    },
    yourAccessIsPending: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "Seu acesso está pendente. Entre em contato com um administrador do Guardian Connector para aprovação da conta.",
      },
    },
    yourMapboxStyleDefault: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Mapbox - seu estilo (padrão)" },
    },
  },
  CE = {
    addNewTable: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Voeg nieuwe tabel toe" },
    },
    after: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Na" } },
    alertAreaHectares: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Alert gebied in hectaren" },
    },
    alertDetectionRange: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Alert detectie periode" },
    },
    alertID: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Alert ID" } },
    alertType: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Type alert" } },
    alerts: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Alerts" } },
    alertsLast12Months: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Alerts in de afgelopen 12 maanden" },
    },
    alertsTotal: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Totaal aantal alerts" },
    },
    andPreviousAlertsShownIn: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "en eerdere alerts getoond in" },
    },
    auth0LoginError: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Fout bij inloggen met Auth0" },
    },
    authMessage: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "Meld u aan of log in om toegang te krijgen tot deze applicatie",
      },
    },
    availableViews: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Beschikbare weergaven" },
    },
    before: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Voor" } },
    browserDoesntSupportAudio: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "Sorry, uw browser ondersteunt het audio-element niet",
      },
    },
    browserDoesntSupportVideo: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "Sorry, uw browser ondersteunt het video-element niet",
      },
    },
    cancel: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Annuleren" } },
    category: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Categorie" } },
    changeDetectionAlerts: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Veranderingsdetectie waarschuwingen" },
    },
    clickOnAlertsForMoreInfo: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Klik op alerts voor meer informatie" },
    },
    confidenceLevel: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Betrouwbaarheidsniveau" },
    },
    configuration: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Instellingen" } },
    configDeleted: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Instellingen verwijderd" },
    },
    configUpdated: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Configuratie bijgewerkt" },
    },
    confirm: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Bevestigen" } },
    copied: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Gekopieerd!" } },
    copyLink: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Kopieer link naar alert" },
    },
    copyMapeoLink: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Kopieer link naar Mapeo observatie" },
    },
    created: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Gemaakt" } },
    dataCollectedOn: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Data verzameld op" },
    },
    dataProvider: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Data provider" } },
    dataProviders: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Data provider(s)" } },
    downloadCSV: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Download CSV" } },
    downloadGeoJSON: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Download GeoJSON" },
    },
    downloadKML: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Download KML" } },
    earlier: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Eerder" } },
    enable: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Inschakelen" } },
    filtering: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Filteren" } },
    filterDataByColumn: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Filter data op kolom" },
    },
    filterOutValuesFromColumn: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Welke waarden uit de kolom filteren" },
    },
    frontEndFilterColumn: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Kolom om waarden uit te filteren" },
    },
    gallery: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Galerij" } },
    galleryNotAvailable: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "GuardianConnector Explorer Gallery is niet beschikbaar. Activeer media-inbedding",
      },
    },
    geocoordinates: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Coördinaten" } },
    geographicCentroid: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Geografisch middelpunt" },
    },
    geotype: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Geotype" } },
    hectaresAffected: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Getroffen hectaren" },
    },
    hectaresPerMonth: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Hectaren per maand" },
    },
    hectaresTotal: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Totaal aantal getroffen hectares" },
    },
    ifYouAreZoomedOutAlertsWillBeShownAsA: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "Als u bent uitgezoomd, worden alerts weergegeven als een",
      },
    },
    login: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Log in" } },
    loginButton: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Meld u aan of log in" },
    },
    loginError: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "Er is een fout opgetreden bij het inloggen",
      },
    },
    logoUrl: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Logo URL" } },
    map: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Kaart" } },
    mapboxAccessToken: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Mapbox toegangstoken" },
    },
    mapboxBearing: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Kaart richting (-180 tot 180)" },
    },
    mapboxCenterLatitude: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Midden breedtegraad (-90 tot 90)" },
    },
    mapboxCenterLongitude: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Midden lengtegraad (-180 tot 180)" },
    },
    mapboxPitch: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Kaart helling (0 tot 85)" },
    },
    mapboxProjection: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Kaart projectie" },
    },
    mapboxZoom: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Zoomniveau (0 tot 22)" },
    },
    mapLegend: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Kaartlegenda" } },
    mapLegendLayerIds: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Laag-ID's om in de kaartlegenda te tonen" },
    },
    mapbox3d: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Wilt u 3D-terrein inschakelen?" },
    },
    mapboxSatelliteUpTo2019: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Mapbox Satellite (tot 2019)" },
    },
    mapboxStreets: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Mapbox Streets" } },
    mapboxStyle: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Mapbox stijl" } },
    mapeoCategoryIds: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "Mapeo categorie-ID's om op de alertkaart te tonen",
      },
    },
    mapeoData: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Mapeo data" } },
    mapeoTable: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Naam van Mapeo datatabel" },
    },
    media: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Media" } },
    mediaBasePath: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Basis pad voor media" },
    },
    mediaBasePathAlerts: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Basis pad voor alert afbeeldingen" },
    },
    modified: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Gewijzigd" } },
    monthDetected: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Maand gedetecteerd" },
    },
    mostRecentAlerts: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Meest recente alerts" },
    },
    mostRecentAlertsShownIn: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Meest recente alerts getoond op kaart in" },
    },
    notes: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Notities" } },
    noColumnEntry: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Geen kolominvoer" } },
    numberOfAlerts: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Aantal alerts" } },
    orange: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "oranje" } },
    other: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Andere" } },
    password: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Wachtwoord" } },
    passwordIncorrect: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Het ingevoerde wachtwoord is onjuist" },
    },
    planetApiKey: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Planet API sleutel" } },
    pleaseMatchFormat: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Gelieve het verwachte formaat te volgen" },
    },
    previewImagerySource: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Bron van afbeeldingen" },
    },
    previousAlerts: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Vorige alerts" } },
    recentAlertsDate: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "Datum van meest recent gepubliceerde alerts",
      },
    },
    recentAlertsNumber: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Aantal meest recente alerts" },
    },
    red: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "rood" } },
    removeTable: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Tabel verwijderen" } },
    removeTableAreYouSure: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "Weet u zeker dat u deze tabel wilt verwijderen",
      },
    },
    resetDashboard: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Dashboard resetten" },
    },
    satelliteUsedForDetection: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Satelliet gebruikt voor detectie" },
    },
    selectAlertDateRange: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Selecteer een alert datum periode" },
    },
    selectBasemap: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Selecteer basiskaart" },
    },
    selectTableToAdd: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Selecteer tabel om toe te voegen" },
    },
    submit: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Toevoegen" } },
    table: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Tafel" } },
    tableAddedToViews: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Tabel toegevoegd aan weergaven" },
    },
    tableRemovedFromViews: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Tabel verwijderd uit weergaven" },
    },
    tableRemovedNote: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "Let op: dit verwijdert de tabel niet uit de database. Het verwijdert alleen de weergaveconfiguratie voor de tabel",
      },
    },
    territory: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Territorium" } },
    type: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Type" } },
    typeOfAlerts: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Type alerts" } },
    unwantedColumns: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Ongewenste kolommen" },
    },
    unwantedSubstrings: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Ongewenste subreeksen" },
    },
    version: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Versie" } },
    views: { t: 0, b: { t: 2, i: [{ t: 3 }], s: "Weergaven" } },
    viewOnGoogleMaps: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "bekijk op Google Maps" },
    },
    yourAccessIsPending: {
      t: 0,
      b: {
        t: 2,
        i: [{ t: 3 }],
        s: "Uw toegang is in behandeling. Neem contact op met een Guardian Connector-beheerder voor goedkeuring van je account.",
      },
    },
    yourMapboxStyleDefault: {
      t: 0,
      b: { t: 2, i: [{ t: 3 }], s: "Mapbox - uw stijl (standaard)" },
    },
  },
  Cn = ["en", "es", "pt", "nl"],
  sa = {
    en: [
      {
        key: "locale_en_46json_d99e866f",
        load: () => Promise.resolve(EE),
        cache: !0,
      },
    ],
    es: [
      {
        key: "locale_es_46json_71142acb",
        load: () => Promise.resolve(wE),
        cache: !0,
      },
    ],
    pt: [
      {
        key: "locale_pt_46json_3e2a8be8",
        load: () => Promise.resolve(TE),
        cache: !0,
      },
    ],
    nl: [
      {
        key: "locale_nl_46json_31d5742b",
        load: () => Promise.resolve(CE),
        cache: !0,
      },
    ],
  },
  SE = [],
  br = [
    {
      code: "en",
      name: "English",
      language: "en-US",
      files: [
        {
          path: "/Users/osa/Documents/dev/cmi/gc-explorer/i18n/locales/en.json",
          cache: void 0,
        },
      ],
    },
    {
      code: "es",
      name: "Español",
      language: "es-ES",
      files: [
        {
          path: "/Users/osa/Documents/dev/cmi/gc-explorer/i18n/locales/es.json",
          cache: void 0,
        },
      ],
    },
    {
      code: "pt",
      name: "Português",
      language: "pt-PT",
      files: [
        {
          path: "/Users/osa/Documents/dev/cmi/gc-explorer/i18n/locales/pt.json",
          cache: void 0,
        },
      ],
    },
    {
      code: "nl",
      name: "Nederlands",
      language: "nl-NL",
      files: [
        {
          path: "/Users/osa/Documents/dev/cmi/gc-explorer/i18n/locales/nl.json",
          cache: void 0,
        },
      ],
    },
  ],
  Ap = "@nuxtjs/i18n",
  AE = !1,
  RE = "i18n_redirected",
  LE = "nuxtI18nInternal",
  zc = "nuxt-i18n-slp";
function Xc(e) {
  return typeof e == "string" ? `'${e}'` : new PE().serialize(e);
}
const PE = (function () {
  var t;
  class e {
    constructor() {
      El(this, t, new Map());
    }
    compare(r, s) {
      const o = typeof r,
        i = typeof s;
      return o === "string" && i === "string"
        ? r.localeCompare(s)
        : o === "number" && i === "number"
          ? r - s
          : String.prototype.localeCompare.call(
              this.serialize(r, !0),
              this.serialize(s, !0),
            );
    }
    serialize(r, s) {
      if (r === null) return "null";
      switch (typeof r) {
        case "string":
          return s ? r : `'${r}'`;
        case "bigint":
          return `${r}n`;
        case "object":
          return this.$object(r);
        case "function":
          return this.$function(r);
      }
      return String(r);
    }
    serializeObject(r) {
      const s = Object.prototype.toString.call(r);
      if (s !== "[object Object]")
        return this.serializeBuiltInType(
          s.length < 10 ? `unknown:${s}` : s.slice(8, -1),
          r,
        );
      const o = r.constructor,
        i = o === Object || o === void 0 ? "" : o.name;
      if (i !== "" && globalThis[i] === o)
        return this.serializeBuiltInType(i, r);
      if (typeof r.toJSON == "function") {
        const a = r.toJSON();
        return (
          i +
          (a !== null && typeof a == "object"
            ? this.$object(a)
            : `(${this.serialize(a)})`)
        );
      }
      return this.serializeObjectEntries(i, Object.entries(r));
    }
    serializeBuiltInType(r, s) {
      const o = this["$" + r];
      if (o) return o.call(this, s);
      if (typeof (s == null ? void 0 : s.entries) == "function")
        return this.serializeObjectEntries(r, s.entries());
      throw new Error(`Cannot serialize ${r}`);
    }
    serializeObjectEntries(r, s) {
      const o = Array.from(s).sort((a, l) => this.compare(a[0], l[0]));
      let i = `${r}{`;
      for (let a = 0; a < o.length; a++) {
        const [l, u] = o[a];
        ((i += `${this.serialize(l, !0)}:${this.serialize(u)}`),
          a < o.length - 1 && (i += ","));
      }
      return i + "}";
    }
    $object(r) {
      let s = Lr(this, t).get(r);
      return (
        s === void 0 &&
          (Lr(this, t).set(r, `#${Lr(this, t).size}`),
          (s = this.serializeObject(r)),
          Lr(this, t).set(r, s)),
        s
      );
    }
    $function(r) {
      const s = Function.prototype.toString.call(r);
      return s.slice(-15) === "[native code] }"
        ? `${r.name || ""}()[native]`
        : `${r.name}(${r.length})${s.replace(/\s*\n\s*/g, "")}`;
    }
    $Array(r) {
      let s = "[";
      for (let o = 0; o < r.length; o++)
        ((s += this.serialize(r[o])), o < r.length - 1 && (s += ","));
      return s + "]";
    }
    $Date(r) {
      try {
        return `Date(${r.toISOString()})`;
      } catch {
        return "Date(null)";
      }
    }
    $ArrayBuffer(r) {
      return `ArrayBuffer[${new Uint8Array(r).join(",")}]`;
    }
    $Set(r) {
      return `Set${this.$Array(Array.from(r).sort((s, o) => this.compare(s, o)))}`;
    }
    $Map(r) {
      return this.serializeObjectEntries("Map", r.entries());
    }
  }
  t = new WeakMap();
  for (const n of ["Error", "RegExp", "URL"])
    e.prototype["$" + n] = function (r) {
      return `${n}(${r})`;
    };
  for (const n of [
    "Int8Array",
    "Uint8Array",
    "Uint8ClampedArray",
    "Int16Array",
    "Uint16Array",
    "Int32Array",
    "Uint32Array",
    "Float32Array",
    "Float64Array",
  ])
    e.prototype["$" + n] = function (r) {
      return `${n}[${r.join(",")}]`;
    };
  for (const n of ["BigInt64Array", "BigUint64Array"])
    e.prototype["$" + n] = function (r) {
      return `${n}[${r.join("n,")}${r.length > 0 ? "n" : ""}]`;
    };
  return e;
})();
function kE(e, t) {
  return e === t || Xc(e) === Xc(t);
}
function OE(e, t) {
  if (typeof e != "string")
    throw new TypeError("argument str must be a string");
  const n = {},
    r = t || {},
    s = r.decode || NE;
  let o = 0;
  for (; o < e.length; ) {
    const i = e.indexOf("=", o);
    if (i === -1) break;
    let a = e.indexOf(";", o);
    if (a === -1) a = e.length;
    else if (a < i) {
      o = e.lastIndexOf(";", i - 1) + 1;
      continue;
    }
    const l = e.slice(o, i).trim();
    if (r != null && r.filter && !(r != null && r.filter(l))) {
      o = a + 1;
      continue;
    }
    if (n[l] === void 0) {
      let u = e.slice(i + 1, a).trim();
      (u.codePointAt(0) === 34 && (u = u.slice(1, -1)), (n[l] = IE(u, s)));
    }
    o = a + 1;
  }
  return n;
}
function NE(e) {
  return e.includes("%") ? decodeURIComponent(e) : e;
}
function IE(e, t) {
  try {
    return t(e);
  } catch {
    return e;
  }
}
const Ms = /^[\u0009\u0020-\u007E\u0080-\u00FF]+$/;
function Jc(e, t, n) {
  const r = n || {},
    s = r.encode || encodeURIComponent;
  if (typeof s != "function") throw new TypeError("option encode is invalid");
  if (!Ms.test(e)) throw new TypeError("argument name is invalid");
  const o = s(t);
  if (o && !Ms.test(o)) throw new TypeError("argument val is invalid");
  let i = e + "=" + o;
  if (r.maxAge !== void 0 && r.maxAge !== null) {
    const a = r.maxAge - 0;
    if (Number.isNaN(a) || !Number.isFinite(a))
      throw new TypeError("option maxAge is invalid");
    i += "; Max-Age=" + Math.floor(a);
  }
  if (r.domain) {
    if (!Ms.test(r.domain)) throw new TypeError("option domain is invalid");
    i += "; Domain=" + r.domain;
  }
  if (r.path) {
    if (!Ms.test(r.path)) throw new TypeError("option path is invalid");
    i += "; Path=" + r.path;
  }
  if (r.expires) {
    if (!ME(r.expires) || Number.isNaN(r.expires.valueOf()))
      throw new TypeError("option expires is invalid");
    i += "; Expires=" + r.expires.toUTCString();
  }
  if (
    (r.httpOnly && (i += "; HttpOnly"),
    r.secure && (i += "; Secure"),
    r.priority)
  )
    switch (
      typeof r.priority == "string" ? r.priority.toLowerCase() : r.priority
    ) {
      case "low": {
        i += "; Priority=Low";
        break;
      }
      case "medium": {
        i += "; Priority=Medium";
        break;
      }
      case "high": {
        i += "; Priority=High";
        break;
      }
      default:
        throw new TypeError("option priority is invalid");
    }
  if (r.sameSite)
    switch (
      typeof r.sameSite == "string" ? r.sameSite.toLowerCase() : r.sameSite
    ) {
      case !0: {
        i += "; SameSite=Strict";
        break;
      }
      case "lax": {
        i += "; SameSite=Lax";
        break;
      }
      case "strict": {
        i += "; SameSite=Strict";
        break;
      }
      case "none": {
        i += "; SameSite=None";
        break;
      }
      default:
        throw new TypeError("option sameSite is invalid");
    }
  return (r.partitioned && (i += "; Partitioned"), i);
}
function ME(e) {
  return (
    Object.prototype.toString.call(e) === "[object Date]" || e instanceof Date
  );
}
function wt(e) {
  if (typeof e != "object") return e;
  var t,
    n,
    r = Object.prototype.toString.call(e);
  if (r === "[object Object]") {
    if (e.constructor !== Object && typeof e.constructor == "function") {
      n = new e.constructor();
      for (t in e) e.hasOwnProperty(t) && n[t] !== e[t] && (n[t] = wt(e[t]));
    } else {
      n = {};
      for (t in e)
        t === "__proto__"
          ? Object.defineProperty(n, t, {
              value: wt(e[t]),
              configurable: !0,
              enumerable: !0,
              writable: !0,
            })
          : (n[t] = wt(e[t]));
    }
    return n;
  }
  if (r === "[object Array]") {
    for (t = e.length, n = Array(t); t--; ) n[t] = wt(e[t]);
    return n;
  }
  return r === "[object Set]"
    ? ((n = new Set()),
      e.forEach(function (s) {
        n.add(wt(s));
      }),
      n)
    : r === "[object Map]"
      ? ((n = new Map()),
        e.forEach(function (s, o) {
          n.set(wt(o), wt(s));
        }),
        n)
      : r === "[object Date]"
        ? new Date(+e)
        : r === "[object RegExp]"
          ? ((n = new RegExp(e.source, e.flags)),
            (n.lastIndex = e.lastIndex),
            n)
          : r === "[object DataView]"
            ? new e.constructor(wt(e.buffer))
            : r === "[object ArrayBuffer]"
              ? e.slice(0)
              : r.slice(-6) === "Array]"
                ? new e.constructor(e)
                : e;
}
const xE = {
    path: "/",
    watch: !0,
    decode: (e) => ss(decodeURIComponent(e)),
    encode: (e) =>
      encodeURIComponent(typeof e == "string" ? e : JSON.stringify(e)),
  },
  xs = window.cookieStore;
function DE(e, t) {
  var u;
  const n = { ...xE, ...t };
  n.filter ?? (n.filter = (c) => c === e);
  const r = Qc(n) || {};
  let s;
  n.maxAge !== void 0
    ? (s = n.maxAge * 1e3)
    : n.expires && (s = n.expires.getTime() - Date.now());
  const o = s !== void 0 && s <= 0,
    i = o || r[e] === void 0 || r[e] === null,
    a = wt(
      o ? void 0 : (r[e] ?? ((u = n.default) == null ? void 0 : u.call(n))),
    ),
    l = s && !o ? UE(a, s, n.watch && n.watch !== "shallow") : ze(a);
  {
    let c = null;
    try {
      !xs &&
        typeof BroadcastChannel < "u" &&
        (c = new BroadcastChannel(`nuxt:cookies:${e}`));
    } catch {}
    const f = (h = !1) => {
        (!h && (n.readonly || kE(l.value, r[e]))) ||
          ($E(e, l.value, n),
          (r[e] = wt(l.value)),
          c == null || c.postMessage({ value: n.encode(l.value) }));
      },
      d = (h) => {
        var g;
        const S = h.refresh
          ? (g = Qc(n)) == null
            ? void 0
            : g[e]
          : n.decode(h.value);
        ((p = !0),
          (l.value = S),
          (r[e] = wt(S)),
          jt(() => {
            p = !1;
          }));
      };
    let p = !1;
    const y = !!ps();
    if (
      (y &&
        Ks(() => {
          ((p = !0), f(), c == null || c.close());
        }),
      xs)
    ) {
      const h = (S) => {
        const g = S.changed.find((m) => m.name === e),
          E = S.deleted.find((m) => m.name === e);
        (g && d({ value: g.value }), E && d({ value: null }));
      };
      (xs.addEventListener("change", h),
        y && Ks(() => xs.removeEventListener("change", h)));
    } else c && (c.onmessage = ({ data: h }) => d(h));
    (n.watch &&
      rt(
        l,
        () => {
          p || f();
        },
        { deep: n.watch !== "shallow" },
      ),
      i && f(i));
  }
  return l;
}
function Qc(e = {}) {
  return OE(document.cookie, e);
}
function FE(e, t, n = {}) {
  return t == null ? Jc(e, t, { ...n, maxAge: -1 }) : Jc(e, t, n);
}
function $E(e, t, n = {}) {
  document.cookie = FE(e, t, n);
}
const Zc = 2147483647;
function UE(e, t, n) {
  let r,
    s,
    o = 0;
  const i = n ? ze(e) : { value: e };
  return (
    ps() &&
      Ks(() => {
        (s == null || s(), clearTimeout(r));
      }),
    Ra((a, l) => {
      n && (s = rt(i, l));
      function u() {
        ((o = 0), clearTimeout(r));
        const c = t - o,
          f = c < Zc ? c : Zc;
        r = setTimeout(() => {
          if (((o += f), o < t)) return u();
          ((i.value = void 0), l());
        }, f);
      }
      return {
        get() {
          return (a(), i.value);
        },
        set(c) {
          (u(), (i.value = c), l());
        },
      };
    })
  );
}
function HE(e) {
  if (e != null && e.__asyncLoader && !e.__asyncResolved)
    return e.__asyncLoader();
}
async function jE(e, t = et()) {
  const { path: n, matched: r } = t.resolve(e);
  if (
    !r.length ||
    (t._routePreloaded || (t._routePreloaded = new Set()),
    t._routePreloaded.has(n))
  )
    return;
  const s = t._preloadPromises || (t._preloadPromises = []);
  if (s.length > 4) return Promise.all(s).then(() => jE(e, t));
  t._routePreloaded.add(n);
  const o = r
    .map((i) => {
      var a;
      return (a = i.components) == null ? void 0 : a.default;
    })
    .filter((i) => typeof i == "function");
  for (const i of o) {
    const a = Promise.resolve(i())
      .catch(() => {})
      .finally(() => s.splice(s.indexOf(a)));
    s.push(a);
  }
  await Promise.all(s);
}
function qo(e) {
  return V(e) ? e : e != null ? e.toString() : "(null)";
}
function eu(e, t, n) {
  const {
      defaultLocale: r,
      strategy: s,
      routesNameSeparator: o,
      defaultLocaleRouteNameSuffix: i,
      differentDomains: a,
    } = n,
    l = s !== "no_prefix" || a,
    u = qo(e) + (l ? o + t : "");
  return t === r && s === "prefix_and_default" ? u + o + i : u;
}
function VE(e, t) {
  const n = [];
  for (const [r, s] of t.entries()) {
    const o = e.find((i) => {
      var a;
      return (
        ((a = i.language) == null ? void 0 : a.toLowerCase()) ===
        s.toLowerCase()
      );
    });
    if (o) {
      n.push({ code: o.code, score: 1 - r / t.length });
      break;
    }
  }
  for (const [r, s] of t.entries()) {
    const o = s.split("-")[0].toLowerCase(),
      i = e.find((a) => {
        var l;
        return (
          ((l = a.language) == null
            ? void 0
            : l.split("-")[0].toLowerCase()) === o
        );
      });
    if (i) {
      n.push({ code: i.code, score: 0.999 - r / t.length });
      break;
    }
  }
  return n;
}
function BE(e, t) {
  return e.score === t.score
    ? t.code.length - e.code.length
    : t.score - e.score;
}
function WE(e, t) {
  const n = e.map((s) => ({ code: s.code, language: s.language || s.code })),
    r = VE(n, t);
  return r.length === 0 ? "" : (r.length > 1 && r.sort(BE), r[0].code);
}
function Rp(e) {
  return new RegExp(`^/(${e.join("|")})(?:/|$)`, "i");
}
const KE = `(${Cn.join("|")})`,
  oa = Rp(Cn);
function GE() {
  const { routesNameSeparator: e, defaultLocaleRouteNameSuffix: t } =
      cn().public.i18n,
    n = `(?:${e}${t})?`,
    r = new RegExp(`${e}${KE}${n}$`, "i");
  return (s) => {
    var o, i, a;
    return V(s)
      ? (((o = s.match(oa)) == null ? void 0 : o[1]) ?? "")
      : s.name
        ? (((i = qo(s.name).match(r)) == null ? void 0 : i[1]) ?? "")
        : s.path
          ? (((a = s.path.match(oa)) == null ? void 0 : a[1]) ?? "")
          : "";
  };
}
function qE(e) {
  return e != null && "global" in e && "mode" in e;
}
function YE(e) {
  return e != null && !("__composer" in e) && "locale" in e && Se(e.locale);
}
function Lp(e) {
  return e != null && "__composer" in e;
}
function mo(e) {
  return qE(e) ? e.global : e;
}
function Fr(e) {
  const t = mo(e);
  return YE(t) ? t : Lp(t) ? t.__composer : t;
}
function Yo() {
  return window.location.host;
}
function zE(e, t, n) {
  var a, l, u;
  const r = Yo();
  if (!r) return r;
  const s = V(n) ? n : n.path,
    o = e.filter((c) =>
      c.domain
        ? (Bt(c.domain)
            ? c.domain.replace(/(http|https):\/\//, "")
            : c.domain) === r
        : Le(c == null ? void 0 : c.domains)
          ? c.domains.includes(r)
          : !1,
    );
  if (o.length === 0) return "";
  if (o.length === 1) return ((a = o[0]) == null ? void 0 : a.code) ?? "";
  if (t === "no_prefix")
    return (
      console.warn(
        Op(
          "Multiple matching domains found! This is not supported for no_prefix strategy in combination with differentDomains!",
        ),
      ),
      ((l = o[0]) == null ? void 0 : l.code) ?? ""
    );
  if (n && s) {
    const c =
      (u = s.match(Rp(o.map((f) => f.code)))) == null ? void 0 : u.at(1);
    if (c) {
      const f = o.find((d) => d.code === c);
      return (f == null ? void 0 : f.code) ?? "";
    }
  }
  const i = o.find((c) => {
    var f;
    return (
      ((f = c.defaultForDomains) == null ? void 0 : f.includes(r)) ??
      c.domainDefault
    );
  });
  return (i == null ? void 0 : i.code) ?? "";
}
function Pp(e) {
  var i, a;
  be();
  const t = Yo(),
    { domainLocales: n } = cn().public.i18n,
    r = br.find((l) => l.code === e),
    s =
      ((i = n == null ? void 0 : n[e]) == null ? void 0 : i.domain) ||
      (r == null ? void 0 : r.domain) ||
      ((a = r == null ? void 0 : r.domains) == null
        ? void 0
        : a.find((l) => l === t));
  if (!s) {
    console.warn(Op("Could not find domain name for locale " + e));
    return;
  }
  return Bt(s, { strict: !0 })
    ? s
    : new URL(window.location.origin).protocol + "//" + s;
}
function XE(e, t) {
  const {
    multiDomainLocales: n,
    strategy: r,
    routesNameSeparator: s,
    defaultLocaleRouteNameSuffix: o,
  } = e;
  if (!n || !(r === "prefix_except_default" || r === "prefix_and_default"))
    return;
  const i = et(),
    a = [s, o].join("");
  for (const l of i.getRoutes()) {
    const u = qo(l.name);
    if (u.endsWith(a)) {
      i.removeRoute(u);
      continue;
    }
    const c = u.split(s)[1];
    c === t &&
      i.addRoute({
        ...l,
        path: l.path === `/${c}` ? "/" : l.path.replace(`/${c}`, ""),
      });
  }
}
function JE(e) {
  const {
      locales: t,
      domainLocales: n,
      defaultLocale: r,
      multiDomainLocales: s,
    } = e,
    o = Yo();
  if (!s) {
    const i = br.find((a) => {
      var f;
      const l = V(a) ? a : a.code,
        u = br.find((d) => d.code === l);
      return (
        (((f = n == null ? void 0 : n[l]) == null ? void 0 : f.domain) ??
          (u == null ? void 0 : u.domain)) === o
      );
    });
    return (i == null ? void 0 : i.code) ?? r ?? "";
  }
  if (t.some((i) => !V(i) && i.defaultForDomains != null)) {
    const i = t.find((a) => {
      var l;
      return !V(a) && !!((l = a.defaultForDomains) != null && l.includes(o));
    });
    return (i == null ? void 0 : i.code) ?? "";
  }
  return r || "";
}
const qr = new Map();
async function QE(e, t) {
  const n = { messages: {} };
  for (const r of e) {
    const { default: s } = await r(),
      o = Ee(s) ? await t.runWithContext(() => s()) : s;
    lr(o, n);
  }
  return n;
}
function kp(e, t) {
  if (e === !1) return [];
  if (Le(e)) return e;
  let n = [];
  if (V(e)) return (t.every((s) => s !== e) && n.push(e), n);
  const r = [...t, "default"];
  for (const s of r) s in e && (n = [...n, ...e[s].filter(Boolean)]);
  return n;
}
const ZE = (e) => Go(e) === "[object Module]";
async function ew(e, { key: t, load: n }, r) {
  let s = null;
  try {
    const o = await n().then((i) => (ZE(i) ? i.default : i));
    Ee(o)
      ? (s = await r.runWithContext(() => o(e)))
      : ((s = o), s != null && qr && qr.set(t, s));
  } catch (o) {
    console.error("Failed locale loading: " + o.message);
  }
  return s;
}
async function ia(e, t, n, r) {
  const s = t[e];
  if (s == null) return;
  const o = {};
  for (const i of s) {
    let a = null;
    (qr && qr.has(i.key) && i.cache
      ? (a = qr.get(i.key))
      : (a = await r.runWithContext(() => ew(e, i, r))),
      a != null && lr(a, o));
  }
  n(e, o);
}
function _r(e, t) {
  const n = te(t),
    r = ue(n) ? (n == null ? void 0 : n.name) : n;
  if (!(n == null || !r))
    return qo(r).split(e.runtimeConfig.public.i18n.routesNameSeparator)[0];
}
function cl(e, t, n) {
  var s;
  if (V(t) && Bt(t, { acceptRelative: !0 })) return t;
  const r = ul(e, t, n);
  return r == null
    ? ""
    : ((s = r.redirectedFrom) == null ? void 0 : s.fullPath) || r.fullPath;
}
function zo(e, t, n) {
  return ul(e, t, n) ?? void 0;
}
function tw(e) {
  if (!V(e)) return Ae({}, e);
  if (e[0] === "/") {
    const { pathname: t, search: n, hash: r } = Wi(e);
    return { path: t, query: Qa(n), hash: r };
  }
  return { name: e };
}
const nw = (e) => !!e.path && !e.name;
function rw(e, t, n) {
  const r = e.runtimeConfig.public.i18n;
  if (nw(t)) {
    const o = ow(e, t, n),
      i = _r(e, o);
    return i
      ? ((o.name = eu(i, n, r)), o)
      : (!r.differentDomains &&
          lw(n, r.defaultLocale, r.strategy) &&
          (t.path = "/" + n + t.path),
        (t.path = (r.trailingSlash ? ao : hr)(t.path, !0)),
        t);
  }
  t.name || (t.name = _r(e, e.router.currentRoute.value));
  const s = eu(t.name, n, r);
  return (e.router.hasRoute(s) && (t.name = s), t);
}
function ul(e, t, n) {
  try {
    const r = n || te(mo(e.i18n).locale),
      s = tw(t),
      o = e.router.resolve(rw(e, s, r));
    return o.name ? o : e.router.resolve(t);
  } catch (r) {
    if (Dt(r, 1)) return null;
  }
}
function sw(e, t) {
  var r;
  if (e.runtimeConfig.public.i18n.experimental.switchLocalePathLinkSSR)
    return te(e.metaState.value);
  const n = t.meta || {};
  return ((r = te(n)) == null ? void 0 : r[LE]) || {};
}
function fl(e, t, n) {
  const r = n ?? e.router.currentRoute.value,
    s = _r(e, r);
  if (!s) return "";
  const o = sw(e, r)[t],
    i = {
      name: s,
      params: Ae({}, r.params, o),
      fullPath: r.fullPath,
      query: r.query,
      hash: r.hash,
      path: r.path,
      meta: r.meta,
    },
    a = cl(e, i, t);
  if (e.runtimeConfig.public.i18n.differentDomains) {
    const l = Pp(t);
    return (l && Xn(l, a)) || a;
  }
  return a;
}
function ow(e, t, n) {
  if (e.runtimeConfig.public.i18n.strategy === "no_prefix") return t;
  if (e.runtimeConfig.public.i18n.strategy !== "prefix")
    return e.router.resolve(t);
  const r = t.path.slice(1),
    s = t.path[0] + n + (r && "/" + r),
    o = e.router.options.routes.find((i) => i.path === s);
  return o == null ? t : e.router.resolve(Ae({}, t, o, { path: s }));
}
function Op(e) {
  return `[${Ap}]: ${e}`;
}
function Np(e) {
  return {
    i18n: e ?? be().$i18n,
    router: et(),
    runtimeConfig: cn(),
    metaState: Wo("nuxt-i18n-meta", () => ({})),
  };
}
async function Ip(e, t, n = !1) {
  const { differentDomains: r, skipSettingLocaleOnNavigate: s } =
      e.$config.public.i18n,
    o = ys(e.$config.public.i18n),
    i = te(e.$i18n.locale),
    a = te(e.$i18n.localeCodes);
  function l(d = i) {
    o === !1 || !o.useCookie || s || e.$i18n.setLocaleCookie(d);
  }
  const u = await e.$i18n.onBeforeLanguageSwitch(i, t, n, e);
  if (u && a.includes(u)) {
    if (i === u) return (l(), !1);
    t = u;
  }
  if (!t || (!n && r) || i === t) return (l(), !1);
  const c = te(e.$i18n.fallbackLocale),
    f = e.$i18n.mergeLocaleMessage.bind(e.$i18n);
  if (c) {
    const d = kp(c, [t]);
    await Promise.all(d.map((p) => ia(p, sa, f, e)));
  }
  return (
    await ia(t, sa, f, e),
    s
      ? !1
      : (l(t),
        e._vueI18n.__setLocale(t),
        await e.$i18n.onLanguageSwitched(i, t),
        !0)
  );
}
function iw(e, t, n, r, s) {
  const {
      strategy: o,
      defaultLocale: i,
      differentDomains: a,
      multiDomainLocales: l,
    } = e.$config.public.i18n,
    u = ys(),
    c = hw(e, t, s, r);
  if (c.locale && c.from != null && Cn.includes(c.locale)) return c.locale;
  let f = "";
  a || l ? f || (f = zE(br, o, t)) : o !== "no_prefix" && (f || (f = n));
  const d =
    (Cn.includes(c.locale) || (s && Cn.includes(s))) && u && u.useCookie && s;
  return (f || (f = d || r || i || ""), f);
}
function Mp({ to: e, nuxtApp: t, from: n, locale: r, routeLocale: s }, o = !1) {
  if (s === r || t.$i18n.strategy === "no_prefix") return "";
  const i = Np();
  let a = fl(i, r, e);
  return (
    o && !a && (a = cl(i, e.fullPath, r)),
    uc(a, e.fullPath) || (n && uc(a, n.fullPath)) ? "" : a
  );
}
const aw = () => Wo(Ap + ":redirect", () => "");
async function xp({ nuxt: e, locale: t, route: n, redirectPath: r }, s = !1) {
  const {
    rootRedirect: o,
    differentDomains: i,
    multiDomainLocales: a,
    skipSettingLocaleOnNavigate: l,
    locales: u,
    strategy: c,
  } = e.$config.public.i18n;
  if (n.path === "/" && o)
    return (
      V(o) ? (r = "/" + o) : ((r = "/" + o.path), o.statusCode),
      (r = e.$localePath(r, t)),
      Mn(r, {})
    );
  if (
    !(
      l &&
      ((e._vueI18n.__pendingLocale = t),
      (e._vueI18n.__pendingLocalePromise = new Promise((f) => {
        e._vueI18n.__resolvePendingLocalePromise = () => f();
      })),
      !s)
    )
  ) {
    if (a && c === "prefix_except_default") {
      const f = Yo(),
        d = u.find((y) => {
          var h;
          if (!V(y))
            return (h = y.defaultForDomains) == null
              ? void 0
              : h.find((S) => S === f);
        }),
        p = V(d) || d == null ? void 0 : d.code;
      if (n.path.startsWith(`/${p}`)) return Mn(n.path.replace(`/${p}`, ""));
      if (!n.path.startsWith(`/${t}`) && t !== p) {
        const y = e._vueI18n.__localeFromRoute(n.path);
        return Mn(
          y !== ""
            ? `/${t + n.path.replace(`/${y}`, "")}`
            : `/${t + (n.path === "/" ? "" : n.path)}`,
        );
      }
      return r && n.path !== r ? Mn(r) : void 0;
    }
    if (i) {
      const f = aw();
      f.value && f.value !== r && ((f.value = ""), window.location.assign(r));
    } else if (r) return Mn(r);
  }
}
function lw(e, t, n) {
  return (
    n !== "no_prefix" &&
    !(e === t && (n === "prefix_and_default" || n === "prefix_except_default"))
  );
}
function cw(e) {
  const {
    baseUrl: t,
    defaultLocale: n,
    differentDomains: r,
  } = e.$config.public.i18n;
  if (Ee(t)) return () => t(e);
  const s = Ee(n) ? n() : n;
  return () => {
    if (r && s) {
      const o = Pp(s);
      if (o) return o;
    }
    return t ?? "";
  };
}
function uw(e) {
  return Le(e) ? e : [e];
}
function qn(e, t = Np()) {
  return (...n) => e(t, ...n);
}
function fw() {
  const e = navigator.languages;
  return WE(br, e) || void 0;
}
function dw() {
  const e = ys(),
    t = (e && e.cookieKey) || RE,
    n = new Date(),
    r = {
      path: "/",
      readonly: !1,
      expires: new Date(n.setDate(n.getDate() + 365)),
      sameSite: e && e.cookieCrossOrigin ? "none" : "lax",
      domain: (e && e.cookieDomain) || void 0,
      secure: (e && e.cookieCrossOrigin) || (e && e.cookieSecure),
    };
  return DE(t, r);
}
function pw(e, t, n) {
  if (t === !1 || !t.useCookie) return;
  const r = e.value ?? void 0;
  if (r != null) {
    if (Cn.includes(r)) return r;
    if (n) return ((e.value = n), n);
    e.value = void 0;
  }
}
function hw(e, t, n, r = "") {
  const s = ys();
  if (!s) return { locale: "", error: "disabled" };
  const o = e.$i18n.strategy;
  if (!e._vueI18n.__firstAccess)
    return { locale: o === "no_prefix" ? r : "", error: "first_access_only" };
  if (o !== "no_prefix") {
    const u = V(t) ? t : t.path;
    if (s.redirectOn === "root" && u !== "/")
      return { locale: "", error: "not_redirect_on_root" };
    if (s.redirectOn === "no prefix" && !s.alwaysRedirect && u.match(oa))
      return { locale: "", error: "not_redirect_on_no_prefix" };
  }
  const a = (s.useCookie && n) || void 0;
  if (a) return { locale: a, from: "cookie" };
  const l = e.$i18n.getBrowserLocale();
  return l
    ? { locale: l, from: "navigator_or_header" }
    : { locale: s.fallbackLocale || "", from: "fallback" };
}
function ys(e = cn().public.i18n) {
  return (e == null ? void 0 : e.detectBrowserLanguage) === !1
    ? !1
    : e == null
      ? void 0
      : e.detectBrowserLanguage;
}
function mw(e) {
  const t = be(),
    n = te(t.$i18n.locale),
    r = te(t.$i18n.locales).map((a) => (V(a) ? { code: a } : a)),
    s = r.find((a) => a.code === n) || { code: n },
    o = Xn(te(Fr(t.$i18n).baseUrl), t.$config.app.baseURL),
    i = t.$config.public.i18n;
  return (
    o ||
      console.warn(
        "I18n `baseUrl` is required to generate valid SEO tag links.",
      ),
    {
      dir: e.dir,
      lang: e.lang,
      key: e.key,
      seo: e.seo,
      locale: n,
      locales: r,
      currentDir: s.dir || i.defaultDirection,
      currentLocale: s,
      currentLanguage: s.language,
      baseUrl: o,
      runtimeI18n: i,
    }
  );
}
function gw(e, { dir: t = !0, lang: n = !0, seo: r = !0, key: s = "hid" }) {
  return bw(e, { dir: t, lang: n, seo: r, key: s });
}
function bw(e, t) {
  const n = { htmlAttrs: {}, link: [], meta: [] },
    r = mw(t);
  return (
    r.baseUrl == null ||
      (r.dir && (n.htmlAttrs.dir = r.currentDir),
      r.lang && r.currentLanguage && (n.htmlAttrs.lang = r.currentLanguage),
      r.seo &&
        ((n.link = n.link.concat(_w(e, r), yw(e, r))),
        (n.meta = n.meta.concat(vw(e, r), Ew(r), ww(r))))),
    n
  );
}
function _w(e, t) {
  const { defaultLocale: n, strategy: r, differentDomains: s } = t.runtimeI18n,
    o = [];
  if (r === "no_prefix" && !s) return o;
  const i = new Map();
  for (const u of t.locales) {
    if (!u.language) {
      console.warn(
        "Locale `language` ISO code is required to generate alternate link",
      );
      continue;
    }
    const [c, f] = u.language.split("-");
    (c && f && (u.isCatchallLocale || !i.has(c)) && i.set(c, u),
      i.set(u.language, u));
  }
  const a = t.runtimeI18n.experimental.alternateLinkCanonicalQueries === !0,
    l = a ? e.router.resolve({ query: {} }) : void 0;
  !t.runtimeI18n.experimental.switchLocalePathLinkSSR &&
    a &&
    (l.meta = e.router.currentRoute.value.meta);
  for (const [u, c] of i.entries()) {
    const f = fl(e, c.code, l);
    if (!f) continue;
    const d = s && c.domain ? f : Xn(t.baseUrl, f),
      p = $o(d, a ? Fp(e, t) : {});
    (o.push({
      [t.key]: `i18n-alt-${u}`,
      rel: "alternate",
      href: p,
      hreflang: u,
    }),
      n &&
        n === c.code &&
        o.unshift({
          [t.key]: "i18n-xd",
          rel: "alternate",
          href: p,
          hreflang: "x-default",
        }));
  }
  return o;
}
function Dp(e, t) {
  const n = e.router.currentRoute.value,
    r = zo(e, Ae({}, n, { path: void 0, name: _r(e, n) }));
  return r ? $o(Xn(t.baseUrl, r.path), Fp(e, t)) : "";
}
function yw(e, t) {
  const n = Dp(e, t);
  return n ? [{ [t.key]: "i18n-can", rel: "canonical", href: n }] : [];
}
function Fp(e, t) {
  var a;
  const n = e.router.currentRoute.value,
    r = zo(e, Ae({}, n, { path: void 0, name: _r(e, n) })),
    s =
      (ue(t.seo) && ((a = t.seo) == null ? void 0 : a.canonicalQueries)) || [],
    o = (r == null ? void 0 : r.query) || {},
    i = {};
  for (const l of s.filter((u) => u in o)) {
    i[l] ?? (i[l] = []);
    for (const u of uw(o[l])) i[l].push(u || "");
  }
  return i;
}
function vw(e, t) {
  const n = Dp(e, t);
  return n ? [{ [t.key]: "i18n-og-url", property: "og:url", content: n }] : [];
}
function Ew(e) {
  return e.currentLanguage
    ? [
        {
          [e.key]: "i18n-og",
          property: "og:locale",
          content: $p(e.currentLanguage),
        },
      ]
    : [];
}
function ww(e) {
  return e.locales
    .filter((n) => n.language && n.language !== e.currentLanguage)
    .map((n) => ({
      [e.key]: `i18n-og-alt-${n.language}`,
      property: "og:locale:alternate",
      content: $p(n.language),
    }));
}
function $p(e = "") {
  return e.replace(/-/g, "_");
}
/*!
 * message-compiler v10.0.7
 * (c) 2025 kazuya kawaguchi
 * Released under the MIT License.
 */ function Tw(e, t, n) {
  return { line: e, column: t, offset: n };
}
function aa(e, t, n) {
  return { start: e, end: t };
}
const he = {
    EXPECTED_TOKEN: 1,
    INVALID_TOKEN_IN_PLACEHOLDER: 2,
    UNTERMINATED_SINGLE_QUOTE_IN_PLACEHOLDER: 3,
    UNKNOWN_ESCAPE_SEQUENCE: 4,
    INVALID_UNICODE_ESCAPE_SEQUENCE: 5,
    UNBALANCED_CLOSING_BRACE: 6,
    UNTERMINATED_CLOSING_BRACE: 7,
    EMPTY_PLACEHOLDER: 8,
    NOT_ALLOW_NEST_PLACEHOLDER: 9,
    INVALID_LINKED_FORMAT: 10,
    MUST_HAVE_MESSAGES_IN_PLURAL: 11,
    UNEXPECTED_EMPTY_LINKED_MODIFIER: 12,
    UNEXPECTED_EMPTY_LINKED_KEY: 13,
    UNEXPECTED_LEXICAL_ANALYSIS: 14,
  },
  Cw = 17;
function Xo(e, t, n = {}) {
  const { domain: r, messages: s, args: o } = n,
    i = e,
    a = new SyntaxError(String(i));
  return ((a.code = e), t && (a.location = t), (a.domain = r), a);
}
function Sw(e) {
  throw e;
}
const Kt = " ",
  Aw = "\r",
  Qe = `
`,
  Rw = "\u2028",
  Lw = "\u2029";
function Pw(e) {
  const t = e;
  let n = 0,
    r = 1,
    s = 1,
    o = 0;
  const i = (R) => t[R] === Aw && t[R + 1] === Qe,
    a = (R) => t[R] === Qe,
    l = (R) => t[R] === Lw,
    u = (R) => t[R] === Rw,
    c = (R) => i(R) || a(R) || l(R) || u(R),
    f = () => n,
    d = () => r,
    p = () => s,
    y = () => o,
    h = (R) => (i(R) || l(R) || u(R) ? Qe : t[R]),
    S = () => h(n),
    g = () => h(n + o);
  function E() {
    return ((o = 0), c(n) && (r++, (s = 0)), i(n) && n++, n++, s++, t[n]);
  }
  function m() {
    return (i(n + o) && o++, o++, t[n + o]);
  }
  function b() {
    ((n = 0), (r = 1), (s = 1), (o = 0));
  }
  function C(R = 0) {
    o = R;
  }
  function L() {
    const R = n + o;
    for (; R !== n; ) E();
    o = 0;
  }
  return {
    index: f,
    line: d,
    column: p,
    peekOffset: y,
    charAt: h,
    currentChar: S,
    currentPeek: g,
    next: E,
    peek: m,
    reset: b,
    resetPeek: C,
    skipToPeek: L,
  };
}
const dn = void 0,
  kw = ".",
  tu = "'",
  Ow = "tokenizer";
function Nw(e, t = {}) {
  const n = t.location !== !1,
    r = Pw(e),
    s = () => r.index(),
    o = () => Tw(r.line(), r.column(), r.index()),
    i = o(),
    a = s(),
    l = {
      currentType: 13,
      offset: a,
      startLoc: i,
      endLoc: i,
      lastType: 13,
      lastOffset: a,
      lastStartLoc: i,
      lastEndLoc: i,
      braceNest: 0,
      inLinked: !1,
      text: "",
    },
    u = () => l,
    { onError: c } = t;
  function f(_, w, P, ...N) {
    const D = u();
    if (((w.column += P), (w.offset += P), c)) {
      const H = n ? aa(D.startLoc, w) : null,
        A = Xo(_, H, { domain: Ow, args: N });
      c(A);
    }
  }
  function d(_, w, P) {
    ((_.endLoc = o()), (_.currentType = w));
    const N = { type: w };
    return (
      n && (N.loc = aa(_.startLoc, _.endLoc)),
      P != null && (N.value = P),
      N
    );
  }
  const p = (_) => d(_, 13);
  function y(_, w) {
    return _.currentChar() === w
      ? (_.next(), w)
      : (f(he.EXPECTED_TOKEN, o(), 0, w), "");
  }
  function h(_) {
    let w = "";
    for (; _.currentPeek() === Kt || _.currentPeek() === Qe; )
      ((w += _.currentPeek()), _.peek());
    return w;
  }
  function S(_) {
    const w = h(_);
    return (_.skipToPeek(), w);
  }
  function g(_) {
    if (_ === dn) return !1;
    const w = _.charCodeAt(0);
    return (w >= 97 && w <= 122) || (w >= 65 && w <= 90) || w === 95;
  }
  function E(_) {
    if (_ === dn) return !1;
    const w = _.charCodeAt(0);
    return w >= 48 && w <= 57;
  }
  function m(_, w) {
    const { currentType: P } = w;
    if (P !== 2) return !1;
    h(_);
    const N = g(_.currentPeek());
    return (_.resetPeek(), N);
  }
  function b(_, w) {
    const { currentType: P } = w;
    if (P !== 2) return !1;
    h(_);
    const N = _.currentPeek() === "-" ? _.peek() : _.currentPeek(),
      D = E(N);
    return (_.resetPeek(), D);
  }
  function C(_, w) {
    const { currentType: P } = w;
    if (P !== 2) return !1;
    h(_);
    const N = _.currentPeek() === tu;
    return (_.resetPeek(), N);
  }
  function L(_, w) {
    const { currentType: P } = w;
    if (P !== 7) return !1;
    h(_);
    const N = _.currentPeek() === ".";
    return (_.resetPeek(), N);
  }
  function R(_, w) {
    const { currentType: P } = w;
    if (P !== 8) return !1;
    h(_);
    const N = g(_.currentPeek());
    return (_.resetPeek(), N);
  }
  function j(_, w) {
    const { currentType: P } = w;
    if (!(P === 7 || P === 11)) return !1;
    h(_);
    const N = _.currentPeek() === ":";
    return (_.resetPeek(), N);
  }
  function M(_, w) {
    const { currentType: P } = w;
    if (P !== 9) return !1;
    const N = () => {
        const H = _.currentPeek();
        return H === "{"
          ? g(_.peek())
          : H === "@" || H === "|" || H === ":" || H === "." || H === Kt || !H
            ? !1
            : H === Qe
              ? (_.peek(), N())
              : K(_, !1);
      },
      D = N();
    return (_.resetPeek(), D);
  }
  function $(_) {
    h(_);
    const w = _.currentPeek() === "|";
    return (_.resetPeek(), w);
  }
  function K(_, w = !0) {
    const P = (D = !1, H = "") => {
        const A = _.currentPeek();
        return A === "{" || A === "@" || !A
          ? D
          : A === "|"
            ? !(H === Kt || H === Qe)
            : A === Kt
              ? (_.peek(), P(!0, Kt))
              : A === Qe
                ? (_.peek(), P(!0, Qe))
                : !0;
      },
      N = P();
    return (w && _.resetPeek(), N);
  }
  function F(_, w) {
    const P = _.currentChar();
    return P === dn ? dn : w(P) ? (_.next(), P) : null;
  }
  function X(_) {
    const w = _.charCodeAt(0);
    return (
      (w >= 97 && w <= 122) ||
      (w >= 65 && w <= 90) ||
      (w >= 48 && w <= 57) ||
      w === 95 ||
      w === 36
    );
  }
  function ne(_) {
    return F(_, X);
  }
  function se(_) {
    const w = _.charCodeAt(0);
    return (
      (w >= 97 && w <= 122) ||
      (w >= 65 && w <= 90) ||
      (w >= 48 && w <= 57) ||
      w === 95 ||
      w === 36 ||
      w === 45
    );
  }
  function q(_) {
    return F(_, se);
  }
  function ee(_) {
    const w = _.charCodeAt(0);
    return w >= 48 && w <= 57;
  }
  function z(_) {
    return F(_, ee);
  }
  function fe(_) {
    const w = _.charCodeAt(0);
    return (
      (w >= 48 && w <= 57) || (w >= 65 && w <= 70) || (w >= 97 && w <= 102)
    );
  }
  function it(_) {
    return F(_, fe);
  }
  function Xe(_) {
    let w = "",
      P = "";
    for (; (w = z(_)); ) P += w;
    return P;
  }
  function $e(_) {
    let w = "";
    for (;;) {
      const P = _.currentChar();
      if (P === "{" || P === "}" || P === "@" || P === "|" || !P) break;
      if (P === Kt || P === Qe)
        if (K(_)) ((w += P), _.next());
        else {
          if ($(_)) break;
          ((w += P), _.next());
        }
      else ((w += P), _.next());
    }
    return w;
  }
  function kt(_) {
    S(_);
    let w = "",
      P = "";
    for (; (w = q(_)); ) P += w;
    return (
      _.currentChar() === dn && f(he.UNTERMINATED_CLOSING_BRACE, o(), 0),
      P
    );
  }
  function Ot(_) {
    S(_);
    let w = "";
    return (
      _.currentChar() === "-" ? (_.next(), (w += `-${Xe(_)}`)) : (w += Xe(_)),
      _.currentChar() === dn && f(he.UNTERMINATED_CLOSING_BRACE, o(), 0),
      w
    );
  }
  function kn(_) {
    return _ !== tu && _ !== Qe;
  }
  function Be(_) {
    (S(_), y(_, "'"));
    let w = "",
      P = "";
    for (; (w = F(_, kn)); ) w === "\\" ? (P += x(_)) : (P += w);
    const N = _.currentChar();
    return N === Qe || N === dn
      ? (f(he.UNTERMINATED_SINGLE_QUOTE_IN_PLACEHOLDER, o(), 0),
        N === Qe && (_.next(), y(_, "'")),
        P)
      : (y(_, "'"), P);
  }
  function x(_) {
    const w = _.currentChar();
    switch (w) {
      case "\\":
      case "'":
        return (_.next(), `\\${w}`);
      case "u":
        return G(_, w, 4);
      case "U":
        return G(_, w, 6);
      default:
        return (f(he.UNKNOWN_ESCAPE_SEQUENCE, o(), 0, w), "");
    }
  }
  function G(_, w, P) {
    y(_, w);
    let N = "";
    for (let D = 0; D < P; D++) {
      const H = it(_);
      if (!H) {
        f(
          he.INVALID_UNICODE_ESCAPE_SEQUENCE,
          o(),
          0,
          `\\${w}${N}${_.currentChar()}`,
        );
        break;
      }
      N += H;
    }
    return `\\${w}${N}`;
  }
  function B(_) {
    return _ !== "{" && _ !== "}" && _ !== Kt && _ !== Qe;
  }
  function J(_) {
    S(_);
    let w = "",
      P = "";
    for (; (w = F(_, B)); ) P += w;
    return P;
  }
  function oe(_) {
    let w = "",
      P = "";
    for (; (w = ne(_)); ) P += w;
    return P;
  }
  function _e(_) {
    const w = (P) => {
      const N = _.currentChar();
      return N === "{" ||
        N === "@" ||
        N === "|" ||
        N === "(" ||
        N === ")" ||
        !N ||
        N === Kt
        ? P
        : ((P += N), _.next(), w(P));
    };
    return w("");
  }
  function v(_) {
    S(_);
    const w = y(_, "|");
    return (S(_), w);
  }
  function T(_, w) {
    let P = null;
    switch (_.currentChar()) {
      case "{":
        return (
          w.braceNest >= 1 && f(he.NOT_ALLOW_NEST_PLACEHOLDER, o(), 0),
          _.next(),
          (P = d(w, 2, "{")),
          S(_),
          w.braceNest++,
          P
        );
      case "}":
        return (
          w.braceNest > 0 &&
            w.currentType === 2 &&
            f(he.EMPTY_PLACEHOLDER, o(), 0),
          _.next(),
          (P = d(w, 3, "}")),
          w.braceNest--,
          w.braceNest > 0 && S(_),
          w.inLinked && w.braceNest === 0 && (w.inLinked = !1),
          P
        );
      case "@":
        return (
          w.braceNest > 0 && f(he.UNTERMINATED_CLOSING_BRACE, o(), 0),
          (P = k(_, w) || p(w)),
          (w.braceNest = 0),
          P
        );
      default: {
        let D = !0,
          H = !0,
          A = !0;
        if ($(_))
          return (
            w.braceNest > 0 && f(he.UNTERMINATED_CLOSING_BRACE, o(), 0),
            (P = d(w, 1, v(_))),
            (w.braceNest = 0),
            (w.inLinked = !1),
            P
          );
        if (
          w.braceNest > 0 &&
          (w.currentType === 4 || w.currentType === 5 || w.currentType === 6)
        )
          return (
            f(he.UNTERMINATED_CLOSING_BRACE, o(), 0),
            (w.braceNest = 0),
            U(_, w)
          );
        if ((D = m(_, w))) return ((P = d(w, 4, kt(_))), S(_), P);
        if ((H = b(_, w))) return ((P = d(w, 5, Ot(_))), S(_), P);
        if ((A = C(_, w))) return ((P = d(w, 6, Be(_))), S(_), P);
        if (!D && !H && !A)
          return (
            (P = d(w, 12, J(_))),
            f(he.INVALID_TOKEN_IN_PLACEHOLDER, o(), 0, P.value),
            S(_),
            P
          );
        break;
      }
    }
    return P;
  }
  function k(_, w) {
    const { currentType: P } = w;
    let N = null;
    const D = _.currentChar();
    switch (
      ((P === 7 || P === 8 || P === 11 || P === 9) &&
        (D === Qe || D === Kt) &&
        f(he.INVALID_LINKED_FORMAT, o(), 0),
      D)
    ) {
      case "@":
        return (_.next(), (N = d(w, 7, "@")), (w.inLinked = !0), N);
      case ".":
        return (S(_), _.next(), d(w, 8, "."));
      case ":":
        return (S(_), _.next(), d(w, 9, ":"));
      default:
        return $(_)
          ? ((N = d(w, 1, v(_))), (w.braceNest = 0), (w.inLinked = !1), N)
          : L(_, w) || j(_, w)
            ? (S(_), k(_, w))
            : R(_, w)
              ? (S(_), d(w, 11, oe(_)))
              : M(_, w)
                ? (S(_), D === "{" ? T(_, w) || N : d(w, 10, _e(_)))
                : (P === 7 && f(he.INVALID_LINKED_FORMAT, o(), 0),
                  (w.braceNest = 0),
                  (w.inLinked = !1),
                  U(_, w));
    }
  }
  function U(_, w) {
    let P = { type: 13 };
    if (w.braceNest > 0) return T(_, w) || p(w);
    if (w.inLinked) return k(_, w) || p(w);
    switch (_.currentChar()) {
      case "{":
        return T(_, w) || p(w);
      case "}":
        return (f(he.UNBALANCED_CLOSING_BRACE, o(), 0), _.next(), d(w, 3, "}"));
      case "@":
        return k(_, w) || p(w);
      default: {
        if ($(_))
          return ((P = d(w, 1, v(_))), (w.braceNest = 0), (w.inLinked = !1), P);
        if (K(_)) return d(w, 0, $e(_));
        break;
      }
    }
    return P;
  }
  function I() {
    const { currentType: _, offset: w, startLoc: P, endLoc: N } = l;
    return (
      (l.lastType = _),
      (l.lastOffset = w),
      (l.lastStartLoc = P),
      (l.lastEndLoc = N),
      (l.offset = s()),
      (l.startLoc = o()),
      r.currentChar() === dn ? d(l, 13) : U(r, l)
    );
  }
  return { nextToken: I, currentOffset: s, currentPosition: o, context: u };
}
const Iw = "parser",
  Mw = /(?:\\\\|\\'|\\u([0-9a-fA-F]{4})|\\U([0-9a-fA-F]{6}))/g;
function xw(e, t, n) {
  switch (e) {
    case "\\\\":
      return "\\";
    case "\\'":
      return "'";
    default: {
      const r = parseInt(t || n, 16);
      return r <= 55295 || r >= 57344 ? String.fromCodePoint(r) : "�";
    }
  }
}
function Dw(e = {}) {
  const t = e.location !== !1,
    { onError: n } = e;
  function r(g, E, m, b, ...C) {
    const L = g.currentPosition();
    if (((L.offset += b), (L.column += b), n)) {
      const R = t ? aa(m, L) : null,
        j = Xo(E, R, { domain: Iw, args: C });
      n(j);
    }
  }
  function s(g, E, m) {
    const b = { type: g };
    return (
      t && ((b.start = E), (b.end = E), (b.loc = { start: m, end: m })),
      b
    );
  }
  function o(g, E, m, b) {
    t && ((g.end = E), g.loc && (g.loc.end = m));
  }
  function i(g, E) {
    const m = g.context(),
      b = s(3, m.offset, m.startLoc);
    return ((b.value = E), o(b, g.currentOffset(), g.currentPosition()), b);
  }
  function a(g, E) {
    const m = g.context(),
      { lastOffset: b, lastStartLoc: C } = m,
      L = s(5, b, C);
    return (
      (L.index = parseInt(E, 10)),
      g.nextToken(),
      o(L, g.currentOffset(), g.currentPosition()),
      L
    );
  }
  function l(g, E) {
    const m = g.context(),
      { lastOffset: b, lastStartLoc: C } = m,
      L = s(4, b, C);
    return (
      (L.key = E),
      g.nextToken(),
      o(L, g.currentOffset(), g.currentPosition()),
      L
    );
  }
  function u(g, E) {
    const m = g.context(),
      { lastOffset: b, lastStartLoc: C } = m,
      L = s(9, b, C);
    return (
      (L.value = E.replace(Mw, xw)),
      g.nextToken(),
      o(L, g.currentOffset(), g.currentPosition()),
      L
    );
  }
  function c(g) {
    const E = g.nextToken(),
      m = g.context(),
      { lastOffset: b, lastStartLoc: C } = m,
      L = s(8, b, C);
    return E.type !== 11
      ? (r(g, he.UNEXPECTED_EMPTY_LINKED_MODIFIER, m.lastStartLoc, 0),
        (L.value = ""),
        o(L, b, C),
        { nextConsumeToken: E, node: L })
      : (E.value == null &&
          r(g, he.UNEXPECTED_LEXICAL_ANALYSIS, m.lastStartLoc, 0, Mt(E)),
        (L.value = E.value || ""),
        o(L, g.currentOffset(), g.currentPosition()),
        { node: L });
  }
  function f(g, E) {
    const m = g.context(),
      b = s(7, m.offset, m.startLoc);
    return ((b.value = E), o(b, g.currentOffset(), g.currentPosition()), b);
  }
  function d(g) {
    const E = g.context(),
      m = s(6, E.offset, E.startLoc);
    let b = g.nextToken();
    if (b.type === 8) {
      const C = c(g);
      ((m.modifier = C.node), (b = C.nextConsumeToken || g.nextToken()));
    }
    switch (
      (b.type !== 9 &&
        r(g, he.UNEXPECTED_LEXICAL_ANALYSIS, E.lastStartLoc, 0, Mt(b)),
      (b = g.nextToken()),
      b.type === 2 && (b = g.nextToken()),
      b.type)
    ) {
      case 10:
        (b.value == null &&
          r(g, he.UNEXPECTED_LEXICAL_ANALYSIS, E.lastStartLoc, 0, Mt(b)),
          (m.key = f(g, b.value || "")));
        break;
      case 4:
        (b.value == null &&
          r(g, he.UNEXPECTED_LEXICAL_ANALYSIS, E.lastStartLoc, 0, Mt(b)),
          (m.key = l(g, b.value || "")));
        break;
      case 5:
        (b.value == null &&
          r(g, he.UNEXPECTED_LEXICAL_ANALYSIS, E.lastStartLoc, 0, Mt(b)),
          (m.key = a(g, b.value || "")));
        break;
      case 6:
        (b.value == null &&
          r(g, he.UNEXPECTED_LEXICAL_ANALYSIS, E.lastStartLoc, 0, Mt(b)),
          (m.key = u(g, b.value || "")));
        break;
      default: {
        r(g, he.UNEXPECTED_EMPTY_LINKED_KEY, E.lastStartLoc, 0);
        const C = g.context(),
          L = s(7, C.offset, C.startLoc);
        return (
          (L.value = ""),
          o(L, C.offset, C.startLoc),
          (m.key = L),
          o(m, C.offset, C.startLoc),
          { nextConsumeToken: b, node: m }
        );
      }
    }
    return (o(m, g.currentOffset(), g.currentPosition()), { node: m });
  }
  function p(g) {
    const E = g.context(),
      m = E.currentType === 1 ? g.currentOffset() : E.offset,
      b = E.currentType === 1 ? E.endLoc : E.startLoc,
      C = s(2, m, b);
    C.items = [];
    let L = null;
    do {
      const M = L || g.nextToken();
      switch (((L = null), M.type)) {
        case 0:
          (M.value == null &&
            r(g, he.UNEXPECTED_LEXICAL_ANALYSIS, E.lastStartLoc, 0, Mt(M)),
            C.items.push(i(g, M.value || "")));
          break;
        case 5:
          (M.value == null &&
            r(g, he.UNEXPECTED_LEXICAL_ANALYSIS, E.lastStartLoc, 0, Mt(M)),
            C.items.push(a(g, M.value || "")));
          break;
        case 4:
          (M.value == null &&
            r(g, he.UNEXPECTED_LEXICAL_ANALYSIS, E.lastStartLoc, 0, Mt(M)),
            C.items.push(l(g, M.value || "")));
          break;
        case 6:
          (M.value == null &&
            r(g, he.UNEXPECTED_LEXICAL_ANALYSIS, E.lastStartLoc, 0, Mt(M)),
            C.items.push(u(g, M.value || "")));
          break;
        case 7: {
          const $ = d(g);
          (C.items.push($.node), (L = $.nextConsumeToken || null));
          break;
        }
      }
    } while (E.currentType !== 13 && E.currentType !== 1);
    const R = E.currentType === 1 ? E.lastOffset : g.currentOffset(),
      j = E.currentType === 1 ? E.lastEndLoc : g.currentPosition();
    return (o(C, R, j), C);
  }
  function y(g, E, m, b) {
    const C = g.context();
    let L = b.items.length === 0;
    const R = s(1, E, m);
    ((R.cases = []), R.cases.push(b));
    do {
      const j = p(g);
      (L || (L = j.items.length === 0), R.cases.push(j));
    } while (C.currentType !== 13);
    return (
      L && r(g, he.MUST_HAVE_MESSAGES_IN_PLURAL, m, 0),
      o(R, g.currentOffset(), g.currentPosition()),
      R
    );
  }
  function h(g) {
    const E = g.context(),
      { offset: m, startLoc: b } = E,
      C = p(g);
    return E.currentType === 13 ? C : y(g, m, b, C);
  }
  function S(g) {
    const E = Nw(g, Ae({}, e)),
      m = E.context(),
      b = s(0, m.offset, m.startLoc);
    return (
      t && b.loc && (b.loc.source = g),
      (b.body = h(E)),
      e.onCacheKey && (b.cacheKey = e.onCacheKey(g)),
      m.currentType !== 13 &&
        r(
          E,
          he.UNEXPECTED_LEXICAL_ANALYSIS,
          m.lastStartLoc,
          0,
          g[m.offset] || "",
        ),
      o(b, E.currentOffset(), E.currentPosition()),
      b
    );
  }
  return { parse: S };
}
function Mt(e) {
  if (e.type === 13) return "EOF";
  const t = (e.value || "").replace(/\r?\n/gu, "\\n");
  return t.length > 10 ? t.slice(0, 9) + "…" : t;
}
function Fw(e, t = {}) {
  const n = { ast: e, helpers: new Set() };
  return { context: () => n, helper: (o) => (n.helpers.add(o), o) };
}
function nu(e, t) {
  for (let n = 0; n < e.length; n++) dl(e[n], t);
}
function dl(e, t) {
  switch (e.type) {
    case 1:
      (nu(e.cases, t), t.helper("plural"));
      break;
    case 2:
      nu(e.items, t);
      break;
    case 6: {
      (dl(e.key, t), t.helper("linked"), t.helper("type"));
      break;
    }
    case 5:
      (t.helper("interpolate"), t.helper("list"));
      break;
    case 4:
      (t.helper("interpolate"), t.helper("named"));
      break;
  }
}
function $w(e, t = {}) {
  const n = Fw(e);
  (n.helper("normalize"), e.body && dl(e.body, n));
  const r = n.context();
  e.helpers = Array.from(r.helpers);
}
function Uw(e) {
  const t = e.body;
  return (t.type === 2 ? ru(t) : t.cases.forEach((n) => ru(n)), e);
}
function ru(e) {
  if (e.items.length === 1) {
    const t = e.items[0];
    (t.type === 3 || t.type === 9) && ((e.static = t.value), delete t.value);
  } else {
    const t = [];
    for (let n = 0; n < e.items.length; n++) {
      const r = e.items[n];
      if (!(r.type === 3 || r.type === 9) || r.value == null) break;
      t.push(r.value);
    }
    if (t.length === e.items.length) {
      e.static = ll(t);
      for (let n = 0; n < e.items.length; n++) {
        const r = e.items[n];
        (r.type === 3 || r.type === 9) && delete r.value;
      }
    }
  }
}
function nr(e) {
  switch (((e.t = e.type), e.type)) {
    case 0: {
      const t = e;
      (nr(t.body), (t.b = t.body), delete t.body);
      break;
    }
    case 1: {
      const t = e,
        n = t.cases;
      for (let r = 0; r < n.length; r++) nr(n[r]);
      ((t.c = n), delete t.cases);
      break;
    }
    case 2: {
      const t = e,
        n = t.items;
      for (let r = 0; r < n.length; r++) nr(n[r]);
      ((t.i = n),
        delete t.items,
        t.static && ((t.s = t.static), delete t.static));
      break;
    }
    case 3:
    case 9:
    case 8:
    case 7: {
      const t = e;
      t.value && ((t.v = t.value), delete t.value);
      break;
    }
    case 6: {
      const t = e;
      (nr(t.key),
        (t.k = t.key),
        delete t.key,
        t.modifier && (nr(t.modifier), (t.m = t.modifier), delete t.modifier));
      break;
    }
    case 5: {
      const t = e;
      ((t.i = t.index), delete t.index);
      break;
    }
    case 4: {
      const t = e;
      ((t.k = t.key), delete t.key);
      break;
    }
  }
  delete e.type;
}
function Hw(e, t) {
  const { filename: n, breakLineCode: r, needIndent: s } = t,
    o = t.location !== !1,
    i = {
      filename: n,
      code: "",
      column: 1,
      line: 1,
      offset: 0,
      map: void 0,
      breakLineCode: r,
      needIndent: s,
      indentLevel: 0,
    };
  o && e.loc && (i.source = e.loc.source);
  const a = () => i;
  function l(h, S) {
    i.code += h;
  }
  function u(h, S = !0) {
    const g = S ? r : "";
    l(s ? g + "  ".repeat(h) : g);
  }
  function c(h = !0) {
    const S = ++i.indentLevel;
    h && u(S);
  }
  function f(h = !0) {
    const S = --i.indentLevel;
    h && u(S);
  }
  function d() {
    u(i.indentLevel);
  }
  return {
    context: a,
    push: l,
    indent: c,
    deindent: f,
    newline: d,
    helper: (h) => `_${h}`,
    needIndent: () => i.needIndent,
  };
}
function jw(e, t) {
  const { helper: n } = e;
  (e.push(`${n("linked")}(`),
    yr(e, t.key),
    t.modifier
      ? (e.push(", "), yr(e, t.modifier), e.push(", _type"))
      : e.push(", undefined, _type"),
    e.push(")"));
}
function Vw(e, t) {
  const { helper: n, needIndent: r } = e;
  (e.push(`${n("normalize")}([`), e.indent(r()));
  const s = t.items.length;
  for (let o = 0; o < s && (yr(e, t.items[o]), o !== s - 1); o++) e.push(", ");
  (e.deindent(r()), e.push("])"));
}
function Bw(e, t) {
  const { helper: n, needIndent: r } = e;
  if (t.cases.length > 1) {
    (e.push(`${n("plural")}([`), e.indent(r()));
    const s = t.cases.length;
    for (let o = 0; o < s && (yr(e, t.cases[o]), o !== s - 1); o++)
      e.push(", ");
    (e.deindent(r()), e.push("])"));
  }
}
function Ww(e, t) {
  t.body ? yr(e, t.body) : e.push("null");
}
function yr(e, t) {
  const { helper: n } = e;
  switch (t.type) {
    case 0:
      Ww(e, t);
      break;
    case 1:
      Bw(e, t);
      break;
    case 2:
      Vw(e, t);
      break;
    case 6:
      jw(e, t);
      break;
    case 8:
      e.push(JSON.stringify(t.value), t);
      break;
    case 7:
      e.push(JSON.stringify(t.value), t);
      break;
    case 5:
      e.push(`${n("interpolate")}(${n("list")}(${t.index}))`, t);
      break;
    case 4:
      e.push(`${n("interpolate")}(${n("named")}(${JSON.stringify(t.key)}))`, t);
      break;
    case 9:
      e.push(JSON.stringify(t.value), t);
      break;
    case 3:
      e.push(JSON.stringify(t.value), t);
      break;
  }
}
const Kw = (e, t = {}) => {
  const n = V(t.mode) ? t.mode : "normal",
    r = V(t.filename) ? t.filename : "message.intl";
  t.sourceMap;
  const s =
      t.breakLineCode != null
        ? t.breakLineCode
        : n === "arrow"
          ? ";"
          : `
`,
    o = t.needIndent ? t.needIndent : n !== "arrow",
    i = e.helpers || [],
    a = Hw(e, { filename: r, breakLineCode: s, needIndent: o });
  (a.push(n === "normal" ? "function __msg__ (ctx) {" : "(ctx) => {"),
    a.indent(o),
    i.length > 0 &&
      (a.push(
        `const { ${ll(
          i.map((c) => `${c}: _${c}`),
          ", ",
        )} } = ctx`,
      ),
      a.newline()),
    a.push("return "),
    yr(a, e),
    a.deindent(o),
    a.push("}"),
    delete e.helpers);
  const { code: l, map: u } = a.context();
  return { ast: e, code: l, map: u ? u.toJSON() : void 0 };
};
function Gw(e, t = {}) {
  const n = Ae({}, t),
    r = !!n.jit,
    s = !!n.minify,
    o = n.optimize == null ? !0 : n.optimize,
    a = Dw(n).parse(e);
  return r
    ? (o && Uw(a), s && nr(a), { ast: a, code: "" })
    : ($w(a, n), Kw(a, n));
}
/*!
 * core-base v10.0.7
 * (c) 2025 kazuya kawaguchi
 * Released under the MIT License.
 */ function qw() {
  typeof __INTLIFY_PROD_DEVTOOLS__ != "boolean" &&
    (al().__INTLIFY_PROD_DEVTOOLS__ = !1);
}
function Ut(e) {
  return ue(e) && pl(e) === 0 && (At(e, "b") || At(e, "body"));
}
const Up = ["b", "body"];
function Yw(e) {
  return Ln(e, Up);
}
const Hp = ["c", "cases"];
function zw(e) {
  return Ln(e, Hp, []);
}
const jp = ["s", "static"];
function Xw(e) {
  return Ln(e, jp);
}
const Vp = ["i", "items"];
function Jw(e) {
  return Ln(e, Vp, []);
}
const Bp = ["t", "type"];
function pl(e) {
  return Ln(e, Bp);
}
const Wp = ["v", "value"];
function Ds(e, t) {
  const n = Ln(e, Wp);
  if (n != null) return n;
  throw as(t);
}
const Kp = ["m", "modifier"];
function Qw(e) {
  return Ln(e, Kp);
}
const Gp = ["k", "key"];
function Zw(e) {
  const t = Ln(e, Gp);
  if (t) return t;
  throw as(6);
}
function Ln(e, t, n) {
  for (let r = 0; r < t.length; r++) {
    const s = t[r];
    if (At(e, s) && e[s] != null) return e[s];
  }
  return n;
}
const qp = [...Up, ...Hp, ...jp, ...Vp, ...Gp, ...Kp, ...Wp, ...Bp];
function as(e) {
  return new Error(`unhandled node type: ${e}`);
}
function _i(e) {
  return (n) => eT(n, e);
}
function eT(e, t) {
  const n = Yw(t);
  if (n == null) throw as(0);
  if (pl(n) === 1) {
    const o = zw(n);
    return e.plural(o.reduce((i, a) => [...i, su(e, a)], []));
  } else return su(e, n);
}
function su(e, t) {
  const n = Xw(t);
  if (n != null) return e.type === "text" ? n : e.normalize([n]);
  {
    const r = Jw(t).reduce((s, o) => [...s, la(e, o)], []);
    return e.normalize(r);
  }
}
function la(e, t) {
  const n = pl(t);
  switch (n) {
    case 3:
      return Ds(t, n);
    case 9:
      return Ds(t, n);
    case 4: {
      const r = t;
      if (At(r, "k") && r.k) return e.interpolate(e.named(r.k));
      if (At(r, "key") && r.key) return e.interpolate(e.named(r.key));
      throw as(n);
    }
    case 5: {
      const r = t;
      if (At(r, "i") && Ne(r.i)) return e.interpolate(e.list(r.i));
      if (At(r, "index") && Ne(r.index)) return e.interpolate(e.list(r.index));
      throw as(n);
    }
    case 6: {
      const r = t,
        s = Qw(r),
        o = Zw(r);
      return e.linked(la(e, o), s ? la(e, s) : void 0, e.type);
    }
    case 7:
      return Ds(t, n);
    case 8:
      return Ds(t, n);
    default:
      throw new Error(`unhandled node on format message part: ${n}`);
  }
}
const tT = (e) => e;
let Fs = ye();
function nT(e, t = {}) {
  let n = !1;
  const r = t.onError || Sw;
  return (
    (t.onError = (s) => {
      ((n = !0), r(s));
    }),
    { ...Gw(e, t), detectError: n }
  );
}
function rT(e, t) {
  if (V(e)) {
    Re(t.warnHtmlMessage) && t.warnHtmlMessage;
    const r = (t.onCacheKey || tT)(e),
      s = Fs[r];
    if (s) return s;
    const { ast: o, detectError: i } = nT(e, { ...t, location: !1, jit: !0 }),
      a = _i(o);
    return i ? a : (Fs[r] = a);
  } else {
    const n = e.cacheKey;
    if (n) {
      const r = Fs[n];
      return r || (Fs[n] = _i(e));
    } else return _i(e);
  }
}
let ls = null;
function sT(e) {
  ls = e;
}
function oT(e, t, n) {
  ls &&
    ls.emit("i18n:init", {
      timestamp: Date.now(),
      i18n: e,
      version: t,
      meta: n,
    });
}
const iT = aT("function:translate");
function aT(e) {
  return (t) => ls && ls.emit(e, t);
}
const Xt = {
    INVALID_ARGUMENT: Cw,
    INVALID_DATE_ARGUMENT: 18,
    INVALID_ISO_DATE_ARGUMENT: 19,
    NOT_SUPPORT_LOCALE_PROMISE_VALUE: 21,
    NOT_SUPPORT_LOCALE_ASYNC_FUNCTION: 22,
    NOT_SUPPORT_LOCALE_TYPE: 23,
  },
  lT = 24;
function Jt(e) {
  return Xo(e, null, void 0);
}
function hl(e, t) {
  return t.locale != null ? ou(t.locale) : ou(e.locale);
}
let yi;
function ou(e) {
  if (V(e)) return e;
  if (Ee(e)) {
    if (e.resolvedOnce && yi != null) return yi;
    if (e.constructor.name === "Function") {
      const t = e();
      if (_E(t)) throw Jt(Xt.NOT_SUPPORT_LOCALE_PROMISE_VALUE);
      return (yi = t);
    } else throw Jt(Xt.NOT_SUPPORT_LOCALE_ASYNC_FUNCTION);
  } else throw Jt(Xt.NOT_SUPPORT_LOCALE_TYPE);
}
function cT(e, t, n) {
  return [
    ...new Set([n, ...(Le(t) ? t : ue(t) ? Object.keys(t) : V(t) ? [t] : [n])]),
  ];
}
function Yp(e, t, n) {
  const r = V(n) ? n : go,
    s = e;
  s.__localeChainCache || (s.__localeChainCache = new Map());
  let o = s.__localeChainCache.get(r);
  if (!o) {
    o = [];
    let i = [n];
    for (; Le(i); ) i = iu(o, i, t);
    const a = Le(t) || !ce(t) ? t : t.default ? t.default : null;
    ((i = V(a) ? [a] : a),
      Le(i) && iu(o, i, !1),
      s.__localeChainCache.set(r, o));
  }
  return o;
}
function iu(e, t, n) {
  let r = !0;
  for (let s = 0; s < t.length && Re(r); s++) {
    const o = t[s];
    V(o) && (r = uT(e, t[s], n));
  }
  return r;
}
function uT(e, t, n) {
  let r;
  const s = t.split("-");
  do {
    const o = s.join("-");
    ((r = fT(e, o, n)), s.splice(-1, 1));
  } while (s.length && r === !0);
  return r;
}
function fT(e, t, n) {
  let r = !1;
  if (!e.includes(t) && ((r = !0), t)) {
    r = t[t.length - 1] !== "!";
    const s = t.replace(/!/g, "");
    (e.push(s), (Le(n) || ce(n)) && n[s] && (r = n[s]));
  }
  return r;
}
const Pn = [];
Pn[0] = { w: [0], i: [3, 0], "[": [4], o: [7] };
Pn[1] = { w: [1], ".": [2], "[": [4], o: [7] };
Pn[2] = { w: [2], i: [3, 0], 0: [3, 0] };
Pn[3] = {
  i: [3, 0],
  0: [3, 0],
  w: [1, 1],
  ".": [2, 1],
  "[": [4, 1],
  o: [7, 1],
};
Pn[4] = { "'": [5, 0], '"': [6, 0], "[": [4, 2], "]": [1, 3], o: 8, l: [4, 0] };
Pn[5] = { "'": [4, 0], o: 8, l: [5, 0] };
Pn[6] = { '"': [4, 0], o: 8, l: [6, 0] };
const dT = /^\s?(?:true|false|-?[\d.]+|'[^']*'|"[^"]*")\s?$/;
function pT(e) {
  return dT.test(e);
}
function hT(e) {
  const t = e.charCodeAt(0),
    n = e.charCodeAt(e.length - 1);
  return t === n && (t === 34 || t === 39) ? e.slice(1, -1) : e;
}
function mT(e) {
  if (e == null) return "o";
  switch (e.charCodeAt(0)) {
    case 91:
    case 93:
    case 46:
    case 34:
    case 39:
      return e;
    case 95:
    case 36:
    case 45:
      return "i";
    case 9:
    case 10:
    case 13:
    case 160:
    case 65279:
    case 8232:
    case 8233:
      return "w";
  }
  return "i";
}
function gT(e) {
  const t = e.trim();
  return e.charAt(0) === "0" && isNaN(parseInt(e))
    ? !1
    : pT(t)
      ? hT(t)
      : "*" + t;
}
function bT(e) {
  const t = [];
  let n = -1,
    r = 0,
    s = 0,
    o,
    i,
    a,
    l,
    u,
    c,
    f;
  const d = [];
  ((d[0] = () => {
    i === void 0 ? (i = a) : (i += a);
  }),
    (d[1] = () => {
      i !== void 0 && (t.push(i), (i = void 0));
    }),
    (d[2] = () => {
      (d[0](), s++);
    }),
    (d[3] = () => {
      if (s > 0) (s--, (r = 4), d[0]());
      else {
        if (((s = 0), i === void 0 || ((i = gT(i)), i === !1))) return !1;
        d[1]();
      }
    }));
  function p() {
    const y = e[n + 1];
    if ((r === 5 && y === "'") || (r === 6 && y === '"'))
      return (n++, (a = "\\" + y), d[0](), !0);
  }
  for (; r !== null; )
    if ((n++, (o = e[n]), !(o === "\\" && p()))) {
      if (
        ((l = mT(o)),
        (f = Pn[r]),
        (u = f[l] || f.l || 8),
        u === 8 ||
          ((r = u[0]),
          u[1] !== void 0 && ((c = d[u[1]]), c && ((a = o), c() === !1))))
      )
        return;
      if (r === 7) return t;
    }
}
const au = new Map();
function _T(e, t) {
  return ue(e) ? e[t] : null;
}
function yT(e, t) {
  if (!ue(e)) return null;
  let n = au.get(t);
  if ((n || ((n = bT(t)), n && au.set(t, n)), !n)) return null;
  const r = n.length;
  let s = e,
    o = 0;
  for (; o < r; ) {
    const i = n[o];
    if (qp.includes(i) && Ut(s)) return null;
    const a = s[i];
    if (a === void 0 || Ee(s)) return null;
    ((s = a), o++);
  }
  return s;
}
const vT = "10.0.7",
  Jo = -1,
  go = "en-US",
  lu = "",
  cu = (e) => `${e.charAt(0).toLocaleUpperCase()}${e.substr(1)}`;
function ET() {
  return {
    upper: (e, t) =>
      t === "text" && V(e)
        ? e.toUpperCase()
        : t === "vnode" && ue(e) && "__v_isVNode" in e
          ? e.children.toUpperCase()
          : e,
    lower: (e, t) =>
      t === "text" && V(e)
        ? e.toLowerCase()
        : t === "vnode" && ue(e) && "__v_isVNode" in e
          ? e.children.toLowerCase()
          : e,
    capitalize: (e, t) =>
      t === "text" && V(e)
        ? cu(e)
        : t === "vnode" && ue(e) && "__v_isVNode" in e
          ? cu(e.children)
          : e,
  };
}
let zp;
function wT(e) {
  zp = e;
}
let Xp;
function TT(e) {
  Xp = e;
}
let Jp;
function CT(e) {
  Jp = e;
}
let Qp = null;
const ST = (e) => {
    Qp = e;
  },
  AT = () => Qp;
let Zp = null;
const uu = (e) => {
    Zp = e;
  },
  RT = () => Zp;
let fu = 0;
function LT(e = {}) {
  const t = Ee(e.onWarn) ? e.onWarn : vE,
    n = V(e.version) ? e.version : vT,
    r = V(e.locale) || Ee(e.locale) ? e.locale : go,
    s = Ee(r) ? go : r,
    o =
      Le(e.fallbackLocale) ||
      ce(e.fallbackLocale) ||
      V(e.fallbackLocale) ||
      e.fallbackLocale === !1
        ? e.fallbackLocale
        : s,
    i = ce(e.messages) ? e.messages : vi(s),
    a = ce(e.datetimeFormats) ? e.datetimeFormats : vi(s),
    l = ce(e.numberFormats) ? e.numberFormats : vi(s),
    u = Ae(ye(), e.modifiers, ET()),
    c = e.pluralRules || ye(),
    f = Ee(e.missing) ? e.missing : null,
    d = Re(e.missingWarn) || ho(e.missingWarn) ? e.missingWarn : !0,
    p = Re(e.fallbackWarn) || ho(e.fallbackWarn) ? e.fallbackWarn : !0,
    y = !!e.fallbackFormat,
    h = !!e.unresolving,
    S = Ee(e.postTranslation) ? e.postTranslation : null,
    g = ce(e.processor) ? e.processor : null,
    E = Re(e.warnHtmlMessage) ? e.warnHtmlMessage : !0,
    m = !!e.escapeParameter,
    b = Ee(e.messageCompiler) ? e.messageCompiler : zp,
    C = Ee(e.messageResolver) ? e.messageResolver : Xp || _T,
    L = Ee(e.localeFallbacker) ? e.localeFallbacker : Jp || cT,
    R = ue(e.fallbackContext) ? e.fallbackContext : void 0,
    j = e,
    M = ue(j.__datetimeFormatters) ? j.__datetimeFormatters : new Map(),
    $ = ue(j.__numberFormatters) ? j.__numberFormatters : new Map(),
    K = ue(j.__meta) ? j.__meta : {};
  fu++;
  const F = {
    version: n,
    cid: fu,
    locale: r,
    fallbackLocale: o,
    messages: i,
    modifiers: u,
    pluralRules: c,
    missing: f,
    missingWarn: d,
    fallbackWarn: p,
    fallbackFormat: y,
    unresolving: h,
    postTranslation: S,
    processor: g,
    warnHtmlMessage: E,
    escapeParameter: m,
    messageCompiler: b,
    messageResolver: C,
    localeFallbacker: L,
    fallbackContext: R,
    onWarn: t,
    __meta: K,
  };
  return (
    (F.datetimeFormats = a),
    (F.numberFormats = l),
    (F.__datetimeFormatters = M),
    (F.__numberFormatters = $),
    __INTLIFY_PROD_DEVTOOLS__ && oT(F, n, K),
    F
  );
}
const vi = (e) => ({ [e]: ye() });
function ml(e, t, n, r, s) {
  const { missing: o, onWarn: i } = e;
  if (o !== null) {
    const a = o(e, n, t, s);
    return V(a) ? a : t;
  } else return t;
}
function Mr(e, t, n) {
  const r = e;
  ((r.__localeChainCache = new Map()), e.localeFallbacker(e, n, t));
}
function PT(e, t) {
  return e === t ? !1 : e.split("-")[0] === t.split("-")[0];
}
function kT(e, t) {
  const n = t.indexOf(e);
  if (n === -1) return !1;
  for (let r = n + 1; r < t.length; r++) if (PT(e, t[r])) return !0;
  return !1;
}
function du(e, ...t) {
  const {
      datetimeFormats: n,
      unresolving: r,
      fallbackLocale: s,
      onWarn: o,
      localeFallbacker: i,
    } = e,
    { __datetimeFormatters: a } = e,
    [l, u, c, f] = ca(...t),
    d = Re(c.missingWarn) ? c.missingWarn : e.missingWarn;
  Re(c.fallbackWarn) ? c.fallbackWarn : e.fallbackWarn;
  const p = !!c.part,
    y = hl(e, c),
    h = i(e, s, y);
  if (!V(l) || l === "") return new Intl.DateTimeFormat(y, f).format(u);
  let S = {},
    g,
    E = null;
  const m = "datetime format";
  for (
    let L = 0;
    L < h.length && ((g = h[L]), (S = n[g] || {}), (E = S[l]), !ce(E));
    L++
  )
    ml(e, l, g, d, m);
  if (!ce(E) || !V(g)) return r ? Jo : l;
  let b = `${g}__${l}`;
  Ko(f) || (b = `${b}__${JSON.stringify(f)}`);
  let C = a.get(b);
  return (
    C || ((C = new Intl.DateTimeFormat(g, Ae({}, E, f))), a.set(b, C)),
    p ? C.formatToParts(u) : C.format(u)
  );
}
const eh = [
  "localeMatcher",
  "weekday",
  "era",
  "year",
  "month",
  "day",
  "hour",
  "minute",
  "second",
  "timeZoneName",
  "formatMatcher",
  "hour12",
  "timeZone",
  "dateStyle",
  "timeStyle",
  "calendar",
  "dayPeriod",
  "numberingSystem",
  "hourCycle",
  "fractionalSecondDigits",
];
function ca(...e) {
  const [t, n, r, s] = e,
    o = ye();
  let i = ye(),
    a;
  if (V(t)) {
    const l = t.match(/(\d{4}-\d{2}-\d{2})(T|\s)?(.*)/);
    if (!l) throw Jt(Xt.INVALID_ISO_DATE_ARGUMENT);
    const u = l[3]
      ? l[3].trim().startsWith("T")
        ? `${l[1].trim()}${l[3].trim()}`
        : `${l[1].trim()}T${l[3].trim()}`
      : l[1].trim();
    a = new Date(u);
    try {
      a.toISOString();
    } catch {
      throw Jt(Xt.INVALID_ISO_DATE_ARGUMENT);
    }
  } else if (mE(t)) {
    if (isNaN(t.getTime())) throw Jt(Xt.INVALID_DATE_ARGUMENT);
    a = t;
  } else if (Ne(t)) a = t;
  else throw Jt(Xt.INVALID_ARGUMENT);
  return (
    V(n)
      ? (o.key = n)
      : ce(n) &&
        Object.keys(n).forEach((l) => {
          eh.includes(l) ? (i[l] = n[l]) : (o[l] = n[l]);
        }),
    V(r) ? (o.locale = r) : ce(r) && (i = r),
    ce(s) && (i = s),
    [o.key || "", a, o, i]
  );
}
function pu(e, t, n) {
  const r = e;
  for (const s in n) {
    const o = `${t}__${s}`;
    r.__datetimeFormatters.has(o) && r.__datetimeFormatters.delete(o);
  }
}
function hu(e, ...t) {
  const {
      numberFormats: n,
      unresolving: r,
      fallbackLocale: s,
      onWarn: o,
      localeFallbacker: i,
    } = e,
    { __numberFormatters: a } = e,
    [l, u, c, f] = ua(...t),
    d = Re(c.missingWarn) ? c.missingWarn : e.missingWarn;
  Re(c.fallbackWarn) ? c.fallbackWarn : e.fallbackWarn;
  const p = !!c.part,
    y = hl(e, c),
    h = i(e, s, y);
  if (!V(l) || l === "") return new Intl.NumberFormat(y, f).format(u);
  let S = {},
    g,
    E = null;
  const m = "number format";
  for (
    let L = 0;
    L < h.length && ((g = h[L]), (S = n[g] || {}), (E = S[l]), !ce(E));
    L++
  )
    ml(e, l, g, d, m);
  if (!ce(E) || !V(g)) return r ? Jo : l;
  let b = `${g}__${l}`;
  Ko(f) || (b = `${b}__${JSON.stringify(f)}`);
  let C = a.get(b);
  return (
    C || ((C = new Intl.NumberFormat(g, Ae({}, E, f))), a.set(b, C)),
    p ? C.formatToParts(u) : C.format(u)
  );
}
const th = [
  "localeMatcher",
  "style",
  "currency",
  "currencyDisplay",
  "currencySign",
  "useGrouping",
  "minimumIntegerDigits",
  "minimumFractionDigits",
  "maximumFractionDigits",
  "minimumSignificantDigits",
  "maximumSignificantDigits",
  "compactDisplay",
  "notation",
  "signDisplay",
  "unit",
  "unitDisplay",
  "roundingMode",
  "roundingPriority",
  "roundingIncrement",
  "trailingZeroDisplay",
];
function ua(...e) {
  const [t, n, r, s] = e,
    o = ye();
  let i = ye();
  if (!Ne(t)) throw Jt(Xt.INVALID_ARGUMENT);
  const a = t;
  return (
    V(n)
      ? (o.key = n)
      : ce(n) &&
        Object.keys(n).forEach((l) => {
          th.includes(l) ? (i[l] = n[l]) : (o[l] = n[l]);
        }),
    V(r) ? (o.locale = r) : ce(r) && (i = r),
    ce(s) && (i = s),
    [o.key || "", a, o, i]
  );
}
function mu(e, t, n) {
  const r = e;
  for (const s in n) {
    const o = `${t}__${s}`;
    r.__numberFormatters.has(o) && r.__numberFormatters.delete(o);
  }
}
const OT = (e) => e,
  NT = (e) => "",
  IT = "text",
  MT = (e) => (e.length === 0 ? "" : ll(e)),
  xT = yE;
function gu(e, t) {
  return (
    (e = Math.abs(e)),
    t === 2 ? (e ? (e > 1 ? 1 : 0) : 1) : e ? Math.min(e, 2) : 0
  );
}
function DT(e) {
  const t = Ne(e.pluralIndex) ? e.pluralIndex : -1;
  return e.named && (Ne(e.named.count) || Ne(e.named.n))
    ? Ne(e.named.count)
      ? e.named.count
      : Ne(e.named.n)
        ? e.named.n
        : t
    : t;
}
function FT(e, t) {
  (t.count || (t.count = e), t.n || (t.n = e));
}
function $T(e = {}) {
  const t = e.locale,
    n = DT(e),
    r =
      ue(e.pluralRules) && V(t) && Ee(e.pluralRules[t]) ? e.pluralRules[t] : gu,
    s = ue(e.pluralRules) && V(t) && Ee(e.pluralRules[t]) ? gu : void 0,
    o = (g) => g[r(n, g.length, s)],
    i = e.list || [],
    a = (g) => i[g],
    l = e.named || ye();
  Ne(e.pluralIndex) && FT(n, l);
  const u = (g) => l[g];
  function c(g, E) {
    const m = Ee(e.messages)
      ? e.messages(g, !!E)
      : ue(e.messages)
        ? e.messages[g]
        : !1;
    return m || (e.parent ? e.parent.message(g) : NT);
  }
  const f = (g) => (e.modifiers ? e.modifiers[g] : OT),
    d =
      ce(e.processor) && Ee(e.processor.normalize) ? e.processor.normalize : MT,
    p =
      ce(e.processor) && Ee(e.processor.interpolate)
        ? e.processor.interpolate
        : xT,
    y = ce(e.processor) && V(e.processor.type) ? e.processor.type : IT,
    S = {
      list: a,
      named: u,
      plural: o,
      linked: (g, ...E) => {
        const [m, b] = E;
        let C = "text",
          L = "";
        E.length === 1
          ? ue(m)
            ? ((L = m.modifier || L), (C = m.type || C))
            : V(m) && (L = m || L)
          : E.length === 2 && (V(m) && (L = m || L), V(b) && (C = b || C));
        const R = c(g, !0)(S),
          j = C === "vnode" && Le(R) && L ? R[0] : R;
        return L ? f(L)(j, C) : j;
      },
      message: c,
      type: y,
      interpolate: p,
      normalize: d,
      values: Ae(ye(), i, l),
    };
  return S;
}
const bu = () => "",
  gt = (e) => Ee(e);
function _u(e, ...t) {
  const {
      fallbackFormat: n,
      postTranslation: r,
      unresolving: s,
      messageCompiler: o,
      fallbackLocale: i,
      messages: a,
    } = e,
    [l, u] = fa(...t),
    c = Re(u.missingWarn) ? u.missingWarn : e.missingWarn,
    f = Re(u.fallbackWarn) ? u.fallbackWarn : e.fallbackWarn,
    d = Re(u.escapeParameter) ? u.escapeParameter : e.escapeParameter,
    p = !!u.resolvedMessage,
    y =
      V(u.default) || Re(u.default)
        ? Re(u.default)
          ? o
            ? l
            : () => l
          : u.default
        : n
          ? o
            ? l
            : () => l
          : null,
    h = n || (y != null && (V(y) || Ee(y))),
    S = hl(e, u);
  d && UT(u);
  let [g, E, m] = p ? [l, S, a[S] || ye()] : nh(e, l, S, i, f, c),
    b = g,
    C = l;
  if (
    (!p && !(V(b) || Ut(b) || gt(b)) && h && ((b = y), (C = b)),
    !p && (!(V(b) || Ut(b) || gt(b)) || !V(E)))
  )
    return s ? Jo : l;
  let L = !1;
  const R = () => {
      L = !0;
    },
    j = gt(b) ? b : rh(e, l, E, b, C, R);
  if (L) return b;
  const M = VT(e, E, m, u),
    $ = $T(M),
    K = HT(e, j, $),
    F = r ? r(K, l) : K;
  if (__INTLIFY_PROD_DEVTOOLS__) {
    const X = {
      timestamp: Date.now(),
      key: V(l) ? l : gt(b) ? b.key : "",
      locale: E || (gt(b) ? b.locale : ""),
      format: V(b) ? b : gt(b) ? b.source : "",
      message: F,
    };
    ((X.meta = Ae({}, e.__meta, AT() || {})), iT(X));
  }
  return F;
}
function UT(e) {
  Le(e.list)
    ? (e.list = e.list.map((t) => (V(t) ? Yc(t) : t)))
    : ue(e.named) &&
      Object.keys(e.named).forEach((t) => {
        V(e.named[t]) && (e.named[t] = Yc(e.named[t]));
      });
}
function nh(e, t, n, r, s, o) {
  const { messages: i, onWarn: a, messageResolver: l, localeFallbacker: u } = e,
    c = u(e, r, n);
  let f = ye(),
    d,
    p = null;
  const y = "translate";
  for (
    let h = 0;
    h < c.length &&
    ((d = c[h]),
    (f = i[d] || ye()),
    (p = l(f, t)) === null && (p = f[t]),
    !(V(p) || Ut(p) || gt(p)));
    h++
  )
    if (!kT(d, c)) {
      const S = ml(e, t, d, o, y);
      S !== t && (p = S);
    }
  return [p, d, f];
}
function rh(e, t, n, r, s, o) {
  const { messageCompiler: i, warnHtmlMessage: a } = e;
  if (gt(r)) {
    const u = r;
    return ((u.locale = u.locale || n), (u.key = u.key || t), u);
  }
  if (i == null) {
    const u = () => r;
    return ((u.locale = n), (u.key = t), u);
  }
  const l = i(r, jT(e, n, s, r, a, o));
  return ((l.locale = n), (l.key = t), (l.source = r), l);
}
function HT(e, t, n) {
  return t(n);
}
function fa(...e) {
  const [t, n, r] = e,
    s = ye();
  if (!V(t) && !Ne(t) && !gt(t) && !Ut(t)) throw Jt(Xt.INVALID_ARGUMENT);
  const o = Ne(t) ? String(t) : (gt(t), t);
  return (
    Ne(n)
      ? (s.plural = n)
      : V(n)
        ? (s.default = n)
        : ce(n) && !Ko(n)
          ? (s.named = n)
          : Le(n) && (s.list = n),
    Ne(r) ? (s.plural = r) : V(r) ? (s.default = r) : ce(r) && Ae(s, r),
    [o, s]
  );
}
function jT(e, t, n, r, s, o) {
  return {
    locale: t,
    key: n,
    warnHtmlMessage: s,
    onError: (i) => {
      throw (o && o(i), i);
    },
    onCacheKey: (i) => pE(t, n, i),
  };
}
function VT(e, t, n, r) {
  const {
      modifiers: s,
      pluralRules: o,
      messageResolver: i,
      fallbackLocale: a,
      fallbackWarn: l,
      missingWarn: u,
      fallbackContext: c,
    } = e,
    d = {
      locale: t,
      modifiers: s,
      pluralRules: o,
      messages: (p, y) => {
        let h = i(n, p);
        if (h == null && (c || y)) {
          const [, , S] = nh(c || e, p, t, a, l, u);
          h = i(S, p);
        }
        if (V(h) || Ut(h)) {
          let S = !1;
          const E = rh(e, p, t, h, p, () => {
            S = !0;
          });
          return S ? bu : E;
        } else return gt(h) ? h : bu;
      },
    };
  return (
    e.processor && (d.processor = e.processor),
    r.list && (d.list = r.list),
    r.named && (d.named = r.named),
    Ne(r.plural) && (d.pluralIndex = r.plural),
    d
  );
}
qw();
/*!
 * vue-i18n v10.0.7
 * (c) 2025 kazuya kawaguchi
 * Released under the MIT License.
 */ const BT = "10.0.7";
function WT() {
  typeof __INTLIFY_PROD_DEVTOOLS__ != "boolean" &&
    (al().__INTLIFY_PROD_DEVTOOLS__ = !1);
}
const Et = {
  UNEXPECTED_RETURN_TYPE: lT,
  INVALID_ARGUMENT: 25,
  MUST_BE_CALL_SETUP_TOP: 26,
  NOT_INSTALLED: 27,
  REQUIRED_VALUE: 28,
  INVALID_VALUE: 29,
  NOT_INSTALLED_WITH_PROVIDE: 31,
  UNEXPECTED_ERROR: 32,
};
function Pt(e, ...t) {
  return Xo(e, null, void 0);
}
const da = Rn("__translateVNode"),
  pa = Rn("__datetimeParts"),
  ha = Rn("__numberParts"),
  KT = Rn("__setPluralRules"),
  GT = Rn("__injectWithOption"),
  ma = Rn("__dispose");
function cs(e) {
  if (!ue(e) || Ut(e)) return e;
  for (const t in e)
    if (At(e, t))
      if (!t.includes(".")) ue(e[t]) && cs(e[t]);
      else {
        const n = t.split("."),
          r = n.length - 1;
        let s = e,
          o = !1;
        for (let i = 0; i < r; i++) {
          if (n[i] === "__proto__") throw new Error(`unsafe key: ${n[i]}`);
          if ((n[i] in s || (s[n[i]] = ye()), !ue(s[n[i]]))) {
            o = !0;
            break;
          }
          s = s[n[i]];
        }
        if (
          (o ||
            (Ut(s)
              ? qp.includes(n[r]) || delete e[t]
              : ((s[n[r]] = e[t]), delete e[t])),
          !Ut(s))
        ) {
          const i = s[n[r]];
          ue(i) && cs(i);
        }
      }
  return e;
}
function sh(e, t) {
  const { messages: n, __i18n: r, messageResolver: s, flatJson: o } = t,
    i = ce(n) ? n : Le(r) ? ye() : { [e]: ye() };
  if (
    (Le(r) &&
      r.forEach((a) => {
        if ("locale" in a && "resource" in a) {
          const { locale: l, resource: u } = a;
          l ? ((i[l] = i[l] || ye()), lr(u, i[l])) : lr(u, i);
        } else V(a) && lr(JSON.parse(a), i);
      }),
    s == null && o)
  )
    for (const a in i) At(i, a) && cs(i[a]);
  return i;
}
function oh(e) {
  return e.type;
}
function qT(e, t, n) {
  let r = ue(t.messages) ? t.messages : ye();
  "__i18nGlobal" in n &&
    (r = sh(e.locale.value, { messages: r, __i18n: n.__i18nGlobal }));
  const s = Object.keys(r);
  s.length &&
    s.forEach((o) => {
      e.mergeLocaleMessage(o, r[o]);
    });
  {
    if (ue(t.datetimeFormats)) {
      const o = Object.keys(t.datetimeFormats);
      o.length &&
        o.forEach((i) => {
          e.mergeDateTimeFormat(i, t.datetimeFormats[i]);
        });
    }
    if (ue(t.numberFormats)) {
      const o = Object.keys(t.numberFormats);
      o.length &&
        o.forEach((i) => {
          e.mergeNumberFormat(i, t.numberFormats[i]);
        });
    }
  }
}
function yu(e) {
  return we(Zt, null, e, 0);
}
const vu = "__INTLIFY_META__",
  Eu = () => [],
  YT = () => !1;
let wu = 0;
function Tu(e) {
  return (t, n, r, s) => e(n, r, Ve() || void 0, s);
}
const zT = () => {
  const e = Ve();
  let t = null;
  return e && (t = oh(e)[vu]) ? { [vu]: t } : null;
};
function ih(e = {}) {
  const { __root: t, __injectWithOption: n } = e,
    r = t === void 0,
    s = e.flatJson,
    o = po ? ze : rn;
  let i = Re(e.inheritLocale) ? e.inheritLocale : !0;
  const a = o(t && i ? t.locale.value : V(e.locale) ? e.locale : go),
    l = o(
      t && i
        ? t.fallbackLocale.value
        : V(e.fallbackLocale) ||
            Le(e.fallbackLocale) ||
            ce(e.fallbackLocale) ||
            e.fallbackLocale === !1
          ? e.fallbackLocale
          : a.value,
    ),
    u = o(sh(a.value, e)),
    c = o(ce(e.datetimeFormats) ? e.datetimeFormats : { [a.value]: {} }),
    f = o(ce(e.numberFormats) ? e.numberFormats : { [a.value]: {} });
  let d = t
      ? t.missingWarn
      : Re(e.missingWarn) || ho(e.missingWarn)
        ? e.missingWarn
        : !0,
    p = t
      ? t.fallbackWarn
      : Re(e.fallbackWarn) || ho(e.fallbackWarn)
        ? e.fallbackWarn
        : !0,
    y = t ? t.fallbackRoot : Re(e.fallbackRoot) ? e.fallbackRoot : !0,
    h = !!e.fallbackFormat,
    S = Ee(e.missing) ? e.missing : null,
    g = Ee(e.missing) ? Tu(e.missing) : null,
    E = Ee(e.postTranslation) ? e.postTranslation : null,
    m = t ? t.warnHtmlMessage : Re(e.warnHtmlMessage) ? e.warnHtmlMessage : !0,
    b = !!e.escapeParameter;
  const C = t ? t.modifiers : ce(e.modifiers) ? e.modifiers : {};
  let L = e.pluralRules || (t && t.pluralRules),
    R;
  ((R = (() => {
    r && uu(null);
    const A = {
      version: BT,
      locale: a.value,
      fallbackLocale: l.value,
      messages: u.value,
      modifiers: C,
      pluralRules: L,
      missing: g === null ? void 0 : g,
      missingWarn: d,
      fallbackWarn: p,
      fallbackFormat: h,
      unresolving: !0,
      postTranslation: E === null ? void 0 : E,
      warnHtmlMessage: m,
      escapeParameter: b,
      messageResolver: e.messageResolver,
      messageCompiler: e.messageCompiler,
      __meta: { framework: "vue" },
    };
    ((A.datetimeFormats = c.value),
      (A.numberFormats = f.value),
      (A.__datetimeFormatters = ce(R) ? R.__datetimeFormatters : void 0),
      (A.__numberFormatters = ce(R) ? R.__numberFormatters : void 0));
    const O = LT(A);
    return (r && uu(O), O);
  })()),
    Mr(R, a.value, l.value));
  function M() {
    return [a.value, l.value, u.value, c.value, f.value];
  }
  const $ = Ce({
      get: () => a.value,
      set: (A) => {
        ((a.value = A), (R.locale = a.value));
      },
    }),
    K = Ce({
      get: () => l.value,
      set: (A) => {
        ((l.value = A), (R.fallbackLocale = l.value), Mr(R, a.value, A));
      },
    }),
    F = Ce(() => u.value),
    X = Ce(() => c.value),
    ne = Ce(() => f.value);
  function se() {
    return Ee(E) ? E : null;
  }
  function q(A) {
    ((E = A), (R.postTranslation = A));
  }
  function ee() {
    return S;
  }
  function z(A) {
    (A !== null && (g = Tu(A)), (S = A), (R.missing = g));
  }
  const fe = (A, O, W, Q, ie, ae) => {
    M();
    let Pe;
    try {
      (__INTLIFY_PROD_DEVTOOLS__,
        r || (R.fallbackContext = t ? RT() : void 0),
        (Pe = A(R)));
    } finally {
      (__INTLIFY_PROD_DEVTOOLS__, r || (R.fallbackContext = void 0));
    }
    if (
      (W !== "translate exists" && Ne(Pe) && Pe === Jo) ||
      (W === "translate exists" && !Pe)
    ) {
      const [Ue, pt] = O();
      return t && y ? Q(t) : ie(Ue);
    } else {
      if (ae(Pe)) return Pe;
      throw Pt(Et.UNEXPECTED_RETURN_TYPE);
    }
  };
  function it(...A) {
    return fe(
      (O) => Reflect.apply(_u, null, [O, ...A]),
      () => fa(...A),
      "translate",
      (O) => Reflect.apply(O.t, O, [...A]),
      (O) => O,
      (O) => V(O),
    );
  }
  function Xe(...A) {
    const [O, W, Q] = A;
    if (Q && !ue(Q)) throw Pt(Et.INVALID_ARGUMENT);
    return it(O, W, Ae({ resolvedMessage: !0 }, Q || {}));
  }
  function $e(...A) {
    return fe(
      (O) => Reflect.apply(du, null, [O, ...A]),
      () => ca(...A),
      "datetime format",
      (O) => Reflect.apply(O.d, O, [...A]),
      () => lu,
      (O) => V(O),
    );
  }
  function kt(...A) {
    return fe(
      (O) => Reflect.apply(hu, null, [O, ...A]),
      () => ua(...A),
      "number format",
      (O) => Reflect.apply(O.n, O, [...A]),
      () => lu,
      (O) => V(O),
    );
  }
  function Ot(A) {
    return A.map((O) => (V(O) || Ne(O) || Re(O) ? yu(String(O)) : O));
  }
  const Be = { normalize: Ot, interpolate: (A) => A, type: "vnode" };
  function x(...A) {
    return fe(
      (O) => {
        let W;
        const Q = O;
        try {
          ((Q.processor = Be), (W = Reflect.apply(_u, null, [Q, ...A])));
        } finally {
          Q.processor = null;
        }
        return W;
      },
      () => fa(...A),
      "translate",
      (O) => O[da](...A),
      (O) => [yu(O)],
      (O) => Le(O),
    );
  }
  function G(...A) {
    return fe(
      (O) => Reflect.apply(hu, null, [O, ...A]),
      () => ua(...A),
      "number format",
      (O) => O[ha](...A),
      Eu,
      (O) => V(O) || Le(O),
    );
  }
  function B(...A) {
    return fe(
      (O) => Reflect.apply(du, null, [O, ...A]),
      () => ca(...A),
      "datetime format",
      (O) => O[pa](...A),
      Eu,
      (O) => V(O) || Le(O),
    );
  }
  function J(A) {
    ((L = A), (R.pluralRules = L));
  }
  function oe(A, O) {
    return fe(
      () => {
        if (!A) return !1;
        const W = V(O) ? O : a.value,
          Q = T(W),
          ie = R.messageResolver(Q, A);
        return Ut(ie) || gt(ie) || V(ie);
      },
      () => [A],
      "translate exists",
      (W) => Reflect.apply(W.te, W, [A, O]),
      YT,
      (W) => Re(W),
    );
  }
  function _e(A) {
    let O = null;
    const W = Yp(R, l.value, a.value);
    for (let Q = 0; Q < W.length; Q++) {
      const ie = u.value[W[Q]] || {},
        ae = R.messageResolver(ie, A);
      if (ae != null) {
        O = ae;
        break;
      }
    }
    return O;
  }
  function v(A) {
    const O = _e(A);
    return O ?? (t ? t.tm(A) || {} : {});
  }
  function T(A) {
    return u.value[A] || {};
  }
  function k(A, O) {
    if (s) {
      const W = { [A]: O };
      for (const Q in W) At(W, Q) && cs(W[Q]);
      O = W[A];
    }
    ((u.value[A] = O), (R.messages = u.value));
  }
  function U(A, O) {
    u.value[A] = u.value[A] || {};
    const W = { [A]: O };
    if (s) for (const Q in W) At(W, Q) && cs(W[Q]);
    ((O = W[A]), lr(O, u.value[A]), (R.messages = u.value));
  }
  function I(A) {
    return c.value[A] || {};
  }
  function _(A, O) {
    ((c.value[A] = O), (R.datetimeFormats = c.value), pu(R, A, O));
  }
  function w(A, O) {
    ((c.value[A] = Ae(c.value[A] || {}, O)),
      (R.datetimeFormats = c.value),
      pu(R, A, O));
  }
  function P(A) {
    return f.value[A] || {};
  }
  function N(A, O) {
    ((f.value[A] = O), (R.numberFormats = f.value), mu(R, A, O));
  }
  function D(A, O) {
    ((f.value[A] = Ae(f.value[A] || {}, O)),
      (R.numberFormats = f.value),
      mu(R, A, O));
  }
  (wu++,
    t &&
      po &&
      (rt(t.locale, (A) => {
        i && ((a.value = A), (R.locale = A), Mr(R, a.value, l.value));
      }),
      rt(t.fallbackLocale, (A) => {
        i && ((l.value = A), (R.fallbackLocale = A), Mr(R, a.value, l.value));
      })));
  const H = {
    id: wu,
    locale: $,
    fallbackLocale: K,
    get inheritLocale() {
      return i;
    },
    set inheritLocale(A) {
      ((i = A),
        A &&
          t &&
          ((a.value = t.locale.value),
          (l.value = t.fallbackLocale.value),
          Mr(R, a.value, l.value)));
    },
    get availableLocales() {
      return Object.keys(u.value).sort();
    },
    messages: F,
    get modifiers() {
      return C;
    },
    get pluralRules() {
      return L || {};
    },
    get isGlobal() {
      return r;
    },
    get missingWarn() {
      return d;
    },
    set missingWarn(A) {
      ((d = A), (R.missingWarn = d));
    },
    get fallbackWarn() {
      return p;
    },
    set fallbackWarn(A) {
      ((p = A), (R.fallbackWarn = p));
    },
    get fallbackRoot() {
      return y;
    },
    set fallbackRoot(A) {
      y = A;
    },
    get fallbackFormat() {
      return h;
    },
    set fallbackFormat(A) {
      ((h = A), (R.fallbackFormat = h));
    },
    get warnHtmlMessage() {
      return m;
    },
    set warnHtmlMessage(A) {
      ((m = A), (R.warnHtmlMessage = A));
    },
    get escapeParameter() {
      return b;
    },
    set escapeParameter(A) {
      ((b = A), (R.escapeParameter = A));
    },
    t: it,
    getLocaleMessage: T,
    setLocaleMessage: k,
    mergeLocaleMessage: U,
    getPostTranslationHandler: se,
    setPostTranslationHandler: q,
    getMissingHandler: ee,
    setMissingHandler: z,
    [KT]: J,
  };
  return (
    (H.datetimeFormats = X),
    (H.numberFormats = ne),
    (H.rt = Xe),
    (H.te = oe),
    (H.tm = v),
    (H.d = $e),
    (H.n = kt),
    (H.getDateTimeFormat = I),
    (H.setDateTimeFormat = _),
    (H.mergeDateTimeFormat = w),
    (H.getNumberFormat = P),
    (H.setNumberFormat = N),
    (H.mergeNumberFormat = D),
    (H[GT] = n),
    (H[da] = x),
    (H[pa] = B),
    (H[ha] = G),
    H
  );
}
const gl = {
  tag: { type: [String, Object] },
  locale: { type: String },
  scope: {
    type: String,
    validator: (e) => e === "parent" || e === "global",
    default: "parent",
  },
  i18n: { type: Object },
};
function XT({ slots: e }, t) {
  return t.length === 1 && t[0] === "default"
    ? (e.default ? e.default() : []).reduce(
        (r, s) => [...r, ...(s.type === ke ? s.children : [s])],
        [],
      )
    : t.reduce((n, r) => {
        const s = e[r];
        return (s && (n[r] = s()), n);
      }, ye());
}
function ah() {
  return ke;
}
const JT = dt({
    name: "i18n-t",
    props: Ae(
      {
        keypath: { type: String, required: !0 },
        plural: {
          type: [Number, String],
          validator: (e) => Ne(e) || !isNaN(e),
        },
      },
      gl,
    ),
    setup(e, t) {
      const { slots: n, attrs: r } = t,
        s = e.i18n || bl({ useScope: e.scope, __useComponent: !0 });
      return () => {
        const o = Object.keys(n).filter((f) => f !== "_"),
          i = ye();
        (e.locale && (i.locale = e.locale),
          e.plural !== void 0 &&
            (i.plural = V(e.plural) ? +e.plural : e.plural));
        const a = XT(t, o),
          l = s[da](e.keypath, a, i),
          u = Ae(ye(), r),
          c = V(e.tag) || ue(e.tag) ? e.tag : ah();
        return De(c, u, l);
      };
    },
  }),
  Cu = JT;
function QT(e) {
  return Le(e) && !V(e[0]);
}
function lh(e, t, n, r) {
  const { slots: s, attrs: o } = t;
  return () => {
    const i = { part: !0 };
    let a = ye();
    (e.locale && (i.locale = e.locale),
      V(e.format)
        ? (i.key = e.format)
        : ue(e.format) &&
          (V(e.format.key) && (i.key = e.format.key),
          (a = Object.keys(e.format).reduce(
            (d, p) => (n.includes(p) ? Ae(ye(), d, { [p]: e.format[p] }) : d),
            ye(),
          ))));
    const l = r(e.value, i, a);
    let u = [i.key];
    Le(l)
      ? (u = l.map((d, p) => {
          const y = s[d.type],
            h = y ? y({ [d.type]: d.value, index: p, parts: l }) : [d.value];
          return (QT(h) && (h[0].key = `${d.type}-${p}`), h);
        }))
      : V(l) && (u = [l]);
    const c = Ae(ye(), o),
      f = V(e.tag) || ue(e.tag) ? e.tag : ah();
    return De(f, c, u);
  };
}
const ZT = dt({
    name: "i18n-n",
    props: Ae(
      {
        value: { type: Number, required: !0 },
        format: { type: [String, Object] },
      },
      gl,
    ),
    setup(e, t) {
      const n = e.i18n || bl({ useScope: e.scope, __useComponent: !0 });
      return lh(e, t, th, (...r) => n[ha](...r));
    },
  }),
  Su = ZT,
  eC = dt({
    name: "i18n-d",
    props: Ae(
      {
        value: { type: [Number, Date], required: !0 },
        format: { type: [String, Object] },
      },
      gl,
    ),
    setup(e, t) {
      const n = e.i18n || bl({ useScope: e.scope, __useComponent: !0 });
      return lh(e, t, eh, (...r) => n[pa](...r));
    },
  }),
  Au = eC;
function tC(e, t) {
  const n = e;
  if (e.mode === "composition") return n.__getInstance(t) || e.global;
  {
    const r = n.__getInstance(t);
    return r != null ? r.__composer : e.global.__composer;
  }
}
function nC(e) {
  const t = (i) => {
    const { instance: a, value: l } = i;
    if (!a || !a.$) throw Pt(Et.UNEXPECTED_ERROR);
    const u = tC(e, a.$),
      c = Ru(l);
    return [Reflect.apply(u.t, u, [...Lu(c)]), u];
  };
  return {
    created: (i, a) => {
      const [l, u] = t(a);
      (po &&
        e.global === u &&
        (i.__i18nWatcher = rt(u.locale, () => {
          a.instance && a.instance.$forceUpdate();
        })),
        (i.__composer = u),
        (i.textContent = l));
    },
    unmounted: (i) => {
      (po &&
        i.__i18nWatcher &&
        (i.__i18nWatcher(), (i.__i18nWatcher = void 0), delete i.__i18nWatcher),
        i.__composer && ((i.__composer = void 0), delete i.__composer));
    },
    beforeUpdate: (i, { value: a }) => {
      if (i.__composer) {
        const l = i.__composer,
          u = Ru(a);
        i.textContent = Reflect.apply(l.t, l, [...Lu(u)]);
      }
    },
    getSSRProps: (i) => {
      const [a] = t(i);
      return { textContent: a };
    },
  };
}
function Ru(e) {
  if (V(e)) return { path: e };
  if (ce(e)) {
    if (!("path" in e)) throw Pt(Et.REQUIRED_VALUE, "path");
    return e;
  } else throw Pt(Et.INVALID_VALUE);
}
function Lu(e) {
  const { path: t, locale: n, args: r, choice: s, plural: o } = e,
    i = {},
    a = r || {};
  return (
    V(n) && (i.locale = n),
    Ne(s) && (i.plural = s),
    Ne(o) && (i.plural = o),
    [t, a, i]
  );
}
function rC(e, t, ...n) {
  const r = ce(n[0]) ? n[0] : {};
  ((Re(r.globalInstall) ? r.globalInstall : !0) &&
    ([Cu.name, "I18nT"].forEach((o) => e.component(o, Cu)),
    [Su.name, "I18nN"].forEach((o) => e.component(o, Su)),
    [Au.name, "I18nD"].forEach((o) => e.component(o, Au))),
    e.directive("t", nC(t)));
}
const sC = Rn("global-vue-i18n");
function oC(e = {}, t) {
  const n = Re(e.globalInjection) ? e.globalInjection : !0,
    r = new Map(),
    [s, o] = iC(e),
    i = Rn("");
  function a(f) {
    return r.get(f) || null;
  }
  function l(f, d) {
    r.set(f, d);
  }
  function u(f) {
    r.delete(f);
  }
  const c = {
    get mode() {
      return "composition";
    },
    async install(f, ...d) {
      if (
        ((f.__VUE_I18N_SYMBOL__ = i),
        f.provide(f.__VUE_I18N_SYMBOL__, c),
        ce(d[0]))
      ) {
        const h = d[0];
        ((c.__composerExtend = h.__composerExtend),
          (c.__vueI18nExtend = h.__vueI18nExtend));
      }
      let p = null;
      (n && (p = hC(f, c.global)), rC(f, c, ...d));
      const y = f.unmount;
      f.unmount = () => {
        (p && p(), c.dispose(), y());
      };
    },
    get global() {
      return o;
    },
    dispose() {
      s.stop();
    },
    __instances: r,
    __getInstance: a,
    __setInstance: l,
    __deleteInstance: u,
  };
  return c;
}
function bl(e = {}) {
  const t = Ve();
  if (t == null) throw Pt(Et.MUST_BE_CALL_SETUP_TOP);
  if (
    !t.isCE &&
    t.appContext.app != null &&
    !t.appContext.app.__VUE_I18N_SYMBOL__
  )
    throw Pt(Et.NOT_INSTALLED);
  const n = aC(t),
    r = cC(n),
    s = oh(t),
    o = lC(e, s);
  if (o === "global") return (qT(r, e, s), r);
  if (o === "parent") {
    let l = uC(n, t, e.__useComponent);
    return (l == null && (l = r), l);
  }
  const i = n;
  let a = i.__getInstance(t);
  if (a == null) {
    const l = Ae({}, e);
    ("__i18n" in s && (l.__i18n = s.__i18n),
      r && (l.__root = r),
      (a = ih(l)),
      i.__composerExtend && (a[ma] = i.__composerExtend(a)),
      dC(i, t, a),
      i.__setInstance(t, a));
  }
  return a;
}
function iC(e, t, n) {
  const r = wo(),
    s = r.run(() => ih(e));
  if (s == null) throw Pt(Et.UNEXPECTED_ERROR);
  return [r, s];
}
function aC(e) {
  const t = Fe(e.isCE ? sC : e.appContext.app.__VUE_I18N_SYMBOL__);
  if (!t)
    throw Pt(e.isCE ? Et.NOT_INSTALLED_WITH_PROVIDE : Et.UNEXPECTED_ERROR);
  return t;
}
function lC(e, t) {
  return Ko(e)
    ? "__i18n" in t
      ? "local"
      : "global"
    : e.useScope
      ? e.useScope
      : "local";
}
function cC(e) {
  return e.mode === "composition" ? e.global : e.global.__composer;
}
function uC(e, t, n = !1) {
  let r = null;
  const s = t.root;
  let o = fC(t, n);
  for (; o != null; ) {
    const i = e;
    if (
      (e.mode === "composition" && (r = i.__getInstance(o)),
      r != null || s === o)
    )
      break;
    o = o.parent;
  }
  return r;
}
function fC(e, t = !1) {
  return e == null ? null : (t && e.vnode.ctx) || e.parent;
}
function dC(e, t, n) {
  (Sr(() => {}, t),
    gs(() => {
      const r = n;
      e.__deleteInstance(t);
      const s = r[ma];
      s && (s(), delete r[ma]);
    }, t));
}
const pC = ["locale", "fallbackLocale", "availableLocales"],
  Pu = ["t", "rt", "d", "n", "tm", "te"];
function hC(e, t) {
  const n = Object.create(null);
  return (
    pC.forEach((s) => {
      const o = Object.getOwnPropertyDescriptor(t, s);
      if (!o) throw Pt(Et.UNEXPECTED_ERROR);
      const i = Se(o.value)
        ? {
            get() {
              return o.value.value;
            },
            set(a) {
              o.value.value = a;
            },
          }
        : {
            get() {
              return o.get && o.get();
            },
          };
      Object.defineProperty(n, s, i);
    }),
    (e.config.globalProperties.$i18n = n),
    Pu.forEach((s) => {
      const o = Object.getOwnPropertyDescriptor(t, s);
      if (!o || !o.value) throw Pt(Et.UNEXPECTED_ERROR);
      Object.defineProperty(e.config.globalProperties, `$${s}`, o);
    }),
    () => {
      (delete e.config.globalProperties.$i18n,
        Pu.forEach((s) => {
          delete e.config.globalProperties[`$${s}`];
        }));
    }
  );
}
WT();
wT(rT);
TT(yT);
CT(Yp);
if (__INTLIFY_PROD_DEVTOOLS__) {
  const e = al();
  ((e.__INTLIFY__ = !0), sT(e.__INTLIFY_DEVTOOLS_GLOBAL_HOOK__));
}
function mC() {
  return qn(_r);
}
function gC() {
  return qn(cl);
}
function bC() {
  return qn(zo);
}
function _C() {
  return qn(zo);
}
function ch() {
  return qn(fl);
}
const yC = ot({
    name: "i18n:plugin:switch-locale-path-ssr",
    dependsOn: ["i18n:plugin"],
    setup(e) {
      const t = be(e._id);
      if (t.$config.public.i18n.experimental.switchLocalePathLinkSSR !== !0)
        return;
      const n = ch(),
        r = new RegExp(
          [`<!--${zc}-\\[(\\w+)\\]-->`, ".+?", `<!--/${zc}-->`].join(""),
          "g",
        );
      t.hook("app:rendered", (s) => {
        var o;
        ((o = s.renderResult) == null ? void 0 : o.html) != null &&
          (s.renderResult.html = s.renderResult.html.replaceAll(r, (i, a) =>
            i.replace(/href="([^"]+)"/, `href="${encodeURI(n(a ?? ""))}"`),
          ));
      });
    },
  }),
  vC = ot({
    name: "i18n:plugin:route-locale-detect",
    dependsOn: ["i18n:plugin"],
    async setup(e) {
      let t, n;
      const r = be(e._id),
        s = r.$router.currentRoute;
      async function o(a) {
        let l = iw(
          r,
          a,
          r._vueI18n.__localeFromRoute(a),
          te(r.$i18n.locale),
          r.$i18n.getLocaleCookie(),
        );
        if (r._vueI18n.__firstAccess) {
          r._vueI18n.__setLocale(l);
          const c = kp(te(r._vueI18n.global.fallbackLocale), [l]);
          (await Promise.all(c.map((f) => r.$i18n.loadLocaleMessages(f))),
            await r.$i18n.loadLocaleMessages(l));
        }
        return (
          (await r.runWithContext(() => Ip(r, l, r._vueI18n.__firstAccess))) &&
            (l = te(r.$i18n.locale)),
          l
        );
      }
      (([t, n] = bt(() => o(s.value))),
        await t,
        n(),
        Fy(
          "locale-changing",
          async (a, l) => {
            let u, c;
            const f =
                (([u, c] = bt(() => r.runWithContext(() => o(a)))),
                (u = await u),
                c(),
                u),
              d =
                (([u, c] = bt(() =>
                  r.runWithContext(() =>
                    Mp(
                      {
                        to: a,
                        nuxtApp: r,
                        from: l,
                        locale: f,
                        routeLocale: r._vueI18n.__localeFromRoute(a),
                      },
                      !0,
                    ),
                  ),
                )),
                (u = await u),
                c(),
                u);
            return (
              (r._vueI18n.__firstAccess = !1),
              ([u, c] = bt(() =>
                r.runWithContext(() =>
                  xp({ nuxt: r, redirectPath: d, locale: f, route: a }),
                ),
              )),
              (u = await u),
              c(),
              u
            );
          },
          { global: !0 },
        ));
    },
  });
function EC(e, { extendComposer: t, extendComposerInstance: n }) {
  const r = wo(),
    s = e.install.bind(e);
  e.install = (o, ...i) => {
    const a = Ae({}, i[0]);
    ((a.__composerExtend = (u) => (n(u, Fr(e)), () => {})),
      e.mode === "legacy" &&
        (a.__vueI18nExtend = (u) => (n(u, Fr(u)), () => {})),
      Reflect.apply(s, e, [o, a]));
    const l = Fr(e);
    if (
      (r.run(() => {
        (t(l),
          e.mode === "legacy" && Lp(e.global) && n(e.global, Fr(e.global)));
      }),
      e.mode === "composition" &&
        o.config.globalProperties.$i18n != null &&
        n(o.config.globalProperties.$i18n, l),
      o.unmount)
    ) {
      const u = o.unmount.bind(o);
      o.unmount = () => {
        (r.stop(), u());
      };
    }
  };
}
const wC = ot({
    name: "i18n:plugin",
    parallel: AE,
    async setup(e) {
      var f;
      let t, n;
      const r = be(e._id);
      Object.defineProperty(e.versions, "nuxtI18n", { get: () => "9.5.6" });
      const s = r.$config.public.i18n,
        o = JE(s);
      (XE(s, o), (r.$config.public.i18n.defaultLocale = o));
      const i = { ...s, defaultLocale: o, baseUrl: cw(r) },
        a = (([t, n] = bt(() => QE(SE, be()))), (t = await t), n(), t);
      (a.messages || (a.messages = {}),
        a.fallbackLocale ?? (a.fallbackLocale = !1),
        o && (a.locale = o));
      for (const d of Cn) (f = a.messages)[d] ?? (f[d] = {});
      const l = oC(a);
      ((r._vueI18n = l),
        (l.__localeFromRoute = GE()),
        (l.__firstAccess = !0),
        (l.__setLocale = (d) => {
          const p = mo(l);
          Se(p.locale) ? (p.locale.value = d) : (p.locale = d);
        }));
      const u = dw(),
        c = ys();
      return (
        EC(l, {
          extendComposer(d) {
            const p = ze(i.locales);
            d.locales = Ce(() => p.value);
            const y = ze(Cn);
            d.localeCodes = Ce(() => y.value);
            const h = ze(i.baseUrl());
            ((d.baseUrl = Ce(() => h.value)),
              rt(d.locale, () => (h.value = i.baseUrl())),
              (d.strategy = i.strategy),
              (d.localeProperties = Ce(
                () =>
                  br.find((S) => S.code === d.locale.value) || {
                    code: d.locale.value,
                  },
              )),
              (d.setLocale = async (S) => {
                if (
                  (await Ip(r, S, l.__firstAccess), d.strategy === "no_prefix")
                ) {
                  (await d.loadLocaleMessages(S), l.__setLocale(S));
                  return;
                }
                const g = r.$router.currentRoute.value,
                  E = await r.runWithContext(() =>
                    Mp({
                      to: g,
                      nuxtApp: r,
                      locale: S,
                      routeLocale: l.__localeFromRoute(g),
                    }),
                  );
                await r.runWithContext(() =>
                  xp({ nuxt: r, redirectPath: E, locale: S, route: g }, !0),
                );
              }),
              (d.loadLocaleMessages = async (S) =>
                await ia(S, sa, d.mergeLocaleMessage.bind(d), r)),
              (d.differentDomains = i.differentDomains),
              (d.defaultLocale = i.defaultLocale),
              (d.getBrowserLocale = () => fw()),
              (d.getLocaleCookie = () => pw(u, c, d.defaultLocale)),
              (d.setLocaleCookie = (S) => {
                !c || !c.useCookie || (u.value = S);
              }),
              (d.onBeforeLanguageSwitch = (S, g, E, m) =>
                r.callHook("i18n:beforeLocaleSwitch", {
                  oldLocale: S,
                  newLocale: g,
                  initialSetup: E,
                  context: m,
                })),
              (d.onLanguageSwitched = (S, g) =>
                r.callHook("i18n:localeSwitched", {
                  oldLocale: S,
                  newLocale: g,
                })),
              (d.finalizePendingLocaleChange = async () => {
                var S;
                l.__pendingLocale &&
                  (l.__setLocale(l.__pendingLocale),
                  (S = l.__resolvePendingLocalePromise) == null || S.call(l),
                  (l.__pendingLocale = void 0));
              }),
              (d.waitForPendingLocaleChange = async () => {
                l.__pendingLocale &&
                  l.__pendingLocalePromise &&
                  (await l.__pendingLocalePromise);
              }));
          },
          extendComposerInstance(d, p) {
            const y = [
              ["locales", () => p.locales],
              ["localeCodes", () => p.localeCodes],
              ["baseUrl", () => p.baseUrl],
              ["strategy", () => p.strategy],
              ["localeProperties", () => p.localeProperties],
              [
                "setLocale",
                () => async (h) => Reflect.apply(p.setLocale, p, [h]),
              ],
              [
                "loadLocaleMessages",
                () => async (h) => Reflect.apply(p.loadLocaleMessages, p, [h]),
              ],
              ["differentDomains", () => p.differentDomains],
              ["defaultLocale", () => p.defaultLocale],
              [
                "getBrowserLocale",
                () => () => Reflect.apply(p.getBrowserLocale, p, []),
              ],
              [
                "getLocaleCookie",
                () => () => Reflect.apply(p.getLocaleCookie, p, []),
              ],
              [
                "setLocaleCookie",
                () => (h) => Reflect.apply(p.setLocaleCookie, p, [h]),
              ],
              [
                "onBeforeLanguageSwitch",
                () => (h, S, g, E) =>
                  Reflect.apply(p.onBeforeLanguageSwitch, p, [h, S, g, E]),
              ],
              [
                "onLanguageSwitched",
                () => (h, S) => Reflect.apply(p.onLanguageSwitched, p, [h, S]),
              ],
              [
                "finalizePendingLocaleChange",
                () => () => Reflect.apply(p.finalizePendingLocaleChange, p, []),
              ],
              [
                "waitForPendingLocaleChange",
                () => () => Reflect.apply(p.waitForPendingLocaleChange, p, []),
              ],
            ];
            for (const [h, S] of y) Object.defineProperty(d, h, { get: S });
          },
        }),
        r.vueApp.use(l),
        Object.defineProperty(r, "$i18n", { get: () => mo(l) }),
        {
          provide: {
            localeHead: qn(gw),
            localePath: gC(),
            localeRoute: bC(),
            getRouteBaseName: mC(),
            switchLocalePath: ch(),
            resolveRoute: qn(ul),
            localeLocation: _C(),
          },
        }
      );
    },
  }),
  TC = ot({ name: "nuxt:global-components" }),
  En = {},
  CC = ot({
    name: "nuxt:prefetch",
    setup(e) {
      const t = et();
      (e.hooks.hook("app:mounted", () => {
        t.beforeEach(async (n) => {
          var s;
          const r =
            (s = n == null ? void 0 : n.meta) == null ? void 0 : s.layout;
          r && typeof En[r] == "function" && (await En[r]());
        });
      }),
        e.hooks.hook("link:prefetch", (n) => {
          if (Bt(n)) return;
          const r = t.resolve(n);
          if (!r) return;
          const s = r.meta.layout;
          let o = sl(r.meta.middleware);
          o = o.filter((i) => typeof i == "string");
          for (const i of o) typeof Gr[i] == "function" && Gr[i]();
          typeof s == "string" && s in En && HE(En[s]);
        }));
    },
  }),
  SC = ot(async (e) => {
    let t, n;
    e.payload.serverRendered
      ? (e.payload.prerenderedAt || e.payload.isCached) &&
        e.hook("app:mounted", async () => {
          await ra().fetch();
        })
      : (([t, n] = bt(() => ra().fetch())), await t, n());
  }),
  AC = ot({
    name: "i18n:plugin:ssg-detect",
    dependsOn: ["i18n:plugin", "i18n:plugin:route-locale-detect"],
    enforce: "post",
    setup(e) {
      be(e._id);
    },
  }),
  RC = [I0, $0, aE, lE, cE, uE, dE, yC, vC, wC, TC, CC, SC, AC],
  uh = (e = "RouteProvider") =>
    dt({
      name: e,
      props: {
        route: { type: Object, required: !0 },
        vnode: Object,
        vnodeRef: Object,
        renderKey: String,
        trackRootNodes: Boolean,
      },
      setup(t) {
        const n = t.renderKey,
          r = t.route,
          s = {};
        for (const o in t.route)
          Object.defineProperty(s, o, {
            get: () => (n === t.renderKey ? t.route[o] : r[o]),
            enumerable: !0,
          });
        return (
          Qt(Gn, St(s)),
          () => (t.vnode ? De(t.vnode, { ref: t.vnodeRef }) : t.vnode)
        );
      },
    }),
  LC = uh(),
  ku = new WeakMap(),
  PC = dt({
    name: "NuxtPage",
    inheritAttrs: !1,
    props: {
      name: { type: String },
      transition: { type: [Boolean, Object], default: void 0 },
      keepalive: { type: [Boolean, Object], default: void 0 },
      route: { type: Object },
      pageKey: { type: [Function, String], default: null },
    },
    setup(e, { attrs: t, slots: n, expose: r }) {
      const s = be(),
        o = ze(),
        i = Fe(Gn, null);
      let a;
      r({ pageRef: o });
      const l = Fe(Zd, null);
      let u;
      const c = s.deferHydration();
      if (s.isHydrating) {
        const d = s.hooks.hookOnce("app:error", c);
        et().beforeEach(d);
      }
      e.pageKey &&
        rt(
          () => e.pageKey,
          (d, p) => {
            d !== p && s.callHook("page:loading:start");
          },
        );
      let f = !1;
      {
        const d = et().beforeResolve(() => {
          f = !1;
        });
        Ar(() => {
          d();
        });
      }
      return () =>
        De(
          vp,
          { name: e.name, route: e.route, ...t },
          {
            default: (d) => {
              const p = OC(i, d.route, d.Component),
                y = i && i.matched.length === d.route.matched.length;
              if (!d.Component) {
                if (u && !y) return u;
                c();
                return;
              }
              if (u && l && !l.isCurrent(d.route)) return u;
              if (p && i && (!l || (l != null && l.isCurrent(i))))
                return y ? u : null;
              const h = na(d, e.pageKey),
                S = NC(i, d.route, d.Component);
              (!s.isHydrating &&
                a === h &&
                !S &&
                jt(() => {
                  ((f = !0), s.callHook("page:loading:end"));
                }),
                (a = h));
              const g = !!(e.transition ?? d.route.meta.pageTransition ?? hc),
                E =
                  g &&
                  kC([
                    e.transition,
                    d.route.meta.pageTransition,
                    hc,
                    {
                      onBeforeLeave() {
                        s._runningTransition = !0;
                      },
                      onAfterLeave() {
                        (delete s._runningTransition,
                          s.callHook("page:transition:finish", d.Component));
                      },
                    },
                  ]),
                m = e.keepalive ?? d.route.meta.keepalive ?? vy;
              return (
                (u = wp(
                  g && E,
                  Kv(
                    m,
                    De(
                      xo,
                      {
                        suspensible: !0,
                        onPending: () => s.callHook("page:start", d.Component),
                        onResolve: () => {
                          jt(() =>
                            s
                              .callHook("page:finish", d.Component)
                              .then(() => {
                                if (!f && !S)
                                  return (
                                    (f = !0),
                                    s.callHook("page:loading:end")
                                  );
                              })
                              .finally(c),
                          );
                        },
                      },
                      {
                        default: () => {
                          const b = {
                            key: h || void 0,
                            vnode: n.default ? IC(n.default, d) : d.Component,
                            route: d.route,
                            renderKey: h || void 0,
                            trackRootNodes: g,
                            vnodeRef: o,
                          };
                          if (!m) return De(LC, b);
                          const C = d.Component.type,
                            L = C;
                          let R = ku.get(L);
                          return (
                            R || ((R = uh(C.name || C.__name)), ku.set(L, R)),
                            De(R, b)
                          );
                        },
                      },
                    ),
                  ),
                ).default()),
                u
              );
            },
          },
        );
    },
  });
function kC(e) {
  const t = e
    .filter(Boolean)
    .map((n) => ({
      ...n,
      onAfterLeave: n.onAfterLeave ? sl(n.onAfterLeave) : void 0,
    }));
  return Jd(...t);
}
function OC(e, t, n) {
  if (!e) return !1;
  const r = t.matched.findIndex((s) => {
    var o;
    return (
      ((o = s.components) == null ? void 0 : o.default) ===
      (n == null ? void 0 : n.type)
    );
  });
  return !r || r === -1
    ? !1
    : t.matched.slice(0, r).some((s, o) => {
        var i, a, l;
        return (
          ((i = s.components) == null ? void 0 : i.default) !==
          ((l = (a = e.matched[o]) == null ? void 0 : a.components) == null
            ? void 0
            : l.default)
        );
      }) ||
        (n &&
          na({ route: t, Component: n }) !== na({ route: e, Component: n }));
}
function NC(e, t, n) {
  return e
    ? t.matched.findIndex((s) => {
        var o;
        return (
          ((o = s.components) == null ? void 0 : o.default) ===
          (n == null ? void 0 : n.type)
        );
      }) <
        t.matched.length - 1
    : !1;
}
function IC(e, t) {
  const n = e(t);
  return n.length === 1 ? De(n[0]) : De(ke, void 0, n);
}
const MC = dt({
    name: "LayoutLoader",
    inheritAttrs: !1,
    props: { name: String, layoutProps: Object },
    setup(e, t) {
      return () => De(En[e.name], e.layoutProps, t.slots);
    },
  }),
  xC = {
    name: { type: [String, Boolean, Object], default: null },
    fallback: { type: [String, Object], default: null },
  },
  DC = dt({
    name: "NuxtLayout",
    inheritAttrs: !1,
    props: xC,
    setup(e, t) {
      const n = be(),
        r = Fe(Gn),
        o = !r || r === Uo() ? Ep() : r,
        i = Ce(() => {
          let c =
            te(e.name) ?? (o == null ? void 0 : o.meta.layout) ?? "default";
          return (c && !(c in En) && e.fallback && (c = te(e.fallback)), c);
        }),
        a = rn();
      t.expose({ layoutRef: a });
      const l = n.deferHydration();
      if (n.isHydrating) {
        const c = n.hooks.hookOnce("app:error", l);
        et().beforeEach(c);
      }
      let u;
      return () => {
        const c = i.value && i.value in En,
          f = (o == null ? void 0 : o.meta.layoutTransition) ?? yy,
          d = u;
        return (
          (u = i.value),
          wp(c && f, {
            default: () =>
              De(
                xo,
                {
                  suspensible: !0,
                  onResolve: () => {
                    jt(l);
                  },
                },
                {
                  default: () =>
                    De(
                      FC,
                      {
                        layoutProps: Ya(t.attrs, { ref: a }),
                        key: i.value || void 0,
                        name: i.value,
                        shouldProvide: !e.name,
                        isRenderingNewLayout: (p) => p !== d && p === i.value,
                        hasTransition: !!f,
                      },
                      t.slots,
                    ),
                },
              ),
          }).default()
        );
      };
    },
  }),
  FC = dt({
    name: "NuxtLayoutProvider",
    inheritAttrs: !1,
    props: {
      name: { type: [String, Boolean] },
      layoutProps: { type: Object },
      hasTransition: { type: Boolean },
      shouldProvide: { type: Boolean },
      isRenderingNewLayout: { type: Function, required: !0 },
    },
    setup(e, t) {
      const n = e.name;
      e.shouldProvide &&
        Qt(Zd, { isCurrent: (o) => n === (o.meta.layout ?? "default") });
      const r = Fe(Gn);
      if (r && r === Uo()) {
        const o = Ep(),
          i = {};
        for (const a in o) {
          const l = a;
          Object.defineProperty(i, l, {
            enumerable: !0,
            get: () => (e.isRenderingNewLayout(e.name) ? o[l] : r[l]),
          });
        }
        Qt(Gn, St(i));
      }
      return () => {
        var o, i;
        return !n || (typeof n == "string" && !(n in En))
          ? (i = (o = t.slots).default) == null
            ? void 0
            : i.call(o)
          : De(MC, { key: n, layoutProps: e.layoutProps, name: n }, t.slots);
      };
    },
  }),
  $C = (e, t) => {
    const n = e.__vccOpts || e;
    for (const [r, s] of t) n[r] = s;
    return n;
  },
  UC = {};
function HC(e, t) {
  const n = PC,
    r = DC;
  return (ct(), Tt(r, null, { default: hs(() => [we(n)]), _: 1 }));
}
const jC = $C(UC, [["render", HC]]),
  VC = {
    __name: "nuxt-error-page",
    props: { error: Object },
    setup(e) {
      const n = e.error;
      n.stack &&
        n.stack
          .split(
            `
`,
          )
          .splice(1)
          .map((f) => ({
            text: f.replace("webpack:/", "").replace(".vue", ".js").trim(),
            internal:
              (f.includes("node_modules") && !f.includes(".cache")) ||
              f.includes("internal") ||
              f.includes("new Promise"),
          }))
          .map(
            (f) =>
              `<span class="stack${f.internal ? " internal" : ""}">${f.text}</span>`,
          ).join(`
`);
      const r = Number(n.statusCode || 500),
        s = r === 404,
        o = n.statusMessage ?? (s ? "Page Not Found" : "Internal Server Error"),
        i = n.message || n.toString(),
        a = void 0,
        c = s
          ? Ai(() =>
              yn(
                () => import("./Bd4KbR7V.js"),
                __vite__mapDeps([20, 2, 4, 21]),
                import.meta.url,
              ),
            )
          : Ai(() =>
              yn(
                () => import("./J-2b4M8h.js"),
                __vite__mapDeps([22, 4, 23]),
                import.meta.url,
              ),
            );
      return (f, d) => (
        ct(),
        Tt(
          te(c),
          _a(
            Ka({
              statusCode: te(r),
              statusMessage: te(o),
              description: te(i),
              stack: te(a),
            }),
          ),
          null,
          16,
        )
      );
    },
  },
  BC = { key: 0 },
  Ou = {
    __name: "nuxt-root",
    setup(e) {
      const t = () => null,
        n = be(),
        r = n.deferHydration();
      if (n.isHydrating) {
        const u = n.hooks.hookOnce("app:error", r);
        et().beforeEach(u);
      }
      const s = !1;
      (Qt(Gn, Uo()),
        n.hooks.callHookWith((u) => u.map((c) => c()), "vue:setup"));
      const o = Ho(),
        i = !1,
        a = /bot\b|chrome-lighthouse|facebookexternalhit|google\b/i;
      Da((u, c, f) => {
        if (
          (n.hooks
            .callHook("vue:error", u, c, f)
            .catch((d) => console.error("[nuxt] Error in `vue:error` hook", d)),
          a.test(navigator.userAgent))
        )
          return (
            n.hooks.callHook("app:error", u),
            console.error(
              `[nuxt] Not rendering error page for bot with user agent \`${navigator.userAgent}\`:`,
              u,
            ),
            !1
          );
        if (tp(u) && (u.fatal || u.unhandled))
          return (n.runWithContext(() => xn(u)), !1);
      });
      const l = !1;
      return (u, c) => (
        ct(),
        Tt(
          xo,
          { onResolve: te(r) },
          {
            default: hs(() => [
              te(i)
                ? (ct(), rd("div", BC))
                : te(o)
                  ? (ct(),
                    Tt(te(VC), { key: 1, error: te(o) }, null, 8, ["error"]))
                  : te(l)
                    ? (ct(),
                      Tt(te(t), { key: 2, context: te(l) }, null, 8, [
                        "context",
                      ]))
                    : te(s)
                      ? (ct(), Tt(Pf(te(s)), { key: 3 }))
                      : (ct(), Tt(te(jC), { key: 4 })),
            ]),
            _: 1,
          },
          8,
          ["onResolve"],
        )
      );
    },
  };
let Nu;
{
  let e;
  ((Nu = async function () {
    var i, a;
    if (e) return e;
    const r = !!(
        ((i = window.__NUXT__) == null ? void 0 : i.serverRendered) ??
        ((a = document.getElementById("__NUXT_DATA__")) == null
          ? void 0
          : a.dataset.ssr) === "true"
      )
        ? Ja(Ou)
        : io(Ou),
      s = Sy({ vueApp: r });
    async function o(l) {
      var u;
      (await s.callHook("app:error", l),
        (u = s.payload).error || (u.error = Bn(l)));
    }
    ((r.config.errorHandler = o),
      s.hook("app:suspense:resolve", () => {
        r.config.errorHandler === o && (r.config.errorHandler = void 0);
      }));
    try {
      await Ly(s, RC);
    } catch (l) {
      o(l);
    }
    try {
      (await s.hooks.callHook("app:created", r),
        await s.hooks.callHook("app:beforeMount", r),
        r.mount(wy),
        await s.hooks.callHook("app:mounted", r),
        await jt());
    } catch (l) {
      o(l);
    }
    return r;
  }),
    (e = Nu().catch((t) => {
      throw (console.error("Error while mounting app:", t), t);
    })));
}
export {
  re as $,
  Qa as A,
  Uy as B,
  jE as C,
  Bt as D,
  Xn as E,
  ke as F,
  Mn as G,
  ao as H,
  hr as I,
  YC as J,
  gC as K,
  ra as L,
  bl as M,
  Tt as N,
  rt as O,
  Gm as P,
  za as Q,
  Se as R,
  ut as S,
  ve as T,
  me as U,
  Iu as V,
  yt as W,
  mh as X,
  Er as Y,
  He as Z,
  $C as _,
  Wa as a,
  No as a$,
  ge as a0,
  sr as a1,
  Y as a2,
  vr as a3,
  $n as a4,
  Fh as a5,
  $h as a6,
  Uh as a7,
  Hh as a8,
  Du as a9,
  Ym as aA,
  Qt as aB,
  md as aC,
  Xa as aD,
  kg as aE,
  zg as aF,
  Jd as aG,
  lc as aH,
  Vd as aI,
  qC as aJ,
  L_ as aK,
  Lg as aL,
  _a as aM,
  Pf as aN,
  Xc as aO,
  Vt as aP,
  Ve as aQ,
  of as aR,
  zC as aS,
  Cf as aT,
  Ks as aU,
  Bn as aV,
  ps as aW,
  an as aX,
  XC as aY,
  JC as aZ,
  Py as a_,
  st as aa,
  Lh as ab,
  GC as ac,
  KC as ad,
  bg as ae,
  Ya as af,
  p_ as ag,
  Tr as ah,
  wr as ai,
  yd as aj,
  oo as ak,
  cb as al,
  f_ as am,
  Sd as an,
  Uo as ao,
  Ep as ap,
  QC as aq,
  jt as ar,
  fd as as,
  gs as at,
  le as au,
  Ro as av,
  Yf as aw,
  La as ax,
  Fe as ay,
  on as az,
  we as b,
  sp as b0,
  rd as c,
  Ga as d,
  dt as e,
  Ng as f,
  Ce as g,
  ub as h,
  te as i,
  mg as j,
  et as k,
  be as l,
  Sr as m,
  il as n,
  ct as o,
  Wd as p,
  Gc as q,
  ze as r,
  rn as s,
  va as t,
  cn as u,
  Ar as v,
  hs as w,
  ZC as x,
  De as y,
  pg as z,
};
