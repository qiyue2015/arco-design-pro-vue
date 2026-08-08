import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  assertReleaseVersion,
  assertSourceCommit,
  parseArgs,
  readJson,
} from './lib.mjs';

const args = parseArgs(process.argv.slice(2));
['target', 'status', 'tag', 'source-commit'].forEach((name) => {
  if (typeof args[name] !== 'string') throw new Error(`--${name} is required`);
});

const statuses = new Set(['changed', 'already-applied', 'no-change']);
if (!statuses.has(args.status)) {
  throw new Error(`Unknown sync status: ${args.status}`);
}

const targetPath = path.resolve(args.target);
const remote = args.remote || 'origin';
const branch = args.branch || 'main';
const tag = args.tag;
const sourceCommit = args['source-commit'].toLowerCase();
assertSourceCommit(sourceCommit);

if (!/^v/.test(tag)) throw new Error(`Release tag must start with v: ${tag}`);
assertReleaseVersion(tag.slice(1), 'release tag');
if (!/^[A-Za-z0-9._/-]+$/.test(remote) || remote.startsWith('-')) {
  throw new Error(`Invalid Git remote: ${remote}`);
}
if (!/^[A-Za-z0-9._/-]+$/.test(branch) || branch.startsWith('-')) {
  throw new Error(`Invalid Git branch: ${branch}`);
}
if (!fs.existsSync(path.join(targetPath, '.git'))) {
  throw new Error(`Target is not a Git checkout: ${targetPath}`);
}

function runGit(gitArgs, allowedStatuses = [0]) {
  const result = spawnSync('git', gitArgs, {
    cwd: targetPath,
    encoding: 'utf8',
  });
  if (!allowedStatuses.includes(result.status)) {
    throw new Error(
      `git ${gitArgs.join(' ')} failed (${
        result.status
      }): ${result.stderr.trim()}`
    );
  }
  return result;
}

function remoteHasTag() {
  const result = runGit(
    ['ls-remote', '--exit-code', '--tags', remote, `refs/tags/${tag}`],
    [0, 2]
  );
  return result.status === 0;
}

function assertReleaseMetadata() {
  const metadataPath = path.join(targetPath, '.release-source.json');
  if (!fs.existsSync(metadataPath)) {
    throw new Error(`Release metadata is missing: ${metadataPath}`);
  }
  const metadata = readJson(metadataPath);
  if (
    metadata.schemaVersion !== 1 ||
    metadata.version !== tag.slice(1) ||
    metadata.sourceCommit?.toLowerCase() !== sourceCommit
  ) {
    throw new Error('Release metadata does not match the requested publish');
  }
}

function output(action) {
  process.stdout.write(
    `${JSON.stringify({ status: args.status, action, branch, tag }, null, 2)}\n`
  );
}

if (args.status === 'no-change') {
  output('skipped-no-change');
  process.exit(0);
}

assertReleaseMetadata();
if (remoteHasTag()) {
  output('already-tagged');
  process.exit(0);
}

runGit(['config', 'user.name', 'github-actions[bot]']);
runGit([
  'config',
  'user.email',
  '41898282+github-actions[bot]@users.noreply.github.com',
]);

if (args.status === 'changed') {
  if (typeof args.message !== 'string') {
    throw new Error('--message is required when sync status is changed');
  }
  const messagePath = path.resolve(args.message);
  if (!fs.existsSync(messagePath) || !fs.statSync(messagePath).isFile()) {
    throw new Error(`Commit message file does not exist: ${messagePath}`);
  }

  runGit(['add', '-A']);
  const staged = runGit(['diff', '--cached', '--quiet'], [0, 1]);
  if (staged.status === 0) {
    throw new Error('Sync reported changes but produced no staged diff');
  }
  runGit(['commit', '--file', messagePath]);
  runGit(['push', remote, `HEAD:${branch}`]);
} else {
  const status = runGit(['status', '--porcelain']).stdout.trim();
  if (status) {
    throw new Error('Already-applied publish requires a clean checkout');
  }
}

const head = runGit(['rev-parse', 'HEAD']).stdout.trim();
const localTag = runGit(
  ['rev-parse', '--verify', '--quiet', `refs/tags/${tag}^{commit}`],
  [0, 1]
);
if (localTag.status === 0) {
  if (localTag.stdout.trim() !== head) {
    throw new Error(`Local tag ${tag} does not point to HEAD`);
  }
} else {
  runGit(['tag', '-a', tag, '-m', `Release ${tag} from ${sourceCommit}`]);
}
runGit(['push', remote, `refs/tags/${tag}`]);
output(
  args.status === 'changed' ? 'committed-and-tagged' : 'tagged-existing-commit'
);
