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
  const historicalLow = state.historicalLow.price || undefined;
  const currentLowest = state.currentLowest.price_new || undefined;
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
    m('div', { style: { margin: '0.8em 0', lineHeight: '1.5em' } },
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
  const { currentLowest, historicalLow, historicalLowGOG, bundles } = state;
  const currency = region_map[state.userRegion][state.userCountry].currency;
  const formatPrice = createPriceFormatter(currency.sign, currency.delimiter, currency.left);

  return (
    m('div', { style: { fontSize: '13px', margin: '1em 0', lineHeight: '1.7em' } },
      currentLowest.shop &&
        m('p',
          m('b', 'Current Lowest Price: '),
          `${formatPrice(currentLowest.price_new.toFixed(2))} at `,
          Link({ href: currentLowest.url }, currentLowest.shop.name),
          currentLowest.drm[0] ? ` (DRM: ${currentLowest.drm[0]}) ` : ' ',
          '(', Link({ href: currentLowest.itad_url }, 'Info'), ')'
        )
      ,

      historicalLow.shop &&
        m('p',
          m('b', {}, 'Historical Lowest Price: '),
          `${ formatPrice(historicalLow.price.toFixed(2)) } at ${ historicalLow.shop.name } on ${ historicalLow.date } `,
          '(', Link({ href: historicalLow.urls.history }, 'Info'), ')'
        )
      ,

      historicalLowGOG.price &&
        m('p',
          m('b', {}, 'Historical Lowest Price on GOG: '),
          `${ formatPrice(historicalLowGOG.price.toFixed(2)) } on ${ historicalLowGOG.date } `,
          '(', Link({ href: historicalLowGOG.urls.history + '?shop[]=gog&generate=Select+Stores' }, 'Info'), ')'
        )
      ,

      bundles.total !== undefined &&
        m('p',
          m('b', {}, 'Number of times this game has been in a bundle: '),
          `${ bundles.total } `,
          '(', Link({ href: bundles.urls.bundles }, 'Info'), ')'
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
          state.gameId,
          state.userRegion,
          state.userCountry
        );

        if (error) actions.set({ error });
        else actions.setPriceData(priceData);
      }
    }, 'click here to try again.')
  )
);

export const Spinner = () => (
  m('div', { style: { textAlign: 'center', width: '100%' } },
      m('p', { style: 'padding: 1.5em 0 0.3em 0;' },
          m('span', {
              class: 'menu-friends-empty__spinner is-spinning'
          })
      )
  )
);

export const CountrySelect = ({ state, actions }) => {
  const countryValue = `${state.userRegion}-${state.userCountry}`;

  return (
    m('div', { style: { margin: '1em 0 0 0', fontSize: '13px' } },
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
              state.gameId,
              userRegion,
              userCountry
            );

            if (error) actions.set({ error });
            else actions.setPriceData(priceData);
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