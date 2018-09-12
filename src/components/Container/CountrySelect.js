import { h } from 'hyperapp';
import { Point } from 'components/Point';

const Group = (region, children) => () => h('optgroup', { label: region }, children);
const Option = (code, name) => () => h('option', { value: code }, name);

export const CountrySelect = () => (state, actions) => {
    return Point([
        h('b', {}, 'Select Price Region: '),
        h('select', {}, [
            Object.keys(state.region_map).map(region => {
                return Group(region, Object.keys(state.region_map[region]).map(country => {
                    return Option(country, state.region_map[region][country].name);
                }));
            })
        ])
    ]);
};

