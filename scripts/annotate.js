import { resolve } from 'path';
import { readFileSync, openSync, writeSync, close } from 'fs';
import { OUTFILE } from './build.js';

const ANNOTATIONS_PATH = './annotations.txt';

export function annotate() {
    // get annotations as a string
    const annotations = readFileSync(resolve(ANNOTATIONS_PATH), 'utf8');

    // open bundled file to write to
    const bundleFile = readFileSync(resolve(OUTFILE));
    const fileDescriptor = openSync(resolve(OUTFILE), 'w+');
    const buffer = Buffer.from(annotations + '\n');

    // write to file
    writeSync(fileDescriptor, buffer, 0, buffer.length, 0);
    writeSync(fileDescriptor, bundleFile, 0, bundleFile.length, buffer.length);

    console.log('\x1b[42m%s\x1b[0m', `Prepended annotations.txt to: ${resolve(OUTFILE)}`);
    close(fileDescriptor, err => {
      if (err) throw err;
    });
}