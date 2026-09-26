const js = require('@eslint/js')
const globals = require('globals')

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      sourceType: 'commonjs', // require/module.exports 문법으로 해석
      globals: globals.node, // process, __dirname 등 Node 전역 인식
    },
  },
  { ignores: ['node_modules/', 'uploads/'] },
]
