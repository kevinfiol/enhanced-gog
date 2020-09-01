// ==UserScript==
// @name enhanced-gog
// @namespace https://github.com/kevinfiol/enhanced-gog
// @version 1.2.0
// @description Enhanced experience on GOG.com
// @license MIT; https://raw.githubusercontent.com/kevinfiol/enhanced-gog/master/LICENSE
// @include http://*.gog.com/game/*
// @include https://*.gog.com/game/*
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

(function () {
  'use strict';

  function h(name, attributes) {
    var arguments$1 = arguments;

    var rest = [];
    var children = [];
    var length = arguments.length;

    while (length-- > 2) { rest.push(arguments$1[length]); }

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

    return typeof name === "function"
      ? name(attributes || {}, children)
      : {
          nodeName: name,
          attributes: attributes || {},
          children: children,
          key: attributes && attributes.key
        }
  }

  function app(state, actions, view, container) {
    var map = [].map;
    var rootElement = (container && container.children[0]) || null;
    var oldNode = rootElement && recycleElement(rootElement);
    var lifecycle = [];
    var skipRender;
    var isRecycling = true;
    var globalState = clone(state);
    var wiredActions = wireStateToActions([], globalState, clone(actions));

    scheduleRender();

    return wiredActions

    function recycleElement(element) {
      return {
        nodeName: element.nodeName.toLowerCase(),
        attributes: {},
        children: map.call(element.childNodes, function(element) {
          return element.nodeType === 3 // Node.TEXT_NODE
            ? element.nodeValue
            : recycleElement(element)
        })
      }
    }

    function resolveNode(node) {
      return typeof node === "function"
        ? resolveNode(node(globalState, wiredActions))
        : node != null
          ? node
          : ""
    }

    function render() {
      skipRender = !skipRender;

      var node = resolveNode(view);

      if (container && !skipRender) {
        rootElement = patch(container, rootElement, oldNode, (oldNode = node));
      }

      isRecycling = false;

      while (lifecycle.length) { lifecycle.pop()(); }
    }

    function scheduleRender() {
      if (!skipRender) {
        skipRender = true;
        setTimeout(render);
      }
    }

    function clone(target, source) {
      var out = {};

      for (var i in target) { out[i] = target[i]; }
      for (var i in source) { out[i] = source[i]; }

      return out
    }

    function setPartialState(path, value, source) {
      var target = {};
      if (path.length) {
        target[path[0]] =
          path.length > 1
            ? setPartialState(path.slice(1), value, source[path[0]])
            : value;
        return clone(source, target)
      }
      return value
    }

    function getPartialState(path, source) {
      var i = 0;
      while (i < path.length) {
        source = source[path[i++]];
      }
      return source
    }

    function wireStateToActions(path, state, actions) {
      for (var key in actions) {
        typeof actions[key] === "function"
          ? (function(key, action) {
              actions[key] = function(data) {
                var result = action(data);

                if (typeof result === "function") {
                  result = result(getPartialState(path, globalState), actions);
                }

                if (
                  result &&
                  result !== (state = getPartialState(path, globalState)) &&
                  !result.then // !isPromise
                ) {
                  scheduleRender(
                    (globalState = setPartialState(
                      path,
                      clone(state, result),
                      globalState
                    ))
                  );
                }

                return result
              };
            })(key, actions[key])
          : wireStateToActions(
              path.concat(key),
              (state[key] = clone(state[key])),
              (actions[key] = clone(actions[key]))
            );
      }

      return actions
    }

    function getKey(node) {
      return node ? node.key : null
    }

    function eventListener(event) {
      return event.currentTarget.events[event.type](event)
    }

    function updateAttribute(element, name, value, oldValue, isSvg) {
      if (name === "key") ; else if (name === "style") {
        if (typeof value === "string") {
          element.style.cssText = value;
        } else {
          if (typeof oldValue === "string") { oldValue = element.style.cssText = ""; }
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
            if (!oldValue) { oldValue = element.events[name]; }
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
        } else if (
          name in element &&
          name !== "list" &&
          name !== "type" &&
          name !== "draggable" &&
          name !== "spellcheck" &&
          name !== "translate" &&
          !isSvg
        ) {
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
      var element =
        typeof node === "string" || typeof node === "number"
          ? document.createTextNode(node)
          : (isSvg = isSvg || node.nodeName === "svg")
            ? document.createElementNS(
                "http://www.w3.org/2000/svg",
                node.nodeName
              )
            : document.createElement(node.nodeName);

      var attributes = node.attributes;
      if (attributes) {
        if (attributes.oncreate) {
          lifecycle.push(function() {
            attributes.oncreate(element);
          });
        }

        for (var i = 0; i < node.children.length; i++) {
          element.appendChild(
            createElement(
              (node.children[i] = resolveNode(node.children[i])),
              isSvg
            )
          );
        }

        for (var name in attributes) {
          updateAttribute(element, name, attributes[name], null, isSvg);
        }
      }

      return element
    }

    function updateElement(element, oldAttributes, attributes, isSvg) {
      for (var name in clone(oldAttributes, attributes)) {
        if (
          attributes[name] !==
          (name === "value" || name === "checked"
            ? element[name]
            : oldAttributes[name])
        ) {
          updateAttribute(
            element,
            name,
            attributes[name],
            oldAttributes[name],
            isSvg
          );
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
      return element
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

    function patch(parent, element, oldNode, node, isSvg) {
      if (node === oldNode) ; else if (oldNode == null || oldNode.nodeName !== node.nodeName) {
        var newElement = createElement(node, isSvg);
        parent.insertBefore(newElement, element);

        if (oldNode != null) {
          removeElement(parent, element, oldNode);
        }

        element = newElement;
      } else if (oldNode.nodeName == null) {
        element.nodeValue = node;
      } else {
        updateElement(
          element,
          oldNode.attributes,
          node.attributes,
          (isSvg = isSvg || node.nodeName === "svg")
        );

        var oldKeyed = {};
        var newKeyed = {};
        var oldElements = [];
        var oldChildren = oldNode.children;
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
          var newKey = getKey((children[k] = resolveNode(children[k])));

          if (newKeyed[oldKey]) {
            i++;
            continue
          }

          if (newKey != null && newKey === getKey(oldChildren[i + 1])) {
            if (oldKey == null) {
              removeElement(element, oldElements[i], oldChildren[i]);
            }
            i++;
            continue
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
              patch(
                element,
                element.insertBefore(keyedNode[0], oldElements[i]),
                keyedNode[1],
                children[k],
                isSvg
              );
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
      return element
    }
  }

  var config = {
      VERSION: '1.2.0',
      BASE_URL: 'https://api.isthereanydeal.com',
      API_KEY: 'd047b30e0fc7d9118f3953de04fa6af9eba22379'
  };

  /**
   * DOM Methods
   */
  var q = function (query) { return document.querySelector(query); };

  var c = function (tag, className, innerHTML) {
      if ( innerHTML === void 0 ) innerHTML = '';

      var el = document.createElement(tag);
      el.className = className;
      el.innerHTML = innerHTML;
      return el;
  };

  var createPriceFormatter = function (sign, delimiter, left) {
      return function (price) {
          var delimited_price = price.replace('.', delimiter);
          return left ? ("" + sign + delimited_price) : ("" + delimited_price + sign);
      };
  };

  var capitalize = function (str) { return str.trim()[0].toUpperCase() + str.trim().slice(1); };

  var getDateStr = function (unixTime) {
      var date = new Date(unixTime * 1000);
      var month = date.getMonth() + 1;
      var day = date.getDate();
      var year = date.getFullYear();

      return (month + "/" + day + "/" + year);
  };

  var request = function (method, url, params) {
      var queryArr = Object.keys(params).map(function (key) {
          return ((encodeURIComponent(key)) + "=" + (encodeURIComponent(params[key])));
      });

      var queryStr = queryArr.join('&');

      return new Promise(function (resolve, reject) {
          if (window.GM_xmlhttpRequest) {
              var xhr = window.GM_xmlhttpRequest;

              xhr({
                  method: method,
                  url: (url + "?" + queryStr),
                  onload: function (res) {
                      if (res.status >= 200 && res.status < 300) {
                          resolve(res.responseText);
                      } else {
                          reject(res.statusText);
                      }
                  },
                  onerror: function (err) { return reject(err.statusText); }
              });
          } else {
              var xhr$1 = new XMLHttpRequest();
              xhr$1.open(method, (url + "?" + queryStr));
      
              xhr$1.onload = function () {
                  if (xhr$1.status >= 200 && xhr$1.status < 300) {
                      resolve(xhr$1.response);
                  } else {
                      reject(xhr$1.statusText);
                  }
              };
      
              xhr$1.onerror = function () { return reject(xhr$1.statusText); };
              xhr$1.send();
          }
      });
  };

  var util = /*#__PURE__*/Object.freeze({
    q: q,
    c: c,
    createPriceFormatter: createPriceFormatter,
    capitalize: capitalize,
    getDateStr: getDateStr,
    request: request
  });

  var capitalize$1 = util.capitalize;
  var getDateStr$1 = util.getDateStr;
  var request$1 = util.request;

  var IsThereAnyDeal = function (base_url, api_key) {
      var shop = 'gog';

      var template = function (version, iface, method) {
          return (base_url + "/" + version + "/" + iface + "/" + method + "/");
      };

      var parseResponse = function (res) {
          var key = Object.keys(res.data)[0];
          return res.data[key];
      }; 

      var getPlainId = function (game_id) {
          var endpoint = template('v02', 'game', 'plain');
          var data = { key: api_key, shop: shop, game_id: game_id };

          return request$1('GET', endpoint, data)
              .then(JSON.parse)
              .then(function (res) {
                  if (!res['.meta'].match || !res['.meta'].active) {
                      throw('Game Not Found.')
                  }

                  return res.data.plain;
              })
              .catch(function (err) {
                  throw(err);
              })
          ;
      };

      var getHistoricalLow = function (plain_id, shops, region, country) {
          if ( shops === void 0 ) shops = null;

          var endpoint = template('v01', 'game', 'lowest');
          var data = { key: api_key, plains: plain_id, region: region, country: country };
          if (shops) { data.shops = shops; }

          return request$1('GET', endpoint, data)
              .then(JSON.parse)
              .then(parseResponse)
              .then(function (res) {
                  if (!res.price) { return null; }

                  return {
                      date: getDateStr$1(res.added),
                      cut: res.cut,
                      price: res.price,
                      shop: res.shop,
                      urls: res.urls
                  };
              })
              .catch(function (err) {
                  throw(err);
              })
          ;
      };

      var getCurrentLowest = function (plain_id, region, country) {
          var endpoint = template('v01', 'game', 'prices');
          var data = { key: api_key, plains: plain_id, region: region, country: country };

          return request$1('GET', endpoint, data)
              .then(JSON.parse)
              .then(parseResponse)
              .then(function (res) {
                  if (!res.list.length) { return null; }

                  var lowest = res.list.reduce(function (a, x) {
                      a = a.price_new >= x.price_new ? x : a;
                      return a;
                  }, { price_new: Infinity });
                  
                  if (lowest.drm[0]) { lowest.drm[0] = capitalize$1(lowest.drm[0]); }
                  lowest.itad_url = res.urls.game;

                  return lowest;
              })
              .catch(function (err) {
                  throw(err);
              })
          ;
      };

      var getBundles = function (plain_id, region) {
          var endpoint = template('v01', 'game', 'bundles');
          var data = { key: api_key, plains: plain_id, region: region };

          return request$1('GET', endpoint, data)
              .then(JSON.parse)
              .then(parseResponse)
              .then(function (res) { return ({ total: res.total, urls: res.urls }); })
              .catch(function (err) {
                  throw(err);
              })
          ;
      };

      return {
          getPlainId: getPlainId,
          getHistoricalLow: getHistoricalLow,
          getCurrentLowest: getCurrentLowest,
          getBundles: getBundles
      };
  };

  var Storage = function () {
      var getValue = function (key) { return GM_getValue(key, null); };

      var setValue = function (key, value) { return GM_setValue(key, value); };

      var deleteValue = function (key) { return GM_deleteValue(key); };

      var listValues = function () { return GM_listValues(); };

      return { getValue: getValue, setValue: setValue, deleteValue: deleteValue, listValues: listValues };
  };

  /**
   * Dependencies
   */
  var itad = IsThereAnyDeal(config.BASE_URL, config.API_KEY);
  var storage = Storage();

  /**
   * Actions
   */
  var setError = function (error) { return function () { return ({
      error: error
  }); }; };

  var setStatsToNull = function () { return function (state) { return ({
      historicalLow: null,
      historicalLowGOG: null,
      currentLowest: null,
      bundles: null
  }); }; };

  var setHistoricalLow = function (historicalLow) { return function (state) { return ({
      historicalLow: historicalLow
  }); }; };

  var setHistoricalLowGOG = function (historicalLowGOG) { return function (state) { return ({
      historicalLowGOG: historicalLowGOG
  }); }; };

  var setCurrentLowest = function (currentLowest) { return function (state) { return ({
      currentLowest: currentLowest
  }); }; };

  var setBundles = function (bundles) { return function (state) { return ({
      bundles: bundles
  }); }; };

  var setUserRegion = function (user_region) { return function (state) { return ({
      user_region: user_region
  }); }; };

  var setUserCountry = function (user_country) { return function (state) { return ({
      user_country: user_country
  }); }; };

  var cacheResults = function (payload) { return function (state) {
      var obj;

      var newCache = Object.assign({}, state.cache);

      if (newCache[payload.region]) {
          newCache[payload.region][payload.country] = payload.results;
      } else {
          newCache[payload.region] = ( obj = {}, obj[payload.country] = payload.results, obj );
      }

      return { cache: newCache };
  }; };

  var readAndSetFromStorage = function () { return function (state, actions) {
      var user_region = storage.getValue('user_region');
      var user_country = storage.getValue('user_country');

      if (user_region && user_country) {
          actions.setUserRegion(user_region);
          actions.setUserCountry(user_country);
      } else {
          actions.persistToStorage({ key: 'user_region', value: state.user_region });
          actions.persistToStorage({ key: 'user_country', value: state.user_country });
      }
  }; };

  var persistToStorage = function (item) { return function () {
      storage.setValue(item.key, item.value);
  }; };

  var getAllPriceData = function () { return function (state, actions) {
      // Set all ITAD Stats
      var setStats = function (res) {
          actions.setHistoricalLow(res[0]);
          actions.setHistoricalLowGOG(res[1]);
          actions.setCurrentLowest(res[2]);
          actions.setBundles(res[3]);
      };

      actions.setError(null);

      if (state.cache[state.user_region] &&
          state.cache[state.user_region][state.user_country]
      ) {
          // Results exist in Cache
          setStats(state.cache[state.user_region][state.user_country]);
      } else {
          // Results do not exist in Cache
          // Retrieve from ITAD
          itad.getPlainId(state.game_id)
              .then(function (plain_id) {
                  return Promise.all([
                      itad.getHistoricalLow(plain_id, null, state.user_region, state.user_country),
                      itad.getHistoricalLow(plain_id, 'gog', state.user_region, state.user_country),
                      itad.getCurrentLowest(plain_id, state.user_region, state.user_country),
                      itad.getBundles(plain_id, state.user_region)
                  ]);
              })
              .then(function (res) {
                  setStats(res);

                  // Cache Results
                  actions.cacheResults({
                      region: state.user_region,
                      country: state.user_country,
                      results: res
                  });
              })
              .catch(function (err) {
                  actions.setError(err);
                  console.log(("== Enhanced GOG - Error has occured == " + err));
              })
          ;
      }
  }; };

  var actions = {
      setError: setError,
      getAllPriceData: getAllPriceData,
      setStatsToNull: setStatsToNull,
      setCurrentLowest: setCurrentLowest,
      setHistoricalLow: setHistoricalLow,
      setHistoricalLowGOG: setHistoricalLowGOG,
      setBundles: setBundles,
      setUserRegion: setUserRegion,
      setUserCountry: setUserCountry,
      readAndSetFromStorage: readAndSetFromStorage,
      persistToStorage: persistToStorage,
      cacheResults: cacheResults
  };

  var Divider = function () { return function () {
      return h('div', {
          style: {
              boxShadow: '0px 4px 6px -2px rgba(0, 0, 0, 0.25)',
              height: '14px',
              position: 'absolute',
              left: '0',
              // border: '1px solid transparent',
              width: '100%'
          }
      });
  }; };

  var Point = function (attrs, children) { return function () { return h('p', Object.assign({ class: '' }, attrs), children); }; };

  var Spinner = function () { return function () {
      return h('div', { style: { textAlign: 'center', width: '100%' } }, [
          Point({ style: { padding: '1.5em 0 0.3em 0' } }, [
              h('span', {
                  class: 'menu-friends-empty__spinner is-spinning'
              })
          ])
      ])
  }; };

  var Link = function (href, text) { return function () { return h('a', { style: { textDecoration: 'underline' }, href: href }, text); }; };

  var CurrentLowest = function () { return function (state) {
      var data = state.currentLowest;
      var currency = state.region_map[state.user_region][state.user_country].currency;
      var formatPrice = createPriceFormatter(currency.sign, currency.delimiter, currency.left);

      return Point({}, [
          h('b', {}, 'Current Lowest Price: '),
          ((formatPrice(data.price_new.toFixed(2))) + " at "),
          Link(data.url, data.shop.name),
          data.drm[0] ? (" (DRM: " + (data.drm[0]) + ") ") : ' ',
          '(', Link(data.itad_url, 'Info'), ')'
      ]);
  }; };

  var HistoricalLow = function () { return function (state) {
      var data = state.historicalLow;
      var currency = state.region_map[state.user_region][state.user_country].currency;
      var formatPrice = createPriceFormatter(currency.sign, currency.delimiter, currency.left);

      return Point({}, [
          h('b', {}, 'Historical Lowest Price: '),
          ((formatPrice(data.price.toFixed(2))) + " at " + (data.shop.name) + " on " + (data.date) + " "),
          '(', Link(data.urls.history, 'Info'), ')'
      ]);
  }; };

  var HistoricalLowGOG = function () { return function (state) {
      var data = state.historicalLowGOG;
      var currency = state.region_map[state.user_region][state.user_country].currency;
      var formatPrice = createPriceFormatter(currency.sign, currency.delimiter, currency.left);

      return Point({}, [
          h('b', {}, 'Historical Lowest Price on GOG: '),
          ((formatPrice(data.price.toFixed(2))) + " on " + (data.date) + " "),
          '(', Link(data.urls.history + '?shop[]=gog&generate=Select+Stores', 'Info'), ')'
      ]);
  }; };

  var Bundles = function () { return function (state) {
      var data = state.bundles;

      return Point({}, [
          h('b', {}, 'Number of times this game has been in a bundle: '),
          ((data.total) + " "),
          '(', Link(data.urls.bundles, 'Info'), ')'
      ]);
  }; };

  var Stats = function () { return function (state) {
      return h('div', { style: { fontSize: '13px', margin: '1em 0', lineHeight: '1.7em' } }, [
          state.currentLowest    ? CurrentLowest()    : null,
          state.historicalLow    ? HistoricalLow()    : null,
          state.historicalLowGOG ? HistoricalLowGOG() : null,
          state.bundles          ? Bundles()          : null
      ]);
  }; };

  var Group = function (region, children) { return function () { return h('optgroup', { label: region }, children); }; };
  var Option = function (code, name) { return function () { return h('option', { value: code }, name); }; };

  var CountrySelect = function () { return function (state, actions) {
      var region_map = state.region_map;
      var regions = Object.keys(region_map); // ['eu1', 'eu2', 'us', 'ca', ...]

      return h('div', { style: { margin: '1em 0 0 0', fontSize: '13px' } }, [
          Point({}, h('b', {}, 'Enhanced GOG Region')),
          Point({}, [
              h('select', {
                  style: { border: '1px solid #cecece', padding: '0.4em', margin: '0.5em 0 0 0', backgroundColor: '#f6f6f6' },

                  oncreate: function (el) {
                      el.value = (state.user_region) + "-" + (state.user_country);
                  },
      
                  onchange: function (ev) {
                      var ref = ev.target.value.split('-');
                      var new_region = ref[0];
                      var new_country = ref[1];
      
                      // Temporarily Set Stats to Null
                      actions.setStatsToNull();
      
                      // Persist Changes to Storage
                      actions.persistToStorage({ key: 'user_region', value: new_region });
                      actions.persistToStorage({ key: 'user_country', value: new_country });
      
                      // Update State
                      actions.setUserRegion(new_region);
                      actions.setUserCountry(new_country);
      
                      // Retrieve New Data
                      actions.getAllPriceData();
                  }
              }, [
                  regions.map(function (region) {
                      return Group(region, Object.keys(region_map[region]).map(function (country) {
                          return Option(region + '-' + country, region_map[region][country].name);
                      }));
                  })
              ])
          ])
      ]);
  }; };

  var Notifications = function () { return function (state, actions) {
      var histLow = state.historicalLow.price || null;
      var curLow = state.currentLowest.price_new || null;
      var user_currency = state.region_map[state.user_region][state.user_country].currency.code;
      
      if (// If price is neither Historical Low or Current Low
          !( (histLow && state.currentPrice <= histLow) || (curLow && state.currentPrice <= curLow) )
          // Or If Enhanced GOG's Currency does not match the Page's Currency
          || user_currency !== state.pageCurrency
      ) {
          // ...Do Not Render Anything
          return null;
      }

      // Else Render
      return h('div', {
          style: { margin: '0.8em 0', lineHeight: '1.5em' }
      }, [
          histLow && state.currentPrice <= histLow
              ? Point({}, [
                  h('i', { class: '' }, ''),
                  h('b', { style: { color: '#739c00' } }, '✓  HISTORICAL LOWEST PRICE.')
              ])
              : null
          ,

          curLow && state.currentPrice <= curLow
              ? Point({}, [
                  h('i', { class: '' }, ''),
                  h('b', { style: { color: '#739c00' } }, '✓  CURRENT LOWEST PRICE.')
              ])
              : null ]);
  }; };

  var Error = function () { return function (state, actions) {
      return h('div', { style: { padding: '1em' } }, [
          h('span', null, 'Woops. Enhanced GOG encountered an error. Try another region or '),
          h('a', {
              style: { textDecoration: 'underline', cursor: 'pointer'},
              onclick: function () { return actions.getAllPriceData(); }
          }, 'click here to try again.')
      ]);
  }; };

  var Container = function () { return function (state, actions) {
      return h('div', {
          oncreate: function () {
              // Read Storage for Country & Region
              actions.readAndSetFromStorage();

              // Retrieve Price Data
              actions.getAllPriceData();
          }
      }, [
          Divider(),

          h('div', { style: { paddingTop: '1.2em' } }, [
              state.currentLowest && state.historicalLow
                  ? Notifications()
                  : null
              ,

              state.currentLowest || state.historicalLow || state.historicalLowGOG || state.bundles
                  ? Stats()
                  : state.error
                      ? Error()
                      : Spinner()
              ,

              CountrySelect()
          ])
      ]);
  }; };

  var eu1 = {
  	AL: {
  		name: "Albania",
  		region_code: "eu1",
  		currency: {
  			code: "EUR",
  			sign: "€",
  			delimiter: ",",
  			left: false,
  			html: "&euro;"
  		}
  	},
  	AD: {
  		name: "Andorra",
  		region_code: "eu1",
  		currency: {
  			code: "EUR",
  			sign: "€",
  			delimiter: ",",
  			left: false,
  			html: "&euro;"
  		}
  	},
  	AT: {
  		name: "Austria",
  		region_code: "eu1",
  		currency: {
  			code: "EUR",
  			sign: "€",
  			delimiter: ",",
  			left: false,
  			html: "&euro;"
  		}
  	},
  	BE: {
  		name: "Belgium",
  		region_code: "eu1",
  		currency: {
  			code: "EUR",
  			sign: "€",
  			delimiter: ",",
  			left: false,
  			html: "&euro;"
  		}
  	},
  	DK: {
  		name: "Denmark",
  		region_code: "eu1",
  		currency: {
  			code: "EUR",
  			sign: "€",
  			delimiter: ",",
  			left: false,
  			html: "&euro;"
  		}
  	},
  	FI: {
  		name: "Finland",
  		region_code: "eu1",
  		currency: {
  			code: "EUR",
  			sign: "€",
  			delimiter: ",",
  			left: false,
  			html: "&euro;"
  		}
  	},
  	FR: {
  		name: "France",
  		region_code: "eu1",
  		currency: {
  			code: "EUR",
  			sign: "€",
  			delimiter: ",",
  			left: false,
  			html: "&euro;"
  		}
  	},
  	DE: {
  		name: "Germany",
  		region_code: "eu1",
  		currency: {
  			code: "EUR",
  			sign: "€",
  			delimiter: ",",
  			left: false,
  			html: "&euro;"
  		}
  	},
  	IE: {
  		name: "Ireland",
  		region_code: "eu1",
  		currency: {
  			code: "EUR",
  			sign: "€",
  			delimiter: ",",
  			left: false,
  			html: "&euro;"
  		}
  	},
  	LI: {
  		name: "Liechtenstein",
  		region_code: "eu1",
  		currency: {
  			code: "EUR",
  			sign: "€",
  			delimiter: ",",
  			left: false,
  			html: "&euro;"
  		}
  	},
  	LU: {
  		name: "Luxembourg",
  		region_code: "eu1",
  		currency: {
  			code: "EUR",
  			sign: "€",
  			delimiter: ",",
  			left: false,
  			html: "&euro;"
  		}
  	},
  	MK: {
  		name: "Macedonia",
  		region_code: "eu1",
  		currency: {
  			code: "EUR",
  			sign: "€",
  			delimiter: ",",
  			left: false,
  			html: "&euro;"
  		}
  	},
  	NL: {
  		name: "Netherlands",
  		region_code: "eu1",
  		currency: {
  			code: "EUR",
  			sign: "€",
  			delimiter: ",",
  			left: false,
  			html: "&euro;"
  		}
  	},
  	SE: {
  		name: "Sweden",
  		region_code: "eu1",
  		currency: {
  			code: "EUR",
  			sign: "€",
  			delimiter: ",",
  			left: false,
  			html: "&euro;"
  		}
  	},
  	CH: {
  		name: "Switzerland",
  		region_code: "eu1",
  		currency: {
  			code: "EUR",
  			sign: "€",
  			delimiter: ",",
  			left: false,
  			html: "&euro;"
  		}
  	}
  };
  var eu2 = {
  	BA: {
  		name: "Bosnia And Herzegovina",
  		region_code: "eu2",
  		currency: {
  			code: "EUR",
  			sign: "€",
  			delimiter: ",",
  			left: false,
  			html: "&euro;"
  		}
  	},
  	BG: {
  		name: "Bulgaria",
  		region_code: "eu2",
  		currency: {
  			code: "EUR",
  			sign: "€",
  			delimiter: ",",
  			left: false,
  			html: "&euro;"
  		}
  	},
  	HR: {
  		name: "Croatia",
  		region_code: "eu2",
  		currency: {
  			code: "EUR",
  			sign: "€",
  			delimiter: ",",
  			left: false,
  			html: "&euro;"
  		}
  	},
  	CY: {
  		name: "Cyprus",
  		region_code: "eu2",
  		currency: {
  			code: "EUR",
  			sign: "€",
  			delimiter: ",",
  			left: false,
  			html: "&euro;"
  		}
  	},
  	CZ: {
  		name: "Czech Republic",
  		region_code: "eu2",
  		currency: {
  			code: "EUR",
  			sign: "€",
  			delimiter: ",",
  			left: false,
  			html: "&euro;"
  		}
  	},
  	EE: {
  		name: "Estonia",
  		region_code: "eu2",
  		currency: {
  			code: "EUR",
  			sign: "€",
  			delimiter: ",",
  			left: false,
  			html: "&euro;"
  		}
  	},
  	GR: {
  		name: "Greece",
  		region_code: "eu2",
  		currency: {
  			code: "EUR",
  			sign: "€",
  			delimiter: ",",
  			left: false,
  			html: "&euro;"
  		}
  	},
  	VA: {
  		name: "Holy See (Vatican City State)",
  		region_code: "eu2",
  		currency: {
  			code: "EUR",
  			sign: "€",
  			delimiter: ",",
  			left: false,
  			html: "&euro;"
  		}
  	},
  	HU: {
  		name: "Hungary",
  		region_code: "eu2",
  		currency: {
  			code: "EUR",
  			sign: "€",
  			delimiter: ",",
  			left: false,
  			html: "&euro;"
  		}
  	},
  	IT: {
  		name: "Italy",
  		region_code: "eu2",
  		currency: {
  			code: "EUR",
  			sign: "€",
  			delimiter: ",",
  			left: false,
  			html: "&euro;"
  		}
  	},
  	LV: {
  		name: "Latvia",
  		region_code: "eu2",
  		currency: {
  			code: "EUR",
  			sign: "€",
  			delimiter: ",",
  			left: false,
  			html: "&euro;"
  		}
  	},
  	LT: {
  		name: "Lithuania",
  		region_code: "eu2",
  		currency: {
  			code: "EUR",
  			sign: "€",
  			delimiter: ",",
  			left: false,
  			html: "&euro;"
  		}
  	},
  	MT: {
  		name: "Malta",
  		region_code: "eu2",
  		currency: {
  			code: "EUR",
  			sign: "€",
  			delimiter: ",",
  			left: false,
  			html: "&euro;"
  		}
  	},
  	MC: {
  		name: "Monaco",
  		region_code: "eu2",
  		currency: {
  			code: "EUR",
  			sign: "€",
  			delimiter: ",",
  			left: false,
  			html: "&euro;"
  		}
  	},
  	ME: {
  		name: "Montenegro",
  		region_code: "eu2",
  		currency: {
  			code: "EUR",
  			sign: "€",
  			delimiter: ",",
  			left: false,
  			html: "&euro;"
  		}
  	},
  	NO: {
  		name: "Norway",
  		region_code: "eu2",
  		currency: {
  			code: "EUR",
  			sign: "€",
  			delimiter: ",",
  			left: false,
  			html: "&euro;"
  		}
  	},
  	PL: {
  		name: "Poland",
  		region_code: "eu2",
  		currency: {
  			code: "EUR",
  			sign: "€",
  			delimiter: ",",
  			left: false,
  			html: "&euro;"
  		}
  	},
  	PT: {
  		name: "Portugal",
  		region_code: "eu2",
  		currency: {
  			code: "EUR",
  			sign: "€",
  			delimiter: ",",
  			left: false,
  			html: "&euro;"
  		}
  	},
  	RO: {
  		name: "Romania",
  		region_code: "eu2",
  		currency: {
  			code: "EUR",
  			sign: "€",
  			delimiter: ",",
  			left: false,
  			html: "&euro;"
  		}
  	},
  	SM: {
  		name: "San Marino",
  		region_code: "eu2",
  		currency: {
  			code: "EUR",
  			sign: "€",
  			delimiter: ",",
  			left: false,
  			html: "&euro;"
  		}
  	},
  	RS: {
  		name: "Serbia",
  		region_code: "eu2",
  		currency: {
  			code: "EUR",
  			sign: "€",
  			delimiter: ",",
  			left: false,
  			html: "&euro;"
  		}
  	},
  	SK: {
  		name: "Slovakia",
  		region_code: "eu2",
  		currency: {
  			code: "EUR",
  			sign: "€",
  			delimiter: ",",
  			left: false,
  			html: "&euro;"
  		}
  	},
  	SI: {
  		name: "Slovenia",
  		region_code: "eu2",
  		currency: {
  			code: "EUR",
  			sign: "€",
  			delimiter: ",",
  			left: false,
  			html: "&euro;"
  		}
  	},
  	ES: {
  		name: "Spain",
  		region_code: "eu2",
  		currency: {
  			code: "EUR",
  			sign: "€",
  			delimiter: ",",
  			left: false,
  			html: "&euro;"
  		}
  	}
  };
  var uk = {
  	GB: {
  		name: "United Kingdom",
  		region_code: "uk",
  		currency: {
  			code: "GBP",
  			sign: "£",
  			delimiter: ".",
  			left: true,
  			html: "&pound;"
  		}
  	}
  };
  var us = {
  	US: {
  		name: "United States",
  		region_code: "us",
  		currency: {
  			code: "USD",
  			sign: "$",
  			delimiter: ".",
  			left: true,
  			html: "$"
  		}
  	}
  };
  var ca = {
  	CA: {
  		name: "Canada",
  		region_code: "ca",
  		currency: {
  			code: "CAD",
  			sign: "$",
  			delimiter: ".",
  			left: true,
  			html: "$"
  		}
  	}
  };
  var br2 = {
  	BR2: {
  		name: "Brazil",
  		region_code: "br2",
  		currency: {
  			code: "BRL",
  			sign: "R$",
  			delimiter: ".",
  			left: true,
  			html: "R$"
  		}
  	}
  };
  var au2 = {
  	AU2: {
  		name: "Australia",
  		region_code: "au2",
  		currency: {
  			code: "AUD",
  			sign: "$",
  			delimiter: ".",
  			left: true,
  			html: "$"
  		}
  	}
  };
  var ru = {
  	RU: {
  		name: "Russian Federation",
  		region_code: "ru",
  		currency: {
  			code: "RUB",
  			sign: "руб",
  			delimiter: ",",
  			left: false,
  			html: " p."
  		}
  	}
  };
  var tr = {
  	TR: {
  		name: "Turkey",
  		region_code: "tr",
  		currency: {
  			code: "TRY",
  			sign: "TL",
  			delimiter: ",",
  			left: false,
  			html: " TL"
  		}
  	}
  };
  var cn = {
  	CN: {
  		name: "China",
  		region_code: "cn",
  		currency: {
  			code: "CNY",
  			sign: "¥",
  			delimiter: ".",
  			left: true,
  			html: "&yen;"
  		}
  	}
  };
  var region_map = {
  	eu1: eu1,
  	eu2: eu2,
  	uk: uk,
  	us: us,
  	ca: ca,
  	br2: br2,
  	au2: au2,
  	ru: ru,
  	tr: tr,
  	cn: cn
  };

  var createApp = function (game_id, currentPrice, pageCurrency, container) {
      // Hyperapp State & Actions
      var state = {
          game_id: game_id,
          currentPrice: currentPrice,
          pageCurrency: pageCurrency,
          region_map: region_map,
          user_region: 'us',
          user_country: 'US',
          currentLowest: null,
          historicalLow: null,
          historicalLowGOG: null,
          bundles: null,
          cache: {},
          error: null
      };

      var view = function (state, actions$$1) { return Container(); };

      // Mount Hyperapp on Container
      app(state, actions, view, container);
  };

  /**
   * Retrieves Data & calls renderStats on a timeOut
   */
  var runUserScript = function () {
      console.log(("== Enhanced GOG " + (config.VERSION) + " =="));
      var product = unsafeWindow.productcardData;

      if (product !== undefined) {
          var game_id = product.cardProductId;
          var currentPrice = product.cardProduct.price.finalAmount;
          var pageCurrency = product.currency;

          var container = c('div', 'enhanced-gog-container');
          q('div.product-actions').appendChild(container);
          
          createApp(game_id, currentPrice, pageCurrency, container);
      }
  };

  runUserScript();

}());
