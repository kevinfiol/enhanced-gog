import { config } from 'config';
import IsThereAnyDeal from 'services/IsThereAnyDeal';
import Storage from 'services/Storage';

/**
 * Dependencies
 */
const itad = IsThereAnyDeal(config.BASE_URL, config.API_KEY);
const storage = Storage();

/**
 * Actions
 */
const setStatsToNull = () => state => ({
    historicalLow: null,
    historicalLowGOG: null,
    currentLowest: null,
    bundles: null
});

const setHistoricalLow = historicalLow => state => ({
    historicalLow
});

const setHistoricalLowGOG = historicalLowGOG => state => ({
    historicalLowGOG
});

const setCurrentLowest = currentLowest => state => ({
    currentLowest
});

const setBundles = bundles => state => ({
    bundles
});

const setUserRegion = user_region => state => ({
    user_region
});

const setUserCountry = user_country => state => ({
    user_country
});

const cacheResults = payload => state => {
    const newCache = Object.assign({}, state.cache);

    if (newCache[payload.region]) {
        newCache[payload.region][payload.country] = payload.results;
    } else {
        newCache[payload.region] = {
            [payload.country]: payload.results
        };
    }

    return { cache: newCache };
};

const readAndSetFromStorage = () => (state, actions) => {
    const user_region = storage.getValue('user_region');
    const user_country = storage.getValue('user_country');

    if (user_region && user_country) {
        actions.setUserRegion(user_region);
        actions.setUserCountry(user_country);
    } else {
        actions.persistToStorage({ key: 'user_region', value: state.user_region });
        actions.persistToStorage({ key: 'user_country', value: state.user_country });
    }
};

const persistToStorage = item => () => {
    storage.setValue(item.key, item.value);
};

const getAllPriceData = () => (state, actions) => {
    // Set all ITAD Stats
    const setStats = res => {
        actions.setHistoricalLow(res[0]);
        actions.setHistoricalLowGOG(res[1]);
        actions.setCurrentLowest(res[2]);
        actions.setBundles(res[3]);
    };

    if (state.cache[state.user_region] &&
        state.cache[state.user_region][state.user_country]
    ) {
        // Results exist in Cache
        setStats(state.cache[state.user_region][state.user_country]);
    } else {
        // Results do not exist in Cache
        // Retrieve from ITAD
        itad.getPlainId(state.game_id)
            .then(plain_id => {
                return Promise.all([
                    itad.getHistoricalLow(plain_id, null, state.user_region, state.user_country),
                    itad.getHistoricalLow(plain_id, 'gog', state.user_region, state.user_country),
                    itad.getCurrentLowest(plain_id, state.user_region, state.user_country),
                    itad.getBundles(plain_id, state.user_region)
                ]);
            })
            .then(res => {
                setStats(res);

                // Cache Results
                actions.cacheResults({
                    region: state.user_region,
                    country: state.user_country,
                    results: res
                });
            })
            .catch(err => {
                console.log(`== Enhanced GOG - Error has occured == ${ err }`);
            })
        ;
    }
};

export const actions = {
    getAllPriceData,
    setStatsToNull,
    setCurrentLowest,
    setHistoricalLow,
    setHistoricalLowGOG,
    setBundles,
    setUserRegion,
    setUserCountry,
    readAndSetFromStorage,
    persistToStorage,
    cacheResults
};