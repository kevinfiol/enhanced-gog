import { h } from 'hyperapp';
import { Point } from '../Point';

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
                el.value = `${state.gogCurrency}`;
            },

            onupdate: (el) => {
                el.value = state.gogCurrency;
            },

            onchange: ev => {
                const gogCurrency = ev.target.value;

                // Persist Changes to Storage
                actions.persistToStorage({ key: 'gogCurrency', value: gogCurrency });

                // Update State
                actions.setGOGCurrency(gogCurrency);

                // side effect
                actions.updatePagePrice({ pageCurrency: state.pageCurrency, gogCurrency, priceData: state.priceData });
            }
        },
            Object.keys(state.priceData).map((currency) =>
                Option(currency)
            )
        )
    ]);
};