const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add this configuration
config.resolver.assetExts.push(
  // Adds support for `.web.jsx` files
  'web.jsx'
);

module.exports = config;
