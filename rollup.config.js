import path from 'path';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import buble from 'rollup-plugin-buble';
import alias from 'rollup-plugin-alias';

const aliases = {
    'components': path.resolve(__dirname, 'src/components'),
    'actions': path.resolve(__dirname, 'src/actions'),
    'annotations': path.resolve(__dirname, 'src/annotations'),
    'util': path.resolve(__dirname, 'src/util'),
    'polyfills': path.resolve(__dirname, 'src/polyfills'),
    'services': path.resolve(__dirname, 'src/services'),
    'config': path.resolve(__dirname, 'src/config')
};

const config = {
    input: './src/index.js',
    output: {
        file: './bin/enhanced-gog.user.js',
        format: 'esm',
        sourcemap: true
    },
    plugins: [
        nodeResolve(),
        commonjs(),
        alias(aliases),
        buble()
    ]
};

export default config;