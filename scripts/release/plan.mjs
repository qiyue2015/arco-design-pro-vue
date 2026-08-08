import { spawnSync } from 'node:child_process';
import { appendGitHubOutput, loadReleaseConfig, parseArgs } from './lib.mjs';

const args = parseArgs(process.argv.slice(2));
const { config } = loadReleaseConfig(args.config);
const tag = `v${config.version}`;
const remoteUrlTemplate =
  args['remote-url-template'] || 'https://github.com/{repository}.git';
if (!remoteUrlTemplate.includes('{repository}')) {
  throw new Error('--remote-url-template must contain {repository}');
}

function remoteHasTag(repository) {
  const remoteUrl = remoteUrlTemplate.replace('{repository}', repository);
  const result = spawnSync(
    'git',
    ['ls-remote', '--exit-code', '--tags', remoteUrl, `refs/tags/${tag}`],
    { encoding: 'utf8' }
  );

  if (result.status === 0) return true;
  if (result.status === 2) return false;
  throw new Error(
    `Unable to inspect ${repository} tag ${tag}: ${result.stderr.trim()}`
  );
}

const fullSynced = remoteHasTag(config.editions.full.repository);
const simpleSynced = remoteHasTag(config.editions.simple.repository);
const plan = {
  version: config.version,
  tag,
  sourceRepository: config.sourceRepository,
  fullRepository: config.editions.full.repository,
  simpleRepository: config.editions.simple.repository,
  fullSynced,
  simpleSynced,
  publishNeeded: !fullSynced || !simpleSynced,
};

appendGitHubOutput(args['github-output'], {
  version: plan.version,
  tag: plan.tag,
  source_repository: plan.sourceRepository,
  full_repository: plan.fullRepository,
  simple_repository: plan.simpleRepository,
  full_needs_publish: !plan.fullSynced,
  simple_needs_publish: !plan.simpleSynced,
  publish_needed: plan.publishNeeded,
});

process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
