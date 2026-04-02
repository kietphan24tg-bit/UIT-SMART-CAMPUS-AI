module.exports = {
  extends: ['@smart-campus/eslint-config/nestjs'],
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  root: true,
};
