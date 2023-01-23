export const State = (init = {}) => ({
  gameId: undefined,
  currentPrice: undefined,
  pageCurrency: undefined,
  userRegion: 'us',
  userCountry: 'US',
  currentLowest: undefined,
  historicalLow: undefined,
  historicalLowGOG: undefined,
  bundles: undefined,
  error: undefined,
  ...init
});

export const Actions = (state, $) => ($ = {
  set(obj) {
    for (let k in obj) {
      if (!(k in state)) throw Error('Not a valid state property');
      state[k] = obj[k];
    }
  },

  reset() {
    $.set({
      error: undefined,
      historicalLow: undefined,
      historicalLowGOG: undefined,
      currentLowest: undefined,
      bundles: undefined
    });
  },

  setPriceData(data) {
    $.set(data);
  }
});