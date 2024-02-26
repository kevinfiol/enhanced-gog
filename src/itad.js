import { API_KEY } from './config';
import { capitalize, getDateStr, request } from './util';

const shop = 'gog';

const api = (iface, method, version) =>
  `https://api.isthereanydeal.com/${iface}/${method}/${version}/`;

const parseResponse = res => res.data[Object.keys(res.data)[0]];

export async function getPlainId(gameId) {
  let [plainId, error] = ['', undefined];
  const endpoint = api('games', 'lookup', 'v1');
  const payload = { key: API_KEY, title: 'robocop-rogue-city' };

  try {
    console.log({endpoint, payload});
    const res = await request('GET', endpoint, payload);
    console.log({res});
    // const isMatch = res['.meta'].match;
    // const isActive = res['.meta'].active;

    // if (!isMatch) // todo: change back to !isMatch || !isActive when API changes are stable
      // throw Error('Game Not Found.');

    // plainId = res.data.plain;
  } catch (e) {
    console.error(e);
    error = e;
  }

  return [plainId, error];
}

export async function getHistoricalLow(plainId, shops, region, country) {
  let [low, error] = [{}, undefined];
  const endpoint = api('v01', 'game', 'lowest');
  const payload = { key: API_KEY, plains: plainId, region, country };

  // this key must be omitted from the payload in order to get overall historical low
  if (shops) payload.shops = shops;

  try {
    let res = await request('GET', endpoint, payload);
    res = parseResponse(res);

    if (res.price !== undefined && res.price !== null) {
      low = {
        date: getDateStr(res.added),
        cut: res.cut,
        price: res.price,
        shop: res.shop,
        urls: res.urls
      };
    }
  } catch (e) {
    console.error(e);
    error = e;
  }

  return [low, error];
}

export async function getCurrentLowest(plainId, region, country) {
  let [lowest, error] = [{}, undefined];
  const endpoint = api('v01', 'game', 'prices');
  const payload = { key: API_KEY, plains: plainId, region, country };

  try {
    let res = await request('GET', endpoint, payload);
    res = parseResponse(res);

    if (res.list && res.list.length) {
      lowest = res.list.reduce((a, c) => {
        a = a.price_new >= c.price_new ? c : a;
        return a;
      }, { price_new: Infinity });

      if (lowest.drm && lowest.drm[0]) lowest.drm[0] = capitalize(lowest.drm[0]);
      lowest.itad_url = res.urls.game;
    }
  } catch (e) {
    console.error(e);
    error = e;
  }

  return [lowest, error];
}

export async function getBundles(plainId, region) {
  let [bundles, error] = [{}, undefined];
  const endpoint = api('v01', 'game', 'bundles');
  const payload = { key: API_KEY, plains: plainId, region };

  try {
    let res = await request('GET', endpoint, payload);
    res = parseResponse(res);

    bundles.total = res.total;
    bundles.urls = res.urls;
  } catch (e) {
    console.error(e);
    error = e;
  }

  return [bundles, error];
}

export async function getPriceData(gameId, userRegion, userCountry) {
  let priceData = {
    historicalLow: {},
    historicalLowGOG: {},
    currentLowest: {},
    bundles: {}
  };

  let error = undefined;

  try {
    let [plainId, idError] = await getPlainId(gameId);
    if (idError) throw idError;

    let res = await Promise.all([
      getHistoricalLow(plainId, undefined, userRegion, userCountry),
      getHistoricalLow(plainId, 'gog', userRegion, userCountry),
      getCurrentLowest(plainId, userRegion, userCountry),
      getBundles(plainId, userRegion)
    ]);

    // find and throw an error if one occurred
    let batchError = res.reduce((a, [_data, resError]) => {
      return resError ? resError : a;
    }, undefined);

    if (batchError) throw batchError;

    priceData = {
      historicalLow: res[0][0],
      historicalLowGOG: res[1][0],
      currentLowest: res[2][0],
      bundles: res[3][0]
    };
  } catch (e) {
    console.error('Error retrieving all price data.', e);
    error = e;
  }

  return [priceData, error];
}