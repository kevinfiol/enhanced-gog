import { h } from 'hyperapp';
import { Spinner } from 'components/Spinner';
import { CurrentLowest } from 'components/Container/CurrentLowest';
import { HistoricalLow } from 'components/Container/HistoricalLow';
import { HistoricalLowGOG } from 'components/Container/HistoricalLowGOG';
import { Bundles } from 'components/Container/Bundles';
import { CountrySelect } from 'components/Container/CountrySelect';
import { Notifications } from 'components/Container/Notifications';

export const Container = () => (state, actions) => {
    return h('div', {
        oncreate: () => {
            // Read Storage for Country & Region
            actions.readAndSetFromStorage();

            // Retrieve Price Data
            actions.getAllPriceData();
        }
    }, [
        // state.currentLowest && state.historicalLow
        //     ? h('div', { class: 'module__foot' }, Notifications())
        //     : null
        // ,

        h('div', { class: 'module__foot' }, [
            state.currentLowest || state.historicalLow || state.historicalLowGOG || state.bundles
                ? [
                    state.currentLowest    ? CurrentLowest()    : null,
                    state.historicalLow    ? HistoricalLow()    : null,
                    state.historicalLowGOG ? HistoricalLowGOG() : null,
                    state.bundles          ? Bundles()          : null
                ]
                : Spinner()
            ,
        ]),

        state.currentLowest || state.historicalLow || state.historicalLowGOG || state.bundles
            ? h('div', { class: 'module__foot' }, CountrySelect())
            : null
        ,
    ]);
};