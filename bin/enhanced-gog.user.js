// ==UserScript==
// @name enhanced-gog
// @namespace https://gitlab.com/kevinfiol/enhanced-gog
// @version 1.0.4
// @description Enhanced experience on GOG.com
// @license MIT; https://gitlab.com/kevinfiol/enhanced-gog/blob/master/LICENSE
// @include http://*.gog.com/game/*
// @include https://*.gog.com/game/*
// @icon https://images2.imgbox.com/82/de/Rz3uTP3A_o.png
// @updateURL https://gitlab.com/kevinfiol/enhanced-gog/raw/master/bin/enhanced-gog.user.js
// @downloadURL https://gitlab.com/kevinfiol/enhanced-gog/raw/master/bin/enhanced-gog.user.js
// @grant GM_xmlhttpRequest
// @grant GM.xmlHttpRequest

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
    VERSION: '1.0.4',
    BASE_URL: 'https://api.isthereanydeal.com',
    API_KEY: 'd047b30e0fc7d9118f3953de04fa6af9eba22379'
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
                    return null;
                }

                return res.data.plain;
            })
            .catch(function (err) {
                throw(err);
            })
        ;
    };

    var getHistoricalLow = function (plain_id, shops) {
        if ( shops === void 0 ) shops = null;

        var endpoint = template('v01', 'game', 'lowest');
        var data = { key: api_key, plains: plain_id };
        if (shops) { data.shops = shops; }

        return request$1('GET', endpoint, data)
            .then(JSON.parse)
            .then(parseResponse)
            .then(function (res) {
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

    var getCurrentLowest = function (plain_id) {
        var endpoint = template('v01', 'game', 'prices');
        var data = { key: api_key, plains: plain_id };

        return request$1('GET', endpoint, data)
            .then(JSON.parse)
            .then(parseResponse)
            .then(function (res) {
                var lowest = res.list.reduce(function (a, x) {
                    a = a.price_new >= x.price_new ? x : a;
                    return a;
                }, { price_new: Infinity });

                lowest.drm[0] = capitalize$1(lowest.drm[0]);
                lowest.itad_url = res.urls.game;

                return lowest;
            })
            .catch(function (err) {
                throw(err);
            })
        ;
    };

    var getBundles = function (plain_id) {
        var endpoint = template('v01', 'game', 'bundles');
        var data = { key: api_key, plains: plain_id };

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

/**
 * DOM Methods
 */
var q = function (query) { return document.querySelector(query); };
var c = function (tag, className) {
    var el = document.createElement(tag);
    el.className = className;
    return el;
};

/**
 * Dependencies
 */
var itad = IsThereAnyDeal(config.BASE_URL, config.API_KEY);

/**
 * renderStats Renders IsThereAnyDeal Statistics to the Page
 * @param {Object} stats Contains IsThereAnyDeal Statistics
 */
var renderStats = function (stats) {
    // Create and Append Container
    var egContainer = c('div', 'enhanced-gog-container module__foot');
    q('div.module.module--buy').appendChild(egContainer);

    var Point = function (children) { return h('p', { class: 'buy-footer-info-point' }, children); };
    var Link = function (href, text) { return h('a', { class: 'un', href: href }, text); };
    var InfoLink = function (href, text) { return ['(', Link(href, text), ')']; };

    var CurrentLowest = function (data) { return Point([
        h('b', {}, 'Current Lowest Price: '),
        ("$" + (data.price_new.toFixed(2)) + " at "),
        Link(data.url, data.shop.name),
        (" (DRM: " + (data.drm[0]) + ") "),
        InfoLink(data.itad_url, 'Info')
    ]); };

    var HistoricalLow = function (data) { return Point([
        h('b', {}, 'Historical Lowest Price: '),
        ("$" + (data.price.toFixed(2)) + " at " + (data.shop.name) + " on " + (data.date) + " "),
        InfoLink(data.urls.history, 'Info')
    ]); };

    var HistoricalLowGOG = function (data) { return Point([
        h('b', {}, 'Historical Lowest Price on GOG: '),
        ("$" + (data.price.toFixed(2)) + " on " + (data.date) + " "),
        InfoLink(data.urls.history, 'Info')
    ]); };

    var Bundles = function (data) { return Point([
        h('b', {}, 'Number of times this game has been in a bundle: '),
        ((data.total) + " "),
        InfoLink(data.urls.bundles, 'Info')
    ]); };

    var view = function () {
        return h('div', {}, [
            stats.currentLowest ? CurrentLowest(stats.currentLowest) : null,
            stats.historicalLow ? HistoricalLow(stats.historicalLow) : null,
            stats.historicalLowGOG ? HistoricalLowGOG(stats.historicalLowGOG) : null,
            stats.bundles ? Bundles(stats.bundles) : null
        ]);
    };

    // Mount Hyperapp on Container
    app({}, {}, view, egContainer);
};

/**
 * Retrieves Data & calls renderStats on a timeOut
 */
var runUserScript = function () {
    console.log(("== Enhanced GOG " + (config.VERSION) + " =="));

    setTimeout(function () {
        var game_id = q('div.product-row--has-card').getAttribute('gog-product');
    
        itad.getPlainId(game_id)
            .then(function (plain_id) {
                return Promise.all([
                    itad.getHistoricalLow(plain_id),
                    itad.getHistoricalLow(plain_id, 'gog'),
                    itad.getCurrentLowest(plain_id),
                    itad.getBundles(plain_id)
                ]);
            })
            .then(function (res) {
                renderStats({
                    historicalLow: res[0],
                    historicalLowGOG: res[1],
                    currentLowest: res[2],
                    bundles: res[3]
                });
            })
            .catch(function (err) {
                console.log(("Enhanced GOG - Error has occured: " + err));
            })
        ;
    }, 800);
};

/**
 * Check if DOM is ready
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runUserScript);
} else {
    runUserScript();
}
