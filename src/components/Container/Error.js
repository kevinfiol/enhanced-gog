import { h } from 'hyperapp';

export const Error = () => (state, actions) => {
    return h('div', { style: { padding: '1em' } }, [
        h('span', null, 'Woops. Enhanced GOG encountered an error. Try another region or '),
        h('a', {
            style: { textDecoration: 'underline', cursor: 'pointer'},
            onclick: () => actions.getAllPriceData()
        }, 'click here to try again.')
    ]);
};