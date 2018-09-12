import { h } from 'hyperapp';
import { Point } from 'components/Point';
import { Link } from 'components/Link';

export const CurrentLowest = () => state => {
    const data = state.currentLowest;

    return Point([
        h('b', {}, 'Current Lowest Price: '),
        `$${ data.price_new.toFixed(2) } at `,
        Link(data.url, data.shop.name),
        ` (DRM: ${ data.drm[0] }) `,
        '(', Link(data.itad_url, 'Info'), ')'
    ]);
};