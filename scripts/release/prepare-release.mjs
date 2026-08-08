import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  assertReleaseVersion,
  assertSourceCommit,
  loadReleaseConfig,
  parseArgs,
  readJson,
  writeJson,
} from './lib.mjs';

const args = parseArgs(process.argv.slice(2));
const requiredArgs = [
  'full-target',
  'simple-target',
  'source-commit',
  'message-output',
  'metadata-output',
];
requiredArgs.forEach((name) => {
  if (typeof args[name] !== 'string') throw new Error(`--${name} is required`);
});

const { config } = loadReleaseConfig(args.config);
const sourceCommit = args['source-commit'].toLowerCase();
assertSourceCommit(sourceCommit);

function runGit(gitArgs, options = {}) {
  const result = spawnSync('git', gitArgs, { encoding: 'utf8', ...options });
  if (result.status !== 0) {
    throw new Error(`git ${gitArgs.join(' ')} failed: ${result.stderr.trim()}`);
  }
  return result.stdout.trim();
}

const currentHead = runGit(['rev-parse', 'HEAD']).toLowerCase();
if (currentHead !== sourceCommit) {
  throw new Error(
    `Source commit ${sourceCommit} does not match HEAD ${currentHead}`
  );
}

function loadTargetMetadata(targetPath) {
  const metadataPath = path.join(targetPath, '.release-source.json');
  if (!fs.existsSync(metadataPath)) {
    const tags = runGit(['-C', targetPath, 'tag', '--list', 'v*']);
    if (tags) {
      throw new Error(
        `${targetPath} has release tags but no .release-source.json metadata`
      );
    }
    return null;
  }

  const metadata = readJson(metadataPath);
  if (
    metadata.schemaVersion !== 1 ||
    metadata.sourceRepository !== config.sourceRepository
  ) {
    throw new Error(`Invalid release metadata in ${metadataPath}`);
  }
  assertReleaseVersion(metadata.version, 'metadata version');
  assertSourceCommit(metadata.sourceCommit);
  return metadata;
}

function previousCandidate(metadata) {
  if (!metadata) return null;
  if (metadata.version === config.version) {
    if (metadata.sourceCommit.toLowerCase() !== sourceCommit) {
      throw new Error(
        `Version ${config.version} is already associated with ${metadata.sourceCommit}`
      );
    }
    return metadata.previousRelease || null;
  }
  return {
    version: metadata.version,
    sourceCommit: metadata.sourceCommit.toLowerCase(),
  };
}

const metadataEntries = [
  loadTargetMetadata(path.resolve(args['full-target'])),
  loadTargetMetadata(path.resolve(args['simple-target'])),
];
const candidates = metadataEntries
  .map(previousCandidate)
  .filter(Boolean)
  .map((entry) => ({
    version: entry.version,
    sourceCommit: entry.sourceCommit.toLowerCase(),
  }));
const uniqueCandidates = new Map(
  candidates.map((entry) => [`${entry.version}:${entry.sourceCommit}`, entry])
);
if (uniqueCandidates.size > 1) {
  throw new Error(
    'Release repositories disagree about the previous source release'
  );
}

const previousRelease = uniqueCandidates.values().next().value || null;
let changes = ['Initial release'];
let previousDescription = 'initial release';

if (previousRelease) {
  assertReleaseVersion(previousRelease.version, 'previous release version');
  assertSourceCommit(previousRelease.sourceCommit);
  runGit(['cat-file', '-e', `${previousRelease.sourceCommit}^{commit}`]);
  const ancestorCheck = spawnSync('git', [
    'merge-base',
    '--is-ancestor',
    previousRelease.sourceCommit,
    sourceCommit,
  ]);
  if (ancestorCheck.status !== 0) {
    throw new Error(
      `Previous source ${previousRelease.sourceCommit} is not an ancestor of ${sourceCommit}`
    );
  }

  changes = runGit([
    'log',
    '--no-merges',
    '--format=%s',
    `${previousRelease.sourceCommit}..${sourceCommit}`,
  ])
    .split('\n')
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (!changes.length) changes = ['Generated output changed'];
  previousDescription = `v${previousRelease.version} (${previousRelease.sourceCommit})`;
}

const title = `chore(release): sync v${config.version}`;
const message = [
  title,
  '',
  `Source repository: ${config.sourceRepository}`,
  `Source commit: ${sourceCommit}`,
  `Previous release: ${previousDescription}`,
  '',
  'Changes:',
  ...changes.map((entry) => `- ${entry}`),
  '',
].join('\n');
const releaseMetadata = {
  schemaVersion: 1,
  version: config.version,
  sourceRepository: config.sourceRepository,
  sourceCommit,
  previousRelease,
};

fs.mkdirSync(path.dirname(path.resolve(args['message-output'])), {
  recursive: true,
});
fs.writeFileSync(path.resolve(args['message-output']), message);
writeJson(path.resolve(args['metadata-output']), releaseMetadata);
process.stdout.write(message);
