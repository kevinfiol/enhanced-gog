const capitalize = require('../util').capitalize;
const getDateStr = require('../util').getDateStr;
const request = require('../util').request;

module.exports = (base_url, api_key) => {
    const shop = 'gog';

    const template = (version, iface, method) => {
        return `${base_url}/${version}/${iface}/${method}/`;
    };

    const parseResponse = res => {
        const key = Object.keys(res.data)[0];
        return res.data[key];
    }; 

    const getPlainId = game_id => {
        const endpoint = template('v02', 'game', 'plain');
        const data = { key: api_key, shop: shop, game_id: game_id };

        return request('GET', endpoint, data)
            .then(JSON.parse)
            .then(res => {
                if (!res['.meta'].match || !res['.meta'].active) {
                    throw('Game Not Found.')
                }

                return res.data.plain;
            })
            .catch(err => {
                throw(err);
            })
        ;
    };

    const getHistoricalLow = (plain_id, shops = null) => {
        const endpoint = template('v01', 'game', 'lowest');
        const data = { key: api_key, plains: plain_id };
        if (shops) data.shops = shops;

        return request('GET', endpoint, data)
            .then(JSON.parse)
            .then(parseResponse)
            .then(res => {
                return {
                    date: getDateStr(res.added),
                    cut: res.cut,
                    price: res.price,
                    shop: res.shop,
                    urls: res.urls
                };
            })
            .catch(err => {
                throw(err);
            })
        ;
    };

    const getCurrentLowest = plain_id => {
        const endpoint = template('v01', 'game', 'prices');
        const data = { key: api_key, plains: plain_id };

        return request('GET', endpoint, data)
            .then(JSON.parse)
            .then(parseResponse)
            .then(res => {
                const lowest = res.list.reduce((a, x) => {
                    a = a.price_new >= x.price_new ? x : a;
                    return a;
                }, { price_new: Infinity })

                lowest.drm[0] = capitalize(lowest.drm[0]);
                lowest.itad_url = res.urls.game;

                return lowest;
            })
            .catch(err => {
                throw(err);
            })
        ;
    };

    const getBundles = plain_id => {
        const endpoint = template('v01', 'game', 'bundles');
        const data = { key: api_key, plains: plain_id };

        return request('GET', endpoint, data)
            .then(JSON.parse)
            .then(parseResponse)
            .then(res => ({ total: res.total, urls: res.urls }))
            .catch(err => {
                throw(err);
            })
        ;
    };

    return {
        getPlainId,
        getHistoricalLow,
        getCurrentLowest,
        getBundles
    };
};