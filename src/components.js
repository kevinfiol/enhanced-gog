import { m } from 'umai';
import { rules, createPriceFormatter } from './util';
import region_map from './data/region_map.json';

const Link = ({ href }, text) => (
  m('a', { href, style: 'text-decoration: underline' }, text)
);

export const Divider = () => (
  m('div', {
    style: rules({
      boxShadow: '0px 4px 6px -2px rgba(0, 0, 0, 0.25)',
      height: '14px',
      position: 'absolute',
      left: '0',
      width: '100%'
    })
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
    m('div', { style: rules({ margin: '0.8em 0', lineHeight: '1.5em' }) },
      historicalLow && state.currentPrice <= historicalLow &&
        m('p',
          m('i', ''),
          m('b', { style: 'color: #739c00' }, '✓  HISTORICAL LOWEST PRICE.')
        )
      ,

      currentLowest && state.currentPrice <= currentLowest &&
        m('p',
          m('i', ''),
          m('b', { style: { color: '#739c00' } }, '✓  CURRENT LOWEST PRICE.')
        )
      ,
    )
  );
};

export const Stats = ({ state }) => {
  let tmp;
  const { currentLowest, historicalLow, historicalLowGOG, bundles } = state;
  const currency = region_map[state.userRegion][state.userCountry].currency;
  const formatPrice = createPriceFormatter(currency.sign, currency.delimiter, currency.left);

  return (
    m('div', { style: rules({ fontSize: '13px', margin: '1em 0', lineHeight: '1.7em' }) },
      (tmp = currentLowest && tmp.shop) &&
        m('p',
          m('b', 'Current Lowest Price: '),
          `${formatPrice(tmp.price_new.toFixed(2))} at`,
          Link({ href: tmp.url }, tmp.shop.name),
          tmp.drm[0] ? ` (DRM: ${tmp.drm[0]} ` : ' ',
          '(', Link({ href: tmp.url }, 'Info'), ')'
        )
      ,

      (tmp = historicalLow && tmp.shop) &&
        m('p',
          m('b', {}, 'Historical Lowest Price: '),
          `${ formatPrice(tmp.price.toFixed(2)) } at ${ tmp.shop.name } on ${ tmp.date } `,
          '(', Link({ href: tmp.urls.history }, 'Info'), ')'
        )
      ,

      (tmp = historicalLowGOG && tmp.price) &&
        m('p',
          m('b', {}, 'Historical Lowest Price on GOG: '),
          `${ formatPrice(tmp.price.toFixed(2)) } on ${ tmp.date } `,
          '(', Link({ href: tmp.urls.history + '?shop[]=gog&generate=Select+Stores' }, 'Info'), ')'
        )
      ,

      (tmp = bundles && tmp.total) &&
        m('p',
          m('b', {}, 'Number of times this game has been in a bundle: '),
          `${ tmp.total } `,
          '(', Link({ href: tmp.urls.bundles }, 'Info'), ')'
        )
      ,
    )
  );
};

export const Error = ({ actions }) => (
  m('div', { style: 'padding: 1em;' },
    m('span', 'Woops. Enhanced GOG encountered an error. Try another region or '),
    m('a', {
      style: 'text-decoration: underline; cursor: pointer;',
      onclick: () => console.log('click try again')
    }, 'click here to try again.')
  )
);

export const Spinner = () => (
  m('div', { style: rules({ textAlign: 'center', width: '100%' }) },
      m('p', { style: 'padding: 1.5em 0 0.3em 0;' },
          h('span', {
              class: 'menu-friends-empty__spinner is-spinning'
          })
      )
  )
);

export const CountrySelect = ({ state, actions }) => {
  const regions = Object.keys(region_map); // ['eu1', 'eu2', 'us', 'ca', ...]

  return (
    m('div', { style: rules({ margin: '1em 0 0 0', fontSize: '13px' }) },
      m('p', m('b', 'Enhanced GOG Region')),
      m('p',
        m('select', {
          style: rules({
            border: '1px solid #cecece',
            padding: '0.4em',
            margin: '0.5em 0 0 0',
            backgroundColor: '#f6f6f6'
          }),

          value: `${state.userRegion}-${state.userCountry}`,

          onchange: (ev) => {
            const [newRegion, newCountry] = ev.target.value.split('-');
            console.log(ev.target.value);
          }
        },
          regions.map(region =>
            m('optgroup', { label: region },
              Object.keys(region_map(region)).map(country =>
                m('option', {
                  value: `${region}-${country}`
                }, region_map[region][country].name)
              )
            )
          )
        )
      )
    )
  );
};