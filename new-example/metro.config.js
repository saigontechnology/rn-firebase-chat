const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const libraryRoot = path.resolve(projectRoot, '..');
const librarySrc = path.join(libraryRoot, 'src');

const config = getDefaultConfig(projectRoot);

// Watch the library root so Metro picks up live changes from src/
config.watchFolders = [libraryRoot];

// Pin react/react-native to this app so the library never resolves a
// second copy (duplicate RN breaks TurboModules).
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Redirect 'rn-firebase-chat' → live source at ../src/index.ts
  // so changes are picked up instantly without rebuilding.
  if (moduleName === 'rn-firebase-chat') {
    return context.resolveRequest(context, librarySrc, platform);
  }

  // Redirect deep imports like 'rn-firebase-chat/src/addons/camera'
  // to the live source as well.
  if (moduleName.startsWith('rn-firebase-chat/')) {
    const subpath = moduleName.replace('rn-firebase-chat/', '');
    const resolved = path.join(libraryRoot, subpath);
    return context.resolveRequest(context, resolved, platform);
  }

  // When a file inside the library imports a third-party package,
  // resolve it from new-example's node_modules to avoid duplicates.
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
