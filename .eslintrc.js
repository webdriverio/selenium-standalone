module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2019,
  },
  plugins: ['prettier'],
  extends: ['eslint:recommended', 'prettier', 'plugin:prettier/recommended'],
  env: {
    node: true,
    mocha: true,
  },
  rules: {},
};
