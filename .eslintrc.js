module.exports = {
  env: {
    browser: true,
    node: true,
    'react-native/react-native': true
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-native/all',
    '@react-native-community',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  plugins: [
    'react',
    'react-native',
    '@typescript-eslint'
  ],
  globals: {
    Float32Array: 'readonly',
    Uint16Array: 'readonly',
    URLSearchParams: 'readonly',
    Image: 'readonly',
    document: 'readonly',
    CustomEvent: 'readonly',
    RTCPeerConnection: 'readonly',
    RTCSessionDescription: 'readonly',
    RTCIceCandidate: 'readonly',
    io: 'readonly',
    Linking: 'readonly',
    faceKey: 'writable',
    setRecordingStartTime: 'writable',
    setRecordingTimer: 'writable',
    renderErrorDetails: 'writable',
    isSharingLocation: 'writable'
  },
  rules: {
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^React$'
    }],
    'no-console': ['error', { allow: ['warn', 'error'] }],
    'react/prop-types': 'off',
    'react/display-name': 'off',
    'react-native/no-color-literals': 'error',
    'react-native/no-inline-styles': 'error',
    'react-native/no-unused-styles': 'error',
    'react-native/split-platform-components': 'error',
    'react-native/no-raw-text': 'off',
    'react-native/no-single-element-style-arrays': 'error',
    'import/no-unresolved': 'off',
    'import/extensions': 'off'
  },
  overrides: [
    {
      files: ['*.js', '*.jsx'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        'no-unused-vars': ['error', {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^React$'
        }]
      }
    }
  ]
};