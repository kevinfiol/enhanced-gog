const request = require('../util').request;

module.exports = (base_url, api_key) => {
    const shop = 'gog';

    const template = (version, iface, method) => {
        return `${base_url}/${version}/${iface}/${method}/`;
    };

    const getPlain = game_id => {
        const endpoint = template('v02', 'game', 'plain');
        const data = { key: api_key, shop: shop, game_id: game_id };

        return request('GET', endpoint, data)
            .then(JSON.parse)
            .then(res => {
                if (!res['.meta'].match || !res['.meta'].active) {
                    return null;
                }

                return res.data.plain;
            })
        ;
    };

    const getHistoricalLow = plain_id => {
        const endpoint = template('v01', 'game', 'lowest');
        const data = { key: api_key, plains: plain_id };

        return request('GET', endpoint, data).then(JSON.parse);
    };

    return { getPlain, getHistoricalLow };
};