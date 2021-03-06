import { h } from 'hyperapp';

export const Point = (attrs, children) => () => h('p', Object.assign({ class: '' }, attrs), children);