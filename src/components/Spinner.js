import { h } from 'hyperapp';
import { Point } from 'components/Point';

export const Spinner = () => () => {
    return h('div', { class: 'module__foot' }, [
        Point({ style: { padding: '1.2em 0' } }, [
            h('span', {
                class: 'module-bottom__spinner spinner--small is-spinning'
            })
        ])
    ])
};