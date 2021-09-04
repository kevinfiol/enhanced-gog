import { capitalize, getDateStr, request } from '../util';

const IsThereAnyDeal = (base_url, api_key) => {
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

    const getHistoricalLow = (plain_id, shops = null, region, country) => {
        const endpoint = template('v01', 'game', 'lowest');
        const data = { key: api_key, plains: plain_id, region, country };
        if (shops) data.shops = shops;

        return request('GET', endpoint, data)
            .then(JSON.parse)
            .then(parseResponse)
            .then(res => {
                if (!res.price) return null;

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

    const getCurrentLowest = (plain_id, region, country) => {
        const endpoint = template('v01', 'game', 'prices');
        const data = { key: api_key, plains: plain_id, region, country };

        return request('GET', endpoint, data)
            .then(JSON.parse)
            .then(parseResponse)
            .then(res => {
                if (!res.list.length) return null;

                const lowest = res.list.reduce((a, x) => {
                    a = a.price_new >= x.price_new ? x : a;
                    return a;
                }, { price_new: Infinity })
                
                if (lowest.drm[0]) lowest.drm[0] = capitalize(lowest.drm[0]);
                lowest.itad_url = res.urls.game;

                return lowest;
            })
            .catch(err => {
                throw(err);
            })
        ;
    };

    const getBundles = (plain_id, region) => {
        const endpoint = template('v01', 'game', 'bundles');
        const data = { key: api_key, plains: plain_id, region };

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

export default IsThereAnyDeal;