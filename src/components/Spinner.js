import { h } from 'hyperapp';
import { Point } from './Point';

export const Spinner = () => () => {
    return h('div', { style: { textAlign: 'center', width: '100%' } }, [
        Point({ style: { padding: '1.5em 0 0.3em 0' } }, [
            h('span', {
                class: 'menu-friends-empty__spinner is-spinning'
            })
        ])
    ])
};