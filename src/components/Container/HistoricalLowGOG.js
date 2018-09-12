import { h } from 'hyperapp';
import { Point } from 'components/Point';
import { Link } from 'components/Link';

export const HistoricalLowGOG = () => state => {
    const data = state.historicalLowGOG;

    return Point({}, [
        h('b', {}, 'Historical Lowest Price on GOG: '),
        `$${ data.price.toFixed(2) } on ${ data.date } `,
        '(', Link(data.urls.history, 'Info'), ')'
    ]);
};