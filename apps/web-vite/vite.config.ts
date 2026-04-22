import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import type { Plugin } from 'vite';

// Intercept any import that should not exist in a web bundle.
// The rn-firebase-chat package includes camera addon files (in web/addons/camera/)
// that still import react-native and @react-native-firebase/*. Those files are not
// part of the exported /web entry point, but Vite's dep-scanner still follows them.
// Returning an empty module for these IDs prevents build failures.
function reactNativeStubPlugin(): Plugin {
  const STUB_PATTERNS = [
    /^react-native($|\/)/,
    /^@react-native-firebase\//,
    /^react-native-vision-camera/,
    /^react-native-image-picker/,
    /^react-native-aes-crypto/,
  ];

  return {
    name: 'react-native-web-stub',
    enforce: 'pre',
    resolveId(id) {
      if (STUB_PATTERNS.some((p) => p.test(id))) {
        // syntheticNamedExports: '__esModule' makes Rollup use the default export
        // as the source for any named imports (import { Foo } from '...').
        return { id: `\0rn-stub:${id}`, syntheticNamedExports: '__esModule' };
      }
      return null;
    },
    load(id) {
      if (id.startsWith('\0rn-stub:')) {
        // Provide a default export (satisfies `import Foo from '...'`) and
        // __esModule (used by syntheticNamedExports to resolve named imports).
        return `export default {}; export const __esModule = {};`;
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [react(), reactNativeStubPlugin()],
  resolve: {
    alias: {
      // Absolute paths are required — relative strings are not resolved by Vite in dev mode.
      'rn-firebase-chat/web': resolve(__dirname, '../../packages/rn-firebase-chat/lib/module/web.js'),
      'rn-firebase-chat/styles': resolve(__dirname, '../../packages/rn-firebase-chat/lib/styles.css'),
      'rn-firebase-chat': resolve(__dirname, '../../packages/rn-firebase-chat/lib/module/index.js'),
    },
  },
});
