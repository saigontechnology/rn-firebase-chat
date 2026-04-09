const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');
const libraryRoot = path.resolve(monorepoRoot, 'packages', 'rn-firebase-chat');

const config = getDefaultConfig(projectRoot);

// Allow Metro to resolve packages from the root node_modules (pnpm workspace)
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
  path.resolve(libraryRoot, 'node_modules'),
];

// Watch the monorepo root so Metro can resolve hoisted + symlinked packages,
// and the library root for its source/lib files.
config.watchFolders = [monorepoRoot, libraryRoot];

module.exports = config;
