import path from 'node:path';
import { assertGeneratedEnvironmentFiles, parseArgs } from './lib.mjs';

const args = parseArgs(process.argv.slice(2));
if (typeof args.directory !== 'string') {
  throw new Error('--directory is required');
}

const directory = path.resolve(args.directory);
assertGeneratedEnvironmentFiles(directory);
process.stdout.write(
  `${JSON.stringify({ directory, valid: true }, null, 2)}\n`
);
