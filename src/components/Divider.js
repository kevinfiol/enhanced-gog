import { h } from 'hyperapp';

export const Divider = () => () => {
    return h('div', {
        style: {
            boxShadow: '0px 4px 6px -2px rgba(0, 0, 0, 0.25)',
            height: '14px',
            position: 'absolute',
            left: '0',
            // border: '1px solid transparent',
            width: '100%'
        }
    });
};