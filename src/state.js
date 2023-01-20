export const State = (init = {}) => ({
  gameId: undefined,
  currentPrice: undefined,
  pageCurrency: undefined,
  regionMap: undefined,
  userRegion: 'us',
  userCountry: 'us',
  currentLowest: undefined,
  historicalLow: undefined,
  historicalLowGOG: undefined,
  bundles: undefined,
  error: undefined,
  ...init
});

export const Actions = (state) => ({
  set(key, val) {
    if (!(key in state)) throw Error('Not a valid state property');
    state[key] = val;
  }
});