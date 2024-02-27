import { API_KEY } from './config';
import { getDateStr, request } from './util';

const GOG_SHOP_ID = 35;

const api = (iface, method, version) =>
  `https://api.isthereanydeal.com/${iface}/${method}/${version}`;

export async function getInfo(gameSlug) {
  let [info, error] = [{ id: '', slug: '' }, undefined];
  const endpoint = api('games', 'search', 'v1');
  const params = { key: API_KEY, title: gameSlug, results: 1 };

  try {
    const res = await request('GET', endpoint, { params });

    if (!Array.isArray(res) || res.length === 0)
      throw Error('Game Not Found.');

    info.id = res[0].id;
    info.slug = res[0].slug;
  } catch (e) {
    error = e;
  }

  return [info, error];
}

export async function getPriceOverview(id, country) {
  let [overview, error] = [{ current: {}, historical: {} }, undefined];
  const endpoint = api('games', 'overview', 'v2');
  const params = { key: API_KEY, country };
  const body = [id];

  try {
    const res = await request('POST', endpoint, { params, body });

    if (res.prices && res.prices.length > 0) {
      const { current, lowest } = res.prices[0];

      if (current.price) {
        overview.current = {
          drm: current.drm && current.drm.length > 0 ? current.drm[0].name : '',
          price: current.price.amount,
          shop: current.shop.name,
          url: current.url,
          date: getDateStr(current.timestamp),
        }
      }

      if (lowest.price) {
        overview.historical = {
          drm: lowest.drm && lowest.drm.length > 0 ? lowest.drm[0].name : '',
          price: lowest.price.amount,
          shop: lowest.shop.name,
          date: getDateStr(lowest.timestamp),
        }
      }
    }
  } catch (e) {
    error = e;
  }

  return [overview, error];
}

export async function getHistoricalLowGOG(id, country) {
  let [low, error] = [{}, undefined];
  const endpoint = api('games', 'storelow', 'v2');
  const params = { key: API_KEY, country, shops: [GOG_SHOP_ID] };
  const body = [id];

  try {
    let res = await request('POST', endpoint, { params, body });
    const data = Array.isArray(res) && res.length > 0
      ? res[0].lows[0]
      : undefined;

    if (data !== undefined && data.price) {
      low = {
        price: data.price.amount,
        shop: 'GOG',
        date: getDateStr(data.timestamp)
      }
    }
  } catch (e) {
    error = e;
  }

  return [low, error];
}

export async function getBundles(id, country) {
  let [bundles, error] = [{}, undefined];
  const endpoint = api('games', 'bundles', 'v2');
  const params = { key: API_KEY, id, country, expired: true };

  try {
    let res = await request('GET', endpoint, { params });
    bundles.total = res.length;
  } catch (e) {
    error = e;
  }

  return [bundles, error];
}

export async function getPriceData(gogSlug, userCountry) {
  let priceData = {
    historicalLow: {},
    historicalLowGOG: {},
    currentLowest: {},
    bundles: {}
  };

  let error = undefined;

  try {
    let [info, infoError] = await getInfo(gogSlug);
    if (infoError) throw infoError;

    let res = await Promise.all([
      getPriceOverview(info.id, userCountry),
      getHistoricalLowGOG(info.id, userCountry),
      getBundles(info.id, userCountry)
    ]);

    // find and throw an error if one occurred
    let batchError = res.reduce((a, [_data, resError]) => {
      return resError ? resError : a;
    }, undefined);

    if (batchError) throw batchError;

    priceData = {
      itadId: info.id,
      itadSlug: info.slug,
      currentLowest: res[0][0].current,
      historicalLow: res[0][0].historical,
      historicalLowGOG: res[1][0],
      bundles: res[2][0]
    };
  } catch (e) {
    error = e;
  }

  return [priceData, error];
}