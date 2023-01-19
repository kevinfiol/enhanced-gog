import { m } from 'umai';
import { rules } from './util';

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