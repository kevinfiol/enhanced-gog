import 'annotations';
import 'polyfills';
import IsThereAnyDeal from 'services/IsThereAnyDeal';
import { config } from 'config';

const p = x => console.log(x);

/**
 * DOM Methods
 */
const q = query => document.querySelector(query);
const c = (tag, className) => {
    const el = document.createElement(tag);
    el.className = className;
    return el;
};

/**
 * Dependencies
 */
const itad = IsThereAnyDeal(config.BASE_URL, config.API_KEY);

setTimeout(() => {
    const game_id = q('div.product-row--has-card').getAttribute('gog-product');

    itad.getPlain(game_id)
        .then(itad.getHistoricalLow)
        .then(p)
    ;
}, 1000);