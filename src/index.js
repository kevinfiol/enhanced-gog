import { m, mount, redraw } from 'umhi';
import { VERSION } from './config';
import { State, Actions } from './state';
import { Divider, Notifications, Stats, Error, Spinner, CountrySelect } from './components';
import { retrieveUserSettings, persistUserSettings } from './storage';
import { getPriceData } from './itad';

const App = ({ state, actions }) => {
  const isLoading = !(
    state.currentLowest ||
    state.historicalLow ||
    state.historicalLowGOG ||
    state.totalBundles ||
    state.currentBundles
  );

  const showContent = !isLoading && !state.error;

  return (
    m('div',
      Divider(),

      m('div', { style: { padding: '1.2em 24px' } },
        showContent &&
          Notifications({ state })
        ,

        state.error
          ? Error({ state, actions })
          : isLoading
          ? Spinner()
          : null
        ,

        m('div', {
          style: {
            display: 'grid',
            gridTemplateRows: state.collapsed ? '0fr' : '1fr',
            transition: 'grid-template-rows 0.3s ease'
          }
        },
          m('div', {
            style: { overflow: 'hidden' }
          },
            showContent &&
              Stats({ state })
            ,

            CountrySelect({ state, actions })
          ),
        ),

        m('div', { style: { textAlign: 'center' } },
          m('button', {
            style: {
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
              border: '1px solid rgba(100, 100, 100, 0.2)',
              padding: '0.5em'
            },
            onclick: () => {
              const collapsed = !state.collapsed;
              actions.set({ collapsed });
              persistUserSettings({ collapsed });
            }
          }, state.collapsed ? 'Show Enhanced GOG ▴' : 'Hide ▾')
        )
      )
    )
  );
};

// get product data from window object
const product = unsafeWindow.productcardData;

if (product && typeof product === 'object') {
  // log userscript version
  console.log(`== Enhanced GOG ${ VERSION } ==`);

  // create state
  const state = State({
    gameTitle: product.cardProduct.title,
    currentPrice: Number(product.cardProduct.price.finalAmount),
    pageCurrency: product.currency
  });

  const actions = Actions(state);

  // read from storage and update state if necessary
  const { collapsed, userRegion, userCountry } = retrieveUserSettings();

  if (collapsed != null && userRegion && userCountry) {
    actions.set({ collapsed, userRegion, userCountry });
  } else {
    // save defaults to storage
    persistUserSettings({
      collapsed: state.collapsed,
      userRegion: state.userRegion,
      userCountry: state.userCountry
    });
  }

  // create container div
  const container = document.createElement('div');
  container.className = 'enhanced-gog-container';

  // mount application
  document.querySelector('div.product-actions').appendChild(container);
  mount(container, () => App({ state, actions }));

  // fetch price data
  getPriceData(state.gameTitle, state.userCountry)
    .then(([priceData, error]) => {
      if (error) throw error;
      actions.set(priceData);
    })
    .catch((error) => {
      console.error('Enhanced GOG Failed to initialize.');
      console.error(error);
      actions.set({ error });
    })
    .finally(redraw); // redraw app
}
