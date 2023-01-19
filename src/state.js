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
  cache: {},
  error: undefined,
  ...init
});

export const Actions = (state, $) => ($ = {

});