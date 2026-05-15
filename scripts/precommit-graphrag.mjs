// Pre-commit hook: rebuild the GraphRAG bundle and re-stage it
// whenever graphrag-pipeline.jsx or main.jsx is part of the commit.
// Skips silently for any commit that doesn't touch those files.

import { execSync } from 'node:child_process';

const watchedFiles = new Set([
  'graphrag/graphrag-pipeline.jsx',
  'graphrag/main.jsx'
]);

const stagedRaw = execSync('git diff --cached --name-only --diff-filter=ACMR', {
  encoding: 'utf8'
});
const staged = stagedRaw.split('\n').map(s => s.trim()).filter(Boolean);

const triggered = staged.some(f => watchedFiles.has(f));
if (!triggered) process.exit(0);

console.log('• graphrag source changed — rebuilding bundle…');
try {
  execSync('npm run --silent build:graphrag', { stdio: 'inherit' });
  execSync('git add graphrag/graphrag-pipeline.bundle.js', { stdio: 'inherit' });
  console.log('• bundle re-staged.');
} catch (err) {
  console.error('\n✗ Pre-commit build failed. Fix the error above, then commit again.');
  process.exit(1);
}
