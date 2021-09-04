import fs from 'fs';

const countries = JSON.parse(fs.readFileSync('iso_countries.json', 'utf8'));
const regions = JSON.parse(fs.readFileSync('itad_regions.json', 'utf8'));

const regions_array = Object.keys(regions.data);

for (let cc in countries) {
    let regionCode = Object.keys(regions.data).filter(rc => {
        return regions.data[rc].countries.indexOf(cc) > -1;
    });

    if (regionCode.length > 0) {
        regionCode = regionCode[0];
        
        const region = regions.data[regionCode];
        countries[cc].region_code = regionCode;
        countries[cc].currency = region.currency;
    } else {
        delete countries[cc];
    }
}

const regionCountryMap = {};

regions_array.map(rc => {
    const tempCountries = Object.assign({}, countries);

    for (let cc in tempCountries) {
        if (tempCountries[cc].region_code !== rc) {
            delete tempCountries[cc];
        }
    }

    regionCountryMap[rc] = tempCountries;
});

fs.writeFileSync('region_map.json', JSON.stringify(regionCountryMap), 'utf8');