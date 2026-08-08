import fs from 'node:fs';
import path from 'node:path';
import { loadReleaseConfig, parseArgs, writeJson } from './lib.mjs';

const args = parseArgs(process.argv.slice(2));
if (typeof args.directory !== 'string') {
  throw new Error('--directory is required');
}

const { config } = loadReleaseConfig(args.config);
const packagePath = path.resolve(args.directory, 'package.json');
if (!fs.existsSync(packagePath)) {
  throw new Error(`Generated package.json not found: ${packagePath}`);
}

const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
packageJson.version = config.version;
writeJson(packagePath, packageJson);
process.stdout.write(`Stamped ${packagePath} with version ${config.version}\n`);
