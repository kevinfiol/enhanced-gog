// ==UserScript==
// @name enhanced-gog
// @namespace https://github.com/kevinfiol/enhanced-gog
// @version 1.3.1
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
  // node_modules/.pnpm/hyperapp@1.2.10/node_modules/hyperapp/src/index.js
  function h(name, attributes) {
    var rest = [];
    var children = [];
    var length = arguments.length;
    while (length-- > 2)
      rest.push(arguments[length]);
    while (rest.length) {
      var node = rest.pop();
      if (node && node.pop) {
        for (length = node.length; length--; ) {
          rest.push(node[length]);
        }
      } else if (node != null && node !== true && node !== false) {
        children.push(node);
      }
    }
    return typeof name === "function" ? name(attributes || {}, children) : {
      nodeName: name,
      attributes: attributes || {},
      children,
      key: attributes && attributes.key
    };
  }
  function app(state, actions2, view, container) {
    var map = [].map;
    var rootElement = container && container.children[0] || null;
    var oldNode = rootElement && recycleElement(rootElement);
    var lifecycle = [];
    var skipRender;
    var isRecycling = true;
    var globalState = clone(state);
    var wiredActions = wireStateToActions([], globalState, clone(actions2));
    scheduleRender();
    return wiredActions;
    function recycleElement(element) {
      return {
        nodeName: element.nodeName.toLowerCase(),
        attributes: {},
        children: map.call(element.childNodes, function(element2) {
          return element2.nodeType === 3 ? element2.nodeValue : recycleElement(element2);
        })
      };
    }
    function resolveNode(node) {
      return typeof node === "function" ? resolveNode(node(globalState, wiredActions)) : node != null ? node : "";
    }
    function render() {
      skipRender = !skipRender;
      var node = resolveNode(view);
      if (container && !skipRender) {
        rootElement = patch(container, rootElement, oldNode, oldNode = node);
      }
      isRecycling = false;
      while (lifecycle.length)
        lifecycle.pop()();
    }
    function scheduleRender() {
      if (!skipRender) {
        skipRender = true;
        setTimeout(render);
      }
    }
    function clone(target, source) {
      var out = {};
      for (var i in target)
        out[i] = target[i];
      for (var i in source)
        out[i] = source[i];
      return out;
    }
    function setPartialState(path, value, source) {
      var target = {};
      if (path.length) {
        target[path[0]] = path.length > 1 ? setPartialState(path.slice(1), value, source[path[0]]) : value;
        return clone(source, target);
      }
      return value;
    }
    function getPartialState(path, source) {
      var i = 0;
      while (i < path.length) {
        source = source[path[i++]];
      }
      return source;
    }
    function wireStateToActions(path, state2, actions3) {
      for (var key in actions3) {
        typeof actions3[key] === "function" ? function(key2, action) {
          actions3[key2] = function(data) {
            var result = action(data);
            if (typeof result === "function") {
              result = result(getPartialState(path, globalState), actions3);
            }
            if (result && result !== (state2 = getPartialState(path, globalState)) && !result.then) {
              scheduleRender(globalState = setPartialState(path, clone(state2, result), globalState));
            }
            return result;
          };
        }(key, actions3[key]) : wireStateToActions(path.concat(key), state2[key] = clone(state2[key]), actions3[key] = clone(actions3[key]));
      }
      return actions3;
    }
    function getKey(node) {
      return node ? node.key : null;
    }
    function eventListener(event) {
      return event.currentTarget.events[event.type](event);
    }
    function updateAttribute(element, name, value, oldValue, isSvg) {
      if (name === "key") {
      } else if (name === "style") {
        if (typeof value === "string") {
          element.style.cssText = value;
        } else {
          if (typeof oldValue === "string")
            oldValue = element.style.cssText = "";
          for (var i in clone(oldValue, value)) {
            var style = value == null || value[i] == null ? "" : value[i];
            if (i[0] === "-") {
              element.style.setProperty(i, style);
            } else {
              element.style[i] = style;
            }
          }
        }
      } else {
        if (name[0] === "o" && name[1] === "n") {
          name = name.slice(2);
          if (element.events) {
            if (!oldValue)
              oldValue = element.events[name];
          } else {
            element.events = {};
          }
          element.events[name] = value;
          if (value) {
            if (!oldValue) {
              element.addEventListener(name, eventListener);
            }
          } else {
            element.removeEventListener(name, eventListener);
          }
        } else if (name in element && name !== "list" && name !== "type" && name !== "draggable" && name !== "spellcheck" && name !== "translate" && !isSvg) {
          element[name] = value == null ? "" : value;
        } else if (value != null && value !== false) {
          element.setAttribute(name, value);
        }
        if (value == null || value === false) {
          element.removeAttribute(name);
        }
      }
    }
    function createElement(node, isSvg) {
      var element = typeof node === "string" || typeof node === "number" ? document.createTextNode(node) : (isSvg = isSvg || node.nodeName === "svg") ? document.createElementNS("http://www.w3.org/2000/svg", node.nodeName) : document.createElement(node.nodeName);
      var attributes = node.attributes;
      if (attributes) {
        if (attributes.oncreate) {
          lifecycle.push(function() {
            attributes.oncreate(element);
          });
        }
        for (var i = 0; i < node.children.length; i++) {
          element.appendChild(createElement(node.children[i] = resolveNode(node.children[i]), isSvg));
        }
        for (var name in attributes) {
          updateAttribute(element, name, attributes[name], null, isSvg);
        }
      }
      return element;
    }
    function updateElement(element, oldAttributes, attributes, isSvg) {
      for (var name in clone(oldAttributes, attributes)) {
        if (attributes[name] !== (name === "value" || name === "checked" ? element[name] : oldAttributes[name])) {
          updateAttribute(element, name, attributes[name], oldAttributes[name], isSvg);
        }
      }
      var cb = isRecycling ? attributes.oncreate : attributes.onupdate;
      if (cb) {
        lifecycle.push(function() {
          cb(element, oldAttributes);
        });
      }
    }
    function removeChildren(element, node) {
      var attributes = node.attributes;
      if (attributes) {
        for (var i = 0; i < node.children.length; i++) {
          removeChildren(element.childNodes[i], node.children[i]);
        }
        if (attributes.ondestroy) {
          attributes.ondestroy(element);
        }
      }
      return element;
    }
    function removeElement(parent, element, node) {
      function done() {
        parent.removeChild(removeChildren(element, node));
      }
      var cb = node.attributes && node.attributes.onremove;
      if (cb) {
        cb(element, done);
      } else {
        done();
      }
    }
    function patch(parent, element, oldNode2, node, isSvg) {
      if (node === oldNode2) {
      } else if (oldNode2 == null || oldNode2.nodeName !== node.nodeName) {
        var newElement = createElement(node, isSvg);
        parent.insertBefore(newElement, element);
        if (oldNode2 != null) {
          removeElement(parent, element, oldNode2);
        }
        element = newElement;
      } else if (oldNode2.nodeName == null) {
        element.nodeValue = node;
      } else {
        updateElement(element, oldNode2.attributes, node.attributes, isSvg = isSvg || node.nodeName === "svg");
        var oldKeyed = {};
        var newKeyed = {};
        var oldElements = [];
        var oldChildren = oldNode2.children;
        var children = node.children;
        for (var i = 0; i < oldChildren.length; i++) {
          oldElements[i] = element.childNodes[i];
          var oldKey = getKey(oldChildren[i]);
          if (oldKey != null) {
            oldKeyed[oldKey] = [oldElements[i], oldChildren[i]];
          }
        }
        var i = 0;
        var k = 0;
        while (k < children.length) {
          var oldKey = getKey(oldChildren[i]);
          var newKey = getKey(children[k] = resolveNode(children[k]));
          if (newKeyed[oldKey]) {
            i++;
            continue;
          }
          if (newKey != null && newKey === getKey(oldChildren[i + 1])) {
            if (oldKey == null) {
              removeElement(element, oldElements[i], oldChildren[i]);
            }
            i++;
            continue;
          }
          if (newKey == null || isRecycling) {
            if (oldKey == null) {
              patch(element, oldElements[i], oldChildren[i], children[k], isSvg);
              k++;
            }
            i++;
          } else {
            var keyedNode = oldKeyed[newKey] || [];
            if (oldKey === newKey) {
              patch(element, keyedNode[0], keyedNode[1], children[k], isSvg);
              i++;
            } else if (keyedNode[0]) {
              patch(element, element.insertBefore(keyedNode[0], oldElements[i]), keyedNode[1], children[k], isSvg);
            } else {
              patch(element, oldElements[i], null, children[k], isSvg);
            }
            newKeyed[newKey] = children[k];
            k++;
          }
        }
        while (i < oldChildren.length) {
          if (getKey(oldChildren[i]) == null) {
            removeElement(element, oldElements[i], oldChildren[i]);
          }
          i++;
        }
        for (var i in oldKeyed) {
          if (!newKeyed[i]) {
            removeElement(element, oldKeyed[i][0], oldKeyed[i][1]);
          }
        }
      }
      return element;
    }
  }

  // src/config.js
  var config = {
    VERSION: "1.3.0",
    BASE_URL: "https://api.isthereanydeal.com",
    API_KEY: "d047b30e0fc7d9118f3953de04fa6af9eba22379"
  };

  // src/util.js
  var q = (query) => document.querySelector(query);
  var c = (tag, className, innerHTML = "") => {
    const el = document.createElement(tag);
    el.className = className;
    el.innerHTML = innerHTML;
    return el;
  };
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
              resolve(res.responseText);
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
            resolve(xhr.response);
          } else {
            reject(xhr.statusText);
          }
        };
        xhr.onerror = () => reject(xhr.statusText);
        xhr.send();
      }
    });
  };

  // src/services/IsThereAnyDeal.js
  var IsThereAnyDeal = (base_url, api_key) => {
    const shop = "gog";
    const template = (version, iface, method) => {
      return `${base_url}/${version}/${iface}/${method}/`;
    };
    const parseResponse = (res) => {
      const key = Object.keys(res.data)[0];
      return res.data[key];
    };
    const getPlainId = (game_id) => {
      const endpoint = template("v02", "game", "plain");
      const data = { key: api_key, shop, game_id };
      return request("GET", endpoint, data).then(JSON.parse).then((res) => {
        if (!res[".meta"].match || !res[".meta"].active) {
          throw "Game Not Found.";
        }
        return res.data.plain;
      }).catch((err) => {
        throw err;
      });
    };
    const getHistoricalLow = (plain_id, shops = null, region, country) => {
      const endpoint = template("v01", "game", "lowest");
      const data = { key: api_key, plains: plain_id, region, country };
      if (shops)
        data.shops = shops;
      return request("GET", endpoint, data).then(JSON.parse).then(parseResponse).then((res) => {
        if (!res.price)
          return null;
        return {
          date: getDateStr(res.added),
          cut: res.cut,
          price: res.price,
          shop: res.shop,
          urls: res.urls
        };
      }).catch((err) => {
        throw err;
      });
    };
    const getCurrentLowest = (plain_id, region, country) => {
      const endpoint = template("v01", "game", "prices");
      const data = { key: api_key, plains: plain_id, region, country };
      return request("GET", endpoint, data).then(JSON.parse).then(parseResponse).then((res) => {
        if (!res.list.length)
          return null;
        const lowest = res.list.reduce((a, x) => {
          a = a.price_new >= x.price_new ? x : a;
          return a;
        }, { price_new: Infinity });
        if (lowest.drm[0])
          lowest.drm[0] = capitalize(lowest.drm[0]);
        lowest.itad_url = res.urls.game;
        return lowest;
      }).catch((err) => {
        throw err;
      });
    };
    const getBundles = (plain_id, region) => {
      const endpoint = template("v01", "game", "bundles");
      const data = { key: api_key, plains: plain_id, region };
      return request("GET", endpoint, data).then(JSON.parse).then(parseResponse).then((res) => ({ total: res.total, urls: res.urls })).catch((err) => {
        throw err;
      });
    };
    return {
      getPlainId,
      getHistoricalLow,
      getCurrentLowest,
      getBundles
    };
  };
  var IsThereAnyDeal_default = IsThereAnyDeal;

  // src/services/Storage.js
  var Storage = () => {
    const getValue = (key) => GM_getValue(key, null);
    const setValue = (key, value) => GM_setValue(key, value);
    const deleteValue = (key) => GM_deleteValue(key);
    const listValues = () => GM_listValues();
    return { getValue, setValue, deleteValue, listValues };
  };
  var Storage_default = Storage;

  // src/actions/index.js
  var itad = IsThereAnyDeal_default(config.BASE_URL, config.API_KEY);
  var storage = Storage_default();
  var setError = (error) => () => ({
    error
  });
  var setStatsToNull = () => (state) => ({
    historicalLow: null,
    historicalLowGOG: null,
    currentLowest: null,
    bundles: null
  });
  var setHistoricalLow = (historicalLow) => (state) => ({
    historicalLow
  });
  var setHistoricalLowGOG = (historicalLowGOG) => (state) => ({
    historicalLowGOG
  });
  var setCurrentLowest = (currentLowest) => (state) => ({
    currentLowest
  });
  var setBundles = (bundles) => (state) => ({
    bundles
  });
  var setUserRegion = (user_region) => (state) => ({
    user_region
  });
  var setUserCountry = (user_country) => (state) => ({
    user_country
  });
  var cacheResults = (payload) => (state) => {
    const newCache = Object.assign({}, state.cache);
    if (newCache[payload.region]) {
      newCache[payload.region][payload.country] = payload.results;
    } else {
      newCache[payload.region] = {
        [payload.country]: payload.results
      };
    }
    return { cache: newCache };
  };
  var readAndSetFromStorage = () => (state, actions2) => {
    const user_region = storage.getValue("user_region");
    const user_country = storage.getValue("user_country");
    if (user_region && user_country) {
      actions2.setUserRegion(user_region);
      actions2.setUserCountry(user_country);
    } else {
      actions2.persistToStorage({ key: "user_region", value: state.user_region });
      actions2.persistToStorage({ key: "user_country", value: state.user_country });
    }
  };
  var persistToStorage = (item) => () => {
    storage.setValue(item.key, item.value);
  };
  var getAllPriceData = () => (state, actions2) => {
    const setStats = (res) => {
      actions2.setHistoricalLow(res[0]);
      actions2.setHistoricalLowGOG(res[1]);
      actions2.setCurrentLowest(res[2]);
      actions2.setBundles(res[3]);
    };
    actions2.setError(null);
    if (state.cache[state.user_region] && state.cache[state.user_region][state.user_country]) {
      setStats(state.cache[state.user_region][state.user_country]);
    } else {
      itad.getPlainId(state.game_id).then((plain_id) => {
        return Promise.all([
          itad.getHistoricalLow(plain_id, null, state.user_region, state.user_country),
          itad.getHistoricalLow(plain_id, "gog", state.user_region, state.user_country),
          itad.getCurrentLowest(plain_id, state.user_region, state.user_country),
          itad.getBundles(plain_id, state.user_region)
        ]);
      }).then((res) => {
        setStats(res);
        actions2.cacheResults({
          region: state.user_region,
          country: state.user_country,
          results: res
        });
      }).catch((err) => {
        actions2.setError(err);
        console.log(`== Enhanced GOG - Error has occured == ${err}`);
      });
    }
  };
  var actions = {
    setError,
    getAllPriceData,
    setStatsToNull,
    setCurrentLowest,
    setHistoricalLow,
    setHistoricalLowGOG,
    setBundles,
    setUserRegion,
    setUserCountry,
    readAndSetFromStorage,
    persistToStorage,
    cacheResults
  };

  // src/components/Divider.js
  var Divider = () => () => {
    return h("div", {
      style: {
        boxShadow: "0px 4px 6px -2px rgba(0, 0, 0, 0.25)",
        height: "14px",
        position: "absolute",
        left: "0",
        width: "100%"
      }
    });
  };

  // src/components/Point.js
  var Point = (attrs, children) => () => h("p", Object.assign({ class: "" }, attrs), children);

  // src/components/Spinner.js
  var Spinner = () => () => {
    return h("div", { style: { textAlign: "center", width: "100%" } }, [
      Point({ style: { padding: "1.5em 0 0.3em 0" } }, [
        h("span", {
          class: "menu-friends-empty__spinner is-spinning"
        })
      ])
    ]);
  };

  // src/components/Link.js
  var Link = (href, text) => () => h("a", { style: { textDecoration: "underline" }, href }, text);

  // src/components/Container/Stats/CurrentLowest.js
  var CurrentLowest = () => (state) => {
    const data = state.currentLowest;
    const currency = state.region_map[state.user_region][state.user_country].currency;
    const formatPrice = createPriceFormatter(currency.sign, currency.delimiter, currency.left);
    return Point({}, [
      h("b", {}, "Current Lowest Price: "),
      `${formatPrice(data.price_new.toFixed(2))} at `,
      Link(data.url, data.shop.name),
      data.drm[0] ? ` (DRM: ${data.drm[0]}) ` : " ",
      "(",
      Link(data.itad_url, "Info"),
      ")"
    ]);
  };

  // src/components/Container/Stats/HistoricalLow.js
  var HistoricalLow = () => (state) => {
    const data = state.historicalLow;
    const currency = state.region_map[state.user_region][state.user_country].currency;
    const formatPrice = createPriceFormatter(currency.sign, currency.delimiter, currency.left);
    return Point({}, [
      h("b", {}, "Historical Lowest Price: "),
      `${formatPrice(data.price.toFixed(2))} at ${data.shop.name} on ${data.date} `,
      "(",
      Link(data.urls.history, "Info"),
      ")"
    ]);
  };

  // src/components/Container/Stats/HistoricalLowGOG.js
  var HistoricalLowGOG = () => (state) => {
    const data = state.historicalLowGOG;
    const currency = state.region_map[state.user_region][state.user_country].currency;
    const formatPrice = createPriceFormatter(currency.sign, currency.delimiter, currency.left);
    return Point({}, [
      h("b", {}, "Historical Lowest Price on GOG: "),
      `${formatPrice(data.price.toFixed(2))} on ${data.date} `,
      "(",
      Link(data.urls.history + "?shop[]=gog&generate=Select+Stores", "Info"),
      ")"
    ]);
  };

  // src/components/Container/Stats/Bundles.js
  var Bundles = () => (state) => {
    const data = state.bundles;
    return Point({}, [
      h("b", {}, "Number of times this game has been in a bundle: "),
      `${data.total} `,
      "(",
      Link(data.urls.bundles, "Info"),
      ")"
    ]);
  };

  // src/components/Container/Stats.js
  var Stats = () => (state) => {
    return h("div", { style: { fontSize: "13px", margin: "1em 0", lineHeight: "1.7em" } }, [
      state.currentLowest ? CurrentLowest() : null,
      state.historicalLow ? HistoricalLow() : null,
      state.historicalLowGOG ? HistoricalLowGOG() : null,
      state.bundles ? Bundles() : null
    ]);
  };

  // src/components/Container/CountrySelect.js
  var Group = (region, children) => () => h("optgroup", { label: region }, children);
  var Option = (code, name) => () => h("option", { value: code }, name);
  var CountrySelect = () => (state, actions2) => {
    const region_map = state.region_map;
    const regions = Object.keys(region_map);
    return h("div", { style: { margin: "1em 0 0 0", fontSize: "13px" } }, [
      Point({}, h("b", {}, "Enhanced GOG Region")),
      Point({}, [
        h("select", {
          style: { border: "1px solid #cecece", padding: "0.4em", margin: "0.5em 0 0 0", backgroundColor: "#f6f6f6" },
          oncreate: (el) => {
            el.value = `${state.user_region}-${state.user_country}`;
          },
          onchange: (ev) => {
            const [new_region, new_country] = ev.target.value.split("-");
            actions2.setStatsToNull();
            actions2.persistToStorage({ key: "user_region", value: new_region });
            actions2.persistToStorage({ key: "user_country", value: new_country });
            actions2.setUserRegion(new_region);
            actions2.setUserCountry(new_country);
            actions2.getAllPriceData();
          }
        }, [
          regions.map((region) => {
            return Group(region, Object.keys(region_map[region]).map((country) => {
              return Option(region + "-" + country, region_map[region][country].name);
            }));
          })
        ])
      ])
    ]);
  };

  // src/components/Container/Notifications.js
  var Notifications = () => (state, actions2) => {
    const histLow = state.historicalLow.price || null;
    const curLow = state.currentLowest.price_new || null;
    const user_currency = state.region_map[state.user_region][state.user_country].currency.code;
    if (!(histLow && state.currentPrice <= histLow || curLow && state.currentPrice <= curLow) || user_currency !== state.pageCurrency) {
      return null;
    }
    return h("div", {
      style: { margin: "0.8em 0", lineHeight: "1.5em" }
    }, [
      histLow && state.currentPrice <= histLow ? Point({}, [
        h("i", { class: "" }, ""),
        h("b", { style: { color: "#739c00" } }, "\u2713  HISTORICAL LOWEST PRICE.")
      ]) : null,
      curLow && state.currentPrice <= curLow ? Point({}, [
        h("i", { class: "" }, ""),
        h("b", { style: { color: "#739c00" } }, "\u2713  CURRENT LOWEST PRICE.")
      ]) : null
    ]);
  };

  // src/components/Container/Error.js
  var Error = () => (state, actions2) => {
    return h("div", { style: { padding: "1em" } }, [
      h("span", null, "Woops. Enhanced GOG encountered an error. Try another region or "),
      h("a", {
        style: { textDecoration: "underline", cursor: "pointer" },
        onclick: () => actions2.getAllPriceData()
      }, "click here to try again.")
    ]);
  };

  // src/components/Container.js
  var Container = () => (state, actions2) => {
    return h("div", {
      oncreate: () => {
        actions2.readAndSetFromStorage();
        actions2.getAllPriceData();
      }
    }, [
      Divider(),
      h("div", { style: { paddingTop: "1.2em" } }, [
        state.currentLowest && state.historicalLow ? Notifications() : null,
        state.currentLowest || state.historicalLow || state.historicalLowGOG || state.bundles ? Stats() : state.error ? Error() : Spinner(),
        CountrySelect()
      ])
    ]);
  };

  // src/data/region_map.json
  var eu1 = { AL: { name: "Albania", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, AD: { name: "Andorra", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, AT: { name: "Austria", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, BE: { name: "Belgium", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, DK: { name: "Denmark", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, FI: { name: "Finland", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, FR: { name: "France", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, DE: { name: "Germany", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, IE: { name: "Ireland", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, LI: { name: "Liechtenstein", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, LU: { name: "Luxembourg", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, MK: { name: "Macedonia", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, NL: { name: "Netherlands", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, SE: { name: "Sweden", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, CH: { name: "Switzerland", region_code: "eu1", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } } };
  var eu2 = { BA: { name: "Bosnia And Herzegovina", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, BG: { name: "Bulgaria", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, HR: { name: "Croatia", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, CY: { name: "Cyprus", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, CZ: { name: "Czech Republic", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, EE: { name: "Estonia", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, GR: { name: "Greece", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, VA: { name: "Holy See (Vatican City State)", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, HU: { name: "Hungary", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, IT: { name: "Italy", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, LV: { name: "Latvia", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, LT: { name: "Lithuania", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, MT: { name: "Malta", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, MC: { name: "Monaco", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, ME: { name: "Montenegro", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, NO: { name: "Norway", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, PL: { name: "Poland", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, PT: { name: "Portugal", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, RO: { name: "Romania", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, SM: { name: "San Marino", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, RS: { name: "Serbia", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, SK: { name: "Slovakia", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, SI: { name: "Slovenia", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } }, ES: { name: "Spain", region_code: "eu2", currency: { code: "EUR", sign: "\u20AC", delimiter: ",", left: false, html: "&euro;" } } };
  var uk = { GB: { name: "United Kingdom", region_code: "uk", currency: { code: "GBP", sign: "\xA3", delimiter: ".", left: true, html: "&pound;" } } };
  var us = { US: { name: "United States", region_code: "us", currency: { code: "USD", sign: "$", delimiter: ".", left: true, html: "$" } } };
  var ca = { CA: { name: "Canada", region_code: "ca", currency: { code: "CAD", sign: "$", delimiter: ".", left: true, html: "$" } } };
  var br2 = { BR2: { name: "Brazil", region_code: "br2", currency: { code: "BRL", sign: "R$", delimiter: ".", left: true, html: "R$" } } };
  var au2 = { AU2: { name: "Australia", region_code: "au2", currency: { code: "AUD", sign: "$", delimiter: ".", left: true, html: "$" } } };
  var ru = { RU: { name: "Russian Federation", region_code: "ru", currency: { code: "RUB", sign: "\u0440\u0443\u0431", delimiter: ",", left: false, html: " p." } } };
  var tr = { TR: { name: "Turkey", region_code: "tr", currency: { code: "TRY", sign: "TL", delimiter: ",", left: false, html: " TL" } } };
  var cn = { CN: { name: "China", region_code: "cn", currency: { code: "CNY", sign: "\xA5", delimiter: ".", left: true, html: "&yen;" } } };
  var region_map_default = { eu1, eu2, uk, us, ca, br2, au2, ru, tr, cn };

  // src/index.js
  var createApp = (game_id, currentPrice, pageCurrency, container) => {
    const state = {
      game_id,
      currentPrice,
      pageCurrency,
      region_map: region_map_default,
      user_region: "us",
      user_country: "US",
      currentLowest: null,
      historicalLow: null,
      historicalLowGOG: null,
      bundles: null,
      cache: {},
      error: null
    };
    const view = (state2, actions2) => Container();
    app(state, actions, view, container);
  };
  var runUserScript = () => {
    console.log(`== Enhanced GOG ${config.VERSION} ==`);
    const product = unsafeWindow.productcardData;
    if (product !== void 0) {
      const game_id = product.cardProductId;
      const currentPrice = product.cardProduct.price.finalAmount;
      const pageCurrency = product.currency;
      const container = c("div", "enhanced-gog-container");
      q("div.product-actions").appendChild(container);
      createApp(game_id, currentPrice, pageCurrency, container);
    }
  };
  runUserScript();
})();
