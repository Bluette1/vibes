const globals = require('globals');

module.exports = [
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        myCustomGlobal: 'readonly', // Example of a custom global
      },
    },
    rules: {
      semi: ['warn', 'always'],
    },
  },
];
