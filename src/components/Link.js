import { h } from 'hyperapp';

export const Link = (href, text) => () => h('a', { style: { textDecoration: 'underline' }, href: href }, text);