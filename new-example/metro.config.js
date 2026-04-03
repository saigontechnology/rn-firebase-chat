const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const libraryRoot = path.resolve(projectRoot, '..');
const linkedLibraryPackage = path.join(
  projectRoot,
  'node_modules',
  'rn-firebase-chat'
);

const config = getDefaultConfig(projectRoot);

// Watch the library root so Metro can serve files from lib/
config.watchFolders = [libraryRoot];

// Pin react/react-native to this app so the linked package never resolves a
// second copy from the monorepo root (duplicate RN breaks TurboModules).
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
};

// When a file inside the library imports a package, resolve it from
// new-example's node_modules instead of the library's node_modules.
// This prevents react-native version mismatches (e.g. duplicate React).
// Paths under node_modules/rn-firebase-chat must count as "library" too: the
// real path is under libraryRoot, but originModulePath is often the symlink
// under projectRoot, which made fromLibrary false and duplicated react-native.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const fromLinkedPackage =
    context.originModulePath.startsWith(linkedLibraryPackage + path.sep);
  const fromLibraryRealPath =
    context.originModulePath.startsWith(libraryRoot + path.sep) &&
    !context.originModulePath.startsWith(projectRoot + path.sep);
  const fromLibrary = fromLibraryRealPath || fromLinkedPackage;

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
