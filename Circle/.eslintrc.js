module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-native/all',
    'prettier'
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  env: {
    'react-native/react-native': true,
    jest: true
  },
  plugins: ['react', 'react-native', 'prettier'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react-native/no-inline-styles': 'warn',
    'react-native/no-color-literals': 'warn',
    'react-native/no-raw-text': ['warn', { skip: ['Text'] }],
    'react-native/no-unused-styles': 'warn',
    'react-native/split-platform-components': 'warn',
    'react-native/no-single-element-style-arrays': 'warn',
    'react-native/sort-styles': 'off',
    'no-unused-vars': ['warn', { varsIgnorePattern: '^React$' }]
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
}; 