// Pull into a new temporary file so stale local-only credentials cannot survive.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, chmodSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const target = process.argv[2];
const targets = { development: ['development'], qa: ['preview', 'qa'], production: ['production'] };
if (!Object.hasOwn(targets, target)) throw new Error('Usage: npm run env:pull -- development|qa|production');
const directory = mkdtempSync(join(tmpdir(), 'ellison-env-'));
const temporary = join(directory, 'environment');
try {
  const [environment, branch] = targets[target];
  const args = ['env', 'pull', temporary, `--environment=${environment}`, '--yes'];
  if (branch) args.push(`--git-branch=${branch}`);
  const result = spawnSync('vercel', args, { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error('Vercel environment pull failed');
  chmodSync(temporary, 0o600);
  const destination = `.env.${target}`;
  copyFileSync(temporary, destination);
  chmodSync(destination, 0o600);
  console.log(`Updated ${destination}. Secret values may be omitted by Vercel. Next.js does not auto-load .env.qa.`);
} finally {
  rmSync(directory, { recursive: true, force: true });
}
