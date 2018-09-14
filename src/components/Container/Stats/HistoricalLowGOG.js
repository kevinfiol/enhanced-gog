import { h } from 'hyperapp';
import { Point } from 'components/Point';
import { Link } from 'components/Link';
import { createPriceFormatter } from 'util';

export const HistoricalLowGOG = () => state => {
    const data = state.historicalLowGOG;
    const currency = state.region_map[state.user_region][state.user_country].currency;
    const formatPrice = createPriceFormatter(currency.sign, currency.delimiter, currency.left);
    
    return Point({}, [
        h('b', {}, 'Historical Lowest Price on GOG: '),
        `${ formatPrice(data.price.toFixed(2)) } on ${ data.date } `,
        '(', Link(data.urls.history, 'Info'), ')'
    ]);
};