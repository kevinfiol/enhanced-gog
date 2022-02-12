import { h } from 'hyperapp';
import { Point } from '../Point';

const Group = (region, children) => () => h('optgroup', { label: region }, children);
const Option = (code, name) => () => h('option', { value: code }, name);

export const CountrySelect = () => (state, actions) => {
    const region_map = state.region_map;
    const regions = Object.keys(region_map); // ['eu1', 'eu2', 'us', 'ca', ...]

    return h('div', { style: { width: '100%', fontSize: '13px' } }, [
        Point({}, h('b', {}, 'ITAD Region')),
        Point({}, [
            h('select', {
                style: {
                    width: '100%',
                    border: '1px solid #cecece',
                    padding: '0.4em',
                    margin: '0.5em 0 0 0',
                    backgroundColor: '#f6f6f6'
                },

                value: `${state.user_region}-${state.user_country}`,

                onchange: ev => {
                    const [new_region, new_country] = ev.target.value.split('-');

                    // Temporarily Set Stats to Null
                    actions.setStatsToNull();

                    // Persist Changes to Storage
                    actions.persistToStorage({ key: 'user_region', value: new_region });
                    actions.persistToStorage({ key: 'user_country', value: new_country });
    
                    // Update State
                    actions.setUserRegion(new_region);
                    actions.setUserCountry(new_country);

                    // Retrieve New Data
                    actions.getAllPriceData();
                }
            }, [
                regions.map(region => {
                    return Group(region, Object.keys(region_map[region]).map(country => {
                        return Option(region + '-' + country, region_map[region][country].name);
                    }));
                })
            ])
        ])
    ]);
};