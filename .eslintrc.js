module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'eslint-config-prettier', // Add this to disable ESLint rules that conflict with Prettier
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'node_modules'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh', 'react'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'react/prop-types': 'off', // Not needed with TypeScript
    'react/react-in-jsx-scope': 'off', // Not needed with new React JSX transform
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ], // Warn for unused variables, ignore those starting with _
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
