import { h } from 'hyperapp';

export const Point = (attrs, children) => () => h('p', Object.assign({ class: 'buy-footer-info-point' }, attrs), children);