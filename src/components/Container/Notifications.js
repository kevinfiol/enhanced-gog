import { h } from 'hyperapp';
import { q, c } from 'util';
import { Point } from 'components/Point';

export const Notifications = () => (state, actions) => {
    let currentPrice = null;

    return h('div', {
        oncreate: () => {
            currentPrice = q('meta[itemprop="price"]').getAttribute('content');
            console.log(state.currentLowest);
        }
    }, [
        state.historicalLow.price && currentPrice <= state.historicalLow.price
            ? Point({}, [
                h('i', { class: 'ic icon-tick' }, ''),
                h('b', { style: { color: '#739c00' } }, 'HISTORICAL LOWEST PRICE.')
            ])
            : null
        ,

        state.currentLowest.price_new && currentPrice <= state.currentLowest.price_new
            ? Point({}, [
                h('i', { class: 'ic icon-tick' }, ''),
                h('b', { style: { color: '#739c00' } }, 'CURRENT LOWEST PRICE.')
            ])
            : null
        ,
    ])
};