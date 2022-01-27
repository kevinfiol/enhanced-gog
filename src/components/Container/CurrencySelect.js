import { h } from 'hyperapp';
import { Point } from '../Point';
import { q } from '../../util';

const Option = (currency) => () => h('option', { value: currency }, currency);

export const CurrencySelect = () => (state, actions) => {
    return h('div', { style: { margin: '1em 0 0 0', fontSize: '13px' } }, [
        Point({}, h('b', {}, 'Currency')),
        h('select', {
            style: {
                border: '1px solid #cecece',
                padding: '0.4em',
                margin: '0.5em 0 0 0',
                backgroundColor: '#f6f6f6'
            },

            oncreate: el => {
                el.value = `${state.user_currency}`;
            },

            onupdate: (el) => {
                el.value = state.user_currency;
            },

            onchange: ev => {
                const user_currency = ev.target.value;

                // Persist Changes to Storage
                actions.persistToStorage({ key: 'user_currency', value: user_currency });

                // Update State
                actions.setUserCurrency(user_currency);

                // side effect
                actions.updatePagePrice({ pageCurrency: state.pageCurrency, selectedCurrency: user_currency, priceData: state.priceData });
            }
        },
            Object.keys(state.priceData).map((currency) =>
                Option(currency)
            )
        )
    ]);
};