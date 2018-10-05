import { h, app } from 'hyperapp';
import { config } from 'config';
import { q, c } from 'util';
import { actions } from 'actions/index';
import { Container } from 'components/Container';
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
        currentLowest: null,
        historicalLow: null,
        historicalLowGOG: null,
        bundles: null,
        cache: {}
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
        
        createApp(game_id, currentPrice, pageCurrency, container);
    }
};

runUserScript();