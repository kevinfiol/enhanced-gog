import { h } from 'hyperapp';
import { Spinner } from 'components/Spinner';
import { Stats } from 'components/Container/Stats';
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
        state.currentLowest && state.historicalLow
            ? Notifications()
            : null
        ,

        state.currentLowest || state.historicalLow || state.historicalLowGOG || state.bundles
            ? Stats()
            : Spinner()
        ,

        state.currentLowest || state.historicalLow || state.historicalLowGOG || state.bundles
            ? CountrySelect()
            : null
        ,
    ]);
};