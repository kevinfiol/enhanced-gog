import { h } from 'hyperapp';
import { Divider } from 'components/Divider';
import { Spinner } from 'components/Spinner';
import { Stats } from 'components/Container/Stats';
import { CountrySelect } from 'components/Container/CountrySelect';
import { Notifications } from 'components/Container/Notifications';
import { Error } from 'components/Container/Error';

export const Container = () => (state, actions) => {
    return h('div', {
        oncreate: () => {
            // Read Storage for Country & Region
            actions.readAndSetFromStorage();

            // Retrieve Price Data
            actions.getAllPriceData();
        }
    }, [
        Divider(),

        h('div', { style: { paddingTop: '1.2em' } }, [
            state.currentLowest && state.historicalLow
                ? Notifications()
                : null
            ,

            state.currentLowest || state.historicalLow || state.historicalLowGOG || state.bundles
                ? Stats()
                : state.error
                    ? Error()
                    : Spinner()
            ,

            CountrySelect()
        ])
    ]);
};