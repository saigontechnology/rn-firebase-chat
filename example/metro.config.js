const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const libraryRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch the library root so Metro can serve files from lib/commonjs/
config.watchFolders = [libraryRoot];

// When a file inside the library imports a package, resolve it from
// example's node_modules instead of the library's node_modules.
// This prevents react-native version mismatches.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const fromLibrary =
    context.originModulePath.startsWith(libraryRoot + path.sep) &&
    !context.originModulePath.startsWith(projectRoot + path.sep);

  if (fromLibrary && !moduleName.startsWith('.')) {
    return context.resolveRequest(
      { ...context, originModulePath: path.resolve(projectRoot, 'index.ts') },
      moduleName,
      platform
    );
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
