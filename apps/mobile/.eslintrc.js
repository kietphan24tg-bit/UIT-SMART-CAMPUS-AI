module.exports = {
  extends: ['@smart-campus/eslint-config/react-native'],
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  root: true,
};
