import { m, redraw } from 'umhi';
import { createPriceFormatter } from './util';
import { getPriceData } from './itad';
import { persistUserSettings } from './storage';
import region_map from './data/region_map.json';

const REGIONS = Object.keys(region_map); // ['eu1', 'eu2', 'us', 'ca', ...]

const Link = ({ href }, text) => (
  m('a', { href, style: 'text-decoration: underline' }, text)
);

export const Divider = () => (
  m('div', {
    style: {
      boxShadow: '0px 4px 6px -2px rgba(0, 0, 0, 0.25)',
      height: '14px',
      position: 'absolute',
      left: '0',
      width: '100%'
    }
  })
);

export const Notifications = ({ state }) => {
  const historicalLow = state.historicalLow.price;
  const currentLowest = state.currentLowest.price;
  const userCurrency = region_map[state.userRegion][state.userCountry].currency.code;

  if (
    // If price is neither Historical Low or Current Low
    !((historicalLow && state.currentPrice <= historicalLow) || (currentLowest && state.currentPrice <= currentLowest))
    // Or If Enhanced GOG's Currency does not match the Page's Currency
    || userCurrency !== state.pageCurrency
  ) {
    // Do Not Render Anything
    return null;
  }

  return (
    m('div', { style: { margin: '0.8em 0 0.4em 0', lineHeight: '1.5em' } },
      historicalLow && state.currentPrice <= historicalLow &&
        m('p',
          m('i', ''),
          m('b', { style: 'color: #739c00' }, '✓  HISTORICAL LOWEST PRICE.')
        )
      ,

      currentLowest && state.currentPrice <= currentLowest &&
        m('p',
          m('i', ''),
          m('b', { style: 'color: #739c00' }, '✓  CURRENT LOWEST PRICE.')
        )
      ,
    )
  );
};

export const Stats = ({ state }) => {
  const { currentLowest, historicalLow, historicalLowGOG, totalBundles, currentBundles, itadSlug } = state;
  const currency = region_map[state.userRegion][state.userCountry].currency;
  const formatPrice = createPriceFormatter(currency.sign, currency.delimiter, currency.left);
  const infoUrl = `https://isthereanydeal.com/game/${itadSlug}/info/`;
  const historyUrl = `https://isthereanydeal.com/game/${itadSlug}/history/`;

  return (
    m('div', { style: { fontSize: '13px', margin: '1em 0', lineHeight: '1.7em' } },
      currentLowest.price &&
        m('p',
          m('b', 'Current Lowest Price: '),
          `${formatPrice(currentLowest.price.toFixed(2))} at `,
          Link({ href: currentLowest.url }, currentLowest.shop),
          currentLowest.drm ? ` (DRM: ${currentLowest.drm}) ` : ' ',
          '(', Link({ href: infoUrl }, 'Info'), ')'
        )
      ,

      historicalLow.price &&
        m('p',
          m('b', 'Historical Lowest Price: '),
          `${ formatPrice(historicalLow.price.toFixed(2)) } at ${ historicalLow.shop } on ${ historicalLow.date } `,
          '(', Link({ href: historyUrl }, 'Info'), ')'
        )
      ,

      historicalLowGOG.price &&
        m('p',
          m('b', 'Historical Lowest Price on GOG: '),
          `${ formatPrice(historicalLowGOG.price.toFixed(2)) } on ${ historicalLowGOG.date } `,
          '(', Link({ href: historyUrl }, 'Info'), ')'
        )
      ,

      totalBundles !== undefined &&
        m('p',
          m('b', 'Number of times this game has been in a bundle: '),
          `${ totalBundles } `,
          '(', Link({ href: infoUrl }, 'Info'), ')'
        )
      ,

      currentBundles.length > 0 &&
        m('p', { style: 'color: #739c00' },
          m('b', 'This game is currently in these bundles:'),
          m('ul',
            currentBundles.map((bundle) =>
              m('li', Link({ href: bundle.url }, bundle.title))
            )
          )
        )
      ,
    )
  );
};

export const Error = ({ state, actions }) => (
  m('div', { style: 'padding: 1em;' },
    m('span', 'Woops. Enhanced GOG encountered an error. Try another region or '),
    m('a', {
      style: 'text-decoration: underline; cursor: pointer;',
      onclick: async () => {
        actions.reset();
        redraw(); // redraw to show loading

        const [priceData, error] = await getPriceData(
          state.gameTitle,
          state.userCountry
        );

        if (error) actions.set({ error });
        else actions.set(priceData);
      }
    }, 'click here to try again.')
  )
);

export const Spinner = () => (
  m('div', { style: { textAlign: 'center', width: '100%' } },
    m('p', { style: 'padding: 1.5em 0 1em 0;' },
      m('span', {
          class: 'menu-friends-empty__spinner is-spinning'
      })
    )
  )
);

export const CountrySelect = ({ state, actions }) => {
  const countryValue = `${state.userRegion}-${state.userCountry}`;

  return (
    m('div', { style: { margin: '1em 0', fontSize: '13px' } },
      m('p', m('b', 'Enhanced GOG Region')),
      m('p',
        m('select', {
          style: {
            border: '1px solid #cecece',
            padding: '0.4em',
            margin: '0.5em 0 0 0',
            backgroundColor: '#f6f6f6'
          },

          value: countryValue,

          onchange: async (ev) => {
            const [userRegion, userCountry] = ev.target.value.split('-');

            // reset price data first
            actions.reset();
            redraw();

            // persist new country settings
            persistUserSettings({ userRegion, userCountry });

            // update state
            actions.set({ userRegion, userCountry });

            // retrieve new data
            const [priceData, error] = await getPriceData(
              state.gameTitle,
              userCountry
            );

            if (error) actions.set({ error });
            else actions.set(priceData);
          }
        },
          REGIONS.map(region =>
            m('optgroup', { label: region },
              Object.keys(region_map[region]).map(country =>
                m('option', {
                  value: `${region}-${country}`,
                  selected: countryValue === `${region}-${country}`
                }, region_map[region][country].name)
              )
            )
          )
        )
      )
    )
  );
};