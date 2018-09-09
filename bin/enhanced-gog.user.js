// ==UserScript==
// @name enhanced-gog
// @description Enhanced experience on GOG.com
// @include       http://*.gog.com/game/*
// @include       https://*.gog.com/game/*
// @grant GM_xmlhttpRequest
// @grant GM.xmlHttpRequest

/**
 * Polyfills <= IE9
 */

(function() {
    /**
     * Array/findIndex
     * https://tc39.github.io/ecma262/#sec-array.prototype.findIndex
     */
    if (!Array.prototype.findIndex) {
        Object.defineProperty(Array.prototype, 'findIndex', {
            value: function(predicate) {
                if (this == null) {
                    throw new TypeError('"this" is null or not defined');
                }

                var o = Object(this);
                var len = o.length >>> 0;

                if (typeof predicate !== 'function') {
                    throw new TypeError('predicate must be a function');
                }

                var thisArg = arguments[1];
                var k = 0;

                while (k < len) {
                    var kValue = o[k];
                    if (predicate.call(thisArg, kValue, k, o)) {
                        return k;
                    }
    
                    k++;
                }

                return -1;
            },

            configurable: true,
            writable: true
        });
    }

    /**
     * Array/includes
     * https://tc39.github.io/ecma262/#sec-array.prototype.includes
     */
    if (!Array.prototype.includes) {
        Object.defineProperty(Array.prototype, 'includes', {
            value: function(searchElement, fromIndex) {
                if (this == null) {
                    throw new TypeError('"this" is null or not defined');
                }

                var o = Object(this);
                var len = o.length >>> 0;

                if (len === 0) {
                    return false;
                }

                var n = fromIndex | 0;
                var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

                function sameValueZero(x, y) {
                    return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
                }

                while (k < len) {
                    if (sameValueZero(o[k], searchElement)) {
                        return true;
                    }

                    k++;
                }

                return false;
            }
        });
    }
})();

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
    request: request
});

var request$1 = util.request;

var IsThereAnyDeal = function (base_url, api_key) {
    var shop = 'gog';

    var template = function (version, iface, method) {
        return (base_url + "/" + version + "/" + iface + "/" + method + "/");
    };

    var getPlain = function (game_id) {
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
        ;
    };

    var getHistoricalLow = function (plain_id) {
        var endpoint = template('v01', 'game', 'lowest');
        var data = { key: api_key, plains: plain_id };

        return request$1('GET', endpoint, data).then(JSON.parse);
    };

    return { getPlain: getPlain, getHistoricalLow: getHistoricalLow };
};

var config = {
    BASE_URL: 'https://api.isthereanydeal.com',
    API_KEY: 'd047b30e0fc7d9118f3953de04fa6af9eba22379'
};

var p = function (x) { return console.log(x); };

/**
 * DOM Methods
 */
var q = function (query) { return document.querySelector(query); };

/**
 * Dependencies
 */
var itad = IsThereAnyDeal(config.BASE_URL, config.API_KEY);

setTimeout(function () {
    var game_id = q('div.product-row--has-card').getAttribute('gog-product');

    itad.getPlain(game_id)
        .then(itad.getHistoricalLow)
        .then(p)
    ;
}, 1000);
