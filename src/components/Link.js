import { h } from 'hyperapp';

export const Link = (href, text) => () => h('a', { class: 'un', href: href }, text);