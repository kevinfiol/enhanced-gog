import fs from 'fs';
import path from 'path';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import buble from 'rollup-plugin-buble';
import alias from 'rollup-plugin-alias';
import MagicString from 'magic-string';
import json from 'rollup-plugin-json';

const isProduction = (process.env.PROD && process.env.PROD === 'true');
const annotations = fs.readFileSync(path.join(__dirname, 'annotations.txt'), 'utf8');

const prependBanner = (options = {}) => {
    return {
        transformBundle(code) {
            if (options.banner && typeof options.banner === 'string') {
                const content = options.banner;
                const magicStr = new MagicString(code);
                const hasSourceMap = options.sourceMap !== false && options.sourcemap !== false;

                magicStr.prepend(content + '\n');
                const result = { code: magicStr.toString() };

                if (hasSourceMap) {
                    result.map = magicStr.generateMap({ hires: true });
                }
                
                return result;
            }
        }
    };
}

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
        sourcemap: !isProduction
    },
    plugins: [
        json({ exclude: 'node_modules/**', preferConst: true }),
        nodeResolve(),
        commonjs(),
        alias(aliases),
        buble(),
        prependBanner({ banner: annotations })
    ]
};

export default config;