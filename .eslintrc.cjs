/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: [
    'next',                              // đủ plugin Next
    'plugin:@typescript-eslint/recommended',
  ],

  /* ----- QUY TẮC MẶC ĐỊNH ----- */
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_' },       // cho phép const _req
    ],
    '@typescript-eslint/no-unused-expressions': 'off',
    'react-hooks/exhaustive-deps': 'warn',
  },

  /* ----- ĐÈ CHO THƯ MỤC API ----- */
  overrides: [
    {
      files: [
        'src/app/api/**/*.{js,jsx,ts,tsx}',
        'src/pages/api/**/*.{js,jsx,ts,tsx}',
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': [
          'warn',
          { argsIgnorePattern: '^_' },
        ],
      },
    },
  ],
};
