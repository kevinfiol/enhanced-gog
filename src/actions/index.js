import { config } from 'config';
import IsThereAnyDeal from 'services/IsThereAnyDeal';
// import Storage from 'services/Storage';

/**
 * Dependencies
 */
const itad = IsThereAnyDeal(config.BASE_URL, config.API_KEY);
// const storage = Storage();

/**
 * Actions
 */
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

const getAllPriceData = () => (state, actions) => {
    itad.getPlainId(state.game_id)
        .then(plain_id => {
            return Promise.all([
                itad.getHistoricalLow(plain_id),
                itad.getHistoricalLow(plain_id, 'gog'),
                itad.getCurrentLowest(plain_id),
                itad.getBundles(plain_id)
            ]);
        })
        .then(res => {
            actions.setHistoricalLow(res[0]);
            actions.setHistoricalLowGOG(res[1]);
            actions.setCurrentLowest(res[2]);
            actions.setBundles(res[3]);
        })
        .catch(err => {
            console.log(`== Enhanced GOG - Error has occured == ${ err }`);
        })
    ;
};

export const actions = {
    getAllPriceData,
    setCurrentLowest,
    setHistoricalLow,
    setHistoricalLowGOG,
    setBundles
};