'use strict';

module.exports = {
  rules: {
    blur: require('./rules/blur.js'),
  },
  configs: {
    recommended: {
      plugins: ['tailwind-blur-safari'],
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      rules: {
        'tailwind-blur-safari/blur': 'warn',
      },
    },
  },
};
