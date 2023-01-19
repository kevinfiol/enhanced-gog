import { m, mount } from 'umai';
import { VERSION } from './config';
import { State, Actions } from './state';
import { Divider } from './components';

console.log(`== Enhanced GOG ${ VERSION } ==`);

const App = ({ state, actions }) => (
  m('div',
    Divider(),
    m('div', { style: 'padding-top: 1.2em;' },
      state.currentLowest && state.historicalLow &&
        m('p', 'notifications')
      ,

      state.currentLowest || state.historicalLow || state.historicalLowGOG || state.bundles
        ? m('p', 'stats')
        : state.error ? m('p', 'error') : m('p', 'spinner')
      ,

      m('p', 'country select')
    )
  )
);

// get vars from window
const product = unsafeWindow.productcardData;

if (product && typeof product === 'object') {
  // create state
  const state = State({
    gameId: product.cardProductId,
    currentPrice: product.cardProduct.price.finalAmount,
    pageCurrency: product.currency
  });

  const actions = Actions(state);

  // create container div
  const container = document.createElement('div');
  container.className = 'enhanced-gog-container';

  document.querySelector('div.product-actions').appendChild(container);
  mount(container, () => App({ state, actions }));
}