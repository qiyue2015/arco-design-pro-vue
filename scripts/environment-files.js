const path = require('path');

const ENV_EXAMPLE = '.env.example';

function isEnvironmentFileName(name) {
  return name === '.env' || name.startsWith('.env.');
}

function isRootEnvironmentPath(relativePath) {
  return (
    path.dirname(relativePath) === '.' &&
    isEnvironmentFileName(path.basename(relativePath))
  );
}

function shouldCopyTemplatePath(relativePath) {
  return (
    !isRootEnvironmentPath(relativePath) ||
    path.basename(relativePath) === ENV_EXAMPLE
  );
}

module.exports = {
  ENV_EXAMPLE,
  isEnvironmentFileName,
  isRootEnvironmentPath,
  shouldCopyTemplatePath,
};
