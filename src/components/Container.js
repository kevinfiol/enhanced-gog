import { h } from 'hyperapp';
import { Divider } from './Divider';
import { Spinner } from './Spinner';
import { Stats } from './Container/Stats';
import { CountrySelect } from './Container/CountrySelect';
import { CurrencySelect } from './Container/CurrencySelect';
import { Notifications } from './Container/Notifications';
import { Error } from './Container/Error';

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

            h('div', {
                style: { display: 'flex' }
            }, [
                CountrySelect(),
                h('div', {}, ''),
                state.priceData &&
                    CurrencySelect()
                ,
            ])
        ])
    ]);
};