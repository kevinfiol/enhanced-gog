// ==UserScript==
// @name enhanced-gog
// @namespace https://github.com/kevinfiol/enhanced-gog
// @version 1.5.3
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
  // node_modules/.pnpm/umhi@0.1.4/node_modules/umhi/dist/umhi.js
  var NIL = void 0;
  var REDRAWS = [];
  var isArray = Array.isArray;
  var isStr = (x) => typeof x === "string";
  var isFn = (x) => typeof x === "function";
  var isObj = (x) => x !== null && typeof x === "object";
  var createNode = (v) => document[v._cmp ? "createElement" : "createTextNode"](v.tag || v);
  var addChildren = (x, children) => {
    if (isArray(x))
      for (let i = 0; i < x.length; i++)
        addChildren(x[i], children);
    else if (x != null && x !== false)
      children.push(x);
  };
  var styles = (obj) => {
    let str = "";
    for (let k in obj)
      str += k.replace(/[A-Z]/g, (m2) => "-" + m2.toLowerCase()) + ":" + obj[k] + ";";
    return str;
  };
  var update = (node, v, redraw2) => {
    if (!v._cmp)
      return node.nodeValue === v + "" || (node.nodeValue = v);
    for (let i in v.props) {
      let newProp = v.props[i];
      if (i in node) {
        if (redraw2 && i[0] === "o" && i[1] === "n" && isFn(newProp)) {
          let res, fn = newProp;
          node[i] = (ev) => (res = fn(ev)) instanceof Promise ? res.finally((_) => (redraw2(), res = NIL)) : (redraw2(), res = NIL);
        } else {
          if (i === "style" && isObj(newProp))
            newProp = styles(newProp);
          node[i] = newProp;
        }
      } else if (!isFn(newProp) && node.getAttribute(i) != newProp) {
        if (newProp == null || newProp === false)
          node.removeAttribute(i);
        else
          node.setAttribute(i, newProp);
      }
    }
    for (let i = 0, names = [...node.getAttributeNames(), ...Object.keys(node)]; i < names.length; i++)
      if (!(names[i] in v.props))
        i in node ? node[names[i]] = NIL : node.removeAttribute(names[i]);
  };
  function render(parent, cmp, redraw2) {
    let i, tmp, olds = parent.childNodes || [], children = cmp.children || [], news = isArray(children) ? children : [children];
    for (i = 0, tmp = Array(Math.max(0, olds.length - news.length)); i < tmp.length; i++)
      parent.removeChild(parent.lastChild);
    for (i = 0; i < news.length; i++) {
      let node, vnode = news[i];
      node = olds[i] || createNode(vnode);
      if (!olds[i])
        parent.appendChild(node);
      else if ((node.tagName || "") !== (vnode.tag || "").toUpperCase()) {
        node = createNode(vnode);
        parent.replaceChild(node, olds[i]);
      }
      update(node, vnode, redraw2);
      render(node, vnode, redraw2);
    }
  }
  function mount(el, cmp) {
    let redraw2;
    el.innerHTML = "";
    REDRAWS.push(
      redraw2 = (_) => requestAnimationFrame(
        (_2) => render(el, { children: cmp() }, redraw2)
      )
    );
    return redraw2() && redraw2;
  }
  var redraw = (_) => REDRAWS.map((r) => r());
  function m(tag, ...tail) {
    let k, tmp, classes, first = tail[0], props = {}, children = [];
    if (isObj(first) && !isArray(first) && first.tag === NIL)
      [props, ...tail] = tail;
    if (isStr(tag)) {
      [tag, ...classes] = tag.split(".");
      classes = classes.join(" ");
      if (isObj(tmp = props.class)) {
        for (k in tmp) {
          if (tmp[k]) {
            if (classes)
              classes += " ";
            classes += k;
          }
        }
      }
      if (isStr(tmp))
        classes += !classes ? tmp : tmp ? " " + tmp : "";
      if (classes)
        props.class = classes;
    }
    addChildren(tail, children);
    return { _cmp: 1, tag, props: { ...props }, children };
  }

  // src/config.js
  var VERSION = "1.5.3";
  var API_KEY = "d047b30e0fc7d9118f3953de04fa6af9eba22379";

  // src/state.js
  var State = (init = {}) => ({
    collapsed: false,
    gameTitle: void 0,
    itadSlug: void 0,
    currentPrice: void 0,
    pageCurrency: void 0,
    userRegion: "us",
    // deprecated
    userCountry: "US",
    // price data
    currentLowest: void 0,
    historicalLow: void 0,
    historicalLowGOG: void 0,
    totalBundles: void 0,
    currentBundles: void 0,
    error: void 0,
    ...init
  });
  var Actions = (state, $) => $ = {
    set(obj) {
      for (let k in obj) {
        if (!(k in state))
          throw Error(`Not a valid state property: ${k}`);
        state[k] = obj[k];
      }
    },
    reset() {
      $.set({
        currentLowest: void 0,
        historicalLow: void 0,
        historicalLowGOG: void 0,
        totalBundles: void 0,
        currentBundles: void 0,
        error: void 0
      });
    }
  };

  // src/util.js
  var createPriceFormatter = (sign, delimiter, left) => {
    return (price) => {
      const delimited_price = price.replace(".", delimiter);
      return left ? `${sign}${delimited_price}` : `${delimited_price}${sign}`;
    };
  };
  var getUrlPart = (str) => {
    const url = new URL(str);
    const part = url.searchParams.get("url") || url.searchParams.get("URL");
    return part.trim() || url;
  };
  var getDateStr = (timestamp) => {
    const date = new Date(timestamp);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };
  var request = (method, url, { params = {}, body = {} }) => {
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
          data: method === "POST" ? JSON.stringify(body) : null,
          headers: { "Content-Type": "application/json" },
          onload: (res) => {
            let json = {};
            try {
              json = JSON.parse(res.responseText);
            } catch {
            }
            if (res.status >= 200 && res.status < 300) {
              resolve(json);
            } else {
              reject(json);
            }
          },
          onerror: (err) => reject(err)
        });
      } else {
        const xhr = new XMLHttpRequest();
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.open(method, `${url}?${queryStr}`);
        xhr.onload = () => {
          let json = {};
          try {
            json = JSON.parse(xhr.response);
          } catch {
          }
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(json);
          } else {
            reject(json);
          }
        };
        xhr.onerror = () => reject(xhr);
        xhr.send(JSON.stringify(body));
      }
    });
  };

  // src/itad.js
  var GOG_SHOP_ID = 35;
  var api = (iface, method, version) => `https://api.isthereanydeal.com/${iface}/${method}/${version}`;
  async function getInfo(gameTitle) {
    let [info, error] = [{ id: "", slug: "" }, void 0];
    const endpoint = api("games", "search", "v1");
    const params = { key: API_KEY, title: gameTitle, results: 1 };
    try {
      const res = await request("GET", endpoint, { params });
      if (!Array.isArray(res) || res.length === 0)
        throw Error("Game Not Found.");
      info.id = res[0].id;
      info.slug = res[0].slug;
    } catch (e) {
      error = e;
    }
    return [info, error];
  }
  async function getPriceOverview(id, country) {
    let [overview, error] = [
      { current: {}, historical: {}, bundles: 0 },
      void 0
    ];
    const endpoint = api("games", "overview", "v2");
    const params = { key: API_KEY, country };
    const body = [id];
    try {
      const res = await request("POST", endpoint, { params, body });
      if (res.prices && res.prices.length > 0) {
        const { current, lowest } = res.prices[0];
        if (current.price) {
          overview.current = {
            drm: current.drm && current.drm.length > 0 ? current.drm[0].name : "",
            price: current.price.amount,
            shop: current.shop.name,
            url: current.url,
            date: getDateStr(current.timestamp)
          };
        }
        if (lowest.price) {
          overview.historical = {
            drm: lowest.drm && lowest.drm.length > 0 ? lowest.drm[0].name : "",
            price: lowest.price.amount,
            shop: lowest.shop.name,
            date: getDateStr(lowest.timestamp)
          };
        }
      }
      if (res.bundles) {
        overview.bundles = res.bundles.length;
      }
    } catch (e) {
      error = e;
    }
    return [overview, error];
  }
  async function getHistoricalLowGOG(id, country) {
    let [low, error] = [{}, void 0];
    const endpoint = api("games", "storelow", "v2");
    const params = { key: API_KEY, country, shops: [GOG_SHOP_ID] };
    const body = [id];
    try {
      let res = await request("POST", endpoint, { params, body });
      const data = Array.isArray(res) && res.length > 0 ? res[0].lows[0] : void 0;
      if (data !== void 0 && data.price) {
        low = {
          price: data.price.amount,
          shop: "GOG",
          date: getDateStr(data.timestamp)
        };
      }
    } catch (e) {
      error = e;
    }
    return [low, error];
  }
  async function getCurrentBundles(id, country) {
    let [bundles, error] = [[], void 0];
    const endpoint = api("games", "bundles", "v2");
    const params = { key: API_KEY, id, country, expired: false };
    try {
      let res = await request("GET", endpoint, { params });
      if (Array.isArray(res)) {
        bundles = res.map((bundle) => {
          return {
            title: bundle.title,
            url: getUrlPart(bundle.url)
          };
        });
      }
    } catch (e) {
      error = e;
    }
    return [bundles, error];
  }
  async function getPriceData(gameTitle, userCountry) {
    let priceData = {
      historicalLow: {},
      historicalLowGOG: {},
      currentLowest: {},
      bundles: {}
    };
    let error = void 0;
    try {
      let [{ id, slug }, infoError] = await getInfo(gameTitle);
      if (infoError)
        throw infoError;
      let res = await Promise.all([
        getPriceOverview(id, userCountry),
        getHistoricalLowGOG(id, userCountry),
        getCurrentBundles(id, userCountry)
      ]);
      let batchError = res.reduce((a, [_data, resError]) => {
        return resError ? resError : a;
      }, void 0);
      if (batchError)
        throw batchError;
      priceData = {
        itadSlug: slug,
        currentLowest: res[0][0].current,
        historicalLow: res[0][0].historical,
        totalBundles: res[0][0].bundles,
        historicalLowGOG: res[1][0],
        currentBundles: res[2][0]
      };
    } catch (e) {
      error = e;
    }
    return [priceData, error];
  }

  // src/storage.js
  var getValue = (key) => GM_getValue(key, null);
  var setValue = (key, value) => GM_setValue(key, value);
  function retrieveUserSettings() {
    const collapsed = getValue("collapsed");
    const userRegion = getValue("userRegion");
    const userCountry = getValue("userCountry");
    return { collapsed, userRegion, userCountry };
  }
  function persistUserSettings(settings = {}) {
    for (const k in settings) {
      setValue(k, settings[k]);
    }
  }

  // src/data/region_map.json
  var region_map_default = { eu1: { AL: { name: "Albania", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, AD: { name: "Andorra", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, AT: { name: "Austria", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, BE: { name: "Belgium", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, DK: { name: "Denmark", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, FI: { name: "Finland", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, FR: { name: "France", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, DE: { name: "Germany", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, IE: { name: "Ireland", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, LI: { name: "Liechtenstein", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, LU: { name: "Luxembourg", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, MK: { name: "Macedonia", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, NL: { name: "Netherlands", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, SE: { name: "Sweden", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, CH: { name: "Switzerland", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } } }, eu2: { BA: { name: "Bosnia And Herzegovina", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, BG: { name: "Bulgaria", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, HR: { name: "Croatia", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, CY: { name: "Cyprus", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, CZ: { name: "Czech Republic", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, EE: { name: "Estonia", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, GR: { name: "Greece", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, VA: { name: "Holy See (Vatican City State)", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, HU: { name: "Hungary", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, IT: { name: "Italy", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, LV: { name: "Latvia", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, LT: { name: "Lithuania", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, MT: { name: "Malta", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, MC: { name: "Monaco", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, ME: { name: "Montenegro", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, NO: { name: "Norway", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, PL: { name: "Poland", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, PT: { name: "Portugal", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, RO: { name: "Romania", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, SM: { name: "San Marino", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, RS: { name: "Serbia", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, SK: { name: "Slovakia", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, SI: { name: "Slovenia", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, ES: { name: "Spain", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } } }, uk: { GB: { name: "United Kingdom", region_code: "uk", currency: { code: "GBP", sign: "\xA3", delimiter: ".", left: true, html: "&pound;" } } }, us: { US: { name: "United States", region_code: "us", currency: { code: "USD", sign: "$", delimiter: ".", left: true, html: "$" } } }, ca: { CA: { name: "Canada", region_code: "ca", currency: { code: "CAD", sign: "$", delimiter: ".", left: true, html: "$" } } }, br2: { BR: { name: "Brazil 1", region_code: "br2", currency: { code: "BRL", sign: "R$", delimiter: ".", left: true, html: "R$" } }, BR2: { name: "Brazil 2", region_code: "br2", currency: { code: "BRL", sign: "R$", delimiter: ".", left: true, html: "R$" } } }, au2: { AU: { name: "Australia 1", region_code: "au2", currency: { code: "AUD", sign: "$", delimiter: ".", left: true, html: "$" } }, AU2: { name: "Australia 2", region_code: "au2", currency: { code: "AUD", sign: "$", delimiter: ".", left: true, html: "$" } } }, ru: { RU: { name: "Russian Federation", region_code: "ru", currency: { code: "RUB", sign: "\u0440\u0443\u0431", delimiter: ",", left: false, html: " p." } } }, tr: { TR: { name: "Turkey", region_code: "tr", currency: { code: "TRY", sign: "TL", delimiter: ",", left: false, html: " TL" } } }, cn: { CN: { name: "China", region_code: "cn", currency: { code: "CNY", sign: "\xA5", delimiter: ".", left: true, html: "&yen;" } } } };

  // src/components.js
  var REGIONS = Object.keys(region_map_default);
  var Link = ({ href }, text) => m("a", { href, style: "text-decoration: underline" }, text);
  var Divider = () => m("div", {
    style: {
      boxShadow: "0px 4px 6px -2px rgba(0, 0, 0, 0.25)",
      height: "14px",
      position: "absolute",
      left: "0",
      width: "100%"
    }
  });
  var Notifications = ({ state }) => {
    const historicalLow = state.historicalLow.price;
    const currentLowest = state.currentLowest.price;
    const userCurrency = region_map_default[state.userRegion][state.userCountry].currency.code;
    if (
      // If price is neither Historical Low or Current Low
      !(historicalLow && state.currentPrice <= historicalLow || currentLowest && state.currentPrice <= currentLowest) || userCurrency !== state.pageCurrency
    ) {
      return null;
    }
    return m(
      "div",
      { style: { margin: "0.8em 0 0.4em 0", lineHeight: "1.5em" } },
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
    const { currentLowest, historicalLow, historicalLowGOG, totalBundles, currentBundles, itadSlug } = state;
    const currency = region_map_default[state.userRegion][state.userCountry].currency;
    const formatPrice = createPriceFormatter(currency.sign, currency.delimiter, currency.left);
    const infoUrl = `https://isthereanydeal.com/game/${itadSlug}/info/`;
    const historyUrl = `https://isthereanydeal.com/game/${itadSlug}/history/`;
    return m(
      "div",
      { style: { fontSize: "13px", margin: "1em 0", lineHeight: "1.7em" } },
      currentLowest.price && m(
        "p",
        m("b", "Current Lowest Price: "),
        `${formatPrice(currentLowest.price.toFixed(2))} at `,
        Link({ href: currentLowest.url }, currentLowest.shop),
        currentLowest.drm ? ` (DRM: ${currentLowest.drm}) ` : " ",
        "(",
        Link({ href: infoUrl }, "Info"),
        ")"
      ),
      historicalLow.price && m(
        "p",
        m("b", "Historical Lowest Price: "),
        `${formatPrice(historicalLow.price.toFixed(2))} at ${historicalLow.shop} on ${historicalLow.date} `,
        "(",
        Link({ href: historyUrl }, "Info"),
        ")"
      ),
      historicalLowGOG.price && m(
        "p",
        m("b", "Historical Lowest Price on GOG: "),
        `${formatPrice(historicalLowGOG.price.toFixed(2))} on ${historicalLowGOG.date} `,
        "(",
        Link({ href: historyUrl }, "Info"),
        ")"
      ),
      totalBundles !== void 0 && m(
        "p",
        m("b", "Number of times this game has been in a bundle: "),
        `${totalBundles} `,
        "(",
        Link({ href: infoUrl }, "Info"),
        ")"
      ),
      currentBundles.length > 0 && m(
        "p",
        { style: "color: #739c00" },
        m("b", "This game is currently in these bundles:"),
        m(
          "ul",
          currentBundles.map(
            (bundle) => m("li", Link({ href: bundle.url }, bundle.title))
          )
        )
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
          state.gameTitle,
          state.userCountry
        );
        if (error)
          actions.set({ error });
        else
          actions.set(priceData);
      }
    }, "click here to try again.")
  );
  var Spinner = () => m(
    "div",
    { style: { textAlign: "center", width: "100%" } },
    m(
      "p",
      { style: "padding: 1.5em 0 1em 0;" },
      m("span", {
        class: "menu-friends-empty__spinner is-spinning"
      })
    )
  );
  var CountrySelect = ({ state, actions }) => {
    const countryValue = `${state.userRegion}-${state.userCountry}`;
    return m(
      "div",
      { style: { margin: "1em 0", fontSize: "13px" } },
      m("p", m("b", "Enhanced GOG Region")),
      m(
        "p",
        m(
          "select",
          {
            style: {
              border: "1px solid #cecece",
              padding: "0.4em",
              margin: "0.5em 0 0 0",
              backgroundColor: "#f6f6f6"
            },
            value: countryValue,
            onchange: async (ev) => {
              const [userRegion, userCountry] = ev.target.value.split("-");
              actions.reset();
              redraw();
              persistUserSettings({ userRegion, userCountry });
              actions.set({ userRegion, userCountry });
              const [priceData, error] = await getPriceData(
                state.gameTitle,
                userCountry
              );
              if (error)
                actions.set({ error });
              else
                actions.set(priceData);
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
  var App = ({ state, actions }) => {
    const isLoading = !(state.currentLowest || state.historicalLow || state.historicalLowGOG || state.totalBundles || state.currentBundles);
    const showContent = !isLoading && !state.error;
    return m(
      "div",
      Divider(),
      m(
        "div",
        { style: { padding: "1.2em 24px" } },
        showContent && Notifications({ state }),
        state.error ? Error2({ state, actions }) : isLoading ? Spinner() : null,
        m(
          "div",
          {
            style: {
              display: "grid",
              gridTemplateRows: state.collapsed ? "0fr" : "1fr",
              transition: "grid-template-rows 0.3s ease"
            }
          },
          m(
            "div",
            {
              style: { overflow: "hidden" }
            },
            showContent && Stats({ state }),
            CountrySelect({ state, actions })
          )
        ),
        m(
          "div",
          { style: { textAlign: "center" } },
          m("button", {
            style: {
              fontSize: "13px",
              fontWeight: "bold",
              cursor: "pointer",
              border: "1px solid rgba(100, 100, 100, 0.2)",
              padding: "0.5em"
            },
            onclick: () => {
              const collapsed = !state.collapsed;
              actions.set({ collapsed });
              persistUserSettings({ collapsed });
            }
          }, state.collapsed ? "Show Enhanced GOG \u25B4" : "Hide \u25BE")
        )
      )
    );
  };
  var product = unsafeWindow.productcardData;
  if (product && typeof product === "object") {
    console.log(`== Enhanced GOG ${VERSION} ==`);
    const state = State({
      gameTitle: product.cardProduct.title,
      currentPrice: Number(product.cardProduct.price.finalAmount),
      pageCurrency: product.currency
    });
    const actions = Actions(state);
    const { collapsed, userRegion, userCountry } = retrieveUserSettings();
    if (collapsed != null && userRegion && userCountry) {
      actions.set({ collapsed, userRegion, userCountry });
    } else {
      persistUserSettings({
        collapsed: state.collapsed,
        userRegion: state.userRegion,
        userCountry: state.userCountry
      });
    }
    const container = document.createElement("div");
    container.className = "enhanced-gog-container";
    document.querySelector("div.product-actions").appendChild(container);
    mount(container, () => App({ state, actions }));
    getPriceData(state.gameTitle, state.userCountry).then(([priceData, error]) => {
      if (error)
        throw error;
      actions.set(priceData);
    }).catch((error) => {
      console.error("Enhanced GOG Failed to initialize.");
      console.error(error);
      actions.set({ error });
    }).finally(redraw);
  }
})();
