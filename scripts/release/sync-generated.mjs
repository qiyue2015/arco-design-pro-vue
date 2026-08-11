import fs from 'node:fs';
import path from 'node:path';
import {
  appendGitHubOutput,
  assertGeneratedEnvironmentFiles,
  assertSafeRelativePath,
  assertSourceCommit,
  loadReleaseConfig,
  parseArgs,
  readJson,
  writeJson,
} from './lib.mjs';

const EXCLUDED_SEGMENTS = new Set([
  '.git',
  '.nuxt',
  '.tmp',
  'dist',
  'node_modules',
  'temp',
  'tmp',
]);
const EXCLUDED_FILES = new Set([
  '.DS_Store',
  '.eslintcache',
  '.release-manifest.json',
  '.release-source.json',
  '.stylelintcache',
]);

const args = parseArgs(process.argv.slice(2));
['generated', 'target', 'edition', 'source-commit', 'metadata'].forEach(
  (name) => {
    if (typeof args[name] !== 'string')
      throw new Error(`--${name} is required`);
  }
);

const { config } = loadReleaseConfig(args.config);
const edition = config.editions[args.edition];
if (!edition) throw new Error(`Unknown edition: ${args.edition}`);

const sourceCommit = args['source-commit'].toLowerCase();
assertSourceCommit(sourceCommit);
const generatedRoot = path.resolve(args.generated);
const targetRoot = path.resolve(args.target);
if (generatedRoot === targetRoot)
  throw new Error('Generated and target paths must differ');
if (
  !fs.existsSync(generatedRoot) ||
  !fs.statSync(generatedRoot).isDirectory() ||
  !fs.existsSync(path.join(generatedRoot, 'package.json'))
) {
  throw new Error(
    `Generated directory must contain package.json: ${generatedRoot}`
  );
}
assertGeneratedEnvironmentFiles(generatedRoot);
if (!fs.existsSync(path.join(targetRoot, '.git'))) {
  throw new Error(`Target is not a Git checkout: ${targetRoot}`);
}

const releaseMetadata = readJson(path.resolve(args.metadata));
if (
  releaseMetadata.schemaVersion !== 1 ||
  releaseMetadata.version !== config.version ||
  releaseMetadata.sourceRepository !== config.sourceRepository ||
  releaseMetadata.sourceCommit.toLowerCase() !== sourceCommit
) {
  throw new Error('Release metadata does not match the requested release');
}

function normalizeRelativePath(value) {
  return value.split(path.sep).join('/');
}

function isExcluded(relativePath) {
  const segments = relativePath.split('/');
  const basename = segments.at(-1);
  return (
    segments.some((segment) => EXCLUDED_SEGMENTS.has(segment)) ||
    segments.some((segment) => EXCLUDED_FILES.has(segment)) ||
    basename.endsWith('.tmp') ||
    basename.endsWith('~')
  );
}

function isPreserved(relativePath) {
  return edition.preservePaths.some(
    (entry) => relativePath === entry || relativePath.startsWith(`${entry}/`)
  );
}

function walkFiles(rootPath, relativeRoot = '') {
  const absoluteRoot = path.join(rootPath, relativeRoot);
  if (!fs.existsSync(absoluteRoot)) return [];

  const files = [];
  fs.readdirSync(absoluteRoot, { withFileTypes: true }).forEach((entry) => {
    const relativePath = normalizeRelativePath(
      path.join(relativeRoot, entry.name)
    );
    if (isExcluded(relativePath)) return;
    if (entry.isSymbolicLink()) {
      throw new Error(`Symbolic links are not supported: ${relativePath}`);
    }
    if (entry.isDirectory()) {
      files.push(...walkFiles(rootPath, relativePath));
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  });
  return files;
}

function filesEqual(firstPath, secondPath) {
  if (!fs.existsSync(secondPath) || !fs.statSync(secondPath).isFile())
    return false;
  const firstMode = fs.statSync(firstPath).mode & 0o111;
  const secondMode = fs.statSync(secondPath).mode & 0o111;
  if (firstMode !== secondMode) return false;
  const first = fs.readFileSync(firstPath);
  const second = fs.readFileSync(secondPath);
  return first.equals(second);
}

function assertNoSymlinkPath(rootPath, relativePath) {
  let currentPath = rootPath;
  relativePath.split('/').forEach((segment) => {
    currentPath = path.join(currentPath, segment);
    const stats = fs.lstatSync(currentPath, { throwIfNoEntry: false });
    if (stats?.isSymbolicLink()) {
      throw new Error(
        `Refusing to follow target symbolic link: ${relativePath}`
      );
    }
  });
}

const generatedFiles = walkFiles(generatedRoot)
  .filter((entry) => !isPreserved(entry))
  .sort();
const generatedSet = new Set(generatedFiles);
const manifestPath = path.join(targetRoot, '.release-manifest.json');
let deletionCandidates = [];

if (fs.existsSync(manifestPath)) {
  const previousManifest = readJson(manifestPath);
  if (
    previousManifest.schemaVersion !== 1 ||
    previousManifest.edition !== args.edition ||
    !Array.isArray(previousManifest.files)
  ) {
    throw new Error(`Invalid release manifest: ${manifestPath}`);
  }
  previousManifest.files.forEach((entry) =>
    assertSafeRelativePath(entry, 'release manifest file')
  );
  deletionCandidates = previousManifest.files.filter(
    (entry) => !generatedSet.has(entry) && !isPreserved(entry)
  );
} else {
  deletionCandidates = edition.managedRoots.flatMap((managedRoot) =>
    walkFiles(targetRoot, managedRoot).filter(
      (entry) => !generatedSet.has(entry) && !isPreserved(entry)
    )
  );
}

deletionCandidates = [...new Set(deletionCandidates)].sort();
generatedFiles.forEach((entry) => assertNoSymlinkPath(targetRoot, entry));
deletionCandidates.forEach((entry) => assertNoSymlinkPath(targetRoot, entry));
assertNoSymlinkPath(targetRoot, '.release-manifest.json');
assertNoSymlinkPath(targetRoot, '.release-source.json');
const copyCandidates = generatedFiles.filter(
  (entry) =>
    !filesEqual(path.join(generatedRoot, entry), path.join(targetRoot, entry))
);
const contentChanged =
  deletionCandidates.length > 0 || copyCandidates.length > 0;
const currentMetadataPath = path.join(targetRoot, '.release-source.json');
let alreadyApplied = false;

if (fs.existsSync(currentMetadataPath)) {
  const currentMetadata = readJson(currentMetadataPath);
  alreadyApplied =
    currentMetadata.version === config.version &&
    currentMetadata.sourceRepository === config.sourceRepository &&
    currentMetadata.sourceCommit?.toLowerCase() === sourceCommit;
}

if (contentChanged) {
  deletionCandidates.forEach((entry) => {
    fs.rmSync(path.join(targetRoot, entry), { force: true, recursive: true });
  });
  copyCandidates.forEach((entry) => {
    const sourcePath = path.join(generatedRoot, entry);
    const destinationPath = path.join(targetRoot, entry);
    if (
      fs.existsSync(destinationPath) &&
      !fs.statSync(destinationPath).isFile()
    ) {
      fs.rmSync(destinationPath, { force: true, recursive: true });
    }
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
    fs.copyFileSync(sourcePath, destinationPath);
    fs.chmodSync(destinationPath, fs.statSync(sourcePath).mode);
  });

  writeJson(manifestPath, {
    schemaVersion: 1,
    edition: args.edition,
    files: generatedFiles,
  });
  writeJson(currentMetadataPath, releaseMetadata);
}

const status = contentChanged
  ? 'changed'
  : alreadyApplied
  ? 'already-applied'
  : 'no-change';
const result = {
  edition: args.edition,
  status,
  changed: contentChanged,
  alreadyApplied,
  copied: copyCandidates,
  deleted: deletionCandidates,
};

appendGitHubOutput(args['github-output'], {
  status,
  changed: contentChanged,
  already_applied: alreadyApplied,
});
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
