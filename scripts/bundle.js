import esbuild from 'esbuild';
import { resolve } from 'path';

export const ENTRY = './src/index.js';
export const OUTPUT = './bin/enhanced-gog.user.js';

export async function bundle(config = {}) {
    return esbuild.build({
        format: 'iife',
        entryPoints: [resolve(ENTRY)],
        bundle: true,
        outfile: resolve(OUTPUT),
        ...config
    });
}