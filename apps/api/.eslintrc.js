module.exports = {
  extends: ['@smart-campus/eslint-config/nestjs'],
  parserOptions: {
    project: 'tsconfig.eslint.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  env: {
    node: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  root: true,
};
