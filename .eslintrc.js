module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2017,
  },
  plugins: ['prettier'],
  extends: ['eslint:recommended', 'prettier', 'plugin:prettier/recommended'],
  env: {
    es6: true,
    node: true,
    mocha: true,
  },
  rules: {
    radix: 'error',
    'no-unneeded-ternary': ['error', { defaultAssignment: false }],
    'no-restricted-globals': [
      'error',
      {
        name: 'isFinite',
        message: 'Use Number.isFinite instead https://github.com/airbnb/javascript#standard-library--isfinite',
      },
      {
        name: 'isNaN',
        message: 'Use Number.isNaN instead https://github.com/airbnb/javascript#standard-library--isnan',
      },
    ],
    'no-lonely-if': 'error',
    'no-throw-literal': 'error',
    'dot-notation': ['error', { allowKeywords: true }],
    'no-else-return': ['error', { allowElseIf: false }],
    'no-multi-assign': ['error'],
    'no-shadow': 'error',
    'no-param-reassign': [
      'error',
      {
        props: true,
        ignorePropertyModificationsFor: [
          'acc', // for reduce accumulators
          'accumulator', // for reduce accumulators
          'e', // for e.returnvalue
        ],
      },
    ],
    'no-extra-bind': 'error',
    'no-unused-expressions': [
      'error',
      {
        allowShortCircuit: false,
        allowTernary: false,
        allowTaggedTemplates: false,
      },
    ],
    'one-var': ['error', 'never'],
    'no-var': 'error',
    'prefer-const': [
      'error',
      {
        destructuring: 'any',
        ignoreReadBeforeAssign: false,
      },
    ],
    'no-use-before-define': ['error', { functions: false, classes: false, variables: true }],
    'prefer-arrow-callback': ['error', { allowNamedFunctions: true }],
  },
};
