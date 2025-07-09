/**
 * eslint.config.mjs  –  flat-config dùng cho Next.js 13/14/15
 * Mục tiêu: vẫn giữ lint, nhưng tất cả lỗi “any, unused-var, …”
 *            chỉ hiển thị ⚠ cảnh báo, KHÔNG chặn build.
 */

import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

/* Hỗ trợ dùng cấu hình dạng .eslintrc trong môi trường flat-config */
const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  /* 1️⃣  Cấu hình gốc của Next.js + TypeScript */
  ...compat.extends('next/core-web-vitals', 'next/typescript'),

  /* 2️⃣  Hạ rule xuống warn cho MỌI file .ts, .tsx, .js, .jsx */
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },     // cho phép const _req
      ],
      '@typescript-eslint/no-unused-expressions': 'off',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];
