import { h, app } from 'hyperapp';
import { config } from 'config';
import { q, c } from 'util';
import { actions } from 'actions/index';
import { Container } from 'components/Container';
import region_map from './data/region_map.json';

const createApp = (game_id, container) => {
    // Hyperapp State & Actions
    const state = {
        game_id,
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

    setTimeout(() => {
        // Get GOG Game ID from page
        const game_id = q('div.product-row--has-card').getAttribute('gog-product');

        // Create and Append Container
        const container = c('div', 'enhanced-gog-container');
        q('header.module__top').insertAdjacentElement('afterend', container);

        createApp(game_id, container);
    }, 250);
};

/**
 * Check if DOM is ready
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runUserScript);
} else {
    runUserScript();
}