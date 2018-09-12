import { h } from 'hyperapp';
import { CurrentLowest } from 'components/Container/CurrentLowest';
import { HistoricalLow } from 'components/Container/HistoricalLow';
import { HistoricalLowGOG } from 'components/Container/HistoricalLowGOG';
import { Bundles } from 'components/Container/Bundles';
import { CountrySelect } from 'components/Container/CountrySelect';

export const Container = () => (state, actions) => {
    return h('div', {
        oncreate: () => actions.getAllPriceData()
    }, [
        state.currentLowest ? CurrentLowest() : null,
        state.historicalLow ? HistoricalLow() : null,
        state.historicalLowGOG ? HistoricalLowGOG() : null,
        state.bundles ? Bundles() : null,

        !state.currentLowest && !state.historicalLow && !state.historicalLowGOG && !state.bundles
            ? h('p', {}, 'loading')
            : CountrySelect()
        ,
    ]);
};