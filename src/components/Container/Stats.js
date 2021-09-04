import { h } from 'hyperapp';
import { CurrentLowest } from './Stats/CurrentLowest';
import { HistoricalLow } from './Stats/HistoricalLow';
import { HistoricalLowGOG } from './Stats/HistoricalLowGOG';
import { Bundles } from './Stats/Bundles';

export const Stats = () => (state) => {
    return h('div', { style: { fontSize: '13px', margin: '1em 0', lineHeight: '1.7em' } }, [
        state.currentLowest    ? CurrentLowest()    : null,
        state.historicalLow    ? HistoricalLow()    : null,
        state.historicalLowGOG ? HistoricalLowGOG() : null,
        state.bundles          ? Bundles()          : null
    ]);
};