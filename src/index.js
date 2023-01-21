import { m, mount, redraw } from 'umai';
import { VERSION } from './config';
import { State, Actions } from './state';
import { Divider, Notifications, Stats, Error, Spinner, CountrySelect } from './components';
import { retrieveUserSettings, persistUserSettings } from './storage';
import { getPriceData } from './itad';

const App = ({ state, actions }) => (
  m('div',
    Divider(),

    m('div', { style: 'padding-top: 1.2em;' },
      state.currentLowest && state.historicalLow &&
        Notifications({ state })
      ,

      state.currentLowest || state.historicalLow || state.historicalLowGOG || state.bundles
        ? Stats({ state })
        : state.error
          ? Error({ actions })
          : Spinner()
      ,

      CountrySelect({ state, actions })
    )
  )
);

// get product data from window object
const product = unsafeWindow.productcardData;

if (product && typeof product === 'object') {
  // log userscript version
  console.log(`== Enhanced GOG ${ VERSION } ==`);

  // create state
  const state = State({
    gameId: product.cardProductId,
    currentPrice: product.cardProduct.price.finalAmount,
    pageCurrency: product.currency
  });

  const actions = Actions(state);

  // read from storage and update state if necessary
  const { userRegion, userCountry } = retrieveUserSettings();

  if (userRegion && userCountry) {
    actions.set('userRegion', userRegion);
    actions.set('userCountry', userCountry);
  } else {
    // save defaults to storage
    persistUserSettings({
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
  getPriceData(state.gameId, userRegion, userCountry)
    .then(([priceData, error]) => {
      if (error) throw error;

      for (let key in priceData) {
        // keys from priceData should match with state keys
        actions.set(key, priceData[key]);
      }
    })
    .catch((e) => {
      console.error('Enhanced GOG Failed to initialize.');
      console.error(e);
    })
    .finally(redraw); // redraw app
}
