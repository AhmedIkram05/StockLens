module.exports = function (api) {
  api.cache(true);

  // Configure module resolver for path aliases
  // This allows using '@' to refer to the 'src' directory
  // in import statements throughout the project
  // Example: import MyComponent from '@/components/MyComponent';
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
          alias: {
            '@': './src'
          }
        }
      ]
    ]
  };
};
