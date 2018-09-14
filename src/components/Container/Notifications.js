import { h } from 'hyperapp';
import { q, c } from 'util';
import { Point } from 'components/Point';

export const Notifications = () => (state, actions) => {
    let currentPrice = parseFloat( q('meta[itemprop="price"]').getAttribute('content') );
    let pageCurrency = q('meta[itemprop="priceCurrency"]').getAttribute('content');

    const histLow = state.historicalLow.price || null;
    const curLow = state.currentLowest.price_new || null;
    const user_currency = state.region_map[state.user_region][state.user_country].currency.code;
    
    if (// If price is neither Historical Low or Current Low
        !( (histLow && currentPrice <= histLow) || (curLow && currentPrice <= curLow) )
        // Or If Enhanced GOG's Currency does not match the Page's Currency
        || user_currency !== pageCurrency
    ) {
        // ...Do Not Render Anything
        return null;
    }

    // Else Render
    return h('div', {
        class: 'module__foot',
        style: { borderTop: '0', paddingTop: '0' }
    }, [
        histLow && currentPrice <= histLow
            ? Point({}, [
                h('i', { class: 'ic icon-tick' }, ''),
                h('b', { style: { color: '#739c00' } }, 'HISTORICAL LOWEST PRICE.')
            ])
            : null
        ,

        curLow && currentPrice <= curLow
            ? Point({}, [
                h('i', { class: 'ic icon-tick' }, ''),
                h('b', { style: { color: '#739c00' } }, 'CURRENT LOWEST PRICE.')
            ])
            : null
        ,
    ]);
};