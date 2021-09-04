import { h } from 'hyperapp';
import { q, c } from '../../util';
import { Point } from '../Point';

export const Notifications = () => (state, actions) => {
    const histLow = state.historicalLow.price || null;
    const curLow = state.currentLowest.price_new || null;
    const user_currency = state.region_map[state.user_region][state.user_country].currency.code;
    
    if (// If price is neither Historical Low or Current Low
        !( (histLow && state.currentPrice <= histLow) || (curLow && state.currentPrice <= curLow) )
        // Or If Enhanced GOG's Currency does not match the Page's Currency
        || user_currency !== state.pageCurrency
    ) {
        // ...Do Not Render Anything
        return null;
    }

    // Else Render
    return h('div', {
        style: { margin: '0.8em 0', lineHeight: '1.5em' }
    }, [
        histLow && state.currentPrice <= histLow
            ? Point({}, [
                h('i', { class: '' }, ''),
                h('b', { style: { color: '#739c00' } }, '✓  HISTORICAL LOWEST PRICE.')
            ])
            : null
        ,

        curLow && state.currentPrice <= curLow
            ? Point({}, [
                h('i', { class: '' }, ''),
                h('b', { style: { color: '#739c00' } }, '✓  CURRENT LOWEST PRICE.')
            ])
            : null
        ,
    ]);
};