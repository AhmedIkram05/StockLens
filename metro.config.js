const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Force Metro to use Node.js file watcher instead of Watchman
config.watchFolders = [];

module.exports = config;