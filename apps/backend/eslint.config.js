import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: globals.node, // require, process 등 Node 전역 인식
    },
  },
  {
    ignores: ['dist/', 'node_modules/'],
  },
)
