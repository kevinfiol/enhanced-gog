import { request } from '../util';

const PriceService = {
    getPrices(product_id, country_code) {
        const endpoint = `https://api.gog.com/products/${product_id}/prices`;
        return request('GET', endpoint, { countryCode: country_code })
            .then(JSON.parse);
    }
};

export default PriceService;