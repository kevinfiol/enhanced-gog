import { h } from 'hyperapp';
import { Point } from 'components/Point';
import { Link } from 'components/Link';

export const Bundles = () => state => {
    const data = state.bundles;

    return Point({}, [
        h('b', {}, 'Number of times this game has been in a bundle: '),
        `${ data.total } `,
        '(', Link(data.urls.bundles, 'Info'), ')'
    ]);
};