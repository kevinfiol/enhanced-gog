import { h } from 'hyperapp';
import { Point } from 'components/Point';
import { Link } from 'components/Link';

export const HistoricalLow = () => state => {
    const data = state.historicalLow;

    return Point({}, [
        h('b', {}, 'Historical Lowest Price: '),
        `$${ data.price.toFixed(2) } at ${ data.shop.name } on ${ data.date } `,
        '(', Link(data.urls.history, 'Info'), ')'
    ]);
};

