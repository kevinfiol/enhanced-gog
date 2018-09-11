import fs from 'fs';
import path from 'path';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import buble from 'rollup-plugin-buble';
import alias from 'rollup-plugin-alias';
import MagicString from 'magic-string';

const prependBanner = (options = {}) => {
    return {
        transformBundle(code) {
            if (options.banner && typeof options.banner === 'string') {
                const content = options.banner;
                const magicStr = new MagicString(code);

                magicStr.prepend(content + '\n');
                return { code: magicStr.toString() };
            }
        }
    };
}

const annotations = fs.readFileSync(path.join(__dirname, 'annotations.txt'), 'utf8');

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
        format: 'iife',
        sourcemap: process.env.PROD === 'true' ? false : true
    },
    plugins: [
        nodeResolve(),
        commonjs(),
        alias(aliases),
        buble(),
        prependBanner({ banner: annotations })
    ]
};

export default config;