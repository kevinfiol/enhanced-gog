// ==UserScript==
// @name enhanced-gog
// @namespace https://github.com/kevinfiol/enhanced-gog
// @version 1.4.5
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
  // node_modules/.pnpm/umai@0.1.7/node_modules/umai/dist/umai.js
  var NIL = void 0;
  var REDRAWS = [];
  var CMP_KEY = "__m";
  var RETAIN_KEY = "=";
  var isArray = Array.isArray;
  var isStr = (x) => typeof x === "string";
  var isFn = (x) => typeof x === "function";
  var isObj = (x) => x !== null && typeof x === "object";
  var noop = (_) => {
  };
  var isRenderable = (x) => x === null || typeof x === "string" || typeof x === "number" || x[CMP_KEY] || isArray(x);
  var makeEl = (v) => v[CMP_KEY] ? document.createElement(v.tag) : document.createTextNode(v);
  var addChildren = (x, children, i) => {
    if (isArray(x))
      for (i = 0; i < x.length; i++)
        addChildren(x[i], children);
    else if (x !== null && x !== false && x !== NIL)
      children.push(x);
  };
  var update = (el, v, env, redraw2) => {
    redraw2 = env ? env.redraw : noop;
    if (!v[CMP_KEY])
      return el.data === v + "" || (el.data = v);
    let i, tmp;
    for (i in v.attrs)
      if (el[i] !== (tmp = v.attrs[i])) {
        let fn, res;
        if (tmp === null || tmp === NIL || tmp === true)
          tmp = "";
        if (tmp === false)
          el.removeAttribute(i);
        else if (i.startsWith("on") && isFn(fn = tmp))
          el[i] = (ev) => (res = fn(ev)) instanceof Promise ? res.finally((_) => (redraw2(), res = NIL)) : (redraw2(), res = NIL);
        else
          el.setAttribute(i, tmp);
      }
    for (i = 0, tmp = [...el.getAttributeNames(), ...Object.keys(el)]; i < tmp.length; i++)
      if (!(tmp[i] in v.attrs)) {
        if (tmp[i].startsWith("on") && isFn(el[tmp[i]]))
          el[tmp[i]] = NIL;
        else
          el.removeAttribute(tmp[i]);
      }
  };
  function render(parent, x, env) {
    let i, tmp, olds = parent.childNodes || [], children = x.children || [], news = isArray(children) ? children : [children];
    for (i = 0, tmp = Array(Math.max(0, olds.length - news.length)); i < tmp.length; i++)
      parent.removeChild(parent.lastChild);
    for (i = 0; i < news.length; i++) {
      let el, vnode = news[i];
      if (vnode.tag === RETAIN_KEY)
        continue;
      el = olds[i] || makeEl(vnode);
      if (!olds[i])
        parent.appendChild(el);
      if ((el.tagName || "") !== (vnode.tag || "").toUpperCase()) {
        el = makeEl(vnode);
        parent.replaceChild(el, olds[i]);
      }
      update(el, vnode, env);
      render(el, vnode, env);
    }
  }
  function mount(el, cmp, env, redraw2) {
    REDRAWS.push(redraw2 = (_) => requestAnimationFrame((_2) => render(el, { children: cmp() }, env)));
    env = { redraw: redraw2 };
    return redraw2() && redraw2;
  }
  var redraw = (i) => {
    for (i = 0; i < REDRAWS.length; i++)
      REDRAWS[i]();
  };
  function m(tag, ...tail) {
    let k, tmp, classes, attrs = {}, children = [];
    if (tail.length && !isRenderable(tail[0]))
      [attrs, ...tail] = tail;
    if (isStr(tag)) {
      [tag, ...classes] = tag.split(".");
      classes = classes.join(" ");
      if (isObj(tmp = attrs.class)) {
        for (k in tmp) {
          if (tmp[k]) {
            classes && (classes += " ");
            classes += k;
          }
        }
      }
      if (isStr(tmp))
        classes += !classes ? tmp : tmp ? " " + tmp : "";
      classes && (attrs.class = classes);
    }
    addChildren(tail, children);
    return { [CMP_KEY]: 1, tag, attrs: { ...attrs }, children };
  }
  m.retain = (_) => m(RETAIN_KEY);

  // src/config.js
  var VERSION = "1.4.5";
  var API_KEY = "d047b30e0fc7d9118f3953de04fa6af9eba22379";

  // src/state.js
  var State = (init = {}) => ({
    gameId: void 0,
    currentPrice: void 0,
    pageCurrency: void 0,
    userRegion: "us",
    userCountry: "US",
    currentLowest: void 0,
    historicalLow: void 0,
    historicalLowGOG: void 0,
    bundles: void 0,
    error: void 0,
    ...init
  });
  var Actions = (state, $) => $ = {
    set(obj) {
      for (let k in obj) {
        if (!(k in state))
          throw Error("Not a valid state property");
        state[k] = obj[k];
      }
    },
    reset() {
      $.set({
        error: void 0,
        historicalLow: void 0,
        historicalLowGOG: void 0,
        currentLowest: void 0,
        bundles: void 0
      });
    },
    setPriceData(data) {
      $.set(data);
    }
  };

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
  var createPriceFormatter = (sign, delimiter, left) => {
    return (price) => {
      const delimited_price = price.replace(".", delimiter);
      return left ? `${sign}${delimited_price}` : `${delimited_price}${sign}`;
    };
  };
  var capitalize = (str) => str.trim()[0].toUpperCase() + str.trim().slice(1);
  var getDateStr = (unixTime) => {
    const date = new Date(unixTime * 1e3);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };
  var request = (method, url, params) => {
    const queryArr = Object.keys(params).map((key) => {
      return `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`;
    });
    const queryStr = queryArr.join("&");
    return new Promise((resolve, reject) => {
      if (window.GM_xmlhttpRequest) {
        const xhr = window.GM_xmlhttpRequest;
        xhr({
          method,
          url: `${url}?${queryStr}`,
          onload: (res) => {
            if (res.status >= 200 && res.status < 300) {
              let text = res.responseText;
              try {
                text = JSON.parse(text);
              } catch {
                text = text;
              }
              resolve(text);
            } else {
              reject(res.statusText);
            }
          },
          onerror: (err) => reject(err.statusText)
        });
      } else {
        const xhr = new XMLHttpRequest();
        xhr.open(method, `${url}?${queryStr}`);
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            let text = xhr.response;
            try {
              text = JSON.parse(text);
            } catch {
              text = text;
            }
            resolve(text);
          } else {
            reject(xhr.statusText);
          }
        };
        xhr.onerror = () => reject(xhr.statusText);
        xhr.send();
      }
    });
  };

  // src/itad.js
  var shop = "gog";
  var api = (version, iface, method) => `https://api.isthereanydeal.com/${version}/${iface}/${method}/`;
  var parseResponse = (res) => res.data[Object.keys(res.data)[0]];
  async function getPlainId(gameId) {
    let [plainId, error] = ["", void 0];
    const endpoint = api("v02", "game", "plain");
    const payload = { key: API_KEY, shop, game_id: gameId };
    try {
      const res = await request("GET", endpoint, payload);
      if (!res[".meta"].match || !res[".meta"].active)
        throw Error("Game Not Found.");
      plainId = res.data.plain;
    } catch (e) {
      console.error(e);
      error = e;
    }
    return [plainId, error];
  }
  async function getHistoricalLow(plainId, shops, region, country) {
    let [low, error] = [{}, void 0];
    const endpoint = api("v01", "game", "lowest");
    const payload = { key: API_KEY, plains: plainId, region, country };
    if (shops)
      payload.shops = shops;
    try {
      let res = await request("GET", endpoint, payload);
      res = parseResponse(res);
      if (res.price !== void 0 && res.price !== null) {
        low = {
          date: getDateStr(res.added),
          cut: res.cut,
          price: res.price,
          shop: res.shop,
          urls: res.urls
        };
      }
    } catch (e) {
      console.error(e);
      error = e;
    }
    return [low, error];
  }
  async function getCurrentLowest(plainId, region, country) {
    let [lowest, error] = [{}, void 0];
    const endpoint = api("v01", "game", "prices");
    const payload = { key: API_KEY, plains: plainId, region, country };
    try {
      let res = await request("GET", endpoint, payload);
      res = parseResponse(res);
      if (res.list && res.list.length) {
        lowest = res.list.reduce((a, c) => {
          a = a.price_new >= c.price_new ? c : a;
          return a;
        }, { price_new: Infinity });
        if (lowest.drm && lowest.drm[0])
          lowest.drm[0] = capitalize(lowest.drm[0]);
        lowest.itad_url = res.urls.game;
      }
    } catch (e) {
      console.error(e);
      error = e;
    }
    return [lowest, error];
  }
  async function getBundles(plainId, region) {
    let [bundles, error] = [{}, void 0];
    const endpoint = api("v01", "game", "bundles");
    const payload = { key: API_KEY, plains: plainId, region };
    try {
      let res = await request("GET", endpoint, payload);
      res = parseResponse(res);
      bundles.total = res.total;
      bundles.urls = res.urls;
    } catch (e) {
      console.error(e);
      error = e;
    }
    return [bundles, error];
  }
  async function getPriceData(gameId, userRegion, userCountry) {
    let priceData = {
      historicalLow: {},
      historicalLowGOG: {},
      currentLowest: {},
      bundles: {}
    };
    let error = void 0;
    try {
      let [plainId, idError] = await getPlainId(gameId);
      if (idError)
        throw idError;
      let res = await Promise.all([
        getHistoricalLow(plainId, void 0, userRegion, userCountry),
        getHistoricalLow(plainId, "gog", userRegion, userCountry),
        getCurrentLowest(plainId, userRegion, userCountry),
        getBundles(plainId, userRegion)
      ]);
      let batchError = res.reduce((a, [_data, resError]) => {
        return resError ? resError : a;
      }, void 0);
      if (batchError)
        throw batchError;
      priceData = {
        historicalLow: res[0][0],
        historicalLowGOG: res[1][0],
        currentLowest: res[2][0],
        bundles: res[3][0]
      };
    } catch (e) {
      console.error("Error retrieving all price data.", e);
      error = e;
    }
    return [priceData, error];
  }

  // src/storage.js
  var getValue = (key) => GM_getValue(key, null);
  var setValue = (key, value) => GM_setValue(key, value);
  function retrieveUserSettings() {
    const userRegion = getValue("userRegion");
    const userCountry = getValue("userCountry");
    return { userRegion, userCountry };
  }
  function persistUserSettings({ userRegion, userCountry }) {
    setValue("userRegion", userRegion);
    setValue("userCountry", userCountry);
  }

  // src/data/region_map.json
  var region_map_default = { eu1: { AL: { name: "Albania", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, AD: { name: "Andorra", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, AT: { name: "Austria", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, BE: { name: "Belgium", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, DK: { name: "Denmark", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, FI: { name: "Finland", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, FR: { name: "France", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, DE: { name: "Germany", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, IE: { name: "Ireland", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, LI: { name: "Liechtenstein", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, LU: { name: "Luxembourg", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, MK: { name: "Macedonia", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, NL: { name: "Netherlands", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, SE: { name: "Sweden", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, CH: { name: "Switzerland", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } } }, eu2: { BA: { name: "Bosnia And Herzegovina", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, BG: { name: "Bulgaria", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, HR: { name: "Croatia", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, CY: { name: "Cyprus", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, CZ: { name: "Czech Republic", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, EE: { name: "Estonia", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, GR: { name: "Greece", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, VA: { name: "Holy See (Vatican City State)", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, HU: { name: "Hungary", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, IT: { name: "Italy", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, LV: { name: "Latvia", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, LT: { name: "Lithuania", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, MT: { name: "Malta", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, MC: { name: "Monaco", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, ME: { name: "Montenegro", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, NO: { name: "Norway", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, PL: { name: "Poland", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, PT: { name: "Portugal", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, RO: { name: "Romania", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, SM: { name: "San Marino", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, RS: { name: "Serbia", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, SK: { name: "Slovakia", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, SI: { name: "Slovenia", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, ES: { name: "Spain", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } } }, uk: { GB: { name: "United Kingdom", region_code: "uk", currency: { code: "GBP", sign: "\xA3", delimiter: ".", left: true, html: "&pound;" } } }, us: { US: { name: "United States", region_code: "us", currency: { code: "USD", sign: "$", delimiter: ".", left: true, html: "$" } } }, ca: { CA: { name: "Canada", region_code: "ca", currency: { code: "CAD", sign: "$", delimiter: ".", left: true, html: "$" } } }, br2: { BR: { name: "Brazil 1", region_code: "br2", currency: { code: "BRL", sign: "R$", delimiter: ".", left: true, html: "R$" } }, BR2: { name: "Brazil 2", region_code: "br2", currency: { code: "BRL", sign: "R$", delimiter: ".", left: true, html: "R$" } } }, au2: { AU: { name: "Australia 1", region_code: "au2", currency: { code: "AUD", sign: "$", delimiter: ".", left: true, html: "$" } }, AU2: { name: "Australia 2", region_code: "au2", currency: { code: "AUD", sign: "$", delimiter: ".", left: true, html: "$" } } }, ru: { RU: { name: "Russian Federation", region_code: "ru", currency: { code: "RUB", sign: "\u0440\u0443\u0431", delimiter: ",", left: false, html: " p." } } }, tr: { TR: { name: "Turkey", region_code: "tr", currency: { code: "TRY", sign: "TL", delimiter: ",", left: false, html: " TL" } } }, cn: { CN: { name: "China", region_code: "cn", currency: { code: "CNY", sign: "\xA5", delimiter: ".", left: true, html: "&yen;" } } } };

  // src/components.js
  var REGIONS = Object.keys(region_map_default);
  var Link = ({ href }, text) => m("a", { href, style: "text-decoration: underline" }, text);
  var Divider = () => m("div", {
    style: rules({
      boxShadow: "0px 4px 6px -2px rgba(0, 0, 0, 0.25)",
      height: "14px",
      position: "absolute",
      left: "0",
      width: "100%"
    })
  });
  var Notifications = ({ state }) => {
    const historicalLow = state.historicalLow.price || void 0;
    const currentLowest = state.currentLowest.price_new || void 0;
    const userCurrency = region_map_default[state.userRegion][state.userCountry].currency.code;
    if (
      // If price is neither Historical Low or Current Low
      !(historicalLow && state.currentPrice <= historicalLow || currentLowest && state.currentPrice <= currentLowest) || userCurrency !== state.pageCurrency
    ) {
      return null;
    }
    return m(
      "div",
      { style: rules({ margin: "0.8em 0", lineHeight: "1.5em" }) },
      historicalLow && state.currentPrice <= historicalLow && m(
        "p",
        m("i", ""),
        m("b", { style: "color: #739c00" }, "\u2713  HISTORICAL LOWEST PRICE.")
      ),
      currentLowest && state.currentPrice <= currentLowest && m(
        "p",
        m("i", ""),
        m("b", { style: "color: #739c00" }, "\u2713  CURRENT LOWEST PRICE.")
      )
    );
  };
  var Stats = ({ state }) => {
    const { currentLowest, historicalLow, historicalLowGOG, bundles } = state;
    const currency = region_map_default[state.userRegion][state.userCountry].currency;
    const formatPrice = createPriceFormatter(currency.sign, currency.delimiter, currency.left);
    return m(
      "div",
      { style: rules({ fontSize: "13px", margin: "1em 0", lineHeight: "1.7em" }) },
      currentLowest.shop && m(
        "p",
        m("b", "Current Lowest Price: "),
        `${formatPrice(currentLowest.price_new.toFixed(2))} at `,
        Link({ href: currentLowest.url }, currentLowest.shop.name),
        currentLowest.drm[0] ? ` (DRM: ${currentLowest.drm[0]}) ` : " ",
        "(",
        Link({ href: currentLowest.itad_url }, "Info"),
        ")"
      ),
      historicalLow.shop && m(
        "p",
        m("b", {}, "Historical Lowest Price: "),
        `${formatPrice(historicalLow.price.toFixed(2))} at ${historicalLow.shop.name} on ${historicalLow.date} `,
        "(",
        Link({ href: historicalLow.urls.history }, "Info"),
        ")"
      ),
      historicalLowGOG.price && m(
        "p",
        m("b", {}, "Historical Lowest Price on GOG: "),
        `${formatPrice(historicalLowGOG.price.toFixed(2))} on ${historicalLowGOG.date} `,
        "(",
        Link({ href: historicalLowGOG.urls.history + "?shop[]=gog&generate=Select+Stores" }, "Info"),
        ")"
      ),
      bundles.total !== void 0 && m(
        "p",
        m("b", {}, "Number of times this game has been in a bundle: "),
        `${bundles.total} `,
        "(",
        Link({ href: bundles.urls.bundles }, "Info"),
        ")"
      )
    );
  };
  var Error2 = ({ state, actions }) => m(
    "div",
    { style: "padding: 1em;" },
    m("span", "Woops. Enhanced GOG encountered an error. Try another region or "),
    m("a", {
      style: "text-decoration: underline; cursor: pointer;",
      onclick: async () => {
        actions.reset();
        redraw();
        const [priceData, error] = await getPriceData(
          state.gameId,
          state.userRegion,
          state.userCountry
        );
        if (error)
          actions.set({ error });
        else
          actions.setPriceData(priceData);
      }
    }, "click here to try again.")
  );
  var Spinner = () => m(
    "div",
    { style: rules({ textAlign: "center", width: "100%" }) },
    m(
      "p",
      { style: "padding: 1.5em 0 0.3em 0;" },
      m("span", {
        class: "menu-friends-empty__spinner is-spinning"
      })
    )
  );
  var CountrySelect = ({ state, actions }) => {
    const countryValue = `${state.userRegion}-${state.userCountry}`;
    return m(
      "div",
      { style: rules({ margin: "1em 0 0 0", fontSize: "13px" }) },
      m("p", m("b", "Enhanced GOG Region")),
      m(
        "p",
        m(
          "select",
          {
            style: rules({
              border: "1px solid #cecece",
              padding: "0.4em",
              margin: "0.5em 0 0 0",
              backgroundColor: "#f6f6f6"
            }),
            value: countryValue,
            onchange: async (ev) => {
              const [userRegion, userCountry] = ev.target.value.split("-");
              actions.reset();
              redraw();
              persistUserSettings({ userRegion, userCountry });
              actions.set({ userRegion, userCountry });
              const [priceData, error] = await getPriceData(
                state.gameId,
                userRegion,
                userCountry
              );
              if (error)
                actions.set({ error });
              else
                actions.setPriceData(priceData);
            }
          },
          REGIONS.map(
            (region) => m(
              "optgroup",
              { label: region },
              Object.keys(region_map_default[region]).map(
                (country) => m("option", {
                  value: `${region}-${country}`,
                  selected: countryValue === `${region}-${country}`
                }, region_map_default[region][country].name)
              )
            )
          )
        )
      )
    );
  };

  // src/index.js
  var App = ({ state, actions }) => m(
    "div",
    Divider(),
    m(
      "div",
      { style: "padding: 1.2em 24px;" },
      state.currentLowest && state.historicalLow && Notifications({ state }),
      state.currentLowest || state.historicalLow || state.historicalLowGOG || state.bundles ? Stats({ state }) : state.error ? Error2({ state, actions }) : Spinner(),
      CountrySelect({ state, actions })
    )
  );
  var product = unsafeWindow.productcardData;
  if (product && typeof product === "object") {
    console.log(`== Enhanced GOG ${VERSION} ==`);
    const state = State({
      gameId: product.cardProductId,
      currentPrice: product.cardProduct.price.finalAmount,
      pageCurrency: product.currency
    });
    const actions = Actions(state);
    const { userRegion, userCountry } = retrieveUserSettings();
    if (userRegion && userCountry) {
      actions.set({ userRegion, userCountry });
    } else {
      persistUserSettings({
        userRegion: state.userRegion,
        userCountry: state.userCountry
      });
    }
    const container = document.createElement("div");
    container.className = "enhanced-gog-container";
    document.querySelector("div.product-actions").appendChild(container);
    mount(container, () => App({ state, actions }));
    getPriceData(state.gameId, state.userRegion, state.userCountry).then(([priceData, error]) => {
      if (error)
        throw error;
      actions.setPriceData(priceData);
    }).catch((error) => {
      console.error("Enhanced GOG Failed to initialize.");
      console.error(error);
      actions.set({ error });
    }).finally(redraw);
  }
})();
