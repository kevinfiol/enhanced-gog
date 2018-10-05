import { h } from 'hyperapp';
import { CurrentLowest } from 'components/Container/Stats/CurrentLowest';
import { HistoricalLow } from 'components/Container/Stats/HistoricalLow';
import { HistoricalLowGOG } from 'components/Container/Stats/HistoricalLowGOG';
import { Bundles } from 'components/Container/Stats/Bundles';

export const Stats = () => (state, actions) => {
    return h('div', { style: { fontSize: '13px', margin: '1em 0', lineHeight: '1.7em' } }, [
        state.currentLowest    ? CurrentLowest()    : null,
        state.historicalLow    ? HistoricalLow()    : null,
        state.historicalLowGOG ? HistoricalLowGOG() : null,
        state.bundles          ? Bundles()          : null
    ]);
};