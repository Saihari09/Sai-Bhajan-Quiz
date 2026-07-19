import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist',
    '.claude',
    // Legacy V1 files kept only for the /archive route — predate current rules
    'src/pages/RevealPage.tsx',
    'src/components/SupportModal.tsx',
    'src/components/game/AudioPlayer.tsx',
    'src/components/game/WordBank.tsx',
    'src/components/InstallBanner.tsx',
    'src/hooks/useTimer.ts',
    'src/hooks/useAudio.ts',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
])
