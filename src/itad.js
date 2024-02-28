import { API_KEY } from './config';
import { getDateStr, request } from './util';

const GOG_SHOP_ID = 35;

const api = (iface, method, version) =>
  `https://api.isthereanydeal.com/${iface}/${method}/${version}`;

export async function getInfo(gameTitle) {
  let [info, error] = [{ id: '', slug: '' }, undefined];
  const endpoint = api('games', 'search', 'v1');
  const params = { key: API_KEY, title: gameTitle, results: 1 };

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
  let [overview, error] = [
    { current: {}, historical: {}, bundles: 0 },
    undefined
  ];

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

    if (res.bundles) {
      overview.bundles = res.bundles.length;
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
      };
    }
  } catch (e) {
    error = e;
  }

  return [low, error];
}

export async function getCurrentBundles(id, country) {
  let [bundles, error] = [[], undefined];
  const endpoint = api('games', 'bundles', 'v2');
  const params = { key: API_KEY, id, country, expired: false };

  try {
    let res = await request('GET', endpoint, { params });

    if (Array.isArray(res)) {
      bundles = res.map((bundle) => {
        const url = (new URL(bundle.url)).searchParams.get('URL') || bundle.url;

        return {
          title: bundle.title,
          url
        };
      })
    }
  } catch (e) {
    error = e;
  }

  return [bundles, error];
}

export async function getPriceData(gameTitle, userCountry) {
  let priceData = {
    historicalLow: {},
    historicalLowGOG: {},
    currentLowest: {},
    bundles: {}
  };

  let error = undefined;

  try {
    let [{ id, slug }, infoError] = await getInfo(gameTitle);
    if (infoError) throw infoError;

    let res = await Promise.all([
      getPriceOverview(id, userCountry),
      getHistoricalLowGOG(id, userCountry),
      getCurrentBundles(id, userCountry)
    ]);

    // find and throw an error if one occurred
    let batchError = res.reduce((a, [_data, resError]) => {
      return resError ? resError : a;
    }, undefined);

    if (batchError) throw batchError;

    priceData = {
      itadSlug: slug,
      currentLowest: res[0][0].current,
      historicalLow: res[0][0].historical,
      totalBundles: res[0][0].bundles,
      historicalLowGOG: res[1][0],
      currentBundles: res[2][0]
    };
  } catch (e) {
    error = e;
  }

  return [priceData, error];
}