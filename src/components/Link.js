import { h } from 'hyperapp';

export const Link = (href, text) => () => {
    if (href.includes('gog.com')) {
        // clean ad tracking from gog links
        href = 'https://www.gog.com' + decodeURIComponent(href.split('gog.com')[1]);
    }

    return h('a', { style: { textDecoration: 'underline' }, href: href }, text);
}