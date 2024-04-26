export const State = (init = {}) => ({
  collapsed: false,
  gameTitle: undefined,
  itadSlug: undefined,
  productId: undefined,
  currentPrice: undefined,
  pageCurrency: undefined,
  userRegion: 'us', // deprecated
  userCountry: 'US',

  // price data
  currentLowest: undefined,
  historicalLow: undefined,
  historicalLowGOG: undefined,
  totalBundles: undefined,
  currentBundles: undefined,
  error: undefined,
  ...init
});

export const Actions = (state, $) => ($ = {
  set(obj) {
    for (let k in obj) {
      if (!(k in state)) throw Error(`Not a valid state property: ${k}`);
      state[k] = obj[k];
    }
  },

  reset() {
    $.set({
      currentLowest: undefined,
      historicalLow: undefined,
      historicalLowGOG: undefined,
      totalBundles: undefined,
      currentBundles: undefined,
      error: undefined,
    });
  }
});