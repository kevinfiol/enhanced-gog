import { h, app } from 'hyperapp';
import { config } from './config';
import { q, c, style } from './util';
import { actions } from './actions/index';
import { Container } from './components/Container';
import region_map from './data/region_map.json';

const createApp = (game_id, currentPrice, pageCurrency, container) => {
    // Hyperapp State & Actions
    const state = {
        game_id,
        currentPrice,
        pageCurrency,
        region_map,
        user_region: 'us',
        user_country: 'US',
        user_currency: 'USD',
        currentLowest: null,
        priceData: null,
        historicalLow: null,
        historicalLowGOG: null,
        bundles: null,
        cache: {},
        error: null
    };

    const view = (state, actions) => Container();

    // Mount Hyperapp on Container
    app(state, actions, view, container);
};

/**
 * Retrieves Data & calls renderStats on a timeOut
 */
const runUserScript = () => {
    console.log(`== Enhanced GOG ${ config.VERSION } ==`);
    const product = unsafeWindow.productcardData;

    if (product !== undefined) {
        const game_id = product.cardProductId;
        const currentPrice = product.cardProduct.price.finalAmount;
        const pageCurrency = product.currency;

        const container = c('div', 'enhanced-gog-container');
        q('div.product-actions').appendChild(container);

        const priceContainer = c('span', 'enhanced-gog-price');
        style(priceContainer, {
            fontSize: '0.5em',
            color: 'rgb(136, 128, 128)',
            margin: '0 0.2rem'
        });

        q('.product-actions-price__final-amount').appendChild(priceContainer);

        createApp(game_id, currentPrice, pageCurrency, container);
    }
};

runUserScript();