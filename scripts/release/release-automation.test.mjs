import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
);
const releaseScripts = path.join(repositoryRoot, 'scripts/release');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || repositoryRoot,
    env: { ...process.env, ...options.env },
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} failed (${result.status})\n${
        result.stdout
      }\n${result.stderr}`
    );
  }
  return result;
}

function runNode(script, args, options = {}) {
  return run(
    process.execPath,
    [path.join(releaseScripts, script), ...args],
    options
  );
}

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function writeJson(filePath, value) {
  write(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function makeTempDirectory(name) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `${name}-`));
}

function initRepository(directory) {
  fs.mkdirSync(directory, { recursive: true });
  run('git', ['init', '-b', 'main', directory]);
  run('git', ['-C', directory, 'config', 'user.name', 'Release Test']);
  run('git', [
    '-C',
    directory,
    'config',
    'user.email',
    'release-test@example.com',
  ]);
}

function initBareRepository(directory) {
  fs.mkdirSync(path.dirname(directory), { recursive: true });
  run('git', ['init', '--bare', '-b', 'main', directory]);
}

function seedRemote(directory) {
  const remote = path.join(directory, 'remote.git');
  const seed = path.join(directory, 'seed');
  initBareRepository(remote);
  initRepository(seed);
  const base = commitFile(seed, 'README.md', 'baseline\n', 'chore: baseline');
  run('git', ['-C', seed, 'remote', 'add', 'origin', remote]);
  run('git', ['-C', seed, 'push', '-u', 'origin', 'main']);
  return { remote, base };
}

function cloneRemote(remote, directory) {
  run('git', ['clone', '--branch', 'main', remote, directory]);
  run('git', ['-C', directory, 'config', 'user.name', 'Release Test']);
  run('git', [
    '-C',
    directory,
    'config',
    'user.email',
    'release-test@example.com',
  ]);
  return directory;
}

function remoteRef(remote, ref) {
  return run('git', ['--git-dir', remote, 'rev-parse', ref]).stdout.trim();
}

function remoteHasRef(remote, ref) {
  const result = spawnSync(
    'git',
    ['--git-dir', remote, 'show-ref', '--verify', '--quiet', ref],
    { encoding: 'utf8' }
  );
  assert.ok([0, 1].includes(result.status));
  return result.status === 0;
}

function writeReleaseMetadata(target, sourceCommit, version = '1.1.0') {
  writeJson(path.join(target, '.release-source.json'), {
    schemaVersion: 1,
    version,
    sourceRepository: 'owner/source',
    sourceCommit,
    previousRelease: null,
  });
}

function publishArgs(
  target,
  status,
  sourceCommit,
  messagePath,
  tag = 'v1.1.0'
) {
  const args = [
    path.join(releaseScripts, 'publish-release.mjs'),
    '--target',
    target,
    '--status',
    status,
    '--tag',
    tag,
    '--source-commit',
    sourceCommit,
  ];
  if (messagePath) args.push('--message', messagePath);
  return args;
}

function publish(target, status, sourceCommit, messagePath, tag) {
  const result = run(
    process.execPath,
    publishArgs(target, status, sourceCommit, messagePath, tag)
  );
  return JSON.parse(result.stdout);
}

function commitFile(directory, relativePath, content, subject) {
  write(path.join(directory, relativePath), content);
  run('git', ['-C', directory, 'add', relativePath]);
  run('git', ['-C', directory, 'commit', '-m', subject]);
  return run('git', ['-C', directory, 'rev-parse', 'HEAD']).stdout.trim();
}

function createConfig(directory, version = '1.1.0') {
  const configPath = path.join(directory, 'release-version.json');
  writeJson(configPath, {
    schemaVersion: 1,
    version,
    sourceRepository: 'owner/source',
    editions: {
      full: {
        repository: 'owner/full',
        managedRoots: ['config', 'src'],
        preservePaths: ['.github', 'README.md', 'config/keep.ts'],
      },
      simple: {
        repository: 'owner/simple',
        managedRoots: ['config', 'src'],
        preservePaths: ['.github', 'README.md', 'config/keep.ts'],
      },
    },
  });
  return configPath;
}

function parseGitHubOutput(filePath) {
  return Object.fromEntries(
    fs
      .readFileSync(filePath, 'utf8')
      .trim()
      .split('\n')
      .map((line) => line.split('='))
  );
}

function createSourceHistory(directory) {
  initRepository(directory);
  const base = commitFile(directory, 'source.txt', 'base\n', 'chore: base');
  commitFile(directory, 'feature.txt', 'feature\n', 'feat: add feature');
  run('git', ['-C', directory, 'checkout', '-b', 'side']);
  commitFile(directory, 'fix.txt', 'fix\n', 'fix: repair route');
  run('git', ['-C', directory, 'checkout', 'main']);
  commitFile(directory, 'docs.txt', 'docs\n', 'docs: update guide');
  run('git', ['-C', directory, 'merge', '--no-ff', 'side', '-m', 'merge side']);
  const head = run('git', ['-C', directory, 'rev-parse', 'HEAD']).stdout.trim();
  return { base, head };
}

test('release plan handles initial, complete, and one-sided publication', () => {
  const directory = makeTempDirectory('release-plan');
  const configPath = createConfig(directory);
  const outputPath = path.join(directory, 'github-output');
  const binPath = path.join(directory, 'bin');
  fs.mkdirSync(binPath);
  const fakeGit = path.join(binPath, 'git');
  write(
    fakeGit,
    `#!/usr/bin/env node
const args = process.argv.slice(2).join(' ');
const isFull = args.includes('/owner/full.git');
const exists = isFull ? process.env.MOCK_FULL_TAG : process.env.MOCK_SIMPLE_TAG;
process.exit(exists === 'true' ? 0 : 2);
`
  );
  fs.chmodSync(fakeGit, 0o755);

  const cases = [
    [false, false, 'true', 'true', 'true'],
    [true, true, 'false', 'false', 'false'],
    [true, false, 'false', 'true', 'true'],
    [false, true, 'true', 'false', 'true'],
  ];

  cases.forEach(([full, simple, fullNeeds, simpleNeeds, publishNeeds]) => {
    fs.rmSync(outputPath, { force: true });
    runNode(
      'plan.mjs',
      ['--config', configPath, '--github-output', outputPath],
      {
        env: {
          PATH: `${binPath}${path.delimiter}${process.env.PATH}`,
          MOCK_FULL_TAG: String(full),
          MOCK_SIMPLE_TAG: String(simple),
        },
      }
    );
    const output = parseGitHubOutput(outputPath);
    assert.equal(output.full_needs_publish, fullNeeds);
    assert.equal(output.simple_needs_publish, simpleNeeds);
    assert.equal(output.publish_needed, publishNeeds);
  });
});

test('release message records initial and non-merge source ranges', () => {
  const directory = makeTempDirectory('release-message');
  const sourcePath = path.join(directory, 'source');
  const fullTarget = path.join(directory, 'full');
  const simpleTarget = path.join(directory, 'simple');
  const { base, head } = createSourceHistory(sourcePath);
  initRepository(fullTarget);
  initRepository(simpleTarget);
  const configPath = createConfig(directory);

  const prepare = (suffix) => {
    const messagePath = path.join(directory, `message-${suffix}`);
    const metadataPath = path.join(directory, `metadata-${suffix}.json`);
    runNode(
      'prepare-release.mjs',
      [
        '--config',
        configPath,
        '--full-target',
        fullTarget,
        '--simple-target',
        simpleTarget,
        '--source-commit',
        head,
        '--message-output',
        messagePath,
        '--metadata-output',
        metadataPath,
      ],
      { cwd: sourcePath }
    );
    return {
      message: fs.readFileSync(messagePath, 'utf8'),
      metadata: JSON.parse(fs.readFileSync(metadataPath, 'utf8')),
    };
  };

  const initial = prepare('initial');
  assert.match(initial.message, /^chore\(release\): sync v1\.1\.0/m);
  assert.match(initial.message, new RegExp(`Source commit: ${head}`));
  assert.match(initial.message, /Previous release: initial release/);
  assert.match(initial.message, /- Initial release/);

  const previousMetadata = {
    schemaVersion: 1,
    version: '1.0.0',
    sourceRepository: 'owner/source',
    sourceCommit: base,
    previousRelease: null,
  };
  writeJson(path.join(fullTarget, '.release-source.json'), previousMetadata);
  writeJson(path.join(simpleTarget, '.release-source.json'), previousMetadata);
  const ranged = prepare('ranged');
  assert.match(
    ranged.message,
    new RegExp(`Previous release: v1.0.0 \\(${base}\\)`)
  );
  assert.match(ranged.message, /- feat: add feature/);
  assert.match(ranged.message, /- fix: repair route/);
  assert.match(ranged.message, /- docs: update guide/);
  assert.doesNotMatch(ranged.message, /merge side/);

  writeJson(path.join(fullTarget, '.release-source.json'), {
    ...ranged.metadata,
    previousRelease: { version: '1.0.0', sourceCommit: base },
  });
  const recovered = prepare('one-sided-recovery');
  assert.equal(recovered.message, ranged.message);
  assert.deepEqual(recovered.metadata.previousRelease, {
    version: '1.0.0',
    sourceCommit: base,
  });
});

test('safe sync preserves owned files, removes stale files, and excludes artifacts', () => {
  const directory = makeTempDirectory('release-sync');
  const generated = path.join(directory, 'generated');
  const target = path.join(directory, 'target');
  const configPath = createConfig(directory);
  const sourceCommit = 'a'.repeat(40);
  const metadataPath = path.join(directory, 'metadata.json');
  const metadata = {
    schemaVersion: 1,
    version: '1.1.0',
    sourceRepository: 'owner/source',
    sourceCommit,
    previousRelease: null,
  };
  writeJson(metadataPath, metadata);

  writeJson(path.join(generated, 'package.json'), { name: 'generated' });
  write(path.join(generated, 'src/current.ts'), 'current\n');
  write(path.join(generated, 'config/current.ts'), 'current config\n');
  write(path.join(generated, 'config/keep.ts'), 'generated keep\n');
  write(path.join(generated, 'README.md'), 'generated readme\n');
  write(path.join(generated, '.github/workflows/generated.yml'), 'generated\n');
  write(path.join(generated, 'node_modules/ignored.js'), 'ignored\n');
  write(path.join(generated, 'dist/ignored.js'), 'ignored\n');
  write(path.join(generated, '.DS_Store'), 'ignored\n');
  write(path.join(generated, '.eslintcache'), 'ignored\n');
  write(path.join(generated, '.stylelintcache'), 'ignored\n');
  write(path.join(generated, '.tmp/state'), 'ignored\n');
  write(path.join(generated, 'tmp/state'), 'ignored\n');
  write(path.join(generated, 'temp/state'), 'ignored\n');
  write(path.join(generated, 'scratch.tmp'), 'ignored\n');
  write(path.join(generated, 'editor-backup~'), 'ignored\n');
  writeJson(path.join(generated, '.release-manifest.json'), { ignored: true });
  writeJson(path.join(generated, '.release-source.json'), metadata);

  initRepository(target);
  write(path.join(target, 'src/stale.ts'), 'stale\n');
  write(path.join(target, 'config/stale.ts'), 'stale config\n');
  write(path.join(target, 'config/keep.ts'), 'target keep\n');
  write(path.join(target, 'README.md'), 'target readme\n');
  write(path.join(target, '.github/workflows/deploy.yml'), 'target workflow\n');
  write(path.join(target, 'target-only.txt'), 'target only\n');
  run('git', ['-C', target, 'add', '-A']);
  run('git', ['-C', target, 'commit', '-m', 'chore: target baseline']);

  const sync = () => {
    const result = runNode('sync-generated.mjs', [
      '--config',
      configPath,
      '--generated',
      generated,
      '--target',
      target,
      '--edition',
      'full',
      '--source-commit',
      sourceCommit,
      '--metadata',
      metadataPath,
    ]);
    return JSON.parse(result.stdout);
  };

  const first = sync();
  assert.equal(first.status, 'changed');
  assert.equal(fs.existsSync(path.join(target, 'src/stale.ts')), false);
  assert.equal(fs.existsSync(path.join(target, 'config/stale.ts')), false);
  assert.equal(
    fs.readFileSync(path.join(target, 'config/keep.ts'), 'utf8'),
    'target keep\n'
  );
  assert.equal(
    fs.readFileSync(path.join(target, 'README.md'), 'utf8'),
    'target readme\n'
  );
  assert.equal(
    fs.existsSync(path.join(target, '.github/workflows/deploy.yml')),
    true
  );
  assert.equal(fs.existsSync(path.join(target, 'target-only.txt')), true);
  assert.equal(fs.existsSync(path.join(target, 'node_modules')), false);
  assert.equal(fs.existsSync(path.join(target, 'dist')), false);
  assert.equal(fs.existsSync(path.join(target, '.DS_Store')), false);
  assert.equal(fs.existsSync(path.join(target, '.eslintcache')), false);
  assert.equal(fs.existsSync(path.join(target, '.stylelintcache')), false);
  assert.equal(fs.existsSync(path.join(target, '.tmp')), false);
  assert.equal(fs.existsSync(path.join(target, 'tmp')), false);
  assert.equal(fs.existsSync(path.join(target, 'temp')), false);
  assert.equal(fs.existsSync(path.join(target, 'scratch.tmp')), false);
  assert.equal(fs.existsSync(path.join(target, 'editor-backup~')), false);

  run('git', ['-C', target, 'add', '-A']);
  const staged = run('git', [
    '-C',
    target,
    'diff',
    '--cached',
    '--name-only',
  ]).stdout;
  assert.doesNotMatch(
    staged,
    /node_modules|dist|\.tmp|\/tmp|\/temp|DS_Store|eslintcache|stylelintcache|scratch\.tmp|editor-backup~/
  );
  run('git', ['-C', target, 'commit', '-m', 'chore: generated baseline']);

  const manifestPath = path.join(target, '.release-manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  write(path.join(target, 'src/retired.ts'), 'retired\n');
  manifest.files.push('src/retired.ts');
  writeJson(manifestPath, manifest);
  const deletion = sync();
  assert.equal(deletion.changed, true);
  assert.equal(fs.existsSync(path.join(target, 'src/retired.ts')), false);

  writeJson(path.join(target, '.release-source.json'), {
    ...metadata,
    version: '1.0.0',
    sourceCommit: 'b'.repeat(40),
  });
  const noChange = sync();
  assert.equal(noChange.status, 'no-change');
  assert.equal(noChange.changed, false);
  assert.equal(noChange.alreadyApplied, false);

  write(path.join(directory, 'outside.txt'), 'outside\n');
  writeJson(manifestPath, {
    schemaVersion: 1,
    edition: 'full',
    files: ['../outside.txt'],
  });
  const unsafe = spawnSync(
    process.execPath,
    [
      path.join(releaseScripts, 'sync-generated.mjs'),
      '--config',
      configPath,
      '--generated',
      generated,
      '--target',
      target,
      '--edition',
      'full',
      '--source-commit',
      sourceCommit,
      '--metadata',
      metadataPath,
    ],
    { encoding: 'utf8' }
  );
  assert.notEqual(unsafe.status, 0);
  assert.match(unsafe.stderr, /safe repository-relative path/);
  assert.equal(
    fs.readFileSync(path.join(directory, 'outside.txt'), 'utf8'),
    'outside\n'
  );
});

test('safe sync rejects an empty generated directory', () => {
  const directory = makeTempDirectory('release-empty');
  const generated = path.join(directory, 'generated');
  const target = path.join(directory, 'target');
  fs.mkdirSync(generated);
  initRepository(target);
  const configPath = createConfig(directory);
  const sourceCommit = 'c'.repeat(40);
  const metadataPath = path.join(directory, 'metadata.json');
  writeJson(metadataPath, {
    schemaVersion: 1,
    version: '1.1.0',
    sourceRepository: 'owner/source',
    sourceCommit,
    previousRelease: null,
  });

  const result = spawnSync(
    process.execPath,
    [
      path.join(releaseScripts, 'sync-generated.mjs'),
      '--config',
      configPath,
      '--generated',
      generated,
      '--target',
      target,
      '--edition',
      'full',
      '--source-commit',
      sourceCommit,
      '--metadata',
      metadataPath,
    ],
    { encoding: 'utf8' }
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /must contain package.json/);
});

test('safe sync rejects a manifest from another edition', () => {
  const directory = makeTempDirectory('release-wrong-edition');
  const generated = path.join(directory, 'generated');
  const target = path.join(directory, 'target');
  const configPath = createConfig(directory);
  const sourceCommit = '3'.repeat(40);
  const metadataPath = path.join(directory, 'metadata.json');
  const targetOwnedPath = path.join(target, 'target-owned.txt');
  writeJson(path.join(generated, 'package.json'), { name: 'generated' });
  initRepository(target);
  write(targetOwnedPath, 'must survive\n');
  writeJson(path.join(target, '.release-manifest.json'), {
    schemaVersion: 1,
    edition: 'simple',
    files: ['target-owned.txt'],
  });
  writeJson(metadataPath, {
    schemaVersion: 1,
    version: '1.1.0',
    sourceRepository: 'owner/source',
    sourceCommit,
    previousRelease: null,
  });

  const result = spawnSync(
    process.execPath,
    [
      path.join(releaseScripts, 'sync-generated.mjs'),
      '--config',
      configPath,
      '--generated',
      generated,
      '--target',
      target,
      '--edition',
      'full',
      '--source-commit',
      sourceCommit,
      '--metadata',
      metadataPath,
    ],
    { encoding: 'utf8' }
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Invalid release manifest/);
  assert.equal(fs.readFileSync(targetOwnedPath, 'utf8'), 'must survive\n');
});

test('safe sync rejects a dangling target symlink with an existing manifest', () => {
  const directory = makeTempDirectory('release-dangling-symlink');
  const generated = path.join(directory, 'generated');
  const target = path.join(directory, 'target');
  const configPath = createConfig(directory);
  const sourceCommit = '4'.repeat(40);
  const metadataPath = path.join(directory, 'metadata.json');
  const linkPath = path.join(target, 'src/escape.txt');
  const outsidePath = path.join(directory, 'outside.txt');
  writeJson(path.join(generated, 'package.json'), { name: 'generated' });
  write(path.join(generated, 'src/escape.txt'), 'generated\n');
  initRepository(target);
  writeJson(path.join(target, '.release-manifest.json'), {
    schemaVersion: 1,
    edition: 'full',
    files: ['package.json', 'src/escape.txt'],
  });
  fs.mkdirSync(path.dirname(linkPath), { recursive: true });
  fs.symlinkSync('../../outside.txt', linkPath);
  writeJson(metadataPath, {
    schemaVersion: 1,
    version: '1.1.0',
    sourceRepository: 'owner/source',
    sourceCommit,
    previousRelease: null,
  });

  const result = spawnSync(
    process.execPath,
    [
      path.join(releaseScripts, 'sync-generated.mjs'),
      '--config',
      configPath,
      '--generated',
      generated,
      '--target',
      target,
      '--edition',
      'full',
      '--source-commit',
      sourceCommit,
      '--metadata',
      metadataPath,
    ],
    { encoding: 'utf8' }
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Refusing to follow target symbolic link/);
  assert.equal(fs.existsSync(outsidePath), false);
  assert.equal(fs.lstatSync(linkPath).isSymbolicLink(), true);
});

test('publish creates a normal commit, pushes main, and pushes the release tag', () => {
  const directory = makeTempDirectory('release-publish-changed');
  const { remote, base } = seedRemote(directory);
  const target = cloneRemote(remote, path.join(directory, 'target'));
  const sourceCommit = 'd'.repeat(40);
  const messagePath = path.join(directory, 'message.txt');
  write(messagePath, 'chore(release): sync v1.1.0\n');
  write(path.join(target, 'generated.txt'), 'generated\n');
  writeReleaseMetadata(target, sourceCommit);

  const result = publish(target, 'changed', sourceCommit, messagePath);
  const remoteHead = remoteRef(remote, 'refs/heads/main');
  assert.equal(result.action, 'committed-and-tagged');
  assert.notEqual(remoteHead, base);
  assert.equal(remoteRef(remote, 'refs/tags/v1.1.0^{commit}'), remoteHead);
  assert.equal(
    run('git', [
      '--git-dir',
      remote,
      'log',
      '-1',
      '--pretty=%s',
      'main',
    ]).stdout.trim(),
    'chore(release): sync v1.1.0'
  );
  assert.equal(
    Number(
      run('git', ['--git-dir', remote, 'rev-list', '--count', 'main']).stdout
    ),
    2
  );
});

test('publish recovers a pushed commit whose tag push failed without another commit', () => {
  const directory = makeTempDirectory('release-publish-recovery');
  const { remote, base } = seedRemote(directory);
  const target = cloneRemote(remote, path.join(directory, 'target'));
  const sourceCommit = 'e'.repeat(40);
  const messagePath = path.join(directory, 'message.txt');
  const hookPath = path.join(remote, 'hooks', 'pre-receive');
  write(messagePath, 'chore(release): sync v1.1.0\n');
  write(path.join(target, 'generated.txt'), 'generated\n');
  writeReleaseMetadata(target, sourceCommit);
  write(
    hookPath,
    `#!/bin/sh
while read old_value new_value ref_name; do
  case "$ref_name" in
    refs/tags/*) echo "tag rejected for recovery test" >&2; exit 1 ;;
  esac
done
exit 0
`
  );
  fs.chmodSync(hookPath, 0o755);

  const interrupted = spawnSync(
    process.execPath,
    publishArgs(target, 'changed', sourceCommit, messagePath),
    { cwd: repositoryRoot, encoding: 'utf8' }
  );
  assert.notEqual(interrupted.status, 0);
  assert.match(
    interrupted.stderr,
    /git push origin refs\/tags\/v1\.1\.0 failed/
  );
  const publishedHead = remoteRef(remote, 'refs/heads/main');
  assert.notEqual(publishedHead, base);
  assert.equal(remoteHasRef(remote, 'refs/tags/v1.1.0'), false);

  fs.renameSync(hookPath, `${hookPath}.disabled`);
  const retry = cloneRemote(remote, path.join(directory, 'retry'));
  const commitCount = remoteRef(remote, 'refs/heads/main');
  const recovered = publish(retry, 'already-applied', sourceCommit);
  assert.equal(recovered.action, 'tagged-existing-commit');
  assert.equal(remoteRef(remote, 'refs/heads/main'), commitCount);
  assert.equal(remoteRef(remote, 'refs/tags/v1.1.0^{commit}'), publishedHead);
});

test('publish succeeds idempotently when the remote tag already exists', () => {
  const directory = makeTempDirectory('release-publish-tagged');
  const { remote } = seedRemote(directory);
  const first = cloneRemote(remote, path.join(directory, 'first'));
  const sourceCommit = 'f'.repeat(40);
  const messagePath = path.join(directory, 'message.txt');
  write(messagePath, 'chore(release): sync v1.1.0\n');
  write(path.join(first, 'generated.txt'), 'generated\n');
  writeReleaseMetadata(first, sourceCommit);
  publish(first, 'changed', sourceCommit, messagePath);

  const before = remoteRef(remote, 'refs/heads/main');
  const retry = cloneRemote(remote, path.join(directory, 'retry'));
  write(path.join(retry, 'unpublished.txt'), 'must remain local\n');
  const result = publish(retry, 'changed', sourceCommit, messagePath);
  assert.equal(result.action, 'already-tagged');
  assert.equal(remoteRef(remote, 'refs/heads/main'), before);
  assert.equal(
    run('git', ['-C', retry, 'status', '--porcelain']).stdout.trim(),
    '?? unpublished.txt'
  );
});

test('publish skips both commits and tags for no-change', () => {
  const directory = makeTempDirectory('release-publish-no-change');
  const { remote, base } = seedRemote(directory);
  const target = cloneRemote(remote, path.join(directory, 'target'));
  const result = publish(target, 'no-change', '1'.repeat(40));
  assert.equal(result.action, 'skipped-no-change');
  assert.equal(remoteRef(remote, 'refs/heads/main'), base);
  assert.equal(remoteHasRef(remote, 'refs/tags/v1.1.0'), false);
});

test('publish never force-pushes and propagates a non-fast-forward failure', () => {
  const directory = makeTempDirectory('release-publish-no-force');
  const { remote } = seedRemote(directory);
  const stale = cloneRemote(remote, path.join(directory, 'stale'));
  const advance = cloneRemote(remote, path.join(directory, 'advance'));
  commitFile(advance, 'remote.txt', 'remote advance\n', 'fix: remote advance');
  run('git', ['-C', advance, 'push', 'origin', 'main']);
  const remoteHead = remoteRef(remote, 'refs/heads/main');

  const sourceCommit = '2'.repeat(40);
  const messagePath = path.join(directory, 'message.txt');
  write(messagePath, 'chore(release): sync v1.1.0\n');
  write(path.join(stale, 'generated.txt'), 'generated\n');
  writeReleaseMetadata(stale, sourceCommit);
  const failed = spawnSync(
    process.execPath,
    publishArgs(stale, 'changed', sourceCommit, messagePath),
    { cwd: repositoryRoot, encoding: 'utf8' }
  );
  assert.notEqual(failed.status, 0);
  assert.match(failed.stderr, /git push origin HEAD:main failed/);
  assert.equal(remoteRef(remote, 'refs/heads/main'), remoteHead);
  assert.equal(remoteHasRef(remote, 'refs/tags/v1.1.0'), false);
});

test('workflow uses the tested publisher and immutable action pins', () => {
  const workflow = fs.readFileSync(
    path.join(repositoryRoot, '.github/workflows/publish-releases.yml'),
    'utf8'
  );
  assert.doesNotMatch(workflow, /workflow_dispatch|release:\s*\n/);
  assert.match(workflow, /steps\.plan\.outputs\.publish_needed == 'true'/);
  assert.match(
    workflow,
    /actions\/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4\.4\.0/
  );
  assert.match(
    workflow,
    /pnpm\/action-setup@fc06bc1257f339d1d5d8b3a19a8cae5388b55320 # v4\.4\.0/
  );
  assert.match(
    workflow,
    /actions\/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4\.4\.0/
  );
  assert.equal(
    workflow.match(/node scripts\/release\/publish-release\.mjs/g)?.length,
    2
  );
  const releaseTest = workflow.indexOf(
    'node --test scripts/release/release-automation.test.mjs'
  );
  const generation = workflow.indexOf(
    'Generate both editions in temporary directories'
  );
  assert.ok(releaseTest !== -1 && releaseTest < generation);
  assert.doesNotMatch(workflow, /git\s+(?:-C\s+[^\s]+\s+)?push/);
});
