// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
    settings: {
      // Allow import resolver to pick up ESM entry points (.mjs/.mts) used by some deps.
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.d.ts', '.mjs', '.mts', '.cjs', '.cts'],
        },
      },
    },
  },
]);
