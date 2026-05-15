import { build } from 'esbuild';
import { stat } from 'node:fs/promises';

const outfile = 'graphrag/graphrag-pipeline.bundle.js';

await build({
  entryPoints: ['graphrag/main.jsx'],
  bundle: true,
  format: 'iife',
  outfile,
  minify: true,
  target: ['es2019'],
  jsx: 'automatic',
  loader: { '.jsx': 'jsx' },
  define: { 'process.env.NODE_ENV': '"production"' },
  legalComments: 'none',
  logLevel: 'info'
});

const { size } = await stat(outfile);
const kb = (size / 1024).toFixed(1);
console.log(`\n✓ Built ${outfile} (${kb} KB)`);
