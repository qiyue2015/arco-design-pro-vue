import fs from 'node:fs';
import path from 'node:path';
import environmentFiles from '../environment-files.js';

const { ENV_EXAMPLE, isEnvironmentFileName } = environmentFiles;

const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/;
const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

export function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      throw new Error(`Unexpected argument: ${token}`);
    }

    const key = token.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) {
      args[key] = true;
      continue;
    }

    args[key] = value;
    index += 1;
  }

  return args;
}

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export function assertSafeRelativePath(value, label) {
  if (
    typeof value !== 'string' ||
    !value ||
    value.includes('\\') ||
    path.isAbsolute(value) ||
    value === '.' ||
    value.split('/').includes('..') ||
    value === '.git' ||
    value.startsWith('.git/')
  ) {
    throw new Error(
      `${label} must be a safe repository-relative path: ${value}`
    );
  }
}

export function assertReleaseVersion(value, label = 'release version') {
  if (!SEMVER_PATTERN.test(value || '')) {
    throw new Error(`Invalid ${label}: ${value}`);
  }
}

export function loadReleaseConfig(
  configPath = path.resolve('release-version.json')
) {
  const resolvedPath = path.resolve(configPath);
  const config = readJson(resolvedPath);

  if (config.schemaVersion !== 1) {
    throw new Error('release-version.json schemaVersion must be 1');
  }
  assertReleaseVersion(config.version);
  if (!REPOSITORY_PATTERN.test(config.sourceRepository)) {
    throw new Error(`Invalid source repository: ${config.sourceRepository}`);
  }

  const editionNames = Object.keys(config.editions || {}).sort();
  if (editionNames.join(',') !== 'full,simple') {
    throw new Error(
      'release-version.json must define full and simple editions'
    );
  }

  const repositories = new Set();
  editionNames.forEach((editionName) => {
    const edition = config.editions[editionName];
    if (!REPOSITORY_PATTERN.test(edition.repository)) {
      throw new Error(
        `Invalid ${editionName} repository: ${edition.repository}`
      );
    }
    if (repositories.has(edition.repository)) {
      throw new Error(
        `Release repositories must be unique: ${edition.repository}`
      );
    }
    repositories.add(edition.repository);

    if (!Array.isArray(edition.managedRoots) || !edition.managedRoots.length) {
      throw new Error(`${editionName}.managedRoots must not be empty`);
    }
    if (!Array.isArray(edition.preservePaths)) {
      throw new Error(`${editionName}.preservePaths must be an array`);
    }

    edition.managedRoots.forEach((entry) =>
      assertSafeRelativePath(entry, `${editionName}.managedRoots`)
    );
    edition.preservePaths.forEach((entry) =>
      assertSafeRelativePath(entry, `${editionName}.preservePaths`)
    );
  });

  return { config, configPath: resolvedPath };
}

export function appendGitHubOutput(filePath, values) {
  if (!filePath) return;
  const lines = Object.entries(values).map(([key, value]) => `${key}=${value}`);
  fs.appendFileSync(filePath, `${lines.join('\n')}\n`);
}

export function assertSourceCommit(value) {
  if (!/^[0-9a-f]{40}$/i.test(value || '')) {
    throw new Error(`Source commit must be a full 40-character SHA: ${value}`);
  }
}

export function findUnexpectedGeneratedEnvironmentFiles(directory) {
  const resolvedDirectory = path.resolve(directory);
  if (!fs.existsSync(resolvedDirectory)) {
    throw new Error(`Generated directory does not exist: ${resolvedDirectory}`);
  }
  if (!fs.statSync(resolvedDirectory).isDirectory()) {
    throw new Error(`Generated path must be a directory: ${resolvedDirectory}`);
  }

  return fs
    .readdirSync(resolvedDirectory, { withFileTypes: true })
    .filter(
      (entry) =>
        isEnvironmentFileName(entry.name) &&
        (entry.name !== ENV_EXAMPLE || !entry.isFile())
    )
    .map((entry) => entry.name)
    .sort();
}

export function assertGeneratedEnvironmentFiles(directory) {
  const unexpectedFiles = findUnexpectedGeneratedEnvironmentFiles(directory);
  if (unexpectedFiles.length) {
    throw new Error(
      `Unexpected generated environment files: ${unexpectedFiles.join(', ')}`
    );
  }
}
