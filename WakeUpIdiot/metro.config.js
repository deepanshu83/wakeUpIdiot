// https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

/**
 * Fix: expo-notifications depends on @ide/backoff which depends on the
 * `assert` npm package. That package's build/assert.js tries to import
 * `./internal/errors` which Metro can't resolve when package exports are
 * enabled. Disabling unstable_enablePackageExports forces Metro to use the
 * classic module resolution that finds the correct file.
 */
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
