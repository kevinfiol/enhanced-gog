// ==UserScript==
// @name enhanced-gog
// @namespace https://github.com/kevinfiol/enhanced-gog
// @version 1.3.2
// @description Enhanced experience on GOG.com
// @license MIT; https://raw.githubusercontent.com/kevinfiol/enhanced-gog/master/LICENSE
// @include http://*.gog.com/game/*
// @include https://*.gog.com/game/*
// @include http://*.gog.com/*/game/*
// @include https://*.gog.com/*/game/*
// @icon https://raw.githubusercontent.com/kevinfiol/enhanced-gog/master/img/icon.png
// @updateURL https://raw.githubusercontent.com/kevinfiol/enhanced-gog/master/bin/enhanced-gog.user.js
// @downloadURL https://raw.githubusercontent.com/kevinfiol/enhanced-gog/master/bin/enhanced-gog.user.js
// @run-at document-idle
// @grant GM_xmlhttpRequest
// @grant GM.xmlHttpRequest
// @grant GM_getValue
// @grant GM_setValue
// @grant GM_deleteValue
// @grant GM_listValues
// ==/UserScript==

(() => {
  // node_modules/.pnpm/umai@0.1.2/node_modules/umai/dist/umai.js
  var NIL = void 0;
  var REDRAWS = [];
  var CMP_KEY = "__m";
  var RETAIN_KEY = "=";
  var isArray = Array.isArray;
  var isFn = (x) => typeof x === "function";
  var noop = (_) => {
  };
  var isRenderable = (v) => v === null || typeof v === "string" || typeof v === "number" || v[CMP_KEY] || isArray(v);
  var makeEl = (v) => v[CMP_KEY] ? document.createElement(v.tag) : document.createTextNode(v);
  var addChildren = (v, children, i) => {
    if (isArray(v))
      for (i = 0; i < v.length; i++)
        addChildren(v[i], children);
    else if (v !== null && v !== false && v !== NIL)
      children.push(v);
  };
  var update = (el, v, env, redraw) => {
    redraw = env ? env.redraw : noop;
    if (!v[CMP_KEY])
      return el.data === v + "" || (el.data = v);
    let i, tmp;
    for (i = 0, tmp = v.classes; i < tmp.length; i++)
      if (!el.classList.contains(tmp[i]))
        el.classList.add(tmp[i]);
    for (i = 0, tmp = el.classList; i < tmp.length; i++)
      if (!v.classes.includes(tmp[i]))
        el.classList.remove(tmp[i]);
    for (i in v.attrs)
      if (el[i] !== (tmp = v.attrs[i])) {
        let fn;
        if (tmp === null || tmp === NIL || tmp === true)
          tmp = "";
        else if (tmp === false)
          el.removeAttribute(i);
        else if (i.startsWith("on"))
          el[i] = isFn(fn = tmp) ? (ev) => {
            isFn(fn.then) ? fn(ev).finally(redraw) : (fn(ev), redraw());
          } : NIL;
        else
          el.setAttribute(i, tmp);
      }
    for (i = 0, tmp = [...el.getAttributeNames(), ...Object.keys(el)]; i < tmp.length; i++)
      if (!(tmp[i] in v.attrs) && tmp[i] !== "class") {
        if (tmp[i].startsWith("on") && isFn(el[tmp[i]]))
          el[tmp[i]] = NIL;
        else
          el.removeAttribute(tmp[i]);
      }
  };
  function render(parent, v, env) {
    let i, tmp, olds = parent.childNodes || [], children = v.children || [], news = isArray(children) ? children : [children];
    for (i = 0, tmp = Array(Math.max(0, olds.length - news.length)); i < tmp.length; i++)
      parent.removeChild(parent.lastChild);
    for (i = 0; i < news.length; i++) {
      let child = news[i], el = olds[i] || makeEl(child);
      if (child.tag === RETAIN_KEY)
        continue;
      if (!olds[i])
        parent.appendChild(el);
      if ((el.tagName || "") !== (child.tag || "").toUpperCase())
        (el = makeEl(child)) && parent.replaceChild(el, olds[i]);
      update(el, child, env);
      render(el, child, env);
    }
  }
  function mount(el, cmp, env, redraw) {
    REDRAWS.push(redraw = (_) => requestAnimationFrame((_2) => render(el, { children: cmp() }, env)));
    env = { redraw };
    redraw();
  }
  function m(head, ...tail) {
    let k, tmp, attrs = {}, [tag, ...classes] = head.split("."), children = [];
    if (tail.length && !isRenderable(tail[0]))
      [attrs, ...tail] = tail;
    if (attrs.class) {
      if (attrs.class !== null && typeof attrs.class === "object") {
        tmp = "";
        for (k in attrs.class) {
          if (attrs.class[k]) {
            tmp && (tmp += " ");
            tmp += k;
          }
        }
        attrs.class = tmp;
      }
      classes = [...classes, ...attrs.class.split(" ")];
    }
    attrs = { ...attrs };
    addChildren(tail, children);
    return { [CMP_KEY]: 1, tag: tag || "div", attrs, classes, children };
  }
  m.retain = (_) => m(RETAIN_KEY);

  // src/config.js
  var VERSION = "1.3.2";

  // src/state.js
  var State = (init = {}) => ({
    gameId: void 0,
    currentPrice: void 0,
    pageCurrency: void 0,
    regionMap: void 0,
    userRegion: "us",
    userCountry: "us",
    currentLowest: void 0,
    historicalLow: void 0,
    historicalLowGOG: void 0,
    bundles: void 0,
    cache: {},
    error: void 0,
    ...init
  });
  var Actions = (state, $) => $ = {};

  // src/util.js
  function rules(obj) {
    let val, tmp, key, str = "";
    for (key in obj) {
      val = obj[key];
      if (tmp = key.match(/[A-Z]/)) {
        key = key.split("");
        key.splice(tmp.index, 1, "-" + tmp[0].toLowerCase());
        key = key.join("");
      }
      str += key + ":" + val + ";";
    }
    return str;
  }

  // src/components.js
  var Divider = () => m("div", {
    style: rules({
      boxShadow: "0px 4px 6px -2px rgba(0, 0, 0, 0.25)",
      height: "14px",
      position: "absolute",
      left: "0",
      width: "100%"
    })
  });

  // src/index.js
  console.log(`== Enhanced GOG ${VERSION} ==`);
  var App = ({ state, actions }) => m("div", Divider(), m("div", { style: "padding-top: 1.2em;" }, state.currentLowest && state.historicalLow && m("p", "notifications"), state.currentLowest || state.historicalLow || state.historicalLowGOG || state.bundles ? m("p", "stats") : state.error ? m("p", "error") : m("p", "spinner"), m("p", "country select")));
  var product = unsafeWindow.productcardData;
  if (product && typeof product === "object") {
    const state = State({
      gameId: product.cardProductId,
      currentPrice: product.cardProduct.price.finalAmount,
      pageCurrency: product.currency
    });
    const actions = Actions(state);
    const container = document.createElement("div");
    container.className = "enhanced-gog-container";
    document.querySelector("div.product-actions").appendChild(container);
    mount(container, () => App({ state, actions }));
  }
})();
//# sourceMappingURL=enhanced-gog.user.js.map
