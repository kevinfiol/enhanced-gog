import { h } from 'hyperapp';
import { Point } from '../../Point';
import { Link } from '../../Link';
import { createPriceFormatter } from '../../../util';

export const CurrentLowest = () => state => {
    const data = state.currentLowest;
    const currency = state.region_map[state.user_region][state.user_country].currency;
    const formatPrice = createPriceFormatter(currency.sign, currency.delimiter, currency.left);

    return Point({}, [
        h('b', {}, 'Current Lowest Price: '),
        `${ formatPrice(data.price_new.toFixed(2)) } at `,
        Link(data.url, data.shop.name),
        data.drm[0] ? ` (DRM: ${ data.drm[0] }) ` : ' ',
        '(', Link(data.itad_url, 'Info'), ')'
    ]);
};