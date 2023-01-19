import { API_KEY } from './config';
import { capitalize, getDateStr, request } from '../util';

const shop = 'gog';

const api = (version, iface, method) =>
  `https://api.isthereanydeal.com/${version}/${iface}/${method}/`;

const parseResponse = res => res.data[Object.keys(res.data)[0]];

export async function getPlainId(game_id) {
  const endpoint = api('v02', 'game', 'plain');
  const payload = { key: API_KEY, shop, game_id };

  let plainId = '';
  try {
    const res = await request('GET', endpoint, payload);

    if (!res['.meta'].match || !res['.meta'].active)
      throw Error('Game Not Found.');

    plainId = res.data.plain;
  } catch (e) {
    console.error(e);
  }

  return plainId;
}