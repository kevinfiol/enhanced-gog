import { h } from 'hyperapp';
import { Point } from 'components/Point';
import { Link } from 'components/Link';
import { createPriceFormatter } from 'util';

export const HistoricalLow = () => state => {
    const data = state.historicalLow;
    const currency = state.region_map[state.user_region][state.user_country].currency;
    const formatPrice = createPriceFormatter(currency.sign, currency.delimiter, currency.left);

    return Point({}, [
        h('b', {}, 'Historical Lowest Price: '),
        `${ formatPrice(data.price.toFixed(2)) } at ${ data.shop.name } on ${ data.date } `,
        '(', Link(data.urls.history, 'Info'), ')'
    ]);
};

