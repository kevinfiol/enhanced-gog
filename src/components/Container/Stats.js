import { h } from 'hyperapp';
import { CurrentLowest } from 'components/Container/Stats/CurrentLowest';
import { HistoricalLow } from 'components/Container/Stats/HistoricalLow';
import { HistoricalLowGOG } from 'components/Container/Stats/HistoricalLowGOG';
import { Bundles } from 'components/Container/Stats/Bundles';

export const Stats = () => (state, actions) => {
    return h('div', { class: 'module__foot' }, [
        state.currentLowest    ? CurrentLowest()    : null,
        state.historicalLow    ? HistoricalLow()    : null,
        state.historicalLowGOG ? HistoricalLowGOG() : null,
        state.bundles          ? Bundles()          : null
    ]);
};