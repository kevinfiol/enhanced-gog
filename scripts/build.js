import servbot from 'servbot';
import esbuild from 'esbuild';
import { resolve } from 'path';
import { annotate } from './annotate.js';

// https://github.com/evanw/esbuild/blob/main/CHANGELOG.md#0170

export const OUTFILE = resolve('bin/enhanced-gog.user.js');

const DEV = process.argv.includes('-d');
const ENTRY = resolve('src/index.js');
const SERVER_PORT = 8081;

function logSuccess() {
  console.log('\x1b[42m%s\x1b[0m', `Bundled: ${OUTFILE}`);
}

function logError(msg) {
  console.error('\x1b[41m%s\x1b[0m', msg)
}

function bundle(config = {}) {
  return esbuild.build({
    format: 'iife',
    entryPoints: [ENTRY],
    outfile: OUTFILE,
    bundle: true,
    ...config
  });
}

let config = {};

if (DEV) {
  const server = servbot({
    root: 'bin',
    reload: false
  });

  server.listen(SERVER_PORT);

  config = {
    sourcemap: true,
    watch: {
      onRebuild(error) {
        if (error) return logError(error);
        logSuccess();
        annotate();
      }
    }
  };
}

bundle(config)
  .then(logSuccess)
  .then(annotate)
  .catch((error) => {
    logError(error);
    process.exit(1);
  });