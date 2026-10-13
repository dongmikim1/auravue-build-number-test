import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { getBuildNumber, verifyProductionBuildNumber } from './scripts/build-version.ts'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))
const productVersion = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version
const buildNumber = getBuildNumber(projectRoot)

export default defineConfig({
  base: './',
  define: {
    'import.meta.env.VITE_BUILD_NUMBER': JSON.stringify(buildNumber),
    'import.meta.env.VITE_PRODUCT_VERSION': JSON.stringify(productVersion),
  },
  plugins: [{
    name: 'verify-build-number',
    config(_, { command, mode }) {
      if (command === 'build' && mode === 'production') {
        verifyProductionBuildNumber(projectRoot, buildNumber)
      }
    },
  }],
})
