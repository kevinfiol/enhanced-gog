import servbot from 'servbot';
import esbuild from 'esbuild';
import { resolve } from 'path';
import { annotate } from './annotate.js';

export const OUTFILE = resolve('bin/enhanced-gog.user.js');
const DEV = process.argv.includes('-d');
const ENTRY = resolve('src/index.js');

function logSuccess() {
  console.log('\x1b[42m%s\x1b[0m', `Bundled: ${OUTFILE}`);
}

function logError(msg) {
  console.error('\x1b[41m%s\x1b[0m', msg)
}

/** @type {esbuild.BuildOptions} **/
const config = {
  format: 'iife',
  entryPoints: [ENTRY],
  outfile: OUTFILE,
  bundle: true,
  sourcemap: DEV,
  plugins: [{
    name: 'on-end',
    setup(build) {
      build.onEnd(({ errors }) => {
        if (errors[0]) {
          logError(errors[0]);
          return;
        }

        logSuccess();
        annotate();
      });
    }
  }]
};

const ctx = await esbuild.context(config);

if (DEV) {
  await ctx.watch();

  const server = servbot({
    root: 'bin',
    reload: false
  });

  server.listen(8081);

  // free up resources on close
  process.on('exit', () => {
    ctx.dispose();
    server.close();
  });
} else {
  // run build once && dispose context
  await ctx.rebuild().finally(ctx.dispose);
}