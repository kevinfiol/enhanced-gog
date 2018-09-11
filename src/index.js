import 'annotations';
import 'polyfills';
import { h, app } from 'hyperapp';
import { config } from 'config';
import IsThereAnyDeal from 'services/IsThereAnyDeal';

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

/**
 * renderStats Renders IsThereAnyDeal Statistics to the Page
 * @param {Object} stats Contains IsThereAnyDeal Statistics
 */
const renderStats = stats => {
    // Create and Append Container
    const egContainer = c('div', 'enhanced-gog-container module__foot');
    q('div.module.module--buy').appendChild(egContainer);

    const Point = children => h('p', { class: 'buy-footer-info-point' }, children);
    const Link = (href, text) => h('a', { class: 'un', href: href }, text);
    const InfoLink = (href, text) => ['(', Link(href, text), ')'];

    const CurrentLowest = data => Point([
        h('b', {}, 'Current Lowest Price: '),
        `$${ data.price_new.toFixed(2) } at `,
        Link(data.url, data.shop.name),
        ` (DRM: ${ data.drm[0] }) `,
        InfoLink(data.itad_url, 'Info')
    ]);

    const HistoricalLow = data => Point([
        h('b', {}, 'Historical Lowest Price: '),
        `$${ data.price.toFixed(2) } at ${ data.shop.name } on ${ data.date } `,
        InfoLink(data.urls.history, 'Info')
    ]);

    const HistoricalLowGOG = data => Point([
        h('b', {}, 'Historical Lowest Price on GOG: '),
        `$${ data.price.toFixed(2) } on ${ data.date } `,
        InfoLink(data.urls.history, 'Info')
    ]);

    const Bundles = data => Point([
        h('b', {}, 'Number of times this game has been in a bundle: '),
        `${ data.total } `,
        InfoLink(data.urls.bundles, 'Info')
    ]);

    const view = () => {
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
const runUserScript = () => {
    console.log(`== Enhanced GOG ${ config.VERSION } ==`);

    setTimeout(() => {
        const game_id = q('div.product-row--has-card').getAttribute('gog-product');
    
        itad.getPlainId(game_id)
            .then(plain_id => {
                return Promise.all([
                    itad.getHistoricalLow(plain_id),
                    itad.getHistoricalLow(plain_id, 'gog'),
                    itad.getCurrentLowest(plain_id),
                    itad.getBundles(plain_id)
                ]);
            })
            .then(res => {
                renderStats({
                    historicalLow: res[0],
                    historicalLowGOG: res[1],
                    currentLowest: res[2],
                    bundles: res[3]
                })
            })
            .catch(err => {
                console.log(`Enhanced GOG - Error has occured: ${ err }`);
            })
        ;
    }, 800);
};

/**
 * Check if DOM is ready
 */
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', runUserScript);
else runUserScript();