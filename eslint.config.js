import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'

export default defineConfig([
  {
    name: 'app/files-to-lint',
    files: ['**/*.{js,mjs,jsx,vue}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],

  {
    // 后台组件放在 components/admin 下，目录本身已经限定了语境，
    // 再强制文件名带多个单词只会让 import 又长又难读
    files: ['src/components/admin/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
])
