import { config } from '../config';
import { q, createPriceFormatter } from '../util';
import IsThereAnyDeal from '../services/IsThereAnyDeal';
import Storage from '../services/Storage';
import PriceService from '../services/PriceService';
import currencies from '../data/currencies.json';

/**
 * Dependencies
 */
const itad = IsThereAnyDeal(config.BASE_URL, config.API_KEY);
const storage = Storage();

/**
 * Actions
 */
const setError = error => () => ({
    error
});

const setStatsToNull = () => state => ({
    historicalLow: null,
    historicalLowGOG: null,
    currentLowest: null,
    bundles: null
});

const setPriceData = priceData => state => ({
    priceData
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

const setUserCurrency = user_currency => state => ({
    user_currency
});

const cacheData = payload => state => {
    const newCache = Object.assign({}, state.cache);

    if (newCache[payload.region]) {
        newCache[payload.region][payload.country] = {
            ...(newCache[payload.region][payload.country] || {}),
            ...payload.data
        };
    } else {
        newCache[payload.region] = {
            [payload.country]: { ...payload.data }
        };
    }

    return { cache: newCache };
};

const readAndSetFromStorage = () => (state, actions) => {
    const user_region = storage.getValue('user_region');
    const user_country = storage.getValue('user_country');
    const user_currency = storage.getValue('user_currency');

    if (user_region && user_country && user_currency) {
        actions.setUserRegion(user_region);
        actions.setUserCountry(user_country);
        actions.setUserCurrency(user_currency)
    } else {
        actions.persistToStorage({ key: 'user_region', value: state.user_region });
        actions.persistToStorage({ key: 'user_country', value: state.user_country });
        actions.persistToStorage({ key: 'user_currency', value: state.user_currency });
    }
};

const persistToStorage = item => () => {
    storage.setValue(item.key, item.value);
};

const updatePagePrice = ({ pageCurrency, selectedCurrency, priceData }) => () => {
    const el = q('.enhanced-gog-price');
    if (pageCurrency !== selectedCurrency) {
        let text = '';
        const currency = currencies[selectedCurrency];
        if (currency) {
            let price = priceData[selectedCurrency].final.replace(/[^0-9]/g, '').trim();
            let cents = price.substr(-2);
            price = price.split('');
            price.splice(-2, 2); // remove cents
            price = price.join('') + '.' + cents;

            const formatPrice = createPriceFormatter(currency.sign, currency.delimiter, currency.left);
            text = '(' + formatPrice(price) + ')';
        } else {
            text = `(${priceData[selectedCurrency].final})`;
        }

        el.innerText = text;
    } else {
        el.innerText = '';
    }
};

const getAllPriceData = () => (state, actions) => {
    // Set all ITAD Stats
    const setStats = res => {
        actions.setHistoricalLow(res[0]);
        actions.setHistoricalLowGOG(res[1]);
        actions.setCurrentLowest(res[2]);
        actions.setBundles(res[3]);
    };

    actions.setError(null);

    if (state.cache[state.user_region] &&
        state.cache[state.user_region][state.user_country]
    ) {
        // Results exist in Cache
        const cached = state.cache[state.user_region][state.user_country];
        setStats(cached.results);
        actions.setPriceData(cached.priceData);

        // dupe code from l196
        let defaultCurrency = null;
        if (!(state.user_currency in cached.priceData)) {
            defaultCurrency = Object.keys(cached.priceData)[0];
            actions.setUserCurrency(defaultCurrency);
            actions.persistToStorage({ key: 'user_currency', value: defaultCurrency });
        }

        const selectedCurrency = defaultCurrency || state.user_currency;
        actions.updatePagePrice({ pageCurrency: state.pageCurrency, selectedCurrency, priceData: cached.priceData });
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
                actions.cacheData({
                    region: state.user_region,
                    country: state.user_country,
                    data: { results: res }
                });

                const userCountry = state.user_country.replace(/[0-9]/g, ''); // remove numbers for gog api
                return PriceService.getPrices(state.game_id, userCountry);
            })
            .then(res => {
                const prices = res['_embedded'] && res['_embedded'].prices || [];
                const priceData = prices.reduce((acc, cur) => {
                    acc[cur.currency.code] = {
                        base: cur.basePrice,
                        final: cur.finalPrice
                    };

                    return acc;
                }, {});

                actions.setPriceData(priceData);

                // Cache PriceData
                actions.cacheData({
                    region: state.user_region,
                    country: state.user_country,
                    data: { priceData }
                });

                let defaultCurrency = null;
                if (!(state.user_currency in priceData)) {
                    defaultCurrency = Object.keys(priceData)[0];
                    actions.setUserCurrency(defaultCurrency);
                    actions.persistToStorage({ key: 'user_currency', value: defaultCurrency });
                }

                const selectedCurrency = defaultCurrency || state.user_currency;
                actions.updatePagePrice({ pageCurrency: state.pageCurrency, selectedCurrency, priceData });
            })
            .catch(err => {
                actions.setError(err);
                console.log(`== Enhanced GOG - Error has occured == ${ err.statusText }`);
            })
        ;
    }
};

export const actions = {
    setError,
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
    cacheData,
    setPriceData,
    setUserCurrency,
    updatePagePrice
};