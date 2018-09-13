import { h } from 'hyperapp';

export const Spinner = () => () => h('span', {
    class: 'module-bottom__spinner spinner--small is-spinning'
});