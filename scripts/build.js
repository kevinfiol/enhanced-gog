import esbuild from 'esbuild';
import { readFileSync, openSync, writeSync, close } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

const ENTRY = '../src/index.js';
const OUTPUT = '../bin/enhanced-gog.user.js';
const ANNOTATIONS_PATH = '../annotations.txt';

build(ENTRY, OUTPUT, { format: 'iife', minify: false });

function build(entry, outfile, config = {}) {
    const opts = {
        entryPoints: [join(__dirname, entry)],
        bundle: true,
        outfile: join(__dirname, outfile),
        ...config
    };

    esbuild.build(opts).then(() => {
        console.log('\x1b[42m%s\x1b[0m', `Bundled: ${outfile}`);
    }).then(() => {
        // get annotations as a string
        const annotations = readFileSync(join(__dirname, ANNOTATIONS_PATH), 'utf8');

        // open bundled file to write to
        const bundleFile = readFileSync(join(__dirname, outfile));
        const fileDescriptor = openSync(join(__dirname, outfile), 'w+');
        const buffer = Buffer.from(annotations + '\n');

        // write to file
        writeSync(fileDescriptor, buffer, 0, buffer.length, 0);
        writeSync(fileDescriptor, bundleFile, 0, bundleFile.length, buffer.length);

        console.log('\x1b[42m%s\x1b[0m', `Prepended annotations.txt to: ${outfile}`);
        close(fileDescriptor, err => {
            if (err) throw err;
        });
    }).catch((e) => {
        console.error('\x1b[41m%s\x1b[0m', e.message);
    });
}